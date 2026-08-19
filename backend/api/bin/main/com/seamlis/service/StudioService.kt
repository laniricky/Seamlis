package com.seamlis.service

import com.seamlis.data.table.Subscriptions
import com.seamlis.data.table.VideoLikes
import com.seamlis.data.table.Videos
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.innerJoin
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.sum
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

@Serializable
data class ChannelStatsResponse(
    val totalViews: Long,
    val totalSubscribers: Long,
    val totalLikes: Long,
)

class StudioService {
    fun getChannelStats(userId: UUID): ChannelStatsResponse {
        return transaction {
            // 1. Total Views & Likes across all videos uploaded by this user
            var views = 0L
            var likes = 0L
            
            val viewSumExp = Videos.viewCount.sum()
            val likeSumExp = Videos.likeCount.sum()

            // Calculate aggregate stats directly
            val statsRow = Videos.slice(viewSumExp, likeSumExp)
                .select { Videos.uploaderId eq userId }
                .singleOrNull()

            if (statsRow != null) {
                views = statsRow[viewSumExp] ?: 0L
                likes = (statsRow[likeSumExp] ?: 0).toLong()
            }

            // 2. Total Subscribers
            val subs = Subscriptions.select { Subscriptions.channelId eq userId }.count()

            ChannelStatsResponse(
                totalViews = views,
                totalSubscribers = subs,
                totalLikes = likes
            )
        }
    }
}
