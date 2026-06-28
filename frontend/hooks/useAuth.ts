"use client";
import { useState, useEffect } from "react";
import { getUser, getToken, clearAuth, type AuthUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const sync = () => {
      const token = getToken();
      const u = getUser();
      if (token && u) setUser(u);
      else setUser(null);
      setLoading(false);
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout, isAuthenticated: !!user };
}
