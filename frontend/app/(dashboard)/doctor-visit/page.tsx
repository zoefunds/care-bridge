"use client";
import { useState } from "react";
import { healthApi } from "@/lib/api";
import { Stethoscope, Loader2, Shield, CheckCircle2 } from "lucide-react";

export default function DoctorVisitPage() {
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const generate = async () => {
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Visit Assistant</h1>
        <p className="text-gray-500 text-sm mt-0.5">Prepare for your appointment with structured notes and questions</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current symptoms</label>
              <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3}
                placeholder="Describe your symptoms (comma-separated or free-form)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical history & context</label>
              <textarea value={history} onChange={(e) => setHistory(e.target.value)} rows={4}
                placeholder="Existing conditions, current medications, allergies, recent changes..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

          <button onClick={generate} disabled={loading || !symptoms.trim()}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Generating visit preparation..." : "Generate Visit Preparation"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-sky-500" />
              </div>
              <h2 className="font-semibold text-gray-900">Visit Summary</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{result.triage?.triage_summary}</p>
          </div>

          {result.triage?.primary_concerns?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Primary concerns to discuss</h3>
              <ul className="space-y-2">
                {result.triage.primary_concerns.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.triage?.monitoring?.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-3">Suggested questions for your doctor</h3>
              <ul className="space-y-1.5">
                {result.triage.monitoring.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-indigo-700">• {q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result.disclaimer}
          </div>

          <button onClick={() => setResult(null)}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Prepare for different visit
          </button>
        </div>
      )}
    </div>
  );
}
