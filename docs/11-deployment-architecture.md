# Seamlis — Deployment Architecture

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Deployment Principles

- **Containerized** — Everything runs in Docker containers (no raw metal dependencies)
- **Immutable Infrastructure** — Containers are built once in CI, promoted through environments
- **Environment Parity** — Dev, Staging, and Prod use the same Dockerfiles
- **Zero Downtime Deployments** — Blue/Green or rolling updates
- **Configuration via Environment** — 12-Factor app methodology
- **Start Simple** — Docker Compose for early phases; Kubernetes reserved for scale

---

## 2. Environments

| Environment | Purpose | Access | Scale |
|-------------|---------|--------|-------|
| **Local** | Developer workstation | Localhost | Single instance per service |
| **Development** | CI branch testing | Internal team | Single instance, minimal resources |
| **Staging** | Pre-production validation | Internal team + beta users | Prod-like, downscaled |
| **Production** | Live user traffic | Public | Fully scaled, highly available |

---

## 3. Infrastructure Topology

### 3.1 Network Architecture

```
                          ┌────────────────────────┐
                          │     Internet / Users    │
                          └──────────┬─────────────┘
                                     │
                          ┌──────────▼─────────────┐
                          │    Cloudflare Edge      │
                          │   (WAF, DDoS, Cache)    │
                          └──────────┬─────────────┘
                                     │
                          ┌──────────▼─────────────┐
                          │   Cloud Load Balancer   │
                          │   (SSL Termination)     │
                          └──────────┬─────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
          ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
          │  Web App    │     │  Web App    │     │  Web App    │
          │  Container  │     │  Container  │     │  Container  │
          └─────────────┘     └─────────────┘     └─────────────┘
                 │                   │                   │
          ┌──────▼───────────────────▼───────────────────▼──────┐
          │                  Internal Load Balancer               │
          └──────────────────────────┬──────────────────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
          ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
          │   API       │     │   API       │     │   API       │
          │   Container │     │   Container │     │   Container │
          └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
                 │                   │                   │
    ┌────────────┼───────────────────┼───────────────────┼────────────┐
    │            │                   │                   │            │
    ▼            ▼                   ▼                   ▼            ▼
┌───────┐   ┌─────────┐         ┌─────────┐         ┌─────────┐   ┌───────┐
│ Redis │   │   DB    │         │ Worker  │         │ Worker  │   │ Object│
│ Cache │   │ Cluster │         │ Process │         │ Process │   │ Store │
└───────┘   └─────────┘         └─────────┘         └─────────┘   └───────┘
```

### 3.2 Service Components

1. **Web App (Next.js):** Stateless Node.js containers rendering the UI
2. **API (Ktor):** Stateless JVM containers handling business logic
3. **Processing Workers (Kotlin + FFmpeg):** Dedicated compute-heavy containers
4. **Database (PostgreSQL):** Managed service (e.g., RDS, Neon) or containerized with volumes
5. **Cache/Queue (Redis):** Managed service or containerized
6. **Object Storage:** Managed service (S3/R2/MinIO)

---

## 4. Local Development Environment

**Tooling:** `docker-compose.yml`

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: local_password
      POSTGRES_DB: seamlis
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7
    ports: ["6379:6379"]

  s3:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]

  api:
    build:
      context: ./backend
    environment:
      - DATABASE_URL=jdbc:postgresql://db:5432/seamlis
      - REDIS_URL=redis://redis:6379
      - S3_URL=http://s3:9000
    ports: ["8080:8080"]
    depends_on: ["db", "redis", "s3"]

  worker:
    build:
      context: ./backend
      target: worker
    environment:
      - REDIS_URL=redis://redis:6379
      - S3_URL=http://s3:9000
    depends_on: ["redis", "s3"]

  web:
    build:
      context: ./apps/web
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
    ports: ["3000:3000"]
