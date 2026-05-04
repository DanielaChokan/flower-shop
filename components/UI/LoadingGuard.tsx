"use client";

import { useAuth } from "@/modules/auth/AuthContext";

export default function LoadingGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid var(--secondary)",
          borderTopColor: "var(--primary)",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
