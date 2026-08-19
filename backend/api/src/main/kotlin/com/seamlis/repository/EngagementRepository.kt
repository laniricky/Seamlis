package com.seamlis.repository

import com.seamlis.domain.model.Comment
import com.seamlis.domain.model.WatchHistoryItem
import java.util.UUID

interface EngagementRepository {
    suspend fun toggleLike(userId: UUID, videoId: UUID, isLike: Boolean): Boolean
    suspend fun createComment(userId: UUID, videoId: UUID, content: String, parentId: UUID?): Comment
    suspend fun getComments(videoId: UUID, limit: Int, offset: Long): List<Comment>
    suspend fun toggleSubscription(subscriberId: UUID, channelId: UUID): Boolean
    suspend fun addWatchHistory(userId: UUID, videoId: UUID)
    suspend fun getWatchHistory(userId: UUID, limit: Int, offset: Long): List<WatchHistoryItem>
    suspend fun hasLiked(userId: UUID, videoId: UUID): Boolean
    suspend fun hasSubscribed(subscriberId: UUID, channelId: UUID): Boolean
}
