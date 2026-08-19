package com.seamlis.data.repository

import com.seamlis.data.table.Users
import com.seamlis.data.table.Videos
import com.seamlis.domain.model.ChannelPreview
import com.seamlis.domain.model.Video
import com.seamlis.domain.model.VideoResponse
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.util.UUID

interface VideoRepository {
    fun createVideo(
        title: String,
        description: String?,
        uploaderId: UUID,
        originalVideoKey: String,
        isShort: Boolean = false,
    ): Video

    fun getVideo(id: UUID): Video?
    
    fun getVideoDetails(id: UUID): VideoResponse?

    fun listVideos(status: String? = null, limit: Int = 50): List<Video>
    
    fun getFeedVideos(status: String? = null, limit: Int = 50, offset: Long = 0): List<VideoResponse>
    
    fun getShortsFeed(status: String? = null, limit: Int = 20, offset: Long = 0): List<VideoResponse>

    fun getStudioVideos(uploaderId: UUID, limit: Int = 50, offset: Long = 0): List<VideoResponse>

    fun searchVideos(query: String, sort: String = "relevance", limit: Int = 20, offset: Long = 0): List<VideoResponse>

    fun incrementViewCount(id: UUID): Boolean

    fun updateStatus(
        id: UUID,
        status: String,
    ): Boolean

    fun updateProcessedInfo(
        id: UUID,
        processedVideoKey: String,
        thumbnailUrl: String?,
    ): Boolean
    
    fun updateVideo(id: UUID, title: String, description: String?): Boolean
    
    fun deleteVideo(id: UUID, uploaderId: UUID): Boolean
}

class VideoRepositoryImpl : VideoRepository {
    override fun createVideo(
        title: String,
        description: String?,
        uploaderId: UUID,
        originalVideoKey: String,
        isShort: Boolean,
    ): Video {
        return transaction {
            val id =
                Videos.insertAndGetId {
                    it[this.title] = title
                    it[this.description] = description
                    it[this.status] = "UPLOADING"
                    it[this.originalVideoKey] = originalVideoKey
                    it[this.uploaderId] = uploaderId
                    it[this.isShort] = isShort
                    it[this.createdAt] = LocalDateTime.now()
                    it[this.updatedAt] = LocalDateTime.now()
                }
            getVideo(id.value)!!
        }
    }

    override fun getVideo(id: UUID): Video? {
        return transaction {
            Videos.select { Videos.id eq id }.singleOrNull()?.let { rowToVideo(it) }
        }
    }

    override fun getVideoDetails(id: UUID): VideoResponse? {
        return transaction {
            Videos.innerJoin(Users)
                .select { Videos.id eq id }
                .singleOrNull()
                ?.let { rowToVideoResponse(it) }
        }
    }

    override fun listVideos(status: String?, limit: Int): List<Video> {
        return transaction {
            val query = if (status != null) Videos.select { Videos.status eq status } else Videos.selectAll()
            query.orderBy(Videos.createdAt, SortOrder.DESC).limit(limit).map { rowToVideo(it) }
        }
    }

    override fun getFeedVideos(status: String?, limit: Int, offset: Long): List<VideoResponse> {
        return transaction {
            val query = Videos.innerJoin(Users).select { Videos.isShort eq false }
            if (status != null) {
                query.andWhere { Videos.status eq status }
            }
            query.orderBy(Videos.createdAt, SortOrder.DESC)
                .limit(limit, offset)
                .map { rowToVideoResponse(it) }
        }
    }

    override fun getShortsFeed(status: String?, limit: Int, offset: Long): List<VideoResponse> {
        return transaction {
            val query = Videos.innerJoin(Users).select { Videos.isShort eq true }
            if (status != null) {
                query.andWhere { Videos.status eq status }
            }
            query.orderBy(Videos.createdAt, SortOrder.DESC)
                .limit(limit, offset)
                .map { rowToVideoResponse(it) }
        }
    }

    override fun getStudioVideos(uploaderId: UUID, limit: Int, offset: Long): List<VideoResponse> {
        return transaction {
            Videos.innerJoin(Users)
                .select { Videos.uploaderId eq uploaderId }
                .orderBy(Videos.createdAt, SortOrder.DESC)
                .limit(limit, offset)
                .map { rowToVideoResponse(it) }
        }
    }

