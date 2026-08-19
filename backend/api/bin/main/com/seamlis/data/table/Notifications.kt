package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.timestamp

object Notifications : UUIDTable("notifications") {
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val actorId = reference("actor_id", Users, onDelete = ReferenceOption.SET_NULL).nullable()
    
    // Types: NEW_VIDEO, NEW_COMMENT, LIKE, SUBSCRIPTION, MENTION
    val type = varchar("type", 50)
    
    // Optional ID of the entity that triggered the notification (e.g., video ID)
    val entityId = varchar("entity_id", 255).nullable()
    
    val message = text("message").nullable()
    
    val isRead = bool("is_read").default(false)
    val createdAt = timestamp("created_at")
}
