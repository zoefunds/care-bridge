"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { healthApi } from "@/lib/api";
import { getRiskColor, getRiskLabel, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle, Loader2, Shield } from "lucide-react";
import Link from "next/link";

function StatusIcon({ status }: { status: string }) {
  if (status === "normal") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "high") return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (status === "low") return <AlertCircle className="w-4 h-4 text-amber-500" />;
  return null;
}

export default function LabAnalysisDetailPage() {
  const { id } = useParams();
  const [lab, setLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthApi.getLab(id as string)
      .then((r) => setLab(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
    </div>
  );

  if (!lab) return <div className="text-center py-24 text-gray-500">Analysis not found</div>;

  const output = lab.consensus_output || {};
  const markers = output.markers_analysis || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/lab-analysis" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Analysis Result</h1>
          <p className="text-gray-400 text-sm">{formatDate(lab.created_at)}</p>
        </div>
      </div>

      {/* Risk banner */}
      <div className={`rounded-2xl p-6 border ${getRiskColor(lab.risk_level)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Overall Risk Level</p>
            <p className="text-2xl font-bold mt-1">{getRiskLabel(lab.risk_level)}</p>
            {output.overall_summary && (
              <p className="mt-3 text-sm opacity-80">{output.overall_summary}</p>
            )}
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            lab.risk_level === "green" ? "bg-green-100" :
            lab.risk_level === "red" ? "bg-red-100" : "bg-yellow-100"
          }`}>
            <span className="text-3xl">
              {lab.risk_level === "green" ? "✓" : lab.risk_level === "red" ? "!" : "~"}
            </span>
          </div>
        </div>
      </div>

      {/* GenLayer proof */}
      {lab.genlayer_tx_hash && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
          <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-800">Verified on GenLayer StudioNet</p>
            <p className="text-xs text-indigo-500 font-mono mt-1">{lab.genlayer_tx_hash}</p>
          </div>
        </div>
      )}

      {/* Markers */}
      {markers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Marker Analysis</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {markers.map((m: any, i: number) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={m.status} />
                    <span className="font-medium text-gray-900">{m.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      m.status === "normal" ? "bg-green-100 text-green-700" :
                      m.status === "high" ? "bg-red-100 text-red-700" :
                      m.status === "low" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                    }`}>{m.status?.toUpperCase() || "—"}</span>
                    <p className="text-sm text-gray-700 mt-1">{m.value}</p>
                  </div>
                </div>
                {m.explanation && <p className="text-sm text-gray-500">{m.explanation}</p>}
                {m.reference_range && (
                  <p className="text-xs text-gray-400 mt-1">Reference: {m.reference_range}</p>
                )}
                {m.potential_causes?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Potential non-diagnostic causes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.potential_causes.map((c: string, j: number) => (
                        <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {output.recommendations?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {output.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
        {output.disclaimer || "This analysis is for educational purposes only and does not constitute medical advice."}
      </div>
    </div>
  );
}
