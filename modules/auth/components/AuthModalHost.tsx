"use client";

import { useAuth } from "@/modules/auth/AuthContext";
import AuthModal from "@/modules/auth/components/AuthModal";

export default function AuthModalHost() {
  const { isAuthOpen } = useAuth();

  if (!isAuthOpen) return null;

  return <AuthModal />;
}
