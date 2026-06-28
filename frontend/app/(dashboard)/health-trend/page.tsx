"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { TrendingUp, TrendingDown, Minus, Loader2, Shield, Plus, Trash2 } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

const METRICS = [
  { value: "blood_glucose", label: "Blood Glucose (mg/dL)" },
  { value: "blood_pressure_systolic", label: "Blood Pressure Systolic (mmHg)" },
  { value: "blood_pressure_diastolic", label: "Blood Pressure Diastolic (mmHg)" },
  { value: "heart_rate", label: "Heart Rate (bpm)" },
  { value: "weight", label: "Weight (kg)" },
  { value: "bmi", label: "BMI" },
  { value: "cholesterol", label: "Total Cholesterol (mg/dL)" },
  { value: "hemoglobin", label: "Hemoglobin (g/dL)" },
  { value: "oxygen_saturation", label: "Oxygen Saturation (%)" },
  { value: "temperature", label: "Body Temperature (°C)" },
];

const TREND_ICON: Record<string, React.ReactNode> = {
  IMPROVING: <TrendingUp className="w-5 h-5 text-green-600" />,
  STABLE: <Minus className="w-5 h-5 text-blue-500" />,
  WORSENING: <TrendingDown className="w-5 h-5 text-red-500" />,
  FLUCTUATING: <TrendingUp className="w-5 h-5 text-amber-500" />,
  INSUFFICIENT_DATA: <Minus className="w-5 h-5 text-gray-400" />,
};

const TREND_COLOR: Record<string, string> = {
  IMPROVING: "bg-green-50 border-green-200 text-green-800",
  STABLE: "bg-blue-50 border-blue-200 text-blue-800",
  WORSENING: "bg-red-50 border-red-200 text-red-800",
  FLUCTUATING: "bg-amber-50 border-amber-200 text-amber-800",
  INSUFFICIENT_DATA: "bg-gray-50 border-gray-200 text-gray-600",
};

export default function HealthTrendPage() {
  const [metric, setMetric] = useState("blood_glucose");
  const [readings, setReadings] = useState([
    { value: "", date: "" },
    { value: "", date: "" },
    { value: "", date: "" },
  ]);
  const [context, setContext] = useState("");
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const gl = useAnalysis();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.getTimeline(metric).then((r) => setTimelineData(r.data)).catch(() => {});
  }, [metric]);

  useEffect(() => {
    healthApi.listJobs("trend").then((r) => setJobHistory(r.data)).catch(() => {}).finally(() => setJobHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const addReading = () => setReadings((p) => [...p, { value: "", date: "" }]);
  const removeReading = (i: number) => setReadings((p) => p.filter((_, idx) => idx !== i));
  const updateReading = (i: number, field: "value" | "date", val: string) =>
    setReadings((p) => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const analyze = async () => {
    const valid = readings.filter((r) => r.value.trim());
    if (valid.length < 2) { return; }

    const metricLabel = METRICS.find((m) => m.value === metric)?.label || metric;
    const newPoints = valid.map((r, i) => ({
      value: Number(r.value),
      date: r.date || `Reading ${i + 1}`,
    }));
    const storedPoints = timelineData.slice(0, 20).map((t: any) => ({
      value: t.value,
      date: t.recorded_at?.slice(0, 10) || "stored",
    }));
    const allPoints = [...storedPoints, ...newPoints];

    await gl.runJob(() => healthApi.interpretTrend({
      metric,
      readings: allPoints,
      notes: context || "",
    }));
  };

  const result = gl.result as any;
  const trend = (result?.trend || "").toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1800&q=80&fit=crop"
        accent="bg-indigo-500"
        tag="Trend Analysis"
        title="Health Trend Interpreter"
        subtitle="Enter readings over time and receive consensus-based trend analysis and projections"
      />

      {!gl.result ? (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Health metric</label>
              <select value={metric} onChange={(e) => setMetric(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white">
                {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {timelineData.length > 0 && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-sm text-sky-700">
                {timelineData.length} stored readings found — will be included automatically.
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Additional readings</label>
                <button onClick={addReading} className="flex items-center gap-1 text-sky-600 text-sm font-medium hover:text-sky-700">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {readings.map((r, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={r.value} onChange={(e) => updateReading(i, "value", e.target.value)}
                      placeholder="Value" type="number"
                      className="w-32 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                    <input value={r.date} onChange={(e) => updateReading(i, "date", e.target.value)}
                      type="date"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                    <button onClick={() => removeReading(i)} disabled={readings.length <= 2}
                      className="text-gray-300 hover:text-red-400 disabled:opacity-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Context (optional)</label>
              <input value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="Diet changes, medication adjustments, illness…"
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

          <button onClick={analyze} disabled={gl.loading || readings.filter(r => r.value).length < 2}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : "Interpret Trend on-chain"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          {trend && TREND_COLOR[trend] && (
            <div className={`rounded-2xl p-5 border flex items-center gap-4 ${TREND_COLOR[trend]}`}>
              {TREND_ICON[trend]}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Trend</p>
                <p className="text-xl font-bold">{trend.replace(/_/g, " ")}</p>
              </div>
            </div>
          )}

          {result?.within_typical_range !== undefined && (
            <div className={`rounded-xl p-4 border ${result.within_typical_range ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              <p className="text-sm font-medium">
                {result.within_typical_range ? "✓ Values are within typical range" : "⚠ Values are outside typical range"}
              </p>
            </div>
          )}

          {result?.interpretation && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Interpretation</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{result.interpretation}</p>
            </div>
          )}

          {result?.recommendations?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-sky-500 shrink-0">→</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.discuss_with_provider && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 font-medium">
              Consider discussing this trend with your healthcare provider.
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result?.disclaimer || "Educational analysis only. Consult a healthcare provider for medical advice."}
          </div>

          <button onClick={() => gl.reset()}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Analyse another trend
          </button>
        </div>
      )}

      <AnalysisHistory
        items={jobHistory}
        loading={jobHistoryLoading}
        title="Past trend analyses"
        detailHref={(id) => `/health-trend/${id}`}
        renderResult={(result) => (
          <div>
            <p className="text-sm text-gray-700 font-medium">{result?.trend || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{(result?.interpretation || "").slice(0, 150)}</p>
          </div>
        )}
      />
    </div>
  );
}
