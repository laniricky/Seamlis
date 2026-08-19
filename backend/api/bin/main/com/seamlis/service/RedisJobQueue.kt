package com.seamlis.service

import io.lettuce.core.RedisClient
import io.lettuce.core.api.StatefulRedisConnection
import io.lettuce.core.resource.DefaultClientResources
import kotlinx.coroutines.future.await
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class VideoProcessingJob(
    val jobId: String,
    val videoId: String,
    val rawStorageKey: String,
    val requestedAt: String, // ISO-8601 string representation of Instant
    val attempt: Int = 1,
)

const val QUEUE_VIDEO_PROCESSING = "queue:video:processing"
const val QUEUE_VIDEO_PROCESSING_DLQ = "queue:video:processing:dlq"

class RedisJobQueue(redisUrl: String) {
    private val resources = DefaultClientResources.create()
    private val client: RedisClient = RedisClient.create(resources, redisUrl)

    // Primary connection for commands (enqueue, general)
    private val connection: StatefulRedisConnection<String, String> = client.connect()
    private val asyncCommands = connection.async()

    // Separate dedicated connection for blocking BRPOP — must not share with other commands
    private val blockingConnection: StatefulRedisConnection<String, String> = client.connect()
    private val blockingCommands = blockingConnection.async()

    suspend fun enqueue(
        queueName: String,
        job: VideoProcessingJob,
    ) {
        val payload = Json.encodeToString(job)
        asyncCommands.lpush(queueName, payload).await()
    }

    suspend fun dequeue(
        queueName: String,
        timeoutSeconds: Long = 5,
    ): VideoProcessingJob? {
        // BRPOP blocks until an element is available or timeout occurs.
        // It returns a KeyValue where key is the queueName and value is the payload.
        val result = blockingCommands.brpop(timeoutSeconds, queueName).await() ?: return null
        val payload = result.value
        return try {
            Json.decodeFromString<VideoProcessingJob>(payload)
        } catch (e: Exception) {
            println("Failed to parse job payload from $queueName: $payload")
            null
        }
    }

    fun close() {
        try {
            blockingConnection.close()
            connection.close()
            client.shutdown()
            resources.shutdown()
        } catch (e: Exception) {
            // ignore shutdown errors
        }
    }
}
