"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { healthApi } from "@/lib/api";
import { Loader2, CheckCircle2, AlertTriangle, Pill, RefreshCw, ShieldAlert } from "lucide-react";
import { AnalysisDetailLayout } from "@/components/ui/AnalysisDetailLayout";

function isEmptyResult(result: any) {
  if (!result) return true;
  const keys = Object.keys(result).filter((k) => k !== "record_id");
  if (keys.length === 0) return true;
  if (keys.length === 1 && keys[0] === "raw") return true;
  return false;
}

function MedResult({ result }: { result: any }) {
  if (!result) return null;

  // Contract returns: { interaction_risk, analysis: { medications[], potential_interactions[], overall_interaction_risk, pharmacist_questions[], general_notes[] } }
  const a = result.analysis || result;
  const overallRisk: string = a.overall_interaction_risk || result.interaction_risk || "";
  const medications: any[] = a.medications || [];
  const interactions: any[] = a.potential_interactions || a.interactions || a.drug_interactions || [];
  const pharmacistQs: string[] = a.pharmacist_questions || a.recommendations || [];
  const generalNotes: string[] = a.general_notes || [];

  const riskColor = overallRisk === "HIGH"
    ? "bg-red-50 border-red-200 text-red-800"
    : overallRisk === "MODERATE"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-green-50 border-green-200 text-green-800";

  return (
    <div className="space-y-4">
      {overallRisk && (
        <div className={`rounded-2xl p-5 border ${riskColor}`}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Overall Interaction Risk</p>
          <p className="text-2xl font-bold">{overallRisk}</p>
        </div>
      )}

      {medications.map((med: any, i: number) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Pill className="w-4 h-4 text-sky-500" />
            <h3 className="font-semibold text-sm text-gray-900">{med.name}</h3>
            {med.drug_class && <span className="text-xs text-gray-400 ml-auto">{med.drug_class}</span>}
          </div>
          <div className="p-5 space-y-4">
            {med.how_it_works && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-1">How It Works</p>
                <p className="text-sm text-gray-600">{med.how_it_works}</p>
              </div>
            )}
            {med.common_uses?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Common Uses</p>
                <div className="flex flex-wrap gap-1.5">
                  {med.common_uses.map((u: string, j: number) => (
                    <span key={j} className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full">{u}</span>
                  ))}
                </div>
              </div>
            )}
            {med.common_side_effects?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Side Effects to Watch</p>
                <div className="flex flex-wrap gap-1.5">
                  {med.common_side_effects.map((s: string, j: number) => (
                    <span key={j} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {med.important_warnings?.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <p className="text-xs font-semibold text-red-700">Important Warnings</p>
                </div>
                <ul className="space-y-1">
                  {med.important_warnings.map((w: string, j: number) => (
                    <li key={j} className="text-xs text-red-700 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-red-500 shrink-0" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {med.food_interactions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Food & Drink Interactions</p>
                <ul className="space-y-1">
                  {med.food_interactions.map((f: string, j: number) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {med.timing_tips?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Timing Tips</p>
                <ul className="space-y-1">
                  {med.timing_tips.map((t: string, j: number) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {interactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Potential Drug Interactions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {interactions.map((item: any, i: number) => {
              const severity = item.severity_concern || item.severity || "";
              const drugs: string[] = item.drugs || (item.drug ? [item.drug] : []);
              return (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900 text-sm">
                      {drugs.length > 0 ? drugs.join(" + ") : (item.name || JSON.stringify(item))}
                    </p>
                    {severity && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        severity === "HIGH" ? "bg-red-100 text-red-700" :
                        severity === "MODERATE" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{severity}</span>
                    )}
                  </div>
                  {item.interaction_type && <p className="text-xs text-gray-400 mt-0.5">{item.interaction_type}</p>}
                  {item.educational_note && <p className="text-sm text-gray-500 mt-1">{item.educational_note}</p>}
                  {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pharmacistQs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm text-gray-900">Questions for Your Pharmacist / Doctor</h3>
          </div>
          <ul className="space-y-2">
            {pharmacistQs.map((q: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {generalNotes.length > 0 && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-2">General Notes</p>
          <ul className="space-y-1.5">
            {generalNotes.map((n: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-sky-400 shrink-0" />{n}
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
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    healthApi.getMedication(id as string).then((r) => setItem(r.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!item || item.status !== "pending") return;
    const t = setTimeout(() => {
      healthApi.getMedication(id as string).then((r) => setItem(r.data));
    }, 4000);
    return () => clearTimeout(t);
  }, [item, id]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await healthApi.retryMedicationRead(id as string);
      const poll = async () => {
        const r = await healthApi.getMedication(id as string);
        setItem(r.data);
        if (r.data.status === "pending") setTimeout(poll, 4000);
        else setRetrying(false);
      };
      setTimeout(poll, 4000);
    } catch { setRetrying(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>;
  if (!item) return <div className="text-center py-24 text-gray-500">Analysis not found</div>;

  const hasEmptyResult = item.status === "complete" && isEmptyResult(item.result);

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
      {item.status === "pending" && (
        <div className="flex items-center gap-3 text-sm text-sky-600 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Reading result from contract…
        </div>
      )}

      {item.status === "complete" && !hasEmptyResult && <MedResult result={item.result} />}

      {hasEmptyResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
          <p className="text-sm text-amber-800 font-medium">Result was not retrieved automatically. This can happen if the contract read timed out.</p>
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
