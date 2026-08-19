package com.seamlis.data.table

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object CommunityPostVotes : Table("community_post_votes") {
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val postId = reference("post_id", CommunityPosts.id, onDelete = ReferenceOption.CASCADE)
    val optionId = reference("option_id", CommunityPostOptions.id, onDelete = ReferenceOption.CASCADE)
    val votedAt = timestamp("voted_at")

    override val primaryKey = PrimaryKey(userId, postId)
}

object CommunityPostLikes : Table("community_post_likes") {
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
    val postId = reference("post_id", CommunityPosts.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(userId, postId)
}
