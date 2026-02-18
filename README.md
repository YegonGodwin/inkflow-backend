# Inkflow Backend Service

Express + MySQL backend for Inkflow web app.

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Create schema by running `backend-service/db/schema.sql` in MySQL.
3. Install dependencies: `npm install`
4. Run: `npm run dev`

## Auth Workflow

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Register/login returns:
- `user`
- `accessToken` (short-lived)
- `refreshToken` (longer-lived)

Use access token in header:
- `Authorization: Bearer <accessToken>`

## Resource Workflow

Protected routes:
- Essays: `GET/POST /api/essays`, `GET/PUT/DELETE /api/essays/:essayId`, `POST /api/essays/:essayId/improve`
- Concepts: `GET/POST /api/concepts`, `GET/PUT/DELETE /api/concepts/:conceptId`
- Progress: `GET /api/progress/overview`

Health endpoint:
- `GET /health`
