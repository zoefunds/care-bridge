"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { healthApi } from "@/lib/api";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  metric_type: z.string().min(1),
  value: z.coerce.number(),
  unit: z.string().optional(),
  recorded_at: z.string(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const METRIC_OPTIONS = [
  { value: "glucose", label: "Glucose", unit: "mg/dL" },
  { value: "cholesterol", label: "Cholesterol", unit: "mg/dL" },
  { value: "blood_pressure_systolic", label: "Blood Pressure (Systolic)", unit: "mmHg" },
  { value: "blood_pressure_diastolic", label: "Blood Pressure (Diastolic)", unit: "mmHg" },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "bmi", label: "BMI", unit: "" },
];

export default function AddTimelineEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      recorded_at: new Date().toISOString().slice(0, 16),
      metric_type: "glucose",
    },
  });

  const selectedMetric = METRIC_OPTIONS.find((m) => m.value === watch("metric_type"));

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await healthApi.addTimeline({
        ...data,
        unit: data.unit || selectedMetric?.unit || "",
        recorded_at: new Date(data.recorded_at).toISOString(),
      });
      setDone(true);
      setTimeout(() => router.push("/timeline"), 1500);
    } catch (e) {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="max-w-md mx-auto text-center py-24">
      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900">Entry saved!</h2>
      <p className="text-gray-500 mt-1">Returning to timeline...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/timeline" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Health Entry</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Metric type</label>
            <select {...register("metric_type")}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
              {METRIC_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Value {selectedMetric?.unit && <span className="text-gray-400">({selectedMetric.unit})</span>}
              </label>
              <input {...register("value")} type="number" step="any"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
              <input {...register("unit")} placeholder={selectedMetric?.unit || "optional"}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & time</label>
            <input {...register("recorded_at")} type="datetime-local"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea {...register("notes")} rows={2} placeholder="Any context, fasting state, etc."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
