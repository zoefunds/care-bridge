"use client";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Upload, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Plus, X, PenLine, TrendingUp, TrendingDown, Minus, Apple, Calendar } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

type Marker = { name: string; value: string; unit: string; reference_range: string };
type Tab = "upload" | "manual";

export default function UploadLabPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");
  const [markers, setMarkers] = useState<Marker[]>([{ name: "", value: "", unit: "", reference_range: "" }]);
  const [context, setContext] = useState("");
  const [manualError, setManualError] = useState("");
  const gl = useAnalysis();
  const [labHistory, setLabHistory] = useState<any[]>([]);
  const [labHistoryLoading, setLabHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.getLabs().then((r) => setLabHistory(r.data)).catch(() => {}).finally(() => setLabHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024, maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const res = await healthApi.uploadLab(file);
      setUploaded(res.data);
    } catch (e: any) { setUploadError(e.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleAnalyzeFromUpload = async () => {
    if (!uploaded?.extracted_markers?.length) return;
    await gl.runJob(() => healthApi.analyzeLabs({ markers: uploaded.extracted_markers, context: {} }));
  };

  const updateMarker = (i: number, field: keyof Marker, val: string) =>
    setMarkers((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const addMarker = () => setMarkers((p) => [...p, { name: "", value: "", unit: "", reference_range: "" }]);
  const removeMarker = (i: number) => setMarkers((p) => p.filter((_, idx) => idx !== i));

  const handleManualAnalyze = async () => {
    const valid = markers.filter((m) => m.name.trim() && m.value.trim());
    if (!valid.length) { setManualError("Add at least one marker with a name and value."); return; }
    setManualError("");
    const formatted = valid.map((m) => ({
      name: m.name.trim(),
      value: isNaN(Number(m.value)) ? m.value.trim() : Number(m.value),
      unit: m.unit.trim() || undefined,
      reference_range: m.reference_range.trim() || undefined,
    }));
    const contextObj = context.trim() ? { notes: context.trim() } : {};
    await gl.runJob(() => healthApi.analyzeLabs({ markers: formatted, context: contextObj }));
  };

  const result = gl.result as any;

  function FlagBadge({ status }: { status: string }) {
    const s = (status || "").toUpperCase();
    if (s === "HIGH") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"><TrendingUp className="w-3 h-3"/>High</span>;
    if (s === "LOW") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><TrendingDown className="w-3 h-3"/>Low</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><Minus className="w-3 h-3"/>Normal</span>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1800&q=80&fit=crop"
        accent="bg-cyan-500"
        tag="New Analysis"
        title="Upload Lab Report"
        subtitle="Upload a PDF/image or enter results manually — AI consensus interprets every biomarker"
        action={
          <Link href="/lab-analysis" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      />

      {/* Status banner */}
      {gl.loading && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{gl.statusLabel}</span>
        </div>
      )}
      {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

      {/* Result */}
      {gl.status === "complete" && result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="font-semibold text-green-800">AI Consensus Reached</p>
          </div>

          {gl.txHash && (
            <a href={`https://explorer-studio.genlayer.com/tx/${gl.txHash}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all hover:bg-green-100 transition-colors">
              <span className="shrink-0">✓ On-chain tx:</span>
              <span className="flex-1 break-all">{gl.txHash}</span>
            </a>
          )}

          {/* Summary */}
          {(result.analysis?.summary || result.summary) && (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-1">Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.analysis?.summary || result.summary}</p>
            </div>
          )}

          {/* Flags */}
          {(result.flags || result.markers_analysis || []).length > 0 && (() => {
            const flags = result.flags || result.markers_analysis || [];
            const abnormal = flags.filter((f: any) => (f.status || "").toUpperCase() !== "NORMAL");
            const normal = flags.filter((f: any) => (f.status || "").toUpperCase() === "NORMAL");
            return (
              <div className="space-y-3">
                {abnormal.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-sm text-gray-900">Values Needing Attention</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {abnormal.map((f: any, i: number) => (
                        <div key={i} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">{f.name}</p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Your value: <span className="font-medium text-gray-800">{f.value}{f.unit ? ` ${f.unit}` : ""}</span>
                                {f.reference_range && <span className="ml-2 text-gray-400">· Normal: {f.reference_range}</span>}
                              </p>
                            </div>
                            <FlagBadge status={f.status} />
                          </div>
                          {f.educational_note && (
                            <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">{f.educational_note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {normal.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-sm text-gray-900">Normal Values ({normal.length})</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {normal.map((f: any, i: number) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{f.name}</p>
                            <p className="text-xs text-gray-400">{f.value}{f.unit ? ` ${f.unit}` : ""}{f.reference_range && ` · Ref: ${f.reference_range}`}</p>
                          </div>
                          <FlagBadge status={f.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Lifestyle tips */}
          {(result.lifestyle_notes || result.recommendations || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Apple className="w-4 h-4 text-green-500" />
                <h3 className="font-semibold text-sm text-gray-900">Lifestyle Tips</h3>
              </div>
              <ul className="space-y-2">
                {(result.lifestyle_notes || result.recommendations || []).map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up */}
          {(result.follow_up_suggestions || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-sky-500" />
                <h3 className="font-semibold text-sm text-gray-900">Follow-up Suggestions</h3>
              </div>
              <ul className="space-y-2">
                {(result.follow_up_suggestions || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={gl.reset} className="text-sm text-sky-600 hover:underline">Analyze another</button>
        </div>
      )}

      {gl.status !== "complete" && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button onClick={() => setTab("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Upload className="w-4 h-4" /> Upload File
            </button>
            <button onClick={() => setTab("manual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <PenLine className="w-4 h-4" /> Enter Manually
            </button>
          </div>

          {tab === "upload" && (
            <>
              {!uploaded ? (
                <>
                  <div {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? "border-sky-400 bg-sky-50" : "border-gray-200 hover:border-sky-300 hover:bg-gray-50"}`}>
                    <input {...getInputProps()} />
                    <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragActive ? "text-sky-500" : "text-gray-400"}`} />
                    {file ? (
                      <div><p className="font-medium text-gray-900">{file.name}</p><p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p></div>
                    ) : (
                      <div><p className="font-medium text-gray-700">Drop your lab report here</p><p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG, WebP — max 10MB</p></div>
                    )}
                  </div>
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {uploadError}
                    </div>
                  )}
                  {file && (
                    <button onClick={handleUpload} disabled={uploading}
                      className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                      {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {uploading ? "Extracting markers…" : "Upload & Extract"}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div><p className="font-medium text-green-800">Processed</p><p className="text-sm text-green-700">{uploaded.extracted_markers?.length || 0} markers extracted</p></div>
                  </div>
                  <button onClick={handleAnalyzeFromUpload} disabled={gl.loading}
                    className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                    {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {gl.loading ? gl.statusLabel : "Analyze with AI Consensus"}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "manual" && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Lab Markers</h3>
                  <button onClick={addMarker} className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add marker
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide pb-1 border-b border-gray-100">
                  <span className="col-span-4">Test name</span><span className="col-span-2">Value</span>
                  <span className="col-span-2">Unit</span><span className="col-span-3">Reference range</span><span className="col-span-1" />
                </div>
                {markers.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={m.name} onChange={(e) => updateMarker(i, "name", e.target.value)} placeholder="e.g. Glucose"
                      className="col-span-4 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                    <input value={m.value} onChange={(e) => updateMarker(i, "value", e.target.value)} placeholder="108"
                      className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                    <input value={m.unit} onChange={(e) => updateMarker(i, "unit", e.target.value)} placeholder="mg/dL"
                      className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                    <input value={m.reference_range} onChange={(e) => updateMarker(i, "reference_range", e.target.value)} placeholder="70-100"
                      className="col-span-3 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
                    <button onClick={() => removeMarker(i)} disabled={markers.length === 1} className="col-span-1 flex justify-center text-gray-300 hover:text-red-400 disabled:opacity-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional context (optional)</label>
                  <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2}
                    placeholder="Age, gender, symptoms, recent conditions…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
                </div>
              </div>
              {manualError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{manualError}</div>}
              <button onClick={handleManualAnalyze} disabled={gl.loading}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {gl.loading ? gl.statusLabel : "Analyze with AI Consensus"}
              </button>
            </div>
          )}
        </>
      )}

      <AnalysisHistory
        items={(labHistory || []).map((l: any) => ({
          id: l.id,
          status: l.status,
          created_at: l.created_at,
          tx_hash: l.tx_hash,
          result: l.result,
        }))}
        detailHref={(id) => `/lab-analysis/${id}`}
        loading={labHistoryLoading}
        title="Past lab analyses"
        renderResult={(result) => {
          const flags: any[] = result?.flags || result?.markers_analysis || [];
          const abnormal = flags.filter((f: any) => (f.status || "").toUpperCase() !== "NORMAL").length;
          const summary = result?.analysis?.summary || result?.summary || "";
          return (
            <div>
              {flags.length > 0 && (
                <p className="text-sm font-medium text-gray-700">
                  {abnormal > 0 ? `${abnormal} value${abnormal > 1 ? "s" : ""} need attention` : "All values normal"}
                </p>
              )}
              {summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{summary}</p>}
            </div>
          );
        }}
      />
    </div>
  );
}
