package com.seamlis.service

import com.seamlis.data.table.NotificationPreferences
import com.seamlis.data.table.Notifications
import com.seamlis.data.table.Users
import com.seamlis.domain.model.ChannelPreview
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

@Serializable
data class NotificationResponse(
    val id: String,
    val type: String,
    val entityId: String?,
    val message: String?,
    val isRead: Boolean,
    val actor: ChannelPreview?,
    val createdAt: String
)

@Serializable
data class NotificationPreferencesResponse(
    val emailEnabled: Boolean,
    val pushEnabled: Boolean,
    val inAppEnabled: Boolean,
    val notifyNewVideo: Boolean,
    val notifyComments: Boolean,
    val notifyLikes: Boolean,
    val notifySubscriptions: Boolean
)

@Serializable
data class UpdatePreferencesRequest(
    val emailEnabled: Boolean? = null,
    val pushEnabled: Boolean? = null,
    val inAppEnabled: Boolean? = null,
    val notifyNewVideo: Boolean? = null,
    val notifyComments: Boolean? = null,
    val notifyLikes: Boolean? = null,
    val notifySubscriptions: Boolean? = null
)

class NotificationService {
    
    fun getUnreadCount(userId: UUID): Long {
        return transaction {
            Notifications.select { (Notifications.userId eq userId) and (Notifications.isRead eq false) }.count()
        }
    }

    fun getUserNotifications(userId: UUID, limit: Int = 20, offset: Long = 0): List<NotificationResponse> {
        return transaction {
            Notifications
                .leftJoin(Users, { Notifications.actorId }, { Users.id })
                .select { Notifications.userId eq userId }
                .orderBy(Notifications.createdAt to SortOrder.DESC)
                .limit(limit, offset = offset)
                .map { row ->
                    val actorId = row[Notifications.actorId]?.value
                    val actor = if (actorId != null) {
                        ChannelPreview(
                            id = actorId.toString(),
                            username = row[Users.username],
                            displayName = row[Users.displayName],
                            avatarUrl = row[Users.avatarUrl]
                        )
                    } else null

                    NotificationResponse(
                        id = row[Notifications.id].value.toString(),
                        type = row[Notifications.type],
                        entityId = row[Notifications.entityId],
                        message = row[Notifications.message],
                        isRead = row[Notifications.isRead],
                        actor = actor,
                        createdAt = row[Notifications.createdAt].toString()
                    )
                }
        }
    }

    fun markAsRead(userId: UUID, notificationId: UUID): Boolean {
        return transaction {
            val updated = Notifications.update({ (Notifications.id eq notificationId) and (Notifications.userId eq userId) }) {
                it[isRead] = true
            }
            updated > 0
        }
    }

    fun markAllAsRead(userId: UUID): Boolean {
        return transaction {
            val updated = Notifications.update({ (Notifications.userId eq userId) and (Notifications.isRead eq false) }) {
                it[isRead] = true
            }
            updated > 0
        }
    }

    fun getPreferences(userId: UUID): NotificationPreferencesResponse {
        return transaction {
            val row = NotificationPreferences.select { NotificationPreferences.userId eq userId }.singleOrNull()
            if (row != null) {
                NotificationPreferencesResponse(
                    emailEnabled = row[NotificationPreferences.emailEnabled],
                    pushEnabled = row[NotificationPreferences.pushEnabled],
                    inAppEnabled = row[NotificationPreferences.inAppEnabled],
                    notifyNewVideo = row[NotificationPreferences.notifyNewVideo],
                    notifyComments = row[NotificationPreferences.notifyComments],
                    notifyLikes = row[NotificationPreferences.notifyLikes],
                    notifySubscriptions = row[NotificationPreferences.notifySubscriptions]
                )
            } else {
                // Default preferences
                NotificationPreferencesResponse(
                    emailEnabled = true, pushEnabled = true, inAppEnabled = true,
                    notifyNewVideo = true, notifyComments = true, notifyLikes = true, notifySubscriptions = true
                )
            }
        }
    }

    fun updatePreferences(userId: UUID, req: UpdatePreferencesRequest): NotificationPreferencesResponse {
        return transaction {
            val exists = NotificationPreferences.select { NotificationPreferences.userId eq userId }.singleOrNull() != null
            val now = java.time.Instant.now()

            if (exists) {
                NotificationPreferences.update({ NotificationPreferences.userId eq userId }) {
                    req.emailEnabled?.let { v -> it[emailEnabled] = v }
                    req.pushEnabled?.let { v -> it[pushEnabled] = v }
                    req.inAppEnabled?.let { v -> it[inAppEnabled] = v }
                    req.notifyNewVideo?.let { v -> it[notifyNewVideo] = v }
                    req.notifyComments?.let { v -> it[notifyComments] = v }
                    req.notifyLikes?.let { v -> it[notifyLikes] = v }
                    req.notifySubscriptions?.let { v -> it[notifySubscriptions] = v }
                    it[updatedAt] = now
                }
            } else {
                NotificationPreferences.insert {
                    it[this.userId] = userId
                    it[emailEnabled] = req.emailEnabled ?: true
                    it[pushEnabled] = req.pushEnabled ?: true
                    it[inAppEnabled] = req.inAppEnabled ?: true
                    it[notifyNewVideo] = req.notifyNewVideo ?: true
                    it[notifyComments] = req.notifyComments ?: true
                    it[notifyLikes] = req.notifyLikes ?: true
                    it[notifySubscriptions] = req.notifySubscriptions ?: true
                    it[createdAt] = now
                    it[updatedAt] = now
                }
            }
            getPreferences(userId)
        }
    }

    /**
     * Internal method to dispatch a notification.
     * Evaluates user preferences before creating in-app/push records.
     */
    fun dispatch(
        userId: UUID, 
        type: String, 
        actorId: UUID? = null, 
        entityId: String? = null, 
        message: String? = null
    ) {
        // Prevent self-notifications
        if (userId == actorId) return

        transaction {
            val prefs = getPreferences(userId)
            
            // Check if user disabled this category entirely
            if (!prefs.inAppEnabled && !prefs.pushEnabled && !prefs.emailEnabled) return@transaction

            // Check granular preferences
            val shouldNotify = when (type) {
                "NEW_VIDEO" -> prefs.notifyNewVideo
                "NEW_COMMENT" -> prefs.notifyComments
                "LIKE" -> prefs.notifyLikes
                "SUBSCRIPTION" -> prefs.notifySubscriptions
                else -> true
            }

            if (!shouldNotify) return@transaction

            // 1. Create In-App Notification (if enabled)
            if (prefs.inAppEnabled) {
                Notifications.insert {
                    it[id] = UUID.randomUUID()
                    it[this.userId] = userId
                    it[this.actorId] = actorId
                    it[this.type] = type
                    it[this.entityId] = entityId
                    it[this.message] = message
                    it[isRead] = false
                    it[createdAt] = java.time.Instant.now()
                }
            }

            // 2. Dispatch to Push/Email Workers
            if (prefs.pushEnabled || prefs.emailEnabled) {
                // Here we would typically enqueue a job to Redis for the worker to handle
                // external API calls (FCM for push, SendGrid/SMTP for email).
                // e.g. redisJobQueue.enqueue("send_push_notification", payload)
            }
        }
    }
}
