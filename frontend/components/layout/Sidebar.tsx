"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  HeartPulse, LayoutDashboard, Microscope, Activity, LineChart,
  FileText, Pill, Stethoscope, AlertTriangle, Settings, LogOut,
  Wallet, ChevronRight
} from "lucide-react";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/lab-analysis", icon: Microscope, label: "Lab Analysis" },
  { href: "/symptoms", icon: Activity, label: "Symptoms" },
  { href: "/timeline", icon: LineChart, label: "Health Timeline" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/medications", icon: Pill, label: "Medications" },
  { href: "/doctor-visit", icon: Stethoscope, label: "Doctor Visit" },
  { href: "/triage", icon: AlertTriangle, label: "Health Triage" },
];

const secondaryNav = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/settings/wallet", icon: Wallet, label: "My Wallet" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Care Bridge</span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || "User"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              "sidebar-link",
              (pathname === href || (href !== "/dashboard" && pathname.startsWith(href))) && "active"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
        </div>

        {secondaryNav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn("sidebar-link", pathname === href && "active")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={logout}
          className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
