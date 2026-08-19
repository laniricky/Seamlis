package com.seamlis.service

import com.seamlis.data.table.Memberships
import com.seamlis.data.table.Transactions
import com.seamlis.data.table.UserMemberships
import com.seamlis.data.table.Users
import com.stripe.Stripe
import com.stripe.model.Event
import com.stripe.model.PaymentIntent
import com.stripe.net.Webhook
import com.stripe.param.PaymentIntentCreateParams
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

@Serializable
data class MembershipTierData(
    val id: String,
    val channelId: String,
    val name: String,
    val description: String?,
    val priceCents: Int,
    val currency: String,
    val perks: List<String>
)

@Serializable
data class TransactionData(
    val id: String,
    val transactionType: String,
    val amountCents: Int,
    val currency: String,
    val status: String,
    val createdAt: String
)

@Serializable
data class PaymentIntentResponse(
    val clientSecret: String,
    val transactionId: String
)

class MonetizationService {

    private val stripeSecretKey: String = System.getenv("STRIPE_SECRET_KEY") ?: ""
    private val stripeWebhookSecret: String = System.getenv("STRIPE_WEBHOOK_SECRET") ?: ""

    init {
        if (stripeSecretKey.isNotEmpty()) {
            Stripe.apiKey = stripeSecretKey
        }
    }

    // --- Membership Tiers ---

    fun createMembershipTier(
        channelId: UUID,
        name: String,
        description: String?,
        priceCents: Int,
        perks: List<String>
    ): MembershipTierData {
        return transaction {
            val newId = UUID.randomUUID()
            Memberships.insert {
                it[id] = newId
                it[Memberships.channelId] = channelId
                it[Memberships.name] = name
                it[Memberships.description] = description
                it[Memberships.priceCents] = priceCents
                it[Memberships.perks] = Json.encodeToString<List<String>>(perks)
                it[createdAt] = Instant.now()
            }
            MembershipTierData(
                id = newId.toString(),
                channelId = channelId.toString(),
                name = name,
                description = description,
                priceCents = priceCents,
                currency = "USD",
                perks = perks
            )
        }
    }

    fun getChannelTiers(channelId: UUID): List<MembershipTierData> {
        return transaction {
            Memberships.selectAll().where { (Memberships.channelId eq channelId) and (Memberships.isActive eq true) }
                .orderBy(Memberships.priceCents to SortOrder.ASC)
                .map { row ->
                    MembershipTierData(
                        id = row[Memberships.id].toString(),
                        channelId = row[Memberships.channelId].toString(),
                        name = row[Memberships.name],
                        description = row[Memberships.description],
                        priceCents = row[Memberships.priceCents],
                        currency = row[Memberships.currency],
                        perks = row[Memberships.perks]?.let { Json.decodeFromString<List<String>>(it) } ?: emptyList()
                    )
                }
        }
    }

    // --- Payments & Ledger ---

    fun createTipPaymentIntent(
        payerId: UUID,
        payeeId: UUID,
        amountCents: Int,
        currency: String = "usd"
    ): PaymentIntentResponse {
        val transactionId = UUID.randomUUID()
        val now = Instant.now()

        // Create pending ledger record first
        transaction {
            Transactions.insert {
                it[Transactions.id] = transactionId
                it[Transactions.payerId] = payerId
                it[Transactions.payeeId] = payeeId
                it[Transactions.transactionType] = "TIP"
                it[Transactions.amountCents] = amountCents
                it[Transactions.currency] = currency.uppercase()
                it[Transactions.status] = "PENDING"
                it[Transactions.createdAt] = now
            }
        }

        // Create Stripe PaymentIntent
        val clientSecret = if (stripeSecretKey.isNotEmpty()) {
            val params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents.toLong())
                .setCurrency(currency)
                .putMetadata("transaction_id", transactionId.toString())
                .putMetadata("payer_id", payerId.toString())
                .putMetadata("payee_id", payeeId.toString())
                .putMetadata("type", "TIP")
                .build()
            val intent = PaymentIntent.create(params)

            // Update ledger with Stripe ID
            transaction {
                Transactions.update({ Transactions.id eq transactionId }) {
                    it[stripePaymentIntentId] = intent.id
                }
            }

            intent.clientSecret
        } else {
            // No Stripe key — return test client secret for local dev
            "test_client_secret_${transactionId}"
        }

        return PaymentIntentResponse(
            clientSecret = clientSecret,
            transactionId = transactionId.toString()
        )
    }

    fun handleStripeWebhook(payload: String, sigHeader: String): Boolean {
        val event: Event = try {
            if (stripeWebhookSecret.isNotEmpty()) {
                Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret)
            } else {
                return false
            }
        } catch (e: Exception) {
            return false
        }

        when (event.type) {
            "payment_intent.succeeded" -> {
                val obj = event.dataObjectDeserializer.`object`
                val paymentIntent = (if (obj.isPresent) obj.get() else null) as? PaymentIntent ?: return true
                val transactionId = paymentIntent.metadata["transaction_id"] ?: return true

                transaction {
                    Transactions.update({ Transactions.stripePaymentIntentId eq paymentIntent.id }) {
                        it[status] = "SUCCEEDED"
                    }
                }
            }
            "payment_intent.payment_failed" -> {
                val obj = event.dataObjectDeserializer.`object`
                val paymentIntent = (if (obj.isPresent) obj.get() else null) as? PaymentIntent ?: return true
                transaction {
                    Transactions.update({ Transactions.stripePaymentIntentId eq paymentIntent.id }) {
                        it[status] = "FAILED"
                    }
                }
            }
        }

        return true
    }

    fun getCreatorEarnings(channelId: UUID): List<TransactionData> {
        return transaction {
            Transactions.selectAll().where {
                (Transactions.payeeId eq channelId) and (Transactions.status eq "SUCCEEDED")
            }
                .orderBy(Transactions.createdAt to SortOrder.DESC)
                .limit(100)
                .map {
                    TransactionData(
                        id = it[Transactions.id].toString(),
                        transactionType = it[Transactions.transactionType],
                        amountCents = it[Transactions.amountCents],
                        currency = it[Transactions.currency],
                        status = it[Transactions.status],
                        createdAt = it[Transactions.createdAt].toString()
                    )
                }
        }
    }

    fun getCreatorEarningsSummary(channelId: UUID): Map<String, Any> {
        return transaction {
            val rows = Transactions.selectAll().where {
                (Transactions.payeeId eq channelId) and (Transactions.status eq "SUCCEEDED")
            }.toList()

            val totalCents = rows.sumOf { it[Transactions.amountCents] }
            val tipCount = rows.count { it[Transactions.transactionType] == "TIP" }
            val membershipCount = rows.count { it[Transactions.transactionType] == "MEMBERSHIP" }

            mapOf(
                "totalEarningsCents" to totalCents,
                "tipCount" to tipCount,
                "membershipCount" to membershipCount
            )
        }
    }
}
