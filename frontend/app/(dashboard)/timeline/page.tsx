"use client";
import { useEffect, useState } from "react";
import { healthApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

const METRICS = ["glucose", "cholesterol", "blood_pressure_systolic", "blood_pressure_diastolic", "heart_rate", "weight", "bmi"];

export default function TimelinePage() {
  const [metric, setMetric] = useState("glucose");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    healthApi.getTimeline(metric)
      .then((r) => setEntries(r.data.reverse()))
      .finally(() => setLoading(false));
  }, [metric]);

  const chartData = entries.map((e) => ({
    date: new Date(e.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: Number(e.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Timeline</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track and visualize your health metrics over time</p>
        </div>
        <Link href="/timeline/add"
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Add Entry
        </Link>
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 flex-wrap">
        {METRICS.map((m) => (
          <button key={m} onClick={() => setMetric(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metric === m ? "bg-sky-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-sky-300"
            }`}>
            {m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">
          {metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Trend
        </h3>
        {loading ? (
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p>No data for this metric yet</p>
              <Link href="/timeline/add" className="text-sky-500 text-sm mt-2 inline-block hover:underline">
                Add your first entry →
              </Link>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent entries</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {entries.slice(0, 10).map((e) => (
              <div key={e.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.value} {e.unit}</p>
                  {e.notes && <p className="text-xs text-gray-400 mt-0.5">{e.notes}</p>}
                </div>
                <p className="text-xs text-gray-400">{formatDate(e.recorded_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
