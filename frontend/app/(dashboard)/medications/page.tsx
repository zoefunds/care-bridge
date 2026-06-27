"use client";
import { useState } from "react";
import { healthApi } from "@/lib/api";
import { Pill, Plus, X, Loader2, Shield, AlertTriangle } from "lucide-react";

export default function MedicationsPage() {
  const [input, setInput] = useState("");
  const [medications, setMedications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const add = () => {
    const m = input.trim();
    if (m && !medications.includes(m)) { setMedications([...medications, m]); setInput(""); }
  };

  const analyze = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await healthApi.analyzeMedications(medications);
      setResult(res.data);
    } catch (e: any) { setError(e.response?.data?.detail || "Analysis failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medication Intelligence</h1>
        <p className="text-gray-500 text-sm mt-0.5">Understand your medications — purpose, side effects, and interactions</p>
      </div>

      {!result ? (
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

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

          <button onClick={analyze} disabled={loading || medications.length === 0}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Analyzing with GenLayer consensus..." : `Analyze ${medications.length} medication${medications.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Per-medication */}
          {result.consensus_output?.medications?.map((med: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{med.name}</h3>
                  <p className="text-xs text-gray-400">{med.drug_class}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {med.common_uses?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1.5">Common uses</p>
                    <ul className="space-y-1 text-gray-500">
                      {med.common_uses.map((u: string, j: number) => <li key={j}>• {u}</li>)}
                    </ul>
                  </div>
                )}
                {med.common_side_effects?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1.5">Common side effects</p>
                    <ul className="space-y-1 text-gray-500">
                      {med.common_side_effects.map((s: string, j: number) => <li key={j}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {med.serious_side_effects?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Serious side effects — seek care if they occur:</p>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {med.serious_side_effects.map((s: string, j: number) => <li key={j}>• {s}</li>)}
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

          {/* Interactions */}
          {result.consensus_output?.drug_interactions?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Drug Interactions</h3>
              {result.consensus_output.drug_interactions.map((i: any, idx: number) => (
                <div key={idx} className={`rounded-xl p-4 mb-3 ${
                  i.severity === "major" ? "bg-red-50 border border-red-200" :
                  i.severity === "moderate" ? "bg-amber-50 border border-amber-200" :
                  "bg-gray-50 border border-gray-200"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${i.severity === "major" ? "text-red-500" : i.severity === "moderate" ? "text-amber-500" : "text-gray-400"}`} />
                    <span className="text-sm font-semibold">{i.medications?.join(" + ")}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border capitalize">{i.severity}</span>
                  </div>
                  <p className="text-sm text-gray-600">{i.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result.disclaimer}
          </div>

          <button onClick={() => { setResult(null); setMedications([]); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Analyze different medications
          </button>
        </div>
      )}
    </div>
  );
}
