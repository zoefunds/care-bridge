"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Upload, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Plus, X, PenLine } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 className="w-5 h-5" /> Consensus reached
          </div>
          {gl.txHash && <p className="text-xs font-mono text-gray-400">TX: {gl.txHash}</p>}
          <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-x-auto text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
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
    </div>
  );
}
