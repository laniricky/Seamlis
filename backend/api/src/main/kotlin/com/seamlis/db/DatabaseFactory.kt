package com.seamlis.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database

object DatabaseFactory {
    fun init(environment: ApplicationEnvironment) {
        val config = environment.config

        val jdbcUrl = config.property("db.jdbcUrl").getString()
        val user = config.property("db.user").getString()
        val password = config.property("db.password").getString()
        val maxPoolSize = config.propertyOrNull("db.maxPoolSize")?.getString()?.toInt() ?: 10

        // Run Flyway migrations first
        val flyway =
            Flyway.configure()
                .dataSource(jdbcUrl, user, password)
                .locations("classpath:db/migration")
                .load()
        flyway.migrate()

        // Set up HikariCP connection pool
        val hikariConfig =
            HikariConfig().apply {
                this.jdbcUrl = jdbcUrl
                this.username = user
                this.password = password
                this.maximumPoolSize = maxPoolSize
                this.isAutoCommit = false
                this.transactionIsolation = "TRANSACTION_REPEATABLE_READ"
                validate()
            }

        Database.connect(HikariDataSource(hikariConfig))
    }
}
