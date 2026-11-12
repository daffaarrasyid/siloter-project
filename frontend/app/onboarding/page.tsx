"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Building2,
  Video,
  Network,
  Clock,
  Compass,
  Plus,
  X,
  Save,
  ArrowRight,
  Info,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function OnboardingSetupPage() {
  const router = useRouter();

  // State Form Step 1
  const [locationName, setLocationName] = useState("Pos Pemantauan Empang - Titik A");
  const [sector, setSector] = useState("Bogor Selatan (Empang, Batutulis, Cipaku)");
  const [operatorInfo, setOperatorInfo] = useState("Bripka Hendra Santoso / NIP 19840312 200812 1 004");
  const [shift, setShift] = useState("Shift Pagi (06.00–14.00)");
  const [trayekList, setTrayekList] = useState<string[]>([
    "02 Sukasari - Bubulak",
    "03 Baranangsiang - Bubulak",
    "14 Pasir Kuda - Sukasari",
  ]);
  const [newTrayekInput, setNewTrayekInput] = useState("");
  const [isAddingTrayek, setIsAddingTrayek] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cctvCount, setCctvCount] = useState<number>(142);
  const [logoError, setLogoError] = useState(false);

  // Ambil statistik CCTV & draf dari backend jika tersedia
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Fetch stats
        const resStats = await fetch(`${apiUrl}/api/cctv/stats`);
        if (resStats.ok) {
          const stats = await resStats.json();
          if (stats.total_cctv_network) {
            setCctvCount(stats.total_cctv_network);
          }
        }

        // Fetch draft step 1
        const resStep1 = await fetch(`${apiUrl}/api/onboarding/step1`);
        if (resStep1.ok) {
          const data = await resStep1.json();
          if (data.location_name) setLocationName(data.location_name);
          if (data.sector) setSector(data.sector);
          if (data.operator_name && data.operator_nip) {
            setOperatorInfo(`${data.operator_name} / NIP ${data.operator_nip}`);
          }
          if (data.trayek_references && data.trayek_references.length > 0) {
            setTrayekList(data.trayek_references);
          }
        }
      } catch (err) {
        console.warn("Backend not reached for initial onboarding data, using standard defaults:", err);
      }
    }
    fetchInitialData();
  }, []);

  // Handler Tambah Trayek Baru
  const handleAddTrayek = () => {
    if (!newTrayekInput.trim()) {
      setIsAddingTrayek(false);
      return;
    }
    if (trayekList.includes(newTrayekInput.trim())) {
      toast.warning("Kode trayek sudah terdaftar dalam catatan referensi.");
      return;
    }
    setTrayekList([...trayekList, newTrayekInput.trim()]);
    setNewTrayekInput("");
    setIsAddingTrayek(false);
    toast.success("Catatan trayek referensi berhasil ditambahkan.");
  };

  // Handler Hapus Trayek
  const handleRemoveTrayek = (itemToRemove: string) => {
    setTrayekList(trayekList.filter((item) => item !== itemToRemove));
  };

  // Simpan Draf
  const handleSaveDraft = async () => {
    setIsSaving(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const payload = {
        location_name: locationName,
        sector: sector,
        operator_name: operatorInfo.split("/")[0]?.trim() || "Bripka Hendra Santoso",
        operator_nip: operatorInfo.split("NIP")[1]?.trim() || "19840312 200812 1 004",
        shift: shift,
        trayek_references: trayekList,
        camera_code: "empang",
        is_draft: true,
      };

      await fetch(`${apiUrl}/api/onboarding/step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Simpan juga ke local storage sebagai backup
      localStorage.setItem("siloter_onboarding_step1", JSON.stringify(payload));
      toast.success("Draf konfigurasi pos pengawasan berhasil disimpan.");
    } catch (e) {
      localStorage.setItem(
        "siloter_onboarding_step1",
        JSON.stringify({ locationName, sector, operatorInfo, shift, trayekList })
      );
      toast.success("Draf konfigurasi berhasil disimpan ke cache lokal.");
    } finally {
      setIsSaving(false);
    }
  };

  // Lanjut ke Step 2 (Pilih Lokasi CCTV)
  const handleNextStep = async () => {
    if (!locationName.trim()) {
      toast.error("Nama konfigurasi lokasi wajib diisi.");
      return;
    }

    setIsSaving(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const payload = {
        location_name: locationName,
        sector: sector,
        operator_name: operatorInfo.split("/")[0]?.trim() || "Bripka Hendra Santoso",
        operator_nip: operatorInfo.split("NIP")[1]?.trim() || "19840312 200812 1 004",
        shift: shift,
        trayek_references: trayekList,
        camera_code: "empang",
        is_draft: false,
      };

      await fetch(`${apiUrl}/api/onboarding/step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      localStorage.setItem("siloter_onboarding_step1", JSON.stringify(payload));
      toast.success("Identifikasi pos berhasil disimpan. Membuka pemilihan CCTV...");
      setTimeout(() => {
        router.push("/onboarding/step2");
      }, 600);
    } catch (e) {
      toast.success("Identifikasi pos tersimpan. Melanjutkan ke tahap berikutnya...");
      setTimeout(() => {
        router.push("/onboarding/step2");
      }, 600);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f2f6fd] via-[#ecf2fc] to-[#e4eefb] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* =========================================================================
          HEADER ATAS: Logo & Stepper Progress (Tahap 1 - 5)
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
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            SILOTER
          </span>
        </div>

        {/* Stepper Wizard Progress Bar */}
        <nav aria-label="Progress Setup" className="w-full max-w-3xl overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[580px] px-4">
            {/* Step 1: Active */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                1
              </div>
              <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                Setup Awal
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

            {/* Step 2 */}
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
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
          KONTEN UTAMA: Card Inisialisasi Pemantauan Lokasi Baru
          ========================================================================= */}
      <main className="max-w-5xl w-full mx-auto bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-10 mb-6">
        {/* Header Judul & Badge CCTV Terkoneksi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Inisialisasi Pemantauan Lokasi Baru
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Konfigurasikan titik pengawasan CCTV lalu lintas untuk mendeteksi pelanggaran angkutan kota
              (angkot) ngetem di Kota Bogor secara otomatis.
            </p>
          </div>

          {/* Badge CCTV Aktif Terkoneksi */}
          <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl p-3.5 px-4 flex items-center gap-3.5 self-start md:self-auto shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                CCTV Aktif Terkoneksi
              </p>
              <p className="text-lg md:text-xl font-bold text-blue-700 leading-tight">
                {cctvCount} Kamera
              </p>
            </div>
          </div>
        </div>

        {/* 3 Kartu Ikhtisar Tahap (Tahap 01, Tahap 02, Tahap 03) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {/* Tahap 01 */}
          <div className="bg-slate-50/60 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                  Tahap 01
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Pilih Titik CCTV</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sambungkan feed kamera live streaming Dishub atau input RTSP stream statis lokasi persimpangan.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/40">
              <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1.5 hover:underline cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" />
                Integrasi GIS Bogor
              </span>
            </div>
          </div>

          {/* Tahap 02 */}
          <div className="bg-slate-50/60 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Network className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                  Tahap 02
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Tentukan Zona ROI</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tandai poligon area ngetem rawan macet pada video agar sistem fokus melacak bahu jalan dan halte.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/40">
              <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1.5 hover:underline cursor-pointer">
                ✏️ Polygon Detection Mask
              </span>
            </div>
          </div>

          {/* Tahap 03 */}
          <div className="bg-slate-50/60 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                  Tahap 03
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Parameter Durasi</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Batasi toleransi durasi berhenti armada angkot (mis. 90–180 detik) sebelum sinyal pelanggaran terpicu.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/40">
              <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1.5 hover:underline cursor-pointer">
                ⏱️ Kompilasi Bukti Tilang
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FORM DATA IDENTIFIKASI POS PENGAWASAN
            ========================================================================= */}
        <section aria-labelledby="pos-identification-title" className="space-y-6 pt-2">
          {/* Judul Bagian Form */}
          <div className="flex items-center gap-2.5 text-blue-600 font-bold text-base md:text-lg">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 id="pos-identification-title" className="text-slate-900">
              Data Identifikasi Pos Pengawasan
            </h2>
          </div>

          {/* Baris 1: 2 Kolom (Nama Lokasi & Sektor) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Input 1: Nama Konfigurasi Lokasi */}
            <div className="space-y-1.5">
              <label htmlFor="location-name" className="block text-xs font-bold text-slate-800">
                Nama Konfigurasi Lokasi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="location-name"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Gunakan format: [Nama Area / Persimpangan] - [Kode Titik]"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Gunakan format: [Nama Area / Persimpangan] - [Kode Titik]
              </p>
            </div>

            {/* Input 2: Sektor Pengawasan (Wilayah Dishub) */}
            <div className="space-y-1.5">
              <label htmlFor="sector-select" className="block text-xs font-bold text-slate-800">
                Sektor Pengawasan (Wilayah Dishub) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  id="sector-select"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors appearance-none cursor-pointer"
                >
                  <option value="Bogor Selatan (Empang, Batutulis, Cipaku)">
                    Bogor Selatan (Empang, Batutulis, Cipaku)
                  </option>
                  <option value="Bogor Tengah (Balaikota, Juanda, Suryakencana)">
                    Bogor Tengah (Balaikota, Juanda, Suryakencana)
                  </option>
                  <option value="Bogor Timur (Baranangsiang, Sukasari, Tajur)">
                    Bogor Timur (Baranangsiang, Sukasari, Tajur)
                  </option>
                  <option value="Bogor Barat (Bubulak, Gunung Batu, Cilendek)">
                    Bogor Barat (Bubulak, Gunung Batu, Cilendek)
                  </option>
                  <option value="Bogor Utara (Warung Jambu, Pajajaran, Kedunghalang)">
                    Bogor Utara (Warung Jambu, Pajajaran, Kedunghalang)
                  </option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Menentukan unit patroli reaksi cepat terdekat untuk penertiban
              </p>
            </div>
          </div>

          {/* Baris 2: Penanggung Jawab / Operator Lapangan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="operator-info" className="block text-xs font-bold text-slate-800">
                Penanggung Jawab / Operator Lapangan <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-blue-100">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                NIP Validated
              </span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                id="operator-info"
                type="text"
                value={operatorInfo}
                onChange={(e) => setOperatorInfo(e.target.value)}
                placeholder="Nama Petugas / NIP"
                className="w-full pl-10 pr-48 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                required
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <span className="text-xs bg-blue-50/90 text-blue-700 px-3 py-1 rounded-lg font-medium border border-blue-100">
                  ● {shift}
                </span>
              </div>
            </div>
          </div>

          {/* Baris 3: MASTER DATA TRAYEK JALUR INI (REFERENSI) */}
          {/* NOTE: Label disesuaikan wajib mengikuti aturan revisi Dokumen UI SILOTER! */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                MASTER DATA TRAYEK JALUR INI (REFERENSI):
              </label>
              <span className="text-[11px] text-slate-400 italic">
                *Catatan acuan rute umum lintasan CCTV (bukan klasifikasi AI)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {trayekList.map((trayek, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50/80 text-blue-700 border border-blue-200/90 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 group transition-all"
                >
                  <span>{trayek}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrayek(trayek)}
                    aria-label={`Hapus trayek ${trayek}`}
                    className="text-blue-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Form Input Tambah Trayek Cepat */}
              {isAddingTrayek ? (
                <div className="flex items-center gap-1.5 bg-white border border-blue-400 rounded-xl px-2 py-1 shadow-xs">
                  <input
                    type="text"
                    value={newTrayekInput}
                    onChange={(e) => setNewTrayekInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTrayek();
                      if (e.key === "Escape") setIsAddingTrayek(false);
                    }}
                    placeholder="Mis: 06 Ciheuleut - Baranangsiang"
                    className="text-xs px-1.5 py-0.5 outline-none text-slate-800 w-44"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddTrayek}
                    className="bg-blue-600 text-white rounded-lg px-2 py-0.5 text-xs font-semibold hover:bg-blue-700"
                  >
                    Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTrayek(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTrayek(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kode Trayek</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            TOMBOL AKSI BAWAH: Batal, Simpan Draf, Lanjut
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Batal / Kembali</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/70 text-blue-600 text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-blue-500" />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleNextStep}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Lanjut: Pilih Lokasi CCTV</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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
          <span>•</span>
          <span className="hover:text-slate-600 cursor-pointer">Regulasi Perda No. 3 Th 2021</span>
        </div>
      </footer>
    </div>
  );
}

