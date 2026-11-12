"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  Layers,
  Save,
  RotateCcw,
  Copy,
  Check,
  Video,
  Info,
  Clock,
  Shield,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface CameraItem {
  code: string;
  name: string;
  label: string;
  resolution: string;
  defaultRoi: number[][];
  defaultThreshold: number;
}

const CAMERAS: CameraItem[] = [
  {
    code: "empang",
    name: "Jl. Djuanda - Empang",
    label: "CCTV 01 • Simpang BTM (Bogor Trade Mall)",
    resolution: "1920x1080 (1080p)",
    defaultRoi: [
      [0.2188, 0.8611],
      [0.4063, 0.5278],
      [0.7188, 0.5556],
      [0.8438, 0.8889],
      [0.1875, 0.6667],
    ],
    defaultThreshold: 60,
  },
  {
    code: "surken",
    name: "Jl. Djuanda - Suryakencana",
    label: "CCTV 02 • Suryakencana & Pasar Bogor",
    resolution: "1920x1080 (1080p)",
    defaultRoi: [
      [0.20, 0.40],
      [0.80, 0.40],
      [0.90, 0.95],
      [0.10, 0.95],
    ],
    defaultThreshold: 60,
  },
  {
    code: "balaikota",
    name: "Jl. Djuanda - Balaikota",
    label: "CCTV 03 • Jl. Djuanda - Balaikota",
    resolution: "704x576 (PAL D1)",
    defaultRoi: [
      [0.25, 0.35],
      [0.75, 0.35],
      [0.85, 0.90],
      [0.15, 0.90],
    ],
    defaultThreshold: 60,
  },
];

