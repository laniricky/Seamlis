package com.seamlis.api.routes

import com.seamlis.service.SearchService
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.searchRoutes(searchService: SearchService) {
    route("/api/v1/search") {
        get {
            val q = call.request.queryParameters["q"] ?: ""
            if (q.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Search query is required"))
                return@get
            }

            val type = call.request.queryParameters["type"] ?: "all"
            val sort = call.request.queryParameters["sort"] ?: "relevance"
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
            val offset = call.request.queryParameters["offset"]?.toLongOrNull() ?: 0L

            try {
                val results = searchService.search(q, type, sort, limit, offset)
                call.respond(HttpStatusCode.OK, results)
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to (e.message ?: "Invalid request")))
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Internal server error"))
            }
        }
    }
}
