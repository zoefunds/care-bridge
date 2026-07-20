"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Microscope, Activity, LineChart,
  FileText, Pill, Stethoscope, AlertTriangle, Settings,
  Wallet, TrendingUp, MessageCircle, Heart, MapPin, ShieldCheck,
  FolderOpen, Menu, X,
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
  { href: "/prevention", icon: Heart, label: "Prevention Plan" },
  { href: "/health-query", icon: MessageCircle, label: "Health Q&A" },
  { href: "/health-trend", icon: TrendingUp, label: "Trend Interpreter" },
  { href: "/route-to-care", icon: MapPin, label: "Route to Care" },
  { href: "/documents", icon: FolderOpen, label: "Documents" },
];

const secondaryNav = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/settings/wallet", icon: Wallet, label: "My Wallet" },
];

function NavContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* User */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.full_name || "User"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 min-h-0 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={onNav}
            className={cn(
              "sidebar-link",
              (pathname === href || (href !== "/dashboard" && pathname.startsWith(href))) && "active"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-3 pb-1">
          <p className="px-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Account</p>
        </div>

        {secondaryNav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={onNav}
            className={cn("sidebar-link", pathname === href && "active")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-2.5 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Admin</p>
            </div>
            <Link href="/admin" onClick={onNav}
              className={cn("sidebar-link", pathname === "/admin" && "active", "text-indigo-600 hover:bg-indigo-50")}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Admin Panel
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 bg-white border-r border-gray-100 flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Care Bridge" className="w-7 h-7 object-contain" />
            <span className="font-bold text-sm text-gray-900">Care Bridge</span>
          </div>
        </div>
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Care Bridge" className="w-7 h-7 object-contain" />
          <span className="font-bold text-gray-900 text-sm">Care Bridge</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full flex flex-col shadow-xl">
            <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Care Bridge" className="w-7 h-7 object-contain" />
                <span className="font-bold text-gray-900">Care Bridge</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavContent onNav={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
