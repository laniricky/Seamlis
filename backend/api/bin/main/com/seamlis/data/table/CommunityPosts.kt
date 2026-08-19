package com.seamlis.data.table

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object CommunityPosts : Table("community_posts") {
    val id = uuid("id")
    val channelId = reference("channel_id", Users, onDelete = ReferenceOption.CASCADE)

    // Types: TEXT, IMAGE, POLL, QUESTION, ANNOUNCEMENT
    val type = varchar("type", 20).default("TEXT")

    val title = varchar("title", 500).nullable()
    val body = text("body").nullable()
    val imageUrl = text("image_url").nullable()
    val isPinned = bool("is_pinned").default(false)
    val likeCount = integer("like_count").default(0)
    val commentCount = integer("comment_count").default(0)
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")

    override val primaryKey = PrimaryKey(id)
}
