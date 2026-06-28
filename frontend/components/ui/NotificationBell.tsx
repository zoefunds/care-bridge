"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { healthApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: "lab" | "symptom" | "medication" | "job";
  status: "complete" | "error";
  label: string;
  href: string;
  created_at: string;
  read: boolean;
}

const SEEN_KEY = "cb_seen_notifications";

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
}

function markSeen(ids: string[]) {
  try {
    const seen = getSeenIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {}
}

async function fetchNotifications(): Promise<Notification[]> {
  const seen = getSeenIds();
  const results: Notification[] = [];
  try {
    const [labs, symptoms, meds, jobs] = await Promise.allSettled([
      healthApi.getLabs(),
      healthApi.listSymptoms(),
      healthApi.listMedications(),
      healthApi.listJobs(),
    ]);

    if (labs.status === "fulfilled") {
      for (const l of (labs.value.data || []).slice(0, 5)) {
        if (l.status === "complete" || l.status === "error") {
          results.push({ id: `lab-${l.id}`, type: "lab", status: l.status, label: "Lab Analysis", href: `/lab-analysis/${l.id}`, created_at: l.created_at, read: seen.has(`lab-${l.id}`) });
        }
      }
    }
    if (symptoms.status === "fulfilled") {
      for (const s of (symptoms.value.data || []).slice(0, 5)) {
        if (s.status === "complete" || s.status === "error") {
          results.push({ id: `sym-${s.id}`, type: "symptom", status: s.status, label: "Symptom Analysis", href: `/symptoms/${s.id}`, created_at: s.created_at, read: seen.has(`sym-${s.id}`) });
        }
      }
    }
    if (meds.status === "fulfilled") {
      for (const m of (meds.value.data || []).slice(0, 5)) {
        if (m.status === "complete" || m.status === "error") {
          results.push({ id: `med-${m.id}`, type: "medication", status: m.status, label: "Medication Check", href: `/medications/${m.id}`, created_at: m.created_at, read: seen.has(`med-${m.id}`) });
        }
      }
    }
    if (jobs.status === "fulfilled") {
      for (const j of (jobs.value.data || []).slice(0, 10)) {
        if (j.status === "complete" || j.status === "error") {
          const jobLabels: Record<string, string> = { doctor_visit: "Doctor Visit Prep", triage: "Triage", health_query: "Health Query", trend: "Trend Analysis", prevention: "Prevention Plan", route: "Route to Care", report: "Report" };
          const jobHrefs: Record<string, string> = { doctor_visit: "doctor-visit", triage: "triage", health_query: "health-query", trend: "health-trend", prevention: "prevention", route: "route-to-care", report: "reports" };
          const key = `job-${j.id}`;
          results.push({ id: key, type: "job", status: j.status, label: jobLabels[j.job_type] || "Analysis", href: `/${jobHrefs[j.job_type] || "dashboard"}/${j.id}`, created_at: j.created_at, read: seen.has(key) });
        }
      }
    }
  } catch {}

  return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  function handleOpen() {
    setOpen(!open);
    if (!open) {
      const ids = notifications.map((n) => n.id);
      markSeen(ids);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Notifications</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.map((n) => (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {n.status === "complete"
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {n.label} {n.status === "complete" ? "complete" : "failed"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1.5" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
