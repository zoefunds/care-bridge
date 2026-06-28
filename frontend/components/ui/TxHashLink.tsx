"use client";
import { ExternalLink } from "lucide-react";

const EXPLORER = "https://explorer-studio.genlayer.com/tx/";

export function TxHashLink({ hash }: { hash: string | null | undefined }) {
  if (!hash) return null;
  return (
    <a
      href={`${EXPLORER}${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all hover:bg-green-100 transition-colors group"
    >
      <span className="shrink-0">✓ On-chain tx:</span>
      <span className="flex-1 break-all">{hash}</span>
      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-green-500 group-hover:text-green-700" />
    </a>
  );
}
