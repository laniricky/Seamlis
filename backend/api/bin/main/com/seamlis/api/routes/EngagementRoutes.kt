package com.seamlis.api.routes

import com.seamlis.domain.model.CreateCommentRequest
import com.seamlis.domain.model.ToggleLikeRequest
import com.seamlis.domain.model.SubscriptionResponse
import com.seamlis.service.EngagementService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import java.util.UUID

fun Route.engagementRoutes(engagementService: EngagementService) {
    route("/api/v1") {
        
        // Video specific engagement (likes, comments)
        route("/videos/{id}") {
            
            // Get comments (open to all)
            get("/comments") {
                val videoIdStr = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing video id")
                val videoId = try { UUID.fromString(videoIdStr) } catch (e: Exception) { return@get call.respond(HttpStatusCode.BadRequest, "Invalid video id") }
                
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
                val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L
                
                val comments = engagementService.getComments(videoId, limit, offset)
                call.respond(HttpStatusCode.OK, comments)
            }
            
            authenticate("auth-jwt") {
                // Post comment
                post("/comments") {
                    val principal = call.principal<JWTPrincipal>()
                    val userIdStr = principal?.payload?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)
                    val userId = UUID.fromString(userIdStr)
                    
                    val videoIdStr = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest, "Missing video id")
                    val videoId = try { UUID.fromString(videoIdStr) } catch (e: Exception) { return@post call.respond(HttpStatusCode.BadRequest, "Invalid video id") }
                    
                    val request = call.receive<CreateCommentRequest>()
                    
                    try {
                        val comment = engagementService.createComment(userId, videoId, request.content, request.parentId)
                        call.respond(HttpStatusCode.Created, comment)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to (e.message ?: "Failed to post comment")))
                    }
                }
                
                // Toggle like
                post("/like") {
                    val principal = call.principal<JWTPrincipal>()
                    val userIdStr = principal?.payload?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)
                    val userId = UUID.fromString(userIdStr)
                    
                    val videoIdStr = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest, "Missing video id")
                    val videoId = try { UUID.fromString(videoIdStr) } catch (e: Exception) { return@post call.respond(HttpStatusCode.BadRequest, "Invalid video id") }
                    
                    val request = call.receive<ToggleLikeRequest>()
                    
                    val active = engagementService.toggleLike(userId, videoId, request.isLike)
                    call.respond(HttpStatusCode.OK, mapOf("active" to active))
                }
            }
        }
        
        // User specific engagement (subscriptions, history)
        authenticate("auth-jwt") {
            route("/users") {
                post("/{id}/subscribe") {
                    val principal = call.principal<JWTPrincipal>()
                    val subscriberIdStr = principal?.payload?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)
                    val subscriberId = UUID.fromString(subscriberIdStr)
                    
                    val channelIdStr = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest, "Missing channel id")
                    val channelId = try { UUID.fromString(channelIdStr) } catch (e: Exception) { return@post call.respond(HttpStatusCode.BadRequest, "Invalid channel id") }
                    
                    try {
                        val subscribed = engagementService.toggleSubscription(subscriberId, channelId)
                        call.respond(HttpStatusCode.OK, SubscriptionResponse(subscribed))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to (e.message ?: "Failed to toggle subscription")))
                    }
                }
            }
            
            route("/me") {
                get("/history") {
                    val principal = call.principal<JWTPrincipal>()
                    val userIdStr = principal?.payload?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
                    val userId = UUID.fromString(userIdStr)
                    
                    val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
                    val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L
                    
                    val history = engagementService.getWatchHistory(userId, limit, offset)
                    call.respond(HttpStatusCode.OK, history)
                }
            }
        }
    }
}
