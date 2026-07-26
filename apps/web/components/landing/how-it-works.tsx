import { ClayIcon } from "@/components/illustrations/clay-icons";
import { DoorOpen, Search, Play } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Mở phòng",
    desc: "Đặt tên phòng, chọn công khai hoặc riêng tư. Chia sẻ link cho bạn bè.",
    icon: DoorOpen,
    color: "bg-[var(--clay-peach)]"
  },
  {
    id: "02",
    title: "Tìm bài hát",
    desc: "Tìm kiếm và thêm bài vào hàng đợi trực tiếp từ YouTube.",
    icon: Search,
    color: "bg-[var(--clay-mint)]"
  },
  {
    id: "03",
    title: "Cùng nghe",
    desc: "Tất cả thành viên nghe cùng một bài, cùng thời điểm. Chat và react realtime.",
    icon: Play,
    color: "bg-[var(--clay-pink)]"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Đơn giản</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          3 bước để bắt đầu
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <article
            key={step.id}
            className="glass group relative rounded-[28px] p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-teal"
          >
            {/* Step connector line (hidden on last) */}
            {i < steps.length - 1 && (
              <div className="absolute right-0 top-1/2 hidden h-[2px] w-8 translate-x-full bg-gradient-to-r from-accent/30 to-transparent md:block" />
            )}

            <ClayIcon icon={step.icon} className={step.color} />

            <p className="mt-1 text-xs font-bold text-muted">Bước {step.id}</p>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-text">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
