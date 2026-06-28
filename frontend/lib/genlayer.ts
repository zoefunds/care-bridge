"use client";

/**
 * Care Bridge — Client-side GenLayer service
 *
 * Flow for each health analysis:
 *   1. gen_sendTransaction  → txHash
 *   2. poll eth_getTransactionByHash every 6s
 *      → ACCEPTED (validators agreed, result in consensus_data) OR FINALIZED → read result
 *   3. POST result to backend for storage
 *
 * Users sign with their own EVM wallet. Backend never holds private keys.
 */

const GENLAYER_RPC =
  process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio.genlayer.com/api";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  "0xd5149cF96bB2A87066c7f95E96e1A1865e0A9AD1";

// ── RPC ───────────────────────────────────────────────────────────────────────

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(GENLAYER_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

// ── Call encoding ─────────────────────────────────────────────────────────────

function encodeCall(method: string, args: unknown[]): string {
  const payload = JSON.stringify({ method, args });
  let hex = "";
  for (let i = 0; i < payload.length; i++) {
    hex += payload.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex;
}

// ── Wallet helpers ────────────────────────────────────────────────────────────

function getStoredWalletAddress(): string {
  try {
    const user = JSON.parse(localStorage.getItem("cb_user") || "{}");
    return user.wallet_address || "";
  } catch {
    return "";
  }
}

function getStoredPrivateKey(): string {
  return sessionStorage.getItem("cb_wallet_key") || "";
}

// ── Send transaction ──────────────────────────────────────────────────────────

async function sendTransaction(
  privateKey: string,
  method: string,
  args: unknown[]
): Promise<string> {
  const from = getStoredWalletAddress();
  const data = encodeCall(method, args);

  const txHash = await rpc("gen_sendTransaction", [
    {
      from_address: from,
      to: CONTRACT_ADDRESS,
      data,
      value: "0x0",
      private_key: privateKey,
    },
  ]);

  if (typeof txHash !== "string") {
    throw new Error("gen_sendTransaction returned unexpected value: " + JSON.stringify(txHash));
  }
  return txHash;
}

// ── Polling ───────────────────────────────────────────────────────────────────

const TERMINAL_FAIL = new Set([
  "UNDETERMINED",
  "CANCELED",
  "VALIDATORS_TIMEOUT",
  "LEADER_TIMEOUT",
]);

export interface PollResult {
  status: string;
  consensusData: Record<string, unknown> | null;
}

/**
 * Poll until the tx reaches ACCEPTED or FINALIZED.
 * Both states mean validators have agreed — result is in consensus_data.
 * ACCEPTED is readable immediately; FINALIZED is the fully committed state.
 */
export async function pollTransaction(
  txHash: string,
  onStatus?: (status: string) => void,
  timeoutMs = 600_000
): Promise<PollResult> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(6000);
    try {
      const tx = (await rpc("eth_getTransactionByHash", [txHash])) as Record<string, unknown> | null;
      if (!tx) continue;

      const status = ((tx.status as string) || "PENDING").toUpperCase();
      onStatus?.(status);

      if (status === "FINALIZED" || status === "ACCEPTED") {
        // Extract consensus result from the transaction
        const consensusData = extractConsensusData(tx);
        return { status, consensusData };
      }

      if (TERMINAL_FAIL.has(status)) {
        return { status, consensusData: null };
      }
    } catch {
      // transient network error — keep polling
    }
  }

  return { status: "TIMEOUT", consensusData: null };
}

/**
 * Pull the consensus result out of the transaction object.
 * GenLayer stores the AI consensus result in consensus_data (or result field).
 */
function extractConsensusData(tx: Record<string, unknown>): Record<string, unknown> | null {
  // Try known locations in the tx object
  const candidates = [
    tx.consensus_data,
    tx.result,
    tx.output,
    (tx as any)?.consensus?.result,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = parseResult(candidate);
    if (Object.keys(parsed).length > 0) return parsed;
  }

  // If the tx itself contains useful fields, return the whole tx minus internals
  const { hash, nonce, blockHash, blockNumber, transactionIndex, from, to, value, gas, gasPrice, input, v, r, s, status, ...rest } = tx as any;
  if (Object.keys(rest).length > 0) return rest;

  return null;
}

// ── Read contract (for getter methods) ───────────────────────────────────────

export async function readContractView(
  method: string,
  args: unknown[]
): Promise<Record<string, unknown>> {
  const data = encodeCall(method, args);
  const raw = await rpc("gen_call", [
    {
      to: CONTRACT_ADDRESS,
      data,
      from_address: getStoredWalletAddress() || CONTRACT_ADDRESS,
    },
  ]);
  return parseResult(raw);
}

// ── Result parsing ────────────────────────────────────────────────────────────

