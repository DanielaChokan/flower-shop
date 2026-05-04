"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/AuthContext";

export default function AuthRequiredListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuth, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (searchParams.get("authRequired") === "1" && !user) {
      openAuth();
      router.replace("/");
    }
  }, [searchParams, openAuth, user, loading, router]);

  return null;
}
