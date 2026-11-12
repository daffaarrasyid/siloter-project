"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Video,
  ShieldCheck,
  Layers,
  BarChart3,
  Users,
  Settings,
  Download,
  UserPlus,
  Search,
  RotateCcw,
  Building2,
  MapPin,
  Flame,
  Radio,
  Wrench,
  Pencil,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Personnel {
  id: string;
  full_name: string;
  nip: string;
  email: string;
  role: string;
  role_key: string;
  placement: string;
  status: "Aktif" | "Non-aktif";
  is_online: boolean;
  last_active: string;
  phone?: string;
  avatar_bg?: string;
}

export default function UsersPage() {
  const router = useRouter();

  // 4 KPI Stat Counters matching mockup
  const [stats, setStats] = useState({
    totalPersonnel: 14,
    fieldOfficers: 8,
    admins: 3,
    verifiers: 3,
  });

  // Personnel List Data
  const [personnelList, setPersonnelList] = useState<Personnel[]>([
    {
      id: "usr-001",
      full_name: "Budi Santoso, S.T.",
      nip: "198205142006041002",
      email: "budi.dishub@kotabogor.go.id",
      role: "Admin Utama",
      role_key: "admin",
      placement: "Command Center Dishub",
      status: "Aktif",
      is_online: true,
      last_active: "10 menit lalu",
      avatar_bg: "bg-[#0f172a] text-white",
    },
    {
      id: "usr-002",
      full_name: "Hendra Santoso, A.Md.",
      nip: "198903122011011005",
      email: "hendra.cctv@kotabogor.go.id",
      role: "Operator CCTV",
      role_key: "operator",
      placement: "Pos Empang & Simpang BTM",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 08:30 WIB",
      avatar_bg: "bg-[#2563eb] text-white",
    },
    {
      id: "usr-003",
      full_name: "Rahmat Hidayat",
      nip: "199307222016021008",
      email: "rahmat.ops@kotabogor.go.id",
      role: "Verifikator Tiket",
      role_key: "verifikator",
      placement: "Unit Reaksi Cepat (URC)",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 07:15 WIB",
      avatar_bg: "bg-[#0d9488] text-white",
    },
    {
      id: "usr-004",
      full_name: "Siti Rahmawati, S.Tr.Tra",
      nip: "199511042019032014",
      email: "siti.rahma@kotabogor.go.id",
      role: "Operator CCTV",
      role_key: "operator",
      placement: "Pos Suryakencana & Pasar Bogor",
      status: "Aktif",
      is_online: true,
      last_active: "Kemarin, 16:45 WIB",
      avatar_bg: "bg-[#7c3aed] text-white",
    },
    {
      id: "usr-005",
      full_name: "Dedi Kurniawan",
      nip: "198701192009011003",
      email: "dedi.teknis@kotabogor.go.id",
      role: "Teknisi Lapangan",
      role_key: "teknisi",
      placement: "Bidang Lalu Lintas",
      status: "Non-aktif",
      is_online: false,
      last_active: "3 hari yang lalu",
      avatar_bg: "bg-[#64748b] text-white",
    },
    {
      id: "usr-006",
      full_name: "Ahmad Fauzi, A.Md.PKB",
      nip: "199104082014021006",
      email: "ahmad.fauzi@kotabogor.go.id",
      role: "Verifikator Tiket",
      role_key: "verifikator",
      placement: "Terminal Baranangsiang",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 09:12 WIB",
      avatar_bg: "bg-[#0284c7] text-white",
    },
    {
      id: "usr-007",
      full_name: "Fajar Pratama, S.Si.",
      nip: "199012052015031004",
      email: "fajar.pratama@kotabogor.go.id",
      role: "Admin Sistem",
      role_key: "admin",
      placement: "Pusat Data Dishub",
      status: "Aktif",
      is_online: true,
      last_active: "5 menit lalu",
      avatar_bg: "bg-[#4f46e5] text-white",
    },
    {
      id: "usr-008",
      full_name: "Tri Wahyuni, S.Kom.",
      nip: "199406182018012003",
      email: "tri.wahyuni@kotabogor.go.id",
      role: "Admin Sistem",
      role_key: "admin",
      placement: "Pusat Data Dishub",
      status: "Aktif",
      is_online: false,
      last_active: "Kemarin, 18:20 WIB",
      avatar_bg: "bg-[#6366f1] text-white",
    },
    {
      id: "usr-009",
      full_name: "Agus Setiawan",
      nip: "198808202010011007",
      email: "agus.setiawan@kotabogor.go.id",
      role: "Operator CCTV",
      role_key: "operator",
      placement: "Pos Balaikota Bogor",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 08:45 WIB",
      avatar_bg: "bg-[#0369a1] text-white",
    },
    {
      id: "usr-010",
      full_name: "Nurul Hidayati",
      nip: "199602142020022005",
      email: "nurul.hidayati@kotabogor.go.id",
      role: "Verifikator Tiket",
      role_key: "verifikator",
      placement: "Pos Simpang BTM",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 09:30 WIB",
      avatar_bg: "bg-[#0f766e] text-white",
    },
    {
      id: "usr-011",
      full_name: "Eko Prasetyo",
      nip: "199203112017011009",
      email: "eko.prasetyo@kotabogor.go.id",
      role: "Operator CCTV",
      role_key: "operator",
      placement: "Pos Jembatan Merah",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 07:50 WIB",
      avatar_bg: "bg-[#1e40af] text-white",
    },
    {
      id: "usr-012",
      full_name: "Bambang Wijaya",
      nip: "198605092008031002",
      email: "bambang.wijaya@kotabogor.go.id",
      role: "Teknisi Lapangan",
      role_key: "teknisi",
      placement: "Bidang Rekayasa Lalu Lintas",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 08:10 WIB",
      avatar_bg: "bg-[#475569] text-white",
    },
    {
      id: "usr-013",
      full_name: "Dewi Anggraini, S.E.",
      nip: "199310152019022008",
      email: "dewi.anggraini@kotabogor.go.id",
      role: "Operator CCTV",
      role_key: "operator",
      placement: "Command Center Dishub",
      status: "Aktif",
      is_online: false,
      last_active: "Kemarin, 21:00 WIB",
      avatar_bg: "bg-[#2563eb] text-white",
    },
    {
      id: "usr-014",
      full_name: "Rizky Ramadhan",
      nip: "199708252021011004",
      email: "rizky.ramadhan@kotabogor.go.id",
      role: "Operator CCTV",
      role_key: "operator",
      placement: "Unit Reaksi Cepat (URC)",
      status: "Aktif",
      is_online: true,
      last_active: "Hari ini, 08:00 WIB",
      avatar_bg: "bg-[#1d4ed8] text-white",
    },
  ]);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("Semua Peran");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<Personnel | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    full_name: "",
    nip: "",
    email: "",
    role: "Operator CCTV",
    placement: "Pos Empang & Simpang BTM",
    status: "Aktif" as "Aktif" | "Non-aktif",
    phone: "",
  });

  // Fetch initial data from backend API
  useEffect(() => {
    async function loadBackendData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const [resStats, resUsers] = await Promise.all([
          fetch(`${apiUrl}/api/users/stats`),
          fetch(`${apiUrl}/api/users?limit=50`),
        ]);

        if (resStats.ok) {
          const statsJson = await resStats.json();
          setStats({
            totalPersonnel: statsJson.total_personnel,
            fieldOfficers: statsJson.field_officers,
            admins: statsJson.admins,
            verifiers: statsJson.verifiers,
          });
        }

        if (resUsers.ok) {
          const usersJson = await resUsers.json();
          if (Array.isArray(usersJson) && usersJson.length > 0) {
            setPersonnelList(
              usersJson.map((u: any, idx: number) => ({
                id: u.id,
                full_name: u.full_name,
                nip: u.nip,
                email: u.email,
                role: u.role,
                role_key: u.role_key || "operator",
                placement: u.placement,
                status: u.status,
                is_online: u.is_online,
                last_active: u.last_active,
                avatar_bg:
                  idx === 0
                    ? "bg-[#0f172a] text-white"
                    : idx === 1
                    ? "bg-[#2563eb] text-white"
                    : idx === 2
                    ? "bg-[#0d9488] text-white"
                    : idx === 3
                    ? "bg-[#7c3aed] text-white"
                    : "bg-[#64748b] text-white",
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Backend not reached, using built-in initial dataset:", err);
      }
    }

    loadBackendData();
  }, []);

  // Filter Logic
  const filteredPersonnel = personnelList.filter((p) => {
    const matchQuery =
      searchQuery === "" ||
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole =
      selectedRole === "Semua Peran" ||
      p.role.toLowerCase().includes(selectedRole.toLowerCase());

    const matchStatus =
      selectedStatus === "Semua Status" || p.status === selectedStatus;

    return matchQuery && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredPersonnel.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPersonnel = filteredPersonnel.slice(
    startIndex,
    startIndex + pageSize
  );

  // Helper for Initials
  const getInitials = (name: string) => {
    const clean = name.replace(/(,.*|\..*)/g, "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Helper for Role Badge Style
  const renderRoleBadge = (role: string) => {
    if (role.includes("Admin")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          {role}
        </span>
      );
    }
    if (role.includes("Verifikator")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          {role}
        </span>
      );
    }
    if (role.includes("Teknisi")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Wrench className="w-3.5 h-3.5 text-slate-600" />
          {role}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <Video className="w-3.5 h-3.5 text-blue-600" />
        {role}
      </span>
    );
  };

  // Helper for Placement Icon
  const renderPlacementIcon = (placement: string) => {
    if (placement.includes("Command") || placement.includes("Pusat Data")) {
      return <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
    if (placement.includes("URC") || placement.includes("Reaksi Cepat")) {
      return <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
    return <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  // Action: Export Personnel Data to CSV
  const handleExportData = () => {
    const headers = [
      "ID",
      "Nama Pegawai",
      "NIP",
      "Email Kedinasan",
      "Peran",
      "Penempatan",
      "Status",
      "Aktivitas Terakhir",
    ];
    const rows = personnelList.map((p) => [
      p.id,
      `"${p.full_name}"`,
      `"${p.nip}"`,
      p.email,
      `"${p.role}"`,
      `"${p.placement}"`,
      p.status,
      `"${p.last_active}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Daftar_Personel_DISHUB_SILOTER_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data personel berhasil diekspor ke format CSV.");
  };

  // Action: Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      full_name: "",
      nip: "",
      email: "",
      role: "Operator CCTV",
      placement: "Pos Empang & Simpang BTM",
      status: "Aktif",
      phone: "",
    });
    setIsAddModalOpen(true);
  };

  // Action: Submit Add Form
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.nip || !formData.email) {
      toast.error("Mohon lengkapi Nama, NIP, dan Email.");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const created = await res.json();
        setPersonnelList([
          {
            ...created,
            avatar_bg: "bg-blue-600 text-white",
          },
          ...personnelList,
        ]);
      } else {
        // Fallback local append
        const newLocalUser: Personnel = {
          id: `usr-${personnelList.length + 1}`,
          full_name: formData.full_name,
          nip: formData.nip,
          email: formData.email,
          role: formData.role,
          role_key: formData.role.toLowerCase().includes("admin")
            ? "admin"
            : "operator",
          placement: formData.placement,
          status: formData.status,
          is_online: formData.status === "Aktif",
          last_active: "Baru saja terdaftar",
          avatar_bg: "bg-blue-600 text-white",
        };
        setPersonnelList([newLocalUser, ...personnelList]);
      }
    } catch {
      // Local fallback
      const newLocalUser: Personnel = {
        id: `usr-${personnelList.length + 1}`,
        full_name: formData.full_name,
        nip: formData.nip,
        email: formData.email,
        role: formData.role,
        role_key: "operator",
        placement: formData.placement,
        status: formData.status,
        is_online: formData.status === "Aktif",
        last_active: "Baru saja terdaftar",
        avatar_bg: "bg-blue-600 text-white",
      };
      setPersonnelList([newLocalUser, ...personnelList]);
    }

    setIsAddModalOpen(false);
    setStats((prev) => ({
      ...prev,
      totalPersonnel: prev.totalPersonnel + 1,
      fieldOfficers: formData.role.includes("Operator")
        ? prev.fieldOfficers + 1
        : prev.fieldOfficers,
    }));
    toast.success(`Personel ${formData.full_name} berhasil ditambahkan.`);
  };

  // Action: Open Edit Modal
  const handleOpenEdit = (user: Personnel) => {
    setActiveUser(user);
    setFormData({
      full_name: user.full_name,
      nip: user.nip,
      email: user.email,
      role: user.role,
      placement: user.placement,
      status: user.status,
      phone: user.phone || "",
    });
    setIsEditModalOpen(true);
  };

  // Action: Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/users/${activeUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch {
      // Local fallback
    }

    setPersonnelList((prev) =>
      prev.map((item) =>
        item.id === activeUser.id
          ? {
              ...item,
              full_name: formData.full_name,
              nip: formData.nip,
              email: formData.email,
              role: formData.role,
              placement: formData.placement,
              status: formData.status,
              is_online: formData.status === "Aktif",
              last_active: "Baru saja diperbarui",
            }
          : item
      )
    );

    setIsEditModalOpen(false);
    toast.success(`Data personel ${formData.full_name} berhasil diperbarui.`);
  };

  // Action: Open History
  const handleOpenHistory = (user: Personnel) => {
    setActiveUser(user);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f7fc] text-slate-800 font-sans overflow-hidden">
      {/* =========================================================================
          SIDEBAR KIRI (NAVIGASI UTAMA DISHUB)
          ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-5 select-none shrink-0 z-20">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-2.5 mb-8 px-1">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo SILOTER"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              SILOTER
            </span>
          </div>

          {/* Section: NAVIGASI UTAMA */}
          <div className="mb-6">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3 mb-2">
              NAVIGASI UTAMA
            </span>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <Video className="w-4 h-4 text-slate-400" />
                <span>Pantau CCTV</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/events")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Verifikasi</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding/step3")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Zona &amp; Durasi</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/analytics")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Analitik &amp; Laporan</span>
              </button>
            </nav>
          </div>

          {/* Section: ADMIN */}
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3 mb-2">
              ADMIN
            </span>
            <nav className="space-y-1">
              {/* Active Menu: Pengguna */}
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs text-left cursor-default"
              >
                <Users className="w-4 h-4" />
                <span>Pengguna</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding/step4")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Sistem</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer Profile Operator */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
            BS
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate leading-none">
              Budi Santoso, S.T.
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Admin Command Center</p>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          KONTEN UTAMA: MANAJEMEN PENGGUNA
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP BAR / HEADER */}
        <header className="px-8 py-6 bg-white border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Pengguna
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                DISHUB BOGOR
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Kelola akun akses staf Dishub Kota Bogor, operator lapangan, dan
              pembagian wewenang sistem pemantauan SILOTER.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Ekspor Data</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </header>

        {/* CONTAINER BODY */}
        <div className="p-8 space-y-6 max-w-7xl">
          {/* =====================================================================
              4 KPI STATS CARDS (MATCHING MOCKUP)
              ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Personel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  TOTAL PERSONEL
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {stats.totalPersonnel}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Terdaftar di sistem
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Petugas Lapangan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  PETUGAS LAPANGAN
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">
                    {stats.fieldOfficers}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    Online
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Patroli pos &amp; URC
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Radio className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Admin Sistem */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  ADMIN SISTEM
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {stats.admins}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Hak akses root &amp; config
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <KeyRound className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Verifikator Ngetem */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  VERIFIKATOR NGETEM
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {stats.verifiers}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Validasi tilang elektronik
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* =====================================================================
              FILTER & SEARCH BAR (MATCHING MOCKUP)
              ===================================================================== */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama pegawai, NIP, atau email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Role */}
            <div className="w-44">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="Semua Peran">Semua Peran</option>
                <option value="Admin">Admin Utama / Sistem</option>
                <option value="Operator">Operator CCTV</option>
                <option value="Verifikator">Verifikator Tiket</option>
                <option value="Teknisi">Teknisi Lapangan</option>
              </select>
            </div>

            {/* Dropdown Status */}
            <div className="w-40">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-aktif">Non-aktif</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("Semua Peran");
                setSelectedStatus("Semua Status");
                setCurrentPage(1);
                toast.info("Filter pencarian direset.");
              }}
              title="Reset Filter"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* =====================================================================
              TABEL PERSONEL (MATCHING MOCKUP DISHUB BOGOR)
              ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">NAMA PEGAWAI &amp; NIP</th>
                    <th className="py-3.5 px-6">PERAN &amp; HAK AKSES</th>
                    <th className="py-3.5 px-6">PENEMPATAN / TITIK PANTAU</th>
                    <th className="py-3.5 px-6">STATUS</th>
                    <th className="py-3.5 px-6">AKTIVITAS TERAKHIR</th>
                    <th className="py-3.5 px-6 text-right">TINDAKAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedPersonnel.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        Tidak ada personel yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedPersonnel.map((person) => (
                      <tr
                        key={person.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Nama Pegawai & NIP */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                person.avatar_bg || "bg-slate-800 text-white"
                              }`}
                            >
                              {getInitials(person.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {person.full_name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <span>NIP. {person.nip}</span>
                                <span>•</span>
                                <span className="text-slate-500 font-mono text-[10.5px]">
                                  {person.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Peran & Hak Akses */}
                        <td className="py-4 px-6">
                          {renderRoleBadge(person.role)}
                        </td>

                        {/* Penempatan */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            {renderPlacementIcon(person.placement)}
                            <span>{person.placement}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                person.status === "Aktif"
                                  ? "bg-emerald-500 ring-2 ring-emerald-100"
                                  : "bg-slate-400"
                              }`}
                            />
                            <span
                              className={
                                person.status === "Aktif"
                                  ? "text-slate-700"
                                  : "text-slate-400"
                              }
                            >
                              {person.status}
                            </span>
                          </span>
                        </td>

                        {/* Aktivitas Terakhir */}
                        <td className="py-4 px-6 text-slate-500 font-medium">
                          {person.last_active}
                        </td>

                        {/* Tindakan */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(person)}
                              title="Edit Pengguna"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenHistory(person)}
                              title="Riwayat Aktivitas"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Clock className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toast.info(
                                  `Opsi lanjutan untuk ${person.full_name}`
                                )
                              }
                              title="Opsi Lainnya"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="py-4 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                Menampilkan{" "}
                <span className="font-bold text-slate-800">
                  {filteredPersonnel.length === 0 ? 0 : startIndex + 1} –{" "}
                  {Math.min(startIndex + pageSize, filteredPersonnel.length)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-800">
                  {filteredPersonnel.length}
                </span>{" "}
                personel terdaftar
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 border border-transparent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODAL: TAMBAH PENGGUNA
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Tambah Personel Baru
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftarkan staf Dishub untuk akses modul operasional SILOTER.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Agus Setiawan, S.T."
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP (18 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="199201012015011001"
                    value={formData.nip}
                    onChange={(e) =>
                      setFormData({ ...formData, nip: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Kedinasan *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@kotabogor.go.id"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran &amp; Hak Akses
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Operator CCTV">Operator CCTV</option>
                    <option value="Verifikator Tiket">Verifikator Tiket</option>
                    <option value="Teknisi Lapangan">Teknisi Lapangan</option>
                    <option value="Admin Sistem">Admin Sistem</option>
                    <option value="Admin Utama">Admin Utama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "Aktif" | "Non-aktif",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-aktif">Non-aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penempatan / Titik Pantau
                </label>
                <select
                  value={formData.placement}
                  onChange={(e) =>
                    setFormData({ ...formData, placement: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pos Empang & Simpang BTM">
                    Pos Empang &amp; Simpang BTM
                  </option>
                  <option value="Pos Suryakencana & Pasar Bogor">
                    Pos Suryakencana &amp; Pasar Bogor
                  </option>
                  <option value="Pos Balaikota Bogor">Pos Balaikota Bogor</option>
                  <option value="Unit Reaksi Cepat (URC)">
                    Unit Reaksi Cepat (URC)
                  </option>
                  <option value="Command Center Dishub">
                    Command Center Dishub
                  </option>
                  <option value="Bidang Lalu Lintas">Bidang Lalu Lintas</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  Simpan Personel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT PENGGUNA
          ========================================================================= */}
      {isEditModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Ubah Data Personel
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {activeUser.id} • {activeUser.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nip}
                    onChange={(e) =>
                      setFormData({ ...formData, nip: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Kedinasan
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran &amp; Hak Akses
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Admin Utama">Admin Utama</option>
                    <option value="Admin Sistem">Admin Sistem</option>
                    <option value="Operator CCTV">Operator CCTV</option>
                    <option value="Verifikator Tiket">Verifikator Tiket</option>
                    <option value="Teknisi Lapangan">Teknisi Lapangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "Aktif" | "Non-aktif",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-aktif">Non-aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penempatan / Titik Pantau
                </label>
                <input
                  type="text"
                  value={formData.placement}
                  onChange={(e) =>
                    setFormData({ ...formData, placement: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RIWAYAT AKTIVITAS
          ========================================================================= */}
      {isHistoryModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Log Audit Pegawai
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeUser.full_name} ({activeUser.role})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">
                    Login Sesi Shift
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeUser.last_active} • IP: 10.12.44.18
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">
                    Verifikasi Pelanggaran Ngetem
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tervalidasi #VIO-202610-0982 (Plat F 1934 AK)
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                  <p className="text-xs font-bold text-slate-800">
                    Pemeriksaan Monitoring CCTV
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Stream aktif pada {activeUser.placement}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

