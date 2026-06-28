"use client";
import { useState, useEffect, useRef } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { MessageCircle, Loader2, Shield, AlertTriangle, Send } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

const QUICK = [
  "What does a BMI of 28 mean?",
  "How do I lower my blood pressure naturally?",
  "What are the symptoms of vitamin D deficiency?",
  "Is it normal to have a resting heart rate of 85 bpm?",
  "What foods should I avoid with high cholesterol?",
  "When should I see a doctor for a fever?",
];

export default function HealthQueryPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("English");
  const [history, setHistory] = useState<Array<{ q: string; a: string; txHash?: string }>>([]);
  const lastQuestion = useRef("");
  const gl = useAnalysis();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listJobs("health_query").then((r) => setJobHistory(r.data)).catch(() => {}).finally(() => setJobHistoryLoading(false));
  }, [historyKey]);

  const ask = async (q?: string) => {
    const question = (q || query).trim();
    if (!question) return;
    lastQuestion.current = question;
    await gl.runJob(() => healthApi.healthQuery(question, language));
    if (q) setQuery("");
  };

  useEffect(() => {
    if (gl.result && lastQuestion.current) {
      const r = gl.result as any;
      setHistory((h) => [{
        q: lastQuestion.current,
        a: r?.response || r?.answer || r?.content || JSON.stringify(r),
        txHash: gl.txHash || undefined,
      }, ...h.slice(0, 9)]);
    }
  }, [gl.result]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const r = gl.result as any;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1800&q=80&fit=crop"
        accent="bg-teal-500"
        tag="Health Q&A"
        title="Ask a Health Question"
        subtitle="Any health question in any language — answered by GenLayer consensus AI validators"
      />

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex gap-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
            rows={3}
            placeholder="Ask your health question… (Enter to submit)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none"
          />
          <button onClick={() => ask()} disabled={gl.loading || !query.trim()}
            className="self-end px-4 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl">
            {gl.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Language:</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
            {["English","Spanish","French","Portuguese","Arabic","Swahili","Hindi","Yoruba","Igbo","Hausa"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {gl.loading && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{gl.statusLabel}</span>
        </div>
      )}

      {!gl.result && !gl.loading && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => ask(q)} disabled={gl.loading}
                className="text-xs bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-sky-200 text-gray-600 hover:text-sky-700 px-3 py-2 rounded-lg disabled:opacity-50 text-left">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

      {gl.result && (
        <div className="space-y-4">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          {r?.is_emergency_query && (
            <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3 font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              This may be a medical emergency. Please seek immediate care or call emergency services.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-medium text-sky-600 uppercase tracking-wide">GenLayer Consensus Answer</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {r?.response || r?.answer || r?.content || JSON.stringify(r)}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {r?.disclaimer || "Educational information only. Always consult a qualified healthcare provider."}
          </div>

          <button onClick={() => { gl.reset(); setQuery(""); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Ask another question
          </button>
        </div>
      )}

      {history.length > 1 && !gl.result && !gl.loading && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Recent questions</p>
          <div className="space-y-3">
            {history.slice(1).map((h, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-900 mb-1">{h.q}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{h.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnalysisHistory
        items={jobHistory}
        loading={jobHistoryLoading}
        title="Past health queries"
        detailHref={(id) => `/health-query/${id}`}
        renderResult={(result) => (
          <div>
            <p className="text-sm text-gray-700 line-clamp-3">
              {(result?.response || result?.answer || "").slice(0, 200)}
            </p>
          </div>
        )}
      />
    </div>
  );
}
