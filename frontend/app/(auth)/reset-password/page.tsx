"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  new_password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});
type FormData = z.infer<typeof schema>;

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const token = params.get("token") || "";
    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword(token, data.new_password);
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Password reset!</h2>
        <p className="text-gray-500 mt-2">Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input {...register("new_password")} type="password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Min 8 chars, 1 uppercase, 1 number" />
            {errors.new_password && <p className="text-red-500 text-xs mt-1">Must be 8+ chars with uppercase and number</p>}
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md"><div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 h-64 animate-pulse" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
