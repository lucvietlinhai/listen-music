# ListenWithMe Server

Backend API cho giai đoạn đầu (Phase 06), ưu tiên chạy local nhanh:

- Express + TypeScript
- JWT guest token
- CRUD phòng (in-memory store)
- YouTube search proxy (cache memory/redis)

## Run

1. `npm install`
2. `npm run dev:server`
3. API base: `http://localhost:4000`

## Endpoints

- `GET /health`
- `POST /api/auth/guest`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/:id`
- `DELETE /api/rooms/:id`
- `GET /api/youtube/search?q=...`

