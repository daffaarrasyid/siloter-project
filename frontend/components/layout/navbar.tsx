"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  avatarInitials?: string;
  children?: React.ReactNode;
}

export function Navbar({
  userName,
  userRole,
  avatarInitials,
  children,
}: NavbarProps) {
  const router = useRouter();

  const [profile, setProfile] = useState({
    name: userName || "Administrator Dishub Kota Bogor",
    role: userRole || "Admin Command Center • Dishub",
    initials: avatarInitials || "AD",
  });

  useEffect(() => {
    // 1. Prioritize stored user session
    const saved = localStorage.getItem("siloter_auth_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.name) {
          setProfile({
            name: u.name,
            role: u.role || "Admin Command Center • Dishub",
            initials:
              u.initials ||
              u.name
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
          });
          return;
        }
      } catch {}
    }

    // 2. Query Supabase Auth user if available
    async function checkSupabaseSession() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const email = data.user.email || "";
          const isAdmin = email.includes("admin") || !email.includes("operator");
          const fullName = isAdmin
            ? "Administrator Dishub Kota Bogor"
            : "Petugas Operator TMC Dishub";
          const roleTitle = isAdmin
            ? "Admin Command Center • Dishub"
            : "Operator TMC • Dishub";
          const initials = isAdmin ? "AD" : "PO";
          setProfile({
            name: fullName,
            role: roleTitle,
            initials: initials,
          });
        }
      } catch {}
    }

    checkSupabaseSession();
  }, [userName, userRole, avatarInitials]);

  const handleLogout = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("siloter_auth_user");
    toast.success("Berhasil keluar dari sesi Dishub.");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-6 py-3 flex items-center justify-between select-none shrink-0 font-sans">
      {/* Left side: Optional page controls or breadcrumbs */}
      <div className="flex items-center gap-3">
        {children}
      </div>

      {/* Right side: Profil Petugas & Tombol Logout */}
      <div className="flex items-center gap-3">
        {/* Profil Petugas (Nama & Status/Peran Sesuai Auth User) */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs ring-2 ring-slate-100 shadow-2xs">
            {profile.initials}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 leading-none">
              {profile.name}
            </p>
            <p className="text-[10px] text-slate-500 font-normal mt-0.5">
              {profile.role}
            </p>
          </div>
        </div>

        {/* Tombol Logout (Icon Saja Tanpa Garis Pembatas - Revisi Item 3) */}
        <button
          type="button"
          onClick={handleLogout}
          title="Keluar dari Sistem"
          aria-label="Keluar dari Sistem"
          className="p-2 rounded-xl border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all shadow-2xs cursor-pointer flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

