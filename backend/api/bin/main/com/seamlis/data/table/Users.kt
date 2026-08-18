package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.javatime.timestamp

object Users : UUIDTable("users") {
    val email = varchar("email", 255).uniqueIndex()
    val username = varchar("username", 50).uniqueIndex()
    val displayName = varchar("display_name", 100)
    val passwordHash = varchar("password_hash", 255)
    val avatarUrl = varchar("avatar_url", 512).nullable()
    val bio = text("bio").nullable()
    val isVerified = bool("is_verified").default(false)
    val refreshTokenHash = varchar("refresh_token_hash", 255).nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}
