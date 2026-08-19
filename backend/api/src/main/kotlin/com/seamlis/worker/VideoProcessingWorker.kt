package com.seamlis.worker

import com.seamlis.service.FFmpegService
import com.seamlis.service.ProcessingWebhookPayload
import com.seamlis.service.ProcessingService
import com.seamlis.service.QUEUE_VIDEO_PROCESSING
import com.seamlis.service.RedisJobQueue
import com.seamlis.service.StorageService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import java.io.File
import java.nio.file.Files

class VideoProcessingWorker(
    private val queue: RedisJobQueue,
    private val storageService: StorageService,
    private val ffmpegService: FFmpegService,
    private val processingService: ProcessingService,
) {
    private val logger = LoggerFactory.getLogger(VideoProcessingWorker::class.java)
    private val rawBucket = "seamlis-raw"
    private val cdnBucket = "seamlis-media" // Using the same bucket for CDN for now in development

    fun start(scope: CoroutineScope) {
        scope.launch(Dispatchers.IO) {
            logger.info("VideoProcessingWorker started. Listening on $QUEUE_VIDEO_PROCESSING...")
            while (isActive) {
                try {
                    val job = queue.dequeue(QUEUE_VIDEO_PROCESSING, timeoutSeconds = 5)
                    if (job != null) {
                        logger.info("Picked up processing job for video ${job.videoId}")
                        processJob(job)
                    }
                } catch (e: Exception) {
                    logger.error("Error in VideoProcessingWorker loop", e)
                    delay(5000)
                }
            }
        }
    }

    private suspend fun processJob(job: com.seamlis.service.VideoProcessingJob) {
        // Create a temporary workspace
        val tempDir = Files.createTempDirectory("video_processing_${job.videoId}").toFile()
        try {
            val rawVideoFile = File(tempDir, "original.mp4")

            // 1. Download raw video from S3
            // Currently, the video upload route uses the default bucket (seamlis-media) for raw uploads
            // So we'll download it from there if that's where it is.
            logger.info("Downloading raw video from $cdnBucket / ${job.rawStorageKey}")
            storageService.downloadFile(
                bucket = cdnBucket,
                objectName = job.rawStorageKey,
                destFilename = rawVideoFile.absolutePath,
            )

            // 2. Validate & Extract metadata
            logger.info("Extracting metadata...")
            val duration = ffmpegService.getDurationSeconds(rawVideoFile)
            logger.info("Video duration: $duration seconds")

            // 3. Generate Thumbnails
            logger.info("Generating thumbnails...")
            val thumbDir = File(tempDir, "thumbnails")
            val thumbs = ffmpegService.generateThumbnails(rawVideoFile, duration, thumbDir)

            // 4. Transcode to HLS ladder
            logger.info("Transcoding to HLS...")
            val hlsDir = File(tempDir, "hls")
            val variants = mutableListOf<FFmpegService.HlsVariant>()

            // A simplified ladder logic for testing
            // 1080p
            ffmpegService.transcodeToHls(
                inputFile = rawVideoFile,
                resolutionLabel = "1080p",
                width = 1920,
                height = 1080,
                maxBitrate = "4500k",
                bufSize = "9000k",
                outputDir = File(hlsDir, "1080p"),
            )
            variants.add(FFmpegService.HlsVariant("1080p", 1920, 1080, 4500000, "4500k", "9000k"))

            // 720p
            ffmpegService.transcodeToHls(
                inputFile = rawVideoFile,
                resolutionLabel = "720p",
                width = 1280,
                height = 720,
                maxBitrate = "2500k",
                bufSize = "5000k",
                outputDir = File(hlsDir, "720p"),
            )
            variants.add(FFmpegService.HlsVariant("720p", 1280, 720, 2500000, "2500k", "5000k"))

            // 480p
            ffmpegService.transcodeToHls(
                inputFile = rawVideoFile,
                resolutionLabel = "480p",
                width = 854,
                height = 480,
                maxBitrate = "1200k",
                bufSize = "2400k",
                outputDir = File(hlsDir, "480p"),
            )
            variants.add(FFmpegService.HlsVariant("480p", 854, 480, 1200000, "1200k", "2400k"))

            // Master playlist
            logger.info("Generating master playlist...")
            val masterM3u8 = ffmpegService.generateMasterPlaylist(hlsDir, variants)

            // 5. Upload all to S3 CDN Bucket
            logger.info("Uploading processed assets to S3...")
            val baseProcessedKey = "videos/processed/${job.videoId}"

            // Upload HLS
            hlsDir.walkTopDown().filter { it.isFile }.forEach { file ->
                val relativePath = file.relativeTo(hlsDir).path.replace("\\", "/")
                val objectKey = "$baseProcessedKey/hls/$relativePath"
                val contentType = if (file.extension == "m3u8") "application/vnd.apple.mpegurl" else "video/MP2T"
                storageService.uploadFile(cdnBucket, objectKey, file.absolutePath, contentType)
            }

            // Upload Thumbnails
            val uploadedThumbnails = mutableListOf<String>()
            thumbs.forEach { thumbFile ->
                val objectKey = "$baseProcessedKey/thumbnails/${thumbFile.name}"
                storageService.uploadFile(cdnBucket, objectKey, thumbFile.absolutePath, "image/jpeg")
                uploadedThumbnails.add(objectKey)
            }

            // 6. Update Database using the webhook payload structure
            logger.info("Processing complete. Updating database...")
            val masterPlaylistKey = "$baseProcessedKey/hls/master.m3u8"
            processingService.handleWorkerCallback(
                ProcessingWebhookPayload(
                    videoId = job.videoId,
                    status = "DONE",
                    processedVideoKey = masterPlaylistKey,
                    thumbnailUrl = uploadedThumbnails.firstOrNull(),
                    workerLog = "Success: Generated ${variants.size} resolutions and ${thumbs.size} thumbnails.",
                )
            )

        } catch (e: Exception) {
            logger.error("Job failed for video ${job.videoId}", e)
            processingService.handleWorkerCallback(
                ProcessingWebhookPayload(
                    videoId = job.videoId,
                    status = "FAILED",
                    workerLog = e.message ?: "Unknown error"
                )
            )
        } finally {
            // Clean up
            tempDir.deleteRecursively()
        }
    }
}
