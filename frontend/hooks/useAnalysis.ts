"use client";
import { useState, useCallback } from "react";
import { healthApi } from "@/lib/api";
import { useGenLayerTx } from "@/hooks/useGenLayerTx";

export type AnalysisStatus = "idle" | "submitting" | "signing" | "polling" | "complete" | "error";

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  idle: "",
  submitting: "Preparing analysis…",
  signing: "Signing transaction with your wallet…",
  polling: "AI validators reaching consensus…",
  complete: "Consensus reached",
  error: "Analysis failed",
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollUntilComplete(
  pollFn: () => Promise<{ status: string; result?: unknown; [k: string]: unknown }>,
  timeoutMs = 300_000,
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(5000);
    const data = await pollFn();
    if (data.status === "complete") return data;
    if (data.status === "error") throw new Error((data.result as any)?.error || "Analysis failed");
  }
  throw new Error("Timed out waiting for consensus");
}

export function useAnalysis<TResult = Record<string, unknown>>() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<TResult | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { sendTx } = useGenLayerTx();

  const loading = status === "submitting" || status === "signing" || status === "polling";
  const statusLabel = STATUS_LABEL[status];

  /**
   * Main flow:
   * 1. submitFn() → backend creates DB record, returns {id, contract_address, method, args, record_id, submit_url, poll_url}
   * 2. User's wallet signs + sends the GenLayer write transaction
   * 3. Backend receives tx_hash via submit_url, queues background read
   * 4. Frontend polls poll_url until status === "complete"
   */
  const runJob = useCallback(async (submitFn: () => Promise<{ data: any }>) => {
    setStatus("submitting");
    setResult(null);
    setError("");
    setTxHash(null);
    try {
      const res = await submitFn();
      const prep = res.data;
      const { id, contract_address, method, args, record_id, submit_url, poll_url } = prep;

      // Sign + send the transaction with the user's own wallet
      setStatus("signing");
      const hash = await sendTx(contract_address, method, args);
      setTxHash(hash);

      // Tell backend the tx hash so it can start polling for finalization + read
      await healthApi.submitTx(submit_url, { tx_hash: hash, record_id });

      // Poll until consensus is reached
      setStatus("polling");
      const data = await pollUntilComplete(
        async () => {
          const r = await healthApi.pollPath(poll_url);
          return r.data;
        },
      );
      setResult((data as any).result as TResult);
      setTxHash((data as any).tx_hash || hash);
      setStatus("complete");
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || "Unknown error");
      setStatus("error");
    }
  }, [sendTx]);

  // Legacy: direct (non-polling) result — kept for any page that still uses it
  const runDirect = useCallback(async (apiFn: () => Promise<{ data: any }>) => {
    setStatus("submitting");
    setResult(null);
    setError("");
    setTxHash(null);
    try {
      setStatus("polling");
      const res = await apiFn();
      const data = res.data;
      setResult(data.result ?? data.summary ?? data.triage ?? data);
      setTxHash(data.tx_hash || null);
      setStatus("complete");
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || "Unknown error");
      setStatus("error");
    }
  }, []);

  // Old run() helper kept for any page still using the two-function pattern
  const run = useCallback(async (
    submitFn: () => Promise<{ id: string; status: string }>,
    pollFn: (id: string) => Promise<any>,
    extractResult?: (data: any) => TResult,
  ) => {
    setStatus("submitting");
    setResult(null);
    setError("");
    setTxHash(null);
    try {
      const { id } = await submitFn();
      setStatus("polling");
      const data = await pollUntilComplete(() => pollFn(id));
      const r = extractResult ? extractResult(data) : (data as any).consensus_output;
      setResult(r);
      setTxHash((data as any).genlayer_tx_hash || null);
      setStatus("complete");
    } catch (e: any) {
      setError(e.message || "Unknown error");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError("");
    setTxHash(null);
  }, []);

  return { status, statusLabel, result, txHash, error, loading, run, runJob, runDirect, reset };
}
