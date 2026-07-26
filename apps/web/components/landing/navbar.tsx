"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchMyRoom } from "@/lib/api";
import { Music } from "lucide-react";

const navItems = [
  { label: "Cách hoạt động", href: "#how-it-works" },
  { label: "Tính năng", href: "#features" },
  { label: "Phòng", href: "/rooms" }
];

export function Navbar() {
  const { user, requestLogin, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [myRoomId, setMyRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyRoom()
        .then((room) => { if (room) setMyRoomId(room.id); })
        .catch(() => {});
    } else {
      setMyRoomId(null);
    }
  }, [user]);

  return (
    <header className="glass sticky top-0 z-40 rounded-none border-b-0">
      <div className="container-clay flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-text">
          <span className="clay-icon !w-9 !h-9 !rounded-xl bg-accent/15">
            <Music size={18} className="text-accent" />
          </span>
          Listen<span className="text-accent">WithMe</span>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-widest text-muted md:flex">
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

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <button
              onClick={() =>
                requestLogin({ message: "Đăng nhập để chat, reaction và tạo phòng của riêng bạn." })
              }
              className="btn-ghost px-5 py-2 text-xs"
            >
              Đăng nhập
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:shadow-clay"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {user.avatar}
                </span>
                <span className="text-xs font-bold text-text">{user.name}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-line bg-card p-2 shadow-clay animate-slide-up">
                  <Link href="/profile" className="block rounded-xl px-3 py-2 text-sm text-text transition-colors hover:bg-accent/5">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
          {myRoomId ? (
            <Link href={`/room/${myRoomId}`} className="btn-success px-5 py-2 text-xs">
              Phòng của tôi
            </Link>
          ) : (
            <Link href="/rooms?create=1" className="btn-primary px-5 py-2 text-xs">
              Tạo phòng
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
