"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { healthApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Activity, Microscope, Pill, FileText, ArrowRight, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

const quickActions = [
  { href: "/lab-analysis/upload", icon: Microscope, label: "Upload Lab Report", color: "from-sky-500 to-cyan-400" },
  { href: "/symptoms", icon: Activity, label: "Check Symptoms", color: "from-violet-500 to-purple-400" },
  { href: "/medications", icon: Pill, label: "Analyze Medications", color: "from-emerald-500 to-green-400" },
  { href: "/reports", icon: FileText, label: "Summarize Report", color: "from-orange-500 to-amber-400" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthApi.getLabs()
      .then((r) => setLabs(r.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      <PageHero
        image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1800&q=80&fit=crop"
        accent="bg-sky-500"
        tag="Health Intelligence"
        title={`${greeting()}, ${user?.full_name?.split(" ")[0] || "there"}`}
        subtitle="Your GenLayer-verified health dashboard — all analyses backed by multi-validator AI consensus"
      />

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Reminder:</strong> All analyses are for educational purposes only and do not
          constitute medical advice. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}
              className="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* GenLayer badge */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">GenLayer Consensus Active</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            All your health analyses are verified by multiple AI validators on StudioNet
          </p>
        </div>
      </div>

      {/* Recent analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent lab analyses</h2>
          <Link href="/lab-analysis" className="text-sm text-sky-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Microscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No lab analyses yet</p>
            <Link href="/lab-analysis/upload"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Upload your first report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {labs.map((lab) => (
              <Link key={lab.id} href={`/lab-analysis/${lab.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Lab Analysis</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(lab.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {lab.status === "complete" ? (() => {
                      const flags: any[] = lab.result?.flags || lab.result?.markers_analysis || [];
                      const abnormal = flags.filter((f: any) => (f.status || "").toUpperCase() !== "NORMAL").length;
                      const label = abnormal > 0 ? `${abnormal} flagged` : "All normal";
                      const cls = abnormal > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200";
                      return <span className={`text-xs font-medium px-3 py-1 rounded-full border ${cls}`}>{label}</span>;
                    })() : lab.status === "error" ? (
                      <span className="text-xs font-medium px-3 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">Failed</span>
                    ) : (
                      <span className="text-xs font-medium px-3 py-1 rounded-full border bg-gray-50 text-gray-500 border-gray-200">Pending</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
