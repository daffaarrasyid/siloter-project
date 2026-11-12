"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Square,
  Pentagon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Copy,
  Info,
  Car,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Point {
  x: number; // pixel in canvas
  y: number;
}

interface TrackedVehicle {
  trackId: string;
  duration: number; // seconds
  status: "normal" | "warning" | "violation";
  speed: string;
}

export default function OnboardingStep3Page() {
  const router = useRouter();

  // Mode alat: polygon atau rectangle
  const [drawMode, setDrawMode] = useState<"polygon" | "box">("polygon");
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<string>("YOLOv8");
  const [selectedCameraCode, setSelectedCameraCode] = useState<string>("empang");
  const [logoError, setLogoError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Canvas ref & Titik Poligon ROI (dalam piksel canvas 640x360)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Titik poligon default (5 node membentuk zona bahu jalan Empang BTM)
  const [points, setPoints] = useState<Point[]>([
    { x: 140, y: 310 },
    { x: 260, y: 190 },
    { x: 460, y: 200 },
    { x: 540, y: 320 },
    { x: 120, y: 240 },
  ]);

  // Status poligon selesai / tertutup
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(true);

  // Daftar Track ID Aktif (Pengganti Sesuai Aturan Revisi Dokumen UI SILOTER Bagian 2.C)
  const [activeTracks, setActiveTracks] = useState<TrackedVehicle[]>([
    { trackId: "Angkot #04", duration: 105, status: "violation", speed: "0.2 km/h" },
    { trackId: "Angkot #02", duration: 45, status: "warning", speed: "0.8 km/h" },
    { trackId: "Angkot #14", duration: 18, status: "normal", speed: "1.2 km/h" },
  ]);

  // Dimensi virtual canvas
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 360;

  // Baca pilihan kamera dari step sebelumnya
  useEffect(() => {
    const savedCam = localStorage.getItem("siloter_selected_camera") || "empang";
    setSelectedCameraCode(savedCam);

    // Ambil model aktif dari backend
    async function fetchModelStatus() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/model/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.active_display_name) {
            setActiveModel(data.active_display_name);
          }
        }
      } catch (err) {
        console.warn("Backend model status unreachable, using standard YOLOv8s:", err);
      }
    }
    fetchModelStatus();
  }, []);

  // Gambar Poligon & Overlay pada HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Bersihkan canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Jika belum ada titik sama sekali, biarkan transparan untuk menampilkan empty state
    if (points.length === 0) return;

    // 1. Gambar Area Poligon Semi-Transparan
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (isPolygonClosed && points.length >= 3) {
      ctx.closePath();
      // Warna biru transparan (glow zona ROI)
      ctx.fillStyle = "rgba(37, 99, 235, 0.22)";
      ctx.fill();
    }

    // Garis tepi poligon
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 2. Gambar Node Titik (Handles)
    points.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1d4ed8";
      ctx.stroke();

      // Label Node P1, P2, ...
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "bold 10px Poppins, sans-serif";
      ctx.fillText(`P${idx + 1}`, pt.x + 8, pt.y - 8);
    });

    // 3. Label Zona di Tengah Poligon
    if (points.length >= 3 && isPolygonClosed) {
      const centerX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
      const centerY = points.reduce((acc, p) => acc + p.y, 0) / points.length;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(centerX - 80, centerY - 14, 160, 28, 6);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ROI_ZONA_NGETEM_01", centerX, centerY - 1);
      ctx.fillStyle = "#93c5fd";
      ctx.font = "9px Poppins, sans-serif";
      ctx.fillText("Area Kalkulasi: 42.5 m² • 5 Sudut", centerX, centerY + 10);
      ctx.textAlign = "left"; // Reset
    }
  }, [points, isPolygonClosed]);

  // Klik Canvas untuk menambah titik (jika mode gambar)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (points.length >= 8) {
      toast.warning("Maksimal 8 titik koordinat untuk efisiensi poligon.");
      return;
    }

    const newPts = [...points, { x, y }];
    setPoints(newPts);
    if (newPts.length >= 3) {
      setIsPolygonClosed(true);
    }
  };

  // Reset Poligon
  const handleReset = () => {
    setPoints([]);
    setIsPolygonClosed(false);
    toast.info("Poligon ROI dikosongkan. Klik pada layar kamera untuk mulai menggambar titik baru.");
  };

  // Buat Kotak Presisi Standar
  const handleBoxMode = () => {
    setDrawMode("box");
    setPoints([
      { x: 160, y: 180 },
      { x: 480, y: 180 },
      { x: 480, y: 320 },
      { x: 160, y: 320 },
    ]);
    setIsPolygonClosed(true);
    toast.success("Bentuk kotak presisi diterapkan.");
  };

  // Salin JSON Koordinat
  const handleCopyJSON = () => {
    const normalized = points.map((p) => [
      parseFloat((p.x / CANVAS_WIDTH).toFixed(4)),
      parseFloat((p.y / CANVAS_HEIGHT).toFixed(4)),
    ]);
    navigator.clipboard.writeText(JSON.stringify(normalized, null, 2));
    toast.success("Koordinat poligon ternormalisasi disalin ke clipboard!");
  };

  // Simpan Zona & Atur Durasi (Navigasi ke Step 4)
  const handleSaveAndNext = async () => {
    if (points.length < 3) {
      toast.error("Poligon ROI minimal harus memiliki 3 titik sudut.");
      return;
    }

    setIsSaving(true);
    // Normalisasi koordinat ke skala [0.0 - 1.0] sesuai ARSITEKTUR.md Bagian 8
    const normalizedRoi = points.map((p) => [
      parseFloat((p.x / CANVAS_WIDTH).toFixed(4)),
      parseFloat((p.y / CANVAS_HEIGHT).toFixed(4)),
    ]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/cameras/${selectedCameraCode}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roi_polygon: normalizedRoi,
          threshold_seconds: 60,
          is_configured: true,
        }),
      });

      if (res.ok) {
        toast.success(`Poligon ROI untuk kamera ${selectedCameraCode.toUpperCase()} berhasil disimpan!`);
      }
      localStorage.setItem("siloter_active_roi", JSON.stringify(normalizedRoi));
      setTimeout(() => {
        router.push("/onboarding/step4");
      }, 700);
    } catch (err) {
      console.warn("Gagal menghubungi backend, menyimpan ke cache lokal:", err);
      localStorage.setItem("siloter_active_roi", JSON.stringify(normalizedRoi));
      toast.success("Poligon ROI tersimpan ke cache lokal.");
      setTimeout(() => {
        router.push("/onboarding/step4");
      }, 700);
    } finally {
      setIsSaving(false);
    }
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
            {/* Step 1: Completed */}
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

            {/* Step 2: Completed */}
            <button
              type="button"
              onClick={() => router.push("/onboarding/step2")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Lokasi CCTV
              </span>
            </button>

            <div className="flex-1 h-0.5 bg-blue-600 mx-3" />

            {/* Step 3: ACTIVE */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-blue-100">
                3
              </div>
              <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
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
          KONTEN UTAMA: Dua Kolom (Kiri: Canvas Poligon; Kanan: Analisis & Tracking)
          ========================================================================= */}
      <main className="max-w-5xl w-full mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-10 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===================================================================
              KOLOM KIRI (7/12): Penentuan Zona Pantau (ROI) & Canvas Interaktif
              =================================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Penentuan Zona Pantau (ROI)
              </h1>
            </div>

            {/* Toolbar Tombol Penggambar ROI */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawMode("polygon")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    drawMode === "polygon"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Pentagon className="w-3.5 h-3.5" />
                  <span>Poligon ROI</span>
                </button>

                <button
                  type="button"
                  onClick={handleBoxMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    drawMode === "box"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Kotak Presisi</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1.5 transition-colors border border-red-200/60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Tombol Zoom & Fullscreen */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-slate-600">
                <button
                  type="button"
                  onClick={() => toast.info("Zoom In area frame")}
                  aria-label="Perbesar area"
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Zoom Out area frame")}
                  aria-label="Perkecil area"
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Mode layar penuh")}
                  aria-label="Layar penuh"
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Jendela Frame CCTV + Layer Canvas HTML5 Interaktif */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner select-none">
              {/* Gambar Background Frame Lalu Lintas Simpang Empang BTM */}
              <div className="absolute inset-0 bg-[#0f172a] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${apiUrl}/api/stream/${selectedCameraCode}`}
                  alt="Feed CCTV Empang BTM"
                  className="w-full h-full object-cover opacity-90"
                  onError={(e) => {
                    // Fallback ke gambar statis lokal jika feed offline
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Simulasi Latar Belakang Jalan Raya Empang BTM jika stream terputus */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900 pointer-events-none -z-10 flex items-center justify-center">
                  <div className="text-slate-500 text-xs">Simulasi Frame CCTV Empang (1080p)</div>
                </div>
              </div>

              {/* Layer Canvas untuk Menggambar Poligon ROI */}
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              />

              {/* Overlay Informasi CCTV Atas */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none z-20">
                <span className="bg-black/75 text-white px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  REC [CCTV-EMPANG-04-WEST]
                </span>
                <span className="bg-black/75 text-slate-300 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  RTSP://10.12.44.82/live/h264
                </span>
              </div>

              {/* Overlay Informasi Resolusi & FOV Bawah */}
              <div className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-slate-300 bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-xs pointer-events-none z-20">
                1080 x 675 px • FOV: 84°
              </div>

              {/* EMPTY STATE WAJIB (Sesuai Aturan Revisi Dokumen UI Bagian 2.C) */}
              {points.length === 0 && (
                <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400 text-blue-300 flex items-center justify-center mb-3">
                    <Pentagon className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-white max-w-xs leading-relaxed">
                    Gambar area poligon ROI pada kamera untuk melihat data analisis zona
                  </p>
                  <p className="text-xs text-slate-300 mt-1.5">
                    Klik 3 sampai 8 titik pada bahu jalan yang rawan ngetem.
                  </p>
                </div>
              )}
            </div>

            {/* Panel Saklar Simulasi Bounding Box Angkot */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      Simulasi Deteksi Objek Angkot
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                      ACTIVE {activeModel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menampilkan bounding-box kendaraan angkot fisik dan pelacakan ByteTrack real-time.
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showBoundingBox}
                  onChange={(e) => setShowBoundingBox(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>

          {/* ===================================================================
              KOLOM KANAN (5/12): Informasi Zona ROI & Daftar Track ID Aktif
              =================================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Layers className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold">Informasi Zona Pantau (ROI)</h2>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            </div>

            {/* Banner Area Siap Dianalisis */}
            <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-900">Area Siap Dianalisis</p>
                <p className="text-xs text-blue-700/80 leading-relaxed mt-0.5">
                  Poligon telah tertutup sempurna & mencakup bahu jalan utama Simpang Empang.
                </p>
              </div>
            </div>

            {/* 2 Metrik Luas & Rasio Perspektif */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Luas Efektif
                </p>
                <p className="text-xl font-extrabold text-blue-700 mt-0.5">42.5 m²</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Kapasitas: ~3 Angkot</p>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Rasio Perspektif
                </p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">1:1.42</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Koreksi Homografi OK</p>
              </div>
            </div>

            {/* Daftar Titik Koordinat (Node Handles) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Daftar Titik Koordinat ({points.length} Node)
                </span>
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Salin JSON</span>
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {points.map((pt, idx) => {
                  const labelMap = [
                    "Kiri Bawah",
                    "Kiri Atas",
                    "Kanan Atas",
                    "Kanan Bawah",
                    "Sisi Tengah",
                    "Sudut Tambahan",
                    "Sudut Luar",
                    "Sudut Akhir",
                  ];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">
                          P{idx + 1} ({labelMap[idx] || "Node"})
                        </span>
                      </div>
                      <span className="font-mono text-slate-500">
                        X: {pt.x}, Y: {pt.y}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informasi Enjin Tracking ByteTrack */}
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Enjin Tracking AI
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  ByteTRACK v2.1
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Angkot Ngetem Tracker (1 FPS Mode)
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Mendeteksi kelambatan & micro-movement di dalam batas poligon ROI ini untuk menghitung akumulasi durasi ngetem dengan toleransi oklusi 5 detik.
              </p>
            </div>

            {/* ===================================================================
                REVISI WAJIB (PENGGANTI TRAYEK SASARAN TERDETEKSI):
                Daftar Track ID Aktif & Status Durasi Diam Real-Time
                (Sesuai Dokumen Revisi UI SILOTER Bagian 2.C)
                =================================================================== */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  DAFTAR TRACK ID AKTIF (DI DALAM ROI):
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Real-time</span>
              </div>

              <div className="space-y-2">
                {activeTracks.map((trk, i) => {
                  let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  let dotBg = "bg-emerald-500";
                  let statusText = "Normal (<30s)";

                  if (trk.status === "warning") {
                    badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                    dotBg = "bg-amber-500";
                    statusText = "Peringatan (30–60s)";
                  } else if (trk.status === "violation") {
                    badgeBg = "bg-red-50 text-red-700 border-red-200";
                    dotBg = "bg-red-500 animate-pulse";
                    statusText = "Pelanggaran (>90s)";
                  }

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotBg}`} />
                        <span className="font-bold text-slate-900">{trk.trackId}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({trk.speed})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">
                          {Math.floor(trk.duration / 60)}m {trk.duration % 60}s
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOMBOL NAVIGASI BAWAH: Kembali & Simpan Zona & Atur Durasi
            ========================================================================= */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/onboarding/step2")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndNext}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-xs disabled:opacity-70"
          >
            <span>Simpan Zona & Atur Durasi</span>
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

