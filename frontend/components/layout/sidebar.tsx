"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Video,
  ShieldCheck,
  Layers,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

interface SidebarProps {
  pendingCount?: number;
}

export function Sidebar({ pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isNavActive = (path: string) => {
    if (path === "/dashboard" && (pathname === "/dashboard" || pathname === "/")) {
      return true;
    }
    return pathname.startsWith(path);
  };

  const mainNavItems = [
    {
      label: "Pantau CCTV",
      href: "/dashboard",
      icon: Video,
    },
    {
      label: "Verifikasi",
      href: "/events",
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      label: "Zona & Durasi",
      href: "/zones",
      icon: Layers,
    },
    {
      label: "Analitik & Laporan",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  const adminNavItems = [
    {
      label: "Pengguna",
      href: "/users",
      icon: Users,
    },
    {
      label: "Pengaturan Sistem",
      href: "/onboarding",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-5 select-none shrink-0 z-20">
      <div>
        {/* Logo & Brand Header */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Logo SILOTER"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            SILOTER
          </span>
        </div>

        {/* Section: Navigasi Utama */}
        <div className="mb-6">
          <span className="text-[10px] font-semibold text-slate-400 block px-3 mb-2">
            Navigasi Utama
          </span>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        active
                          ? "bg-white text-blue-600"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section: Administrasi */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 block px-3 mb-2">
            Administrasi
          </span>
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
                    active
                      ? "bg-blue-600 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

