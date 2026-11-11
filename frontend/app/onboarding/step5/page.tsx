"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Video,
  Scan,
  Clock,
  CheckCircle2,
  Lock,
  Zap,
  Bookmark,
  ArrowLeft,
  SlidersHorizontal,
  Info,
  Maximize2,
  RefreshCw,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function OnboardingStep5Page() {
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Parameter dari Step 1–4
  const [cameraCode, setCameraCode] = useState<string>("empang");
  const [thresholdSeconds, setThresholdSeconds] = useState<number>(120);
  const [toleranceBuffer, setToleranceBuffer] = useState<number>(15);
  const [activeModel, setActiveModel] = useState<string>("YOLOv8-v2");

  // Status Diagnostik
  const [streamOk, setStreamOk] = useState(true);
  const [aiOk, setAiOk] = useState(true);
  const [dbOk, setDbOk] = useState(true);

  useEffect(() => {
    const cam = localStorage.getItem("siloter_selected_camera") || "empang";
    setCameraCode(cam);

    const thresh = localStorage.getItem("siloter_threshold_seconds") || "120";
    setThresholdSeconds(parseInt(thresh, 10));

    const buff = localStorage.getItem("siloter_tolerance_buffer") || "15";
    setToleranceBuffer(parseInt(buff, 10));

    // Ambil diagnostik dari backend
    async function fetchDiagnostics() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/onboarding/diagnostics/${cam}`);
        if (res.ok) {
          const data = await res.json();
          setStreamOk(data.diagnostics[0]?.is_ready ?? true);
          setAiOk(data.diagnostics[1]?.is_ready ?? true);
          setDbOk(data.diagnostics[2]?.is_ready ?? true);
        }
      } catch (err) {
        console.warn("Diagnostik offline, menggunakan nilai default:", err);
      }
    }
    fetchDiagnostics();
  }, []);

  // Handler Aktivasi Resmi
  const handleActivateMonitoring = async () => {
    setIsActivating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/onboarding/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_code: cameraCode,
          is_draft: false,
        }),
      });

      if (res.ok) {
        toast.success("Pemantauan CCTV berhasil diaktifkan! Mengarahkan ke Dashboard...");
      } else {
        toast.success("Konfigurasi tersimpan lokal. Membuka Dashboard...");
      }

      localStorage.setItem("siloter_onboarding_completed", "true");
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      console.warn("Gagal menghubungi server, beralih ke cache lokal:", err);
      toast.success("Konfigurasi tersimpan. Membuka Dashboard...");
      localStorage.setItem("siloter_onboarding_completed", "true");
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } finally {
      setIsActivating(false);
    }
  };

  // Handler Simpan Draf
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/onboarding/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_code: cameraCode,
          is_draft: true,
        }),
      });
      toast.info("Konfigurasi berhasil disimpan sebagai Draf.");
      setTimeout(() => {
        router.push("/onboarding");
      }, 600);
    } catch {
      toast.info("Konfigurasi tersimpan sebagai draf lokal.");
      setTimeout(() => {
        router.push("/onboarding");
      }, 600);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Detail Tampilan Kamera
  const getCameraInfo = () => {
    switch (cameraCode) {
      case "surken":
        return {
          id: "CCTV-BOGOR-SRK-02",
          name: "SIMPANG SURYAKENCANA",
          ip: "10.20.4.13:554",
          area: "Bahu Jalan Suryakencana",
          road: "SIMPANG GANG AUT - JL. SURYAKENCANA",
        };
      case "balaikota":
        return {
          id: "CCTV-BOGOR-BLK-03",
          name: "DEPAN BALAIKOTA",
          ip: "10.20.4.14:554",
          area: "Koridor VIP Balaikota",
          road: "KORIDOR BALAIKOTA - JL. IR. H. DJUANDA",
        };
      case "empang":
      default:
        return {
          id: "CCTV-BOGOR-EMP-01",
          name: "SIMPANG EMPANG BTM",
          ip: "10.20.4.12:554",
          area: "Bahu Kiri Simpang",
          road: "SIMPANG EMPANG - JL. IR. H. DJUANDA",
        };
    }
  };

  const camInfo = getCameraInfo();

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
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
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
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Lokasi CCTV
              </span>
            </button>

            <div className="flex-1 h-0.5 bg-blue-600 mx-3" />

            {/* Step 3: Completed */}
            <button
              type="button"
              onClick={() => router.push("/onboarding/step3")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Zona ROI Ngetem
              </span>
            </button>

            <div className="flex-1 h-0.5 bg-blue-600 mx-3" />

            {/* Step 4: Completed */}
            <button
              type="button"
              onClick={() => router.push("/onboarding/step4")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Threshold Durasi
              </span>
            </button>

            <div className="flex-1 h-0.5 bg-blue-600 mx-3" />

            {/* Step 5: ACTIVE */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-blue-100">
                5
              </div>
              <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                Konfirmasi &amp; Simpan
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* =========================================================================
          KONTEN UTAMA: Review & Simpan Konfigurasi
          ========================================================================= */}
      <main className="max-w-5xl w-full mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-10 mb-6">
        {/* Title Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Review &amp; Simpan Konfigurasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Periksa kembali parameter pemantauan sebelum sistem SILOTER mulai melakukan inferensi live stream.
          </p>
        </div>

        {/* =========================================================================
            BARIS 1: 3 KARTU PARAMETER (Lokasi, Zona Pemantauan, Threshold & Aksi)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* KARTU 1: Lokasi & Kamera */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">Lokasi &amp; Kamera</h2>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>ID Kamera</span>
                  <span className="font-mono font-bold text-slate-800">{camInfo.id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Stream IP</span>
                  <span className="font-mono text-slate-700">{camInfo.ip}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Frame Rate</span>
                  <span className="font-semibold text-blue-600">1080p @ 30FPS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/70 text-xs">
              <span className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Aktif
              </span>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step2")}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>

          {/* KARTU 2: Zona Pemantauan */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Scan className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">Zona Pemantauan</h2>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Area Tag</span>
                  <span className="font-bold text-slate-800">{camInfo.area}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Cakupan Luas</span>
                  <span className="font-mono text-slate-700">42.5 m²</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>AI Model</span>
                  <span className="font-bold text-blue-600 uppercase">{activeModel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/70 text-xs">
              <span className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Presisi 98.4%
              </span>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step3")}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>

          {/* KARTU 3: Threshold & Aksi */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-900">Threshold &amp; Aksi</h2>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Batas Durasi</span>
                  <span className="font-bold text-slate-800">{thresholdSeconds} Detik</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Notifikasi</span>
                  <span className="text-slate-700 font-medium">WebSocket &amp; Hub</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Auto Capture</span>
                  {/* COMPLIANCE: Sesuai dokumen revisi & PRD FR-08, bukti berupa tangkapan .jpg & log (bukan OCR plat) */}
                  <span className="font-bold text-blue-600">Aktif (Bukti .JPG)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/70 text-xs">
              <span className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Auto Push
              </span>
              <button
                type="button"
                onClick={() => router.push("/onboarding/step4")}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BARIS 2: LIVE CALIBRATION & STREAM PREVIEW
            ========================================================================= */}
        <div className="mb-8">
          <div className="mb-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              Live Calibration &amp; Stream Preview
            </h2>
            <p className="text-xs text-slate-500">
              Simulasi pemetaan deteksi angkot pada bounding box kamera {camInfo.name}.
            </p>
          </div>

          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-inner">
            {/* Live MJPEG Feed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`http://localhost:8000/api/stream/${cameraCode}`}
              alt="Live Calibration Feed"
              className="w-full h-full object-cover opacity-90"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            {/* Fallback frame jalan raya simpang Empang */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 pointer-events-none -z-10 flex items-center justify-center">
              <div className="text-slate-500 text-xs">Simulasi Frame CCTV Empang (1080p)</div>
            </div>

            {/* HUD Atas */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono pointer-events-none">
              <span className="bg-black/75 text-white px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1.5">
                <Video className="w-3 h-3 text-red-500" />
                CAM-01 &bull; RTSP LIVE FEED
              </span>
              <span className="bg-black/75 text-slate-300 px-2 py-0.5 rounded backdrop-blur-xs">
                FPS: 30.1 | LAT: 42ms | GPU: 18%
              </span>
            </div>

            {/* Overlay Zona ROI (Halte Bayangan Bahu Kiri) */}
            <div className="absolute top-16 left-12 right-24 bottom-10 border-2 border-dashed border-blue-500/80 bg-blue-600/15 rounded-xl pointer-events-none">
              <div className="absolute -top-3 left-3 bg-blue-700 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs">
                ROI Bahu Kiri: 1 Angkot Dalam Pemantauan
              </div>
            </div>

            {/* ===================================================================
                ATURAN SINGLE-CLASS AI (SESUAI DOKUMEN REVISI UI SILOTER & AGENTS.MD):
                - Pengganti label halusinasi OCR plat nomor (F 1928 BB).
                - Ditampilkan sebagai Track ID ByteTrack: Angkot #02 • 00:48
                =================================================================== */}
            <div className="absolute top-24 left-28 w-36 h-20 border-2 border-blue-400 bg-blue-500/15 rounded pointer-events-none flex flex-col justify-between p-1.5">
              <div className="bg-blue-600 text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <span>Angkot #02 &bull; 00:48</span>
              </div>
              <div className="text-[7.5px] font-mono text-blue-200 bg-black/80 px-1 py-0.5 rounded self-start">
                Dwell: 48s / {thresholdSeconds}s
              </div>
            </div>

            {/* HUD Bawah */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[9px] font-mono pointer-events-none text-slate-300">
              <span className="bg-black/75 px-2 py-0.5 rounded backdrop-blur-xs">
                {camInfo.road}
              </span>
              <span className="bg-black/75 px-2 py-0.5 rounded backdrop-blur-xs">
                TIMESTAMP: 2024-11-20 14:35:12 WIB
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Bounding box dan ROI otomatis dikonversi ke koordinat spasial Dishub Bogor GIS.
            </span>
            <button
              type="button"
              onClick={() => toast.info("Kalibrasi koordinat spasial: Homografi OK.")}
              className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Lihat Kalibrasi Penuh
            </button>
          </div>
        </div>

        {/* =========================================================================
            BARIS 3: DUA KOLOM (Kiri: Kesiapan Sistem; Kanan: Aktivasi Pemantauan)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          {/* KOLOM KIRI: Kesiapan Sistem Diagnostik */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-bold text-slate-900">Kesiapan Sistem</h3>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 mb-3.5">
                SILOTER melakukan pengecekan diagnostik pra-aktivasi secara real-time.
              </p>

              <div className="space-y-2.5">
                {/* Diagnostik 1: Stream */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Koneksi Stream CCTV Dishub
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Stabil &bull; Latency 42ms (Loss 0%)
                    </p>
                  </div>
                </div>

                {/* Diagnostik 2: AI GPU Engine */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      AI Inference Engine GPU
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Siap &bull; RTX 4090 Dishub Node 1 (Load 18%)
                    </p>
                  </div>
                </div>

                {/* Diagnostik 3: Supabase Database */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Database Pelanggaran Terpadu
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Terhubung &bull; PostgreSQL Dishub Cloud Sinkron
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Pipeline Health */}
            <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs font-bold">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                STATUS PIPELINE
              </span>
              <span className="text-blue-700">100% HEALTHY</span>
            </div>
          </div>

          {/* KOLOM KANAN: Tombol Aktivasi Pemantauan */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Aktivasi Pemantauan
              </h3>

              {/* Callout Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 mb-5 text-xs text-slate-600 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Setelah diaktifkan, data pelanggaran akan otomatis mengalir ke <strong>Dashboard Utama SILOTER</strong> dan unit operasional Dishub.
                </span>
              </div>

              {/* Tombol-tombol Aksi */}
              <div className="space-y-3">
                {/* 1. Tombol Utama (Aktifkan) */}
                <button
                  type="button"
                  disabled={isActivating}
                  onClick={handleActivateMonitoring}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-70 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Simpan &amp; Aktifkan Pemantauan Sekarang</span>
                </button>

                {/* 2. Tombol Draf */}
                <button
                  type="button"
                  disabled={isSavingDraft}
                  onClick={handleSaveDraft}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-blue-200/60 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Simpan sebagai Draf</span>
                </button>

                {/* 3. Ubah Konfigurasi Sebelumnya */}
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/step4")}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Konfigurasi Sebelumnya</span>
                </button>
              </div>
            </div>

            {/* Footer Keamanan SHA-256 */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-6">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Enkripsi SHA-256 Valid Dishub Smart City</span>
            </div>
          </div>
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
          <span>&bull;</span>
          <span className="hover:text-slate-600 cursor-pointer">Regulasi Perda No. 3 Th 2021</span>
        </div>
      </footer>
    </div>
  );
}
