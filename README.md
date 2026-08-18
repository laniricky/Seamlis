# Seamlis

A green-branded, creator-first video sharing platform.

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js](https://nodejs.org/) (v20+)
- [JDK 17](https://adoptium.net/)

### Local Development

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```

2. **Start Infrastructure Services**
   This will start PostgreSQL, Redis, and MinIO (S3 compatible storage).
   ```bash
   docker-compose up -d
   ```

3. **Start the Backend API**
   ```bash
   cd backend/api
   ./gradlew run
   ```
   The API will run on `http://localhost:8080`.

4. **Start the Web Frontend**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

### Infrastructure Endpoints
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MinIO Console**: `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`)

### Architecture
See the `docs/` directory for full architectural specifications.
