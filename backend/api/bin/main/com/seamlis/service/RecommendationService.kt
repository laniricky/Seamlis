package com.seamlis.service

import com.seamlis.data.table.Subscriptions
import com.seamlis.data.table.VideoLikes
import com.seamlis.data.table.Videos
import com.seamlis.data.table.WatchHistory
import com.seamlis.data.table.Users
import com.seamlis.domain.model.VideoResponse
import com.seamlis.domain.model.ChannelPreview
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.util.UUID

/**
 * Deterministic recommendation engine.
 *
 * Scoring formula (per video):
 *   base  = likeCount * 3 + commentCount * 2 + (viewCount * 0.001)
 *   fresh = +50 if uploaded within 7 days, +20 if within 30 days
 *   affin = +100 if the requesting user is subscribed to the uploader
 *   score = base + fresh + affin
 *
 * Architecture note: The scoring is done in-database (via ordering on
 * computed expressions) for now. As data volume grows, this layer can
 * be replaced by a dedicated ML ranking service without changing the
 * API contract.
 */
class RecommendationService {

    /**
     * Returns a ranked feed of recommended videos.
     *
     * @param userId         Nullable — anonymous users get a non-personalised feed.
     * @param excludeVideoId Optional — exclude the currently-watched video (watch-page sidebar).
     * @param limit          Page size.
     * @param offset         Cursor offset for pagination.
     */
    fun getRecommendedFeed(
        userId: UUID?,
        excludeVideoId: UUID? = null,
        limit: Int = 20,
        offset: Long = 0
    ): List<ScoredVideoResponse> {
        return transaction {
            // 1. Fetch candidate READY non-short videos (up to 500 for scoring)
            val candidateQuery = Videos.innerJoin(Users)
                .select { Videos.status eq "READY" and (Videos.isShort eq false) }

            if (excludeVideoId != null) {
                candidateQuery.andWhere { Videos.id neq excludeVideoId }
            }

            // Exclude already-watched videos for authenticated users
            val watchedIds: Set<UUID> = if (userId != null) {
                WatchHistory
                    .select { WatchHistory.userId eq userId }
                    .map { it[WatchHistory.videoId].value }
                    .toSet()
            } else emptySet()

            if (watchedIds.isNotEmpty()) {
                candidateQuery.andWhere { Videos.id notInList watchedIds.toList() }
            }

            // 2. Determine subscribed channel IDs for creator affinity bonus
            val subscribedChannelIds: Set<UUID> = if (userId != null) {
                Subscriptions
                    .select { Subscriptions.subscriberId eq userId }
                    .map { it[Subscriptions.channelId].value }
                    .toSet()
            } else emptySet()

            val now = LocalDateTime.now()
            val sevenDaysAgo = now.minusDays(7)
            val thirtyDaysAgo = now.minusDays(30)

            // 3. Score each candidate
            candidateQuery
                .limit(500) // cap candidates for performance
                .map { row ->
                    val uploaderId = row[Videos.uploaderId].value
                    val createdAt = row[Videos.createdAt]
                    val likeCount = row[Videos.likeCount]
                    val commentCount = row[Videos.commentCount]
                    val viewCount = row[Videos.viewCount]

                    val freshBonus = when {
                        createdAt.isAfter(sevenDaysAgo) -> 50.0
                        createdAt.isAfter(thirtyDaysAgo) -> 20.0
                        else -> 0.0
                    }

                    val affinityBonus = if (uploaderId in subscribedChannelIds) 100.0 else 0.0

                    val baseScore = likeCount * 3.0 + commentCount * 2.0 + viewCount * 0.001
                    val totalScore = baseScore + freshBonus + affinityBonus

                    val uploader = ChannelPreview(
                        id = uploaderId.toString(),
                        username = row[Users.username],
                        displayName = row[Users.displayName],
                        avatarUrl = row[Users.avatarUrl],
                    )

                    ScoredVideoResponse(
                        score = totalScore,
                        video = VideoResponse(
                            id = row[Videos.id].value,
                            title = row[Videos.title],
                            description = row[Videos.description],
                            status = row[Videos.status],
                            processedVideoKey = row[Videos.processedVideoKey],
                            thumbnailUrl = row[Videos.thumbnailUrl],
                            viewCount = viewCount,
                            likeCount = likeCount,
                            dislikeCount = row[Videos.dislikeCount],
                            commentCount = commentCount,
                            isShort = row[Videos.isShort],
                            originalVideoKey = row[Videos.originalVideoKey],
                            uploader = uploader,
                            createdAt = createdAt.toString(),
                            updatedAt = row[Videos.updatedAt].toString(),
                        )
                    )
                }
                // 4. Sort by score descending, then paginate in-memory (candidates are capped at 500)
                .sortedByDescending { it.score }
                .drop(offset.toInt())
                .take(limit)
        }
    }

    /**
     * Returns videos related to a specific video.
     * Strategy: same-channel videos first, then high-scoring feed excluding watched.
     */
    fun getRelatedVideos(
        videoId: UUID,
        uploaderId: UUID,
        userId: UUID?,
        limit: Int = 15
    ): List<ScoredVideoResponse> {
        return transaction {
            val now = LocalDateTime.now()
            val sevenDaysAgo = now.minusDays(7)
            val thirtyDaysAgo = now.minusDays(30)

            Videos.innerJoin(Users)
                .select { Videos.status eq "READY" and (Videos.isShort eq false) and (Videos.id neq videoId) }
                .limit(200)
                .map { row ->
                    val rowUploaderId = row[Videos.uploaderId].value
                    val createdAt = row[Videos.createdAt]
                    val likeCount = row[Videos.likeCount]
                    val commentCount = row[Videos.commentCount]
                    val viewCount = row[Videos.viewCount]

                    // Same-channel gets a strong relevance boost
                    val sameChannelBonus = if (rowUploaderId == uploaderId) 200.0 else 0.0

                    val freshBonus = when {
                        createdAt.isAfter(sevenDaysAgo) -> 50.0
                        createdAt.isAfter(thirtyDaysAgo) -> 20.0
                        else -> 0.0
                    }

                    val baseScore = likeCount * 3.0 + commentCount * 2.0 + viewCount * 0.001
                    val totalScore = baseScore + freshBonus + sameChannelBonus

                    val uploader = ChannelPreview(
                        id = rowUploaderId.toString(),
                        username = row[Users.username],
                        displayName = row[Users.displayName],
                        avatarUrl = row[Users.avatarUrl],
                    )

                    ScoredVideoResponse(
                        score = totalScore,
                        video = VideoResponse(
                            id = row[Videos.id].value,
                            title = row[Videos.title],
                            description = row[Videos.description],
                            status = row[Videos.status],
                            processedVideoKey = row[Videos.processedVideoKey],
                            thumbnailUrl = row[Videos.thumbnailUrl],
                            viewCount = viewCount,
                            likeCount = likeCount,
                            dislikeCount = row[Videos.dislikeCount],
                            commentCount = commentCount,
                            isShort = row[Videos.isShort],
                            originalVideoKey = row[Videos.originalVideoKey],
                            uploader = uploader,
                            createdAt = createdAt.toString(),
                            updatedAt = row[Videos.updatedAt].toString(),
                        )
                    )
                }
                .sortedByDescending { it.score }
                .take(limit)
        }
    }
}

data class ScoredVideoResponse(
    val score: Double,
    val video: VideoResponse,
)
