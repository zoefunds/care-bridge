"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { healthApi } from "@/lib/api";
import { Loader2, AlertTriangle, CheckCircle2, Activity, Stethoscope, Heart, RefreshCw } from "lucide-react";
import { AnalysisDetailLayout } from "@/components/ui/AnalysisDetailLayout";
import { getRiskColor, getRiskLabel } from "@/lib/utils";

function RiskBadge({ level }: { level: string }) {
  const label = getRiskLabel(level);
  const cls = getRiskColor(level);
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>{label}</span>;
}

function SymptomResult({ result }: { result: any }) {
  if (!result) return <p className="text-sm text-gray-400 italic">No result available.</p>;

  const r = result.analysis || result;
  const risk = r.triage_level || r.risk_level || r.urgency_level || r.overall_risk;
  const causes = r.possible_causes || r.possible_conditions || [];
  const tips = r.home_care_tips || r.recommendations || [];
  const redFlags = r.red_flags || [];
  const careRec = r.care_recommendation || r.recommendation || "";
  const summary = r.summary || r.interpretation || "";

  return (
    <div className="space-y-4">
      {risk && (
        <div className={`rounded-2xl p-5 border ${getRiskColor(risk)}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Triage Level</p>
          <p className="text-2xl font-bold">{getRiskLabel(risk)}</p>
          {careRec && <p className="mt-2 text-sm opacity-80">{careRec}</p>}
        </div>
      )}

      {summary && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-1">Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-sm text-red-800">Warning Signs — Seek Care If You Notice:</h3>
          </div>
          <ul className="space-y-1.5">
            {redFlags.map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {causes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-sm text-gray-900">Possible Causes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {causes.map((c: string, i: number) => (
              <span key={i} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}

      {tips.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm text-gray-900">Home Care Tips</h3>
          </div>
          <ul className="space-y-2">
            {tips.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />{t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function isEmptyResult(result: any) {
  if (!result) return true;
  const keys = Object.keys(result).filter((k) => k !== "record_id");
  if (keys.length === 0) return true;
  if (keys.length === 1 && keys[0] === "raw") return true;
  return false;
}

export default function SymptomDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    healthApi.getSymptom(id as string).then((r) => setItem(r.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!item || item.status !== "pending") return;
    const t = setTimeout(() => {
      healthApi.getSymptom(id as string).then((r) => setItem(r.data));
    }, 4000);
    return () => clearTimeout(t);
  }, [item, id]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await healthApi.retrySymptomRead(id as string);
      const poll = async () => {
        const r = await healthApi.getSymptom(id as string);
        setItem(r.data);
        if (r.data.status === "pending") setTimeout(poll, 4000);
        else setRetrying(false);
      };
      setTimeout(poll, 4000);
    } catch { setRetrying(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>;
  if (!item) return <div className="text-center py-24 text-gray-500">Analysis not found</div>;

  const r = item.result?.analysis || item.result || {};
  const risk = r.triage_level || r.risk_level || r.urgency_level;
  const hasEmptyResult = item.status === "complete" && isEmptyResult(item.result);

  return (
    <AnalysisDetailLayout
      backHref="/symptoms"
      backLabel="Symptoms"
      title="Symptom Analysis"
      status={item.status}
      createdAt={item.created_at}
      txHash={item.tx_hash}
      disclaimer={item.disclaimer}
      statusLine={risk ? `Triage: ${getRiskLabel(risk)}` : "Analysis complete"}
    >
      {item.status === "pending" && (
        <div className="flex items-center gap-3 text-sm text-sky-600 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Reading result from contract…
        </div>
      )}
      {item.status === "complete" && !hasEmptyResult && <SymptomResult result={item.result} />}
      {hasEmptyResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
          <p className="text-sm text-amber-800 font-medium">Result was not retrieved automatically.</p>
          <button onClick={handleRetry} disabled={retrying}
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {retrying ? "Fetching from contract…" : "Retry reading result"}
          </button>
        </div>
      )}
    </AnalysisDetailLayout>
  );
}
