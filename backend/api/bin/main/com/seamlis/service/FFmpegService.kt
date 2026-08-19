package com.seamlis.service

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.TimeUnit

class FFmpegService {
    /**
     * Extracts the duration of a video in seconds using ffprobe.
     */
    suspend fun getDurationSeconds(inputFile: File): Double =
        withContext(Dispatchers.IO) {
            val process =
                ProcessBuilder(
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    inputFile.absolutePath,
                ).start()
            val output = process.inputStream.bufferedReader().readText().trim()
            process.waitFor(10, TimeUnit.SECONDS)
            output.toDoubleOrNull() ?: throw Exception("Failed to get duration: $output")
        }

    /**
     * Extracts thumbnails at 10%, 50%, and 90% of the video duration.
     * Returns a list of generated thumbnail files.
     */
    suspend fun generateThumbnails(
        inputFile: File,
        durationSeconds: Double,
        outputDir: File,
    ): List<File> =
        withContext(Dispatchers.IO) {
            outputDir.mkdirs()
            val percentages = listOf(0.1, 0.5, 0.9)
            val thumbnailFiles = mutableListOf<File>()

            // We can run these in parallel
            val jobs =
                percentages.mapIndexed { index, percent ->
                    async {
                        val timestamp = durationSeconds * percent
                        val outputFile = File(outputDir, "auto_00${index + 1}.jpg")
                        val process =
                            ProcessBuilder(
                                "ffmpeg",
                                "-y",
                                "-ss",
                                timestamp.toString(),
                                "-i",
                                inputFile.absolutePath,
                                "-vf",
                                "thumbnail=300,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
                                "-frames:v",
                                "1",
                                outputFile.absolutePath,
                            ).redirectErrorStream(true).start()

                        val log = process.inputStream.bufferedReader().readText()
                        val exitCode = process.waitFor()
                        if (exitCode != 0) {
                            throw Exception("FFmpeg thumbnail generation failed: $log")
                        }
                        outputFile
                    }
                }
            jobs.awaitAll()
        }

    /**
     * Transcodes the input video to a specific resolution and generates HLS segments.
     * Generates a folder with an index.m3u8 and .ts segments.
     */
    suspend fun transcodeToHls(
        inputFile: File,
        resolutionLabel: String,
        width: Int,
        height: Int,
        maxBitrate: String,
        bufSize: String,
        outputDir: File,
    ): File =
        withContext(Dispatchers.IO) {
            outputDir.mkdirs()
            val playlistFile = File(outputDir, "index.m3u8")
            val segmentPattern = File(outputDir, "segment_%04d.ts").absolutePath

            val process =
                ProcessBuilder(
                    "ffmpeg",
                    "-y",
                    "-i",
                    inputFile.absolutePath,
                    "-vf",
                    "scale=$width:$height:force_original_aspect_ratio=decrease,pad=$width:$height:(ow-iw)/2:(oh-ih)/2",
                    "-c:v",
                    "libx264",
                    "-preset",
                    "veryfast", // Using veryfast instead of slow to speed up local testing
                    "-crf",
                    "22",
                    "-maxrate",
                    maxBitrate,
                    "-bufsize",
                    bufSize,
                    "-profile:v",
                    "high",
                    "-level",
                    "4.1",
                    "-g",
                    "48",
                    "-sc_threshold",
                    "0",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    "-ac",
                    "2",
                    "-ar",
                    "48000",
                    "-hls_time",
                    "6",
                    "-hls_playlist_type",
                    "vod",
                    "-hls_segment_filename",
                    segmentPattern,
                    "-hls_flags",
                    "independent_segments",
                    playlistFile.absolutePath,
                ).redirectErrorStream(true).start()

            val log = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor()
            if (exitCode != 0) {
                throw Exception("FFmpeg HLS transcoding to $resolutionLabel failed: $log")
            }
            playlistFile
        }

    /**
     * Generates the master m3u8 playlist.
     */
    fun generateMasterPlaylist(
        outputDir: File,
        variants: List<HlsVariant>,
    ): File {
        outputDir.mkdirs()
        val masterFile = File(outputDir, "master.m3u8")
        val content = buildString {
            appendLine("#EXTM3U")
            appendLine("#EXT-X-VERSION:3")
            variants.forEach { variant ->
                appendLine()
                appendLine("#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.width}x${variant.height},CODECS=\"avc1.640028,mp4a.40.2\"")
                appendLine("${variant.resolutionLabel}/index.m3u8")
            }
        }
        masterFile.writeText(content)
        return masterFile
    }

    data class HlsVariant(
        val resolutionLabel: String,
        val width: Int,
        val height: Int,
        val bandwidth: Int,
        val maxBitrate: String,
        val bufSize: String,
    )
}
