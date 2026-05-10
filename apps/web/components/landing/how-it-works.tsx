const steps = [
  { id: "01", title: "Mở phòng", desc: "Đặt tên phòng, chọn công khai hoặc riêng tư." },
  { id: "02", title: "Tìm bài", desc: "Thêm bài vào hàng đợi từ YouTube trong vài giây." },
  { id: "03", title: "Cùng nghe", desc: "Tất cả thành viên nghe cùng một thời điểm." }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full px-6 py-20 lg:px-12">
      <div className="mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">3 Steps to Start</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.id} className="glass-subtle rounded-2xl p-6 border border-white/[0.05]">
            <p className="text-4xl font-extrabold text-accent">{step.id}</p>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-text">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

