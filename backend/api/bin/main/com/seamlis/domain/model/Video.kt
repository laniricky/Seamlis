package com.seamlis.domain.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.UUID

object UUIDSerializer : KSerializer<UUID> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("UUID", PrimitiveKind.STRING)

    override fun serialize(
        encoder: Encoder,
        value: UUID,
    ) = encoder.encodeString(value.toString())

    override fun deserialize(decoder: Decoder): UUID = UUID.fromString(decoder.decodeString())
}

@Serializable
data class Video(
    @Serializable(with = UUIDSerializer::class)
    val id: UUID,
    val title: String,
    val description: String?,
    val status: String,
    val originalVideoKey: String?,
    val processedVideoKey: String?,
    val thumbnailUrl: String?,
    @Serializable(with = UUIDSerializer::class)
    val uploaderId: UUID,
    val createdAt: String,
    val updatedAt: String,
)

// Request/Response Models
@Serializable
data class CreateVideoRequest(
    val title: String,
    val description: String? = null,
)

@Serializable
data class VideoUploadResponse(
    val video: Video,
    // Pre-signed URL for client to upload directly to S3
    val uploadUrl: String,
)
