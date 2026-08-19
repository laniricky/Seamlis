package com.seamlis.service

import com.seamlis.data.table.Reports
import com.seamlis.data.table.Users
import com.seamlis.data.table.Videos
import com.seamlis.data.table.Comments
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

@Serializable
data class ReportData(
    val id: String,
    val reporterId: String,
    val targetType: String,
    val targetId: String,
    val reason: String,
    val status: String,
    val createdAt: String
)

class ModerationService {
    fun createReport(
        reporterId: UUID,
        targetType: String, // "VIDEO", "COMMENT", "USER"
        targetId: UUID,
        reason: String
    ): ReportData {
        return transaction {
            val reportId = UUID.randomUUID()
            val now = Instant.now()
            Reports.insert {
                it[id] = reportId
                it[Reports.reporterId] = reporterId
                it[Reports.targetType] = targetType.uppercase()
                it[Reports.targetId] = targetId
                it[Reports.reason] = reason
                it[status] = "PENDING"
                it[createdAt] = now
            }
            ReportData(
                id = reportId.toString(),
                reporterId = reporterId.toString(),
                targetType = targetType.uppercase(),
                targetId = targetId.toString(),
                reason = reason,
                status = "PENDING",
                createdAt = now.toString()
            )
        }
    }

    fun getPendingReports(): List<ReportData> {
        return transaction {
            Reports.select { Reports.status eq "PENDING" }
                .orderBy(Reports.createdAt to SortOrder.ASC)
                .map {
                    ReportData(
                        id = it[Reports.id].toString(),
                        reporterId = it[Reports.reporterId].toString(),
                        targetType = it[Reports.targetType],
                        targetId = it[Reports.targetId].toString(),
                        reason = it[Reports.reason],
                        status = it[Reports.status],
                        createdAt = it[Reports.createdAt].toString()
                    )
                }
        }
    }

    fun resolveReport(
        reportId: UUID,
        adminId: UUID,
        action: String, // "DISMISS", "DELETE_CONTENT", "BAN_USER"
        notes: String?
    ): Boolean {
        return transaction {
            val report = Reports.select { Reports.id eq reportId }.singleOrNull() ?: return@transaction false
            val targetType = report[Reports.targetType]
            val targetId = report[Reports.targetId]

            when (action.uppercase()) {
                "DELETE_CONTENT" -> {
                    when (targetType) {
                        "VIDEO" -> Videos.deleteWhere { SqlExpressionBuilder.run { Videos.id eq targetId } }
                        "COMMENT" -> Comments.deleteWhere { SqlExpressionBuilder.run { Comments.id eq targetId } }
                        // Cannot simply delete a user, but we can ban them via BAN_USER action
                    }
                }
                "BAN_USER" -> {
                    val userIdToBan: UUID? = when (targetType) {
                        "USER" -> targetId
                        "VIDEO" -> Videos.select { Videos.id eq targetId }.singleOrNull()?.get(Videos.uploaderId)?.value
                        "COMMENT" -> Comments.select { Comments.id eq targetId }.singleOrNull()?.get(Comments.userId)?.value
                        else -> null
                    }
                    userIdToBan?.let { uid ->
                        Users.update({ Users.id eq uid }) {
                            it[isActive] = false
                        }
                    }
                }
            }

            // Update report status
            Reports.update({ Reports.id eq reportId }) {
                it[status] = "RESOLVED"
                it[resolvedBy] = adminId
                it[resolvedAt] = Instant.now()
                it[this.notes] = notes
            }
            true
        }
    }
}
