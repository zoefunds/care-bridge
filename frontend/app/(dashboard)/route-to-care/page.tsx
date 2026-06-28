"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";
import {
  Home, Phone, Stethoscope, Clock, AlertTriangle, Ambulance,
  UserRound, Loader2, Shield, ChevronRight
} from "lucide-react";

const URGENCY = [
  { value: "non_urgent", label: "Not urgent — can wait days or weeks" },
  { value: "soon", label: "Soon — should be seen this week" },
  { value: "urgent", label: "Urgent — need care today" },
  { value: "emergency", label: "Emergency — severe / life-threatening" },
];

const CHANNEL_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  SELF_CARE:      { icon: <Home className="w-6 h-6" />, color: "text-green-600 bg-green-50 border-green-200", label: "Self-Care at Home" },
  TELEHEALTH:     { icon: <Phone className="w-6 h-6" />, color: "text-sky-600 bg-sky-50 border-sky-200", label: "Telehealth / Video Consult" },
  PRIMARY_CARE:   { icon: <Stethoscope className="w-6 h-6" />, color: "text-blue-600 bg-blue-50 border-blue-200", label: "Primary Care Physician" },
  URGENT_CARE:    { icon: <Clock className="w-6 h-6" />, color: "text-amber-600 bg-amber-50 border-amber-200", label: "Urgent Care Center" },
  EMERGENCY_ROOM: { icon: <Ambulance className="w-6 h-6" />, color: "text-red-600 bg-red-50 border-red-200", label: "Emergency Room" },
  SPECIALIST:     { icon: <UserRound className="w-6 h-6" />, color: "text-purple-600 bg-purple-50 border-purple-200", label: "Specialist Referral" },
};

export default function RouteToCare() {
  const [situation, setSituation] = useState("");
  const [urgency, setUrgency] = useState("soon");
  const [location, setLocation] = useState("");
  const gl = useAnalysis();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listJobs("route").then((r) => setJobHistory(r.data)).catch(() => {}).finally(() => setJobHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const route = async () => {
    if (!situation.trim()) return;
    await gl.runJob(() => healthApi.routeToCare({
      urgency,
      symptoms: situation.trim(),
      history: "",
      location: location.trim() || "not specified",
    }));
  };

  const result = gl.result as any;
  const channel = (result?.recommended_channel || result?.care_channel || result?.channel || "").toUpperCase();
  const meta = CHANNEL_META[channel];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1800&q=80&fit=crop"
        accent="bg-amber-500"
        tag="Care Navigation"
        title="Route to Care"
        subtitle="Describe your situation and get consensus-based guidance on where to seek care"
      />

      {!gl.result ? (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">What's your situation?</label>
              <textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={4}
                placeholder="Describe your symptoms, concern, or medical situation…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How urgent does it feel?</label>
              <div className="space-y-2">
                {URGENCY.map((u) => (
                  <label key={u.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${urgency === u.value ? "border-sky-400 bg-sky-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="urgency" value={u.value} checked={urgency === u.value} onChange={() => setUrgency(u.value)} className="accent-sky-500" />
                    <span className="text-sm text-gray-700">{u.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Access / location context (optional)</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. rural area, have insurance, no transport available…"
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

          <button onClick={route} disabled={gl.loading || !situation.trim()}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : "Find the Right Care on-chain"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          {meta && (
            <div className={`rounded-2xl p-6 border flex items-center gap-5 ${meta.color}`}>
              {meta.icon}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-0.5">Recommended care</p>
                <p className="text-xl font-bold">{meta.label}</p>
              </div>
            </div>
          )}

          {!meta && channel && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 text-sky-800 font-semibold text-lg">{channel}</div>
          )}

          {result?.urgency_assessment && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Urgency Assessment</p>
              <p className="text-sm text-gray-800 font-medium">{result.urgency_assessment}</p>
            </div>
          )}

          {result?.reasoning && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Why this recommendation</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{result.reasoning}</p>
            </div>
          )}

          {result?.alternatives?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Alternatives</h3>
              <ul className="space-y-2">
                {result.alternatives.map((a: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <ChevronRight className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                    {typeof a === "string" ? a : `${a.channel || a.option}: ${a.note || a.reason || ""}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.warning_signs?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Go to ER immediately if you experience
              </h3>
              <ul className="space-y-1">
                {result.warning_signs.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-red-700">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result?.disclaimer || "Educational guidance only. In a life-threatening emergency, call emergency services immediately."}
          </div>

          <button onClick={() => gl.reset()}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            New Routing Request
          </button>
        </div>
      )}

      <AnalysisHistory
        items={jobHistory}
        loading={jobHistoryLoading}
        title="Past care routing analyses"
        renderResult={(result) => (
          <div>
            <p className="text-sm text-gray-700 font-medium">{result?.recommended_care_level || result?.care_level || result?.recommended_channel || "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{result?.recommendation || result?.routing_summary || result?.reasoning || ""}</p>
          </div>
        )}
      />
    </div>
  );
}
