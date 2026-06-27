"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    authApi.verifyEmail(token)
      .then(() => { setStatus("success"); setTimeout(() => router.push("/dashboard"), 2000); })
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
        {status === "loading" && (
          <><Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your email...</p></>
        )}
        {status === "success" && (
          <><CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
          <p className="text-gray-500">Redirecting to your dashboard...</p></>
        )}
        {status === "error" && (
          <><XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
          <p className="text-gray-500 mb-6">The link may be expired or invalid.</p>
          <Link href="/auth/login" className="text-sky-600 font-medium hover:underline">Back to login</Link></>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center"><Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
