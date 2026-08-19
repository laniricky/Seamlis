package com.seamlis.data.table

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object Memberships : Table("memberships") {
    val id = uuid("id")
    val channelId = uuid("channel_id").references(Users.id)
    val name = varchar("name", 100)
    val description = text("description").nullable()
    val priceCents = integer("price_cents")
    val currency = varchar("currency", 3).default("USD")
    val perks = text("perks").nullable()
    val isActive = bool("is_active").default(true)
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}

object UserMemberships : Table("user_memberships") {
    val id = uuid("id")
    val userId = uuid("user_id").references(Users.id)
    val membershipId = uuid("membership_id").references(Memberships.id)
    val stripeSubscriptionId = varchar("stripe_subscription_id", 255).nullable()
    val status = varchar("status", 50).default("ACTIVE")
    val startedAt = timestamp("started_at")
    val expiresAt = timestamp("expires_at").nullable()

    override val primaryKey = PrimaryKey(id)
}

object Transactions : Table("transactions") {
    val id = uuid("id")
    val payerId = uuid("payer_id").references(Users.id).nullable()
    val payeeId = uuid("payee_id").references(Users.id)
    val transactionType = varchar("transaction_type", 50)
    val amountCents = integer("amount_cents")
    val currency = varchar("currency", 3).default("USD")
    val status = varchar("status", 50).default("PENDING")
    val stripePaymentIntentId = varchar("stripe_payment_intent_id", 255).nullable().uniqueIndex()
    val metadata = text("metadata").nullable() // JSON stored as text
    val createdAt = timestamp("created_at")

    override val primaryKey = PrimaryKey(id)
}
