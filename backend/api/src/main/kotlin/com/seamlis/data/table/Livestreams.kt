package com.seamlis.data.table

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

enum class LivestreamStatus {
    PENDING,
    LIVE,
    ENDED
}

object Livestreams : Table("livestreams") {
    val id = uuid("id")
    val channelId = uuid("channel_id").references(Users.id)
    val title = varchar("title", 255)
    val streamKey = varchar("stream_key", 255).uniqueIndex()
    val status = varchar("status", 50).default(LivestreamStatus.PENDING.name)
    val viewerCount = integer("viewer_count").default(0)
    val startedAt = timestamp("started_at").nullable()
    val endedAt = timestamp("ended_at").nullable()
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
