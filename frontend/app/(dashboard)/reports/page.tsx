"use client";
import { useState } from "react";
import { healthApi } from "@/lib/api";
import { FileText, Loader2, Shield, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [text, setText] = useState("");
  const [reportType, setReportType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await healthApi.summarizeReport(text, reportType || undefined);
      setResult(res.data);
    } catch (e: any) { setError(e.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Report Summarizer</h1>
        <p className="text-gray-500 text-sm mt-0.5">Paste your medical report to receive a plain-English summary</p>
      </div>

      {!result ? (
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

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

          <button onClick={analyze} disabled={loading || text.length < 50}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Summarizing with GenLayer consensus..." : "Summarize Report"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {result.summary?.plain_language_summary && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-sky-500" />
                <h3 className="font-semibold text-gray-900">Plain English Summary</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                {result.summary.plain_language_summary}
              </p>
            </div>
          )}

          {result.summary?.key_findings?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Key findings</h3>
              <ul className="space-y-2">
                {result.summary.key_findings.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.summary?.doctor_questions?.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-3">Questions to ask your doctor</h3>
              <ul className="space-y-2">
                {result.summary.doctor_questions.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-indigo-700">• {q}</li>
                ))}
              </ul>
            </div>
          )}

          {result.summary?.glossary?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Medical terms explained</h3>
              <div className="space-y-2">
                {result.summary.glossary.map((g: any, i: number) => (
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
            {result.disclaimer}
          </div>

          <button onClick={() => { setResult(null); setText(""); }}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            Summarize another report
          </button>
        </div>
      )}
    </div>
  );
}
