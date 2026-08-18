val ktorVersion: String by project
val kotlinVersion: String by project
val logbackVersion: String by project

plugins {
    kotlin("jvm") version "1.9.22"
    id("io.ktor.plugin") version "2.3.8"
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.22"
    id("org.jlleitschuh.gradle.ktlint") version "12.1.0"
}

group = "com.seamlis"
version = "0.0.1"

application {
    mainClass.set("com.seamlis.ApplicationKt")

    val isDevelopment: Boolean = project.ext.has("development")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:2.3.8")
    implementation("io.ktor:ktor-server-netty-jvm:2.3.8")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:2.3.8")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:2.3.8")
    implementation("io.ktor:ktor-server-auth-jvm:2.3.8")
    implementation("io.ktor:ktor-server-auth-jwt-jvm:2.3.8")
    implementation("io.ktor:ktor-server-cors-jvm:2.3.8")
    implementation("io.ktor:ktor-server-call-logging-jvm:2.3.8")
    implementation("ch.qos.logback:logback-classic:1.4.14")

    // Database
    implementation("org.jetbrains.exposed:exposed-core:0.47.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.47.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.47.0")
    implementation("org.postgresql:postgresql:42.7.1")
    implementation("com.zaxxer:HikariCP:5.1.0")
    implementation("org.flywaydb:flyway-core:10.8.1")
    implementation("org.flywaydb:flyway-database-postgresql:10.8.1")

    // Tests
    testImplementation("io.ktor:ktor-server-tests-jvm:2.3.8")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:1.9.22")

    // Security
    implementation("org.mindrot:jbcrypt:0.4")

    // Storage
    implementation("io.minio:minio:8.5.8")

    // Exposed extras
    implementation("org.jetbrains.exposed:exposed-java-time:0.47.0")
}

ktlint {
    version.set("1.1.1")
    verbose.set(true)
    outputToConsole.set(true)
    coloredOutput.set(true)
}
