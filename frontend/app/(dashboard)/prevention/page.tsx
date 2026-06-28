"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Heart, Loader2, Shield, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

const PRIORITY_COLORS: Record<string, string> = {
  LOW:      "bg-green-50 border-green-200 text-green-800",
  MODERATE: "bg-amber-50 border-amber-200 text-amber-800",
  HIGH:     "bg-red-50 border-red-200 text-red-800",
};

export default function PreventionPage() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [conditions, setConditions] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [family, setFamily] = useState("");
  const gl = useAnalysis();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listJobs("prevention").then((r) => setJobHistory(r.data)).catch(() => {}).finally(() => setJobHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const generate = async () => {
    await gl.runJob(() => healthApi.preventionPlan({
      age: age || "unknown",
      gender: gender || "not specified",
      conditions,
      lifestyle,
      family,
    }));
  };

  const result = gl.result as any;
  const priority = (result?.overall_priority || "").toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&q=80&fit=crop"
        accent="bg-pink-500"
        tag="Prevention Plan"
        title="Preventive Health Coach"
        subtitle="Get a personalised prevention plan with consensus-verified AI guidance"
      />

      {!gl.result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 35"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white">
                  <option value="">Prefer not to say</option>
                  <option>Male</option><option>Female</option><option>Non-binary</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Existing health conditions</label>
              <input value={conditions} onChange={(e) => setConditions(e.target.value)}
                placeholder="Type 2 diabetes, hypertension, asthma… or none"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lifestyle description</label>
              <textarea value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} rows={3}
                placeholder="Activity level, diet habits, smoking/alcohol, sleep, stress level…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Family health history</label>
              <input value={family} onChange={(e) => setFamily(e.target.value)}
                placeholder="Heart disease, diabetes, cancer in close relatives…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
          </div>

          {gl.loading && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{gl.statusLabel}</span>
            </div>
          )}

          {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

          <button onClick={generate} disabled={gl.loading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : "Generate Prevention Plan on-chain"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          {priority && PRIORITY_COLORS[priority] && (
            <div className={`rounded-2xl p-5 border ${PRIORITY_COLORS[priority]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Prevention Priority</p>
              <p className="text-2xl font-bold">{priority}</p>
            </div>
          )}

          {result?.risk_factors_identified?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Factors Identified
              </h3>
              <ul className="space-y-1.5">
                {result.risk_factors_identified.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {result?.lifestyle_recommendations?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Lifestyle Recommendations</h3>
              <ul className="space-y-3">
                {result.lifestyle_recommendations.map((rec: any, i: number) => (
                  <li key={i} className="text-sm text-gray-700">
                    {typeof rec === "string" ? (
                      <span>• {rec}</span>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-800">{rec.category || rec.title}</p>
                        {(rec.recommendation || rec.action) && <p className="text-gray-600 mt-0.5">{rec.recommendation || rec.action}</p>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.screening_recommendations?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Recommended Screenings</h3>
              <ul className="space-y-1.5">
                {result.screening_recommendations.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-sky-500 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.health_goals?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Health Goals</h3>
              <ul className="space-y-1.5">
                {result.health_goals.map((g: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result?.disclaimer || "Educational guidance only. Discuss all health decisions with your healthcare provider."}
          </div>

          <button onClick={() => gl.reset()}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            New Prevention Plan
          </button>
        </div>
      )}

      <AnalysisHistory
        items={jobHistory}
        loading={jobHistoryLoading}
        title="Past prevention plans"
        renderResult={(result) => {
          const recs = result?.recommendations || result?.lifestyle_recommendations || [];
          return (
            <div>
              {recs.slice(0, 2).map((rec: any, i: number) => (
                <p key={i} className="text-sm text-gray-700 line-clamp-1">
                  {typeof rec === "string" ? rec : rec.recommendation || rec.action || rec.category || JSON.stringify(rec)}
                </p>
              ))}
              {recs.length === 0 && <p className="text-sm text-gray-400">No recommendations found</p>}
            </div>
          );
        }}
      />
    </div>
  );
}
