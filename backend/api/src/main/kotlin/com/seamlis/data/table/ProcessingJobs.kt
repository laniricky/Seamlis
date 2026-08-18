package com.seamlis.data.table

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.javatime.datetime

/**
 * Processing jobs table tracks async video transcoding tasks.
 * status: QUEUED | PROCESSING | DONE | FAILED
 */
object ProcessingJobs : UUIDTable("processing_jobs") {
    val videoId = reference("video_id", Videos)
    val status = varchar("status", 50)
    val workerLog = text("worker_log").nullable()
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
}
