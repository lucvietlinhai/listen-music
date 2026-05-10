export function Footer() {
  return (
    <footer className="border-t border-white/[0.05] bg-black">
      <div className="mx-auto flex w-full flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted">© 2026 ListenWithMe. <span className="text-text">In Sync, Always.</span></p>
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-muted">
          <a href="#how-it-works" className="transition-colors hover:text-accent">
            How It Works
          </a>
          <a href="#features" className="transition-colors hover:text-accent">
            Features
          </a>
          <a href="/rooms" className="transition-colors hover:text-accent">
            Rooms
          </a>
        </div>
      </div>
    </footer>
  );
}

