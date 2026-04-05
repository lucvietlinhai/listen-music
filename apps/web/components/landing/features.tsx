const features = [
  "Đồng bộ phát nhạc realtime",
  "Chat tức thì và emoji reaction",
  "Vote skip theo tỷ lệ thành viên",
  "Join phòng bằng link, không cần cài app",
  "Phân quyền Guest / Member / Host"
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-extrabold sm:text-3xl">Tính năng nổi bật</h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-accent bg-accent-soft/30 p-5">
          <p className="inline-flex rounded-full bg-accent px-2 py-1 text-xs font-bold text-slate-950">
            Khác biệt
          </p>
          <h3 className="mt-3 text-xl font-extrabold">Radio lời nhắn AI</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Người dùng gửi lời nhắn ẩn danh khi thêm bài. Trước khi phát nhạc, AI sẽ đọc lời
            nhắn bằng giọng tiếng Việt cho cả phòng.
          </p>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {features.map((item) => (
            <article key={item} className="rounded-2xl border border-line bg-card p-5">
              <p className="text-sm font-semibold">{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

