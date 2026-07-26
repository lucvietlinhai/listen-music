import { ClayIcon } from "@/components/illustrations/clay-icons";
import { Radio, MessageSquare, ThumbsUp, Link, Shield, Mic } from "lucide-react";

const features = [
  {
    title: "Đồng bộ realtime",
    desc: "Tất cả thành viên nghe cùng bài, cùng thời điểm — không lệch một giây.",
    icon: Radio,
    color: "bg-[var(--clay-mint)]"
  },
  {
    title: "Chat & Reaction",
    desc: "Nhắn tin tức thì, gửi emoji reaction bay lên màn hình.",
    icon: MessageSquare,
    color: "bg-[var(--clay-pink)]"
  },
  {
    title: "Vote Skip",
    desc: "Bỏ phiếu skip bài theo tỷ lệ thành viên trong phòng.",
    icon: ThumbsUp,
    color: "bg-[var(--clay-peach)]"
  },
  {
    title: "Join qua Link",
    desc: "Chia sẻ link phòng — bạn bè vào ngay, không cần cài app.",
    icon: Link,
    color: "bg-accent/20"
  },
  {
    title: "Phân quyền",
    desc: "Hệ thống Guest / Member / Host linh hoạt và an toàn.",
    icon: Shield,
    color: "bg-[var(--clay-mint)]"
  },
  {
    title: "AI Voice Radio",
    desc: "Gửi tin nhắn ẩn danh — AI đọc lên bằng giọng Việt tự nhiên trước khi bài phát.",
    icon: Mic,
    color: "bg-[var(--clay-pink)]"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Tính năng</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Mọi thứ bạn cần để nghe nhạc cùng nhau
        </h2>
      </div>

      {/* Highlight card — AI Radio */}
      <article className="glass mb-8 overflow-hidden rounded-[32px] border border-accent/20 bg-gradient-to-br from-accent/[0.04] to-transparent p-8 md:p-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
          <div className="flex-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
              <Mic size={12} /> Highlight
            </p>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              AI Anonymous Radio
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Gửi tin nhắn ẩn danh khi thêm bài. Trước khi bài phát, AI sẽ đọc tin nhắn của bạn
              cho cả phòng nghe bằng giọng nói tiếng Việt tự nhiên.
            </p>
          </div>
          {/* Decorative illustration */}
          <div className="relative flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="glass-subtle flex h-16 w-16 items-center justify-center rounded-2xl">
                <Mic size={28} className="text-accent" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="glass-subtle h-3 w-32 rounded-full" />
                <div className="glass-subtle h-3 w-24 rounded-full" />
                <div className="glass-subtle h-3 w-28 rounded-full" />
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full bg-[var(--clay-pink)] opacity-60 blur-sm" />
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[var(--clay-mint)] opacity-60 blur-sm" />
          </div>
        </div>
      </article>

      {/* Feature grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((item) => (
          <article
            key={item.title}
            className="glass group rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-teal"
          >
            <ClayIcon icon={item.icon} className={item.color} size="md" />
            <h3 className="mt-4 text-base font-bold text-text">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
