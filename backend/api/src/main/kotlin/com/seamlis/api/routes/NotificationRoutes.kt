package com.seamlis.api.routes

import com.seamlis.service.NotificationService
import com.seamlis.service.UpdatePreferencesRequest
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.*
import java.util.UUID

fun Route.notificationRoutes(notificationService: NotificationService) {
    authenticate("auth-jwt") {
        route("/api/v1/notifications") {
            
            get {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
                val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L

                val notifications = notificationService.getUserNotifications(userId, limit, offset)
                call.respond(HttpStatusCode.OK, notifications)
            }

            get("/unread-count") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val count = notificationService.getUnreadCount(userId)
                call.respond(HttpStatusCode.OK, mapOf("count" to count))
            }

            patch("/{id}/read") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val notificationId = UUID.fromString(call.parameters["id"])
                
                val success = notificationService.markAsRead(userId, notificationId)
                if (success) {
                    call.respond(HttpStatusCode.OK, mapOf("success" to true))
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("message" to "Notification not found"))
                }
            }
            
            post("/read-all") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                notificationService.markAllAsRead(userId)
                call.respond(HttpStatusCode.OK, mapOf("success" to true))
            }

            get("/preferences") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val prefs = notificationService.getPreferences(userId)
                call.respond(HttpStatusCode.OK, prefs)
            }

            patch("/preferences") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val req = call.receive<UpdatePreferencesRequest>()
                
                val updatedPrefs = notificationService.updatePreferences(userId, req)
                call.respond(HttpStatusCode.OK, updatedPrefs)
            }
        }
    }
}
