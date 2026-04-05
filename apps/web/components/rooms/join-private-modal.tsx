"use client";

import { FormEvent, useState } from "react";

type JoinPrivateModalProps = {
  open: boolean;
  roomName: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
};

export function JoinPrivateModal({ open, roomName, onClose, onSubmit }: JoinPrivateModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password !== "1234") {
      setError("Mật khẩu chưa đúng. Dùng mật khẩu mock: 1234");
      return;
    }
    setError("");
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-line bg-card p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted">Phòng riêng tư</p>
            <h2 className="text-lg font-extrabold">{roomName}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal tham gia phòng"
            className="text-sm text-muted transition hover:text-text"
          >
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="join-password" className="text-sm font-medium text-muted">
              Nhập mật khẩu để tham gia
            </label>
            <input
              id="join-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label="Mật khẩu tham gia phòng riêng tư"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
              placeholder="Mật khẩu"
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950"
          >
            Vào phòng
          </button>
        </form>
      </div>
    </div>
  );
}
