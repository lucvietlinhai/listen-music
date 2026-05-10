const features = [
  "Đồng bộ phát nhạc realtime",
  "Chat tức thì và emoji reaction",
  "Vote skip theo tỷ lệ thành viên",
  "Join phòng bằng link, không cần cài app",
  "Phân quyền Guest / Member / Host"
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full px-6 py-20 lg:px-12">
      <div className="mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Platform Features</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="glass rounded-2xl border border-accent/20 bg-accent/[0.03] p-8 shadow-glass transition-all duration-300 hover:shadow-glow-teal">
          <p className="inline-flex rounded bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
            Highlight
          </p>
          <h3 className="mt-5 text-2xl font-bold tracking-tight text-text">AI Anonymous Radio</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Send anonymous messages when queueing a track. Before the song plays, our AI will read your message aloud to the entire room using natural Vietnamese voice synthesis.
          </p>
        </article>

        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
          {features.map((item) => (
            <article key={item} className="glass-subtle rounded-2xl p-6 transition-all duration-300 hover:border-white/10 hover:-translate-y-1">
              <p className="text-sm font-bold text-text">{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