function parseResult(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    // Strip markdown code fences
    const text = raw.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
    try { return JSON.parse(text); } catch { /* fall */ }
    // Try to extract embedded JSON object
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}") + 1;
    if (s !== -1 && e > s) {
      try { return JSON.parse(text.slice(s, e)); } catch { /* fall */ }
    }
    return { raw_text: text };
  }
  return {};
}

// ── Core write-poll-read flow ─────────────────────────────────────────────────

export interface OnChainResult {
  txHash: string;
  result: Record<string, unknown>;
  status: string;
  finalized: boolean;
}

async function writeContract(
  method: string,
  args: unknown[],
  onStatus?: (status: string) => void
): Promise<OnChainResult> {
  const privateKey = getStoredPrivateKey();
  if (!privateKey) throw new Error("Wallet not unlocked. Please log in again.");

  onStatus?.("SUBMITTING");
  const txHash = await sendTransaction(privateKey, method, args);

  onStatus?.("PENDING");
  const { status, consensusData } = await pollTransaction(txHash, onStatus);

  const finalized = status === "FINALIZED" || status === "ACCEPTED";

  return {
    txHash,
    result: consensusData || {},
    status,
    finalized,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Public health analysis functions ─────────────────────────────────────────

export async function analyzeSymptoms(
  userRef: string,
  symptoms: unknown[],
  context: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const symptomsJson = JSON.stringify(symptoms);
  const contextJson = JSON.stringify(context);
  const payloadHash = await sha256(`${recordId}:${userRef}:${symptomsJson}`);

  return writeContract(
    "analyze_symptoms",
    [recordId, userRef, symptomsJson, contextJson, payloadHash],
    onStatus
  );
}

export async function analyzeLabResults(
  userRef: string,
  markers: unknown[],
  context: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const markersJson = JSON.stringify(markers);
  const contextJson = JSON.stringify(context);
  const payloadHash = await sha256(`${recordId}:${userRef}:${markersJson}`);

  return writeContract(
    "analyze_lab_results",
    [recordId, userRef, markersJson, contextJson, payloadHash],
    onStatus
  );
}

export async function analyzeMedications(
  userRef: string,
  medications: string[],
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const medsJson = JSON.stringify(medications);
  const payloadHash = await sha256(`${recordId}:${userRef}:${medsJson}`);

  return writeContract(
    "explain_medications",
    [recordId, userRef, medsJson, "{}", payloadHash],
    onStatus
  );
}

export async function summarizeReport(
  userRef: string,
  reportText: string,
  reportType: string,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const payloadHash = await sha256(`${recordId}:${userRef}:${reportText.slice(0, 200)}`);

  return writeContract(
    "summarize_report",
    [recordId, userRef, reportText, reportType, payloadHash],
    onStatus
  );
}

export async function triagePatient(
  userRef: string,
  inputData: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const inputJson = JSON.stringify(inputData);
  const payloadHash = await sha256(`${recordId}:${userRef}:${inputJson.slice(0, 200)}`);

  return writeContract(
    "triage_patient",
    [recordId, userRef, inputJson, payloadHash],
    onStatus
  );
}

export async function prepareDoctorVisit(
  userRef: string,
  inputData: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const inputJson = JSON.stringify(inputData);
  const payloadHash = await sha256(`${recordId}:${userRef}:${inputJson.slice(0, 200)}`);

  return writeContract(
    "prepare_doctor_visit",
    [recordId, userRef, inputJson, payloadHash],
    onStatus
  );
}

export async function interpretHealthTrend(
  userRef: string,
  inputData: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const inputJson = JSON.stringify(inputData);
  const payloadHash = await sha256(`${recordId}:${userRef}:${inputJson.slice(0, 200)}`);

  return writeContract(
    "interpret_health_trend",
    [recordId, userRef, inputJson, payloadHash],
    onStatus
  );
}

export async function preventionPlan(
  userRef: string,
  inputData: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const inputJson = JSON.stringify(inputData);
  const payloadHash = await sha256(`${recordId}:${userRef}:${inputJson.slice(0, 200)}`);

  return writeContract(
    "create_prevention_plan",
    [recordId, userRef, inputJson, payloadHash],
    onStatus
  );
}

export async function answerHealthQuery(
  userRef: string,
  question: string,
  language: string,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const payloadHash = await sha256(`${recordId}:${userRef}:${question.slice(0, 200)}`);

  return writeContract(
    "answer_health_query",
    [recordId, userRef, question, language, payloadHash],
    onStatus
  );
}

export async function routeToCare(
  userRef: string,
  inputData: Record<string, unknown>,
  onStatus?: (s: string) => void
): Promise<OnChainResult> {
  const recordId = crypto.randomUUID().replace(/-/g, "");
  const inputJson = JSON.stringify(inputData);
  const payloadHash = await sha256(`${recordId}:${userRef}:${inputJson.slice(0, 200)}`);

  return writeContract(
    "route_to_care",
    [recordId, userRef, inputJson, payloadHash],
    onStatus
  );
}
