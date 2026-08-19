package com.seamlis.api.routes

import com.seamlis.service.RecommendationService
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

fun Route.recommendationRoutes(recommendationService: RecommendationService) {
    route("/api/v1/recommendations") {

        // GET /api/v1/recommendations/feed
        // Personalised feed (optional auth; anonymous gets un-personalised feed)
        get("/feed") {
            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.payload?.subject?.let { UUID.fromString(it) }
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
            val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L

            val results = recommendationService.getRecommendedFeed(
                userId = userId,
                limit = limit,
                offset = offset
            )
            call.respond(HttpStatusCode.OK, results.map { it.video })
        }

        // GET /api/v1/recommendations/related?videoId=<uuid>&uploaderId=<uuid>
        // Related video sidebar for the watch page
        get("/related") {
            val videoIdStr = call.request.queryParameters["videoId"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing videoId"))
            val uploaderIdStr = call.request.queryParameters["uploaderId"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("message" to "Missing uploaderId"))

            val principal = call.principal<JWTPrincipal>()
            val userId = principal?.payload?.subject?.let { UUID.fromString(it) }
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 15

            val results = recommendationService.getRelatedVideos(
                videoId = UUID.fromString(videoIdStr),
                uploaderId = UUID.fromString(uploaderIdStr),
                userId = userId,
                limit = limit
            )
            call.respond(HttpStatusCode.OK, results.map { it.video })
        }
    }
}
