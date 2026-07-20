"use client";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { Wallet, Copy, CheckCircle2, ArrowLeft, Eye, EyeOff, AlertTriangle, Download, Key, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function getStoredPrivateKey(): string {
  return sessionStorage.getItem("cb_wallet_key") || "";
}

export default function WalletSettingsPage() {
  const { logout } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    userApi.wallet().then((r) => setWallet(r.data)).catch(() => {});
    // Load from session storage (decrypted at login)
    setPrivateKey(getStoredPrivateKey());
  }, []);

  const copyAddr = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const copyKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const downloadKeystore = () => {
    if (!privateKey || !wallet?.address) return;
    const data = JSON.stringify({
      address: wallet.address,
      privateKey,
      note: "Keep this file secure. Never share it. Import into MetaMask or any EVM wallet.",
      exportedAt: new Date().toISOString(),
      network: "GenLayer StudioNet",
    }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carebridge-wallet-${wallet.address.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maskedKey = privateKey
    ? privateKey.slice(0, 6) + "••••••••••••••••••••••••••••••••••••••••••••••••••••••••" + privateKey.slice(-4)
    : "";

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-500 text-sm">Your EVM wallet for signing GenLayer transactions</p>
        </div>
      </div>

      {/* Wallet address */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">EVM Wallet</p>
            <p className="text-xs text-gray-400">Auto-generated · encrypted with your password</p>
          </div>
        </div>

        {wallet ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Wallet address</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
              <code className="flex-1 text-sm text-gray-700 font-mono break-all">{wallet.address}</code>
              <button onClick={copyAddr} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                {copiedAddr ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-14 bg-gray-50 rounded-xl animate-pulse" />
        )}

        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-xs text-sky-700 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold mb-1"><Shield className="w-3.5 h-3.5" /> About your wallet</div>
          <p>• Your private key is encrypted with AES-256-GCM using your login password</p>
          <p>• It is never stored in plaintext and never transmitted to our servers</p>
          <p>• This wallet signs GenLayer transactions on your behalf</p>
          <p>• The decrypted key is only held in <code className="bg-sky-100 px-1 rounded">sessionStorage</code> for the current session</p>
        </div>
      </div>

      {/* Private key export */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Export Private Key</p>
            <p className="text-xs text-gray-400">Import into MetaMask, Trust Wallet, or any EVM wallet</p>
          </div>
        </div>

        {/* Security warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Security Warning
          </div>
          <ul className="text-xs text-red-600 space-y-1">
            <li>• Never share your private key with anyone — not even Care Bridge support</li>
            <li>• Anyone with this key has full control over your wallet</li>
            <li>• Do not take a screenshot or paste it into any website</li>
            <li>• Store it in a password manager or hardware wallet</li>
          </ul>
        </div>

        {/* Confirmation checkbox */}
        {!confirmed ? (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-sky-500 shrink-0"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              I understand the risks. I am solely responsible for keeping my private key safe.
            </span>
          </label>
        ) : (
          <div className="space-y-4">
            {privateKey ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Private key</p>
                    <button onClick={() => setShowKey((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showKey ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-950 rounded-xl px-4 py-3">
                    <code className="flex-1 text-sm font-mono break-all text-green-400 select-all">
                      {showKey ? privateKey : maskedKey}
                    </code>
                    <button onClick={copyKey} className="shrink-0 text-gray-500 hover:text-white transition-colors ml-2">
                      {copiedKey ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button onClick={downloadKeystore}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  Download Keystore JSON
                </button>

                <p className="text-center text-xs text-gray-400">
                  This key is only available while you are logged in to this session.
                </p>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 space-y-3">
                <div>
                  <AlertTriangle className="inline w-4 h-4 mr-1 mb-0.5" />
                  Your private key is not available in this session. Please <strong>log out and log back in</strong> — the key is decrypted at login using your password.
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Network</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Network</span>
          <span className="font-mono font-medium text-gray-900">GenLayer StudioNet</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Chain type</span>
          <span className="font-mono font-medium text-gray-900">EVM-compatible</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Key storage</span>
          <span className="font-mono font-medium text-gray-900">AES-256-GCM encrypted</span>
        </div>
      </div>
    </div>
  );
}
