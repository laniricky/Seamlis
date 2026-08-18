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
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import java.util.UUID

fun Route.videoRoutes(
    videoRepository: VideoRepository,
    storageService: StorageService,
) {
    route("/api/v1/videos") {
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
                    )

                call.respond(HttpStatusCode.OK, VideoUploadResponse(video, uploadUrl))
            }
        }
    }
}
