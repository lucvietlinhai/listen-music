"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const navItems = [
  { label: "Cách hoạt động", href: "#how-it-works" },
  { label: "Tính năng", href: "#features" },
  { label: "Phòng công khai", href: "/rooms" },
  { label: "Tiến độ", href: "/progress" }
];

export function Navbar() {
  const { user, requestLogin, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Listen<span className="text-accent">WithMe</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} href={item.href} className="transition hover:text-text">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="transition hover:text-text">
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <button
              onClick={() =>
                requestLogin({ message: "Đăng nhập để chat, reaction và tạo phòng của riêng bạn." })
              }
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-text transition hover:bg-surface"
            >
              Đăng nhập
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                  {user.avatar}
                </span>
                {user.name}
              </button>
              {showMenu ? (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-line bg-card p-2 text-sm">
                  <Link href="/profile" className="block rounded-md px-2 py-2 hover:bg-surface">
                    Hồ sơ
                  </Link>
                  <button
                    onClick={logout}
                    className="mt-1 block w-full rounded-md px-2 py-2 text-left hover:bg-surface"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          )}
          <Link
            href="/rooms?create=1"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Tạo phòng
          </Link>
        </div>

        <button
          className="inline-flex rounded-md border border-line px-3 py-2 text-sm md:hidden"
          aria-label="Mở menu"
        >
          Menu
        </button>
      </div>
    </header>
  );
}
