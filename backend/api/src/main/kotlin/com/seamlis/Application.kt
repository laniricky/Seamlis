package com.seamlis

import com.seamlis.api.routes.searchRoutes
import com.seamlis.api.routes.studioRoutes
import com.seamlis.api.routes.engagementRoutes
import com.seamlis.api.routes.recommendationRoutes
import com.seamlis.api.routes.notificationRoutes
import com.seamlis.api.routes.communityRoutes
import com.seamlis.api.routes.authRoutes
import com.seamlis.api.routes.processingRoutes
import com.seamlis.api.routes.videoRoutes
import com.seamlis.api.routes.liveRoutes
import com.seamlis.api.routes.monetizationRoutes
import com.seamlis.api.routes.moderationRoutes
import com.seamlis.service.AnalyticsService
import com.seamlis.service.SearchService
import com.seamlis.service.StudioService
import com.seamlis.service.RecommendationService
import com.seamlis.service.NotificationService
import com.seamlis.service.CommunityService
import com.seamlis.service.EngagementService
import com.seamlis.service.MonetizationService
import com.seamlis.service.ModerationService
import com.seamlis.plugins.configureAuth
import com.seamlis.service.FFmpegService
import com.seamlis.service.ProcessingService
import com.seamlis.service.RedisJobQueue
import com.seamlis.service.getJwtConfig
import com.seamlis.worker.VideoProcessingWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import java.time.Duration

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

    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(15)
        timeout = Duration.ofSeconds(15)
        maxFrameSize = Long.MAX_VALUE
        masking = false
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
    val analyticsService = AnalyticsService(videoRepository)
    val engagementRepository = com.seamlis.repository.EngagementRepositoryImpl(videoRepository)
    val notificationService = NotificationService()
    val communityService = CommunityService()
    val engagementService = EngagementService(engagementRepository, notificationService)
    val searchService = SearchService(videoRepository, userRepository)
    val studioService = StudioService()
    val recommendationService = RecommendationService()

    // Redis URL from config
    val redisUrl = System.getenv("REDIS_URL") ?: "redis://localhost:6379"

    val processingService = ProcessingService(videoRepository, null)
    val liveService = com.seamlis.service.LiveService(redisUrl)
    val monetizationService = MonetizationService()
    val moderationService = ModerationService()

    // Start Redis and background worker asynchronously so they don't block server startup
    val appScope = CoroutineScope(Dispatchers.IO)
    appScope.launch {
        try {
            val queue = RedisJobQueue(redisUrl)
            processingService.setQueue(queue)

            val ffmpegService = FFmpegService()
            val videoProcessingWorker = VideoProcessingWorker(queue, storageService, ffmpegService, processingService)

            environment.monitor.subscribe(ApplicationStopped) {
                queue.close()
            }

            videoProcessingWorker.start(this)
        } catch (e: Exception) {
            log.error("Failed to initialize Redis/worker: ${e.message}", e)
        }
    }

    // 4. Configure Routing
    routing {
        get("/") {
            call.respondText("Seamlis API is running!")
        }
        get("/api/v1/health") {
            call.respond(io.ktor.http.HttpStatusCode.OK, mapOf("status" to "UP"))
        }

        authRoutes(authService)
        videoRoutes(videoRepository, storageService, analyticsService)
        processingRoutes(processingService)
        engagementRoutes(engagementService)
        searchRoutes(searchService)
        studioRoutes(studioService, videoRepository)
        recommendationRoutes(recommendationService)
        notificationRoutes(notificationService)
        communityRoutes(communityService)
        liveRoutes(liveService)
        monetizationRoutes(monetizationService)
        moderationRoutes(moderationService)
    }
}
