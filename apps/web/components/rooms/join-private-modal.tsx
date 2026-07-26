"use client";

import { FormEvent, useState } from "react";

type JoinPrivateModalProps = {
  open: boolean;
  roomName: string;
  onClose: () => void;
  /** Verify the password. Resolve to navigate, reject with an Error to show a message. */
  onSubmit: (password: string) => Promise<void>;
};

export function JoinPrivateModal({ open, roomName, onClose, onSubmit }: JoinPrivateModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err) {
      const message =
        err instanceof Error && err.message === "WRONG_PASSWORD"
          ? "Mật khẩu chưa đúng. Vui lòng thử lại."
          : "Không thể vào phòng. Vui lòng thử lại.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text/40 backdrop-blur-sm p-4 animate-fade-in">
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
            disabled={isSubmitting}
            className="btn-primary w-full py-3"
          >
            {isSubmitting ? "Đang kiểm tra..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
