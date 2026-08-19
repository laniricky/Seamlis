package com.seamlis.api.routes

import com.seamlis.data.repository.VideoRepository
import com.seamlis.service.StudioService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import java.util.UUID

fun Route.studioRoutes(
    studioService: StudioService,
    videoRepository: VideoRepository
) {
    route("/api/v1/studio") {
        authenticate {
            get("/stats") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
                
                val stats = studioService.getChannelStats(UUID.fromString(userId))
                call.respond(HttpStatusCode.OK, stats)
            }

            get("/videos") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.payload?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
                
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 50
                val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L

                val videos = videoRepository.getStudioVideos(
                    uploaderId = UUID.fromString(userId),
                    limit = limit,
                    offset = offset
                )
                
                call.respond(HttpStatusCode.OK, videos)
            }
        }
    }
}
