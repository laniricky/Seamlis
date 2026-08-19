package com.seamlis.data.table

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object LiveChatMessages : Table("live_chat_messages") {
    val id = uuid("id")
    val livestreamId = uuid("livestream_id").references(Livestreams.id)
    val userId = uuid("user_id").references(Users.id)
    val content = text("content")
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