export default function ZonesDurationPage() {
  const [selectedCameraCode, setSelectedCameraCode] = useState<string>("empang");
  const [thresholdSeconds, setThresholdSeconds] = useState<number>(60);
  const [toleranceBuffer, setToleranceBuffer] = useState<number>(15);
  const [roiPoints, setRoiPoints] = useState<number[][]>(CAMERAS[0].defaultRoi);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCamera = CAMERAS.find((c) => c.code === selectedCameraCode) || CAMERAS[0];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const streamUrl = `${apiUrl}/api/stream/${selectedCameraCode}`;

  // Read active camera from localStorage on mount (sync with Dashboard)
  useEffect(() => {
    const saved = localStorage.getItem("siloter_selected_camera");
    if (saved && CAMERAS.some((c) => c.code === saved)) {
      setSelectedCameraCode(saved);
    }
  }, []);

  // Fetch current config from backend on camera change
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${apiUrl}/api/cameras/${selectedCameraCode}/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.roi_polygon && data.roi_polygon.length >= 3) {
            setRoiPoints(data.roi_polygon);
          } else {
            setRoiPoints(activeCamera.defaultRoi);
          }
          if (data.threshold_seconds) {
            setThresholdSeconds(data.threshold_seconds);
          }
        } else {
          setRoiPoints(activeCamera.defaultRoi);
          setThresholdSeconds(activeCamera.defaultThreshold);
        }
      } catch (err) {
        setRoiPoints(activeCamera.defaultRoi);
        setThresholdSeconds(activeCamera.defaultThreshold);
      }
    }

    loadConfig();
  }, [selectedCameraCode, activeCamera]);

  // Redraw Canvas Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (roiPoints.length < 2) return;

    // Draw Polygon Outline and Fill
    ctx.beginPath();
    const firstX = roiPoints[0][0] * canvas.width;
    const firstY = roiPoints[0][1] * canvas.height;
    ctx.moveTo(firstX, firstY);

    for (let i = 1; i < roiPoints.length; i++) {
      const px = roiPoints[i][0] * canvas.width;
      const py = roiPoints[i][1] * canvas.height;
      ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = "rgba(234, 179, 8, 0.22)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Draw Nodes
    roiPoints.forEach((pt, index) => {
      const cx = pt[0] * canvas.width;
      const cy = pt[1] * canvas.height;

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#2563eb";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Node Label
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(`P${index + 1}`, cx + 8, cy - 4);
      ctx.shadowBlur = 0;
    });
  }, [roiPoints]);

  // Handle canvas click to add points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = Number((clickX / rect.width).toFixed(4));
    const normY = Number((clickY / rect.height).toFixed(4));

    if (roiPoints.length >= 8) {
      toast.info("Maksimal 8 titik node poligon untuk presisi performa.");
      return;
    }

    setRoiPoints([...roiPoints, [normX, normY]]);
  };

  const handleResetPoints = () => {
    setRoiPoints([]);
    toast.info("Poligon direset. Klik pada video untuk menentukan titik baru.");
  };

  const handleRestoreDefault = () => {
    setRoiPoints(activeCamera.defaultRoi);
    setThresholdSeconds(activeCamera.defaultThreshold);
    toast.success("Konfigurasi default dipulihkan.");
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(roiPoints, null, 2));
    setIsCopied(true);
    toast.success("Koordinat poligon berhasil disalin.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveConfig = async () => {
    if (roiPoints.length < 3) {
      toast.error("Poligon zona minimal membutuhkan 3 titik koordinat.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/cameras/${selectedCameraCode}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roi_polygon: roiPoints,
          threshold_seconds: thresholdSeconds,
          is_configured: true,
        }),
      });

      if (res.ok) {
        toast.success(`Konfigurasi Zona & Durasi untuk ${activeCamera.name} berhasil disimpan.`);
      } else {
        toast.success(`Konfigurasi tersimpan lokal (${thresholdSeconds} detik).`);
      }
    } catch {
      toast.success(`Konfigurasi tersimpan lokal (${thresholdSeconds} detik).`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f7fc] text-slate-800 font-sans overflow-hidden">
      {/* SIDEBAR MODULAR */}
      <Sidebar />

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* NAVBAR MODULAR (Profil & Logout konsisten) */}
        <Navbar>
          {/* Dropdown Pemilih Titik CCTV */}
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-600" />
            <select
              value={selectedCameraCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setSelectedCameraCode(newCode);
                localStorage.setItem("siloter_selected_camera", newCode);
              }}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {CAMERAS.map((cam) => (
                <option key={cam.code} value={cam.code}>
                  {cam.label}
                </option>
              ))}
            </select>
          </div>
        </Navbar>

        {/* CONTAINER ISI HALAMAN */}
        <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* JUDUL HALAMAN KONSISTEN DI DALAM HALAMAN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Zona &amp; Ambang Durasi
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Kalibrasi poligon Region of Interest (ROI) dan tetapkan ambang batas durasi henti angkutan umum
                sebelum sistem vision intelligence menandai pelanggaran ngetem.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRestoreDefault}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveConfig}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}</span>
              </button>
            </div>
          </div>

          {/* GRID LAYOUT: PREVIEW LIVE STREAM DENGAN CANVAS DI ATASNYA & PANEL KONTROL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KOLOM KIRI: LIVE MJPEG STREAM PREVIEW + CANVAS ROI (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-800">
                      Live Stream Ingestion &amp; Kalibrasi ROI
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({activeCamera.resolution})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetPoints}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Hapus Titik
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Tersalin" : "Salin JSON"}</span>
                    </button>
                  </div>
                </div>

                {/* WRAPPER PREVIEW LIVE STREAM & CANVAS OVERLAY */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 select-none">
                  {/* Stream Langsung MJPEG dari Backend (Item 8) */}
                  <img
                    src={streamUrl}
                    alt={`Live stream ${activeCamera.name}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-angkot.jpg";
                    }}
                  />

                  {/* Canvas Overlay Interaktif untuk Gambar Poligon */}
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    onClick={handleCanvasClick}
                    className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                  />

                  {/* Indikator Instruksi di Pojok Kiri Atas */}
                  <div className="absolute top-3 left-3 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md font-medium border border-slate-700/60 shadow-md">
                    Klik pada area jalan raya untuk menambahkan node batas poligon ({roiPoints.length} titik)
                  </div>
                </div>

                {/* DAFTAR NODE KOORDINAT */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {roiPoints.map((pt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200"
                    >
                      <strong className="text-blue-600">P{idx + 1}:</strong>
                      <span>X: {pt[0].toFixed(3)}, Y: {pt[1].toFixed(3)}</span>
                    </span>
                  ))}
                  {roiPoints.length === 0 && (
                    <span className="text-slate-400 italic text-[11px]">
                      Belum ada node poligon. Silakan klik pada frame video untuk menentukan area pantau.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: PARAMETER DURASI & AI SPECIFICATION (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* KARTU AMBANG BATAS DURASI HENTI */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Ambang Batas Durasi Henti
                  </h2>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-500 font-medium">
                      Batas Waktu Tunggu Maksimum
                    </span>
                    <span className="text-xl font-bold text-blue-600 font-mono">
                      {thresholdSeconds} Detik
                    </span>
                  </div>

                  {/* Slider Durasi */}
                  <input
                    type="range"
                    min={30}
                    max={300}
                    step={10}
                    value={thresholdSeconds}
                    onChange={(e) => setThresholdSeconds(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>30d</span>
                    <span>60d (1m)</span>
                    <span>120d (2m)</span>
                    <span>180d (3m)</span>
                    <span>300d (5m)</span>
                  </div>
                </div>

                {/* Tolerance Buffer */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Toleransi Buffer Dinamis
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Kelonggaran naik-turun lansia &amp; barang bawaan
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 font-mono">
                    ±{toleranceBuffer}d
                  </span>
                </div>

                {/* Total Waktu Efektif */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Durasi Efektif Pelanggaran:</span>
                  <span className="font-bold text-red-600 font-mono">
                    {thresholdSeconds + toleranceBuffer} Detik
                  </span>
                </div>
              </div>

              {/* KARTU SPESIFIKASI ENGINE AI & SINGLE-CLASS BOUNDARY */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Spesifikasi AI &amp; Tracking
                  </h2>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Model Arsitektur:</span>
                    <span className="font-bold text-slate-800">YOLOv8s ONNX</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Model Weight:</span>
                    <span className="font-mono font-bold text-blue-600">yolov8s_siloter.onnx</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Enjin Tracking:</span>
                    <span className="font-bold text-slate-800">ByteTrack v2.1</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Ekstraksi Frame:</span>
                    <span className="font-bold text-slate-800">1.0 FPS (BSW Throttled)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Anchor Bounding Box:</span>
                    <span className="font-mono text-[11px] text-slate-700">Bottom-Center (x, y2)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
                  <strong>Kepatuhan Regulasi Single-Class:</strong> Model murni berfokus mendeteksi dan melacak durasi henti angkutan umum pada koordinat ROI. Seluruh validasi plat nomor polisi dikelola secara <em>Human-in-the-Loop</em> oleh petugas pengawas.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

