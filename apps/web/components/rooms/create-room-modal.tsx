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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" className="glass w-full max-w-md rounded-2xl p-6 shadow-glass animate-slide-up">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-bold tracking-tight text-text">Create Room</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="btn-ghost px-2 py-1 text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="room-name" className="text-xs font-semibold uppercase tracking-widest text-muted">
              Room Name
            </label>
            <input
              id="room-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Room Name"
              className="glass-input w-full px-4 py-3"
              placeholder="e.g., Weekend Chill"
            />
          </div>

          <div className="glass-subtle rounded-xl p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-semibold text-text">Private Room</span>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
                aria-label="Toggle private room"
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>

          {isPrivate ? (
            <div className="space-y-2 animate-slide-up">
              <label htmlFor="room-password" className="text-xs font-semibold uppercase tracking-widest text-muted">
                Room Password
              </label>
              <input
                id="room-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label="Room Password"
                type="password"
                className="glass-input w-full px-4 py-3"
                placeholder="At least 4 characters"
              />
            </div>
          ) : null}

          {error ? <p className="text-xs font-semibold text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full py-3"
          >
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
}
