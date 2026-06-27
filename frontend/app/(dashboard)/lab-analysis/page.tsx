"use client";
import { useEffect, useState } from "react";
import { healthApi } from "@/lib/api";
import { getRiskColor, getRiskLabel, formatDate } from "@/lib/utils";
import { Microscope, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LabAnalysisPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthApi.getLabs().then((r) => setLabs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Analysis</h1>
          <p className="text-gray-500 text-sm mt-0.5">GenLayer-verified biomarker interpretation</p>
        </div>
        <Link href="/lab-analysis/upload"
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Upload Report
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : labs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Microscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No lab analyses yet</h3>
          <p className="text-gray-500 text-sm mb-6">Upload a PDF or image lab report to get started</p>
          <Link href="/lab-analysis/upload"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
            Upload first report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {labs.map((lab) => (
            <Link key={lab.id} href={`/lab-analysis/${lab.id}`}
              className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lab Analysis</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(lab.created_at)}</p>
                    {lab.genlayer_tx_hash && (
                      <p className="text-xs text-indigo-400 mt-0.5 font-mono">
                        tx: {lab.genlayer_tx_hash.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getRiskColor(lab.risk_level)}`}>
                    {getRiskLabel(lab.risk_level)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
