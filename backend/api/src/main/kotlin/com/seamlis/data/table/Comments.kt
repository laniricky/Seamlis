package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.timestamp

object Comments : UUIDTable("comments") {
    val videoId = reference("video_id", Videos, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val parentId = reference("parent_id", Comments, onDelete = ReferenceOption.CASCADE).nullable()
    val content = text("content")
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}
