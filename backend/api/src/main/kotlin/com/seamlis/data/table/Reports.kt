package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.javatime.timestamp

object Reports : UUIDTable("reports") {
    val reporterId = uuid("reporter_id").references(Users.id)
    val targetType = varchar("target_type", 50)
    val targetId = uuid("target_id")
    val reason = varchar("reason", 50)
    val status = varchar("status", 20).default("PENDING")
    val notes = text("notes").nullable()
    val resolvedBy = uuid("resolved_by").references(Users.id).nullable()
    val createdAt = timestamp("created_at")
    val resolvedAt = timestamp("resolved_at").nullable()
}
