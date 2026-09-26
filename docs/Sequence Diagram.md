# Lifecycle Diagrams

## 1. Ride Lifecycle

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