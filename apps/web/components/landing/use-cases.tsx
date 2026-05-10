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
    <section className="mx-auto w-full px-6 py-20 lg:px-12">
      <div className="mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">For Every Listening Style</h2>
        <p className="mt-3 text-sm text-muted max-w-2xl">
          Whether you're working, chilling, or just need some background noise, there's a perfect space for you.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map((item) => (
          <article
            key={item.title}
            className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-teal"
          >
            <h3 className="text-lg font-bold tracking-tight text-text">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

