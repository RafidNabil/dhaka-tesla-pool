# Dhaka Tesla Pool

Dhaka Tesla Pool is a ride-pooling MVP for passengers and drivers. Passengers request rides between predefined Dhaka locations. The backend matches compatible requests into pools, enforces vehicle capacity, sends offers to drivers, calculates individual fares, and tracks the trip lifecycle.

> This README describes the current implementation. The `docs/` directory is not used as a source because it is out of date.

## Evaluator Test Note

The frontend is deployed on Vercel and the backend on Render. Both use the same Supabase database.

Since the backend runs a background matchmaker, running the Render and Docker backends simultaneously would create multiple matchmaker instances using the same database and may cause conflicts.

The Render backend is therefore currently suspended. **Please use the Docker setup for evaluation.**


Frontend URL: [https://dhaka-tesla-pool-flax.vercel.app](https://dhaka-tesla-pool-flax.vercel.app)

Backend URL: [https://dhaka-tesla-pool-95ke.onrender.com](https://dhaka-tesla-pool-95ke.onrender.com)

Demo video: [https://drive.google.com/file/d/1YcMB7XnXNuS4g408f6yDFnRV1-qfLbMg/view?usp=sharing](https://drive.google.com/file/d/1YcMB7XnXNuS4g408f6yDFnRV1-qfLbMg/view?usp=sharing)

## Features

- Passenger registration, login, ride requests, fare/status view, cancellation, and history.
- Driver login, online/offline vehicle status, pool offers, accept/reject, arrival, start, completion, and history.
- Three-seat vehicle capacity enforcement.
- Pool matching using seeded Dhaka locations and coordinate distance.
- Individual pooled fares persisted per ride.
- JWT authentication in an HttpOnly cookie, role authorization, and Zod validation.
- Socket.IO notifications with React Query refresh/polling.

## Architecture

```mermaid
flowchart LR
    Browser[Browser] --> React[React + Vite]
    React -->|REST| API[Express API]
    React <-->|Socket.IO events| API
    API --> Prisma[Prisma 7]
    Prisma --> DB[(PostgreSQL)]
```

## Lifecycle

```mermaid
flowchart TD
    A[Passenger requests ride] --> B[Check for compatible pools]

    B --> C{Compatible pool found?}

    C -->|Yes| D[Join existing pool]
    C -->|No| E[Create new pool]

    E --> F[Send pool offer to online drivers]
    F --> G{Driver accepts?}

    G -->|No| H[Wait for driver response]
    H --> G

    G -->|Yes| I[Assign driver to pool]

    D --> J[Check passenger readiness]
    I --> J

    J --> K{Majority of passengers ready?}

    K -->|Yes| L[Start trip]
    K -->|No| M[Wait for passengers]
    M --> J
```

## Ride Request States

`REQUESTED -> MATCHED -> STARTED -> COMPLETED`

A ride can be cancelled from the `REQUESTED` or `MATCHED` states.

* **REQUESTED:** The passenger has requested a ride, but no driver has been found yet.
* **MATCHED:** A driver has accepted the pool offer and has been assigned to the pool.
* **STARTED:** The pool is `CONFIRMED`, meaning the driver has arrived and all passengers have set their `POOL_Preference` to `IMMEDIATE`. The driver has started the trip.
* **COMPLETED:** The driver has completed the trip.

## Pool States

`MATCHING -> CONFIRMED -> ACTIVE -> COMPLETED`

A pool can be cancelled from any active pre-completion state.

* **MATCHING:** The pool has not been assigned a driver yet and is looking for an available driver.
* **CONFIRMED:** A driver has been assigned and has arrived, and all passengers have set their `POOL_Preference` to `IMMEDIATE`.
* **ACTIVE:** The driver has started the trip.
* **COMPLETED:** The driver has completed the trip.

## Pool Creation

A new pool is created only when there is no existing pool that the ride request can be matched with.

# State Machines

## RIDE_REQUEST
```mermaid
stateDiagram-v2
    [*] --> REQUESTED
    REQUESTED --> MATCHED
    REQUESTED --> CANCELLED

    MATCHED --> STARTED
    MATCHED --> CANCELLED

    STARTED --> COMPLETED

    COMPLETED --> [*]
    CANCELLED --> [*]
```

## POOL
```mermaid
stateDiagram-v2
    [*] --> MATCHING

    MATCHING --> CONFIRMED
    MATCHING --> CANCELLED

    CONFIRMED --> ACTIVE
    CONFIRMED --> CANCELLED

    ACTIVE --> COMPLETED
    ACTIVE --> CANCELLED

    COMPLETED --> [*]
    CANCELLED --> [*]
```

## POOL_OFFER
```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> ACCEPTED
    PENDING --> REJECTED

    ACCEPTED --> [*]
    REJECTED --> [*]
```

## Matching and Fare Rules

- Pickup distance: at most 1 km from the pool's first active ride.
- Destination distance: at most 3 km from the pool's first active ride.
- Vehicle capacity: 3 seats in the current MVP.
- Distance: Haversine distance between predefined location coordinates.

Fare rate is 10 whole Taka per kilometre. The pool total is the longest passenger distance multiplied by 10. Each passenger pays an equal share of the route segments they occupy. Whole-Taka rounding uses largest remainder so passenger fares equal the pool total.

Example: 12 km, 10 km, and 8 km produce fares of 57, 37, and 26 Taka, for a 120 Taka pool total. Fare values are stored as PostgreSQL integers representing whole Taka. No real payment gateway is connected; the schema supports `CASH` and `TESLAPAY`.

## Database ERD

```mermaid
erDiagram
    USER ||--o{ RIDE_REQUEST : makes
    USER ||--o| VEHICLE : owns
    USER ||--o{ POOL_OFFER : receives
    VEHICLE ||--o{ POOL : services
    POOL ||--o{ RIDE_REQUEST : contains
    POOL ||--o{ POOL_OFFER : offered_to
    LOCATION ||--o{ RIDE_REQUEST : pickup
    LOCATION ||--o{ RIDE_REQUEST : destination
    RIDE_REQUEST ||--o| FARE : has

    USER {
        uuid id PK
        string name
        string email
        string role "passenger|driver"
        string password_hash
    }

    VEHICLE {
        uuid id PK
        uuid driver_id FK
        int capacity
        boolean online
    }

    POOL {
        uuid id PK
        uuid vehicle_id FK
        string status "matching|confirmed|active|completed|cancelled"
        int seats_occupied
        timestamp driver_arrived_at
        timestamp created_at
    }

    LOCATION {
        uuid id PK
        string name UK
        decimal latitude
        decimal longitude
    }

    RIDE_REQUEST {
        uuid id PK
        uuid passenger_id FK
        uuid pool_id FK
        uuid pickup_location_id FK
        uuid destination_location_id FK
        int seats_requested
        string pooling_preference "WAIT|IMMEDIATE"
        string status "REQUESTED|MATCHED|STARTED|COMPLETED|CANCELLED"
        timestamp requested_at
    }

    POOL_OFFER {
        uuid id PK
        uuid pool_id FK
        uuid driver_id FK
        string status "PENDING|ACCEPTED|REJECTED"
        timestamp offered_at
        timestamp responded_at
    }

    FARE {
        uuid id PK
        uuid ride_request_id FK
        int base_fare
        int distance_charge
        int pool_discount
        int total
        string payment_method "cash|teslapay"
    }
```

Main models are `User`, `Vehicle`, `Location`, `Pool`, `RideRequest`, `PoolOffer`, and `Fare`. The full schema is in `backend/prisma/schema.prisma`.

# Complete Ride Lifecycle
```mermaid
sequenceDiagram
    actor Passenger
    participant FE as React Frontend
    participant API as Node.js + Express
    participant DB as PostgreSQL
    participant Driver

    Passenger->>FE: Sign up / Sign in
    FE->>API: Authentication request
    API->>DB: Create / verify USER
    DB-->>API: User data
    API-->>FE: JWT

    Passenger->>FE: Request ride
    FE->>API: pickup, destination, seats, pooling preference
    API->>DB: Create RIDE_REQUEST (REQUESTED)
    API->>DB: Find compatible POOL

    alt Compatible pool exists
        API->>DB: Add request to POOL
    else No compatible pool
        API->>DB: Create POOL (MATCHING)
        API->>DB: Add request to POOL
    end

    API->>DB: Update request → MATCHED
    API-->>FE: Pool + estimated fare

    API->>DB: Find available driver/vehicle
    API->>DB: Create POOL_OFFER
    DB-->>Driver: Pool offer

    Driver->>API: Accept pool
    API->>DB: Update POOL_OFFER → ACCEPTED
    API->>DB: Update POOL → CONFIRMED
    API-->>FE: Pool confirmed

    loop While pool is waiting
        Passenger->>FE: Wait / view current pool
        FE-->>Passenger: Current riders + estimated fare

        Note over API,DB: New rider joins or existing rider leaves
        API->>DB: Update pool membership
        API->>API: Recalculate estimated fares
        API-->>FE: WebSocket pool.updated
    end

    Driver->>API: Mark arrival
    API->>DB: Set driver_arrived_at

    API->>API: Calculate WAIT vs IMMEDIATE majority

    alt More than half chose WAIT
        API->>DB: Keep pool waiting
    else Majority chooses IMMEDIATE
        API->>DB: Update POOL → ACTIVE
        API->>DB: Update riders → STARTED
    end

    Driver->>API: Start ride
    API->>DB: Update POOL → ACTIVE
    API->>DB: Update RIDE_REQUEST → STARTED

    Driver->>API: Complete ride
    API->>DB: Update POOL → COMPLETED
    API->>DB: Update RIDE_REQUEST → COMPLETED
    API->>DB: Create final FARE records

    API-->>FE: Final fare + completed ride
```

## Technology Choices

| Area | Choice | Reason |
| --- | --- | --- |
| Frontend | React, Vite, React Router | Small authenticated dashboard with separate passenger/driver flows |
| API | Express 5 | Simple REST modules and middleware |
| Database | PostgreSQL | Relational integrity and row locks for capacity |
| ORM | Prisma 7 | Typed relational queries and migrations |
| Auth | JWT + HttpOnly cookie, bcrypt | Simple two-role MVP without browser token storage |
| Validation | Zod | Local, readable request schemas |
| Tests | Vitest | Fast ESM-compatible service tests |
| Realtime | Socket.IO | Pool and ride status notifications |

For a larger product, likely additions would be PostGIS for geospatial search, durable workers for matchmaking, sessions or an identity provider for token revocation, and integration tests against PostgreSQL.

## Project Structure

```text
backend/
  prisma/                 schema, migrations, seed
  src/config/             environment and Prisma
  src/middlewares/        auth, validation, errors
  src/modules/            auth, fares, locations, offers, pools, rides, vehicles
  src/services/            distance, Socket.IO, matchmaker
  tests/                  service and utility tests
frontend/
  src/pages/              auth, passenger, driver
  src/components/         layouts and shared states
  src/lib/                API and Socket.IO clients
  src/store/              persisted auth state
docker-compose.yml
```

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL 14+

## Environment

Copy `backend/.env.example` to `backend/.env`:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool?schema=public
JWT_ACCESS_SECRET=change-me-in-development
JWT_ACCESS_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
```

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_PROXY_TARGET=http://localhost:5000
```

## Local Setup

```powershell
# Backend
cd backend
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

In another terminal:

```powershell
# Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:5000`; health check: `GET /api/health`.

Useful commands:

```powershell
cd backend
npm test
npm run prisma:studio

cd frontend
npm run build
npm run lint
```

## Docker
From the repository root, create the environment file:

```powershell
copy .env.example .env

docker compose up --build
```

The current Compose file starts the frontend and backend containers on ports 5173 and 5000. PostgreSQL is hosted on Supabase, so no local PostgreSQL container is started. The `docker-compose.yml` contains the Supabase connection strings required for the application to connect to the database.

## Seed Credentials

The Supabase database already contains the required demo user and location data.

* **Jashim**, driver: `jashim@test.com` / `Password123`
* **Motin**, driver: `motin@test.com` / `Password123`
* **Nusrat**, passenger: `nusrat@example.com` / `password123`
* **Jashim**, passenger: `rafiq@gmail.com` / `password123`
* Two online vehicle with capacity 3
* Ten predefined Dhaka locations, including Banani, Gulshan, Dhanmondi, Uttara, Mirpur, Farmgate, Bashundhara, and others

The seed does not currently create Nusrat, Rafiq, or Shirin. Passenger accounts can be created through the signup screen. Driver accounts need to be seeded. 

## Testing and Integrity

The test suite covers fare calculation, matching thresholds, capacity checks, state transitions, cancellation, ownership authorization, driver offers, authentication, validation, utilities, locations, and vehicles.

The matchmaker uses a PostgreSQL transaction and `SELECT ... FOR UPDATE` before updating pool seats. It rechecks status and capacity, preventing two concurrent requests from overbooking the same pool. A real PostgreSQL concurrency integration test is still recommended.

## Known Limitations

- No local PostgreSQL service in Compose.
- No payment gateway, wallet ledger, ratings, or persisted status-history table.
- Matching is coordinate-based, not road-route based.
- Matchmaker and Socket.IO run inside the API process; horizontal scaling needs worker coordination and shared pub/sub.

## Git and Submission

Expected branches: `master`, `pre-release`, `release/v1.0.0`, and feature branches such as `feature/passenger-auth` and `feature/tesla-pooling`.

Commit format:

```text
<type>(<scope>): <short description>
```

Examples: `feat(auth): add passenger login endpoint` and `fix(pool): prevent overbooking available seats`.

## AI Usage

ChatGPT was used for planning and explanation. The documentation intentionally records current limitations instead of claiming that the existing Compose setup is self-contained or production-ready.

**Deployment URL:** https://dhaka-tesla-pool-flax.vercel.app

**Demo video:** Not recorded yet.
