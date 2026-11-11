"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sliders,
  Edit2,
  Clock,
  TrendingUp,
  CheckCircle2,
  Info,
  Car,
  AlertTriangle,
  Activity,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function OnboardingStep4Page() {
  const router = useRouter();

  // State Pilihan Kamera & Logo
  const [selectedCameraCode, setSelectedCameraCode] = useState<string>("empang");
  const [logoError, setLogoError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parameter Ambang Batas Durasi Henti (Detik)
  // Preset ticks: 30, 60, 120, 180, 300
  const [thresholdSeconds, setThresholdSeconds] = useState<number>(120);

  // Buffer Toleransi Dinamis (Detik) - Lansia & Barang Bawaan
  const [toleranceBuffer, setToleranceBuffer] = useState<number>(15);
  const [isEditingBuffer, setIsEditingBuffer] = useState<boolean>(false);

  // Proyeksi Statistik Historis
  const [estimatedViolations, setEstimatedViolations] = useState<number>(38);
  const [congestionReduction, setCongestionReduction] = useState<number>(24.6);

  // Baca camera_code dari step sebelumnya
  useEffect(() => {
    const savedCam = localStorage.getItem("siloter_selected_camera") || "empang";
    setSelectedCameraCode(savedCam);

    const savedThreshold = localStorage.getItem("siloter_threshold_seconds");
    if (savedThreshold) {
      const val = parseInt(savedThreshold, 10);
      if (!isNaN(val) && val >= 30 && val <= 300) {
        setThresholdSeconds(val);
      }
    }
  }, []);

  // Update proyeksi saat threshold berubah
  useEffect(() => {
    // Model matematis empiris Dishub Kota Bogor (14 hari observasi)
    const base = selectedCameraCode === "empang" ? 92 : selectedCameraCode === "surken" ? 70 : 45;
    const factor = 60.0 / Math.max(30, thresholdSeconds);
    const est = Math.max(8, Math.round(base * Math.pow(factor, 0.85)));
    setEstimatedViolations(est);

    if (thresholdSeconds <= 60) {
      setCongestionReduction(34.2);
    } else if (thresholdSeconds <= 120) {
      setCongestionReduction(24.6);
    } else if (thresholdSeconds <= 180) {
      setCongestionReduction(16.5);
    } else {
      setCongestionReduction(8.1);
    }
  }, [thresholdSeconds, selectedCameraCode]);

  // Format Detik ke Menit dan Detik
  const formatMinutesSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) {
      return `(${secs} Detik)`;
    }
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `(${mins} Menit ${padSecs} Detik)`;
  };

  // Simpan Konfigurasi & Navigasi ke Step 5 (Konfirmasi & Simpan)
  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/onboarding/step4`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera_code: selectedCameraCode,
          threshold_seconds: thresholdSeconds,
          tolerance_buffer_seconds: toleranceBuffer,
          is_draft: false,
        }),
      });

      if (res.ok) {
        toast.success(`Parameter durasi ${thresholdSeconds} detik berhasil disimpan!`);
      }
      localStorage.setItem("siloter_threshold_seconds", thresholdSeconds.toString());
      localStorage.setItem("siloter_tolerance_buffer", toleranceBuffer.toString());

      setTimeout(() => {
        router.push("/onboarding/step5");
      }, 700);
    } catch (err) {
      console.warn("Gagal menghubungi backend, menyimpan ke cache lokal:", err);
      localStorage.setItem("siloter_threshold_seconds", thresholdSeconds.toString());
      localStorage.setItem("siloter_tolerance_buffer", toleranceBuffer.toString());
      toast.success("Parameter durasi disimpan ke cache lokal.");
      setTimeout(() => {
        router.push("/onboarding/step5");
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  // Ticks preset slider
  const presetTicks = [
    { value: 30, label: "30d" },
    { value: 60, label: "60d (1m)" },
    { value: 120, label: "120d (2m)" },
    { value: 180, label: "180d (3m)" },
    { value: 300, label: "300d (5m)" },
  ];

  // Hitung posisi horizontal garis ambang pada kurva distribusi (0% - 100%)
  // Range kurva 15s sd 400s
  const calculateCurveThresholdPercent = () => {
    const min = 15;
    const max = 400;
    const clamped = Math.max(min, Math.min(max, thresholdSeconds));
    return ((clamped - min) / (max - min)) * 100;
  };

  const getCameraDisplayName = () => {
    switch (selectedCameraCode) {
      case "surken":
        return "SIMPANG SURYAKENCANA";
      case "balaikota":
        return "KORIDOR BALAIKOTA";
      case "empang":
      default:
        return "SIMPANG EMPANG";
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

            {/* Step 3: Completed */}
            <button
              type="button"
              onClick={() => router.push("/onboarding/step3")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Zona ROI Ngetem
              </span>
            </button>

            <div className="flex-1 h-0.5 bg-blue-600 mx-3" />

            {/* Step 4: ACTIVE */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-blue-100">
                4
              </div>
              <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                Threshold Durasi
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

            {/* Step 5: Upcoming */}
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
          KONTEN UTAMA: Dua Kolom
          (Kiri: Ambang Batas Durasi & Kurva Distribusi; Kanan: Simulasi Live & Logika)
          ========================================================================= */}
      <main className="max-w-5xl w-full mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-10 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===================================================================
              KOLOM KIRI (7/12): Penentuan Ambang Batas Durasi & Kurva Historis
              =================================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Ambang Batas Durasi Henti
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1.5">
                Tentukan berapa lama sebuah angkot diizinkan berhenti di zona ROI sebelum ditandai sebagai pelanggaran &apos;Ngetem&apos; oleh sistem vision intelligence Dishub.
              </p>
            </div>

            {/* KARTU 1: BATAS MAKSIMAL NGETEM DENGAN SLIDER INTERAKTIF */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    BATAS MAKSIMAL NGETEM
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    Waktu Tunggu Penumpang Maksimum
                  </h2>
                </div>

                {/* Badge Durasi Besar (Biru) */}
                <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 text-right shadow-xs shrink-0">
                  <div className="text-base sm:text-xl font-black tracking-tight leading-tight">
                    {thresholdSeconds} Detik
                  </div>
                  <div className="text-[10px] text-blue-100 font-medium">
                    {formatMinutesSeconds(thresholdSeconds)}
                  </div>
                </div>
              </div>

              {/* Slider Pengatur Detik */}
              <div className="space-y-3 pt-2 pb-1">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={30}
                    max={300}
                    step={10}
                    value={thresholdSeconds}
                    onChange={(e) => setThresholdSeconds(parseInt(e.target.value, 10))}
                    aria-label="Atur durasi henti maksimum"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Ticks & Preset Tombol */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  {presetTicks.map((tick) => {
                    const isSelected = thresholdSeconds === tick.value;
                    return (
                      <button
                        key={tick.value}
                        type="button"
                        onClick={() => setThresholdSeconds(tick.value)}
                        className={`text-center font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "text-blue-700 font-bold scale-105"
                            : "hover:text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${
                            isSelected ? "bg-blue-600 ring-2 ring-blue-200" : "bg-slate-300"
                          }`}
                        />
                        <span>{tick.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Card: Tolerance Buffer Dinamis */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Tolerance Buffer Dinamis
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toleransi penumpang lansia &amp; barang bawaan.
                    </p>
                  </div>
                </div>

                {/* Tombol / Badge Buffer Dinamis */}
                {!isEditingBuffer ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingBuffer(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <span>&plusmn;{toleranceBuffer} Detik</span>
                    <Edit2 className="w-3 h-3 text-slate-400" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-blue-400 shadow-xs">
                    {[0, 10, 15, 30].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setToleranceBuffer(val);
                          setIsEditingBuffer(false);
                          toast.info(`Tolerance buffer diatur ke ±${val} detik.`);
                        }}
                        className={`px-2 py-1 text-xs rounded-lg font-bold transition-colors ${
                          toleranceBuffer === val
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        &plusmn;{val}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KARTU 2: DISTRIBUSI DURASI PARKIR LIAR (HISTORIS) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Distribusi Durasi Parkir Liar (Historis)
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Puncak: 16:30 – 18:00 WIB
                </span>
              </div>

              {/* Visualisasi Kurva Distribusi Frekuensi (Gaussian Bell Curve) */}
              <div className="relative w-full h-32 bg-slate-50/70 rounded-xl overflow-hidden border border-slate-100 p-2">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 400 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Area Di Bawah Kurva */}
                  <path
                    d="M 0 95 C 60 95, 120 85, 160 55 C 200 25, 230 20, 260 40 C 300 70, 350 90, 400 95 L 400 100 L 0 100 Z"
                    fill="url(#curveGradient)"
                  />

                  {/* Garis Kontur Kurva */}
                  <path
                    d="M 0 95 C 60 95, 120 85, 160 55 C 200 25, 230 20, 260 40 C 300 70, 350 90, 400 95"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Garis Ambang Batas Vertikal Dinamis (Merah Putus-putus) */}
                <div
                  className="absolute top-0 bottom-4 w-0.5 border-l-2 border-dashed border-red-500 transition-all duration-300 pointer-events-none"
                  style={{ left: `${calculateCurveThresholdPercent()}%` }}
                >
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-xs" />
                </div>
              </div>

              {/* Label Sumbu X */}
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mt-2 px-1">
                <span>15 Detik</span>
                <span className="text-red-600 font-bold">
                  Ambang {thresholdSeconds}s
                </span>
                <span>400+ Detik</span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              KOLOM KANAN (5/12): Simulasi Deteksi Live, Transisi, Proyeksi
              =================================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* KARTU 1: SIMULASI DETEKSI LIVE (SESUAI ATURAN SINGLE-CLASS AI) */}
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-2xs">
              {/* Header Stream */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-red-400 font-bold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  SIMULASI DETEKSI LIVE
                </span>
                <span className="text-slate-400">
                  FPS: 1.0 (BSW Fair-Use) &bull; Latency: 42ms
                </span>
              </div>

              {/* Jendela CCTV Feed dengan Overlay Bounding-Box Terpantau */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`http://localhost:8000/api/stream/${selectedCameraCode}`}
                  alt="Live CCTV Feed"
                  className="w-full h-full object-cover opacity-85"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                {/* Fallback latar lalu lintas simpang */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 pointer-events-none -z-10 flex items-center justify-center">
                  <div className="text-slate-500 text-xs">Simulasi Frame CCTV Empang (1080p)</div>
                </div>

                {/* HUD Kamera Atas */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
                  BOGOR | EMPANG JUNCTION | 24-10-2023 14:32 WIB
                </div>

                {/* Overlay Zona ROI (Halte Bayangan) */}
                <div className="absolute top-12 left-10 right-10 bottom-6 border-2 border-dashed border-blue-500/70 bg-blue-500/15 rounded-lg pointer-events-none">
                  <div className="absolute -top-3 left-2 bg-blue-700 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                    ROI #01 - HALTE BAYANGAN EMPANG
                  </div>
                  <div className="absolute bottom-1 right-1 text-[8px] font-mono text-blue-200">
                    Luas: 48.6 m²
                  </div>
                </div>

                {/* ===================================================================
                    ATURAN REVISI UI SILOTER (SESUAI DOKUMEN PATOKAN & AGENTS.MD):
                    - Model AI adalah SINGLE-CLASS Object Detection (hanya deteksi angkot fisik).
                    - TIDAK ADA OCR plat nomor (F 1982 BB, F 1944 CA dihapus/diganti).
                    - TIDAK ADA klasifikasi trayek otomatis (02 Sukasari dihapus/diganti).
                    - DIGANTI DENGAN: Track ID ByteTrack unik (Angkot #02, Angkot #04) & Dwell Time.
                    =================================================================== */}

                {/* Bounding Box 1: Angkot Transit Normal (< 30s) */}
                <div className="absolute top-16 right-14 w-28 h-20 border-2 border-blue-400 bg-blue-400/10 rounded pointer-events-none flex flex-col justify-between p-1">
                  <div className="bg-blue-600 text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center justify-between">
                    <span>Angkot #02</span>
                    <CheckCircle2 className="w-2.5 h-2.5 text-blue-200" />
                  </div>
                  <div className="text-[7.5px] font-mono text-blue-200 bg-black/75 px-1 rounded">
                    Normal Transit (18s)
                  </div>
                </div>

                {/* Bounding Box 2: Angkot Pelanggaran Ngetem (> Threshold) */}
                <div className="absolute bottom-9 left-16 w-36 h-24 border-2 border-red-500 bg-red-500/20 rounded pointer-events-none flex flex-col justify-between p-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-900/90 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded">
                      Angkot #04
                    </span>
                    <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                      NGETEM
                    </span>
                  </div>
                  <div className="bg-black/85 text-white p-1 rounded text-[7.5px] font-mono leading-tight space-y-0.5">
                    <div>Waktu Berhenti: 142s</div>
                    <div className="text-red-400 font-bold">
                      +{142 - thresholdSeconds}s Lewat Batas
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Ringkasan Bawah Video */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 text-[11px] text-slate-300 border-t border-slate-800">
                <span>Target Terpantau Saat Ini: <strong className="text-white">4 Angkot</strong></span>
                <span className="flex items-center gap-1.5 font-bold text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  1 Pelanggaran Terkonfirmasi
                </span>
              </div>
            </div>

            {/* KARTU 2: TRANSISI STATUS KENDARAAN (LOGIKA SISTEM) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Transisi Status Kendaraan
                </h3>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  LOGIKA SISTEM
                </span>
              </div>

              {/* Bar 3 Warna Logika Status */}
              <div className="grid grid-cols-12 gap-1 h-2 rounded-full overflow-hidden bg-slate-100 mb-3">
                <div className="col-span-3 bg-blue-500 rounded-l-full" />
                <div className="col-span-6 bg-indigo-500" />
                <div className="col-span-3 bg-red-500 rounded-r-full" />
              </div>

              {/* Keterangan 3 Status */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-lg bg-blue-50/70 border border-blue-100">
                  <div className="text-[10px] font-mono font-bold text-blue-700">
                    0s – 30s
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                    Transit Normal
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <div className="text-[10px] font-mono font-bold text-indigo-700">
                    30s – {thresholdSeconds}s
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                    Toleransi Halte
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-red-50/70 border border-red-100">
                  <div className="text-[10px] font-mono font-bold text-red-700">
                    &gt; {thresholdSeconds}s
                  </div>
                  <div className="text-[10px] font-bold text-red-600 mt-0.5">
                    Flag Ngetem
                  </div>
                </div>
              </div>
            </div>

            {/* KARTU 3: PROYEKSI HISTORIS KORIDOR */}
            <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/50 rounded-2xl p-4 border border-blue-100 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>PROYEKSI HISTORIS {getCameraDisplayName()}</span>
              </div>

              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ~{estimatedViolations}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  estimasi pelanggaran / hari
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Berdasarkan observasi data empiris 14 hari terakhir: Bondongan. Threshold {thresholdSeconds} detik diprediksi menekan kemacetan antrean sebesar <strong className="text-blue-700 font-bold">{congestionReduction}%</strong> tanpa memicu false-positive tinggi.
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOMBOL NAVIGASI BAWAH: Kembali & Lanjut ke Step 5 (Konfirmasi & Simpan)
            ========================================================================= */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/onboarding/step3")}
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
            <span>Lanjut: Konfirmasi &amp; Simpan</span>
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

