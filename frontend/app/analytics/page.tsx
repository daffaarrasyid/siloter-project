"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  Video,
  ShieldCheck,
  Layers,
  BarChart3,
  Users,
  Settings,
  Download,
  Calendar,
  Search,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  FileText,
  Clock,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Car,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface RekapItem {
  no: number;
  track_id: string;
  plate_number: string;
  plate_color: string;
  camera_code: string;
  camera_name: string;
  waktu_wib: string;
  duration_seconds: number;
  duration_display: string;
  verifier_name: string;
  verified_at: string;
  status: string;
  reason?: string;
  notes?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();

  // Period Tab: Bulanan | Mingguan | Harian
  const [periodTab, setPeriodTab] = useState<"Bulanan" | "Mingguan" | "Harian">("Bulanan");
  const [selectedCamera, setSelectedCamera] = useState("Semua CCTV");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("01 Okt 2026 – 31 Okt 2026");

  // KPI Metrics (matching media_1794443330942_5d380212.jpg)
  const [kpiData, setKpiData] = useState({
    bulanIni: 348,
    bulanIniTrend: "+12% vs September 2026 (311 kasus)",
    mingguIni: 84,
    mingguIniSub: "24 – 31 Okt 2026 (subset dari 348)",
    titikTeramai: "Simpang BTM",
    titikTeramaiSub: "189 Kejadian • 54.3% Kontribusi",
    jamPuncak: "16.00 – 18.00",
    jamPuncakSub: "Peak sore, jam kepulangan komuter",
    rataRataDurasi: "3m 14s (194 detik)",
    rataRataDurasiSub: "Batas Toleransi: 60 Detik (Melebihi 3.2×)",
  });

  // Hourly Histogram (00:00 - 23:00)
  const [hourlyData, setHourlyData] = useState([
    { hour: "00", count: 2, is_peak: false },
    { hour: "01", count: 1, is_peak: false },
    { hour: "02", count: 0, is_peak: false },
    { hour: "03", count: 1, is_peak: false },
    { hour: "04", count: 4, is_peak: false },
    { hour: "05", count: 10, is_peak: false },
    { hour: "06", count: 24, is_peak: true },
    { hour: "07", count: 38, is_peak: true },
    { hour: "08", count: 32, is_peak: true },
    { hour: "09", count: 14, is_peak: false },
    { hour: "10", count: 16, is_peak: false },
    { hour: "11", count: 18, is_peak: false },
    { hour: "12", count: 20, is_peak: false },
    { hour: "13", count: 16, is_peak: false },
    { hour: "14", count: 18, is_peak: false },
    { hour: "15", count: 22, is_peak: false },
    { hour: "16", count: 42, is_peak: true },
    { hour: "17", count: 48, is_peak: true },
    { hour: "18", count: 36, is_peak: true },
    { hour: "19", count: 20, is_peak: false },
    { hour: "20", count: 14, is_peak: false },
    { hour: "21", count: 9, is_peak: false },
    { hour: "22", count: 5, is_peak: false },
    { hour: "23", count: 3, is_peak: false },
  ]);

  // Weekly Trend
  const weeklyData = [
    { week: "Mgg 1", btm: 38, jmr: 34, total: 72 },
    { week: "Mgg 2", btm: 48, jmr: 40, total: 88 },
    { week: "Mgg 3", btm: 58, jmr: 46, total: 104 },
    { week: "Mgg 4", btm: 45, jmr: 39, total: 84 },
  ];

  // Rekap Table Data
  const [rekapRows, setRekapRows] = useState<RekapItem[]>([
    {
      no: 1,
      track_id: "TRK-0142",
      plate_number: "F 1934 AK",
      plate_color: "Hitam / Kuning",
      camera_code: "empang",
      camera_name: "Jl. Djuanda - Empang",
      waktu_wib: "24 Okt 2026 - 17:14:02",
      duration_seconds: 214,
      duration_display: "214s (3m 34s)",
      verifier_name: "Budi Santoso, S.T.",
      verified_at: "24 Okt 2026 - 17:22",
      status: "VALID",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Pengemudi sengaja menunggu penumpang di bahu jalan > 80 detik.",
    },
    {
      no: 2,
      track_id: "TRK-0139",
      plate_number: "F 1422 BA",
      plate_color: "Hitam / Kuning",
      camera_code: "surken",
      camera_name: "Jl. Djuanda - Suryakencana",
      waktu_wib: "24 Okt 2026 - 16:58:19",
      duration_seconds: 188,
      duration_display: "188s (3m 08s)",
      verifier_name: "Budi Santoso, S.T.",
      verified_at: "24 Okt 2026 - 17:10",
      status: "VALID",
      reason: "Menunggu Penumpang di Zona Larangan",
      notes: "Penurunan dan penjemputan penumpang di area terlarang Suryakencana.",
    },
    {
      no: 3,
      track_id: "TRK-0135",
      plate_number: "F 1803 AA",
      plate_color: "Hitam / Kuning",
      camera_code: "empang",
      camera_name: "Jl. Djuanda - Empang",
      waktu_wib: "24 Okt 2026 - 16:42:56",
      duration_seconds: 245,
      duration_display: "245s (4m 05s)",
      verifier_name: "Ahmad Fauzi, A.Md.PKB",
      verified_at: "24 Okt 2026 - 16:55",
      status: "VALID",
      reason: "Antrean Ganda (Double Parking)",
      notes: "Menumpuk di sisi kiri jalan menyebabkan perlambatan arus Simpang BTM.",
    },
    {
      no: 4,
      track_id: "TRK-0130",
      plate_number: "F 1198 ZB",
      plate_color: "Hitam / Kuning",
      camera_code: "surken",
      camera_name: "Jl. Djuanda - Suryakencana",
      waktu_wib: "24 Okt 2026 - 15:30:11",
      duration_seconds: 130,
      duration_display: "130s (2m 10s)",
      verifier_name: "Budi Santoso, S.T.",
      verified_at: "24 Okt 2026 - 15:42",
      status: "VALID",
      reason: "Ngetem Melebihi Toleransi",
      notes: "Berhenti lama di depan ruko tanpa pergantian penumpang aktif.",
    },
    {
      no: 5,
      track_id: "TRK-0125",
      plate_number: "F 1650 DD",
      plate_color: "Hitam / Kuning",
      camera_code: "surken",
      camera_name: "Jl. Djuanda - Suryakencana",
      waktu_wib: "24 Okt 2026 - 14:18:49",
      duration_seconds: 195,
      duration_display: "195s (3m 15s)",
      verifier_name: "Ahmad Fauzi, A.Md.PKB",
      verified_at: "24 Okt 2026 - 14:30",
      status: "VALID",
      reason: "Ngetem Menghambat Lalu Lintas",
      notes: "Sopir meninggalkan kemudi sesaat di zona larangan.",
    },
  ]);

  // Pagination for table (Revisi Item 7)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal Detail State
  const [selectedIncident, setSelectedIncident] = useState<RekapItem | null>(null);

  // Load backend summary if available
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/analytics/summary`);
        if (res.ok) {
          const json = await res.json();
          if (json.kpi_cards) {
            setKpiData({
              bulanIni: json.kpi_cards.bulan_ini.count,
              bulanIniTrend: json.kpi_cards.bulan_ini.trend,
              mingguIni: json.kpi_cards.minggu_ini.count,
              mingguIniSub: `${json.kpi_cards.minggu_ini.dates} (${json.kpi_cards.minggu_ini.desc})`,
              titikTeramai: json.kpi_cards.titik_teramai.name,
              titikTeramaiSub: `${json.kpi_cards.titik_teramai.count} Kejadian • ${json.kpi_cards.titik_teramai.percentage}% Kontribusi`,
              jamPuncak: json.kpi_cards.jam_puncak.time_range,
              jamPuncakSub: json.kpi_cards.jam_puncak.desc,
              rataRataDurasi: json.kpi_cards.rata_rata_durasi.duration_formatted,
              rataRataDurasiSub: `Batas Toleransi: ${json.kpi_cards.rata_rata_durasi.tolerance_limit} (${json.kpi_cards.rata_rata_durasi.multiplier})`,
            });
          }
          if (json.hourly_distribution) {
            setHourlyData(json.hourly_distribution);
          }
          if (json.rekap_pelanggaran_valid && json.rekap_pelanggaran_valid.length > 0) {
            setRekapRows(json.rekap_pelanggaran_valid);
          }
        }
      } catch (err) {
        console.warn("Backend analytics not reached, using defaults:", err);
      }
    }

    fetchAnalytics();
  }, []);

  // Filter Table
  const filteredRows = rekapRows.filter((r) => {
    const matchSearch =
      searchQuery === "" ||
      r.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.track_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCam =
      selectedCamera === "Semua CCTV" ||
      selectedCamera === "Semua CCTV (CAM-01 & CAM-02)" ||
      r.camera_name.toLowerCase().includes(selectedCamera.toLowerCase()) ||
      r.camera_code.toLowerCase().includes(selectedCamera.toLowerCase());

    return matchSearch && matchCam;
  });

  // Action: Export Excel (.CSV)
  const handleExportExcel = () => {
    const headers = [
      "No",
      "Track ID",
      "Nomor Plat",
      "Lokasi",
      "Tanggal dan Waktu",
      "Durasi Ngetem",
      "Petugas Verifikator",
      "Waktu Validasi",
      "Status",
      "Alasan Pelanggaran",
    ];

    const rows = filteredRows.map((r) => [
      r.no,
      r.track_id,
      r.plate_number,
      `"${r.camera_name}"`,
      `"${r.waktu_wib}"`,
      `"${r.duration_display}"`,
      `"${r.verifier_name}"`,
      `"${r.verified_at}"`,
      r.status,
      `"${r.reason || 'Ngetem'}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Analitik_Ngetem_SILOTER_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Laporan Excel (CSV Spreadsheet) berhasil diunduh.");
  };

  // Action: Export PDF (Print View)
  const handleExportPDF = () => {
    window.print();
    toast.info("Membuka dialog cetak laporan PDF resmi Dishub Kota Bogor.");
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f7fc] text-slate-800 font-sans overflow-hidden">
      {/* SIDEBAR MODULAR */}
      <Sidebar />

      {/* =========================================================================
          KONTEN UTAMA: ANALITIK & LAPORAN
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* NAVBAR MODULAR (Profil & Logout konsisten) */}
        <Navbar />

        {/* CONTAINER BODY */}
        <div className="p-8 space-y-6 max-w-7xl">
          {/* HEADER HALAMAN (Item 3: Di dalam halaman, konsisten, tanpa emoji) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  Analitik &amp; Laporan
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Dishub Bogor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Laporan agregasi validitas deteksi computer vision &amp; verifikasi petugas Dishub Kota Bogor.
              </p>
            </div>

            {/* Action Buttons: Ekspor Excel & Ekspor PDF */}
            <div className="flex items-center gap-2.5 print:hidden">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Ekspor PDF</span>
              </button>
            </div>
          </div>
          {/* =====================================================================
              FILTER BAR (MATCHING MOCKUP)
              ===================================================================== */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            {/* Period Tabs: Bulanan / Mingguan / Harian */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              {(["Bulanan", "Mingguan", "Harian"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPeriodTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    periodTab === tab
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Rentang Tanggal */}
            <div className="flex flex-col min-w-[180px]">
              <span className="text-[10px] font-semibold text-slate-500 mb-0.5">
                Rentang Tanggal
              </span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dateRange}</span>
              </div>
            </div>

            {/* Lokasi CCTV */}
            <div className="flex flex-col min-w-[200px]">
              <span className="text-[10px] font-semibold text-slate-500 mb-0.5">
                Lokasi CCTV
              </span>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="Semua CCTV">Semua CCTV</option>
                <option value="Jl. Djuanda - Empang">Jl. Djuanda - Empang</option>
                <option value="Jl. Djuanda - Suryakencana">Jl. Djuanda - Suryakencana</option>
                <option value="Jl. Djuanda - Balaikota">Jl. Djuanda - Balaikota</option>
              </select>
            </div>

            {/* Search Plat / Track ID */}
            <div className="flex flex-col min-w-[160px] flex-1">
              <span className="text-[10px] font-semibold text-slate-500 mb-0.5">
                Cari Plat / Track ID
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Plat / Track ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* =====================================================================
              5 STATS CARDS (MATCHING MOCKUP)
              ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Bulan Ini */}
            <div className="bg-[#fef2f2]/60 border border-red-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">
                Bulan Ini
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {kpiData.bulanIni}
                </span>
                <span className="text-xs font-medium text-slate-600">Kasus</span>
              </div>
              <p className="text-[10.5px] font-semibold text-emerald-600 mt-1 truncate">
                {kpiData.bulanIniTrend}
              </p>
            </div>

            {/* Card 2: Minggu Ini */}
            <div className="bg-[#fffbeb]/70 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">
                Minggu Ini
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">
                  {kpiData.mingguIni}
                </span>
                <span className="text-xs font-medium text-slate-600">Kasus</span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium mt-1 truncate">
                {kpiData.mingguIniSub}
              </p>
            </div>

            {/* Card 3: Titik CCTV Teramai */}
            <div className="bg-[#eff6ff]/70 border border-blue-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">
                Titik CCTV Teramai
              </span>
              <span className="text-lg font-bold text-slate-900 mt-1 block truncate">
                {kpiData.titikTeramai}
              </span>
              <p className="text-[10.5px] text-blue-600 font-semibold mt-1 truncate">
                {kpiData.titikTeramaiSub}
              </p>
            </div>

            {/* Card 4: Jam Puncak Paling Rawan */}
            <div className="bg-[#f0fdf4]/70 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">
                Jam Puncak Paling Rawan
              </span>
              <span className="text-lg font-bold text-slate-900 mt-1 block truncate">
                {kpiData.jamPuncak}
              </span>
              <p className="text-[10.5px] text-slate-500 font-medium mt-1 truncate">
                {kpiData.jamPuncakSub}
              </p>
            </div>

            {/* Card 5: Rata-Rata Durasi Ngetem */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">
                Rata-Rata Durasi
              </span>
              <span className="text-lg font-bold text-slate-900 mt-1 block truncate">
                {kpiData.rataRataDurasi}
              </span>
              <p className="text-[10.5px] text-red-600 font-semibold mt-1 truncate">
                {kpiData.rataRataDurasiSub}
              </p>
            </div>
          </div>

          {/* =====================================================================
              ROW CHARTS: HISTOGRAM 24 JAM & PELANGGARAN PER LOKASI
              ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Kiri: Pelanggaran per Jam (2 Columns wide) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">
                      Pelanggaran per Jam
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      24 Jam
                    </span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                      <span>Normal Flow</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-red-600" />
                      <span>Peak Jam Rawan</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Histogram intensitas kejadian ngetem per interval jam (00.00–23.00 WIB)
                </p>

                {/* SVG Histogram */}
                <div className="mt-6 h-56 w-full flex items-end gap-1.5 sm:gap-2 px-2 pt-6 pb-2 border-b border-slate-100 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100 pointer-events-none" />

                  {hourlyData.map((d) => {
                    const maxVal = 50;
                    const heightPercent = Math.max((d.count / maxVal) * 100, 4);

                    return (
                      <div
                        key={d.hour}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md font-mono pointer-events-none z-10 whitespace-nowrap shadow-md">
                          Jam {d.hour}:00 • {d.count} kasus
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xs transition-all duration-300 ${
                            d.is_peak
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-400 font-mono">
                  {hourlyData
                    .filter((_, idx) => idx % 2 === 0)
                    .map((d) => (
                      <span key={d.hour}>{d.hour}</span>
                    ))}
                  <span>23</span>
                </div>
              </div>

              {/* Informational Callout matching mockup */}
              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  Puncak akumulasi terjadi saat pergantian shift perkantoran &amp; rute commuter line Stasiun Bogor menuju Baranangsiang/Bubulak.{" "}
                  <span className="font-bold text-slate-800">Sampling: 100% Validated</span>
                </span>
              </div>
            </div>

            {/* Chart Kanan: Pelanggaran per Lokasi (Donut & HITL Plate Stats) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Pelanggaran per Lokasi
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distribusi insiden valid per kamera pantau
                </p>

                {/* Donut Ring Visual */}
                <div className="relative my-6 flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e2e8f0"
                      strokeWidth="14"
                      fill="transparent"
                    />
                    {/* Simpang BTM (54.3% = 217.1 / 251.3 circumference) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="14"
                      strokeDasharray="136.5 251.3"
                      strokeDashoffset="0"
                      fill="transparent"
                    />
                    {/* Jembatan Merah (45.7%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1e40af"
                      strokeWidth="14"
                      strokeDasharray="114.8 251.3"
                      strokeDashoffset="-136.5"
                      fill="transparent"
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-900 leading-none block">
                      348
                    </span>
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 block">
                      INSIDEN VALID
                    </span>
                  </div>
                </div>

                {/* Location breakdown items */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6]" />
                      <span className="font-semibold text-slate-700">Simpang BTM (CAM-01)</span>
                    </div>
                    <span className="font-bold text-slate-900">189 (54.3%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#1e40af]" />
                      <span className="font-semibold text-slate-700">Jembatan Merah (CAM-02)</span>
                    </div>
                    <span className="font-bold text-slate-900">159 (45.7%)</span>
                  </div>
                </div>
              </div>

              {/* Sub-Card: Hasil Verifikasi Plat Manual (HITL) */}
              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-800">
                    Hasil Pembacaan Plat
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    Target: 60–70%
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 space-y-0.5">
                  <p>All-time Validasi: <span className="font-bold text-slate-800">348 unit</span></p>
                  <p>Koreksi Petugas: <span className="font-bold text-slate-800">154 unit</span></p>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-2 leading-tight">
                  Single-class vision intelligence melacak durasi kendaraan di ROI, verifikasi nomor polisi dilakukan petugas.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================================
              MIDDLE CHART: TREN PELANGGARAN PER MINGGU (OKTOBER 2026)
              ===================================================================== */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Tren Pelanggaran per Minggu (Oktober 2026)
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    4 Minggu
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Akumulasi kasus per minggu bulan berjalan • Total 348 kasus
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#3b82f6]" />
                  <span>BTM (CAM-01)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#1e40af]" />
                  <span>Jembatan Merah (CAM-02)</span>
                </div>
              </div>
            </div>

            {/* Weekly Grouped Bar Chart */}
            <div className="h-44 w-full flex items-end justify-around pt-6 pb-2 border-b border-slate-100">
              {weeklyData.map((w) => (
                <div key={w.week} className="flex flex-col items-center gap-2 group">
                  <div className="flex items-end gap-1.5 h-32">
                    {/* BTM Bar */}
                    <div
                      style={{ height: `${(w.btm / 70) * 100}%` }}
                      className="w-8 sm:w-10 bg-[#3b82f6] hover:bg-blue-600 rounded-t-xs transition-all relative"
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-600">
                        {w.btm}
                      </span>
                    </div>

                    {/* JMR Bar */}
                    <div
                      style={{ height: `${(w.jmr / 70) * 100}%` }}
                      className="w-8 sm:w-10 bg-[#1e40af] hover:bg-blue-900 rounded-t-xs transition-all relative"
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-600">
                        {w.jmr}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 mt-1">
                    {w.week}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3">
              <p className="text-[11px] text-slate-500 font-medium">
                Total 348 kasus terbagi: Mgg 1: 72 • Mgg 2: 88 • Mgg 3: 104 • Mgg 4 (berjalan): 84
              </p>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                DATA CONTOH
              </span>
            </div>
          </div>

          {/* =====================================================================
              BOTTOM TABLE: REKAP PELANGGARAN VALID (MATCHING MOCKUP)
              ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Rekap Pelanggaran Valid
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    Seksi 7 Log Audit
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">
                    Daftar kasus yang telah diverifikasi petugas pengawas lapangan
                  </p>
                  <span className="text-[9.5px] font-bold text-amber-600">• DATA CONTOH</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 text-center">No</th>
                    <th className="py-3 px-4">Track ID</th>
                    <th className="py-3 px-4">Nomor Plat</th>
                    <th className="py-3 px-4">Lokasi</th>
                    <th className="py-3 px-4">Tanggal dan Waktu</th>
                    <th className="py-3 px-4">Durasi</th>
                    <th className="py-3 px-4">Petugas Verifikator</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRows
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((row, idx) => (
                    <tr
                      key={row.track_id}
                      onClick={() => setSelectedIncident(row)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* NO */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* TRACK ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {row.track_id}
                      </td>

                      {/* NOMOR PLAT */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 font-mono font-semibold text-slate-900 tracking-wide text-xs border border-slate-200">
                          {row.plate_number}
                        </span>
                      </td>

                      {/* LOKASI */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {row.camera_name}
                      </td>

                      {/* TANGGAL DAN WAKTU */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {row.waktu_wib}
                      </td>

                      {/* DURASI */}
                      <td className="py-3.5 px-4 font-bold text-red-600 font-mono">
                        {row.duration_display}
                      </td>

                      {/* PETUGAS VERIFIKATOR */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">
                            {row.verifier_name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {row.verified_at}
                          </p>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10.5px] font-semibold bg-red-50 text-red-600 border border-red-200">
                          {row.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(row);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Bukti"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada rekaman pelanggaran yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginasi Tabel Terintegrasi (Revisi Item 7) */}
            <div className="py-4 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <p>
                  Menampilkan{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredRows.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}{" "}
                    –{" "}
                    {Math.min(currentPage * pageSize, filteredRows.length)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredRows.length}
                  </span>{" "}
                  rekaman terverifikasi
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
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Sebelumnya
                </button>

                {Array.from({
                  length: Math.ceil(filteredRows.length / pageSize) || 1,
                })
                  .slice(0, 5)
                  .map((_, idx) => {
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
                    (Math.ceil(filteredRows.length / pageSize) || 1)
                  }
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(filteredRows.length / pageSize) || 1, p + 1)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODAL DETAIL INSIDEN REKAP
          ========================================================================= */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base font-mono">
                    Detail Pelanggaran {selectedIncident.track_id}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                    {selectedIncident.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedIncident.camera_name} • {selectedIncident.waktu_wib}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    NOMOR PLAT POLISI
                  </span>
                  <span className="text-base font-mono font-black text-slate-900 mt-1 block">
                    {selectedIncident.plate_number}
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                    {selectedIncident.plate_color}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DURASI HENTI DI ROI
                  </span>
                  <span className="text-base font-mono font-black text-red-600 mt-1 block">
                    {selectedIncident.duration_display}
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                    Batas Maksimal: 60 Detik
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ALASAN PELANGGARAN
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedIncident.reason}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    CATATAN PETUGAS LAPANGAN
                  </span>
                  <p className="text-slate-600 mt-0.5">
                    {selectedIncident.notes}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Diverifikasi oleh: <strong className="text-slate-700">{selectedIncident.verifier_name}</strong></span>
                  <span>{selectedIncident.verified_at}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/events")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  <span>Buka di Menu Verifikasi</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

