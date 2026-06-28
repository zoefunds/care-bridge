"use client";
import { CheckCircle2, AlertTriangle, Info, List } from "lucide-react";

function isStringArray(v: any): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isObjectArray(v: any): v is object[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object";
}

function prettifyKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StringList({ items, color = "sky" }: { items: string[]; color?: string }) {
  const dot: Record<string, string> = {
    sky: "bg-sky-400", green: "bg-green-400", violet: "bg-violet-400", amber: "bg-amber-400",
  };
  return (
    <ul className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot[color] || dot.sky}`} />
          {s}
        </li>
      ))}
    </ul>
  );
}

const SKIP_KEYS = new Set(["record_id", "args", "disclaimer", "error"]);
const SUMMARY_KEYS = new Set(["summary", "interpretation", "overview", "description", "answer", "explanation",
  "overall_assessment", "care_recommendation", "recommendation", "conclusion"]);
const WARNING_KEYS = new Set(["warnings", "red_flags", "contraindications", "cautions", "urgent_signs"]);
const ACTION_KEYS = new Set(["recommendations", "action_items", "next_steps", "follow_up", "follow_up_suggestions",
  "lifestyle_notes", "lifestyle_recommendations", "tips", "home_care_tips"]);

export function JobResultView({ result, jobType }: { result: any; jobType?: string }) {
  if (!result || typeof result !== "object") return null;

  const flat = result.analysis || result.result || result;
  const entries = Object.entries(flat).filter(([k]) => !SKIP_KEYS.has(k));

  const summaryEntries = entries.filter(([k, v]) => SUMMARY_KEYS.has(k) && typeof v === "string");
  const warningEntries = entries.filter(([k, v]) => WARNING_KEYS.has(k) && (isStringArray(v) || typeof v === "string"));
  const actionEntries = entries.filter(([k, v]) => ACTION_KEYS.has(k) && isStringArray(v));
  const usedKeys = new Set([...summaryEntries, ...warningEntries, ...actionEntries].map(([k]) => k));
  const restEntries = entries.filter(([k]) => !usedKeys.has(k));

  return (
    <div className="space-y-4">
      {summaryEntries.map(([k, v]) => (
        <div key={k} className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500 mb-1">{prettifyKey(k)}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{v as string}</p>
        </div>
      ))}

      {warningEntries.map(([k, v]) => (
        <div key={k} className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-sm text-red-800">{prettifyKey(k)}</h3>
          </div>
          {typeof v === "string" ? (
            <p className="text-sm text-red-700">{v}</p>
          ) : (
            <ul className="space-y-1.5">
              {(v as string[]).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{s}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {restEntries.map(([k, v]) => {
        if (typeof v === "string" && v.trim()) {
          return (
            <div key={k} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-sm text-gray-900">{prettifyKey(k)}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{v}</p>
            </div>
          );
        }
        if (isStringArray(v) && v.length > 0) {
          return (
            <div key={k} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <List className="w-4 h-4 text-sky-500" />
                <h3 className="font-semibold text-sm text-gray-900">{prettifyKey(k)}</h3>
              </div>
              <StringList items={v} />
            </div>
          );
        }
        if (isObjectArray(v)) {
          return (
            <div key={k} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">{prettifyKey(k)}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {v.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3">
                    {Object.entries(item).map(([ik, iv]) => (
                      <div key={ik} className="text-sm">
                        <span className="font-medium text-gray-700">{prettifyKey(ik)}: </span>
                        <span className="text-gray-600">{String(iv)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })}

      {actionEntries.map(([k, v]) => (
        <div key={k} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-sm text-gray-900">{prettifyKey(k)}</h3>
          </div>
          <StringList items={v as string[]} color="green" />
        </div>
      ))}
    </div>
  );
}
