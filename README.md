# ListenWithMe

Monorepo cho dự án ListenWithMe theo hướng frontend-first.

## Cấu trúc

- `apps/web`: Frontend Next.js
- `apps/server`: Backend (sẽ triển khai ở phase backend)

## Chạy frontend

1. `npm install`
2. `npm run dev:web` (thường)
3. Nếu gặp lỗi style/chunk: `npm run dev:web:clean`
4. Mở `http://localhost:3000`

Lưu ý: frontend đọc API từ `NEXT_PUBLIC_API_BASE_URL` (mặc định `http://localhost:4000`).

## Chạy backend

1. `npm install`
2. `npm run dev:server`
3. API chạy tại `http://localhost:4000`
