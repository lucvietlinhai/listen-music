"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

const mockHistory = [
  { id: "r1", room: "Đêm Chậm Rãi", joinedAt: "Tối qua" },
  { id: "r2", room: "WFH Focus Room", joinedAt: "2 ngày trước" },
  { id: "r3", room: "Chill Cuối Tuần", joinedAt: "Tuần trước" }
];

export default function ProfilePage() {
  const { user, requestLogin, logout } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-sm text-muted">Bạn cần đăng nhập để xem thông tin hồ sơ.</p>
          <button
            onClick={() =>
              requestLogin({ message: "Đăng nhập để xem hồ sơ và lịch sử phòng của bạn." })
            }
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950"
          >
            Đăng nhập với Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-lg font-extrabold text-accent">
            {user.avatar}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold">Lịch sử phòng gần đây (mock)</h2>
          <div className="mt-3 space-y-2">
            {mockHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2"
              >
                <span className="font-medium">{item.room}</span>
                <span className="text-sm text-muted">{item.joinedAt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/rooms"
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium"
          >
            Về danh sách phòng
          </Link>
          <button
            onClick={logout}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-slate-950"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </main>
  );
}

