import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-line bg-card p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">404</p>
        <h1 className="mt-2 text-3xl font-extrabold">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm text-muted">
          Liên kết có thể đã thay đổi hoặc bạn nhập sai địa chỉ.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}

