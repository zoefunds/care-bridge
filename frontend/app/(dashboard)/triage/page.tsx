"use client";
import { useState } from "react";
import { healthApi } from "@/lib/api";
import { AlertTriangle, Loader2, Shield, Phone } from "lucide-react";
import { getRiskColor } from "@/lib/utils";

export default function TriagePage() {
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await healthApi.triage({
        symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
        history_notes: history,
      });
      setResult(res.data);
    } catch (e: any) { setError(e.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const level = result?.triage?.triage_level;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Risk Triage</h1>
        <p className="text-gray-500 text-sm mt-0.5">Get consensus-verified triage guidance: green, yellow, or red</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Emergency?</strong> If you believe you are in immediate danger, call emergency services immediately.
          Do not use this tool for emergencies.
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Symptoms (comma-separated)</label>
              <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3}
                placeholder="e.g. chest tightness, shortness of breath, dizziness"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Health history / context (optional)</label>
              <textarea value={history} onChange={(e) => setHistory(e.target.value)} rows={3}
                placeholder="Any relevant conditions, medications, recent events..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

          <button onClick={analyze} disabled={loading || !symptoms.trim()}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Running triage consensus..." : "Run Health Triage"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Level */}
          <div className={`rounded-2xl p-8 text-center border-2 ${
            level === "green" ? "border-green-300 bg-green-50" :
            level === "red" ? "border-red-300 bg-red-50" :
            "border-yellow-300 bg-yellow-50"
          }`}>
            <div className={`text-6xl font-black mb-3 ${
              level === "green" ? "text-green-500" :
              level === "red" ? "text-red-500" : "text-yellow-500"
            }`}>
              {level === "green" ? "🟢" : level === "red" ? "🔴" : "🟡"}
            </div>
            <h2 className={`text-2xl font-bold ${
              level === "green" ? "text-green-800" :
              level === "red" ? "text-red-800" : "text-yellow-800"
            }`}>
              {level === "green" ? "Self-Care" : level === "red" ? "Urgent Attention" : "Medical Review Recommended"}
            </h2>
            <p className={`mt-3 text-sm ${level === "green" ? "text-green-700" : level === "red" ? "text-red-700" : "text-yellow-700"}`}>
              {result.triage?.triage_summary}
            </p>
          </div>

          {result.triage?.emergency_services && (
            <div className="bg-red-600 text-white rounded-2xl p-5 flex items-center gap-4">
              <Phone className="w-8 h-8 shrink-0" />
              <div>
                <p className="font-bold text-lg">Call Emergency Services Now</p>
                <p className="text-red-100 text-sm">Your symptoms may require immediate medical attention.</p>
              </div>
            </div>
          )}

          {result.triage?.immediate_actions?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Immediate actions</h3>
              <ul className="space-y-2">
                {result.triage.immediate_actions.map((a: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i+1}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result.triage?.disclaimer || result.disclaimer}
          </div>

          <button onClick={() => setResult(null)}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Run new triage
          </button>
        </div>
      )}
    </div>
  );
}
