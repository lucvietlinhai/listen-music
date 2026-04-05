"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-line bg-card p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose-300">Lỗi hệ thống</p>
        <h1 className="mt-2 text-3xl font-extrabold">Đã xảy ra sự cố</h1>
        <p className="mt-3 text-sm text-muted">
          Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử tải lại.
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}

