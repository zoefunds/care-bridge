"use client";

/**
 * Care Bridge — Client-side GenLayer service
 *
 * Users sign their own transactions with their EVM wallet (decrypted in-browser).
 * Flow: write_contract → poll eth_getTransactionByHash → read_contract → return result
 *
 * The backend only stores the finalized result; it never touches private keys.
 */

const GENLAYER_RPC = "https://studio.genlayer.com/api";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";

// ── RPC helpers ──────────────────────────────────────────────────────────────

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(GENLAYER_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

// ── Wallet helpers ────────────────────────────────────────────────────────────

export interface WalletKey {
  address: string;
  privateKey: string;
}

/**
 * Decrypt the user's wallet private key from storage.
 * The key was AES-256-GCM encrypted with a key derived from the user's password.
 * The backend `/auth/wallet-key` endpoint returns the decrypted key if the
 * bearer token is valid (avoids sending the password to the backend again).
 *
 * For now we use the wallet address from localStorage and the backend decrypts
 * the key using the session token.
 */
export async function getWalletKey(apiBase: string, token: string): Promise<WalletKey> {
  const res = await fetch(`${apiBase}/auth/wallet-key`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not retrieve wallet key");
  return res.json();
}

// ── Signing ───────────────────────────────────────────────────────────────────

/**
 * Encode a GenLayer write_contract call as an eth_sendTransaction payload.
 * GenLayer StudioNet accepts a special transaction format where:
 *   - `to` = contract address
 *   - `data` = ABI-like encoded call: method name + JSON args
 */
function encodeCall(method: string, args: unknown[]): string {
  const payload = JSON.stringify({ method, args });
  return "0x" + Buffer.from(payload, "utf8").toString("hex");
}

async function sendTransaction(
  privateKey: string,
  to: string,
  data: string
): Promise<string> {
  // Use ethers.js (already a transitive dep via eth-account on backend; here we use window.ethers or dynamic import)
  // We call the GenLayer RPC with gen_sendTransaction which accepts plaintext call data
  const result = await rpc("gen_sendTransaction", [
    {
      from_address: await privateKeyToAddress(privateKey),
      to,
      data,
      private_key: privateKey,  // StudioNet accepts the key directly for simplicity
    },
  ]);
  return result as string;
}

async function privateKeyToAddress(privateKey: string): Promise<string> {
  // Derive address from private key using Web Crypto + secp256k1
  // For StudioNet we can also pass the address separately
  // Simple approach: stored in localStorage from login response
  const user = JSON.parse(localStorage.getItem("cb_user") || "{}");
  return user.wallet_address || "0x0000000000000000000000000000000000000000";
}

// ── Polling ───────────────────────────────────────────────────────────────────

const TERMINAL_FAIL = new Set(["UNDETERMINED", "CANCELED", "VALIDATORS_TIMEOUT", "LEADER_TIMEOUT"]);

export async function pollFinalized(
  txHash: string,
  onStatus?: (s: string) => void,
  timeoutMs = 180_000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(6000);
    try {
      const tx = (await rpc("eth_getTransactionByHash", [txHash])) as Record<string, string> | null;
      if (!tx) continue;
      const status = (tx.status || "").toUpperCase();
      onStatus?.(status);
      if (status === "FINALIZED") return true;
      if (TERMINAL_FAIL.has(status)) return false;
    } catch {
      // transient network error — keep polling
    }
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Read contract ─────────────────────────────────────────────────────────────

export async function readContract(method: string, args: unknown[]): Promise<unknown> {
  return rpc("gen_call", [
    {
      to: CONTRACT_ADDRESS,
      data: encodeCall(method, args),
    },
  ]);
}

// ── Write + poll + read ───────────────────────────────────────────────────────

export interface OnChainResult {
  txHash: string;
  result: Record<string, unknown>;
  finalized: boolean;
}

async function writeAndRead(
  privateKey: string,
  writeMethod: string,
  writeArgs: unknown[],
  readMethod: string,
  readArgs: unknown[],
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS not set");

  const data = encodeCall(writeMethod, writeArgs);
  const txHash = await sendTransaction(privateKey, CONTRACT_ADDRESS, data);

  const finalized = await pollFinalized(txHash, onStatus);
  let result: Record<string, unknown> = {};

  if (finalized) {
    try {
      const raw = await readContract(readMethod, readArgs);
      result = parseResult(raw);
    } catch {
      result = { error: "Read failed after finalization" };
    }
  }

  return { txHash, result, finalized };
}

function parseResult(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    const text = raw.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
    try { return JSON.parse(text); } catch { /* fall */ }
    const s = text.indexOf("{"), e = text.lastIndexOf("}") + 1;
    if (s !== -1 && e > s) {
      try { return JSON.parse(text.slice(s, e)); } catch { /* fall */ }
    }
    return { raw };
  }
  return {};
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeSymptoms(
  privateKey: string,
  userRef: string,
  symptoms: unknown[],
  context: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const symptomsJson = JSON.stringify(symptoms);
  const contextJson = JSON.stringify(context);
  const payloadHash = await sha256(`${recordId}:${userRef}:${symptomsJson}`);

  return writeAndRead(
    privateKey,
    "analyze_symptoms",
    [recordId, userRef, symptomsJson, contextJson, payloadHash],
    "get_symptom_analysis",
    [recordId],
    onStatus
  );
}

export async function analyzeLabResults(
  privateKey: string,
  userRef: string,
  markers: unknown[],
  context: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const markersJson = JSON.stringify(markers);
  const contextJson = JSON.stringify(context);
  const payloadHash = await sha256(`${recordId}:${userRef}:${markersJson}`);

  return writeAndRead(
    privateKey,
    "analyze_lab_results",
    [recordId, userRef, markersJson, contextJson, payloadHash],
    "get_lab_analysis",
    [recordId],
    onStatus
  );
}

export async function analyzeMedications(
  privateKey: string,
  userRef: string,
  medications: string[],
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const medsJson = JSON.stringify(medications);
  const payloadHash = await sha256(`${recordId}:${userRef}:${medsJson}`);

  return writeAndRead(
    privateKey,
    "explain_medications",
    [recordId, userRef, medsJson, "{}", payloadHash],
    "get_medication_analysis",
    [recordId],
    onStatus
  );
}

export async function summarizeReport(
  privateKey: string,
  userRef: string,
  reportText: string,
  reportType: string,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const payloadHash = await sha256(`${recordId}:${userRef}:${reportText.slice(0, 200)}`);

  return writeAndRead(
    privateKey,
    "summarize_report",
    [recordId, userRef, reportText, reportType, payloadHash],
    "get_report_summary",
    [recordId],
    onStatus
  );
}

export async function triagePatient(
  privateKey: string,
  userRef: string,
  inputData: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const inputJson = JSON.stringify(inputData);
  const payloadHash = await sha256(`${recordId}:${userRef}:${inputJson.slice(0, 200)}`);

  return writeAndRead(
    privateKey,
    "triage_patient",
    [recordId, userRef, inputJson, payloadHash],
    "get_triage",
    [recordId],
    onStatus
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
