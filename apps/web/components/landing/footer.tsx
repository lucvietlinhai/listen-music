export function Footer() {
  return (
    <footer className="border-t border-line bg-bg/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 ListenWithMe. Nghe nhạc cùng nhau, theo thời gian thực.</p>
        <div className="flex gap-4">
          <a href="#how-it-works" className="hover:text-text">
            Cách hoạt động
          </a>
          <a href="#features" className="hover:text-text">
            Tính năng
          </a>
          <a href="#rooms" className="hover:text-text">
            Phòng công khai
          </a>
        </div>
      </div>
    </footer>
  );
}

