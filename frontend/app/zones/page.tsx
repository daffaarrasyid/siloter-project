"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  Layers,
  Save,
  RotateCcw,
  Undo2,
  Video,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Info,
  Edit3,
  Clock,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface NormalizedPoint {
  x: number; // 0.0 - 1.0
  y: number; // 0.0 - 1.0
}

interface CameraOption {
  code: string;
  name: string;
  dbName: string;
  sub: string;
  defaultThreshold: number;
}

const CAMERAS: CameraOption[] = [
  {
    code: "empang",
    name: "CCTV 01 • Simpang BTM",
    dbName: "Jl. Djuanda - Empang",
    sub: "Bogor Selatan",
    defaultThreshold: 60,
  },
  {
    code: "surken",
    name: "CCTV 02 • Suryakencana",
    dbName: "Jl. Djuanda - Suryakencana",
    sub: "Bogor Tengah",
    defaultThreshold: 60,
  },
  {
    code: "balaikota",
    name: "CCTV 03 • Balaikota",
    dbName: "Jl. Djuanda - Balaikota",
    sub: "Bogor Tengah",
    defaultThreshold: 60,
  },
];

export default function ZonesPage() {
  const router = useRouter();

  // Kamera aktif yang sedang diatur
  const [selectedCamera, setSelectedCamera] = useState<string>("empang");

  // Mode Gambar Poligon
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(false);

  // Titik poligon tersimpan (relatif 0.0 - 1.0)
  const [points, setPoints] = useState<NormalizedPoint[]>([]);

  // Posisi kursor realtime untuk garis panduan elastis (drag/hover guide)
  const [mousePos, setMousePos] = useState<NormalizedPoint | null>(null);

  // Ambang batas durasi ngetem (detik)
  const [thresholdSeconds, setThresholdSeconds] = useState<number>(60);

  // Status simpan ke API
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [streamKey, setStreamKey] = useState<number>(Date.now());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentCamera = CAMERAS.find((c) => c.code === selectedCamera) || CAMERAS[0];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 1. Load data konfigurasi kamera saat ini dari backend
  const loadCameraConfig = useCallback(async (camCode: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/cameras`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find((c: any) => c.camera_code === camCode);
          if (found) {
            if (found.threshold_seconds) {
              setThresholdSeconds(found.threshold_seconds);
            }
            if (found.roi_polygon && Array.isArray(found.roi_polygon) && found.roi_polygon.length >= 3) {
              const mapped: NormalizedPoint[] = found.roi_polygon.map((pt: number[]) => ({
                x: pt[0],
                y: pt[1],
              }));
              setPoints(mapped);
              setIsPolygonClosed(true);
              setIsDrawing(false);
            } else {
              // Default state: ZONA ROI KOSONG
              setPoints([]);
              setIsPolygonClosed(false);
              setIsDrawing(false);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Backend cameras API unreachable:", err);
    }
  }, [apiUrl]);

  useEffect(() => {
    setStreamError(false);
    loadCameraConfig(selectedCamera);
  }, [selectedCamera, loadCameraConfig]);

  // 2. Menghitung posisi koordinat normalisasi (0.0 - 1.0) dari event mouse
  const getNormalizedCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): NormalizedPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const normX = Math.max(0.0, Math.min(1.0, xPx / rect.width));
    const normY = Math.max(0.0, Math.min(1.0, yPx / rect.height));

    return { x: normX, y: normY };
  };

  // 3. Render Canvas Poligon & Garis Panduan Dinamis
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Bersihkan canvas
    ctx.clearRect(0, 0, w, h);

    if (points.length === 0 && !mousePos) return;

    // A. Gambar polygon yang sudah terbentuk
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * w, points[0].y * h);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * w, points[i].y * h);
      }

      if (isPolygonClosed) {
        ctx.closePath();
        // Fill poligon kuning transparan
        ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
        ctx.fill();
        // Garis tepi solid kuning tajam
        ctx.strokeStyle = "rgba(245, 158, 11, 1.0)";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();
      } else {
        // Garis penghubung titik terkunci
        ctx.strokeStyle = "rgba(59, 130, 246, 0.95)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.stroke();

        // B. Gambar garis elastis dinamis (guide line) ke kursor mouse saat ini
        if (mousePos && isDrawing) {
          const lastPoint = points[points.length - 1];
          ctx.beginPath();
          ctx.moveTo(lastPoint.x * w, lastPoint.y * h);
          ctx.lineTo(mousePos.x * w, mousePos.y * h);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]); // Garis putus-putus elastis
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // C. Gambar setiap titik simpul (node vertices)
      points.forEach((pt, idx) => {
        const px = pt.x * w;
        const py = pt.y * h;
        const isStartPoint = idx === 0;

        ctx.beginPath();
        ctx.arc(px, py, isStartPoint ? 8 : 6, 0, Math.PI * 2);

        if (isStartPoint) {
          // Titik 1: Aksen Biru Khusus
          ctx.fillStyle = "#2563eb";
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // Label "Titik 1 (Start)"
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText("T1 (Awal)", px + 10, py - 8);
        } else {
          // Titik berikutnya: Aksen Amber/Kuning
          ctx.fillStyle = "#f59e0b";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          ctx.font = "10px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(`T${idx + 1}`, px + 8, py - 6);
        }
      });

      // D. Indikator Magnetic Snap saat kursor dekat Titik 1 (untuk menutup poligon)
      if (isDrawing && !isPolygonClosed && points.length >= 3 && mousePos) {
        const startPt = points[0];
        const dist = Math.hypot(startPt.x - mousePos.x, startPt.y - mousePos.y);

        // Jika jarak < 0.04 normalisasi (~30px)
        if (dist < 0.04) {
          ctx.beginPath();
          ctx.arc(startPt.x * w, startPt.y * h, 14, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#10b981";
          ctx.fillText("Klik untuk Tutup Poligon", startPt.x * w + 16, startPt.y * h + 4);
        }
      }
    }
  }, [points, mousePos, isDrawing, isPolygonClosed]);

  // Jalankan render setiap ada perubahan titik atau mouse move
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Sinkronisasi resolusi internal canvas dengan ukuran tampilan CSS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = Math.round(entry.contentRect.width);
        canvas.height = Math.round(entry.contentRect.height);
        drawCanvas();
      }
    });
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [drawCanvas]);

  // 4. Handler Interaksi Klik Kanvas (Kunci Titik Demi Titik)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      if (isPolygonClosed) {
        toast.info("Poligon sudah terkunci. Klik 'Gambar Ulang Poligon' jika ingin mengubah.");
      }
      return;
    }

    const normPt = getNormalizedCoordinates(e);
    if (!normPt) return;

    // Kasus 1: Mengunci Titik Pertama
    if (points.length === 0) {
      setPoints([normPt]);
      toast.success("Titik 1 (Awal) terkunci! Gerakkan kursor lalu klik untuk mengunci titik ke-2.");
      return;
    }

    // Kasus 2: Menutup poligon jika klik mendekati Titik 1 dan titik >= 3
    const startPt = points[0];
    const dist = Math.hypot(startPt.x - normPt.x, startPt.y - normPt.y);
    if (points.length >= 3 && dist < 0.04) {
      setIsPolygonClosed(true);
      setIsDrawing(false);
      setMousePos(null);
      toast.success(`Poligon ROI berhasil ditutup sempurna dengan ${points.length} titik simpul!`);
      return;
    }

    // Kasus 3: Mengunci Titik Berikutnya (Titik 2, 3, dst)
    const nextIdx = points.length + 1;
    setPoints((prev) => [...prev, normPt]);
    toast.info(`Titik ${nextIdx} terkunci! Lanjutkan mengklik hingga kembali ke Titik 1.`);
  };

  // 5. Handler Mouse Move (Dynamic Elastic Line)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isPolygonClosed || points.length === 0) return;
    const normPt = getNormalizedCoordinates(e);
    if (normPt) {
      setMousePos(normPt);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // 6. Action: Mulai Gambar Poligon Baru
  const handleStartDrawing = () => {
    setPoints([]);
    setIsPolygonClosed(false);
    setIsDrawing(true);
    setMousePos(null);
    toast.info("Mode Gambar Aktif: Klik pada layar video untuk mengunci Titik 1.");
  };

  // 7. Action: Tutup Poligon Manual
  const handleClosePolygon = () => {
    if (points.length < 3) {
      toast.error("Poligon membutuhkan minimal 3 titik sudut.");
      return;
    }
    setIsPolygonClosed(true);
    setIsDrawing(false);
    setMousePos(null);
    toast.success(`Poligon ROI berhasil ditutup sempurna (${points.length} titik).`);
  };

  // 8. Action: Undo Titik Terakhir
  const handleUndoPoint = () => {
    if (points.length === 0) return;
    setPoints((prev) => prev.slice(0, -1));
    setIsPolygonClosed(false);
    setIsDrawing(true);
    toast.info("Titik terakhir dibatalkan.");
  };

  // 9. Action: Reset / Kosongkan Poligon (Sinkronisasi Langsung ke Backend)
  const handleResetPolygon = async () => {
    setPoints([]);
    setIsPolygonClosed(false);
    setIsDrawing(false);
    setMousePos(null);

    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/cameras/${selectedCamera}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roi_polygon: [],
          threshold_seconds: thresholdSeconds,
          is_configured: false,
        }),
      });

      if (res.ok) {
        setStreamKey(Date.now());
        toast.success(`Zona ROI untuk ${currentCamera.dbName} berhasil dihapus dari kamera! Box kuning telah dibersihkan.`);
      } else {
        toast.warning("Zona di layar dikosongkan, namun gagal memperbarui backend.");
      }
    } catch (err) {
      console.warn("Koneksi backend:", err);
      toast.info("Titik poligon di kanvas telah dikosongkan.");
    } finally {
      setIsSaving(false);
    }
  };

  // 9b. Action: Reset Semua Kamera Sekaligus ke Default (Kosong)
  const handleResetAllCameras = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/cameras/reset-all-rois`, {
        method: "POST",
      });

      if (res.ok) {
        setPoints([]);
        setIsPolygonClosed(false);
        setIsDrawing(false);
        setMousePos(null);
        setStreamKey(Date.now());
        toast.success("Seluruh 3 kamera CCTV telah berhasil direset ke zona default kosong (tanpa box).");
      } else {
        toast.error("Gagal melakukan reset seluruh kamera ke backend.");
      }
    } catch (err) {
      console.error("Gagal reset all cameras:", err);
      toast.error("Gagal terhubung ke backend untuk reset seluruh kamera.");
    } finally {
      setIsSaving(false);
    }
  };

  // 10. Action: Simpan Konfigurasi ROI ke Backend API (Hot-Reload)
  const handleSaveConfig = async () => {
    if (points.length > 0 && !isPolygonClosed) {
      toast.error("Poligon belum ditutup! Klik kembali ke Titik 1 atau tekan 'Tutup Poligon' sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    try {
      // Normalisasi koordinat menjadi array [[x, y], ...]
      const formattedRoi = isPolygonClosed && points.length >= 3
        ? points.map((p) => [Number(p.x.toFixed(4)), Number(p.y.toFixed(4))])
        : [];

      const payload = {
        roi_polygon: formattedRoi,
        threshold_seconds: thresholdSeconds,
        is_configured: formattedRoi.length >= 3,
      };

      const res = await fetch(`${apiUrl}/api/cameras/${selectedCamera}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStreamKey(Date.now());
        if (formattedRoi.length >= 3) {
          toast.success(`Zona ROI untuk ${currentCamera.dbName} berhasil disimpan dan aktif secara realtime!`);
        } else {
          toast.info(`Zona ROI untuk ${currentCamera.dbName} telah dinonaktifkan (kosong).`);
        }
      } else {
        toast.error("Gagal menyimpan konfigurasi ke backend.");
      }
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi ROI:", err);
      toast.error("Terjadi kesalahan koneksi ke backend.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f7fc] text-slate-800 font-sans overflow-hidden">
      {/* SIDEBAR MODULAR */}
      <Sidebar />

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Navbar />

        <main className="p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* HEADER HALAMAN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  Zona &amp; Durasi Pemantauan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Dishub Kota Bogor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Atur poligon Region of Interest (ROI) secara interaktif langsung pada live stream CCTV serta batas toleransi ngetem.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                Lihat di Dashboard
              </button>
            </div>
          </div>

          {/* TAB PEMILIH KAMERA CCTV */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
            {CAMERAS.map((cam) => {
              const isSelected = selectedCamera === cam.code;
              return (
                <button
                  key={cam.code}
                  type="button"
                  onClick={() => setSelectedCamera(cam.code)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <Video className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-600"}`} />
                  <span>{cam.name}</span>
                </button>
              );
            })}
          </div>

          {/* WORKSPACE AREA: KIRI (CANVAS INTERAKTIF) | KANAN (PANEL PENGATURAN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KOLOM KIRI (8/12): KANVAS VIDEO & POLIGON ROI */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col gap-3">
                {/* Header Kanvas: Status & Indikator Mode */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {currentCamera.dbName}
                    </span>
                    <span className="text-[10px] text-slate-400">• Sektor {currentCamera.sub}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDrawing && !isPolygonClosed && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold text-[10px] animate-pulse">
                        ● Mode Menggambar ({points.length} Titik Terkunci)
                      </span>
                    )}

                    {isPolygonClosed && points.length >= 3 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Zona Poligon Aktif ({points.length} Titik)
                      </span>
                    )}

                    {points.length === 0 && !isDrawing && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Belum Ada Zona ROI
                      </span>
                    )}
                  </div>
                </div>

                {/* AREA KANVAS GAMBAR (ASPECT RATIO 16:9) */}
                <div
                  ref={containerRef}
                  className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 select-none shadow-inner"
                >
                  {/* Layer 1: Background Live Stream Aktual */}
                  {!streamError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={streamKey}
                      src={`${apiUrl}/api/stream/${selectedCamera}?t=${streamKey}`}
                      alt="CCTV Stream Live"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      onError={() => setStreamError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Video className="w-8 h-8 text-slate-600 mb-2" />
                      <span>Stream Offline atau Fallback Video</span>
                    </div>
                  )}

                  {/* Layer 2: Interactive HTML5 Canvas */}
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={`absolute inset-0 w-full h-full z-10 ${
                      isDrawing ? "cursor-crosshair" : "cursor-default"
                    }`}
                  />

                  {/* Layer 3: HUD Petunjuk Layar */}
                  <div className="absolute top-3 left-3 z-20 pointer-events-none">
                    <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-md border border-slate-700/80 shadow-xs flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isDrawing ? "bg-red-500 animate-pulse" : isPolygonClosed ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {isDrawing
                        ? "Klik untuk kunci titik baru • Arahkan kembali ke Titik 1 untuk menutup poligon"
                        : isPolygonClosed
                        ? "Poligon Terkunci • Terapkan perubahan dengan tombol Simpan"
                        : "Klik tombol 'Buat Poligon Baru' di kanan untuk menggambar"}
                    </span>
                  </div>
                </div>

                {/* Toolbar Tombol Aksi Kanvas */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartDrawing}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{points.length > 0 ? "Gambar Ulang Poligon" : "Buat Poligon Baru"}</span>
                    </button>

                    {isDrawing && points.length >= 3 && !isPolygonClosed && (
                      <button
                        type="button"
                        onClick={handleClosePolygon}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tutup Poligon</span>
                      </button>
                    )}

                    {isDrawing && points.length > 0 && !isPolygonClosed && (
                      <button
                        type="button"
                        onClick={handleUndoPoint}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Batal Titik Terakhir</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleResetPolygon}
                      title="Kosongkan titik kanvas dan hapus zona ROI pada kamera ini"
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kosongkan / Hapus Zona</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {points.length} Node Simpul {isPolygonClosed ? "(Tertutup)" : "(Terbuka)"}
                  </span>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN (4/12): PANEL PENGATURAN DURASI & SIMPAN */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Card 1: Pengaturan Ambang Batas Waktu */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Ambang Batas Waktu Ngetem
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Toleransi Maksimal:</span>
                    <span className="text-2xl font-mono font-black text-red-600">
                      {thresholdSeconds} <span className="text-xs text-slate-400">Detik</span>
                    </span>
                  </div>

                  {/* Slider Durasi */}
                  <input
                    type="range"
                    min={30}
                    max={180}
                    step={5}
                    value={thresholdSeconds}
                    onChange={(e) => setThresholdSeconds(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>30s (Ketat)</span>
                    <span>60s (Standar BTM)</span>
                    <span>180s (Longgar)</span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Kendaraan yang berhenti di dalam zona poligon melebihi batas ini akan otomatis tercatat sebagai pelanggaran loitering dan bukti foto akan dikirim ke antrean verifikasi.
                  </p>
                </div>
              </div>

              {/* Card 2: Petunjuk Gambar Poligon */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900">
                    Panduan Membuat Poligon
                  </h3>
                </div>

                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>Klik <strong>Buat Poligon Baru</strong> untuk mengaktifkan mode gambar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>Klik titik awal di bahu jalan $\rightarrow$ Titik 1 akan terkunci.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Gerakkan mouse untuk melihat garis panduan elastis, lalu klik titik-titik sudut berikutnya.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">4.</span>
                    <span>Klik kembali tepat ke <strong>Titik 1</strong> untuk mengunci dan menutup poligon.</span>
                  </li>
                </ul>
              </div>

              {/* Tombol Simpan Konfigurasi & Reset */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isSaving || (isDrawing && !isPolygonClosed)}
                  onClick={handleSaveConfig}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Menyimpan ke Backend..." : "Simpan Konfigurasi Zona ROI"}</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleResetPolygon}
                  className="w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hapus / Kosongkan Zona Kamera Ini</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleResetAllCameras}
                  className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Reset Seluruh 3 CCTV ke Default (Kosong)</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Perubahan akan langsung aktif secara realtime tanpa perlu restart server.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
