package com.seamlis.api.routes

import com.seamlis.service.AuthException
import com.seamlis.service.AuthService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class RegisterRequest(
    val email: String,
    val username: String,
    val displayName: String,
    val password: String,
)

@Serializable
data class LoginRequest(
    val emailOrUsername: String,
    val password: String,
)

@Serializable
data class RefreshRequest(val refreshToken: String)

@Serializable
data class ApiError(val message: String)

fun Route.authRoutes(authService: AuthService) {
    route("/api/v1/auth") {
        // POST /api/v1/auth/register
        post("/register") {
            runCatching {
                val req = call.receive<RegisterRequest>()
                val response =
                    authService.register(
                        email = req.email,
                        username = req.username,
                        displayName = req.displayName,
                        password = req.password,
                    )
                call.respond(HttpStatusCode.Created, response)
            }.onFailure { e ->
                when (e) {
                    is AuthException -> call.respond(HttpStatusCode.Conflict, ApiError(e.message ?: "Registration failed"))
                    else -> call.respond(HttpStatusCode.InternalServerError, ApiError("Internal server error"))
                }
            }
        }

        // POST /api/v1/auth/login
        post("/login") {
            runCatching {
                val req = call.receive<LoginRequest>()
                val response = authService.login(req.emailOrUsername, req.password)
                call.respond(HttpStatusCode.OK, response)
            }.onFailure { e ->
                when (e) {
                    is AuthException -> call.respond(HttpStatusCode.Unauthorized, ApiError(e.message ?: "Login failed"))
                    else -> call.respond(HttpStatusCode.InternalServerError, ApiError("Internal server error"))
                }
            }
        }

        // POST /api/v1/auth/refresh
        post("/refresh") {
            runCatching {
                val req = call.receive<RefreshRequest>()
                val tokens = authService.refresh(req.refreshToken)
                call.respond(HttpStatusCode.OK, tokens)
            }.onFailure { e ->
                when (e) {
                    is AuthException -> call.respond(HttpStatusCode.Unauthorized, ApiError(e.message ?: "Refresh failed"))
                    else -> call.respond(HttpStatusCode.InternalServerError, ApiError("Internal server error"))
                }
            }
        }

        // Protected routes
        authenticate("jwt-auth") {
            // GET /api/v1/auth/me
            get("/me") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject ?: return@get call.respond(HttpStatusCode.Unauthorized)
                runCatching {
                    val user = authService.getUser(userId)
                    call.respond(HttpStatusCode.OK, user)
                }.onFailure {
                    call.respond(HttpStatusCode.NotFound, ApiError("User not found"))
                }
            }

            // POST /api/v1/auth/logout
            post("/logout") {
                val principal = call.principal<JWTPrincipal>()
                val userId = principal?.subject ?: return@post call.respond(HttpStatusCode.Unauthorized)
                authService.logout(userId)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
