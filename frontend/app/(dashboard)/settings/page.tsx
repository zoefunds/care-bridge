"use client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Wallet, Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Profile</h2>
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
        </div>
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
    </div>
  );
}
