"use client";
import { useState } from "react";
import { Clock, ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface HistoryItem {
  id: string;
  status: string;
  created_at: string;
  tx_hash?: string | null;
  result?: any;
  label?: string; // optional display label (e.g. medication name)
}

interface Props {
  items: HistoryItem[];
  loading?: boolean;
  title?: string;
  renderResult: (result: any, item: HistoryItem) => React.ReactNode;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete")
    return <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Complete</span>;
  if (status === "error")
    return <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><AlertCircle className="w-3 h-3" /> Error</span>;
  return <span className="flex items-center gap-1 text-xs text-amber-500 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Pending</span>;
}

export function AnalysisHistory({ items, loading, title = "Past analyses", renderResult }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2 mt-6">
        {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-400" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={item.status} />
                <span className="text-sm text-gray-700 truncate">
                  {item.label || formatDate(item.created_at)}
                </span>
                {item.label && (
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(item.created_at)}</span>
                )}
              </div>
              {expanded === item.id
                ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>

            {expanded === item.id && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                {item.tx_hash && (
                  <a
                    href={`https://explorer-studio.genlayer.com/tx/${item.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-green-600 break-all hover:text-green-700 hover:underline flex items-start gap-1"
                  >
                    ✓ tx: {item.tx_hash}
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                  </a>
                )}
                {item.status === "complete" && item.result
                  ? renderResult(item.result, item)
                  : item.status === "error"
                  ? <p className="text-sm text-red-500">Analysis failed. Please try again.</p>
                  : <p className="text-sm text-gray-400 italic">Analysis in progress…</p>
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
