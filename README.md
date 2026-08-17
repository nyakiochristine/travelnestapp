# TravelNest

TravelNest has a React frontend in `frontendd` and an Express/MongoDB backend in `backend`.

## First-time setup

1. Create `backend/.env` from `backend/.env.example` and set a working MongoDB URI plus a long JWT secret.
2. Install packages in each application folder:

   ```bash
   cd backend && npm ci
   cd ../frontendd && npm ci
   ```

## Start the app

Open two terminals from the project root.

```bash
cd backend
npm run dev
```

```bash
cd frontendd
npm start
```

The API runs on `http://localhost:3001` and the frontend opens on `http://localhost:3000`.

To load the provided Kenyan attractions into an empty database:

```bash
cd backend
npm run seed
```
