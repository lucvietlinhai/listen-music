"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchLiveStats, type LiveStats } from "@/lib/api";
import { ClayHeadphones } from "@/components/illustrations/clay-headphones";
import { ClayBlobs } from "@/components/illustrations/clay-blobs";

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
        // Keep previous values
      }
    };

    void load();
    timer = setInterval(() => { void load(); }, 15000);
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, []);

  return (
    <section className="relative py-20 md:py-32">
      <ClayBlobs />

      <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        {/* Left — Text content */}
        <div className="relative z-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            AI Anonymous Radio
          </p>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl lg:text-6xl">
            Nghe nhạc cùng nhau,{" "}
            <span className="bg-gradient-to-r from-accent to-[var(--clay-pink)] bg-clip-text text-transparent">
              đồng bộ.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Tạo phòng trong vài giây, mời bạn bè qua link, chat và react theo thời gian thực.
            Trải nghiệm âm nhạc cùng nhau — không cần cài app.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/rooms?create=1" className="btn-primary px-8 py-3.5 text-base">
              Tạo phòng ngay
            </Link>
            <Link href="/rooms" className="btn-ghost border border-line px-8 py-3.5 text-base">
              Khám phá
            </Link>
          </div>

          {/* Live stats pills */}
          <div className="mt-10 flex flex-wrap gap-3">
            <div className="glass-subtle inline-flex items-center gap-2 rounded-full px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-bold text-text">{formatNumber(stats.listenersOnline)}</span>
              <span className="text-xs text-muted">đang nghe</span>
            </div>
            <div className="glass-subtle inline-flex items-center gap-2 rounded-full px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm font-bold text-text">{formatNumber(stats.roomsActive)}</span>
              <span className="text-xs text-muted">phòng mở</span>
            </div>
            <div className="glass-subtle inline-flex items-center gap-2 rounded-full px-4 py-2">
              <span className="text-sm font-bold text-text">{formatNumber(stats.roomsTotal)}</span>
              <span className="text-xs text-muted">phòng đã tạo</span>
            </div>
          </div>
        </div>

        {/* Right — Illustration */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative">
            <ClayHeadphones className="w-full max-w-[380px] drop-shadow-2xl" />

            {/* Floating "Now Playing" mini card */}
            <div className="absolute -bottom-4 -left-4 glass rounded-2xl p-4 shadow-clay animate-slide-up sm:-bottom-6 sm:-left-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Now Playing</p>
              <p className="mt-1 text-sm font-bold text-text">Nơi này có anh</p>
              <p className="text-xs font-semibold text-accent">Sơn Tùng M-TP</p>
              <div className="progress-bar-track mt-3">
                <div className="progress-bar-fill w-2/5" />
              </div>
            </div>

            {/* Floating music note */}
            <div className="absolute -right-2 top-4 glass rounded-xl p-3 shadow-clay-sm animate-float sm:-right-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18V5l12-2v13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3" fill="var(--clay-pink)"/>
                <circle cx="18" cy="16" r="3" fill="var(--clay-mint)"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
