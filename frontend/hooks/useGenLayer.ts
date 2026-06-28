"use client";
import { useState, useCallback } from "react";

export type GLStatus =
  | "idle"
  | "SUBMITTING"
  | "PENDING"
  | "PROPOSING"
  | "COMMITTING"
  | "ACCEPTED"
  | "FINALIZED"
  | "UNDETERMINED"
  | "CANCELED"
  | "TIMEOUT"
  | "ERROR";

const STATUS_LABEL: Record<string, string> = {
  idle: "",
  SUBMITTING: "Submitting transaction to GenLayer…",
  PENDING: "Waiting for validators to pick up the transaction…",
  PROPOSING: "Leader validator is proposing a result…",
  COMMITTING: "Validators are voting on the consensus…",
  ACCEPTED: "Consensus reached — reading result…",
  FINALIZED: "Transaction finalized — reading result…",
  UNDETERMINED: "Validators could not reach consensus. Please try again.",
  CANCELED: "Transaction was cancelled.",
  TIMEOUT: "Timed out waiting for consensus (>10 min). Try again.",
  ERROR: "An error occurred. Please try again.",
};

export function useGenLayer<TResult = Record<string, unknown>>() {
  const [status, setStatus] = useState<GLStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string>("");

  const loading = status !== "idle" && status !== "ERROR" &&
    status !== "UNDETERMINED" && status !== "CANCELED" && status !== "TIMEOUT";

  const failed = ["UNDETERMINED", "CANCELED", "TIMEOUT", "ERROR"].includes(status);

  const run = useCallback(async (
    genLayerFn: (onStatus: (s: string) => void) => Promise<{ txHash: string; result: TResult; status: string; finalized: boolean }>,
    onSuccess?: (result: TResult, txHash: string) => Promise<void>
  ) => {
    setStatus("SUBMITTING");
    setError("");
    setResult(null);
    setTxHash(null);

    try {
      const out = await genLayerFn((s) => setStatus(s.toUpperCase() as GLStatus));
      setTxHash(out.txHash);

      if (out.finalized && out.result && Object.keys(out.result).length > 0) {
        setResult(out.result);
        setStatus("FINALIZED");
        await onSuccess?.(out.result, out.txHash);
      } else if (!out.finalized) {
        setStatus(out.status.toUpperCase() as GLStatus || "UNDETERMINED");
        setError(STATUS_LABEL[out.status.toUpperCase()] || "Consensus failed");
      } else {
        // finalized but empty result — show whatever we have
        setResult(out.result);
        setStatus("FINALIZED");
        await onSuccess?.(out.result, out.txHash);
      }
    } catch (e: any) {
      setStatus("ERROR");
      setError(e.message || "GenLayer call failed");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setResult(null);
    setError("");
  }, []);

  return { status, statusLabel: STATUS_LABEL[status] || status, txHash, result, error, loading, failed, run, reset };
}

export { STATUS_LABEL };
