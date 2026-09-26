```
backend/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   └── prisma.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.js
│   │   │   ├── user.routes.js
│   │   │   └── user.service.js
│   │   │
│   │   ├── locations/
│   │   │   ├── location.controller.js
│   │   │   ├── location.routes.js
│   │   │   └── location.service.js
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicle.controller.js
│   │   │   ├── vehicle.routes.js
│   │   │   └── vehicle.service.js
│   │   │
│   │   ├── rides/
│   │   │   ├── ride.controller.js
│   │   │   ├── ride.routes.js
│   │   │   ├── ride.service.js
│   │   │   └── ride.validation.js
│   │   │
│   │   ├── pools/
│   │   │   ├── pool.controller.js
│   │   │   ├── pool.routes.js
│   │   │   ├── pool.service.js
│   │   │   ├── pool.matching.js
│   │   │   └── pool.validation.js
│   │   │
│   │   ├── fares/
│   │   │   ├── fare.controller.js
│   │   │   ├── fare.routes.js
│   │   │   └── fare.service.js
│   │   │
│   │   ├── payments/
│   │   │   ├── payment.controller.js
│   │   │   ├── payment.routes.js
│   │   │   └── payment.service.js
│   │   │
│   │   └── offers/
│   │       ├── offer.controller.js
│   │       ├── offer.routes.js
│   │       └── offer.service.js
│   │
│   ├── services/
│   │   ├── distance.service.js
│   │   ├── websocket.service.js
│   │   └── capacity.service.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── errors.js
│   │
│   ├── routes/
│   │   └── index.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── auth/
│   ├── rides/
│   ├── pools/
│   ├── fares/
│   ├── concurrency/
│   └── helpers/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```