"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { getRiskColor, getRiskLabel } from "@/lib/utils";
import { Activity, Plus, X, Loader2, Shield, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

export default function SymptomsPage() {
  const [symptomInput, setSymptomInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const gl = useAnalysis();
  const [symHistory, setSymHistory] = useState<any[]>([]);
  const [symHistoryLoading, setSymHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listSymptoms().then((r) => setSymHistory(r.data)).catch(() => {}).finally(() => setSymHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const addSymptom = () => {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s) && symptoms.length < 20) {
      setSymptoms([...symptoms, s]);
      setSymptomInput("");
    }
  };

  const handleAnalyze = async () => {
    if (symptoms.length === 0) return;
    await gl.runJob(() =>
      healthApi.analyzeSymptoms({ symptoms: symptoms.map((s) => ({ name: s })), duration, severity })
    );
  };

  const r = gl.result as any;
  const analysis = r?.consensus_output?.analysis || r?.analysis || r;
  const riskLevel = analysis?.risk_level || analysis?.overall_risk || analysis?.triage_level || analysis?.urgency_level;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1800&q=80&fit=crop"
        accent="bg-violet-500"
        tag="AI Symptom Check"
        title="Symptom Intelligence"
        subtitle="Enter your symptoms for multi-validator AI consensus assessment powered by GenLayer"
      />

      {!gl.result ? (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add symptoms</label>
              <div className="flex gap-2">
                <input
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSymptom())}
                  placeholder="e.g. headache, fever, fatigue..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
                <button onClick={addSymptom}
                  className="px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {symptoms.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-sm px-3 py-1.5 rounded-full">
                      {s}
                      <button onClick={() => setSymptoms(symptoms.filter((x) => x !== s))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white">
                  <option value="">Select duration</option>
                  <option>Less than 1 hour</option>
                  <option>1-6 hours</option>
                  <option>6-24 hours</option>
                  <option>1-3 days</option>
                  <option>3-7 days</option>
                  <option>More than 1 week</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white">
                  <option value="">Select severity</option>
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                </select>
              </div>
            </div>
          </div>

          {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

          {gl.loading && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{gl.statusLabel}</span>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={gl.loading || symptoms.length === 0}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : `Analyze ${symptoms.length} symptom${symptoms.length !== 1 ? "s" : ""} on-chain`}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          <div className={`rounded-2xl p-6 border ${getRiskColor(riskLevel)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Triage Guidance</p>
                <p className="text-2xl font-bold mt-1">{getRiskLabel(riskLevel)}</p>
                {(analysis?.care_recommendation || analysis?.immediate_action || analysis?.care_channel) && (
                  <p className="mt-2 text-sm opacity-80">{analysis?.care_recommendation || analysis?.immediate_action || analysis?.care_channel?.replace(/_/g, " ")}</p>
                )}
              </div>
              {(analysis?.emergency_flag || analysis?.is_emergency) && (
                <div className="bg-red-100 border border-red-200 rounded-xl p-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              )}
            </div>
          </div>

          {analysis?.summary && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-sm text-gray-700">{analysis.summary}</p>
            </div>
          )}

          {(analysis?.possible_conditions || analysis?.differential_diagnoses || analysis?.possible_causes)?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Possible causes to discuss with a doctor</h3>
              <ul className="space-y-1.5">
                {(analysis?.possible_conditions || analysis?.differential_diagnoses || analysis?.possible_causes).map((c: any, i: number) => (
                  <li key={i} className="text-sm text-gray-700">• {typeof c === "string" ? c : c.condition || c.name}</li>
                ))}
              </ul>
            </div>
          )}

          {(analysis?.warning_signs || analysis?.red_flags)?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Warning signs to watch for</h3>
              <ul className="space-y-1.5">
                {(analysis?.warning_signs || analysis?.red_flags).map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(analysis?.recommendations || analysis?.self_care || analysis?.home_care_tips)?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Home care tips</h3>
              <ul className="space-y-1.5">
                {(analysis?.recommendations || analysis?.self_care || analysis?.home_care_tips).map((r: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-sky-500">→</span> {r}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis?.questions_for_doctor?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Questions to ask your doctor</h3>
              <ul className="space-y-1.5">
                {analysis.questions_for_doctor.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-indigo-400">?</span> {q}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis?.when_to_seek_care && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">When to seek care</p>
              <p>{analysis.when_to_seek_care}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {analysis?.disclaimer || "Educational guidance only. Not a diagnosis. Always consult a healthcare provider."}
          </div>

          <button onClick={() => { gl.reset(); setSymptoms([]); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Analyze new symptoms
          </button>
        </div>
      )}

      <AnalysisHistory
        items={symHistory}
        loading={symHistoryLoading}
        title="Past symptom analyses"
        detailHref={(id) => `/symptoms/${id}`}
        renderResult={(result) => {
          const level = result?.triage_level || result?.overall_risk || result?.risk_level;
          return (
            <div>
              {level && <p className="text-sm font-medium text-gray-700">{getRiskLabel(level)}</p>}
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{result?.summary || result?.care_recommendation || ""}</p>
            </div>
          );
        }}
      />
    </div>
  );
}
