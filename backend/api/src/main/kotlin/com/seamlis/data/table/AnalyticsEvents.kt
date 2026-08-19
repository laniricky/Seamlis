package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.datetime

object AnalyticsEvents : UUIDTable("analytics_events") {
    val eventName = varchar("event_name", 100)
    val userId = reference("user_id", Users, onDelete = ReferenceOption.SET_NULL).nullable()
    val sessionId = varchar("session_id", 100).nullable()
    val videoId = reference("video_id", Videos, onDelete = ReferenceOption.CASCADE)
    // Stored as JSON string; no Exposed jsonb needed at this stage
    val properties = text("properties").nullable()
    val createdAt = datetime("created_at")
}

