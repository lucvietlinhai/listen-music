import Link from "next/link";
import { Music } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-line bg-card/50 backdrop-blur-sm">
      <div className="container-clay flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="clay-icon !w-8 !h-8 !rounded-lg bg-accent/15">
            <Music size={14} className="text-accent" />
          </span>
          <span className="text-sm font-bold text-text">
            Listen<span className="text-accent">WithMe</span>
          </span>
        </div>

        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-muted">
          <a href="#how-it-works" className="transition-colors hover:text-accent">
            Cách hoạt động
          </a>
          <a href="#features" className="transition-colors hover:text-accent">
            Tính năng
          </a>
          <Link href="/rooms" className="transition-colors hover:text-accent">
            Phòng
          </Link>
        </div>

        <p className="text-xs text-muted">
          © 2026 ListenWithMe. <span className="text-text font-semibold">In Sync, Always.</span>
        </p>
      </div>
    </footer>
  );
}
