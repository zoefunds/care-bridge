"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { healthApi } from "@/lib/api";
import { Loader2, CheckCircle2, AlertTriangle, Pill, RefreshCw, ShieldAlert } from "lucide-react";
import { AnalysisDetailLayout } from "@/components/ui/AnalysisDetailLayout";

function MedResult({ result }: { result: any }) {
  if (!result) return <p className="text-sm text-gray-400 italic">No result available.</p>;

  const r = result.analysis || result;
  const interactions: any[] = r.interactions || r.drug_interactions || [];
  const sideEffects: string[] = r.side_effects || r.common_side_effects || [];
  const recommendations: string[] = r.recommendations || r.monitoring || [];
  const warnings: string[] = r.warnings || r.contraindications || [];
  const summary = r.summary || r.interpretation || r.overall_assessment || "";
  const safetyRating = r.safety_rating || r.safety_level || "";

  return (
    <div className="space-y-4">
      {summary && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-1">Overview</p>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {safetyRating && (
        <div className={`rounded-2xl p-5 border ${
          safetyRating.toLowerCase().includes("high") || safetyRating.toLowerCase().includes("concern")
            ? "bg-red-50 border-red-200 text-red-800"
            : safetyRating.toLowerCase().includes("moderate")
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-green-50 border-green-200 text-green-800"
        }`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Safety Rating</p>
          <p className="text-lg font-bold">{safetyRating}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-sm text-red-800">Warnings & Contraindications</h3>
          </div>
          <ul className="space-y-1.5">
            {warnings.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {interactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-sm text-gray-900">Drug Interactions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {interactions.map((item: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900">{typeof item === "string" ? item : item.drug || item.name || JSON.stringify(item)}</p>
                  {item.severity && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.severity.toLowerCase() === "major" ? "bg-red-100 text-red-700" :
                      item.severity.toLowerCase() === "moderate" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{item.severity}</span>
                  )}
                </div>
                {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {sideEffects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-sky-500" />
            <h3 className="font-semibold text-sm text-gray-900">Side Effects to Watch</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sideEffects.map((s: string, i: number) => (
              <span key={i} className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm text-gray-900">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MedicationDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthApi.getMedication(id as string).then((r) => setItem(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>;
  if (!item) return <div className="text-center py-24 text-gray-500">Analysis not found</div>;

  return (
    <AnalysisDetailLayout
      backHref="/medications"
      backLabel="Medications"
      title="Medication Analysis"
      status={item.status}
      createdAt={item.created_at}
      txHash={item.tx_hash}
      disclaimer={item.disclaimer}
    >
      {item.status === "complete" && item.result && <MedResult result={item.result} />}
    </AnalysisDetailLayout>
  );
}
