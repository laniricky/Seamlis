package com.seamlis.api.routes

import com.seamlis.service.MonetizationService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class CreateTierRequest(
    val name: String,
    val description: String? = null,
    val priceCents: Int,
    val perks: List<String> = emptyList()
)

@Serializable
data class CreateTipIntentRequest(
    val payeeId: String,
    val amountCents: Int
)

fun Route.monetizationRoutes(monetizationService: MonetizationService) {
    route("/api/v1") {

            // --- Public ---
            get("/channels/{channelId}/memberships") {
                val channelId = call.parameters["channelId"]?.let {
                    try { UUID.fromString(it) } catch (e: Exception) { null }
                } ?: return@get call.respond(HttpStatusCode.BadRequest)

                call.respond(monetizationService.getChannelTiers(channelId))
            }

            // --- Stripe Webhook (no JWT, signature-validated) ---
            post("/payments/webhook") {
                val payload = call.receiveText()
                val sigHeader = call.request.headers["Stripe-Signature"] ?: ""

                val handled = monetizationService.handleStripeWebhook(payload, sigHeader)
                if (handled) {
                    call.respond(HttpStatusCode.OK)
                } else {
                    call.respond(HttpStatusCode.BadRequest)
                }
            }

            // --- Authenticated ---
            authenticate("auth-jwt") {

                // Create membership tier (creator only)
                post("/channels/{channelId}/memberships") {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("id").asString())
                    val channelId = call.parameters["channelId"]?.let {
                        try { UUID.fromString(it) } catch (e: Exception) { null }
                    } ?: return@post call.respond(HttpStatusCode.BadRequest)

                    // Only the channel owner can create tiers
                    if (channelId != userId) {
                        return@post call.respond(HttpStatusCode.Forbidden)
                    }

                    val req = call.receive<CreateTierRequest>()
                    val tier = monetizationService.createMembershipTier(
                        channelId = channelId,
                        name = req.name,
                        description = req.description,
                        priceCents = req.priceCents,
                        perks = req.perks
                    )
                    call.respond(HttpStatusCode.Created, tier)
                }

                // Create a tip payment intent
                post("/payments/intent") {
                    val principal = call.principal<JWTPrincipal>()
                    val payerId = UUID.fromString(principal!!.payload.getClaim("id").asString())

                    val req = call.receive<CreateTipIntentRequest>()
                    val payeeId = try {
                        UUID.fromString(req.payeeId)
                    } catch (e: Exception) {
                        return@post call.respond(HttpStatusCode.BadRequest)
                    }

                    if (req.amountCents < 100) {
                        return@post call.respond(HttpStatusCode.BadRequest, "Minimum tip is $1.00")
                    }

                    val response = monetizationService.createTipPaymentIntent(
                        payerId = payerId,
                        payeeId = payeeId,
                        amountCents = req.amountCents
                    )
                    call.respond(response)
                }

                // Creator earnings
                get("/studio/earnings") {
                    val principal = call.principal<JWTPrincipal>()
                    val userId = UUID.fromString(principal!!.payload.getClaim("id").asString())

                    val earnings = monetizationService.getCreatorEarnings(userId)
                    val summary = monetizationService.getCreatorEarningsSummary(userId)
                    call.respond(mapOf("summary" to summary, "transactions" to earnings))
                }
            }
    }
}
