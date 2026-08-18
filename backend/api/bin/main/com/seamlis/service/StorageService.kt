package com.seamlis.service

import io.minio.BucketExistsArgs
import io.minio.GetPresignedObjectUrlArgs
import io.minio.MakeBucketArgs
import io.minio.MinioClient
import io.minio.http.Method
import java.util.concurrent.TimeUnit

class StorageService(
    endpoint: String,
    accessKey: String,
    secretKey: String,
    private val bucketName: String,
) {
    private val minioClient =
        MinioClient.builder()
            .endpoint(endpoint)
            .credentials(accessKey, secretKey)
            .build()

    init {
        // Ensure bucket exists
        val found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())
        if (!found) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build())
        }
    }

    /**
     * Generates a pre-signed URL for uploading a video object directly from the client.
     */
    fun generateUploadUrl(
        objectName: String,
        expiryMinutes: Int = 15,
    ): String {
        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.PUT)
                .bucket(bucketName)
                .`object`(objectName)
                .expiry(expiryMinutes, TimeUnit.MINUTES)
                .build(),
        )
    }

    /**
     * Generates a public URL for accessing the object (assuming bucket policy allows it, or via pre-signed GET)
     */
    fun generateDownloadUrl(
        objectName: String,
        expiryMinutes: Int = 60 * 24 * 7,
    ): String {
        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucketName)
                .`object`(objectName)
                .expiry(expiryMinutes, TimeUnit.MINUTES)
                .build(),
        )
    }
}
