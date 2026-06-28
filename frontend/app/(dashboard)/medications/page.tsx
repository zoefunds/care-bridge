"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Pill, Plus, X, Loader2, Shield, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

export default function MedicationsPage() {
  const [input, setInput] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const gl = useAnalysis();
  const [medHistory, setMedHistory] = useState<any[]>([]);
  const [medHistoryLoading, setMedHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listMedications().then((r) => setMedHistory(r.data)).catch(() => {}).finally(() => setMedHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const add = () => {
    const m = input.trim();
    if (m && !medications.includes(m)) { setMedications([...medications, m]); setInput(""); }
  };

  const analyze = async () => {
    await gl.runJob(() => healthApi.analyzeMedications(medications));
  };

  const r = gl.result as any;
  // Result may be at top-level or nested under .medications / .analysis
  const meds: any[] = r?.medications || r?.analysis?.medications || r?.medication_details || [];
  const interactions: any[] = r?.drug_interactions || r?.interactions || r?.analysis?.drug_interactions || [];
  const overallRisk: string = r?.overall_interaction_risk || r?.overall_risk || "";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1800&q=80&fit=crop"
        accent="bg-emerald-500"
        tag="Drug Intelligence"
        title="Medication Intelligence"
        subtitle="Understand your medications — purpose, side effects, and interactions via AI consensus"
      />

      {!gl.result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter medications</label>
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
                placeholder="e.g. Metformin, Lisinopril..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
              <button onClick={add}
                className="px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {medications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {medications.map((m) => (
                  <span key={m} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-sm px-3 py-1.5 rounded-full">
                    <Pill className="w-3 h-3" /> {m}
                    <button onClick={() => setMedications(medications.filter((x) => x !== m))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {gl.loading && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{gl.statusLabel}</span>
            </div>
          )}

          {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

          <button onClick={analyze} disabled={gl.loading || medications.length === 0}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : `Analyze ${medications.length} medication${medications.length !== 1 ? "s" : ""} on-chain`}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          {overallRisk && (
            <div className={`rounded-xl p-4 border text-sm font-semibold ${overallRisk === "HIGH" ? "bg-red-50 border-red-200 text-red-700" : overallRisk === "MODERATE" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-green-50 border-green-200 text-green-700"}`}>
              Overall Interaction Risk: {overallRisk}
            </div>
          )}

          {meds.map((med: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{med.name || med.medication_name}</h3>
                  {med.drug_class && <p className="text-xs text-gray-400">{med.drug_class}</p>}
                  {med.purpose && <p className="text-xs text-gray-500 mt-0.5">{med.purpose}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {(med.common_uses || med.uses)?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1.5">Common uses</p>
                    <ul className="space-y-1 text-gray-500">
                      {(med.common_uses || med.uses).map((u: string, j: number) => <li key={j}>• {u}</li>)}
                    </ul>
                  </div>
                )}
                {(med.common_side_effects || med.side_effects)?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1.5">Common side effects</p>
                    <ul className="space-y-1 text-gray-500">
                      {(med.common_side_effects || med.side_effects).map((s: string, j: number) => <li key={j}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {(med.serious_side_effects || med.warnings)?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Serious side effects — seek care if they occur:</p>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {(med.serious_side_effects || med.warnings).map((s: string, j: number) => <li key={j}>• {s}</li>)}
                  </ul>
                </div>
              )}

              {med.missed_dose && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                  <p className="font-medium mb-0.5">Missed dose:</p>
                  <p>{med.missed_dose}</p>
                </div>
              )}
            </div>
          ))}

          {interactions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Drug Interactions</h3>
              {interactions.map((inter: any, idx: number) => (
                <div key={idx} className={`rounded-xl p-4 mb-3 last:mb-0 ${
                  inter.severity === "major" || inter.severity === "HIGH" ? "bg-red-50 border border-red-200" :
                  inter.severity === "moderate" || inter.severity === "MODERATE" ? "bg-amber-50 border border-amber-200" :
                  "bg-gray-50 border border-gray-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${inter.severity?.match(/major|HIGH/i) ? "text-red-500" : inter.severity?.match(/moderate/i) ? "text-amber-500" : "text-gray-400"}`} />
                    <span className="text-sm font-semibold">{inter.medications?.join(" + ") || inter.drugs?.join(" + ") || inter.combination}</span>
                    {inter.severity && <span className="text-xs px-2 py-0.5 rounded-full bg-white border capitalize">{inter.severity}</span>}
                  </div>
                  <p className="text-sm text-gray-600">{inter.description || inter.effect}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: show raw result if no structured data */}
          {meds.length === 0 && interactions.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">{JSON.stringify(r, null, 2)}</pre>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {r?.disclaimer || "Educational purposes only. Consult your prescriber or pharmacist for medical advice."}
          </div>

          <button onClick={() => { gl.reset(); setMedications([]); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Analyze different medications
          </button>
        </div>
      )}

      <AnalysisHistory
        items={medHistory.map((m) => ({ ...m, label: m.medication_name || "Medications" }))}
        loading={medHistoryLoading}
        title="Past medication analyses"
        renderResult={(result) => {
          const risk = result?.overall_interaction_risk || result?.overall_risk;
          const meds: any[] = result?.medications || result?.analysis?.medications || [];
          return (
            <div>
              {risk && <p className={`text-xs font-semibold mb-1 ${risk === "HIGH" ? "text-red-600" : risk === "MODERATE" ? "text-amber-600" : "text-green-600"}`}>Interaction risk: {risk}</p>}
              {meds.slice(0, 2).map((m: any, i: number) => (
                <p key={i} className="text-sm text-gray-700">• {m.name || m.medication_name} {m.purpose ? `— ${m.purpose}` : ""}</p>
              ))}
            </div>
          );
        }}
      />
    </div>
  );
}
