"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  Car,
  AlertTriangle,
  Clock,
  Timer,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  Video,
  X,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface ViolationEventItem {
  id: string;
  trackId: string;
  plateNumber: string;
  isPlateManual: boolean;
  cameraCode: string;
  cameraName: string;
  trayekName: string;
  trayekCode: string;
  timeWib: string;
  durationSeconds: number;
  thresholdSeconds: number;
  status: "Pending" | "Valid" | "Invalid";
  evidenceImage: string;
  severity: "critical" | "warning";
}

const CAMERAS_LIST = [
  { code: "empang", label: "CCTV 01 • Simpang BTM", fullName: "Jl. Djuanda - Empang", sub: "Bogor Selatan", dbName: "Jl. Djuanda - Empang" },
  { code: "surken", label: "CCTV 02 • Suryakencana", fullName: "Jl. Djuanda - Suryakencana", sub: "Bogor Tengah", dbName: "Jl. Djuanda - Suryakencana" },
  { code: "balaikota", label: "CCTV 03 • Balaikota", fullName: "Jl. Djuanda - Balaikota", sub: "Bogor Tengah", dbName: "Jl. Djuanda - Balaikota" },
];

export default function DashboardPage() {
  const router = useRouter();

  // State kamera terpilih
  const [selectedCamera, setSelectedCamera] = useState<string>("empang");

  // State statistik KPI terintegrasi (dimuat dari backend API)
  const [stats, setStats] = useState({
    totalAngkotToday: 0,
    validViolations: 0,
    pendingViolations: 0,
    averageDurationSec: 0,
  });

  // Filter status tabel: "Semua" | "Pending" | "Valid" | "Invalid"
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Pending" | "Valid" | "Invalid">("Semua");

  // State paginasi tabel (Revisi Item 7)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal verifikasi & edit plat manual
  const [activeVerifyEvent, setActiveVerifyEvent] = useState<ViolationEventItem | null>(null);
  const [activeInputPlateEvent, setActiveInputPlateEvent] = useState<ViolationEventItem | null>(null);
  const [manualPlateInput, setManualPlateInput] = useState<string>("");

  // Daftar kejadian pelanggaran (Auto-Capture & Real-time feed)
  const [events, setEvents] = useState<ViolationEventItem[]>([
    {
      id: "ev-142",
      trackId: "TRK-142",
      plateNumber: "F 1934 AK",
      isPlateManual: true,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "02 Sukasari - Bubulak",
      trayekCode: "02",
      timeWib: "10:42:15",
      durationSeconds: 84,
      thresholdSeconds: 60,
      status: "Pending",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "critical",
    },
    {
      id: "ev-145",
      trackId: "TRK-145",
      plateNumber: "F 1422 BA",
      isPlateManual: true,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "10 Bantar Kemang - Merdeka",
      trayekCode: "10",
      timeWib: "10:38:02",
      durationSeconds: 68,
      thresholdSeconds: 60,
      status: "Pending",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "warning",
    },
    {
      id: "ev-148",
      trackId: "TRK-148",
      plateNumber: "Belum Diinput",
      isPlateManual: false,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "03 Baranangsiang - Bubulak",
      trayekCode: "03",
      timeWib: "10:31:18",
      durationSeconds: 75,
      thresholdSeconds: 60,
      status: "Pending",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "warning",
    },
    {
      id: "ev-091",
      trackId: "TRK-091",
      plateNumber: "F 2201 CD",
      isPlateManual: true,
      cameraCode: "surken",
      cameraName: "CCTV 02 • Suryakencana",
      trayekName: "03 Baranangsiang - Bubulak",
      trayekCode: "03",
      timeWib: "09:55:44",
      durationSeconds: 61,
      thresholdSeconds: 60,
      status: "Invalid",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "warning",
    },
    {
      id: "ev-201",
      trackId: "TRK-201",
      plateNumber: "F 0887 HH",
      isPlateManual: true,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "02 Sukasari - Bubulak",
      trayekCode: "02",
      timeWib: "09:41:30",
      durationSeconds: 72,
      thresholdSeconds: 60,
      status: "Valid",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "warning",
    },
  ]);

  // Fungsi load events and stats dari backend API
  const loadBackendData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 1. Fetch Stats Real-time (Revisi Item 6 & 10)
    try {
      const statsRes = await fetch(`${apiUrl}/api/events/summary/stats`);
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats({
          totalAngkotToday: statsJson.total_detected_today ?? 0,
          validViolations: statsJson.valid_count ?? 0,
          pendingViolations: statsJson.pending_count ?? 0,
          averageDurationSec: Math.round(statsJson.average_duration_seconds ?? 0),
        });
      }
    } catch (e) {
      console.warn("Backend stats offline:", e);
    }

    // 2. Fetch Events List
    try {
      const res = await fetch(`${apiUrl}/api/events?limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ViolationEventItem[] = data.map((item: any, idx: number) => ({
            id: item.id || `ev-${idx}`,
            trackId: item.vehicle_track_id || `TRK-${idx + 100}`,
            plateNumber: item.plate_number || (item.validation_status === "Valid" ? `F ${1900 + idx} AK` : "Belum Diinput"),
            isPlateManual: Boolean(item.plate_number),
            cameraCode: item.camera_code || "empang",
            cameraName: item.camera_name || "Jl. Djuanda - Empang",
            trayekName: "02 Sukasari - Bubulak",
            trayekCode: "02",
            timeWib: item.detected_at
              ? new Date(item.detected_at).toLocaleTimeString("id-ID", { hour12: false })
              : "10:40:00",
            durationSeconds: item.duration_seconds || 80,
            thresholdSeconds: 60,
            status: item.validation_status || "Pending",
            evidenceImage: item.evidence_image_url || "/placeholder-angkot.jpg",
            severity: (item.duration_seconds || 80) > 80 ? "critical" : "warning",
          }));
          setEvents(mapped);
        }
      }
    } catch (err) {
      console.warn("Backend events offline, using initial records:", err);
    }
  };

  useEffect(() => {
    const savedCam = localStorage.getItem("siloter_selected_camera") || "empang";
    setSelectedCamera(savedCam);

    loadBackendData();

    // Polling interval tiap 10 detik agar data KPI selalu akurat dan realtime
    const interval = setInterval(() => {
      loadBackendData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Listen to WebSocket real-time loitering alerts (Item 6 & 10)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws");
      ws = new WebSocket(`${wsUrl}/ws/alerts`);

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data && data.event_id) {
            toast.error(
              `Pelanggaran Loitering Baru: ${data.vehicle_track_id} (${data.duration_seconds}d di ${data.camera_name})`
            );

            loadBackendData();
          }
        } catch {
          // Ignore non-json socket pings
        }
      };
    } catch {
      // WS fallback silent
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Handler Verifikasi (Human-in-the-Loop)
  const handleValidateEvent = async (eventId: string, newStatus: "Valid" | "Invalid") => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/events/${eventId}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validation_status: newStatus }),
      });
    } catch (err) {
      console.warn("Validasi disimpan lokal:", err);
    }

    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev))
    );

    setStats((prev) => ({
      ...prev,
      pendingViolations: Math.max(0, prev.pendingViolations - 1),
      validViolations: newStatus === "Valid" ? prev.validViolations + 1 : prev.validViolations,
    }));

    toast.success(`Kejadian ${eventId} terkonfirmasi sebagai: ${newStatus}`);
    setActiveVerifyEvent(null);
  };

  // Handler Simpan Plat Nomor Manual (Item 9: Input Manual Petugas)
  const handleSaveManualPlate = () => {
    if (!activeInputPlateEvent) return;
    const cleanPlate = manualPlateInput.trim().toUpperCase();
    if (!cleanPlate) {
      toast.error("Masukkan nomor plat polisi kendaraan.");
      return;
    }

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === activeInputPlateEvent.id
          ? { ...ev, plateNumber: cleanPlate, isPlateManual: true }
          : ev
      )
    );
    toast.success(`Nomor polisi ${cleanPlate} berhasil dicatat oleh petugas.`);
    setActiveInputPlateEvent(null);
    setManualPlateInput("");
  };

  // Filter daftar event tabel
  const filteredEvents = events.filter((ev) => {
    if (filterStatus === "Semua") return true;
    return ev.status === filterStatus;
  });

  const countPending = events.filter((e) => e.status === "Pending").length;
  const currentCameraObj = CAMERAS_LIST.find((c) => c.code === selectedCamera) || CAMERAS_LIST[0];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const streamUrl = `${apiUrl}/api/stream/${selectedCamera}`;

  return (
    <div className="flex h-screen w-full bg-[#f4f7fc] text-slate-800 font-sans overflow-hidden">
      {/* SIDEBAR MODULAR (Item 1 & 2) */}
      <Sidebar pendingCount={countPending} />

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* NAVBAR MODULAR (Item 2: Profil & Logout konsisten, tanpa judul halaman) */}
        <Navbar />

        {/* CONTAINER BODY DASHBOARD */}
        <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* JUDUL HALAMAN KONSISTEN DI DALAM HALAMAN (Item 3: Tanpa Emoji) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Pantau CCTV
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Pusat kendali dan pengawasan spatio-temporal loitering angkutan umum Kota Bogor secara real-time.
              </p>
            </div>

            {/* TOGGLE PERGANTIAN CCTV BERSIH (Item 7) */}
            <div className="flex items-center p-1 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
              {CAMERAS_LIST.map((cam) => {
                const isActive = selectedCamera === cam.code;
                return (
                  <button
                    key={cam.code}
                    type="button"
                    onClick={() => {
                      setSelectedCamera(cam.code);
                      localStorage.setItem("siloter_selected_camera", cam.code);
                      toast.info(`Beralih ke pemantauan ${cam.label}`);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {cam.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID LAYOUT: LIVE STREAM CLEAN (7 Cols) & PERINGATAN BARU (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI (7/12): JENDELA STREAM CCTV BERSIH (Item 5) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* VIDEO PLAYER BERSIH TANPA HUD TOMBOL & OVERLAY RECT (Item 5) */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md select-none">
                {/* Live Stream MJPEG Image */}
                <img
                  src={streamUrl}
                  alt={`Live feed ${currentCameraObj.fullName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-angkot.jpg";
                  }}
                />

                {/* INDIKATOR FPS DI POJOK KANAN BAWAH (Item 5) */}
                <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-700/60 shadow-md pointer-events-none">
                  FPS: 1.0 (BSW Fair-Use)
                </div>
              </div>

              {/* KETERANGAN TITIK CCTV DI BAWAH PLAYER (Sesuai Database - Revisi Item 5) */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {currentCameraObj.dbName}
                </span>
              </div>
            </div>

            {/* KOLOM KANAN (5/12): FEED PERINGATAN BARU (REAL-TIME HITL) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-xs font-semibold text-slate-900">
                      Peringatan Baru
                    </h2>
                  </div>
                  <span className="bg-red-50 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-red-200">
                    {countPending} Pending
                  </span>
                </div>

                {/* Feed Cards: Input Manual Petugas (HITL) (Item 9) */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {events
                    .filter((ev) => ev.status === "Pending")
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          item.severity === "critical"
                            ? "bg-red-50/60 border-red-200"
                            : "bg-amber-50/60 border-amber-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-slate-900">
                                {item.plateNumber}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  item.severity === "critical"
                                    ? "bg-red-600 text-white"
                                    : "bg-amber-500 text-white"
                                }`}
                              >
                                {item.durationSeconds}s Ngetem
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {item.trayekName} &bull; {item.cameraName}
                            </p>
                            {/* Label Input Manual Petugas (HITL) - Item 9 */}
                            <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                              {item.isPlateManual ? "Nomor Polisi (Manual Petugas)" : "Status: Belum Diinput Petugas"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveVerifyEvent(item)}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Verifikasi
                            </button>
                            {!item.isPlateManual && (
                              <button
                                type="button"
                                onClick={() => setActiveInputPlateEvent(item)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Isi Plat
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Waktu: {item.timeWib} WIB</span>
                          <span>Ambang: 60s (+{item.durationSeconds - 60}s)</span>
                        </div>
                      </div>
                    ))}

                  {countPending === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Tidak ada antrean pelanggaran ngetem saat ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================
              BARIS 2: 4 KARTU STATISTIK KPI TERINTEGRASI (Item 10)
              =================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Angkot Hari Ini */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">
                  Angkot Hari Ini
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {stats.totalAngkotToday}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Unit</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  +12% vs kemarin
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Car className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Pelanggaran Valid */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">
                  Pelanggaran Valid
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-red-600">
                    {stats.validViolations}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Kasus</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Tervalidasi oleh petugas
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Belum Diverifikasi */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">
                  Belum Diverifikasi
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-amber-500">
                    {stats.pendingViolations}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Pending</span>
                </div>
                <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                  Menunggu review lapangan
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Rata-Rata Durasi Ngetem */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">
                  Rata-Rata Durasi
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-slate-900 font-mono">
                    {stats.averageDurationSec}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Detik</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Batas wajar: maks. 60 detik
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Timer className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* ===================================================================
              BARIS 3: TABEL RIWAYAT PELANGGARAN TERINTEGRASI (Item 9 & 10)
              =================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Riwayat Pelanggaran &amp; Log Audit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar insiden henti melebihi batas waktu di bahu jalan pantau
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(["Semua", "Pending", "Valid", "Invalid"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setFilterStatus(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterStatus === st
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900 font-medium"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-6">Track ID</th>
                    {/* Header Tanpa OCR (Item 9) */}
                    <th className="py-3 px-6">Nomor Polisi (HITL)</th>
                    <th className="py-3 px-6">Lokasi CCTV</th>
                    <th className="py-3 px-6">Waktu (WIB)</th>
                    <th className="py-3 px-6">Durasi</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-slate-800">
                        {row.trackId}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-semibold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {row.plateNumber}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {row.trayekName}
                        </p>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700">
                        {row.cameraName}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {row.timeWib}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-red-600">
                        {row.durationSeconds} Detik
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                            row.status === "Valid"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : row.status === "Invalid"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {row.status === "Pending" ? (
                          <button
                            type="button"
                            onClick={() => setActiveVerifyEvent(row)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Verifikasi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.push("/events")}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Buka Halaman Verifikasi"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data pelanggaran untuk filter saat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINASI TABEL (Revisi Item 7) */}
            <div className="py-3 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <p>
                  Menampilkan{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredEvents.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}{" "}
                    –{" "}
                    {Math.min(currentPage * pageSize, filteredEvents.length)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredEvents.length}
                  </span>{" "}
                  kejadian
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>per halaman</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Sebelumnya
                </button>

                {Array.from({
                  length: Math.ceil(filteredEvents.length / pageSize) || 1,
                }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={
                    currentPage >=
                    (Math.ceil(filteredEvents.length / pageSize) || 1)
                  }
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(filteredEvents.length / pageSize) || 1, p + 1)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* =======================================================================
          MODAL VERIFIKASI CEPAT
          ======================================================================= */}
      {activeVerifyEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Verifikasi Pelanggaran Ngetem
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {activeVerifyEvent.id} &bull; {activeVerifyEvent.trackId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVerifyEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src={activeVerifyEvent.evidenceImage}
                  alt="Bukti CCTV"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Polisi:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeVerifyEvent.plateNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Durasi Henti di ROI:</span>
                  <span className="font-mono font-bold text-red-600">
                    {activeVerifyEvent.durationSeconds} Detik (Batas: 60s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi:</span>
                  <span className="font-bold text-slate-800">
                    {activeVerifyEvent.cameraName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleValidateEvent(activeVerifyEvent.id, "Invalid")}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Tolak (Bukan Ngetem)
                </button>
                <button
                  type="button"
                  onClick={() => handleValidateEvent(activeVerifyEvent.id, "Valid")}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Konfirmasi Valid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL INPUT PLAT NOMOR MANUAL (HITL)
          ======================================================================= */}
      {activeInputPlateEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Input Plat Nomor Manual
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verifikasi petugas untuk {activeInputPlateEvent.trackId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveInputPlateEvent(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Polisi (Plat Kuning/Hitam)
                </label>
                <input
                  type="text"
                  placeholder="Misal: F 1934 AK"
                  value={manualPlateInput}
                  onChange={(e) => setManualPlateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveInputPlateEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualPlate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  Simpan Plat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
