package com.seamlis.api.routes

import com.seamlis.service.CommunityService
import com.seamlis.service.CreatePostRequest
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class VoteRequest(val optionId: String)

fun Route.communityRoutes(communityService: CommunityService) {

    route("/api/v1/channels/{channelId}/community") {

        // Public: get paginated posts for a channel
        get {
            val channelId = UUID.fromString(call.parameters["channelId"])
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
            val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L
            
            // Optionally extract requester to show liked/voted state
            val requesterId = runCatching {
                val token = call.request.headers["Authorization"]?.removePrefix("Bearer ")
                // We do basic extraction here; null if not authenticated
                null as UUID?
            }.getOrNull()

            val posts = communityService.getChannelPosts(channelId, requesterId, limit, offset)
            call.respond(HttpStatusCode.OK, posts)
        }

        // Public: get a single post
        get("/{postId}") {
            val channelId = UUID.fromString(call.parameters["channelId"])
            val postId = UUID.fromString(call.parameters["postId"])
            val post = communityService.getPost(postId, null)
                ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("message" to "Post not found"))
            call.respond(HttpStatusCode.OK, post)
        }

        authenticate("auth-jwt") {
            // Create a new post (channel owner only)
            post {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val channelId = UUID.fromString(call.parameters["channelId"])

                // Only allow channel owner to post
                if (userId != channelId) {
                    return@post call.respond(HttpStatusCode.Forbidden, mapOf("message" to "Only the channel owner can post"))
                }

                val req = call.receive<CreatePostRequest>()
                val post = communityService.createPost(channelId, req)
                call.respond(HttpStatusCode.Created, post)
            }

            // Delete a post (channel owner only)
            delete("/{postId}") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val channelId = UUID.fromString(call.parameters["channelId"])
                val postId = UUID.fromString(call.parameters["postId"])

                if (userId != channelId) {
                    return@delete call.respond(HttpStatusCode.Forbidden, mapOf("message" to "Only the channel owner can delete posts"))
                }

                val deleted = communityService.deletePost(channelId, postId)
                if (deleted) {
                    call.respond(HttpStatusCode.OK, mapOf("success" to true))
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("message" to "Post not found"))
                }
            }

            // Toggle like on a post
            post("/{postId}/like") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val postId = UUID.fromString(call.parameters["postId"])

                val liked = communityService.toggleLike(userId, postId)
                call.respond(HttpStatusCode.OK, mapOf("liked" to liked))
            }

            // Vote on a poll
            post("/{postId}/vote") {
                val principal = call.principal<JWTPrincipal>()
                val userId = UUID.fromString(principal!!.payload.subject)
                val postId = UUID.fromString(call.parameters["postId"])
                val req = call.receive<VoteRequest>()
                val optionId = UUID.fromString(req.optionId)

                val success = communityService.voteOnPoll(userId, postId, optionId)
                if (success) {
                    val updated = communityService.getPost(postId, userId)
                    call.respond(HttpStatusCode.OK, updated ?: mapOf("success" to true))
                } else {
                    call.respond(HttpStatusCode.Conflict, mapOf("message" to "Already voted or invalid option"))
                }
            }
        }
    }
}
