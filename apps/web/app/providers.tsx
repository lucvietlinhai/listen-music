"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";

export function Providers({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}
