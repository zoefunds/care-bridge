"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";
import { TxHashLink } from "@/components/ui/TxHashLink";
import { formatDate } from "@/lib/utils";

interface Props {
  backHref: string;
  backLabel: string;
  title: string;
  status: string;
  createdAt?: string;
  txHash?: string;
  disclaimer?: string;
  statusLine?: string;
  children?: ReactNode;
}

export function AnalysisDetailLayout({
  backHref, backLabel, title, status, createdAt, txHash, disclaimer, statusLine, children,
}: Props) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-400 text-sm">{createdAt ? formatDate(createdAt) : "—"}</p>
        </div>
      </div>

      <div className={`rounded-2xl p-5 border flex items-center gap-4 ${
        status === "complete" ? "bg-green-50 border-green-200" :
        status === "error" ? "bg-red-50 border-red-200" :
        "bg-sky-50 border-sky-200"
      }`}>
        {status === "complete" ? (
          <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0" />
        ) : status === "error" ? (
          <AlertCircle className="w-7 h-7 text-red-500 shrink-0" />
        ) : (
          <Loader2 className="w-7 h-7 text-sky-500 shrink-0 animate-spin" />
        )}
        <p className="font-semibold text-gray-900">
          {status === "complete" ? (statusLine || "Analysis complete") :
           status === "error" ? "Analysis failed" : "Analysis in progress…"}
        </p>
      </div>

      {txHash && <TxHashLink hash={txHash} />}

      {children}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
        {disclaimer || "This analysis is for educational purposes only and does not constitute medical advice."}
      </div>
    </div>
  );
}
