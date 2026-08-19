package com.seamlis.domain.model

import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class Comment(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    @Serializable(with = UUIDSerializer::class)
    val videoId: UUID,
    val user: User,
    @Serializable(with = UUIDSerializer::class)
    val parentId: UUID? = null,
    val content: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateCommentRequest(
    val content: String,
    @Serializable(with = UUIDSerializer::class)
    val parentId: UUID? = null
)

@Serializable
data class ToggleLikeRequest(
    val isLike: Boolean
)

@Serializable
data class WatchHistoryItem(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val video: VideoResponse,
    val watchedAt: String
)

@Serializable
data class SubscriptionResponse(
    val subscribed: Boolean
)
