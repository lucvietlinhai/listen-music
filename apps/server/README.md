# ListenWithMe Server

Backend API cho giai đoạn đầu (Phase 06), ưu tiên chạy local nhanh:

- Express + TypeScript
- JWT guest token
- CRUD phòng (Prisma nếu có DATABASE_URL, fallback in-memory)
- YouTube search proxy (cache memory/redis)

## Run

1. `npm install`
2. `npm run dev:server`
3. API base: `http://localhost:4000`

## Prisma (khi có Supabase Postgres)

1. Tạo file `.env` từ `.env.example` và điền `DATABASE_URL`
2. `npm run prisma:generate --workspace @listenwithme/server`
3. `npm run prisma:migrate --workspace @listenwithme/server`

## Endpoints

- `GET /health`
- `GET /health/deps`
- `POST /api/auth/guest`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/:id`
- `DELETE /api/rooms/:id`
- `GET /api/youtube/search?q=...`
