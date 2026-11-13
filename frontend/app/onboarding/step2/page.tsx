"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Video,
  MapPin,
  Compass,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  Plus,
  Minus,
  Crosshair,
  Activity,
  Layers,
  Car,
  Clock,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

interface CameraItem {
  code: string;
  camera_id: string;
  location_title: string;
  location_subtitle: string;
  badge: string;
  badge_type: "danger" | "neutral" | "vip";
  coordinates_display: string;
  latitude: number;
  longitude: number;
  resolution: string;
  trayek_utama: string;
  density: string;
  density_color: string;
  fps: number;
  stream_protocol: string;
  rtsp_url: string;
  mjpeg_stream_url: string;
  avg_angkot_per_hour: number;
  avg_loitering_minutes: number;
  ai_quality_percent: number;
  status: string;
  detected_angkot_count: number;
}

const DEFAULT_CAMERAS: CameraItem[] = [
  {
    code: "empang",
    camera_id: "CCTV-01: Empang",
    location_title: "Simpang Empang - Bogor Selatan",
    location_subtitle: "Simpang BTM - Jl. R.E. Abdullah (Bogor Selatan)",
    badge: "RAWAN",
    badge_type: "danger",
    coordinates_display: `6°36'19.4"S 106°47'38.2"E`,
    latitude: -6.605389,
    longitude: 106.793944,
    resolution: "1920 x 1080",
    trayek_utama: "02, 03, 14",
    density: "Sangat Padat",
    density_color: "text-red-600",
    fps: 30.0,
    stream_protocol: "LIVE RTSP // 1080p",
    rtsp_url: "RTSP://10.24.11.101:554/live/empang-ptz",
    mjpeg_stream_url: "/api/stream/empang",
    avg_angkot_per_hour: 184,
    avg_loitering_minutes: 8.4,
    ai_quality_percent: 97.8,
    status: "Connected",
    detected_angkot_count: 14,
  },
  {
    code: "surken",
    camera_id: "CCTV-02: Surken",
    location_title: "Simpang Suryakencana - Bogor Tengah",
    location_subtitle: "Jl. Suryakencana Simpang Gang Aut (Bogor Tengah)",
    badge: "NORMAL",
    badge_type: "neutral",
    coordinates_display: `6°36'08.2"S 106°48'01.5"E`,
    latitude: -6.602278,
    longitude: 106.800417,
    resolution: "1920 x 1080",
    trayek_utama: "01, 02, 10",
    density: "Sedang",
    density_color: "text-blue-600",
    fps: 30.0,
    stream_protocol: "LIVE RTSP // 1080p",
    rtsp_url: "RTSP://10.24.11.102:554/live/surken-ptz",
    mjpeg_stream_url: "/api/stream/surken",
    avg_angkot_per_hour: 142,
    avg_loitering_minutes: 5.2,
    ai_quality_percent: 98.4,
    status: "Connected",
    detected_angkot_count: 9,
  },
  {
    code: "balaikota",
    camera_id: "CCTV-03: Balaikota",
    location_title: "Depan Balaikota - Bogor Tengah",
    location_subtitle: "Jl. Ir. H. Juanda - Depan Balaikota (Bogor Tengah)",
    badge: "KORIDOR VIP",
    badge_type: "vip",
    coordinates_display: `6°35'45.0"S 106°47'43.0"E`,
    latitude: -6.595833,
    longitude: 106.795278,
    resolution: "704 x 576",
    trayek_utama: "02, 03, 05, 08",
    density: "Lancar",
    density_color: "text-emerald-600",
    fps: 25.0,
    stream_protocol: "LIVE RTSP // 576p",
    rtsp_url: "RTSP://10.24.11.103:554/live/balaikota-ptz",
    mjpeg_stream_url: "/api/stream/balaikota",
    avg_angkot_per_hour: 96,
    avg_loitering_minutes: 3.1,
    ai_quality_percent: 99.1,
    status: "Connected",
    detected_angkot_count: 4,
  },
];

