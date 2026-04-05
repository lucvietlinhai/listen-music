import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "ListenWithMe | Nghe nhạc cùng nhau",
  description:
    "Nghe nhạc cùng nhau theo thời gian thực. Tạo phòng, chat, reaction và radio lời nhắn ẩn danh bằng giọng AI.",
  openGraph: {
    title: "ListenWithMe",
    description:
      "Ứng dụng nghe nhạc cùng nhau theo thời gian thực với tính năng radio lời nhắn ẩn danh AI.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={beVietnam.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
