package com.seamlis.service

import com.seamlis.data.repository.UserRepository
import com.seamlis.data.repository.VideoRepository
import com.seamlis.domain.model.User
import com.seamlis.domain.model.VideoResponse
import kotlinx.serialization.Serializable

@Serializable
data class SearchResults(
    val videos: List<VideoResponse>,
    val channels: List<User>,
    val totalVideos: Int,
    val totalChannels: Int,
    val query: String,
    val sort: String,
    val type: String,
)

class SearchService(
    private val videoRepository: VideoRepository,
    private val userRepository: UserRepository,
) {
    companion object {
        private val ALLOWED_SORTS = setOf("relevance", "views", "newest", "oldest")
        private val ALLOWED_TYPES = setOf("all", "video", "channel")
    }

    fun search(
        query: String,
        type: String = "all",
        sort: String = "relevance",
        limit: Int = 20,
        offset: Long = 0,
    ): SearchResults {
        val trimmedQuery = query.trim()
        require(trimmedQuery.length >= 1) { "Search query must not be empty" }
        require(trimmedQuery.length <= 200) { "Search query too long" }

        val safeSort = if (sort in ALLOWED_SORTS) sort else "relevance"
        val safeType = if (type in ALLOWED_TYPES) type else "all"
        val safeLimit = limit.coerceIn(1, 50)

        val videos = if (safeType == "all" || safeType == "video") {
            videoRepository.searchVideos(trimmedQuery, safeSort, safeLimit, offset)
        } else emptyList()

        val channels = if (safeType == "all" || safeType == "channel") {
            userRepository.searchUsers(trimmedQuery, safeLimit, offset)
        } else emptyList()

        return SearchResults(
            videos = videos,
            channels = channels,
            totalVideos = videos.size,
            totalChannels = channels.size,
            query = trimmedQuery,
            sort = safeSort,
            type = safeType,
        )
    }
}
