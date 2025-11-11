# Backend Test Project

A production-ready backend application built with NestJS featuring weather data ingestion with time-series storage and a real-time chat system using WebSocket.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [System Design for High Traffic](#-system-design-for-high-traffic)
- [Project Structure](#-project-structure)
- [Testing](#-testing)

## ✨ Features

### 1. Weather Data Ingestion Module
- **Automated Data Collection**: Cron job runs every 15 minutes to fetch weather data from Open-Meteo API
- **Time-Series Storage**: Weather data stored in PostgreSQL with indexed timestamps for efficient querying
- **REST API Endpoints**:
  - `POST /api/weather/fetch/:city` - Manually trigger weather data fetch
  - `GET /api/weather/current/:city` - Get current weather (cached for 15 minutes)
  - `GET /api/weather/history/:city` - Get historical weather data with pagination
- **Redis Caching**: Current weather data cached with 15-minute TTL to reduce database load

### 2. Real-time Chat System
- **WebSocket Communication**: Built with Socket.IO for bidirectional real-time messaging
- **Multiple Message Types**:
  - **Broadcast**: Send messages to all connected users
  - **Private**: One-on-one messaging between users
  - **Group**: Create groups and send messages to group members
- **Message Persistence**: All messages stored in database for history retrieval
- **REST API Endpoints**:
  - `POST /api/chat/groups` - Create a new chat group
  - `POST /api/chat/groups/join` - Join an existing group
  - `GET /api/chat/groups` - List all groups
  - `GET /api/chat/groups/:id` - Get group details
  - `GET /api/chat/messages/broadcast` - Get broadcast message history
  - `GET /api/chat/messages/private` - Get private conversation history
  - `GET /api/chat/messages/group/:groupId` - Get group message history

### 3. Additional Features
- **Health Check**: `/api/health` endpoint for monitoring database connectivity
- **API Documentation**: Interactive Swagger UI at `/api/docs`
- **Global Exception Handling**: Consistent error responses across all endpoints
- **Request/Response Logging**: Automatic logging of all HTTP requests with response times
- **Input Validation**: Automatic validation using class-validator decorators

## 🛠 Tech Stack

- **Framework**: NestJS 11+ (Node.js framework with TypeScript)
- **Database**: PostgreSQL 15+ (Time-series data storage)
- **ORM**: Prisma 6+ (Type-safe database client)
- **Cache**: Redis 7+ (In-memory caching)
- **WebSocket**: Socket.IO 4+ (Real-time communication)
- **Scheduler**: @nestjs/schedule (Cron jobs)
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## 🏗 System Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├─── HTTP/REST ───┐
       │                 │
       └─── WebSocket ───┤
                         │
                    ┌────▼────┐
                    │  NestJS │
                    │   App   │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │  Redis  │    │PostgreSQL│   │ Open-   │
    │  Cache  │    │ Database │   │ Meteo   │
    └─────────┘    └──────────┘   │   API   │
                                   └─────────┘
```

### Key Components:

1. **Weather Module**:
   - WeatherScheduler: Cron job (every 15 minutes)
   - WeatherService: Business logic & API integration
   - WeatherRepository: Database operations
   - WeatherController: REST endpoints

2. **Chat Module**:
   - ChatGateway: WebSocket event handlers
   - ChatService: Business logic
   - ChatRepository: Database operations
   - ChatController: REST endpoints for history

3. **Infrastructure**:
   - PrismaService: Database connection management
   - CacheModule: Redis configuration
   - Global Filters: Exception handling
   - Global Interceptors: Logging

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose
- Git

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prassaaa/testBackend.git
   cd testBackend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration.

4. **Start Docker containers** (PostgreSQL & Redis):
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start the application**:
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```


7. **Access the application**:
   - API Base URL: `http://localhost:3000/api`
   - Swagger Documentation: `http://localhost:3000/api/docs`
   - Health Check: `http://localhost:3000/api/health`

## 📚 API Documentation

The API documentation is available via Swagger UI at `http://localhost:3000/api/docs` when the application is running.

### Weather API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weather/fetch/:city` | Manually trigger weather data fetch for a city |
| GET | `/api/weather/current/:city` | Get current weather for a city (cached) |
| GET | `/api/weather/history/:city` | Get historical weather data with pagination |

### Chat API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/groups` | Create a new chat group |
| POST | `/api/chat/groups/join` | Join an existing group |
| GET | `/api/chat/groups` | List all groups |
| GET | `/api/chat/groups/:id` | Get group details |
| GET | `/api/chat/messages/broadcast` | Get broadcast message history |
| GET | `/api/chat/messages/private` | Get private conversation history |
| GET | `/api/chat/messages/group/:groupId` | Get group message history |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:register` | Client → Server | Register username for chat |
| `message:broadcast` | Client → Server | Send broadcast message |
| `message:private` | Client → Server | Send private message |
| `message:group` | Client → Server | Send group message |
| `group:create` | Client → Server | Create a new group |
| `group:join` | Client → Server | Join a group |
| `message:sent` | Server → Client | Message successfully sent |
| `group:created` | Server → Client | Group created notification |
| `error` | Server → Client | Error notification |

## 🚀 System Design for High Traffic

### Handling 1 Million Requests/Day

To handle **1 million requests per day** (~11.6 requests/second average, with peak loads potentially 5-10x higher), the system implements several optimization strategies:

### 1. **Redis Caching Strategy**

**Current Implementation:**
- Current weather data cached with 15-minute TTL
- Cache key pattern: `weather:current:{city}`
- Reduces database load by ~96% (assuming data refreshes every 15 minutes)

**For High Traffic:**
```typescript
// Cache hit rate optimization
- Weather current: 15-minute TTL (matches data refresh rate)
- Weather history: 5-minute TTL with pagination caching
- Chat groups list: 1-minute TTL
- User presence: Real-time (no caching)
```

**Benefits:**
- Reduces database queries from 1M to ~40K per day for current weather
- Faster response times (Redis: <1ms vs PostgreSQL: 10-50ms)
- Lower database CPU usage

### 2. **Database Optimization**

**Indexing Strategy:**
```sql
-- Weather data (time-series queries)
CREATE INDEX idx_weather_city_time ON weather_data(city, collected_at DESC);

-- Chat messages (history queries)
CREATE INDEX idx_chat_type_time ON chat_messages(message_type, sent_at DESC);
CREATE INDEX idx_chat_private ON chat_messages(username, recipient_username, sent_at DESC);
CREATE INDEX idx_chat_group ON chat_messages(group_id, sent_at DESC);
```

**Connection Pooling:**
- Prisma connection pool: 13 connections (default)
- For high traffic: Increase to 50-100 connections
- Monitor with `prisma:info` logs

### 3. **Horizontal Scaling Architecture**

```
                    ┌──────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐      ┌────▼────┐
    │ NestJS  │       │ NestJS  │      │ NestJS  │
    │ App #1  │       │ App #2  │      │ App #3  │
    └────┬────┘       └────┬────┘      └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐      ┌────▼────┐
    │  Redis  │       │PostgreSQL│     │ Socket.IO│
    │ Cluster │       │  Primary │     │  Redis   │
    └─────────┘       └────┬────┘      │ Adapter  │
                           │            └──────────┘
                      ┌────▼────┐
                      │PostgreSQL│
                      │ Replica  │
                      └──────────┘
```

**Scaling Strategy:**

1. **Application Layer** (Stateless):
   - Deploy 3-5 NestJS instances behind load balancer
   - Each instance can handle ~500-1000 req/s
   - Auto-scaling based on CPU/memory metrics

2. **WebSocket Scaling**:
   - Use Socket.IO Redis Adapter for multi-instance support
   - Sticky sessions at load balancer level
   - Horizontal scaling of WebSocket connections

3. **Database Layer**:
   - **Primary-Replica Setup**: Write to primary, read from replicas
   - **Read Replicas**: 2-3 replicas for read-heavy operations
   - **Partitioning**: Partition weather_data by month for time-series efficiency

4. **Cache Layer**:
   - **Redis Cluster**: 3-node cluster with replication
   - **Cache-aside pattern**: Application checks cache first, then database
   - **Cache warming**: Pre-populate cache for popular cities

### 4. **Performance Metrics**

**Target Performance:**
- API Response Time: <100ms (p95)
- Cache Hit Rate: >90%
- Database Query Time: <50ms (p95)
- WebSocket Latency: <50ms

**Monitoring:**
- Health checks every 30 seconds
- Request logging with response times
- Database query performance tracking
- Redis cache hit/miss ratio

### 5. **Cost-Effective Scaling**

**For 1M requests/day:**
- **Single Instance**: Can handle up to 500K requests/day
- **2-3 Instances**: Sufficient for 1M requests/day with headroom
- **Redis**: Single instance sufficient (can handle 100K+ ops/sec)
- **Database**: Primary + 1 replica for read scaling

**Estimated Infrastructure:**
- 2x Application Servers (2 vCPU, 4GB RAM each)
- 1x PostgreSQL Primary (4 vCPU, 8GB RAM)
- 1x PostgreSQL Replica (2 vCPU, 4GB RAM)
- 1x Redis Instance (2 vCPU, 4GB RAM)
- 1x Load Balancer

## 📁 Project Structure

```
testBackend/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Prisma schema definition
├── src/
│   ├── common/              # Shared utilities
│   │   ├── dto/             # Common DTOs (pagination)
│   │   ├── filters/         # Global exception filters
│   │   └── interceptors/    # Global interceptors (logging)
│   ├── config/              # Configuration files
│   │   ├── app.config.ts
│   │   ├── cache.config.ts
│   │   ├── database.config.ts
│   │   └── redis.config.ts
│   ├── database/            # Database module
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   ├── health/              # Health check module
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── modules/
│   │   ├── weather/         # Weather module
│   │   │   ├── controllers/
│   │   │   ├── dto/
│   │   │   ├── repositories/
│   │   │   ├── schedulers/
│   │   │   ├── services/
│   │   │   └── weather.module.ts
│   │   └── chat/            # Chat module
│   │       ├── controllers/
│   │       ├── dto/
│   │       ├── gateways/
│   │       ├── repositories/
│   │       ├── services/
│   │       └── chat.module.ts
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
├── docker-compose.yml       # Docker services
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## 🧪 Testing

### Manual Testing

1. **Test Weather API**:
   ```bash
   # Fetch weather data
   curl -X POST http://localhost:3000/api/weather/fetch/Jakarta

   # Get current weather
   curl http://localhost:3000/api/weather/current/Jakarta

   # Get weather history
   curl "http://localhost:3000/api/weather/history/Jakarta?page=1&pageSize=10"
   ```

2. **Test Chat System**:
   - Open `test-chat-client.html` in multiple browser tabs
   - Register with different usernames
   - Test broadcast, private, and group messaging

3. **Test Health Check**:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backend_test?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cache
CACHE_TTL=900

# Weather Scheduler
WEATHER_CRON_SCHEDULE="*/15 * * * *"
```

## 📝 License

This project is for backend test purposes.

## 👤 Author

Prastyarw - Backend Developer

---

**Built with ❤️ using NestJS**
