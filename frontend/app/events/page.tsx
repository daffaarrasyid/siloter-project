"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
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

  // Paginasi Antrean (Revisi Item 7)
  const [queuePage, setQueuePage] = useState<number>(1);
  const queuePageSize = 5;

  // Antrean Verifikasi (Data Sesuai Mockup & Patuh AI Single-Class)
  const [items, setItems] = useState<VerificationItem[]>([
    {
      id: "ev-088",
      trackId: "TRK-0142",
      cameraCode: "empang",
      cameraName: "Jl. Djuanda - Empang",
      cameraLabel: "Jl. Djuanda - Empang",
      detectedAt: "13 Nov 2026, 10:42:15 WIB",
      timeWib: "10:42:15 WIB",
      durationSeconds: 84.2,
      thresholdSeconds: 60,
      plateNumber: "F 1934 AK",
      isPlateManual: true,
      status: "Pending",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Pengemudi sengaja menunggu penumpang di bahu jalan > 80 detik.",
      verifier: "Budi Santoso (Petugas 04)",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 92.4,
    },
    {
      id: "ev-087",
      trackId: "TRK-0139",
      cameraCode: "surken",
      cameraName: "Jl. Djuanda - Suryakencana",
      cameraLabel: "Jl. Djuanda - Suryakencana",
      detectedAt: "13 Nov 2026, 10:39:04 WIB",
      timeWib: "10:39:04 WIB",
      durationSeconds: 112.0,
      thresholdSeconds: 60,
      plateNumber: "F 1802 BC",
      isPlateManual: true,
      status: "Pending",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Berhenti di tikungan zebra cross.",
      verifier: "Budi Santoso (Petugas 04)",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 96.1,
    },
    {
      id: "ev-086",
      trackId: "TRK-0135",
      cameraCode: "empang",
      cameraName: "Jl. Djuanda - Empang",
      cameraLabel: "Jl. Djuanda - Empang",
      detectedAt: "13 Nov 2026, 10:35:50 WIB",
      timeWib: "10:35:50 WIB",
      durationSeconds: 71.0,
      thresholdSeconds: 60,
      plateNumber: "F 1878 BB",
      isPlateManual: false,
      status: "Pending",
      reason: "Menurunkan / Menaikkan Penumpang di Luar Halte",
      notes: "Menunggu di mulut persimpangan.",
      verifier: "Budi Santoso (Petugas 04)",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 68.2,
    },
    {
      id: "ev-085",
      trackId: "TRK-0130",
      cameraCode: "empang",
      cameraName: "Jl. Djuanda - Empang",
      cameraLabel: "Jl. Djuanda - Empang",
      detectedAt: "13 Nov 2026, 10:32:00 WIB",
      timeWib: "10:32 WIB",
      durationSeconds: 95.0,
      thresholdSeconds: 60,
      plateNumber: "F 1940 AP",
      isPlateManual: true,
      status: "Valid",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Diverifikasi oleh Petugas 04 • Berita acara tersimpan",
      verifier: "Petugas 04",
      evidenceUrl: "/placeholder-angkot.jpg",
      cropUrl: "/placeholder-crop.jpg",
      aiConfidence: 95.0,
    },
    {
      id: "ev-084",
      trackId: "TRK-0128",
      cameraCode: "surken",
      cameraName: "Jl. Djuanda - Suryakencana",
      cameraLabel: "Jl. Djuanda - Suryakencana",
      detectedAt: "13 Nov 2026, 10:28:00 WIB",
      timeWib: "10:28 WIB",
      durationSeconds: 64.0,
      thresholdSeconds: 60,
      plateNumber: "F 1772 CD",
      isPlateManual: true,
      status: "Invalid",
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

  // Fetch data statistik dan daftar kejadian antrean dari backend
  useEffect(() => {
    async function loadData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Load Stats
      try {
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

      // 2. Load Events List
      try {
        const resEvents = await fetch(`${apiUrl}/api/events?limit=50`);
        if (resEvents.ok) {
          const eventsData = await resEvents.json();
          if (Array.isArray(eventsData) && eventsData.length > 0) {
            const mappedItems: VerificationItem[] = eventsData.map((ev: any, idx: number) => {
              const dt = ev.detected_at ? new Date(ev.detected_at) : new Date();
              return {
                id: ev.id,
                trackId: ev.vehicle_track_id || `TRK-${String(130 + idx).padStart(4, "0")}`,
                cameraCode: ev.camera_code || "empang",
                cameraName: ev.camera_name || "Jl. Djuanda - Empang",
                cameraLabel: ev.camera_name || "Jl. Djuanda - Empang",
                detectedAt: dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) + `, ` + dt.toLocaleTimeString("id-ID", { hour12: false }) + ` WIB`,
                timeWib: dt.toLocaleTimeString("id-ID", { hour12: false }) + ` WIB`,
                durationSeconds: ev.duration_seconds || 75,
                thresholdSeconds: 60,
                plateNumber: ev.plate_number || (idx === 0 ? "F 1934 AK" : idx === 1 ? "F 1802 BC" : "Belum Diinput"),
                isPlateManual: Boolean(ev.plate_number),
                status: (ev.validation_status as "Pending" | "Valid" | "Invalid") || "Pending",
                reason: ev.reason || "Ngetem Menghambat Lalu Lintas",
                notes: ev.notes || "Pengemudi berhenti di bahu jalan persimpangan melebihi toleransi waktu.",
                verifier: "Budi Santoso, S.T.",
                evidenceUrl: ev.evidence_image_url || "/placeholder-angkot.jpg",
                cropUrl: ev.evidence_image_url || "/placeholder-crop.jpg",
                aiConfidence: 94.5,
              };
            });
            setItems(mappedItems);
            setSelectedItem(mappedItems[0]);
          }
        }
      } catch (err) {
        console.warn("Backend events offline, using initial dataset:", err);
      }
    }

    loadData();
  }, []);

  // Real-time WebSocket connection to receive auto-capture alerts
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws");
      ws = new WebSocket(`${wsUrl}/ws/alerts`);

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data && data.event_type === "duration_update" && data.event_id) {
            setItems((prev) =>
              prev.map((it) =>
                it.id === data.event_id
                  ? { ...it, durationSeconds: data.duration_seconds }
                  : it
              )
            );
            setSelectedItem((prev) =>
              prev && prev.id === data.event_id
                ? { ...prev, durationSeconds: data.duration_seconds }
                : prev
            );
          } else if (data && data.event_id) {
            toast.error(
              `Pelanggaran Baru Masuk Antrean: ${data.vehicle_track_id} (${data.camera_name})`
            );

            const newItem: VerificationItem = {
              id: data.event_id,
              trackId: data.vehicle_track_id || "TRK-0001",
              cameraCode: data.camera_code || "empang",
              cameraName: data.camera_name || "Jl. Djuanda - Empang",
              cameraLabel: data.camera_name || "Jl. Djuanda - Empang",
              detectedAt:
                new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
                `, ` +
                new Date().toLocaleTimeString("id-ID", { hour12: false }) +
                ` WIB`,
              timeWib: new Date().toLocaleTimeString("id-ID", { hour12: false }) + ` WIB`,
              durationSeconds: data.duration_seconds || 60,
              thresholdSeconds: data.threshold_seconds || 60,
              plateNumber: "Belum Diinput",
              isPlateManual: false,
              status: "Pending",
              reason: "Ngetem Menghambat Lalu Lintas",
              notes: "Auto-Capture sistem: Kendaraan terdeteksi berhenti di zona larangan.",
              verifier: "Budi Santoso, S.T.",
              evidenceUrl: data.evidence_url || "/placeholder-angkot.jpg",
              cropUrl: data.evidence_url || "/placeholder-crop.jpg",
              aiConfidence: 94.5,
            };

            setItems((prev) => [newItem, ...prev]);
            setKpiStats((prev) => ({
              ...prev,
              totalToday: prev.totalToday + 1,
              pendingToday: prev.pendingToday + 1,
            }));
          }
        } catch {
          // ignore non-json pings
        }
      };
    } catch (e) {
      console.warn("WebSocket alerts connection failed:", e);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
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
    setKpiStats((prev) => ({
      ...prev,
      pendingToday: Math.max(0, prev.pendingToday - 1),
    }));
    toast.success(`Kejadian ${selectedItem.trackId} terkonfirmasi VALID.`);
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
    setKpiStats((prev) => ({
      ...prev,
      pendingToday: Math.max(0, prev.pendingToday - 1),
    }));
    toast.warning(`Kejadian ${selectedItem.trackId} ditolak (INVALID / Bukan Ngetem).`);
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f7fc] text-slate-800 font-sans overflow-hidden">
      {/* SIDEBAR MODULAR */}
      <Sidebar pendingCount={kpiStats.pendingToday} />

      {/* =========================================================================
          KONTEN UTAMA: VERIFIKASI PELANGGARAN
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* NAVBAR MODULAR (Profil & Logout konsisten) */}
        <Navbar />

        {/* WORKSPACE AREA */}
        <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* HEADER HALAMAN (Item 3: Di dalam halaman, konsisten, tanpa emoji) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  Verifikasi Pelanggaran
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pemeriksaan bukti insiden ngetem angkutan umum dan validasi nomor polisi secara manual oleh petugas (HITL).
              </p>
            </div>
          </div>

          {/* ===================================================================
              BARIS 1: 3 KARTU KPI RINGKASAN
              =================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* KPI 1: Terdeteksi Hari Ini */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs text-center flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Terdeteksi Hari Ini
              </span>
              <div className="text-4xl font-bold text-slate-900 tracking-tight">
                {kpiStats.totalToday}
              </div>
              <span className="text-xs font-medium text-slate-500 mt-1">
                Kejadian
              </span>
            </div>

            {/* KPI 2: Pending Hari Ini (Amber Border) */}
            <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-2xs text-center flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Terdeteksi Hari Ini
              </span>
              <div className="text-4xl font-bold text-amber-500 tracking-tight">
                {kpiStats.pendingToday}
              </div>
              <span className="text-xs font-semibold text-amber-600 mt-1">
                Pending
              </span>
            </div>

            {/* KPI 3: Keyakinan AI (Akurasi Tinggi) */}
            <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-2xs text-center flex flex-col justify-center items-center">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Keyakinan AI
              </span>
              <div className="text-4xl font-bold text-blue-600 tracking-tight">
                {kpiStats.aiConfidencePercent}%
              </div>
              <span className="text-xs font-semibold text-blue-600 mt-1">
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
                    <h2 className="text-xs font-semibold text-slate-900">
                      Antrean Verifikasi
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Durasi Terlama</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                      {kpiStats.pendingToday} Pending
                    </span>
                  </div>
                </div>

                {/* List Item Antrean */}
                <div className="space-y-2.5">
                  {items
                    .slice((queuePage - 1) * queuePageSize, queuePage * queuePageSize)
                    .map((it) => {
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
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {it.trackId}
                            </span>
                          </div>

                          {isValid && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {isInvalid && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold flex items-center gap-1">
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
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {it.plateNumber}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
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
                            <span className="font-semibold text-slate-700">{it.plateNumber}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination Antrean Bawah (Revisi Item 7) */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Hal. {queuePage} dari {Math.ceil(items.length / queuePageSize) || 1} (Total {items.length})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={queuePage <= 1}
                    onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                    aria-label="Halaman sebelumnya"
                    className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={queuePage >= Math.ceil(items.length / queuePageSize)}
                    onClick={() => setQueuePage((p) => Math.min(Math.ceil(items.length / queuePageSize), p + 1))}
                    aria-label="Halaman berikutnya"
                    className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                    <h2 className="text-lg font-black text-slate-900 tracking-tight font-mono">
                      {selectedItem.trackId}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200 uppercase">
                      {selectedItem.status === "Pending" ? "DALAM TINJAUAN" : selectedItem.status}
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
                      Bukti CCTV
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      CAM-01 &bull; 1920x1080 @ ~1 FPS
                    </span>
                  </div>

                  {/* Frame Area */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedItem.evidenceUrl || `http://localhost:8000/api/stream/${selectedItem.cameraCode}`}
                      alt="Bukti CCTV"
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `http://localhost:8000/api/stream/${selectedItem.cameraCode}`;
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-700/80 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Auto-Capture Inset Zoom &amp; Enhanced
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

                  {/* Baris 2: Alasan Kejadian */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Alasan Kejadian
                    </label>
                    <div className="relative">
                      <select
                        value={reasonForm}
                        onChange={(e) => setReasonForm(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer pr-8"
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

                  {/* Baris 3: Catatan Petugas */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Catatan Petugas (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={notesForm}
                      onChange={(e) => setNotesForm(e.target.value)}
                      placeholder="Masukkan catatan spesifik operator lapangan..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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

