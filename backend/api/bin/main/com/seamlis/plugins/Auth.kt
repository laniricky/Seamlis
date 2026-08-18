package com.seamlis.plugins

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.seamlis.service.JwtConfig
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun Application.configureAuth(jwtConfig: JwtConfig) {
    install(Authentication) {
        jwt("jwt-auth") {
            realm = "Seamlis API"
            verifier(
                JWT.require(Algorithm.HMAC256(jwtConfig.secret))
                    .withIssuer(jwtConfig.issuer)
                    .withAudience(jwtConfig.audience)
                    .build(),
            )
            validate { credential ->
                // Reject refresh tokens used as access tokens
                if (credential.payload.getClaim("type").asString() == "refresh") {
                    null
                } else if (credential.payload.subject.isNullOrBlank()) {
                    null
                } else {
                    JWTPrincipal(credential.payload)
                }
            }
        }
    }
}
