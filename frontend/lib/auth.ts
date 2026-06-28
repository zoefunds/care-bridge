"use client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  is_verified: boolean;
  role: string;
  preferred_language?: string;
  wallet_address?: string;
}

export interface WalletBundle {
  encrypted_key: string;
  key_salt: string;
  key_iv: string;
  address: string;
}

export function saveAuth(
  token: string,
  user: AuthUser,
  walletBundle?: WalletBundle | null
) {
  localStorage.setItem("cb_token", token);
  localStorage.setItem("cb_user", JSON.stringify(user));
  if (walletBundle) {
    // Store encrypted bundle — never store the raw private key in localStorage
    sessionStorage.setItem("cb_wallet_bundle", JSON.stringify(walletBundle));
  }
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

export function getWalletBundle(): WalletBundle | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("cb_wallet_bundle");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem("cb_token");
  localStorage.removeItem("cb_user");
  sessionStorage.removeItem("cb_wallet_bundle");
  sessionStorage.removeItem("cb_wallet_key");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── In-memory private key cache (cleared on tab close) ───────────────────────

/**
 * Decrypt the user's EVM private key from the AES-256-GCM encrypted bundle.
 * Call this once after login with the user's password.
 * The result is cached in sessionStorage (hex string, NOT the raw bytes).
 */
export async function decryptWalletKey(
  bundle: WalletBundle,
  password: string
): Promise<string> {
  const cached = sessionStorage.getItem("cb_wallet_key");
  if (cached) return cached;

  const saltBytes = base64ToBytes(bundle.key_salt);
  const ivBytes = base64ToBytes(bundle.key_iv);
  const cipherBytes = base64ToBytes(bundle.encrypted_key);

  // Derive AES key using PBKDF2 (matches backend: SHA-256, 310_000 iterations, 32 bytes)
  const rawKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes.buffer as ArrayBuffer, iterations: 310_000, hash: "SHA-256" },
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt: AES-GCM with 12-byte IV, no AAD
  const plainBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes.buffer as ArrayBuffer },
    aesKey,
    cipherBytes.buffer as ArrayBuffer
  );

  const privateKeyHex = "0x" + bytesToHex(new Uint8Array(plainBytes));
  sessionStorage.setItem("cb_wallet_key", privateKeyHex);
  return privateKeyHex;
}

export function getCachedWalletKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("cb_wallet_key");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