    override fun updateStatus(
        id: UUID,
        status: String,
    ): Boolean {
        return transaction {
            Videos.update({ Videos.id eq id }) {
                it[this.status] = status
                it[this.updatedAt] = LocalDateTime.now()
            } > 0
        }
    }

    override fun updateProcessedInfo(
        id: UUID,
        processedVideoKey: String,
        thumbnailUrl: String?,
    ): Boolean {
        return transaction {
            Videos.update({ Videos.id eq id }) {
                it[this.processedVideoKey] = processedVideoKey
                it[this.thumbnailUrl] = thumbnailUrl
                it[this.status] = "READY"
                it[this.updatedAt] = LocalDateTime.now()
            } > 0
        }
    }

    override fun searchVideos(query: String, sort: String, limit: Int, offset: Long): List<VideoResponse> {
        return transaction {
            val pattern = "%${query.trim()}%"
            val q = Videos.innerJoin(Users)
                .select {
                    (Videos.title.lowerCase() like pattern.lowercase()) or
                    (Videos.description.lowerCase() like pattern.lowercase())
                }
                .andWhere { Videos.status eq "READY" }
            when (sort) {
                "views" -> q.orderBy(Videos.viewCount, SortOrder.DESC)
                "newest" -> q.orderBy(Videos.createdAt, SortOrder.DESC)
                "oldest" -> q.orderBy(Videos.createdAt, SortOrder.ASC)
                else -> q.orderBy(Videos.viewCount, SortOrder.DESC) // relevance fallback
            }
            q.limit(limit, offset).map { rowToVideoResponse(it) }
        }
    }

    override fun incrementViewCount(id: UUID): Boolean {
        return transaction {
            val current = Videos.select { Videos.id eq id }.singleOrNull()?.get(Videos.viewCount) ?: return@transaction false
            Videos.update({ Videos.id eq id }) {
                it[this.viewCount] = current + 1
            } > 0
        }
    }

    override fun updateVideo(id: UUID, title: String, description: String?): Boolean {
        return transaction {
            Videos.update({ Videos.id eq id }) {
                it[this.title] = title
                it[this.description] = description
                it[this.updatedAt] = LocalDateTime.now()
            } > 0
        }
    }

    override fun deleteVideo(id: UUID, uploaderId: UUID): Boolean {
        return transaction {
            Videos.deleteWhere { SqlExpressionBuilder.run { (Videos.id eq id) and (Videos.uploaderId eq uploaderId) } } > 0
        }
    }

    private fun rowToVideo(row: ResultRow): Video =
        Video(
            id = row[Videos.id].value,
            title = row[Videos.title],
            description = row[Videos.description],
            status = row[Videos.status],
            originalVideoKey = row[Videos.originalVideoKey],
            processedVideoKey = row[Videos.processedVideoKey],
            thumbnailUrl = row[Videos.thumbnailUrl],
            isShort = row[Videos.isShort],
            viewCount = row[Videos.viewCount],
            likeCount = row[Videos.likeCount],
            dislikeCount = row[Videos.dislikeCount],
            commentCount = row[Videos.commentCount],
            uploaderId = row[Videos.uploaderId].value,
            createdAt = row[Videos.createdAt].toString(),
            updatedAt = row[Videos.updatedAt].toString(),
        )

    private fun rowToVideoResponse(row: ResultRow): VideoResponse =
        VideoResponse(
            id = row[Videos.id].value,
            title = row[Videos.title],
            description = row[Videos.description],
            status = row[Videos.status],
            originalVideoKey = row[Videos.originalVideoKey],
            processedVideoKey = row[Videos.processedVideoKey],
            thumbnailUrl = row[Videos.thumbnailUrl],
            isShort = row[Videos.isShort],
            viewCount = row[Videos.viewCount],
            likeCount = row[Videos.likeCount],
            dislikeCount = row[Videos.dislikeCount],
            commentCount = row[Videos.commentCount],
            uploader = ChannelPreview(
                id = row[Users.id].value.toString(),
                username = row[Users.username],
                displayName = row[Users.displayName],
                avatarUrl = row[Users.avatarUrl],
            ),
            createdAt = row[Videos.createdAt].toString(),
            updatedAt = row[Videos.updatedAt].toString(),
        )
}
