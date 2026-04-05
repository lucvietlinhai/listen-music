const steps = [
  { id: "01", title: "Mở phòng", desc: "Đặt tên phòng, chọn công khai hoặc riêng tư." },
  { id: "02", title: "Tìm bài", desc: "Thêm bài vào hàng đợi từ YouTube trong vài giây." },
  { id: "03", title: "Cùng nghe", desc: "Tất cả thành viên nghe cùng một thời điểm." }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-extrabold sm:text-3xl">3 bước để bắt đầu</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.id} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-3xl font-extrabold text-accent">{step.id}</p>
            <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted">{step.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

