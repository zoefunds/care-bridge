"use client";
import { useState } from "react";
import { healthApi } from "@/lib/api";
import { getRiskColor, getRiskLabel } from "@/lib/utils";
import { Activity, Plus, X, Loader2, Shield, AlertTriangle } from "lucide-react";

export default function SymptomsPage() {
  const [symptomInput, setSymptomInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const addSymptom = () => {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s) && symptoms.length < 20) {
      setSymptoms([...symptoms, s]);
      setSymptomInput("");
    }
  };

  const removeSymptom = (s: string) => setSymptoms(symptoms.filter((x) => x !== s));

  const handleAnalyze = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await healthApi.analyzeSymptoms({ symptoms, duration, severity });
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Symptom Intelligence</h1>
        <p className="text-gray-500 text-sm mt-0.5">Enter your symptoms for multi-model consensus assessment</p>
      </div>

      {!result ? (
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
                  className="px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {symptoms.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-sm px-3 py-1.5 rounded-full">
                      {s}
                      <button onClick={() => removeSymptom(s)} className="hover:text-sky-900">
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

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

          <button onClick={handleAnalyze} disabled={loading || symptoms.length === 0}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Analyzing with GenLayer validators..." : `Analyze ${symptoms.length} symptom${symptoms.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Risk level */}
          <div className={`rounded-2xl p-6 border ${getRiskColor(result.risk_level)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Triage Guidance</p>
                <p className="text-2xl font-bold mt-1">{getRiskLabel(result.risk_level)}</p>
                {result.care_recommendation && (
                  <p className="mt-2 text-sm opacity-80">{result.care_recommendation}</p>
                )}
              </div>
              {result.emergency_flag && (
                <div className="bg-red-100 border border-red-200 rounded-xl p-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              )}
            </div>
          </div>

          {result.emergency_flag && (
            <div className="bg-red-600 text-white rounded-xl p-4 font-semibold text-center">
              ⚠️ Seek emergency medical care immediately
            </div>
          )}

          {result.consensus_output?.warning_signs?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Warning signs to watch for</h3>
              <ul className="space-y-1.5">
                {result.consensus_output.warning_signs.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            This is educational guidance only. Not a diagnosis. Always consult a healthcare provider.
          </div>

          <button onClick={() => { setResult(null); setSymptoms([]); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">
            Analyze new symptoms
          </button>
        </div>
      )}
    </div>
  );
}
