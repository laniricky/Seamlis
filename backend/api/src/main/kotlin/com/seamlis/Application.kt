package com.seamlis

import com.seamlis.api.routes.authRoutes
import com.seamlis.api.routes.processingRoutes
import com.seamlis.api.routes.videoRoutes
import com.seamlis.plugins.configureAuth
import com.seamlis.service.ProcessingService
import com.seamlis.service.getJwtConfig
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    // 1. Initialize Database
    com.seamlis.db.DatabaseFactory.init(environment)

    // 2. Configure Plugins
    val jwtConfig = getJwtConfig()
    configureAuth(jwtConfig)

    install(io.ktor.server.plugins.contentnegotiation.ContentNegotiation) {
        json(
            kotlinx.serialization.json.Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            },
        )
    }

    install(io.ktor.server.plugins.cors.routing.CORS) {
        allowMethod(io.ktor.http.HttpMethod.Options)
        allowMethod(io.ktor.http.HttpMethod.Put)
        allowMethod(io.ktor.http.HttpMethod.Delete)
        allowMethod(io.ktor.http.HttpMethod.Patch)
        allowHeader(io.ktor.http.HttpHeaders.Authorization)
        allowHeader(io.ktor.http.HttpHeaders.ContentType)
        anyHost() // In production, restrict this
    }

    // 3. Setup Dependencies
    val userRepository = com.seamlis.data.repository.UserRepositoryImpl()
    val authService = com.seamlis.service.AuthService(userRepository, jwtConfig)

    val storageEndpoint = environment.config.property("storage.endpoint").getString()
    val storageAccessKey = environment.config.property("storage.accessKey").getString()
    val storageSecretKey = environment.config.property("storage.secretKey").getString()
    val storageBucket = environment.config.property("storage.bucket").getString()

    val storageService =
        com.seamlis.service.StorageService(
            endpoint = storageEndpoint,
            accessKey = storageAccessKey,
            secretKey = storageSecretKey,
            bucketName = storageBucket,
        )
    val videoRepository = com.seamlis.data.repository.VideoRepositoryImpl()
    val processingService = ProcessingService(videoRepository)

    // 4. Configure Routing
    routing {
        get("/") {
            call.respondText("Seamlis API is running!")
        }
        get("/api/v1/health") {
            call.respondText("{\"status\":\"UP\"}")
        }

        authRoutes(authService)
        videoRoutes(videoRepository, storageService)
        processingRoutes(processingService)
    }
}
