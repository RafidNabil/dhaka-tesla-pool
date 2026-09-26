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