package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.timestamp

object WatchHistory : UUIDTable("watch_history") {
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val videoId = reference("video_id", Videos, onDelete = ReferenceOption.CASCADE)
    val watchedAt = timestamp("watched_at")

    init {
        uniqueIndex(userId, videoId)
    }
}
