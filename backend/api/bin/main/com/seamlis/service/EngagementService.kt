package com.seamlis.service

import com.seamlis.domain.model.Comment
import com.seamlis.domain.model.WatchHistoryItem
import com.seamlis.repository.EngagementRepository
import java.util.UUID

class EngagementService(
    private val engagementRepository: EngagementRepository,
    private val notificationService: NotificationService
) {

    suspend fun toggleLike(userId: UUID, videoId: UUID, isLike: Boolean): Boolean {
        return engagementRepository.toggleLike(userId, videoId, isLike)
    }

    suspend fun createComment(userId: UUID, videoId: UUID, content: String, parentId: UUID? = null): Comment {
        require(content.isNotBlank()) { "Comment content cannot be blank" }
        require(content.length <= 10000) { "Comment too long" }
        val comment = engagementRepository.createComment(userId, videoId, content, parentId)
        
        // Dispatch notification
        // Find video owner (simplified, would ideally come from the repository)
        notificationService.dispatch(
            userId = comment.videoId, // Temporary fallback, should be actual video uploader ID
            type = "NEW_COMMENT",
            actorId = userId,
            entityId = videoId.toString(),
            message = "Someone commented on your video"
        )
        return comment
    }

    suspend fun getComments(videoId: UUID, limit: Int = 20, offset: Long = 0): List<Comment> {
        return engagementRepository.getComments(videoId, limit, offset)
    }

    suspend fun toggleSubscription(subscriberId: UUID, channelId: UUID): Boolean {
        require(subscriberId != channelId) { "Cannot subscribe to yourself" }
        val subscribed = engagementRepository.toggleSubscription(subscriberId, channelId)
        if (subscribed) {
            notificationService.dispatch(
                userId = channelId,
                type = "SUBSCRIPTION",
                actorId = subscriberId,
                entityId = subscriberId.toString(),
                message = "Someone subscribed to your channel!"
            )
        }
        return subscribed
    }

    suspend fun addWatchHistory(userId: UUID, videoId: UUID) {
        engagementRepository.addWatchHistory(userId, videoId)
    }

    suspend fun getWatchHistory(userId: UUID, limit: Int = 20, offset: Long = 0): List<WatchHistoryItem> {
        return engagementRepository.getWatchHistory(userId, limit, offset)
    }

    suspend fun hasLiked(userId: UUID, videoId: UUID): Boolean {
        return engagementRepository.hasLiked(userId, videoId)
    }

    suspend fun hasSubscribed(subscriberId: UUID, channelId: UUID): Boolean {
        return engagementRepository.hasSubscribed(subscriberId, channelId)
    }
}
