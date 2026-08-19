package com.seamlis.repository

import com.seamlis.data.table.*
import com.seamlis.domain.model.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID
import com.seamlis.data.repository.VideoRepository

class EngagementRepositoryImpl(private val videoRepository: VideoRepository) : EngagementRepository {

    override suspend fun toggleLike(userId: UUID, videoId: UUID, isLike: Boolean): Boolean = transaction {
        val existing = VideoLikes.select { (VideoLikes.userId eq userId) and (VideoLikes.videoId eq videoId) }.singleOrNull()

        if (existing == null) {
            VideoLikes.insert {
                it[this.id] = UUID.randomUUID()
                it[this.userId] = userId
                it[this.videoId] = videoId
                it[this.isLike] = isLike
                it[createdAt] = Instant.now()
            }
            // Increment view_count / like_count handled outside or here? We should probably just do it here for simplicity
            if (isLike) {
                Videos.update({ Videos.id eq videoId }) {
                    with(SqlExpressionBuilder) {
                        it.update(likeCount, likeCount + 1)
                    }
                }
            }
            true // indicates now liked/disliked
        } else {
            val currentlyLiked = existing[VideoLikes.isLike]
            if (currentlyLiked == isLike) {
                // Toggle off
                VideoLikes.deleteWhere { (VideoLikes.userId eq userId) and (VideoLikes.videoId eq videoId) }
                if (isLike) {
                    Videos.update({ Videos.id eq videoId }) {
                        with(SqlExpressionBuilder) {
                            it.update(likeCount, likeCount - 1)
                        }
                    }
                }
                false // indicates removed
            } else {
                // Switch like/dislike
                VideoLikes.update({ (VideoLikes.userId eq userId) and (VideoLikes.videoId eq videoId) }) {
                    it[VideoLikes.isLike] = isLike
                }
                if (isLike) {
                    // Switched to like
                    Videos.update({ Videos.id eq videoId }) {
                        with(SqlExpressionBuilder) {
                            it.update(likeCount, likeCount + 1)
                        }
                    }
                } else {
                    // Switched to dislike (from like)
                    Videos.update({ Videos.id eq videoId }) {
                        with(SqlExpressionBuilder) {
                            it.update(likeCount, likeCount - 1)
                        }
                    }
                }
                true // indicates currently active
            }
        }
    }

    override suspend fun createComment(userId: UUID, videoId: UUID, content: String, parentId: UUID?): Comment = transaction {
        val id = UUID.randomUUID()
        val now = Instant.now()
        
        Comments.insert {
            it[this.id] = id
            it[this.userId] = userId
            it[this.videoId] = videoId
            it[this.parentId] = parentId
            it[this.content] = content
            it[createdAt] = now
            it[updatedAt] = now
        }
        
        Videos.update({ Videos.id eq videoId }) {
            with(SqlExpressionBuilder) {
                it.update(commentCount, commentCount + 1)
            }
        }
        
        val userRow = Users.select { Users.id eq userId }.single()
        
        Comment(
            id = id,
            videoId = videoId,
            user = User(
                id = userRow[Users.id].value.toString(),
                email = userRow[Users.email],
                username = userRow[Users.username],
                displayName = userRow[Users.displayName],
                avatarUrl = userRow[Users.avatarUrl],
                bio = userRow[Users.bio],
                isVerified = userRow[Users.isVerified],
                createdAt = userRow[Users.createdAt].toString()
            ),
            parentId = parentId,
            content = content,
            createdAt = now.toString(),
            updatedAt = now.toString()
        )
    }

    override suspend fun getComments(videoId: UUID, limit: Int, offset: Long): List<Comment> = transaction {
        Comments.innerJoin(Users)
            .select { Comments.videoId eq videoId }
            .orderBy(Comments.createdAt to SortOrder.DESC)
            .limit(limit, offset)
            .map { row ->
                Comment(
                    id = row[Comments.id].value,
                    videoId = row[Comments.videoId].value,
                    user = User(
                        id = row[Users.id].value.toString(),
                        email = row[Users.email],
                        username = row[Users.username],
                        displayName = row[Users.displayName],
                        avatarUrl = row[Users.avatarUrl],
                        bio = row[Users.bio],
                        isVerified = row[Users.isVerified],
                        createdAt = row[Users.createdAt].toString()
                    ),
                    parentId = row[Comments.parentId]?.value,
                    content = row[Comments.content],
                    createdAt = row[Comments.createdAt].toString(),
                    updatedAt = row[Comments.updatedAt].toString()
                )
            }
    }

