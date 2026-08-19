package com.seamlis.service

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.seamlis.data.repository.CreateUserParams
import com.seamlis.data.repository.UserRepository
import com.seamlis.domain.model.AuthResponse
import com.seamlis.domain.model.AuthTokens
import com.seamlis.domain.model.User
import io.ktor.server.application.*
import org.mindrot.jbcrypt.BCrypt
import java.util.Date

class AuthException(message: String) : Exception(message)

data class JwtConfig(
    val secret: String,
    val issuer: String,
    val audience: String,
    // 15 minutes
    val accessExpiryMs: Long = 15 * 60 * 1000L,
    // 7 days
    val refreshExpiryMs: Long = 7 * 24 * 60 * 60 * 1000L,
)

class AuthService(
    private val userRepo: UserRepository,
    private val jwtConfig: JwtConfig,
) {
    private val algorithm = Algorithm.HMAC256(jwtConfig.secret)

    // ── Registration ─────────────────────────────────────────────────────
    fun register(
        email: String,
        username: String,
        displayName: String,
        password: String,
    ): AuthResponse {
        validatePassword(password)
        if (userRepo.existsByEmail(email)) throw AuthException("Email already in use")
        if (userRepo.existsByUsername(username)) throw AuthException("Username already taken")

        val passwordHash = BCrypt.hashpw(password, BCrypt.gensalt(12))
        val user =
            userRepo.create(
                CreateUserParams(
                    email = email.lowercase().trim(),
                    username = username.trim(),
                    displayName = displayName.trim(),
                    passwordHash = passwordHash,
                ),
            )

        val tokens = issueTokens(user)
        storeRefreshTokenHash(user.id, tokens.refreshToken)
        return AuthResponse(user = user, tokens = tokens)
    }

    // ── Login ─────────────────────────────────────────────────────────────
    fun login(
        emailOrUsername: String,
        password: String,
    ): AuthResponse {
        val credential = emailOrUsername.lowercase().trim()
        val (user, hash) =
            (
                userRepo.findByEmail(credential)
                    ?: userRepo.findByUsername(credential)
                        ?.let { u -> userRepo.findByEmail(u.email) }
            ) ?: throw AuthException("Invalid credentials")

        if (!BCrypt.checkpw(password, hash)) throw AuthException("Invalid credentials")

        val tokens = issueTokens(user)
        storeRefreshTokenHash(user.id, tokens.refreshToken)
        return AuthResponse(user = user, tokens = tokens)
    }

    // ── Refresh ───────────────────────────────────────────────────────────
    fun refresh(refreshToken: String): AuthTokens {
        val userId = verifyRefreshToken(refreshToken)
        val storedHash =
            userRepo.findRefreshTokenHash(userId)
                ?: throw AuthException("Session expired")

        if (!BCrypt.checkpw(refreshToken, storedHash)) throw AuthException("Invalid refresh token")

        val user = userRepo.findById(userId) ?: throw AuthException("User not found")
        val tokens = issueTokens(user)
        storeRefreshTokenHash(user.id, tokens.refreshToken)
        return tokens
    }

    // ── Logout ────────────────────────────────────────────────────────────
    fun logout(userId: String) {
        userRepo.updateRefreshTokenHash(userId, null)
    }

    // ── Me ────────────────────────────────────────────────────────────────
    fun getUser(userId: String): User = userRepo.findById(userId) ?: throw AuthException("User not found")

    fun updateProfile(userId: java.util.UUID, displayName: String, bio: String?): Boolean {
        return userRepo.updateProfile(userId, displayName, bio)
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private fun issueTokens(user: User): AuthTokens {
        val now = System.currentTimeMillis()
        val accessToken =
            JWT.create()
                .withIssuer(jwtConfig.issuer)
                .withAudience(jwtConfig.audience)
                .withSubject(user.id)
                .withClaim("email", user.email)
                .withClaim("username", user.username)
                .withExpiresAt(Date(now + jwtConfig.accessExpiryMs))
                .sign(algorithm)

        val refreshToken =
            JWT.create()
                .withIssuer(jwtConfig.issuer)
                .withAudience(jwtConfig.audience)
                .withSubject(user.id)
                .withClaim("type", "refresh")
                .withExpiresAt(Date(now + jwtConfig.refreshExpiryMs))
                .sign(algorithm)

        return AuthTokens(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtConfig.accessExpiryMs / 1000,
        )
    }

    private fun storeRefreshTokenHash(
        userId: String,
        refreshToken: String,
    ) {
        val hash = BCrypt.hashpw(refreshToken, BCrypt.gensalt(10))
        userRepo.updateRefreshTokenHash(userId, hash)
    }

    private fun verifyRefreshToken(token: String): String {
        return try {
            val verifier =
                JWT.require(algorithm)
                    .withIssuer(jwtConfig.issuer)
                    .withClaim("type", "refresh")
                    .build()
            verifier.verify(token).subject
        } catch (e: Exception) {
            throw AuthException("Invalid or expired refresh token")
        }
    }

    private fun validatePassword(password: String) {
        if (password.length < 8) throw AuthException("Password must be at least 8 characters")
    }
}

fun Application.getJwtConfig() =
    JwtConfig(
        secret = environment.config.property("jwt.secret").getString(),
        issuer = environment.config.property("jwt.issuer").getString(),
        audience = environment.config.property("jwt.audience").getString(),
    )
