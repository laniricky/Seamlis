package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.datetime

object Videos : UUIDTable("videos") {
    val title = varchar("title", 255)
    val description = text("description").nullable()

    // Status can be: UPLOADING, PROCESSING, READY, FAILED
    val status = varchar("status", 50)

    // S3/MinIO Object Keys
    val originalVideoKey = varchar("original_video_key", 512).nullable()
    val processedVideoKey = varchar("processed_video_key", 512).nullable()
    val thumbnailUrl = varchar("thumbnail_url", 512).nullable()

    val isShort = bool("is_short").default(false)

    val viewCount = long("view_count").default(0L)
    val likeCount = integer("like_count").default(0)
    val dislikeCount = integer("dislike_count").default(0)
    val commentCount = integer("comment_count").default(0)

    // Foreign Keys
    val uploaderId = reference("uploader_id", Users, onDelete = ReferenceOption.CASCADE)

    // Timestamps
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
}
