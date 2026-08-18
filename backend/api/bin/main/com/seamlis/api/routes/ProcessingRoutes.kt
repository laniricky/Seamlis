package com.seamlis.api.routes

import com.seamlis.service.ProcessingService
import com.seamlis.service.ProcessingWebhookPayload
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

fun Route.processingRoutes(processingService: ProcessingService) {
    route("/api/v1/processing") {
        // Client calls this after the upload to S3 is complete to trigger processing
        authenticate {
            post("/enqueue/{videoId}") {
                val principal =
                    call.principal<JWTPrincipal>()
                        ?: return@post call.respond(HttpStatusCode.Unauthorized)
                val videoId =
                    call.parameters["videoId"]
                        ?: return@post call.respond(HttpStatusCode.BadRequest, "Missing videoId")
                val jobId = processingService.enqueueProcessing(UUID.fromString(videoId))
                call.respond(HttpStatusCode.Accepted, mapOf("jobId" to jobId.toString()))
            }
        }

        // Internal webhook — called by the video worker when transcoding finishes
        // Should be secured via a shared secret in production
        post("/webhook") {
            val payload = call.receive<ProcessingWebhookPayload>()
            processingService.handleWorkerCallback(payload)
            call.respond(HttpStatusCode.OK, mapOf("status" to "acknowledged"))
        }
    }
}
