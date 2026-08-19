package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.javatime.timestamp

object Subscriptions : UUIDTable("subscriptions") {
    val subscriberId = reference("subscriber_id", Users, onDelete = ReferenceOption.CASCADE)
    val channelId = reference("channel_id", Users, onDelete = ReferenceOption.CASCADE)
    val createdAt = timestamp("created_at")

    init {
        uniqueIndex(subscriberId, channelId)
    }
}
