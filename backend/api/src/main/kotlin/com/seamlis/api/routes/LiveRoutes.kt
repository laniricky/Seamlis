package com.seamlis.api.routes

import com.seamlis.service.LiveService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.util.UUID

@Serializable
data class CreateStreamRequest(val title: String)

fun Route.liveRoutes(liveService: LiveService) {
    route("/api/v1/live") {
            
            // --- Nginx RTMP Webhooks ---
            post("/webhook/publish") {
                val params = call.receiveParameters()
                val streamKey = params["name"]
                
                if (streamKey != null && liveService.authenticateStreamKey(streamKey)) {
                    call.respond(HttpStatusCode.OK) // Authenticated, allow stream
                } else {
                    call.respond(HttpStatusCode.Forbidden) // Reject
                }
            }
            
            post("/webhook/done") {
                val params = call.receiveParameters()
                val streamKey = params["name"]
                if (streamKey != null) {
                    liveService.endStreamByKey(streamKey)
                }
                call.respond(HttpStatusCode.OK)
            }

            // --- Public APIs ---
            get("/{id}") {
                val idStr = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)
                val id = try { UUID.fromString(idStr) } catch(e: Exception) { return@get call.respond(HttpStatusCode.BadRequest) }
                
                val stream = liveService.getStream(id)
                if (stream == null) {
                    call.respond(HttpStatusCode.NotFound)
                } else {
                    call.respond(stream)
                }
            }
            
            get("/{id}/messages") {
                val idStr = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)
                val id = try { UUID.fromString(idStr) } catch(e: Exception) { return@get call.respond(HttpStatusCode.BadRequest) }
                
                call.respond(liveService.getRecentMessages(id))
            }

            // --- WebSocket Chat ---
            webSocket("/{id}/chat") {
                val idStr = call.parameters["id"] ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "No ID"))
                val streamId = try { UUID.fromString(idStr) } catch(e: Exception) { return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Bad ID")) }
                
                // Get auth token from query params or headers
                val token = call.request.queryParameters["token"]
                // In a real app we would verify this token here before letting them connect.
                // For now, we will allow connection but we need a user ID to send messages.
                // We'll trust the userId sent in the JSON payload (or ideally extract from token).
                // To keep it simple, we'll let them send a JSON with token/userId.

                liveService.addConnection(streamId, this)
                try {
                    for (frame in incoming) {
                        frame as? Frame.Text ?: continue
                        val receivedText = frame.readText()
                        
                        // Expecting JSON: {"userId": "...", "content": "..."}
                        try {
                            val json = Json.parseToJsonElement(receivedText).jsonObject
                            val userIdStr = json["userId"]?.jsonPrimitive?.content ?: continue
                            val content = json["content"]?.jsonPrimitive?.content ?: continue
                            
                            val userId = UUID.fromString(userIdStr)
                            liveService.saveAndBroadcastMessage(streamId, userId, content)
                        } catch (e: Exception) {
                            // Invalid message format
                        }
                    }
                } finally {
                    liveService.removeConnection(streamId, this)
                }
            }

            // --- Authenticated APIs ---
            authenticate("auth-jwt") {
                post("/initiate") {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("id").asString())
                    
                    val request = call.receive<CreateStreamRequest>()
                    val stream = liveService.createStream(userId, request.title)
                    call.respond(stream)
                }
                
                get("/me") {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("id").asString())
                    
                    val stream = liveService.getActiveStreamForChannel(userId)
                    if (stream == null) {
                        call.respond(HttpStatusCode.NotFound)
                    } else {
                        call.respond(stream)
                    }
                }
            }
        }
    }
