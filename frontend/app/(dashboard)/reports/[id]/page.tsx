"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { healthApi } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import { AnalysisDetailLayout } from "@/components/ui/AnalysisDetailLayout";
import { JobResultView } from "@/components/ui/JobResultView";

const TITLES: Record<string, string> = {
  doctor_visit: "Doctor Visit Prep", triage: "Triage Assessment", health_query: "Health Query",
  trend: "Health Trend Analysis", prevention: "Prevention Plan", route: "Route to Care", report: "Health Report",
};
const BACKS: Record<string, string> = {
  doctor_visit: "/doctor-visit", triage: "/triage", health_query: "/health-query",
  trend: "/health-trend", prevention: "/prevention", route: "/route-to-care", report: "/reports",
};

function isEmptyResult(result: any) {
  if (!result) return true;
  const keys = Object.keys(result).filter((k) => k !== "record_id" && k !== "args");
  if (keys.length === 0) return true;
  if (keys.length === 1 && keys[0] === "raw") return true;
  return false;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    healthApi.getJob(id as string).then((r) => setItem(r.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll if status is pending
  useEffect(() => {
    if (!item || item.status !== "pending") return;
    const t = setTimeout(() => {
      healthApi.getJob(id as string).then((r) => setItem(r.data));
    }, 4000);
    return () => clearTimeout(t);
  }, [item, id]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await healthApi.retryJobRead(id as string);
      // Poll until no longer pending
      const poll = async () => {
        const r = await healthApi.getJob(id as string);
        setItem(r.data);
        if (r.data.status === "pending") setTimeout(poll, 4000);
        else setRetrying(false);
      };
      setTimeout(poll, 4000);
    } catch {
      setRetrying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>;
  if (!item) return <div className="text-center py-24 text-gray-500">Analysis not found</div>;

  const hasEmptyResult = item.status === "complete" && isEmptyResult(item.result);

  return (
    <AnalysisDetailLayout
      backHref={BACKS[item.job_type] || "/dashboard"}
      backLabel="Back"
      title={TITLES[item.job_type] || "Analysis"}
      status={item.status}
      createdAt={item.created_at}
      txHash={item.tx_hash}
      disclaimer={item.disclaimer}
    >
      {item.status === "pending" && (
        <div className="flex items-center gap-3 text-sm text-sky-600 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Reading result from contract…
        </div>
      )}

      {item.status === "complete" && !hasEmptyResult && (
        <JobResultView result={item.result} jobType={item.job_type} />
      )}

      {hasEmptyResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
          <p className="text-sm text-amber-800 font-medium">Result was not retrieved automatically. This can happen if the contract read timed out.</p>
          <button onClick={handleRetry} disabled={retrying}
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {retrying ? "Fetching from contract…" : "Retry reading result"}
          </button>
        </div>
      )}
    </AnalysisDetailLayout>
  );
}
