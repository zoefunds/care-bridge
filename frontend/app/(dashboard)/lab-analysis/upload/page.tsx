"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { healthApi } from "@/lib/api";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadLabPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await healthApi.uploadLab(file);
      setUploaded(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploaded?.extracted_markers?.length) return;
    setAnalyzing(true);
    try {
      const res = await healthApi.analyzeLabs({
        markers: uploaded.extracted_markers,
        context: {},
      });
      router.push(`/lab-analysis/${res.data.id}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Analysis failed");
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/lab-analysis" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Lab Report</h1>
          <p className="text-gray-500 text-sm mt-0.5">PDF or image — we'll extract and analyze your markers</p>
        </div>
      </div>

      {!uploaded ? (
        <>
          <div {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive ? "border-sky-400 bg-sky-50" : "border-gray-200 hover:border-sky-300 hover:bg-gray-50"
            }`}>
            <input {...getInputProps()} />
            <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragActive ? "text-sky-500" : "text-gray-400"}`} />
            {file ? (
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Drop your lab report here</p>
                <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG, WebP — max 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {file && (
            <button onClick={handleUpload} disabled={uploading}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Extracting text & markers..." : "Upload & Extract"}
            </button>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">File processed successfully</p>
              <p className="text-sm text-green-700 mt-0.5">
                {uploaded.extracted_markers?.length || 0} markers extracted
              </p>
            </div>
          </div>

          {uploaded.extracted_markers?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Extracted markers preview</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploaded.extracted_markers.slice(0, 15).map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-700">{m.name}</span>
                    <span className="text-gray-500">{m.value} {m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploaded.extracted_markers?.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
              No structured markers were automatically extracted. You can still proceed with the raw text analysis.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
          )}

          <button onClick={handleAnalyze} disabled={analyzing}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
            {analyzing ? "Sending to GenLayer validators..." : "Analyze with GenLayer Consensus"}
          </button>
          <p className="text-xs text-center text-gray-400">
            Multiple AI models will independently interpret your results and reach consensus on the blockchain.
          </p>
        </div>
      )}
    </div>
  );
}
