"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchMyRoom } from "@/lib/api";

const navItems = [
  { label: "Cách hoạt động", href: "#how-it-works" },
  { label: "Tính năng", href: "#features" },
  { label: "Phòng công khai", href: "/rooms" },
  { label: "Tiến độ", href: "/progress" }
];

export function Navbar() {
  const { user, requestLogin, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [myRoomId, setMyRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyRoom()
        .then((room) => {
          if (room) setMyRoomId(room.id);
        })
        .catch(() => {});
    } else {
      setMyRoomId(null);
    }
  }, [user]);

  return (
    <header className="glass sticky top-0 z-40 border-b border-white/[0.05]">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-6 lg:px-12">
        <Link href="/" className="text-xl font-bold tracking-tight text-text">
          Listen<span className="text-accent">WithMe</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-muted md:flex">
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} href={item.href} className="transition-colors hover:text-accent">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="transition-colors hover:text-accent">
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {!user ? (
            <button
              onClick={() =>
                requestLogin({ message: "Đăng nhập để chat, reaction và tạo phòng của riêng bạn." })
              }
              className="btn-ghost px-4 py-2 text-xs"
            >
              Sign In
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="glass-subtle flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:border-white/10"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
                  {user.avatar}
                </span>
                <span className="text-xs font-bold text-text">{user.name}</span>
              </button>
              {showMenu ? (
                <div className="absolute right-0 mt-3 w-48 rounded-xl border border-white/[0.05] bg-[#050505] p-2 shadow-glass-lg animate-slide-up">
                  <Link href="/profile" className="block rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-white/[0.05]">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          )}
          {myRoomId ? (
            <Link
              href={`/room/${myRoomId}`}
              className="btn-primary px-5 py-2 text-xs bg-emerald-500 hover:bg-emerald-400 shadow-glow-strong"
            >
              Phòng của tôi
            </Link>
          ) : (
            <Link
              href="/rooms?create=1"
              className="btn-primary px-5 py-2 text-xs"
            >
              Create Room
            </Link>
          )}
        </div>

        <button
          className="btn-ghost inline-flex px-3 py-2 text-xs md:hidden"
          aria-label="Mở menu"
        >
          Menu
        </button>
      </div>
    </header>
  );
}
