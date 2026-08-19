package com.seamlis.api.routes

import com.seamlis.data.repository.VideoRepository
import com.seamlis.domain.model.CreateVideoRequest
import com.seamlis.domain.model.VideoUploadResponse
import com.seamlis.service.StorageService
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
import io.ktor.server.routing.patch
import io.ktor.server.routing.delete
import io.ktor.server.routing.route
import java.util.UUID
import com.seamlis.service.AnalyticsService
import com.seamlis.domain.model.AnalyticsRequest

fun Route.videoRoutes(
    videoRepository: VideoRepository,
    storageService: StorageService,
    analyticsService: AnalyticsService,
) {
    route("/api/v1/videos") {
        // GET /api/v1/videos — list all READY non-short videos (public)
        get {
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 50
            val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L
            val videos = videoRepository.getFeedVideos(status = "READY", limit = limit, offset = offset)
            call.respond(HttpStatusCode.OK, videos)
        }

        // GET /api/v1/videos/shorts — list all READY shorts (public)
        get("/shorts") {
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
            val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L
            val shorts = videoRepository.getShortsFeed(status = "READY", limit = limit, offset = offset)
            call.respond(HttpStatusCode.OK, shorts)
        }

        // GET /api/v1/videos/{id} — single video (public)
        get("/{id}") {
            val id = call.parameters["id"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing id"))
            val video = videoRepository.getVideoDetails(UUID.fromString(id))
                ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("message" to "Video not found"))
            call.respond(HttpStatusCode.OK, video)
        }

        // POST /api/v1/videos/{id}/analytics — record watch event
        post("/{id}/analytics") {
            val id = call.parameters["id"]
                ?: return@post call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing id"))
            val req = call.receive<AnalyticsRequest>()
            
            // Try to extract user if token is provided (it's optional)
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.payload?.subject?.let { UUID.fromString(it) }

            analyticsService.recordEvent(
                videoId = UUID.fromString(id),
                eventName = req.eventName,
                userId = userId,
                sessionId = req.sessionId,
                properties = req.properties
            )

            call.respond(HttpStatusCode.OK, mapOf("success" to true))
        }

        authenticate {
            post("/upload-url") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)

                val req = call.receive<CreateVideoRequest>()

                // Generate a unique object key
                val videoId = java.util.UUID.randomUUID().toString()
                val objectKey = "uploads/$userId/$videoId.mp4"

                // Generate pre-signed URL
                val uploadUrl = storageService.generateUploadUrl(objectKey)

                // Create DB record
                val video =
                    videoRepository.createVideo(
                        title = req.title,
                        description = req.description,
                        uploaderId = UUID.fromString(userId),
                        originalVideoKey = objectKey,
                        isShort = req.isShort,
                    )

                call.respond(HttpStatusCode.OK, VideoUploadResponse(video, uploadUrl))
            }

            patch("/{id}") {
                val id = call.parameters["id"] ?: return@patch call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing id"))
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.subject ?: return@patch call.respond(HttpStatusCode.Unauthorized)
                
                // Verify ownership
                val video = videoRepository.getVideo(UUID.fromString(id))
                if (video == null) {
                    return@patch call.respond(HttpStatusCode.NotFound)
                }
                if (video.uploaderId != UUID.fromString(userId)) {
                    return@patch call.respond(HttpStatusCode.Forbidden)
                }

                @kotlinx.serialization.Serializable
                data class UpdateVideoRequest(val title: String, val description: String?)
                
                val req = call.receive<UpdateVideoRequest>()
                val success = videoRepository.updateVideo(UUID.fromString(id), req.title, req.description)
                
                if (success) {
                    call.respond(HttpStatusCode.OK, mapOf("success" to true))
                } else {
                    call.respond(HttpStatusCode.InternalServerError)
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing id"))
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.subject ?: return@delete call.respond(HttpStatusCode.Unauthorized)

                val success = videoRepository.deleteVideo(UUID.fromString(id), UUID.fromString(userId))
                if (success) {
                    call.respond(HttpStatusCode.OK, mapOf("success" to true))
                } else {
                    // Could be not found or forbidden, just returning 404/403 equivalent
                    call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Could not delete video"))
                }
            }
        }
    }
}
