const useCases = [
  { title: "Yêu xa", desc: "Cùng nghe nhạc và gửi lời nhắn ngọt ngào." },
  { title: "Chill bạn bè", desc: "Tạo playlist chung cho buổi tối cuối tuần." },
  { title: "WFH", desc: "Mở phòng nhạc nền khi làm việc cùng team." },
  { title: "Đêm khuya", desc: "Bật phòng công khai để bớt cảm giác một mình." },
  { title: "Khám phá nhạc", desc: "Nghe các bài mới từ phòng cộng đồng." },
  { title: "Phòng riêng", desc: "Đặt mật khẩu để giữ không gian riêng tư." }
];

export function UseCases() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-extrabold sm:text-3xl">Dành cho mọi kiểu nghe nhạc</h2>
      <p className="mt-2 text-muted">Bạn nghe một mình hay cùng hội bạn, đều có phòng phù hợp.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent/70"
          >
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

