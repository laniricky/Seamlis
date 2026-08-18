package com.seamlis.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val bio: String?,
    val isVerified: Boolean,
    val createdAt: String,
)

@Serializable
data class AuthTokens(
    val accessToken: String,
    val refreshToken: String,
    // seconds
    val expiresIn: Long,
)

@Serializable
data class AuthResponse(
    val user: User,
    val tokens: AuthTokens,
)
