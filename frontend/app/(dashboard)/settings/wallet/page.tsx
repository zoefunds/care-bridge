"use client";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { Wallet, Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WalletSettingsPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    userApi.wallet().then((r) => setWallet(r.data)).catch(() => {});
  }, []);

  const copy = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">EVM Wallet</p>
            <p className="text-xs text-gray-400">Auto-generated and encrypted with your password</p>
          </div>
        </div>

        {wallet ? (
          <>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Wallet address</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <code className="flex-1 text-sm text-gray-700 font-mono break-all">{wallet.address}</code>
                <button onClick={copy} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-sky-800">
              <p className="font-medium mb-1">About your wallet</p>
              <ul className="space-y-1 text-sky-700 text-xs">
                <li>• Your private key is encrypted with AES-256-GCM using your password</li>
                <li>• It is never stored in plaintext and never transmitted</li>
                <li>• This wallet signs GenLayer transactions on your behalf</li>
                <li>• To export your key, contact support with your verified email</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
