"use client";
import { useState, useEffect } from "react";
import { getUser, getToken, clearAuth, type AuthUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (token && u) setUser(u);
    setLoading(false);
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout, isAuthenticated: !!user };
}
