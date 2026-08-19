package com.seamlis.data.table

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

object CommunityPostOptions : Table("community_post_options") {
    val id = uuid("id")
    val postId = reference("post_id", CommunityPosts.id, onDelete = ReferenceOption.CASCADE)
    val text = varchar("text", 255)
    val voteCount = integer("vote_count").default(0)
    val position = integer("position").default(0)

    override val primaryKey = PrimaryKey(id)
}
