"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/modules/auth/AuthContext";

const PUBLIC_PATHS = ["/"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuth } = useAuth();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      openAuth();
    }
  }, [user, loading, isPublic, openAuth]);

  if (loading) return null;

  if (!user && !isPublic) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        color: "var(--muted)",
        fontSize: "15px",
      }}>
        <span>Увійдіть, щоб переглянути цю сторінку</span>
      </div>
    );
  }

  return <>{children}</>;
}
