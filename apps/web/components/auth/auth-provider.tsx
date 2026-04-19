"use client";

import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiAuthUser, clearAuthSession, getStoredAuthUser, loginWithGoogle } from "@/lib/api";

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
const GOOGLE_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const toAuthUser = (value: ApiAuthUser): AuthUser => ({
  name: value.name,
  email: value.email ?? "",
  avatar: value.name.slice(0, 2).toUpperCase()
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState("Dang nhap Google de tiep tuc.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = getStoredAuthUser();
    if (stored && !stored.isGuest) {
      setUser(toAuthUser(stored));
    }
  }, []);

  const requestLogin = (request: LoginRequest, onSuccess?: () => void) => {
    setLoginMessage(request.message);
    setLoginError("");
    pendingActionRef.current = onSuccess ?? null;
    setModalOpen(true);
  };

  const loginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    setModalOpen(false);
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  const onGoogleCredential = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setLoginError("Khong lay duoc token Google.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");
    try {
      const result = await loginWithGoogle(idToken);
      if (!result.user || result.user.isGuest) {
        throw new Error("Tai khoan khong hop le.");
      }
      loginSuccess(toAuthUser(result.user));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Dang nhap Google that bai. Vui long thu lai.";
      setLoginError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    clearAuthSession();
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
        isSubmitting={isSubmitting}
        loginError={loginError}
        googleEnabled={GOOGLE_ENABLED}
        onClose={() => setModalOpen(false)}
        onGoogleCredential={onGoogleCredential}
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
  isSubmitting,
  loginError,
  googleEnabled,
  onClose,
  onGoogleCredential
}: {
  open: boolean;
  message: string;
  isSubmitting: boolean;
  loginError: string;
  googleEnabled: boolean;
  onClose: () => void;
  onGoogleCredential: (credentialResponse: CredentialResponse) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-line bg-card p-5 transition duration-200"
      >
        <h2 className="text-xl font-extrabold">Dang nhap de tham gia</h2>
        <p className="mt-2 text-sm text-muted">{message}</p>

        {googleEnabled ? (
          <div className="mt-5 grid place-items-center">
            <GoogleLogin onSuccess={onGoogleCredential} onError={() => null} useOneTap={false} />
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
            Thieu NEXT_PUBLIC_GOOGLE_CLIENT_ID. Chua the bat nut dang nhap Google.
          </div>
        )}

        {isSubmitting ? <p className="mt-3 text-xs text-muted">Dang xu ly dang nhap...</p> : null}
        {loginError ? <p className="mt-3 text-xs text-red-300">{loginError}</p> : null}

        <button
          onClick={onClose}
          aria-label="Dong cua so dang nhap"
          className="mt-4 w-full rounded-lg border border-line px-4 py-2 text-sm font-medium"
        >
          Dong
        </button>
      </div>
    </div>
  );
}
