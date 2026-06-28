"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { FileText, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

export default function ReportsPage() {
  const [text, setText] = useState("");
  const [reportType, setReportType] = useState("");
  const gl = useAnalysis();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listJobs("report").then((r) => setJobHistory(r.data)).catch(() => {}).finally(() => setJobHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const analyze = async () => {
    await gl.runJob(() => healthApi.summarizeReport(text, reportType || undefined));
  };

  const result = gl.result as any;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1800&q=80&fit=crop"
        accent="bg-orange-500"
        tag="Report Analysis"
        title="Medical Report Summarizer"
        subtitle="Paste any medical report — receive a clear plain-English summary powered by GenLayer AI"
      />

      {!gl.result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Report type (optional)</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-sm">
                <option value="">Select type...</option>
                <option>Blood Test</option>
                <option>MRI Report</option>
                <option>X-Ray Report</option>
                <option>CT Scan</option>
                <option>Ultrasound</option>
                <option>Pathology Report</option>
                <option>Discharge Summary</option>
                <option>Consultation Notes</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Report text</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
                placeholder="Paste your medical report here..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
              <p className="text-xs text-gray-400 mt-1">{text.length}/3000 characters</p>
            </div>
          </div>

          {gl.loading && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{gl.statusLabel}</span>
            </div>
          )}

          {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

          <button onClick={analyze} disabled={gl.loading || text.length < 50}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : "Summarize Report"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          {result?.plain_language_summary && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-sky-500" />
                <h3 className="font-semibold text-gray-900">Plain English Summary</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                {result.plain_language_summary}
              </p>
            </div>
          )}

          {result?.key_findings?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Key findings</h3>
              <ul className="space-y-2">
                {result.key_findings.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.doctor_questions?.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-3">Questions to ask your doctor</h3>
              <ul className="space-y-2">
                {result.doctor_questions.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-indigo-700">• {q}</li>
                ))}
              </ul>
            </div>
          )}

          {result?.glossary?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Medical terms explained</h3>
              <div className="space-y-2">
                {result.glossary.map((g: any, i: number) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-gray-900">{g.term}</span>
                    <span className="text-gray-500"> — {g.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result?.disclaimer || "Educational purposes only. Consult your healthcare provider for medical advice."}
          </div>

          <button onClick={() => { gl.reset(); setText(""); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Summarize another report
          </button>
        </div>
      )}

      <AnalysisHistory
        items={jobHistory}
        loading={jobHistoryLoading}
        title="Past report summaries"
        renderResult={(result) => (
          <div>
            <p className="text-sm text-gray-700 line-clamp-3">
              {(result?.plain_language_summary || "").slice(0, 150)}
            </p>
          </div>
        )}
      />
    </div>
  );
}
