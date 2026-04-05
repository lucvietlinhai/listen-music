"use client";

import { FormEvent, useMemo, useState } from "react";

type CreateRoomPayload = {
  name: string;
  isPrivate: boolean;
  password?: string;
};

type CreateRoomModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRoomPayload) => void;
};

export function CreateRoomModal({ open, onClose, onSubmit }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (isPrivate && password.length < 4) return false;
    return true;
  }, [isPrivate, name, password.length]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Tên phòng không được để trống.");
      return;
    }
    if (isPrivate && password.length < 4) {
      setError("Mật khẩu cần ít nhất 4 ký tự.");
      return;
    }

    setError("");
    onSubmit({
      name: trimmed,
      isPrivate,
      password: isPrivate ? password : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-line bg-card p-5">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-extrabold">Tạo phòng mới</h2>
          <button
            onClick={onClose}
            aria-label="Đóng modal tạo phòng"
            className="text-sm text-muted transition hover:text-text"
          >
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="room-name" className="text-sm font-medium text-muted">
              Tên phòng
            </label>
            <input
              id="room-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Tên phòng"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
              placeholder="Ví dụ: Chill Cuối Tuần"
            />
          </div>

          <div className="rounded-lg border border-line bg-surface p-3">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-medium">Phòng riêng tư</span>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
                aria-label="Bật tắt phòng riêng tư"
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>

          {isPrivate ? (
            <div className="space-y-2">
              <label htmlFor="room-password" className="text-sm font-medium text-muted">
                Mật khẩu phòng
              </label>
              <input
                id="room-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label="Mật khẩu phòng"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
                placeholder="Nhập ít nhất 4 ký tự"
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tạo phòng
          </button>
        </form>
      </div>
    </div>
  );
}
