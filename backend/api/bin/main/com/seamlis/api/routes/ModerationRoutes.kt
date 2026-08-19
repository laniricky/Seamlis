package com.seamlis.api.routes

import io.ktor.server.auth.jwt.*
import com.seamlis.data.table.Users
import com.seamlis.service.ModerationService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

@Serializable
data class CreateReportRequest(
    val targetType: String,
    val targetId: String,
    val reason: String
)

@Serializable
data class ResolveReportRequest(
    val action: String,
    val notes: String? = null
)

fun Route.moderationRoutes(moderationService: ModerationService) {
    authenticate("auth-jwt") {
        route("/api/v1/reports") {
            post {
                val principal = call.principal<JWTPrincipal>()
                if (principal == null) {
                    return@post call.respond(HttpStatusCode.Unauthorized)
                }
                val userIdStr = principal.payload.getClaim("id").asString()

                val req = call.receive<CreateReportRequest>()
                val report = moderationService.createReport(
                    reporterId = UUID.fromString(userIdStr),
                    targetType = req.targetType,
                    targetId = UUID.fromString(req.targetId),
                    reason = req.reason
                )
                call.respond(HttpStatusCode.Created, report)
            }
        }

        route("/api/v1/admin/reports") {
            // Middleware to check admin role
            intercept(ApplicationCallPipeline.Call) {
                val principal = call.principal<JWTPrincipal>()
                if (principal == null) {
                    call.respond(HttpStatusCode.Unauthorized)
                    finish()
                    return@intercept
                }
                val userIdStr = principal.payload.getClaim("id").asString()

                val isAdmin = transaction {
                    Users.select { Users.id eq UUID.fromString(userIdStr) }
                        .map { it[Users.role] }
                        .singleOrNull() == "ADMIN"
                }

                if (!isAdmin) {
                    call.respond(HttpStatusCode.Forbidden, "Admin access required")
                    finish()
                    return@intercept
                }
            }

            get {
                val reports = moderationService.getPendingReports()
                call.respond(reports)
            }

            post("/{id}/resolve") {
                val principal = call.principal<JWTPrincipal>()!!
                val userIdStr = principal.payload.getClaim("id").asString()
                val reportId = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)
                val req = call.receive<ResolveReportRequest>()

                val success = moderationService.resolveReport(
                    reportId = UUID.fromString(reportId),
                    adminId = UUID.fromString(userIdStr),
                    action = req.action,
                    notes = req.notes
                )

                if (success) {
                    call.respond(HttpStatusCode.OK, mapOf("success" to true))
                } else {
                    call.respond(HttpStatusCode.NotFound, "Report not found")
                }
            }
        }
    }
}