export default function OnboardingStep2Page() {
  const router = useRouter();

  const [cameras, setCameras] = useState<CameraItem[]>(DEFAULT_CAMERAS);
  const [selectedCode, setSelectedCode] = useState<string>("empang");
  const [logoError, setLogoError] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  // Ambil lokasi & pilihan dari backend
  useEffect(() => {
    async function loadLocations() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/cctv/locations`);
        if (res.ok) {
          const data = await res.json();
          if (data.locations && data.locations.length > 0) {
            setCameras(data.locations);
          }
          if (data.selected_camera) {
            setSelectedCode(data.selected_camera);
          }
        }
      } catch (err) {
        console.warn("Backend not reached for CCTV locations, using default metadata:", err);
      }
    }
    loadLocations();
  }, []);

  const selectedCam = cameras.find((c) => c.code === selectedCode) || cameras[0];

  // Handler Pilih Kamera
  const handleSelectCamera = async (code: string) => {
    setSelectedCode(code);
    setStreamError(false);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/onboarding/select-camera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camera_code: code }),
      });
      localStorage.setItem("siloter_selected_camera", code);
      toast.success(`Kamera ${code.toUpperCase()} aktif terpilih.`);
    } catch {
      localStorage.setItem("siloter_selected_camera", code);
    }
  };

  // Navigasi ke Step 3 (Penentuan Zona ROI)
  const handleNextStep = () => {
    localStorage.setItem("siloter_selected_camera", selectedCode);
    toast.success(`Titik ${selectedCam.camera_id} siap dikonfigurasi poligon ROI.`);
    router.push("/onboarding/step3");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f2f6fd] via-[#ecf2fc] to-[#e4eefb] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* =========================================================================
          HEADER ATAS: Logo & Stepper Progress (Tahap 1 s/d 5)
          ========================================================================= */}
      <header className="max-w-5xl w-full mx-auto flex flex-col items-center pt-2 pb-6">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6">
          {!logoError ? (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo SILOTER"
                width={32}
                height={32}
                className="object-contain"
                onError={() => setLogoError(true)}
                priority
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              S
            </div>
          )}
          <span className="text-2xl font-black tracking-tight text-slate-900">
            SILOTER
          </span>
        </div>

        {/* Stepper Wizard Progress Bar */}
        <nav aria-label="Progress Setup" className="w-full max-w-3xl overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[580px] px-4">
            {/* Step 1: Completed / Clickable Back */}
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Setup Awal
              </span>
            </button>

            <div className="flex-1 h-0.5 bg-blue-600 mx-3" />

            {/* Step 2: ACTIVE */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-blue-100">
                2
              </div>
              <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                Lokasi CCTV
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

            {/* Step 3 */}
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Zona ROI Ngetem
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

            {/* Step 4 */}
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold">
                4
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Threshold Durasi
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

            {/* Step 5 */}
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold">
                5
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Konfirmasi & Simpan
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* =========================================================================
          KONTEN UTAMA: Dua Kolom (Kiri: Peta GIS & Metrik; Kanan: Daftar CCTV)
          ========================================================================= */}
      <main className="max-w-5xl w-full mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-10 mb-6">
        {/* Header Judul Halaman */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pilih Titik Kamera CCTV
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Pilih salah satu kamera Dishub yang memantau titik simpul kemacetan angkot untuk dikonfigurasi pada tahap zona ROI.
          </p>
        </div>

        {/* Grid Dua Kolom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===================================================================
              KOLOM KIRI (7/12): Peta GIS Interaktif & Metrik Kinerja Titik
              =================================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Box Peta GIS Interaktif */}
            <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 bg-[#e8ecf4] shadow-xs select-none">
              {/* Gambar / Render Peta Bogor GIS */}
              <div className="absolute inset-0 bg-[#e6edf7] flex items-center justify-center overflow-hidden">
                {/* SVG Vektor Jalan & Area Kota Bogor */}
                <svg
                  viewBox="0 0 600 400"
                  className="w-full h-full object-cover opacity-85"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background Polygons (Area Hijau / Kebun Raya) */}
                  <rect width="600" height="400" fill="#e6edf7" />
                  <ellipse cx="300" cy="200" rx="90" ry="70" fill="#d9e6d5" opacity="0.8" />
                  <circle cx="280" cy="180" r="45" fill="#cde0c7" opacity="0.9" />

                  {/* Jalan Arteri (Jalur SSA / Juanda / Sudirman / Pajajaran) */}
                  <path
                    d="M 50 120 Q 200 160 300 200 T 550 280"
                    stroke="#ffffff"
                    strokeWidth="12"
                    fill="none"
                  />
                  <path
                    d="M 50 120 Q 200 160 300 200 T 550 280"
                    stroke="#ffd27d"
                    strokeWidth="6"
                    fill="none"
                  />
                  <path
                    d="M 300 40 L 300 360"
                    stroke="#ffffff"
                    strokeWidth="10"
                    fill="none"
                  />
                  <path
                    d="M 300 40 L 300 360"
                    stroke="#fbd58f"
                    strokeWidth="5"
                    fill="none"
                  />
                  <path
                    d="M 120 380 Q 250 280 320 200 Q 400 120 480 30"
                    stroke="#ffffff"
                    strokeWidth="8"
                    fill="none"
                  />
                  <path
                    d="M 120 380 Q 250 280 320 200 Q 400 120 480 30"
                    stroke="#fcdeb0"
                    strokeWidth="4"
                    fill="none"
                  />

                  {/* Label Teks Wilayah GIS */}
                  <text x="260" y="200" fill="#475569" fontSize="16" fontWeight="bold">
                    Bogor
                  </text>
                  <text x="360" y="140" fill="#94a3b8" fontSize="10">
                    Sentul Circuit
                  </text>
                  <text x="140" y="160" fill="#94a3b8" fontSize="10">
                    IPB University
                  </text>
                  <text x="350" y="270" fill="#94a3b8" fontSize="10">
                    Gunung Geulis
                  </text>
                </svg>
              </div>

              {/* Kontrol Peta (Zoom In, Zoom Out, Crosshair) */}
              <div className="absolute top-3 right-3 flex items-center bg-white/95 backdrop-blur-xs rounded-xl shadow-xs border border-slate-200/90 p-1 text-slate-700">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
                  aria-label="Perbesar peta"
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 1, 10))}
                  aria-label="Perkecil peta"
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                <button
                  type="button"
                  onClick={() => toast.info(`Lokasi GPS dipusatkan pada ${selectedCam.camera_id}`)}
                  aria-label="Pusatkan peta"
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pin CCTV 01: Empang */}
              <div
                onClick={() => handleSelectCamera("empang")}
                className={`absolute left-[38%] top-[60%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 ${
                  selectedCode === "empang" ? "scale-105" : "hover:scale-105 opacity-80"
                }`}
              >
                {selectedCode === "empang" ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce-short">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                      <span>CCTV-01 • Empang (Dipilih)</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white -mt-1">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Video className="w-2.5 h-2.5" />
                    </div>
                    <span>CCTV-01 • Empang</span>
                  </div>
                )}
              </div>

              {/* Pin CCTV 02: Surken */}
              <div
                onClick={() => handleSelectCamera("surken")}
                className={`absolute left-[58%] top-[68%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-10 ${
                  selectedCode === "surken" ? "scale-105" : "hover:scale-105 opacity-80"
                }`}
              >
                {selectedCode === "surken" ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                      <span>CCTV-02 • Surken (Dipilih)</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white -mt-1">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Video className="w-2.5 h-2.5" />
                    </div>
                    <span>CCTV-02 • Surken</span>
                  </div>
                )}
              </div>

              {/* Pin CCTV 03: Balaikota */}
              <div
                onClick={() => handleSelectCamera("balaikota")}
                className={`absolute left-[44%] top-[42%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-10 ${
                  selectedCode === "balaikota" ? "scale-105" : "hover:scale-105 opacity-80"
                }`}
              >
                {selectedCode === "balaikota" ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                      <span>CCTV-03 • Balaikota (Dipilih)</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white -mt-1">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Video className="w-2.5 h-2.5" />
                    </div>
                    <span>CCTV-03 • Balaikota</span>
                  </div>
                )}
              </div>
            </div>

            {/* Baris Informasi Bawah Peta: Kawasan Terpilih & Koordinat GIS */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 px-4 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Kawasan Terpilih
                  </p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedCam.location_title}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Koordinat GIS
                </p>
                <p className="text-xs font-mono font-semibold text-slate-700">
                  {selectedCam.coordinates_display}
                </p>
              </div>
            </div>

            {/* 3 Kartu Metrik Kinerja Titik CCTV (Revisi Valid Sesuai PRD & PDF Dokumen) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Metrik 1: Rerata Angkot/Jam */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Rerata Angkot/Jam
                  </p>
                  <p className="text-base md:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                    {selectedCam.avg_angkot_per_hour} Unit
                  </p>
                </div>
              </div>

              {/* Metrik 2: Rata Durasi Ngetem */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Rata Durasi Ngetem
                  </p>
                  <p className="text-base md:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                    {selectedCam.avg_loitering_minutes} Menit
                  </p>
                </div>
              </div>

              {/* Metrik 3: Kualitas Deteksi AI (%) */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Kualitas Deteksi AI
                  </p>
                  <p className="text-base md:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                    {selectedCam.ai_quality_percent}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================
              KOLOM KANAN (5/12): Card CCTV Terpilih & Card CCTV Lainnya
              =================================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* CARD CCTV TERPILIH (Expanded Preview) */}
            <div className="rounded-2xl border-2 border-blue-500 ring-2 ring-blue-100 bg-white p-4 shadow-xs flex flex-col gap-3 transition-all">
              {/* Header Card Terpilih */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 leading-tight">
                        {selectedCam.camera_id}
                      </h2>
                      <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {selectedCam.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">
                      {selectedCam.location_subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Jendela Preview Stream CCTV Live (Dengan HUD Video BTM) */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center select-none shadow-inner">
                {/* Tayangan Stream Aktual / Fallback Simulation */}
                {!streamError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`http://localhost:8000/api/stream/${selectedCam.code}`}
                    alt={`Live stream ${selectedCam.camera_id}`}
                    className="w-full h-full object-cover"
                    onError={() => setStreamError(true)}
                  />
                ) : (
                  /* High-Fidelity Fallback Traffic View dengan Anotasi Bounding Box AI */
                  <div className="relative w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-4">
                    {/* Gambar representasi jalan Simpang BTM */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Simulated Vehicle Bounding Boxes */}
                    <div className="absolute left-[30%] top-[45%] w-24 h-16 border-2 border-emerald-400 bg-emerald-500/10 rounded-xs flex flex-col justify-between p-0.5">
                      <span className="text-[8px] font-bold text-white bg-emerald-600 px-1 rounded-xs w-fit">
                        Angkot 02 | 98%
                      </span>
                    </div>
                    <div className="absolute right-[35%] top-[55%] w-28 h-18 border-2 border-amber-400 bg-amber-500/10 rounded-xs flex flex-col justify-between p-0.5">
                      <span className="text-[8px] font-bold text-white bg-amber-600 px-1 rounded-xs w-fit">
                        Angkot 14 | 00:45s
                      </span>
                    </div>

                    <div className="relative z-10 text-center text-slate-300">
                      <p className="text-xs font-semibold">Feed Simpang BTM Aktif</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Menampilkan 1 FPS Ingestion Model</p>
                    </div>
                  </div>
                )}

                {/* Overlay Top Bar (Live Status & FPS) */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                  <span className="bg-black/70 text-emerald-400 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {selectedCam.stream_protocol}
                  </span>
                  <span className="bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-xs font-bold">
                    FPS: {selectedCam.fps.toFixed(1)}
                  </span>
                </div>

                {/* Overlay Deteksi Angkot Tengah */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                  <span className="bg-black/60 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                    Deteksi: {selectedCam.detected_angkot_count} Angkot
                  </span>
                </div>

                {/* Overlay Bottom RTSP URL */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
                  <span className="bg-black/75 text-slate-300 px-2 py-0.5 rounded-md backdrop-blur-xs truncate max-w-[280px]">
                    {selectedCam.rtsp_url}
                  </span>
                </div>
              </div>

              {/* Metadata Specs Box (Resolusi, Trayek Utama, Kepadatan) */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-xl p-3 text-center border border-slate-100">
                <div>
                  <p className="text-[10px] font-medium text-slate-500">Resolusi</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedCam.resolution}</p>
                </div>
                <div className="border-x border-slate-200/80">
                  <p className="text-[10px] font-medium text-slate-500">FPS Stream</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">1.0 FPS (BSW)</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-500">Kepadatan</p>
                  <p className={`text-xs font-bold mt-0.5 ${selectedCam.density_color}`}>
                    {selectedCam.density}
                  </p>
                </div>
              </div>
            </div>

            {/* CARD CCTV LAINNYA (Collapsed List) */}
            <div className="flex flex-col gap-3">
              {cameras
                .filter((c) => c.code !== selectedCode)
                .map((cam) => (
                  <div
                    key={cam.code}
                    onClick={() => handleSelectCamera(cam.code)}
                    className="rounded-2xl border border-slate-200 hover:border-blue-300 bg-white p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col gap-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {cam.camera_id}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                cam.badge_type === "vip"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {cam.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-tight mt-0.5">
                            {cam.location_subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Stream Aktif
                        </span>
                        <span>FPS: {cam.fps}</span>
                        <span>{cam.resolution.includes("1920") ? "1080p FHD" : "576p SD"}</span>
                      </div>
                      <span className="font-bold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-1">
                        Pilih Kamera →
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOMBOL NAVIGASI BAWAH: Kembali & Lanjut ke Zona ROI
            ========================================================================= */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-xs"
          >
            <span>Lanjut: Tentukan Zona ROI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* =========================================================================
          FOOTER LEGAL & REGULASI
          ========================================================================= */}
      <footer className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 pt-2 pb-4">
        <div className="flex items-center gap-1.5 text-center sm:text-left">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Setiap parameter lokasi dapat diedit kembali sebelum deployment resmi ke CCTV Edge Box.</span>
        </div>
        <div className="flex items-center gap-2 font-medium text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer">Panduan Penempatan Kamera</span>
          <span>•</span>
          <span className="hover:text-slate-600 cursor-pointer">Regulasi Perda No. 3 Th 2021</span>
        </div>
      </footer>
    </div>
  );
}

