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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" className="glass w-full max-w-sm rounded-2xl p-6 shadow-glass animate-slide-up">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-warning">Private Room</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-text">{roomName}</h2>
          </div>
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
            <label htmlFor="join-password" className="text-xs font-semibold uppercase tracking-widest text-muted">
              Enter Password
            </label>
            <input
              id="join-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label="Room Password"
              type="password"
              className="glass-input w-full px-4 py-3"
              placeholder="Password"
            />
          </div>

          {error ? <p className="text-xs font-semibold text-danger">{error}</p> : null}

          <button
            type="submit"
            className="btn-primary w-full py-3"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
