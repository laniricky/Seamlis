package com.seamlis.service

import com.seamlis.data.table.CommunityPostLikes
import com.seamlis.data.table.CommunityPostOptions
import com.seamlis.data.table.CommunityPostVotes
import com.seamlis.data.table.CommunityPosts
import com.seamlis.data.table.Users
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

@Serializable
data class PollOptionResponse(
    val id: String,
    val text: String,
    val voteCount: Int,
    val percentage: Float,
    val votedByMe: Boolean
)

@Serializable
data class CommunityPostResponse(
    val id: String,
    val channelId: String,
    val channelName: String,
    val channelUsername: String,
    val channelAvatarUrl: String?,
    val type: String,
    val title: String?,
    val body: String?,
    val imageUrl: String?,
    val isPinned: Boolean,
    val likeCount: Int,
    val commentCount: Int,
    val likedByMe: Boolean,
    val pollOptions: List<PollOptionResponse>?,
    val totalVotes: Int,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreatePostRequest(
    val type: String = "TEXT",
    val title: String? = null,
    val body: String? = null,
    val imageUrl: String? = null,
    val pollOptions: List<String>? = null
)

class CommunityService {

    fun getChannelPosts(channelId: UUID, requesterId: UUID?, limit: Int = 20, offset: Long = 0): List<CommunityPostResponse> {
        return transaction {
            CommunityPosts
                .leftJoin(Users, { CommunityPosts.channelId }, { Users.id })
                .select { CommunityPosts.channelId eq channelId }
                .orderBy(CommunityPosts.isPinned to SortOrder.DESC, CommunityPosts.createdAt to SortOrder.DESC)
                .limit(limit, offset = offset)
                .map { row -> rowToResponse(row, requesterId) }
        }
    }

    fun getPost(postId: UUID, requesterId: UUID?): CommunityPostResponse? {
        return transaction {
            CommunityPosts
                .leftJoin(Users, { CommunityPosts.channelId }, { Users.id })
                .select { CommunityPosts.id eq postId }
                .singleOrNull()
                ?.let { row -> rowToResponse(row, requesterId) }
        }
    }

    fun createPost(channelId: UUID, req: CreatePostRequest): CommunityPostResponse {
        require(req.type in listOf("TEXT", "IMAGE", "POLL", "QUESTION", "ANNOUNCEMENT")) {
            "Invalid post type: ${req.type}"
        }
        if (req.type == "POLL") {
            require(!req.pollOptions.isNullOrEmpty() && req.pollOptions.size >= 2) {
                "Poll posts require at least 2 options"
            }
        }

        val postId = UUID.randomUUID()
        val now = Instant.now()

        transaction {
            CommunityPosts.insert {
                it[id] = postId
                it[this.channelId] = channelId
                it[type] = req.type
                it[title] = req.title
                it[body] = req.body
                it[imageUrl] = req.imageUrl
                it[isPinned] = false
                it[likeCount] = 0
                it[commentCount] = 0
                it[createdAt] = now
                it[updatedAt] = now
            }

            if (req.type == "POLL" && !req.pollOptions.isNullOrEmpty()) {
                req.pollOptions.forEachIndexed { index, optionText ->
                    CommunityPostOptions.insert {
                        it[id] = UUID.randomUUID()
                        it[this.postId] = postId
                        it[text] = optionText
                        it[voteCount] = 0
                        it[position] = index
                    }
                }
            }
        }

        return getPost(postId, channelId)!!
    }

    fun deletePost(channelId: UUID, postId: UUID): Boolean {
        return transaction {
            val deleted = CommunityPosts.deleteWhere {
                (CommunityPosts.id eq postId) and (CommunityPosts.channelId eq channelId)
            }
            deleted > 0
        }
    }

    fun toggleLike(userId: UUID, postId: UUID): Boolean {
        return transaction {
            val exists = CommunityPostLikes.select {
                (CommunityPostLikes.userId eq userId) and (CommunityPostLikes.postId eq postId)
            }.count() > 0

            if (exists) {
                CommunityPostLikes.deleteWhere {
                    (CommunityPostLikes.userId eq userId) and (CommunityPostLikes.postId eq postId)
                }
                CommunityPosts.update({ CommunityPosts.id eq postId }) {
                    with(SqlExpressionBuilder) {
                        it.update(likeCount, likeCount - 1)
                    }
                }
                false // unliked
            } else {
                CommunityPostLikes.insert {
                    it[this.userId] = userId
                    it[this.postId] = postId
                    it[createdAt] = Instant.now()
                }
                CommunityPosts.update({ CommunityPosts.id eq postId }) {
                    with(SqlExpressionBuilder) {
                        it.update(likeCount, likeCount + 1)
                    }
                }
                true // liked
            }
        }
    }

    fun voteOnPoll(userId: UUID, postId: UUID, optionId: UUID): Boolean {
        return transaction {
            // Check if already voted
            val alreadyVoted = CommunityPostVotes.select {
                (CommunityPostVotes.userId eq userId) and (CommunityPostVotes.postId eq postId)
            }.count() > 0

            if (alreadyVoted) return@transaction false

            // Verify option belongs to this post
            val validOption = CommunityPostOptions.select {
                (CommunityPostOptions.id eq optionId) and (CommunityPostOptions.postId eq postId)
            }.count() > 0

            if (!validOption) return@transaction false

            // Record vote
            CommunityPostVotes.insert {
                it[this.userId] = userId
                it[this.postId] = postId
                it[this.optionId] = optionId
                it[votedAt] = Instant.now()
            }

            // Increment option vote count
            CommunityPostOptions.update({ CommunityPostOptions.id eq optionId }) {
                with(SqlExpressionBuilder) {
                    it.update(voteCount, voteCount + 1)
                }
            }

            true
        }
    }

    private fun rowToResponse(row: ResultRow, requesterId: UUID?): CommunityPostResponse {
        val postId = row[CommunityPosts.id]

        // Fetch poll options if this is a POLL post
        val pollOptions = if (row[CommunityPosts.type] == "POLL") {
            val options = CommunityPostOptions
                .select { CommunityPostOptions.postId eq postId }
                .orderBy(CommunityPostOptions.position to SortOrder.ASC)
                .map { it }

            val totalVotes = options.sumOf { it[CommunityPostOptions.voteCount] }

            // Find which option the requester voted for
            val myVoteOptionId = if (requesterId != null) {
                CommunityPostVotes.select {
                    (CommunityPostVotes.userId eq requesterId) and (CommunityPostVotes.postId eq postId)
                }.singleOrNull()?.get(CommunityPostVotes.optionId)
            } else null

            options.map { opt ->
                val votes = opt[CommunityPostOptions.voteCount]
                val pct = if (totalVotes > 0) votes.toFloat() / totalVotes * 100f else 0f
                PollOptionResponse(
                    id = opt[CommunityPostOptions.id].toString(),
                    text = opt[CommunityPostOptions.text],
                    voteCount = votes,
                    percentage = pct,
                    votedByMe = myVoteOptionId == opt[CommunityPostOptions.id]
                )
            }
        } else null

        val totalVotes = pollOptions?.sumOf { it.voteCount } ?: 0

        val likedByMe = if (requesterId != null) {
            CommunityPostLikes.select {
                (CommunityPostLikes.userId eq requesterId) and (CommunityPostLikes.postId eq postId)
            }.count() > 0
        } else false

        return CommunityPostResponse(
            id = postId.toString(),
            channelId = row[CommunityPosts.channelId].value.toString(),
            channelName = row[Users.displayName],
            channelUsername = row[Users.username],
            channelAvatarUrl = row[Users.avatarUrl],
            type = row[CommunityPosts.type],
            title = row[CommunityPosts.title],
            body = row[CommunityPosts.body],
            imageUrl = row[CommunityPosts.imageUrl],
            isPinned = row[CommunityPosts.isPinned],
            likeCount = row[CommunityPosts.likeCount],
            commentCount = row[CommunityPosts.commentCount],
            likedByMe = likedByMe,
            pollOptions = pollOptions,
            totalVotes = totalVotes,
            createdAt = row[CommunityPosts.createdAt].toString(),
            updatedAt = row[CommunityPosts.updatedAt].toString()
        )
    }
}
