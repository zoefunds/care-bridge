"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import { Settings, Wallet, Shield, Loader2, CheckCircle2, User, Globe, LogOut } from "lucide-react";
import Link from "next/link";
import { getUser, saveAuth, getToken, getWalletBundle } from "@/lib/auth";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "sw", label: "Swahili" },
  { code: "hi", label: "Hindi" },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [lang, setLang] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setName(user?.full_name || "");
    setLang(user?.preferred_language || "en");
    setEditing(true);
    setSaved(false);
    setError("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await userApi.updateProfile({
        full_name: name.trim() || undefined,
        preferred_language: lang,
      });
      // Update stored user so sidebar/header reflect the change immediately
      const current = getUser();
      if (current) {
        const updated = { ...current, full_name: res.data.full_name, preferred_language: res.data.preferred_language };
        saveAuth(getToken()!, updated, getWalletBundle());
        window.dispatchEvent(new Event("storage")); // nudge useAuth to re-read
      }
      setSaved(true);
      setEditing(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <User className="w-5 h-5 text-sky-500" />
            </div>
            <h2 className="font-semibold text-gray-900">Profile</h2>
          </div>
          {!editing && (
            <button onClick={startEdit}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Preferred language
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Full name</p>
              <p className="font-medium text-gray-900">{user?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Account status</p>
              <p className={`font-medium ${user?.is_verified ? "text-green-600" : "text-amber-600"}`}>
                {user?.is_verified ? "Verified" : "Email not verified"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Role</p>
              <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Preferred language</p>
              <p className="font-medium text-gray-900">
                {LANGUAGES.find((l) => l.code === (user?.preferred_language || "en"))?.label || "English"}
              </p>
            </div>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Profile updated
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/settings/wallet"
          className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Wallet className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">My Wallet</h3>
            <p className="text-sm text-gray-500 mt-0.5">View address, export private key</p>
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Privacy & Consent</h3>
            <p className="text-sm text-gray-500 mt-0.5">Consent given. Data encrypted with AES-256-GCM.</p>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full bg-white rounded-2xl border border-gray-100 p-5 hover:border-red-200 hover:bg-red-50 transition-all group flex gap-4 items-center text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <LogOut className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-red-600">Sign out</h3>
          <p className="text-sm text-gray-500 mt-0.5">Log out of your Care Bridge account on this device</p>
        </div>
      </button>
    </div>
  );
}
