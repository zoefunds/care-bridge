"use client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  is_verified: boolean;
  role: string;
  wallet_address?: string;
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("cb_token", token);
  localStorage.setItem("cb_user", JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cb_token");
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("cb_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem("cb_token");
  localStorage.removeItem("cb_user");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
