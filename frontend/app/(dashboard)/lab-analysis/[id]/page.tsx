"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { healthApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Minus, Loader2, Shield, Heart, Apple, Calendar } from "lucide-react";
import Link from "next/link";
import { TxHashLink } from "@/components/ui/TxHashLink";

function FlagStatus({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "HIGH") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
      <TrendingUp className="w-3 h-3" /> High
    </span>
  );
  if (s === "LOW") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      <TrendingDown className="w-3 h-3" /> Low
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
      <Minus className="w-3 h-3" /> Normal
    </span>
  );
}

function LabResultView({ result }: { result: any }) {
  if (!result) return <p className="text-sm text-gray-400 italic">No result data available.</p>;

  const flags: any[] = result.flags || result.markers_analysis || [];
  const summary = result.analysis?.summary || result.overall_summary || result.summary || "";
  const lifestyle: string[] = result.lifestyle_notes || result.recommendations || [];
  const followUp: string[] = result.follow_up_suggestions || [];

  const abnormal = flags.filter((f) => (f.status || "").toUpperCase() !== "NORMAL");
  const normal = flags.filter((f) => (f.status || "").toUpperCase() === "NORMAL");

  return (
    <div className="space-y-5">
      {summary && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-1">Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {abnormal.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Values Needing Attention ({abnormal.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {abnormal.map((f, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{f.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Your value: <span className="font-medium text-gray-800">{f.value}{f.unit ? ` ${f.unit}` : ""}</span>
                      {f.reference_range && <span className="ml-2 text-gray-400">· Normal: {f.reference_range}</span>}
                    </p>
                  </div>
                  <FlagStatus status={f.status} />
                </div>
                {f.educational_note && (
                  <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">{f.educational_note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {normal.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Normal Values ({normal.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {normal.map((f, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {f.value}{f.unit ? ` ${f.unit}` : ""}
                    {f.reference_range && ` · Ref: ${f.reference_range}`}
                  </p>
                </div>
                <FlagStatus status={f.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {lifestyle.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Apple className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Lifestyle Tips</h3>
          </div>
          <ul className="space-y-2">
            {lifestyle.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {followUp.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-sky-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Follow-up Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {followUp.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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

  const result = lab.result || null;
  const flags: any[] = result?.flags || result?.markers_analysis || [];
  const abnormalCount = flags.filter((f) => (f.status || "").toUpperCase() !== "NORMAL").length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/lab-analysis" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Analysis Result</h1>
          <p className="text-gray-400 text-sm">{lab.created_at ? formatDate(lab.created_at) : "—"}</p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl p-5 border flex items-center gap-4 ${
        lab.status === "complete" ? "bg-green-50 border-green-200" :
        lab.status === "error" ? "bg-red-50 border-red-200" :
        "bg-sky-50 border-sky-200"
      }`}>
        {lab.status === "complete" ? (
          <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0" />
        ) : lab.status === "error" ? (
          <AlertCircle className="w-7 h-7 text-red-500 shrink-0" />
        ) : (
          <Loader2 className="w-7 h-7 text-sky-500 shrink-0 animate-spin" />
        )}
        <div>
          <p className="font-semibold text-gray-900">
            {lab.status === "complete"
              ? `Analysis complete${abnormalCount > 0 ? ` — ${abnormalCount} value${abnormalCount > 1 ? "s" : ""} need attention` : " — all values normal"}`
              : lab.status === "error" ? "Analysis failed"
              : "Analysis in progress…"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {flags.length > 0 ? `${flags.length} biomarker${flags.length > 1 ? "s" : ""} analysed` : "Waiting for result"}
          </p>
        </div>
        {lab.status === "complete" && (
          <div className="ml-auto">
            <Heart className="w-6 h-6 text-green-400" />
          </div>
        )}
      </div>

      {/* On-chain proof */}
      {lab.tx_hash && <TxHashLink hash={lab.tx_hash} />}

      {/* Result */}
      {lab.status === "complete" && result && <LabResultView result={result} />}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
        {lab.disclaimer || "This analysis is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional."}
      </div>
    </div>
  );
}
