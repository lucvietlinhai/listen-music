"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchLiveStats, type LiveStats } from "@/lib/api";

const defaultStats: LiveStats = {
  listenersOnline: 0,
  roomsActive: 0,
  roomsTotal: 0,
  updatedAt: ""
};

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

export function Hero() {
  const [stats, setStats] = useState<LiveStats>(defaultStats);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const next = await fetchLiveStats();
        if (!mounted) return;
        setStats(next);
      } catch {
        // Keep previous values when stats API is temporarily unavailable.
      }
    };

    void load();
    timer = setInterval(() => {
      void load();
    }, 15000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const liveCards = [
    { label: "Người đang nghe", value: formatNumber(stats.listenersOnline) },
    { label: "Phòng đang mở", value: formatNumber(stats.roomsActive) }
  ];

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 pt-14 md:grid-cols-2 md:items-center md:pt-20">
      <div>
        <p className="mb-3 inline-flex rounded-full border border-accent-soft bg-accent-soft/40 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
          Radio lời nhắn ẩn danh AI
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-text sm:text-5xl">
          Cùng nghe một bài nhạc, <span className="text-gradient">cùng một khoảnh khắc</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Tạo phòng trong vài giây, mời bạn bè bằng một đường link, chat và thả cảm xúc theo thời
          gian thực. Không cần cài app.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/rooms?create=1"
            className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
          >
            Tạo phòng ngay
          </Link>
          <Link
            href="/rooms"
            className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-text transition hover:border-accent"
          >
            Tham gia phòng
          </Link>
        </div>
      </div>

      <div className="glass float-up rounded-2xl p-5 shadow-glow">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-sm font-semibold text-muted">Đang phát</p>
          <p className="mt-2 text-lg font-bold text-text">Nơi này có anh</p>
          <p className="text-sm text-muted">Sơn Tùng M-TP</p>
          <div className="mt-4 h-2 w-full rounded-full bg-surface">
            <div className="h-2 w-1/3 rounded-full bg-accent" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {liveCards.map((item) => (
            <div key={item.label} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-2xl font-extrabold text-success">{item.value}</p>
              <p className="mt-1 text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Tổng số phòng đã tạo: <span className="font-semibold text-text">{formatNumber(stats.roomsTotal)}</span>
        </p>
      </div>
    </section>
  );
}
