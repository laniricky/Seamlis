package com.seamlis.service

import com.seamlis.data.repository.VideoRepository
import com.seamlis.data.table.AnalyticsEvents
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.util.UUID

class AnalyticsService(
    private val videoRepository: VideoRepository
) {
    fun recordEvent(
        videoId: UUID,
        eventName: String,
        userId: UUID?,
        sessionId: String?,
        properties: String?
    ) {
        transaction {
            // Deduplication logic: only count a new "view" once per 30 minutes per user/session
            if (eventName == "video_view") {
                val thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30)

                val existingView = AnalyticsEvents.select {
                    val baseCondition = (AnalyticsEvents.videoId eq videoId) and
                        (AnalyticsEvents.eventName eq "video_view") and
                        (AnalyticsEvents.createdAt greaterEq thirtyMinutesAgo)

                    if (userId != null) {
                        baseCondition and (AnalyticsEvents.userId eq userId)
                    } else {
                        baseCondition and (AnalyticsEvents.sessionId eq (sessionId ?: ""))
                    }
                }.limit(1).count()

                if (existingView == 0L) {
                    videoRepository.incrementViewCount(videoId)
                }
            }

            // Always record the event itself
            AnalyticsEvents.insert {
                it[this.eventName] = eventName
                it[this.userId] = userId
                it[this.sessionId] = sessionId
                it[this.videoId] = videoId
                it[this.properties] = properties
                it[this.createdAt] = LocalDateTime.now()
            }
        }
    }
}

