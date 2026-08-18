package com.seamlis.service

import com.seamlis.data.repository.VideoRepository
import com.seamlis.data.table.ProcessingJobs
import com.seamlis.data.table.Videos
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.insertAndGetId
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime
import java.util.UUID

@Serializable
data class ProcessingWebhookPayload(
    val videoId: String,
    // DONE | FAILED
    val status: String,
    val processedVideoKey: String? = null,
    val thumbnailUrl: String? = null,
    val workerLog: String? = null,
)

class ProcessingService(
    private val videoRepository: VideoRepository,
) {
    /**
     * Called when the backend receives an upload-complete notification from the client.
     * Creates a processing job record and marks the video as PROCESSING.
     */
    fun enqueueProcessing(videoId: UUID): UUID {
        return transaction {
            // Mark video as PROCESSING
            Videos.update({ Videos.id eq videoId }) {
                it[status] = "PROCESSING"
                it[updatedAt] = LocalDateTime.now()
            }

            // Create job record
            val jobId =
                ProcessingJobs.insertAndGetId {
                    it[this.videoId] = videoId
                    it[this.status] = "QUEUED"
                    it[this.createdAt] = LocalDateTime.now()
                    it[this.updatedAt] = LocalDateTime.now()
                }

            jobId.value
        }
    }

    /**
     * Handles a callback from the video worker (FFmpeg) indicating completion or failure.
     */
    fun handleWorkerCallback(payload: ProcessingWebhookPayload) {
        val videoId = UUID.fromString(payload.videoId)
        transaction {
            val newStatus = if (payload.status == "DONE") "READY" else "FAILED"

            Videos.update({ Videos.id eq videoId }) {
                it[status] = newStatus
                if (payload.processedVideoKey != null) it[processedVideoKey] = payload.processedVideoKey
                if (payload.thumbnailUrl != null) it[thumbnailUrl] = payload.thumbnailUrl
                it[updatedAt] = LocalDateTime.now()
            }

            // Update job record
            ProcessingJobs.update({ ProcessingJobs.videoId eq videoId }) {
                it[status] = payload.status
                it[workerLog] = payload.workerLog
                it[updatedAt] = LocalDateTime.now()
            }
        }
    }
}
