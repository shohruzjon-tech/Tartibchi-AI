# QueuePro — Multi-Tenant SaaS Queue Management Platform

A production-ready, multi-tenant queue management system built as a **Turborepo** monorepo with **NestJS** microservices, **Next.js** frontend, **MongoDB**, **Redis**, and real-time **WebSocket** updates.

## Architecture

```
Customer → [Next.js CRM :3000] → [API Gateway :5000] → TCP → Microservices
                                                              ├── accounts-service :5001
                                                              ├── queue-service    :5002
                                                              ├── notification-svc :5003
                                                              ├── analytics-svc   :5004
                                                              ├── telegram-svc    :5005
                                                              └── websocket-svc   :5006
```

## Tech Stack

| Layer         | Technology                                                          |
| ------------- | ------------------------------------------------------------------- |
| Monorepo      | Turborepo + npm workspaces                                          |
| Frontend      | Next.js 16, React 19, Tailwind CSS 4, next-intl, Zustand, Socket.IO |
| Gateway       | NestJS 11 (HTTP), JWT auth, Passport                                |
| Microservices | NestJS 11 (TCP transport), Mongoose 8                               |
| Database      | MongoDB 7                                                           |
| Cache / Queue | Redis 7 (ioredis, Redlock)                                          |
| Real-time     | Socket.IO 4 via @nestjs/websockets                                  |
| Telegram      | Telegraf 4 (per-tenant bot management)                              |
| SMS           | Eskiz.uz API                                                        |
| Containers    | Docker, Docker Compose, Traefik                                     |

## Project Structure

```
queue-system/
├── apps/
│   ├── queue-crm/            # Next.js frontend (i18n: en, ru, uz)
│   └── queue-gateway/        # NestJS HTTP API Gateway
├── microservices/
│   ├── accounts-service/     # Auth, tenants, branches, users, counters
│   ├── queue-service/        # Queue engine, tickets, state machine
│   ├── notification-service/ # SMS + Telegram notifications
│   ├── analytics-service/    # Event tracking, daily stats
│   ├── telegram-service/     # Multi-tenant Telegram bot management
│   └── websocket-service/    # Socket.IO real-time gateway
├── packages/
│   ├── shared/               # Enums, DTOs, interfaces, constants
│   ├── eslint-config/        # Shared ESLint
│   ├── typescript-config/    # Shared TSConfig
│   └── ui/                   # Shared UI components
├── docker/                   # Production Dockerfiles
├── docker-compose.dev.yml    # Dev: MongoDB + Redis
├── docker-compose.yml        # Prod: All services
└── turbo.json
```

## Quick Start

### Prerequisites

- Node.js ≥ 18, npm ≥ 9
- Docker & Docker Compose

### 1. Install

```bash
npm install
```

### 2. Start MongoDB + Redis (dev)

```bash
npm run dev:docker
```

- MongoDB → `localhost:27017` (admin/admin123)
- Redis → `localhost:6379`
- Mongo Express → `http://localhost:8081`
- Redis Commander → `http://localhost:8082`

### 3. Start all services

```bash
npm run dev:full
```

| Service      | URL                       |
| ------------ | ------------------------- |
| CRM Frontend | http://localhost:3000     |
| API Gateway  | http://localhost:5000/api |
| WebSocket    | ws://localhost:5006       |

## i18n — Language-Based Routing

```
/en/...  → English
/ru/...  → Русский
/uz/...  → O'zbekcha
```

## API

### Public

```
POST /api/auth/login|register|refresh
GET  /api/queues[/:id][/live]
POST /api/tickets
GET  /api/tickets/status/:publicId
GET  /api/tickets/wait/:publicId
```

### Protected (JWT)

```
CRUD /api/tenants|branches|queues|counters
POST /api/counters/:id/next|recall|skip|start|done|transfer
GET  /api/analytics/daily|queues|counters|branch|peak-hours
POST|DELETE /api/telegram/bot
```

## Ticket Lifecycle

```
CREATED → WAITING → CALLED → SERVING → DONE
                  ↘ SKIPPED ↗
```

## WebSocket Events

| Direction     | Events                                                                |
| ------------- | --------------------------------------------------------------------- |
| Client→Server | joinBranch, joinQueue, trackTicket, joinCounter, joinDisplay          |
| Server→Client | queueUpdate, ticketCalled, ticketUpdate, displayUpdate, counterUpdate |

## Production

```bash
cp .env.production .env.production.local  # Set real values
npm run prod:up                           # Build & start all containers
npm run prod:logs                         # View logs
npm run prod:down                         # Stop
```

## Roles

| Role           | Access                         |
| -------------- | ------------------------------ |
| SUPER_ADMIN    | Full system                    |
| TENANT_ADMIN   | Own tenant, branches, settings |
| BRANCH_MANAGER | Assigned branch                |
| STAFF          | Counter operations             |