    override suspend fun toggleSubscription(subscriberId: UUID, channelId: UUID): Boolean = transaction {
        val existing = Subscriptions.select { (Subscriptions.subscriberId eq subscriberId) and (Subscriptions.channelId eq channelId) }.singleOrNull()
        
        if (existing == null) {
            Subscriptions.insert {
                it[id] = UUID.randomUUID()
                it[this.subscriberId] = subscriberId
                it[this.channelId] = channelId
                it[createdAt] = Instant.now()
            }
            true
        } else {
            Subscriptions.deleteWhere { (Subscriptions.subscriberId eq subscriberId) and (Subscriptions.channelId eq channelId) }
            false
        }
    }

    override suspend fun addWatchHistory(userId: UUID, videoId: UUID): Unit = transaction {
        val existing = WatchHistory.select { (WatchHistory.userId eq userId) and (WatchHistory.videoId eq videoId) }.singleOrNull()
        
        val now = Instant.now()
        if (existing == null) {
            WatchHistory.insert {
                it[id] = UUID.randomUUID()
                it[this.userId] = userId
                it[this.videoId] = videoId
                it[watchedAt] = now
            }
        } else {
            WatchHistory.update({ (WatchHistory.userId eq userId) and (WatchHistory.videoId eq videoId) }) {
                it[watchedAt] = now
            }
        }
    }

    override suspend fun getWatchHistory(userId: UUID, limit: Int, offset: Long): List<WatchHistoryItem> = transaction {
        val rows = WatchHistory.select { WatchHistory.userId eq userId }
            .orderBy(WatchHistory.watchedAt to SortOrder.DESC)
            .limit(limit, offset)
            .toList()
            
        // For each row we need to fetch the video
        val videoIds = rows.map { it[WatchHistory.videoId].value }
        
        // Let's assume videoRepository.getVideoByIds exists or we fetch one by one
        // Better yet, just fetch them via innerJoin to Videos and Users
        // To keep it simple, since we already have videoRepository, we could just loop if not too many
        // But for performance, let's write a join
        
        val joinedRows = (WatchHistory innerJoin Videos innerJoin Users)
            .select { WatchHistory.userId eq userId }
            .orderBy(WatchHistory.watchedAt to SortOrder.DESC)
            .limit(limit, offset)
            .toList()
            
        joinedRows.map { row ->
            val uploader = ChannelPreview(
                id = row[Users.id].value.toString(),
                username = row[Users.username],
                displayName = row[Users.displayName],
                avatarUrl = row[Users.avatarUrl]
            )
            val video = VideoResponse(
                id = row[Videos.id].value,
                title = row[Videos.title],
                description = row[Videos.description],
                status = row[Videos.status],
                originalVideoKey = row[Videos.originalVideoKey],
                processedVideoKey = row[Videos.processedVideoKey],
                thumbnailUrl = row[Videos.thumbnailUrl],
                uploader = uploader,
                viewCount = row[Videos.viewCount],
                likeCount = row[Videos.likeCount],
                dislikeCount = row[Videos.dislikeCount],
                commentCount = row[Videos.commentCount],
                createdAt = row[Videos.createdAt].toString(),
                updatedAt = row[Videos.updatedAt].toString()
            )
            WatchHistoryItem(
                id = row[WatchHistory.id].value,
                video = video,
                watchedAt = row[WatchHistory.watchedAt].toString()
            )
        }
    }

    override suspend fun hasLiked(userId: UUID, videoId: UUID): Boolean = transaction {
        VideoLikes.select { (VideoLikes.userId eq userId) and (VideoLikes.videoId eq videoId) and (VideoLikes.isLike eq true) }.count() > 0
    }

    override suspend fun hasSubscribed(subscriberId: UUID, channelId: UUID): Boolean = transaction {
        Subscriptions.select { (Subscriptions.subscriberId eq subscriberId) and (Subscriptions.channelId eq channelId) }.count() > 0
    }
}
