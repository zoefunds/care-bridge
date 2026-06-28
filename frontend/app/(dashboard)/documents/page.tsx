"use client";
import { useEffect, useState } from "react";
import { healthApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { FileText, File, ImageIcon, Loader2, FolderOpen, Upload } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

function FileIcon({ fileType }: { fileType: string | null }) {
  const t = (fileType || "").toLowerCase();
  if (t.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
  if (t.includes("image") || t.includes("jpg") || t.includes("png")) return <ImageIcon className="w-5 h-5 text-sky-500" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function FileTypeBadge({ fileType }: { fileType: string | null }) {
  const t = (fileType || "unknown").toLowerCase();
  const label = t.includes("pdf") ? "PDF" : t.includes("image") || t.includes("png") || t.includes("jpg") ? "Image" : t;
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{label.toUpperCase()}</span>
  );
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthApi.listDocuments().then((r) => setDocs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1568667256549-094345857637?w=1800&q=80&fit=crop"
        accent="bg-indigo-500"
        tag="My Records"
        title="Documents"
        subtitle="All files you've uploaded for analysis — lab reports, scans, and health records"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No documents yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Documents are saved automatically when you upload a lab report</p>
          <Link href="/lab-analysis/upload"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
            <Upload className="w-4 h-4" /> Upload Lab Report
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-500">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {docs.map((doc) => (
              <div key={doc.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileIcon fileType={doc.file_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.filename || "Unnamed file"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {doc.has_extracted_data && (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Processed</span>
                  )}
                  <FileTypeBadge fileType={doc.file_type} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
