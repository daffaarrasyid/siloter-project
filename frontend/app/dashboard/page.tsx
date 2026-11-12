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
  Bell,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  AlertOctagon,
  Timer,
  Volume2,
  Camera,
  MapPin,
  Check,
  X,
  Edit3,
  ChevronDown,
  Info,
  Sliders,
  ShieldCheck,
  Search,
  ExternalLink,
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
  severity: "critical" | "warning" | "info";
}

export default function DashboardPage() {
  const router = useRouter();

  // State Pilihan Kamera & Stream
  const [selectedCamera, setSelectedCamera] = useState<string>("empang");
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);
  const [showRoiZone, setShowRoiZone] = useState<boolean>(true);
  const [showDetections, setShowDetections] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<string>("YOLOv8");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Pending" | "Valid" | "Invalid">("Semua");

  // State Modal Verifikasi (Human-in-the-Loop) & Modal Input Plat Manual
  const [activeVerifyEvent, setActiveVerifyEvent] = useState<ViolationEventItem | null>(null);
  const [activeInputPlateEvent, setActiveInputPlateEvent] = useState<ViolationEventItem | null>(null);
  const [manualPlateInput, setManualPlateInput] = useState<string>("");

  // Daftar Event Pelanggaran (Sesuai Mockup Referensi & Patuh Aturan Single-Class AI)
  const [events, setEvents] = useState<ViolationEventItem[]>([
    {
      id: "ev-142",
      trackId: "TRK-142",
      plateNumber: "F 1934 AK",
      isPlateManual: true,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "Sukasari – Bubulak",
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
      trayekName: "Bantar Kemang – Merdeka",
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
      plateNumber: "[Belum Diisi]",
      isPlateManual: false,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "Baranangsiang – Bubulak",
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
      cameraName: "CCTV 02 • Jembatan Merah",
      trayekName: "Baranangsiang – Ciawi",
      trayekCode: "03",
      timeWib: "09:55:44",
      durationSeconds: 61,
      thresholdSeconds: 60,
      status: "Invalid",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "info",
    },
    {
      id: "ev-201",
      trackId: "TRK-201",
      plateNumber: "F 0887 HH",
      isPlateManual: true,
      cameraCode: "empang",
      cameraName: "CCTV 01 • Simpang BTM",
      trayekName: "Sukasari – Bubulak",
      trayekCode: "02",
      timeWib: "09:41:30",
      durationSeconds: 72,
      thresholdSeconds: 60,
      status: "Pending",
      evidenceImage: "/placeholder-angkot.jpg",
      severity: "warning",
    },
  ]);

  // Muat data dari localStorage atau backend
  useEffect(() => {
    const savedCam = localStorage.getItem("siloter_selected_camera") || "empang";
    setSelectedCamera(savedCam);

    // Ambil daftar event dari backend jika tersedia
    async function loadBackendEvents() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/events?limit=20`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Mapping data backend ke UI state
            const mapped: ViolationEventItem[] = data.map((item: any, idx: number) => ({
              id: item.id || `ev-${idx}`,
              trackId: item.vehicle_track_id || `TRK-${idx + 100}`,
              plateNumber: item.plate_number || `F ${1900 + idx} AK`,
              isPlateManual: true,
              cameraCode: item.camera_code || "empang",
              cameraName: item.camera_name || "CCTV 01 • Simpang BTM",
              trayekName: "02 Sukasari - Bubulak",
              trayekCode: "02",
              timeWib: item.detected_at ? new Date(item.detected_at).toLocaleTimeString("id-ID") : "10:40:00",
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
        console.warn("Backend events offline, using initial mockup records:", err);
      }
    }
    loadBackendEvents();
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
    toast.success(`Event ${eventId} berhasil diverifikasi sebagai: ${newStatus}`);
    setActiveVerifyEvent(null);
  };

  // Handler Simpan Plat Nomor Manual
  const handleSaveManualPlate = () => {
    if (!activeInputPlateEvent) return;
    const cleanPlate = manualPlateInput.trim().toUpperCase();
    if (!cleanPlate) {
      toast.error("Masukkan nomor plat kendaraan.");
      return;
    }

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === activeInputPlateEvent.id
          ? { ...ev, plateNumber: cleanPlate, isPlateManual: true }
          : ev
      )
    );
    toast.success(`Plat nomor ${cleanPlate} berhasil dicatat untuk ${activeInputPlateEvent.trackId}`);
    setActiveInputPlateEvent(null);
    setManualPlateInput("");
  };

  // Filter daftar event tabel
  const filteredEvents = events.filter((ev) => {
    if (filterStatus === "Semua") return true;
    return ev.status === filterStatus;
  });

  // Hitung metrik statistik
  const countPending = events.filter((e) => e.status === "Pending").length;
  const countValid = events.filter((e) => e.status === "Valid").length;

  const camerasList = [
    { code: "empang", label: "CCTV 01 • Simpang BTM (Bogor Trade Mall)", sub: "Bogor Selatan" },
    { code: "surken", label: "CCTV 02 • Suryakencana - Jembatan Merah", sub: "Bogor Tengah" },
    { code: "balaikota", label: "CCTV 03 • Depan Balaikota (VIP Corridor)", sub: "Bogor Tengah" },
  ];

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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs text-left"
              >
                <Video className="w-4 h-4" />
                <span>Pantau CCTV</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/events")}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  <span>Verifikasi</span>
                </div>
                {countPending > 0 && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {countPending}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding/step3")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left"
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
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Pengguna</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors text-left"
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
          AREA KONTEN UTAMA DASHBOARD (HEADER, LIVE STREAM, ALERTS, STATS, TABEL)
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* TOP APP BAR HEADER */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-6 py-3 flex items-center justify-between">
          {/* Kamera Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCameraDropdownOpen(!isCameraDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
            >
              <Video className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {camerasList.find((c) => c.code === selectedCamera)?.label ||
                  "CCTV 01 • Simpang BTM (Bogor Trade Mall)"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {isCameraDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                  PILIH TITIK SIMPANG KOTA BOGOR
                </div>
                {camerasList.map((cam) => (
                  <button
                    key={cam.code}
                    type="button"
                    onClick={() => {
                      setSelectedCamera(cam.code);
                      setIsCameraDropdownOpen(false);
                      toast.info(`Beralih ke stream ${cam.label}`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      selectedCamera === cam.code
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <p>{cam.label}</p>
                      <p className="text-[10px] text-slate-400">{cam.sub}</p>
                    </div>
                    {selectedCamera === cam.code && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Badges di Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>SIARAN LANGSUNG</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>HLS: Stabil</span>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium font-mono">
              CPU: 38%
            </div>

            {/* Amber Alert: Auto-Reconnect Fallback Pill (NFR-02) */}
            <div
              onClick={() => toast.warning("Kamera 02 sedang mencoba reconnect otomatis (NFR-02).")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>CAM-02 Jembatan Merah: Auto Reconnect...</span>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* ===================================================================
              BARIS 1: LIVE STREAM WINDOW (KIRI 7/12) & PERINGATAN BARU (KANAN 5/12)
              =================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI (7/12): Jendela Stream MJPEG Live beranotasi */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Jendela Frame CCTV + HUD */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md select-none">
                {/* Live Stream MJPEG Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`http://localhost:8000/api/stream/${selectedCamera}`}
                  alt="Live CCTV Feed"
                  className="w-full h-full object-cover opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Fallback frame pemandangan jalan raya Simpang Empang BTM */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 pointer-events-none -z-10 flex items-center justify-center">
                  <div className="text-slate-500 text-xs">Simulasi Frame CCTV Empang (1080p)</div>
                </div>

                {/* HUD Atas */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-black/80 text-white px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      REC 12:26:05 WIB
                    </span>
                    <span className="bg-black/75 text-slate-300 px-2 py-0.5 rounded backdrop-blur-xs">
                      SIMPANG BTM JUANDA
                    </span>
                  </div>
                  <span className="bg-black/80 text-slate-300 px-2 py-0.5 rounded backdrop-blur-xs">
                    FPS: 1.0 (BSW Fair-Use)
                  </span>
                </div>

                {/* HUD Banner Peringatan Tengah: Zona Pengawasan Ngetem */}
                {showRoiZone && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="bg-amber-500/90 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                      <AlertTriangle className="w-3 h-3 fill-slate-950 text-amber-500" />
                      <span>ZONA PENGAWASAN NGETEM (Maks. 60s)</span>
                    </div>
                  </div>
                )}

                {/* ===============================================================
                    BOUNDING BOX & ROI OVERLAY (PATUH SINGLE-CLASS AI, TANPA OCR)
                    =============================================================== */}
                {showDetections && (
                  <>
                    {/* Poligon Bahu Jalan Simpang Empang */}
                    <div className="absolute top-16 left-12 right-28 bottom-12 border-2 border-dashed border-blue-400/80 bg-blue-500/15 rounded-xl pointer-events-none" />

                    {/* Box 1 (Active Violation - Red Box): Angkot TRK-142 */}
                    <div className="absolute bottom-14 left-24 w-36 h-24 border-2 border-red-500 bg-red-500/20 rounded pointer-events-none flex flex-col justify-between p-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="bg-red-600 text-white text-[8px] font-black px-1 rounded uppercase tracking-wider animate-pulse">
                          PELANGGARAN #142
                        </span>
                        <span className="bg-black/80 text-red-300 text-[8px] font-mono px-1 rounded">
                          84s / 60s
                        </span>
                      </div>
                      <div className="bg-black/85 text-white p-1 rounded text-[7.5px] font-mono leading-tight space-y-0.5">
                        <div className="font-bold text-amber-300">Angkot TRK-142</div>
                        <div className="text-slate-300">Dwell: 84 detik (+24s)</div>
                      </div>
                    </div>

                    {/* Box 2 (Monitoring - Amber Box): #145 Berhenti 42s */}
                    <div className="absolute top-20 right-32 w-28 h-18 border-2 border-amber-400 bg-amber-400/10 rounded pointer-events-none flex flex-col justify-between p-1">
                      <span className="bg-amber-500 text-slate-950 text-[7.5px] font-bold px-1 rounded self-start">
                        #145 &bull; Berhenti 42s
                      </span>
                    </div>

                    {/* Box 3 (Moving - Cyan Box): #148 Moving */}
                    <div className="absolute bottom-20 right-20 w-24 h-16 border-2 border-cyan-400 bg-cyan-400/10 rounded pointer-events-none flex flex-col justify-between p-1">
                      <span className="bg-cyan-600 text-white text-[7.5px] font-bold px-1 rounded self-start">
                        #148 Moving
                      </span>
                    </div>
                  </>
                )}

                {/* Kontrol HUD Bawah Kamera */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toast.info("Stream diperbarui.")}
                      aria-label="Refresh stream"
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRoiZone(!showRoiZone)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-xs transition-all cursor-pointer ${
                        showRoiZone
                          ? "bg-blue-600 text-white"
                          : "bg-black/70 text-slate-300 hover:bg-black"
                      }`}
                    >
                      &bull; Zona
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDetections(!showDetections)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-xs transition-all cursor-pointer ${
                        showDetections
                          ? "bg-blue-600 text-white"
                          : "bg-black/70 text-slate-300 hover:bg-black"
                      }`}
                    >
                      &bull; Deteksi
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toast.info("Audio feed mute")}
                      aria-label="Mute audio"
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.success("Auto-Capture frame tersimpan.")}
                      aria-label="Ambil snapshot"
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-keterangan Lokasi Simpang */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Simpang BTM (Bogor Trade Mall) &bull; Arah Juanda &rarr; Balai Kota
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Traffic: HEAVY &bull; Alarms: 2 active
                </span>
              </div>

              {/* Banner Peringatan Reconnection State (NFR-02 Fault Isolation) */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      CCTV 02 &bull; Jembatan Merah - CAM-02-JEMRED
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Auto Reconnect - 00:12s &bull; HLS/RTSP Rekaman Uji Fallback Tersedia
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCamera("surken");
                    toast.info("Membuka stream fallback CCTV 02 (NFR-02).");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  Buka Rekaman
                </button>
              </div>
            </div>

            {/* KOLOM KANAN (5/12): PERINGATAN BARU (ALERTS FEED) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
              <div>
                {/* Header Widget Peringatan Baru */}
                <div className="flex items-start justify-between gap-2 mb-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Peringatan Baru</h2>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                        {countPending} Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ngetem &gt; 60s &bull; Target notif: &lt; 5 detik (NFR-03)
                    </p>
                  </div>
                  <Bell className="w-4 h-4 text-slate-400" />
                </div>

                {/* List Kartu Peringatan Terkini */}
                <div className="space-y-3">
                  {/* Kartu 1: Kritis (TRK-142) */}
                  <div className="p-3 rounded-xl bg-red-50/50 border border-red-200/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-red-600 text-white text-xs font-black flex items-center justify-center">
                          02
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            TRK-142 ({events[0].plateNumber})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                        KRITIS &bull; 84s
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pl-8">
                      <div>
                        <p className="font-semibold text-slate-800">Sukasari – Bubulak</p>
                        <p className="text-[10px] text-slate-400">Simpang BTM Juanda</p>
                        <p className="text-[10px] font-bold text-red-600 mt-0.5">
                          &Delta; Melampaui +24 detik
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          10:42:15 WIB &bull; CCTV 01
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveVerifyEvent(events[0])}
                          className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Verifikasi &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Kartu 2: Melanggar (TRK-145) */}
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                          10
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            TRK-145 ({events[1].plateNumber})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                        MELANGGAR &bull; 68s
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pl-8">
                      <div>
                        <p className="font-semibold text-slate-800">Bantar Kemang – Merdeka</p>
                        <p className="text-[10px] text-slate-400">Jembatan Merah</p>
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">
                          &Delta; Melampaui +8 detik
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          10:38:02 WIB &bull; CCTV 01
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveVerifyEvent(events[1])}
                          className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Verifikasi
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Kartu 3: Perlu Input Plat Manual (TRK-148) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-700 text-xs font-black flex items-center justify-center">
                          03
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            TRK-148 (Perlu Plat Manual)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">75s</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pl-8">
                      <div>
                        <p className="font-semibold text-slate-800">Baranangsiang – Bubulak</p>
                        <p className="text-[10px] text-slate-400">Simpang BTM</p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          Tersimpan &bull; Perlu Input Manual
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          10:31:18 WIB &bull; CCTV 01
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInputPlateEvent(events[2]);
                            setManualPlateInput("");
                          }}
                          className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Isi Plat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Widget Alerts */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Data tersinkron
                </span>
                <span className="font-mono">v2.4-onnx &bull; ByteTrack</span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              BARIS 2: 4 KARTU STATISTIK METRIK
              =================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metrik 1: Angkot Hari Ini */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  ANGKOT HARI INI
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">184</span>
                  <span className="text-xs text-slate-500 font-semibold">Unit Angkot</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-600 mt-1">
                  &Delta; +12% vs jam kemarin
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
            </div>

            {/* Metrik 2: Pelanggaran Valid */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  PELANGGARAN VALID
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-red-600">28</span>
                  <span className="text-xs text-slate-500 font-semibold">Kasus</span>
                </div>
                <p className="text-[11px] font-bold text-red-600 mt-1">
                  &bull; 15.2% rasio pelanggaran
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>

            {/* Metrik 3: Belum Diverifikasi */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  BELUM DIVERIFIKASI
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-amber-600">{countPending}</span>
                  <span className="text-xs text-slate-500 font-semibold">Pending</span>
                </div>
                <p className="text-[11px] font-bold text-amber-600 mt-1">
                  &bull; Termasuk 1 perlu input manual
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Metrik 4: Rata-Rata Durasi */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  RATA-RATA DURASI
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">92</span>
                  <span className="text-xs text-slate-500 font-semibold">Detik</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  &bull; Batas wajar: maks. 60s
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ===================================================================
              BARIS 3: TABEL RIWAYAT PELANGGARAN & VALIDASI
              =================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Header Tabel */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Riwayat Pelanggaran</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track ID &bull; Lokasi CCTV &bull; Waktu WIB &bull; Durasi &bull; Status &bull; Aksi
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(["Semua", "Pending", "Valid", "Invalid"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterStatus === tab
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Konten Tabel */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">TRACK ID</th>
                    <th className="py-3 px-4">PLAT / IDENTIFIKASI</th>
                    <th className="py-3 px-4">LOKASI CCTV</th>
                    <th className="py-3 px-4">WAKTU WIB</th>
                    <th className="py-3 px-4">DURASI</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((ev) => {
                    let badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                    if (ev.status === "Valid") {
                      badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (ev.status === "Invalid") {
                      badgeBg = "bg-slate-100 text-slate-600 border-slate-200";
                    }

                    return (
                      <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {ev.trackId}
                        </td>

                        <td className="py-3 px-4">
                          {ev.isPlateManual ? (
                            <div>
                              <p className="font-bold text-slate-800">{ev.plateNumber}</p>
                              <span className="text-[10px] text-slate-400">Catatan Petugas</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveInputPlateEvent(ev);
                                setManualPlateInput("");
                              }}
                              className="text-amber-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>[Input Manual]</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{ev.cameraName}</p>
                          <p className="text-[10px] text-slate-400">{ev.trayekName}</p>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          {ev.timeWib}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={
                              ev.durationSeconds > 80
                                ? "text-red-600"
                                : ev.durationSeconds > 60
                                ? "text-amber-600"
                                : "text-slate-700"
                            }
                          >
                            {ev.durationSeconds}s
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeBg}`}>
                            {ev.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveVerifyEvent(ev)}
                              title="Lihat Detail & Bukti"
                              aria-label="Lihat Detail dan Bukti"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {ev.status === "Pending" && (
                              <button
                                type="button"
                                onClick={() => setActiveVerifyEvent(ev)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                              >
                                Verifikasi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Tabel */}
            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Data otentik &bull; Sistem inferensi computer vision real-time &amp; verifikasi manual operator.
              </span>
              <span className="font-medium text-slate-500">
                184 terdeteksi &bull; 28 Valid &bull; {countPending} Pending
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODAL VERIFIKASI HUMAN-IN-THE-LOOP (HITL)
          ========================================================================= */}
      {activeVerifyEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Verifikasi Pelanggaran Ngetem
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVerifyEvent(null)}
                aria-label="Tutup modal"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Bukti Tangkapan Otomatis (.JPG) */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 mb-4 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-500 text-xs">
                Bukti Foto Auto-Capture (.JPG) &bull; {activeVerifyEvent.trackId}
              </div>
              <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                DURASI BERHENTI: {activeVerifyEvent.durationSeconds} DETIK
              </div>
            </div>

            {/* Rincian Event */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs mb-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Track ID</span>
                <span className="font-mono font-bold text-slate-900">{activeVerifyEvent.trackId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Plat Kendaraan</span>
                <span className="font-bold text-slate-900">{activeVerifyEvent.plateNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lokasi CCTV</span>
                <span className="font-semibold text-slate-800">{activeVerifyEvent.cameraName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trayek Terkait</span>
                <span className="text-slate-800">{activeVerifyEvent.trayekName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Waktu Terdeteksi</span>
                <span className="font-mono text-slate-700">{activeVerifyEvent.timeWib} WIB</span>
              </div>
            </div>

            {/* Tombol Keputusan Petugas Dishub */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleValidateEvent(activeVerifyEvent.id, "Invalid")}
                className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak (Bukan Ngetem)</span>
              </button>

              <button
                type="button"
                onClick={() => handleValidateEvent(activeVerifyEvent.id, "Valid")}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Valid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL INPUT PLAT NOMOR MANUAL (IDENTIFIKASI PETUGAS)
          ========================================================================= */}
      {activeInputPlateEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Input Plat Nomor Manual
              </h3>
              <button
                type="button"
                onClick={() => setActiveInputPlateEvent(null)}
                aria-label="Tutup modal plat"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Masukkan nomor polisi fisik kendaraan untuk <strong>{activeInputPlateEvent.trackId}</strong> berdasarkan inspeksi visual petugas.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Contoh: F 1934 AK"
                value={manualPlateInput}
                onChange={(e) => setManualPlateInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveInputPlateEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualPlate}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
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

