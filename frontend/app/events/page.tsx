"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Video,
  AlertTriangle,
  Layers,
  BarChart3,
  Users,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  AlertOctagon,
  Timer,
  Search,
  Check,
  X,
  Edit3,
  ZoomIn,
  Download,
  RotateCcw,
  Lock,
  ChevronDown,
  Info,
  ShieldCheck,
  FileText,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface VerificationItem {
  id: string;
  incidentCode: string;
  trackId: string;
  cameraCode: string;
  cameraName: string;
  cameraLabel: string;
  detectedAt: string;
  timeWib: string;
  durationSeconds: number;
  thresholdSeconds: number;
  plateNumber: string;
  isPlateManual: boolean;
  status: "Pending" | "Valid" | "Invalid";
  trayekCode: string;
  trayekName: string;
  trayekSub: string;
  reason: string;
  notes: string;
  verifier: string;
  evidenceUrl: string;
  cropUrl: string;
  aiConfidence: number;
}

export default function VerificationPage() {
  const router = useRouter();

  // 3 Metrik KPI Atas
  const [kpiStats, setKpiStats] = useState({
    totalToday: 142,
    pendingToday: 12,
    aiConfidencePercent: 94.8,
  });

  // Antrean Verifikasi (Data Sesuai Mockup & Patuh AI Single-Class)
  const [items, setItems] = useState<VerificationItem[]>([
    {
      id: "ev-088",
      incidentCode: "#N-20261006-088",
      trackId: "Track #142",
      cameraCode: "empang",
      cameraName: "Simpang BTM (CAM-01)",
      cameraLabel: "Simpang BTM (CAM-01)",
      detectedAt: "06 Okt 2026, 10:42:15 WIB",
      timeWib: "10:42:15 WIB",
      durationSeconds: 84.2,
      thresholdSeconds: 60,
      plateNumber: "F 1934 AK",
      isPlateManual: true,
      status: "Pending",
      trayekCode: "02",
      trayekName: "Trayek 02: Sukasari – Bubulak PP",
      trayekSub: "Bodi Hijau Pintu Kuning • Organda Kota Bogor",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Pengemudi sengaja menunggu penumpang di depan gerbang BTM > 80 detik.",
      verifier: "Budi Santoso (Petugas 04)",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 92.4,
    },
    {
      id: "ev-087",
      incidentCode: "#N-20261006-087",
      trackId: "Track #139",
      cameraCode: "surken",
      cameraName: "Jembatan Merah (CAM-02)",
      cameraLabel: "Jembatan Merah (CAM-02)",
      detectedAt: "06 Okt 2026, 10:39:04 WIB",
      timeWib: "10:39:04 WIB",
      durationSeconds: 112.0,
      thresholdSeconds: 60,
      plateNumber: "F 1802 BC",
      isPlateManual: true,
      status: "Pending",
      trayekCode: "10",
      trayekName: "Trayek 10: Bantar Kemang – Merdeka PP",
      trayekSub: "Bodi Hijau Garis Merah • Organda Kota Bogor",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Berhenti di tikungan zebra cross.",
      verifier: "Budi Santoso (Petugas 04)",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 96.1,
    },
    {
      id: "ev-086",
      incidentCode: "#N-20261006-086",
      trackId: "Track #135",
      cameraCode: "empang",
      cameraName: "Simpang BTM (CAM-01)",
      cameraLabel: "Simpang BTM (CAM-01)",
      detectedAt: "06 Okt 2026, 10:35:50 WIB",
      timeWib: "10:35:50 WIB",
      durationSeconds: 71.0,
      thresholdSeconds: 60,
      plateNumber: "F 1878 BB",
      isPlateManual: false,
      status: "Pending",
      trayekCode: "03",
      trayekName: "Trayek 03: Baranangsiang – Bubulak PP",
      trayekSub: "Bodi Hijau Pintu Kuning • Organda Kota Bogor",
      reason: "Menurunkan / Menaikkan Penumpang di Luar Halte",
      notes: "Menunggu di mulut persimpangan.",
      verifier: "Budi Santoso (Petugas 04)",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 68.2,
    },
    {
      id: "ev-085",
      incidentCode: "#N-20261006-085",
      trackId: "Track #130",
      cameraCode: "empang",
      cameraName: "Simpang BTM (CAM-01)",
      cameraLabel: "Simpang BTM (CAM-01)",
      detectedAt: "06 Okt 2026, 10:32:00 WIB",
      timeWib: "10:32 WIB",
      durationSeconds: 95.0,
      thresholdSeconds: 60,
      plateNumber: "F 1940 AP",
      isPlateManual: true,
      status: "Valid",
      trayekCode: "02",
      trayekName: "Trayek 02: Sukasari – Bubulak PP",
      trayekSub: "Bodi Hijau Pintu Kuning • Organda Kota Bogor",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Diverifikasi oleh Petugas 04 • Berita acara tersimpan",
      verifier: "Petugas 04",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 95.0,
    },
    {
      id: "ev-084",
      incidentCode: "#N-20261006-084",
      trackId: "Track #128",
      cameraCode: "surken",
      cameraName: "Jembatan Merah (CAM-02)",
      cameraLabel: "Jembatan Merah (CAM-02)",
      detectedAt: "06 Okt 2026, 10:28:00 WIB",
      timeWib: "10:28 WIB",
      durationSeconds: 64.0,
      thresholdSeconds: 60,
      plateNumber: "F 1772 CD",
      isPlateManual: true,
      status: "Invalid",
      trayekCode: "03",
      trayekName: "Trayek 03: Baranangsiang – Bubulak PP",
      trayekSub: "Bodi Hijau • Organda Kota Bogor",
      reason: "Terjebak Antrean / Kemacetan Simpang (Bukan Pelanggaran)",
      notes: "Alasan: Macet Total (Bukan Ngetem Disengaja)",
      verifier: "Petugas 04",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 91.5,
    },
  ]);

  // Item Aktif yang Sedang Ditinjau di Panel Kanan
  const [selectedItem, setSelectedItem] = useState<VerificationItem>(items[0]);

  // Form State untuk Item yang Sedang Ditinjau
  const [plateForm, setPlateForm] = useState<string>(items[0].plateNumber);
  const [reasonForm, setReasonForm] = useState<string>(items[0].reason);
  const [notesForm, setNotesForm] = useState<string>(items[0].notes);

  // Sinkronisasi form saat ganti item aktif
  useEffect(() => {
    setPlateForm(selectedItem.plateNumber);
    setReasonForm(selectedItem.reason);
    setNotesForm(selectedItem.notes);
  }, [selectedItem]);

  // Fetch data statistik dari backend
  useEffect(() => {
    async function loadStats() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/events/summary/stats`);
        if (res.ok) {
          const data = await res.json();
          setKpiStats({
            totalToday: data.total_today || 142,
            pendingToday: data.pending_today || 12,
            aiConfidencePercent: data.ai_confidence_percent || 94.8,
          });
        }
      } catch (err) {
        console.warn("Backend KPI stats offline, using defaults:", err);
      }
    }
    loadStats();
  }, []);

  // Action: Tandai Valid
  const handleMarkValid = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/events/${selectedItem.id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validation_status: "Valid",
          plate_number: plateForm,
          reason: reasonForm,
          notes: notesForm,
        }),
      });
    } catch (e) {
      console.warn("Validasi disimpan lokal:", e);
    }

    const updated = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            status: "Valid" as const,
            plateNumber: plateForm,
            reason: reasonForm,
            notes: notesForm,
          }
        : it
    );
    setItems(updated);
    setSelectedItem((prev) => ({ ...prev, status: "Valid" }));
    toast.success(`Kejadian ${selectedItem.incidentCode} terkonfirmasi VALID.`);
  };

  // Action: Edit & Valid
  const handleEditAndValid = async () => {
    if (!plateForm.trim()) {
      toast.error("Nomor plat polisi wajib diisi.");
      return;
    }
    await handleMarkValid();
    toast.info("Perubahan data plat dan catatan berhasil disimpan.");
  };

  // Action: Tandai Invalid
  const handleMarkInvalid = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/events/${selectedItem.id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validation_status: "Invalid",
          reason: reasonForm,
          notes: notesForm,
        }),
      });
    } catch (e) {
      console.warn("Validasi disimpan lokal:", e);
    }

    const updated = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            status: "Invalid" as const,
            reason: reasonForm,
            notes: notesForm,
          }
        : it
    );
    setItems(updated);
    setSelectedItem((prev) => ({ ...prev, status: "Invalid" }));
    toast.warning(`Kejadian ${selectedItem.incidentCode} ditolak (INVALID / Bukan Ngetem).`);
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
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs text-left"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi</span>
                </div>
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {kpiStats.pendingToday}
                </span>
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
                onClick={() => toast.info("Modul Analitik & Laporan Recharts.")}
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
              <button
                type="button"
                onClick={() => toast.info("Manajemen Pengguna Dishub.")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Pengguna</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Sistem</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Profil Operator Dishub & Logout */}
        <div className="pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">
                BS
              </div>
              <div className="truncate max-w-[110px]">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Budi Santoso, S.T.
                </p>
                <p className="text-[10px] text-slate-400">Admin Dishub</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                toast.success("Berhasil keluar dari sesi Dishub.");
                router.push("/login");
              }}
              title="Keluar"
              aria-label="Keluar dari sesi"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          KONTEN UTAMA: VERIFIKASI PELANGGARAN
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header App Bar */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-8 py-3.5 flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Verifikasi Pelanggaran
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs font-bold text-slate-900">Budi Santoso, S.T.</p>
                <p className="text-[10px] text-slate-400">Admin</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">
                BS
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ===================================================================
              BARIS 1: 3 KARTU KPI RINGKASAN
              =================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* KPI 1: Terdeteksi Hari Ini */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs text-center flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Terdeteksi Hari Ini
              </span>
              <div className="text-4xl font-black text-slate-900 tracking-tight">
                {kpiStats.totalToday}
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1">
                Kejadian
              </span>
            </div>

            {/* KPI 2: Pending Hari Ini (Amber Border) */}
            <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-2xs text-center flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Terdeteksi Hari Ini
              </span>
              <div className="text-4xl font-black text-amber-500 tracking-tight">
                {kpiStats.pendingToday}
              </div>
              <span className="text-xs font-bold text-amber-600 mt-1">
                Pending
              </span>
            </div>

            {/* KPI 3: Keyakinan AI (Akurasi Tinggi) */}
            <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-2xs text-center flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Keyakinan AI
              </span>
              <div className="text-4xl font-black text-blue-600 tracking-tight">
                {kpiStats.aiConfidencePercent}%
              </div>
              <span className="text-xs font-bold text-blue-600 mt-1">
                Tinggi
              </span>
            </div>
          </div>

          {/* ===================================================================
              BARIS 2: DUA KOLOM (KIRI: ANTREAN VERIFIKASI; KANAN: WORKSPACE DETAIL)
              =================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* =================================================================
                KOLOM KIRI (5/12): ANTREAN VERIFIKASI
                ================================================================= */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
              <div>
                {/* Header Antrean */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      ANTREAN VERIFIKASI
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Durasi Terlama</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                      {kpiStats.pendingToday} Pending
                    </span>
                  </div>
                </div>

                {/* List Item Antrean */}
                <div className="space-y-2.5">
                  {items.map((it) => {
                    const isSelected = selectedItem.id === it.id;
                    const isPending = it.status === "Pending";
                    const isValid = it.status === "Valid";
                    const isInvalid = it.status === "Invalid";

                    return (
                      <div
                        key={it.id}
                        onClick={() => setSelectedItem(it)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-400"
                            : "bg-white hover:bg-slate-50 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">
                              {it.incidentCode}
                            </span>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                              {it.trackId}
                            </span>
                          </div>

                          {isValid && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {isInvalid && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold flex items-center gap-1">
                              <X className="w-3 h-3" /> Invalid
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {it.timeWib}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {it.cameraLabel}
                          </span>

                          {/* Badge Durasi Berhenti */}
                          <div className="flex items-center gap-2">
                            {it.plateNumber && !isValid && !isInvalid && (
                              <span className="font-bold text-slate-800 text-[11px]">
                                {it.plateNumber}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                isPending
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : "text-slate-500"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {it.durationSeconds}s (+{Math.round(it.durationSeconds - it.thresholdSeconds)}s)
                            </span>
                          </div>
                        </div>

                        {/* Catatan verifikator jika sudah diverifikasi */}
                        {!isPending && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>{it.notes}</span>
                            <span className="font-bold text-slate-700">{it.plateNumber}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination Antrean Bawah */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>Hal. 1 dari 9 (Total 42)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Halaman sebelumnya"
                    className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Halaman berikutnya"
                    className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================================
                KOLOM KANAN (7/12): DETAIL VERIFIKASI & HASIL KEPUTUSAN
                ================================================================= */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Header Box Detail Item Terpilih */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {selectedItem.incidentCode}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200 uppercase">
                      {selectedItem.status === "Pending" ? "DALAM TINJAUAN" : selectedItem.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {selectedItem.trackId}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  <span className="font-semibold text-slate-700">{selectedItem.cameraName}</span> &bull; {selectedItem.detectedAt} &bull; Ambang Batas Zona: <strong className="text-slate-800">{selectedItem.thresholdSeconds}s</strong>
                </p>

                {/* Banner Durasi Ngetem Merah */}
                <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">
                        DURASI NGETEM
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-red-600">
                          {selectedItem.durationSeconds} Detik
                        </span>
                        <span className="text-xs font-bold text-red-500">
                          (+{(selectedItem.durationSeconds - selectedItem.thresholdSeconds).toFixed(1)}s Lewat Batas)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===============================================================
                  FOTO BUKTI AUTO-CAPTURE (KIRI: CCTV FRAME; KANAN: CROP DETAIL KENDARAAN)
                  =============================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Bukti CCTV Penuh */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      BUKTI CCTV
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      CAM-01 &bull; 1920x1080 @ ~1 FPS
                    </span>
                  </div>

                  {/* Frame Area */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`http://localhost:8000/api/stream/${selectedItem.cameraCode}`}
                      alt="Bukti CCTV"
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 pointer-events-none -z-10 flex items-center justify-center text-[10px] text-slate-500">
                      Simulasi Frame Bukti Auto-Capture
                    </div>

                    {/* HUD Bounding Box */}
                    <div className="absolute top-10 left-8 right-16 bottom-8 border-2 border-dashed border-blue-500/80 bg-blue-500/10 rounded-lg pointer-events-none">
                      <div className="absolute -top-2.5 left-2 bg-blue-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        ROI-01: Simpang BTM (Zona Larangan Berhenti)
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-14 w-28 h-18 border-2 border-red-500 bg-red-500/20 rounded pointer-events-none p-1">
                      <span className="bg-red-600 text-white text-[7.5px] font-black px-1 rounded block">
                        FRAME #084201 | ANGKOT #142 84s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <span className="font-mono">Model: YOLOv8n ONNX (ByteTrack)</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toast.info("Zoom In frame CCTV")}
                        aria-label="Perbesar frame bukti CCTV"
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.success("Foto bukti CCTV diunduh (.jpg)")}
                        aria-label="Unduh foto bukti CCTV"
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ===============================================================
                    2. DETAIL FOTO KENDARAAN (CROP BUKTI FISIK)
                    ATURAN REVISI UI SILOTER:
                    - Model AI TIDAK BISA OCR/ANPR plat nomor.
                    - Digantikan dengan foto crop kendaraan dan panduan inspeksi visual.
                    =============================================================== */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      DETAIL KENDARAAN (CROP BUKTI)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                      Single-Class AI &bull; Conf {selectedItem.aiConfidence}%
                    </span>
                  </div>

                  {/* Crop Image Area */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-xs font-mono font-bold text-white bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 inline-block mb-2">
                        {selectedItem.plateNumber}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Crop Otomatis Frame Bounding Box Angkot
                      </p>
                    </div>
                  </div>

                  {/* Panduan Inspeksi Visual Petugas */}
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <div className="flex items-center justify-between font-medium">
                      <span>Warna Bodi: Hijau Kota Bogor</span>
                      <span className="text-blue-600 font-bold">Anchor Point di ROI: OK</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">
                      Pemeriksaan visual oleh operator Dishub sebelum penerbitan berita acara.
                    </p>
                  </div>
                </div>
              </div>

              {/* ===============================================================
                  FORM HASIL VERIFIKASI (HUMAN-IN-THE-LOOP OPERATOR)
                  =============================================================== */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Hasil Verifikasi</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Target Tabel: <strong className="font-mono text-slate-600">violation_events</strong>
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Baris 1: ID Objek & Koreksi Plat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Read-only: ID Objek ByteTrack */}
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        IDENTIFIKASI OBJEK AI (BYTE TRACK)
                      </label>
                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                        <span>{selectedItem.trackId} (Single-Class Detected)</span>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Kolom: vehicle_track_id &bull; Hasil inferensi spatio-temporal model.
                      </p>
                    </div>

                    {/* Wajib Periksa: Koreksi Plat Nomor Manual */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                          KOREKSI PLAT
                        </label>
                        <span className="text-[10px] font-bold text-red-600">*Wajib periksa</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={plateForm}
                          onChange={(e) => setPlateForm(e.target.value.toUpperCase())}
                          placeholder="F 1934 AK"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setPlateForm(selectedItem.plateNumber)}
                          title="Reset ke nilai awal"
                          aria-label="Reset nomor plat"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Kolom: plat_nomor_koreksi &bull; Format: [Huruf] [Nomor] [Seri]
                      </p>
                    </div>
                  </div>

                  {/* Baris 2: Trayek Referensi & Alasan Kejadian */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Kartu Trayek Referensi */}
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        TRAYEK (REFERENSI JALUR)
                      </label>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {selectedItem.trayekCode}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {selectedItem.trayekName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {selectedItem.trayekSub}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Alasan Kejadian Dropdown */}
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        ALASAN KEJADIAN
                      </label>
                      <div className="relative">
                        <select
                          value={reasonForm}
                          onChange={(e) => setReasonForm(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer pr-8"
                        >
                          <option value="Ngetem Menghambat Lalu Lintas">
                            Ngetem Menghambat Lalu Lintas
                          </option>
                          <option value="Menurunkan / Menaikkan Penumpang di Luar Halte">
                            Menurunkan / Menaikkan Penumpang di Luar Halte
                          </option>
                          <option value="Terjebak Antrean / Kemacetan Simpang (Bukan Pelanggaran)">
                            Terjebak Antrean / Kemacetan Simpang (Bukan Pelanggaran)
                          </option>
                          <option value="Mogok / Kendala Teknis Kendaraan">
                            Mogok / Kendala Teknis Kendaraan
                          </option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Baris 3: Catatan Petugas */}
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                      CATATAN PETUGAS (OPSIONAL)
                    </label>
                    <textarea
                      rows={2}
                      value={notesForm}
                      onChange={(e) => setNotesForm(e.target.value)}
                      placeholder="Masukkan catatan spesifik operator lapangan..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Baris 4: Info Verifikator & Tombol Aksi */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      <span>Verifikator: </span>
                      <strong className="text-slate-800 font-bold">{selectedItem.verifier}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tombol Tolak (Invalid) */}
                      <button
                        type="button"
                        onClick={handleMarkInvalid}
                        className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Invalid</span>
                      </button>

                      {/* Tombol Edit & Valid */}
                      <button
                        type="button"
                        onClick={handleEditAndValid}
                        className="px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit &amp; Valid</span>
                      </button>

                      {/* Tombol Valid */}
                      <button
                        type="button"
                        onClick={handleMarkValid}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valid</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

