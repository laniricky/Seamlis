package com.seamlis.data.repository

import com.seamlis.data.table.Users
import com.seamlis.domain.model.User
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

data class CreateUserParams(
    val email: String,
    val username: String,
    val displayName: String,
    val passwordHash: String,
)

interface UserRepository {
    fun findById(id: String): User?

    fun findByEmail(email: String): Pair<User, String>? // User + passwordHash

    fun findByUsername(username: String): User?

    fun create(params: CreateUserParams): User

    fun existsByEmail(email: String): Boolean

    fun existsByUsername(username: String): Boolean

    fun updateRefreshTokenHash(userId: String, hash: String?)

    fun findRefreshTokenHash(userId: String): String?

    fun searchUsers(query: String, limit: Int = 20, offset: Long = 0): List<User>

    fun updateProfile(id: UUID, displayName: String, bio: String?): Boolean
}

class UserRepositoryImpl : UserRepository {
    override fun findById(id: String): User? =
        transaction {
            Users.select { Users.id eq UUID.fromString(id) }
                .singleOrNull()
                ?.toUser()
        }

    override fun findByEmail(email: String): Pair<User, String>? =
        transaction {
            Users.select { Users.email eq email }
                .singleOrNull()
                ?.let { Pair(it.toUser(), it[Users.passwordHash]) }
        }

    override fun findByUsername(username: String): User? =
        transaction {
            Users.select { Users.username eq username }
                .singleOrNull()
                ?.toUser()
        }

    override fun create(params: CreateUserParams): User =
        transaction {
            val now = Instant.now()
            val id =
                Users.insertAndGetId {
                    it[email] = params.email
                    it[username] = params.username
                    it[displayName] = params.displayName
                    it[passwordHash] = params.passwordHash
                    it[isVerified] = false
                    it[createdAt] = now
                    it[updatedAt] = now
                }
            findById(id.value.toString())!!
        }

    override fun existsByEmail(email: String): Boolean =
        transaction {
            Users.select { Users.email eq email }.count() > 0
        }

    override fun existsByUsername(username: String): Boolean =
        transaction {
            Users.select { Users.username eq username }.count() > 0
        }

    override fun updateRefreshTokenHash(
        userId: String,
        hash: String?,
    ) = transaction {
        Users.update({ Users.id eq UUID.fromString(userId) }) {
            it[refreshTokenHash] = hash
            it[updatedAt] = Instant.now()
        }
        Unit
    }

    override fun findRefreshTokenHash(userId: String): String? =
        transaction {
            Users.select { Users.id eq UUID.fromString(userId) }
                .singleOrNull()
                ?.get(Users.refreshTokenHash)
        }

    override fun searchUsers(query: String, limit: Int, offset: Long): List<User> =
        transaction {
            val pattern = "%${query.trim().lowercase()}%"
            Users.select {
                Users.username.lowerCase().like(pattern) or Users.displayName.lowerCase().like(pattern)
            }
            .orderBy(Users.displayName, SortOrder.ASC)
            .limit(limit, offset)
            .map { it.toUser() }
        }

    override fun updateProfile(id: UUID, displayName: String, bio: String?): Boolean =
        transaction {
            Users.update({ Users.id eq id }) {
                it[this.displayName] = displayName
                it[this.bio] = bio
                it[this.updatedAt] = Instant.now()
            } > 0
        }

    private fun ResultRow.toUser() =
        User(
            id = this[Users.id].value.toString(),
            email = this[Users.email],
            username = this[Users.username],
            displayName = this[Users.displayName],
            avatarUrl = this[Users.avatarUrl],
            bio = this[Users.bio],
            isVerified = this[Users.isVerified],
            createdAt = this[Users.createdAt].toString(),
        )
}
