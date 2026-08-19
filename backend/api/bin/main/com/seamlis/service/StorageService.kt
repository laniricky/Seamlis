package com.seamlis.service

import io.minio.BucketExistsArgs
import io.minio.DownloadObjectArgs
import io.minio.GetPresignedObjectUrlArgs
import io.minio.MakeBucketArgs
import io.minio.MinioClient
import io.minio.UploadObjectArgs
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
            
            // Set public read policy so frontend can download HLS streams
            val policyJson = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": {"AWS": ["*"]},
                      "Action": ["s3:GetObject"],
                      "Resource": ["arn:aws:s3:::$bucketName/*"]
                    }
                  ]
                }
            """.trimIndent()
            
            minioClient.setBucketPolicy(
                io.minio.SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policyJson)
                    .build()
            )
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

    /**
     * Downloads an object to a local file.
     */
    fun downloadFile(
        bucket: String,
        objectName: String,
        destFilename: String,
    ) {
        minioClient.downloadObject(
            DownloadObjectArgs.builder()
                .bucket(bucket)
                .`object`(objectName)
                .filename(destFilename)
                .build(),
        )
    }

    /**
     * Uploads a local file to the given bucket.
     */
    fun uploadFile(
        bucket: String,
        objectName: String,
        filename: String,
        contentType: String,
    ) {
        minioClient.uploadObject(
            UploadObjectArgs.builder()
                .bucket(bucket)
                .`object`(objectName)
                .filename(filename)
                .contentType(contentType)
                .build(),
        )
    }
}
