package com.seamlis.service

import com.seamlis.data.table.LiveChatMessages
import com.seamlis.data.table.LivestreamStatus
import com.seamlis.data.table.Livestreams
import io.ktor.websocket.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import redis.clients.jedis.JedisPubSub
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet
import kotlin.random.Random

@Serializable
data class LivestreamData(
    val id: String,
    val channelId: String,
    val title: String,
    val streamKey: String? = null, // only returned to owner
    val status: String,
    val viewerCount: Int
)

@Serializable
data class LiveChatMessageData(
    val id: String,
    val userId: String,
    val content: String,
    val createdAt: String
)

class LiveService(private val redisUrl: String) {

    // Map of StreamID -> Set of WebSocket Sessions
    private val activeConnections = ConcurrentHashMap<UUID, CopyOnWriteArraySet<WebSocketSession>>()

    init {
        // Run Redis subscriber in a background thread to listen for chat messages
        Thread {
            try {
                val jedis = redis.clients.jedis.Jedis(redisUrl)
                jedis.subscribe(object : JedisPubSub() {
                    override fun onMessage(channel: String?, message: String?) {
                        if (channel != null && message != null && channel.startsWith("chat:")) {
                            val streamId = UUID.fromString(channel.removePrefix("chat:"))
                            broadcastToStream(streamId, message)
                        }
                    }
                }, "chat:*")
            } catch (e: Exception) {
                e.printStackTrace() // Log redis subscriber errors
            }
        }.start()
    }

    private fun generateStreamKey(): String {
        val chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return "live_" + (1..32).map { chars[Random.nextInt(chars.length)] }.joinToString("")
    }

    fun createStream(channelId: UUID, title: String): LivestreamData {
        return transaction {
            // First, end any existing streams for this channel
            Livestreams.update({ Livestreams.channelId eq channelId }) {
                it[status] = LivestreamStatus.ENDED.name
            }

            val newId = UUID.randomUUID()
            val newKey = generateStreamKey()
            
            Livestreams.insert {
                it[id] = newId
                it[Livestreams.channelId] = channelId
                it[Livestreams.title] = title
                it[streamKey] = newKey
                it[status] = LivestreamStatus.PENDING.name
                it[createdAt] = Instant.now()
            }
            
            LivestreamData(
                id = newId.toString(),
                channelId = channelId.toString(),
                title = title,
                streamKey = newKey,
                status = LivestreamStatus.PENDING.name,
                viewerCount = 0
            )
        }
    }

    fun getStream(streamId: UUID): LivestreamData? {
        return transaction {
            Livestreams.selectAll().where { Livestreams.id eq streamId }
                .map {
                    LivestreamData(
                        id = it[Livestreams.id].toString(),
                        channelId = it[Livestreams.channelId].toString(),
                        title = it[Livestreams.title],
                        status = it[Livestreams.status],
                        viewerCount = it[Livestreams.viewerCount]
                    )
                }.singleOrNull()
        }
    }
    
    fun getActiveStreamForChannel(channelId: UUID): LivestreamData? {
        return transaction {
            Livestreams.selectAll().where { (Livestreams.channelId eq channelId) and (Livestreams.status neq LivestreamStatus.ENDED.name) }
                .orderBy(Livestreams.createdAt to SortOrder.DESC)
                .limit(1)
                .map {
                    LivestreamData(
                        id = it[Livestreams.id].toString(),
                        channelId = it[Livestreams.channelId].toString(),
                        title = it[Livestreams.title],
                        streamKey = it[Livestreams.streamKey],
                        status = it[Livestreams.status],
                        viewerCount = it[Livestreams.viewerCount]
                    )
                }.singleOrNull()
        }
    }

    fun authenticateStreamKey(streamKey: String): Boolean {
        return transaction {
            val updated = Livestreams.update({ Livestreams.streamKey eq streamKey }) {
                it[status] = LivestreamStatus.LIVE.name
                it[startedAt] = Instant.now()
            }
            updated > 0
        }
    }

    fun endStreamByKey(streamKey: String) {
        transaction {
            Livestreams.update({ Livestreams.streamKey eq streamKey }) {
                it[status] = LivestreamStatus.ENDED.name
                it[endedAt] = Instant.now()
            }
        }
    }

    // --- WebSockets & Chat ---
    
    fun addConnection(streamId: UUID, session: WebSocketSession) {
        val set = activeConnections.computeIfAbsent(streamId) { CopyOnWriteArraySet() }
        set.add(session)
        
        transaction {
            Livestreams.update({ Livestreams.id eq streamId }) {
                with(SqlExpressionBuilder) {
                    it.update(viewerCount, viewerCount + 1)
                }
            }
        }
    }
    
    fun removeConnection(streamId: UUID, session: WebSocketSession) {
        activeConnections[streamId]?.remove(session)
        transaction {
            Livestreams.update({ Livestreams.id eq streamId }) {
                with(SqlExpressionBuilder) {
                    it.update(viewerCount, viewerCount - 1)
                }
            }
        }
    }

    fun saveAndBroadcastMessage(streamId: UUID, userId: UUID, content: String) {
        val newId = UUID.randomUUID()
        val now = Instant.now()
        
        transaction {
            LiveChatMessages.insert {
                it[id] = newId
                it[livestreamId] = streamId
                it[LiveChatMessages.userId] = userId
                it[LiveChatMessages.content] = content
                it[createdAt] = now
            }
        }
        
        val msgData = LiveChatMessageData(
            id = newId.toString(),
            userId = userId.toString(),
            content = content,
            createdAt = now.toString()
        )
        val jsonString = Json.encodeToString(msgData)
        
        // Publish to Redis
        try {
            val jedis = redis.clients.jedis.Jedis(redisUrl)
            jedis.publish("chat:$streamId", jsonString)
            jedis.close()
        } catch (e: Exception) {
            e.printStackTrace()
            // Fallback for local broadcast if Redis fails
            broadcastToStream(streamId, jsonString)
        }
    }
    
    fun getRecentMessages(streamId: UUID): List<LiveChatMessageData> {
        return transaction {
            LiveChatMessages.selectAll().where { LiveChatMessages.livestreamId eq streamId }
                .orderBy(LiveChatMessages.createdAt to SortOrder.DESC)
                .limit(50)
                .map {
                    LiveChatMessageData(
                        id = it[LiveChatMessages.id].toString(),
                        userId = it[LiveChatMessages.userId].toString(),
                        content = it[LiveChatMessages.content],
                        createdAt = it[LiveChatMessages.createdAt].toString()
                    )
                }.reversed()
        }
    }

    private fun broadcastToStream(streamId: UUID, messageJson: String) {
        val sessions = activeConnections[streamId] ?: return
        for (session in sessions) {
            GlobalScope.launch {
                try {
                    session.send(Frame.Text(messageJson))
                } catch (e: Exception) {
                    // Ignore closed channels
                }
            }
        }
    }
}
