"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Users, Activity, Microscope, Pill, TrendingUp,
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface Stats {
  users: { total: number; verified: number };
  analyses: { lab: number; symptoms: number; timeline: number; medications: number };
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    if (user?.role === "admin") {
      Promise.all([adminApi.stats(), adminApi.users()])
        .then(([s, u]) => { setStats(s.data); setUsers(u.data); })
        .catch(() => router.replace("/dashboard"))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const toggleActive = async (u: UserRow) => {
    setSaving(u.id);
    try {
      await adminApi.updateUser(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: !u.is_active } : x));
    } finally { setSaving(null); }
  };

  const toggleVerified = async (u: UserRow) => {
    setSaving(u.id);
    try {
      await adminApi.updateUser(u.id, { is_verified: !u.is_verified });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_verified: !u.is_verified } : x));
    } finally { setSaving(null); }
  };

  const toggleRole = async (u: UserRow) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    setSaving(u.id);
    try {
      await adminApi.updateUser(u.id, { role: newRole });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
    } finally { setSaving(null); }
  };

  const refresh = async () => {
    setLoading(true);
    const [s, u] = await Promise.all([adminApi.stats(), adminApi.users()]);
    setStats(s.data); setUsers(u.data);
    setLoading(false);
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <PageHero
        image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1800&q=80&fit=crop"
        accent="bg-indigo-500"
        tag="Admin Panel"
        title="System Administration"
        subtitle="Manage users, monitor analyses, and oversee platform health"
        action={
          <button onClick={refresh}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/30 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users,      label: "Total Users",       value: stats?.users.total ?? 0,              color: "text-sky-600 bg-sky-50" },
              { icon: CheckCircle2,label: "Verified",         value: stats?.users.verified ?? 0,            color: "text-green-600 bg-green-50" },
              { icon: Microscope, label: "Lab Analyses",      value: stats?.analyses.lab ?? 0,              color: "text-violet-600 bg-violet-50" },
              { icon: Activity,   label: "Symptom Checks",   value: stats?.analyses.symptoms ?? 0,         color: "text-rose-600 bg-rose-50" },
              { icon: TrendingUp, label: "Timeline Entries", value: stats?.analyses.timeline ?? 0,         color: "text-amber-600 bg-amber-50" },
              { icon: Pill,       label: "Medication Checks",value: stats?.analyses.medications ?? 0,      color: "text-teal-600 bg-teal-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">All Users ({users.length})</h2>
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u.id}>
                  <div
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(u.full_name?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name || "—"}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-green-400" : "bg-red-400"}`} title={u.is_active ? "Active" : "Disabled"} />
                      <span className={`w-2 h-2 rounded-full ${u.is_verified ? "bg-sky-400" : "bg-gray-300"}`} title={u.is_verified ? "Verified" : "Unverified"} />
                    </div>
                    <p className="text-xs text-gray-400 hidden md:block">{new Date(u.created_at).toLocaleDateString()}</p>
                    {expandedUser === u.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>

                  {expandedUser === u.id && (
                    <div className="px-6 pb-5 pt-1 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-3 font-mono">{u.id}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleActive(u)}
                          disabled={saving === u.id}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${u.is_active ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                        >
                          {u.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {u.is_active ? "Disable account" : "Enable account"}
                        </button>
                        <button
                          onClick={() => toggleVerified(u)}
                          disabled={saving === u.id}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${u.is_verified ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {u.is_verified ? "Mark unverified" : "Mark verified"}
                        </button>
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={saving === u.id || u.email === user.email}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-40"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {u.role === "admin" ? "Demote to user" : "Promote to admin"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
