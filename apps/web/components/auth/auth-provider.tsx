"use client";

import { createContext, ReactNode, useContext, useMemo, useRef, useState } from "react";

export type AuthUser = {
  name: string;
  email: string;
  avatar: string;
};

type LoginRequest = {
  message: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  requestLogin: (request: LoginRequest, onSuccess?: () => void) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const demoUser: AuthUser = {
  name: "Nguyễn Minh Huy",
  email: "minhhuy.demo@gmail.com",
  avatar: "MH"
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("Đăng nhập Google để tiếp tục.");
  const pendingActionRef = useRef<(() => void) | null>(null);

  const requestLogin = (request: LoginRequest, onSuccess?: () => void) => {
    setLoginMessage(request.message);
    pendingActionRef.current = onSuccess ?? null;
    setModalOpen(true);
  };

  const login = () => {
    setUser(demoUser);
    setModalOpen(false);
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      requestLogin,
      logout
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={modalOpen}
        message={loginMessage}
        onClose={() => setModalOpen(false)}
        onLogin={login}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function LoginModal({
  open,
  message,
  onClose,
  onLogin
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  onLogin: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-line bg-card p-5 transition duration-200"
      >
        <h2 className="text-xl font-extrabold">Đăng nhập để tham gia</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>

        <button
          onClick={onLogin}
          aria-label="Đăng nhập với Google"
          className="mt-5 w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-slate-950"
        >
          Đăng nhập với Google
        </button>

        <p className="mt-2 text-xs text-muted">
          Bản hiện tại đang dùng đăng nhập mock để duyệt UI/UX.
        </p>

        <button
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng nhập"
          className="mt-4 w-full rounded-lg border border-line px-4 py-2 text-sm font-medium"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
