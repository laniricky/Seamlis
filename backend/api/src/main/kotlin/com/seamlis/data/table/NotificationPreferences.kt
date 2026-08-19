package com.seamlis.data.table

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object NotificationPreferences : Table("notification_preferences") {
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    
    // Delivery channels
    val emailEnabled = bool("email_enabled").default(true)
    val pushEnabled = bool("push_enabled").default(true)
    val inAppEnabled = bool("in_app_enabled").default(true)
    
    // Granular events
    val notifyNewVideo = bool("notify_new_video").default(true)
    val notifyComments = bool("notify_comments").default(true)
    val notifyLikes = bool("notify_likes").default(true)
    val notifySubscriptions = bool("notify_subscriptions").default(true)
    
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")

    override val primaryKey = PrimaryKey(userId)
}
