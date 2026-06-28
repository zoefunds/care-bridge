"use client";
import { useState, useEffect } from "react";
import { healthApi } from "@/lib/api";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Stethoscope, Loader2, Shield, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { AnalysisHistory } from "@/components/ui/AnalysisHistory";

const SPECIALTIES = [
  "General Practitioner", "Cardiologist", "Endocrinologist", "Neurologist",
  "Gastroenterologist", "Pulmonologist", "Orthopedist", "Dermatologist",
  "Psychiatrist", "Gynecologist / Obstetrician", "Urologist", "Oncologist", "Other",
];

export default function DoctorVisitPage() {
  const [specialty, setSpecialty] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [medications, setMedications] = useState("");
  const [concerns, setConcerns] = useState("");
  const [expanded, setExpanded] = useState<string[]>(["questions"]);
  const gl = useAnalysis();
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    healthApi.listJobs("doctor_visit").then((r) => setJobHistory(r.data)).catch(() => {}).finally(() => setJobHistoryLoading(false));
  }, [historyKey]);

  useEffect(() => {
    if (gl.status === "complete") setHistoryKey((k) => k + 1);
  }, [gl.status]);

  const toggle = (k: string) =>
    setExpanded((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const generate = async () => {
    if (!symptoms.trim()) return;
    await gl.runJob(() => healthApi.prepareDoctorVisit({
      specialty: specialty || "General Practitioner",
      symptoms,
      history,
      medications,
      concerns,
    }));
  };

  const r = gl.result as any;
  const result = r?.visit_preparation || r?.preparation || r;

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => toggle(id)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-900">{title}</span>
        {expanded.includes(id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded.includes(id) && <div className="px-5 pb-5">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHero
        image="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1800&q=80&fit=crop"
        accent="bg-blue-500"
        tag="Visit Preparation"
        title="Doctor Visit Assistant"
        subtitle="Prepare structured questions and a visit plan backed by GenLayer AI consensus"
      />

      {!gl.result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor specialty</label>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white">
                <option value="">Select specialty (optional)</option>
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Chief complaint / main symptoms <span className="text-red-400">*</span>
              </label>
              <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3}
                placeholder="Describe your main symptoms or reason for the visit…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical history</label>
              <textarea value={history} onChange={(e) => setHistory(e.target.value)} rows={2}
                placeholder="Existing conditions, previous surgeries, allergies…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current medications</label>
              <input value={medications} onChange={(e) => setMedications(e.target.value)}
                placeholder="Metformin 500mg, Lisinopril 10mg…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Specific concerns to raise</label>
              <textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={2}
                placeholder="Anything you are worried about or want to make sure is discussed…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none" />
            </div>
          </div>

          {gl.loading && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sky-700 text-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{gl.statusLabel}</span>
            </div>
          )}

          {gl.error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{gl.error}</div>}

          <button onClick={generate} disabled={gl.loading || !symptoms.trim()}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {gl.loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {gl.loading ? gl.statusLabel : "Generate Visit Preparation on-chain"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {gl.txHash && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-mono break-all">
              ✓ On-chain tx: {gl.txHash}
            </div>
          )}

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-sky-600 shrink-0" />
            <p className="text-sm font-medium text-sky-800">Your visit preparation is ready — verified by GenLayer consensus.</p>
          </div>

          {(result?.priority_questions || result?.questions)?.length ? (
            <Section id="questions" title="Priority Questions to Ask Your Doctor">
              <ul className="space-y-2">
                {(result.priority_questions || result.questions).map((q: any, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-sky-500 font-semibold shrink-0">{i + 1}.</span>
                    <span>{typeof q === "string" ? q : q.question || q.text || JSON.stringify(q)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {result?.bring_to_appointment?.length ? (
            <Section id="bring" title="What to Bring">
              <ul className="space-y-1.5">
                {result.bring_to_appointment.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {result?.symptom_timeline_to_describe ? (
            <Section id="timeline" title="Symptom Timeline to Describe">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.symptom_timeline_to_describe}</p>
            </Section>
          ) : null}

          {result?.history_to_share?.length ? (
            <Section id="history" title="Medical History to Share">
              <ul className="space-y-1.5">
                {result.history_to_share.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700">• {item}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          {result?.after_visit_checklist?.length ? (
            <Section id="after" title="After-Visit Checklist">
              <ul className="space-y-1.5">
                {result.after_visit_checklist.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400">☐</span> {item}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {result?.communication_tips ? (
            <Section id="tips" title="Communication Tips">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.communication_tips}</p>
            </Section>
          ) : null}

          {/* Fallback for unexpected structure */}
          {!result?.priority_questions && !result?.questions && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto">{JSON.stringify(r, null, 2)}</pre>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
            {result?.disclaimer || "Educational preparation only. Your doctor will guide actual medical decisions."}
          </div>

          <button onClick={() => gl.reset()}
            className="w-full py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium">
            New Preparation
          </button>
        </div>
      )}

      <AnalysisHistory
        items={jobHistory}
        loading={jobHistoryLoading}
        title="Past doctor visit preparations"
        detailHref={(id) => `/doctor-visit/${id}`}
        renderResult={(result) => {
          const questions = result?.visit_preparation?.questions_for_doctor || result?.questions_for_doctor || [];
          return (
            <div>
              {questions.slice(0, 2).map((q: any, i: number) => (
                <p key={i} className="text-sm text-gray-700 line-clamp-1">{typeof q === "string" ? q : q.question || q.text || JSON.stringify(q)}</p>
              ))}
              {questions.length === 0 && <p className="text-sm text-gray-400">No questions found</p>}
            </div>
          );
        }}
      />
    </div>
  );
}
