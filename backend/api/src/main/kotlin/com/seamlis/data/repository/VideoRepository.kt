package com.seamlis.data.repository

import com.seamlis.data.table.Videos
import com.seamlis.domain.model.Video
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
    ): Video

    fun getVideo(id: UUID): Video?

    fun updateStatus(
        id: UUID,
        status: String,
    ): Boolean
}

class VideoRepositoryImpl : VideoRepository {
    override fun createVideo(
        title: String,
        description: String?,
        uploaderId: UUID,
        originalVideoKey: String,
    ): Video {
        return transaction {
            val id =
                Videos.insertAndGetId {
                    it[this.title] = title
                    it[this.description] = description
                    it[this.status] = "UPLOADING"
                    it[this.originalVideoKey] = originalVideoKey
                    it[this.uploaderId] = uploaderId
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

    private fun rowToVideo(row: ResultRow): Video =
        Video(
            id = row[Videos.id].value,
            title = row[Videos.title],
            description = row[Videos.description],
            status = row[Videos.status],
            originalVideoKey = row[Videos.originalVideoKey],
            processedVideoKey = row[Videos.processedVideoKey],
            thumbnailUrl = row[Videos.thumbnailUrl],
            uploaderId = row[Videos.uploaderId].value,
            createdAt = row[Videos.createdAt].toString(),
            updatedAt = row[Videos.updatedAt].toString(),
        )
}
