import { Heart, Users, Laptop, Moon, Compass, Lock } from "lucide-react";

const useCases = [
  { title: "Yêu xa", desc: "Cùng nghe nhạc và gửi lời nhắn ngọt ngào.", Icon: Heart, tone: "pink" as const },
  { title: "Chill bạn bè", desc: "Tạo playlist chung cho buổi tối cuối tuần.", Icon: Users, tone: "mint" as const },
  { title: "WFH", desc: "Mở phòng nhạc nền khi làm việc cùng team.", Icon: Laptop, tone: "peach" as const },
  { title: "Đêm khuya", desc: "Bật phòng công khai để bớt cảm giác một mình.", Icon: Moon, tone: "accent" as const },
  { title: "Khám phá nhạc", desc: "Nghe các bài mới từ phòng cộng đồng.", Icon: Compass, tone: "pink" as const },
  { title: "Phòng riêng", desc: "Đặt mật khẩu để giữ không gian riêng tư.", Icon: Lock, tone: "mint" as const }
];

const toneStyles: Record<string, { bg: string; color: string }> = {
  pink: { bg: "rgba(255, 158, 196, 0.18)", color: "#ff6ba8" },
  mint: { bg: "rgba(127, 224, 196, 0.18)", color: "#2bb996" },
  peach: { bg: "rgba(255, 197, 158, 0.20)", color: "#e8873f" },
  accent: { bg: "var(--accent-soft)", color: "var(--accent)" }
};

export function UseCases() {
  return (
    <section className="py-16">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">For Every Listening Style</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
          Dù bạn đang làm việc, thư giãn hay chỉ cần chút âm thanh nền, luôn có một không gian phù hợp.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map(({ title, desc, Icon, tone }) => {
          const style = toneStyles[tone];
          return (
            <article
              key={title}
              className="glass-subtle rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <span
                className="clay-icon mb-4"
                style={{ background: style.bg, color: style.color }}
              >
                <Icon size={26} strokeWidth={2.2} />
              </span>
              <h3 className="text-lg font-bold tracking-tight text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
