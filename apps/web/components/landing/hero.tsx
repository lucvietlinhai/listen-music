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
    <section className="mx-auto grid w-full gap-10 px-6 pb-20 pt-20 md:grid-cols-2 md:items-center md:pt-32 lg:px-12 xl:gap-20">
      <div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
          AI Anonymous Radio
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-text lg:text-7xl">
          Listen together, <br/> <span className="text-accent">in sync.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Create a room in seconds, invite friends with a link, chat and react in real-time. Experience music together, no app required.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/rooms?create=1"
            className="btn-primary px-8 py-3.5 text-base"
          >
            Create Room
          </Link>
          <Link
            href="/rooms"
            className="btn-ghost border border-white/[0.08] px-8 py-3.5 text-base"
          >
            Explore Rooms
          </Link>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-glass-lg transition-all duration-500 hover:shadow-glow-teal-strong">
        <div className="glass-subtle rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Now Playing</p>
          <p className="mt-2 text-xl font-bold text-text">Nơi này có anh</p>
          <p className="text-sm font-semibold text-accent">Sơn Tùng M-TP</p>
          <div className="progress-bar-track mt-5">
            <div className="progress-bar-fill w-1/3" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {liveCards.map((item) => (
            <div key={item.label} className="glass-subtle rounded-xl p-5">
              <p className="text-3xl font-extrabold text-text tracking-tight">{item.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 text-center">
          <p className="text-[11px] font-semibold text-muted">
            Total rooms created: <span className="text-accent">{formatNumber(stats.roomsTotal)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
