package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.timestamp

object VideoLikes : UUIDTable("video_likes") {
    val videoId = reference("video_id", Videos, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val isLike = bool("is_like")
    val createdAt = timestamp("created_at")

    init {
        uniqueIndex(videoId, userId)
    }
}