```

---

## 5. CI/CD Pipeline

**Tooling:** GitHub Actions (or GitLab CI)

### 5.1 Pull Request Pipeline

```
1. Checkout code
2. Check formatting (Prettier, Ktlint)
3. Lint code (ESLint, detekt)
4. Run Unit Tests (Web, API)
5. Run Integration Tests (requires ephemeral DB container)
6. Report test coverage
```

### 5.2 Main Branch Pipeline (Staging Deploy)

```
1. Run PR checks
2. Build Web Docker Image → tag with SHA
3. Build API Docker Image → tag with SHA
4. Build Worker Docker Image → tag with SHA
5. Push images to Container Registry
6. Run database migrations (Flyway) against Staging DB
7. Deploy containers to Staging environment
8. Run Smoke Tests against Staging URL
```

### 5.3 Release Pipeline (Production Deploy)

```
1. Triggered via git tag (e.g., v1.2.0) or manual approval
2. Pull images by SHA from registry, re-tag as release
3. Backup Production Database
4. Run database migrations (Flyway) against Prod DB
5. Deploy Web, API, Worker (rolling update)
6. Health checks passing → traffic cutover complete
7. Slack notification: Deploy successful
```

---

## 6. Observability

### 6.1 Logging Strategy

- **Format:** Structured JSON on `stdout`/`stderr`
- **Collector:** Fluentbit or Promtail
- **Storage:** Loki, Elasticsearch, or CloudWatch
- **Context:** Every log entry includes `requestId`, `userId` (if auth'd), `timestamp`, `level`

### 6.2 Metrics Strategy

- **Format:** Prometheus format (`/metrics` endpoint on API/Web)
- **Scraper:** Prometheus server
- **Dashboard:** Grafana
- **Key Metrics to Graph:**
  - HTTP request rate, error rate (4xx/5xx), latency (P90, P99)
  - Active sessions
  - Video processing queue length, job duration, failure rate
  - Database connection pool utilization
  - CPU/Memory per container

### 6.3 Tracing Strategy

- **Protocol:** OpenTelemetry
- **Headers:** `traceparent` passed from Cloudflare → Web → API → DB/Redis/Worker
- Enables tracking a single user action (e.g., "Upload Video") across all system components.

### 6.4 Health Checks

Every service exposes `/health`:

```json
{
  "status": "UP",
  "components": {
    "database": "UP",
    "redis": "UP",
    "storage": "UP"
  },
  "version": "1.2.0-b4f2c9a",
  "uptime": "12h4m"
}
```

Load balancer queries `/health` every 10s. If down, container is restarted/removed from rotation.

---

## 7. Scaling Strategy

### 7.1 Phase 1-10: Single Server + Managed Services
- Web, API, Worker on single VPS using Docker Compose
- Managed Postgres and Redis (e.g., Neon, Upstash)
- Cloudflare CDN

### 7.2 Phase 11-20: Horizontal Scaling
- Move to AWS ECS, Google Cloud Run, or Docker Swarm
- Auto-scaling group for Web (CPU-based)
- Auto-scaling group for API (CPU-based)
- Auto-scaling group for Workers (Queue depth-based)

### 7.3 Phase 21+: Microservices Extraction (Kubernetes)
- Migrate to EKS/GKE
- Extract video processing to separate service
- Extract feed/recommendation to separate service
- Introduce ClickHouse for analytics

---

## 8. Backup and Disaster Recovery

### 8.1 Database Backups
- Automated daily snapshots (30-day retention)
- WAL archiving (Point-In-Time Recovery up to last 5 mins)
- Weekly logical dump (pg_dump) stored in secondary region S3

### 8.2 Object Storage Backups
- Primary S3 bucket configured for Cross-Region Replication (CRR)
- Soft deletes enabled on raw bucket

### 8.3 Disaster Recovery Procedure
1. RTO (Recovery Time Objective): 1 hour
2. RPO (Recovery Point Objective): 5 minutes
3. Run terraform/infrastructure script in standby region
4. Restore DB from snapshot/PITR
5. Update DNS / Cloudflare to point to standby region

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [Security Architecture ←](./10-security-architecture.md) | Next: [Development Roadmap →](./12-development-roadmap.md)*
