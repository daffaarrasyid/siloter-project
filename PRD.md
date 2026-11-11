# Product Requirements Document (PRD)

> **Project:** SILOTER: Sistem Informasi dan Deteksi *Loitering* Angkutan Umum Terpadu
> **Version:** 1.0.0
> **Status:** Active
> **Last Updated:** 11 November 2026

---

# 1. Product Overview

## 1.1 Product Name

SILOTER: Sistem Informasi dan Deteksi *Loitering* Angkutan Umum Terpadu

## 1.2 One-Line Description

Platform pemantauan lalu lintas cerdas berbasis *Computer Vision* (YOLOv26n & YOLOv8) dan *Multi-Object Tracking* yang mendeteksi, mencatat, dan memvisualisasikan pelanggaran angkot *ngetem* (*loitering*) secara *real-time* di kawasan Bogor Trade Mall (BTM).

## 1.3 Problem Statement

Proyek ini dikembangkan karena:

* Perilaku angkutan umum (angkot) yang berhenti sembarangan dalam durasi lama (*loitering* / *ngetem*) di bahu jalan kawasan simpul komersial Bogor Trade Mall (BTM) menyebabkan penyempitan kapasitas jalan (*bottleneck*) dan kemacetan parah, terutama pada jam krusial.
* Pemantauan manual oleh petugas melalui layar monitor CCTV tidak efisien untuk pengawasan berkelanjutan, membutuhkan banyak sumber daya manusia, dan rentan terhadap kelalaian akibat kelelahan visual (*visual fatigue*).
* Sistem deteksi parkir liar (*illegal parking*) konvensional gagal menangani karakteristik unik angkot yang sering maju merayap perlahan (*micro-movement*) untuk mencari penumpang serta berada pada kondisi saling menutupi (*heavy occlusion*) yang ekstrem.

## 1.4 Target Users

Primary users:

* **Petugas Dishub / Operator Ruang Kontrol**: Pengguna terautentikasi yang memantau layar *live stream* CCTV, menerima peringatan (*alert*) pelanggaran secara *real-time*, dan menindaklanjuti bukti tangkapan layar (*auto-capture*).

Secondary users:

* **System Administrator / Analis Lalu Lintas**: Pengelola sistem yang bertugas mengonfigurasi poligon *Region of Interest* (ROI), mengatur ambang batas waktu (*threshold*), mengganti arsitektur model aktif (YOLOv26n vs YOLOv8), serta mengevaluasi grafik analitik jam rawan kemacetan.

## 1.5 Product Goal

The primary goal of this product is:

> Mengotomatisasi pengawasan dan penindakan perilaku *loitering* angkutan umum di kawasan Bogor Trade Mall melalui integrasi deteksi objek waktu nyata dan dasbor analitik berbasis web guna mendukung penguraian kemacetan secara terukur.

---

# 2. Product Scope

## 2.1 In Scope

The current product scope includes:

* Akuisisi aliran video *live streaming* berprotokol HTTP Live Streaming (HLS / `.m3u8`) dari portal Bogor Single Window (BSW) pada 3 titik kamera Jl. Djuanda (arah Empang, Surken, dan Balaikota) dengan ekstraksi konstan 1 *frame* per detik (1 FPS).
* Integrasi mesin *Computer Vision* dengan dukungan komparasi dua model deteksi objek (**YOLOv26n** sebagai model utama *end-to-end NMS-free* dan **YOLOv8** sebagai model *baseline* pembanding) yang dilatih dari dataset anotasi CVAT.
* Pelacakan identitas unik kendaraan (*Multi-Object Tracking*) menggunakan **ByteTrack** untuk mempertahankan ID angkot saat terjadi oklusi maupun pergerakan merayap (*micro-movement*).
* Evaluasi spasial-temporal menggunakan poligon virtual *Region of Interest* (ROI) dan perhitungan akumulasi durasi berhenti terhadap ambang batas waktu (*threshold* 60–120 detik).
* Eksekusi *Auto-Capture* bukti foto pelanggaran beranotasi, pencatatan log otomatis ke basis data (Supabase), dan pengiriman notifikasi instan via WebSockets.
* Dashboard web interaktif berbasis Next.js yang menyajikan *Live Stream Monitor*, tabel riwayat pelanggaran, grafik *Time-Series* jam rawan, serta komparasi pelanggaran antartitik kamera dan performa model.

## 2.2 Out of Scope

The following are explicitly outside the current scope:

* Pembacaan dan pengenalan pelat nomor kendaraan secara otomatis (*Automatic Number Plate Recognition* / ANPR).
* Integrasi langsung dengan sistem tilang elektronik kepolisian (ETLE) atau penagihan denda finansial.
* Pemrosesan seluruh titik kamera CCTV se-Kota Bogor secara serentak (cakupan dikunci pada 3 titik strategis di kawasan Bogor Trade Mall).
* Pelatihan ulang model (*model retraining*) secara langsung dari antarmuka web pengguna.

**Agents MUST NOT implement out-of-scope functionality unless explicitly instructed by the user.**

---

# 3. Core Features

## 3.1 Akuisisi Stream & Deteksi-Pelacakan Multi-Model (FR-01, FR-02, FR-04, FR-05)

**Purpose**

Menarik umpan video CCTV secara efisien tanpa membebani server pemerintah dan mendeteksi serta mempertahankan identitas setiap angkot di tengah kepadatan lalu lintas.

**User Story**

> As a Petugas / Analis, I want to melihat tayangan CCTV yang sudah dilengkapi *bounding box*, ID unik angkot, dan pilihan model deteksi (YOLOv26n / YOLOv8), so that saya dapat memantau pergerakan setiap angkot secara akurat meskipun kondisi jalan sedang padat.

**Requirements**

* Sistem terhubung ke aliran HLS (`.m3u8`) portal BSW menggunakan OpenCV dan mengekstrak tepat 1 *frame* per detik (1 FPS).
* Sistem menyediakan mekanisme *auto-reconnect* apabila sesi jaringan BSW terputus.
* Sistem menjalankan inferensi deteksi objek menggunakan **YOLOv26n** (atau **YOLOv8** saat mode komparasi diaktifkan) yang diintegrasikan dengan pelacak **ByteTrack**.

**Acceptance Criteria**

* [ ] Aliran video berhasil diekstraksi pada kecepatan stabil 1 FPS tanpa memicu pemblokiran IP dari server BSW.
* [ ] Setiap objek angkot yang terdeteksi memiliki *bounding box* dan atribut `track_id` unik (misal: `Angkot_04`).
* [ ] Pengguna dapat beralih antara model `YOLOv26n` dan `YOLOv8` melalui pengaturan sistem tanpa menghentikan *server backend*.

---

## 3.2 Evaluasi Spasial-Temporal ROI & Toleransi *Micro-Movement* (FR-06, FR-07)

**Purpose**

Menghitung durasi angkot yang berhenti di zona terlarang secara presisi tanpa terganggu oleh pergerakan merayap kecil.

**User Story**

> As a System Administrator, I want to menetapkan batas poligon area terlarang (*Region of Interest*) dan batas waktu *threshold*, so that sistem hanya menghitung durasi angkot yang benar-benar *ngetem* di bahu jalan terlarang.

**Requirements**

* Sistem memetakan koordinat poligon ROI pada *frame* masing-masing kamera CCTV (Empang, Surken, Balaikota).
* Sistem mengecek apakah titik tengah bawah (*bottom-center*) dari *bounding box* angkot berada di dalam poligon ROI.
* Sistem menerapkan toleransi perpindahan piksel (*micro-movement*) agar *timer* tidak ter-reset ke nol saat angkot maju merayap perlahan di dalam zona ROI.

**Acceptance Criteria**

* [ ] Setiap *frame* (1 detik) di mana ID angkot berada di dalam ROI akan menambah akumulasi durasi stasioner sebesar $+1\text{ detik}$.
* [ ] Pergerakan merayap di bawah batas toleransi piksel di dalam ROI tidak mengulang perhitungan waktu dari awal.
* [ ] Warna *bounding box* pada layar berubah dari hijau/kuning menjadi merah ketika durasi melampaui nilai *threshold* ($T_{max}$).

---

## 3.3 Pemicu Peringatan Real-Time & Auto-Capture Bukti (FR-08, FR-09)

**Purpose**

Memberikan peringatan instan kepada petugas dan mengamankan bukti visual yang sah saat terjadi pelanggaran batas waktu berhenti.

**User Story**

> As a Petugas Dishub, I want to menerima notifikasi peringatan seketika beserta bukti foto tangkapan layar saat ada angkot yang melampaui waktu *threshold*, so that saya dapat segera melakukan tindakan penertiban yang tervalidasi.

**Requirements**

* Saat akumulasi waktu stasioner ($D_{id}$) menyentuh angka *threshold* (60–120 detik), *backend* otomatis mengeksekusi *Auto-Capture* pada *frame* beranotasi saat itu.
* File bukti foto (`.jpg`) diunggah ke Supabase Storage dan metadata kejadian disimpan ke tabel PostgreSQL Supabase.
* *Backend* memancarkan sinyal peringatan melalui WebSocket ke *frontend* Next.js untuk memicu *pop-up alert* dan memperbarui tabel riwayat.

**Acceptance Criteria**

* [ ] Satu ID angkot pada satu siklus *loitering* hanya memicu satu kali *Auto-Capture* (tidak menduplikasi foto setiap detik setelah melewati *threshold*).
* [ ] Bukti foto menampilkan *bounding box* merah, ID angkot, durasi berhenti, dan *timestamp*.
* [ ] Notifikasi muncul di layar dasbor web dengan latensi maksimal 5 detik sejak pelanggaran terdeteksi.

---

## 3.4 Dashboard Analitik & Komparasi (FR-09)

**Purpose**

Menyajikan wawasan berbasis data mengenai pola waktu rawan kemacetan, titik lokasi terpadat, dan perbandingan kinerja model AI.

**User Story**

> As a Analis Lalu Lintas, I want to melihat grafik tren pelanggaran per jam, perbandingan lokasi kamera, dan metrik kecepatan inferensi model, so that saya dapat menyusun kebijakan penertiban yang tepat sasaran dan memvalidasi keandalan sistem.

**Requirements**

* Menyediakan grafik *Time-Series Activity* untuk memetakan fluktuasi jumlah pelanggaran berdasarkan jam operasional (*rush hour* pagi, *off-peak* siang, *rush hour* sore, dan akhir pekan).
* Menyediakan grafik perbandingan jumlah insiden *loitering* antara titik CCTV arah Empang, Surken, dan Balaikota.
* Menampilkan metrik komparasi kecepatan inferensi (ms/*frame*) antara model YOLOv26n dan YOLOv8.

**Acceptance Criteria**

* [ ] Grafik analitik dapat difilter berdasarkan rentang tanggal, titik kamera, dan model yang digunakan.
* [ ] Tabel riwayat bukti pelanggaran mendukung fitur pencarian, penyortiran waktu, dan pratinjau gambar (*modal preview*).

---

# 4. User Flows

## 4.1 Alur Pemantauan & Penanganan Pelanggaran (Petugas / Operator)

```text
[Mulai: Buka Web SILOTER (Next.js)]
   ↓
[Sudah Login?]
  ↙ (Tidak)                 ↘ (Ya)
[Halaman Login Supabase]      ↓
  ↓                           ↓
[Validasi Kredensial] →→→→→ [Dashboard Utama SILOTER]
                              ↓
[Pilih Titik Kamera CCTV: Empang / Surken / Balaikota]
   ↓
[Tampilkan Live Stream MJPEG Beranotasi + Status Koneksi]
   ↓
[Sistem Memantau Objek di Dalam Poligon ROI (1 FPS)]
   ↓
[Apakah Durasi Angkot (D_id) >= Threshold (T_max)?]
  ↙ (Tidak)                                ↘ (Ya, Pelanggaran!)
[Tampilkan Bounding Box Hijau/Kuning]        ↓
  ↓                                        [Backend: Eksekusi Auto-Capture (.jpg)]
  ↑←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←     ↓
                                           [Simpan ke Supabase Storage & PostgreSQL]
                                             ↓
                                           [Kirim Sinyal via WebSocket ke Next.js]
                                             ↓
                                           [Munculkan Toast Alert Merah & Suara di Web]
                                             ↓
                                           [Update Baris Teratas Tabel Riwayat Pelanggaran]
                                             ↓
                                           [Petugas Klik Bukti Foto untuk Validasi/Tindakan]
                                             ↓
                                           [Selesai]
```

## 4.2 Alur Konfigurasi Parameter & Komparasi Model (Administrator)

```text
[Mulai: Masuk ke Menu Pengaturan & Analitik]
   ↓
[Pilih Pengaturan Kamera / Model]
   ↓
[Ingin Ubah Parameter Apa?]
  ├─→ (Ubah Model AI) → [Pilih YOLOv26n atau YOLOv8] → [POST /api/config/model]
  │                                                       ↓
  │                                              [FastAPI Muat Bobot .pt Terpilih]
  │
  └─→ (Ubah ROI / Threshold) → [Sesuaikan Koordinat Poligon / Detik Threshold]
                                  ↓
                               [Simpan ke Tabel camera_configs di Supabase]
   ↓
[Buka Halaman Analitik]
   ↓
[Tampilkan Grafik Time-Series Jam Rawan & Leaderboard 3 Titik CCTV]
   ↓
[Tampilkan Statistik Komparasi Performa Inferensi YOLOv26n vs YOLOv8]
   ↓
[Selesai]
```

---

# 5. Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | **Koneksi Stream CCTV**: Sistem terhubung ke aliran *live streaming* portal BSW Kota Bogor menggunakan protokol HLS (`.m3u8`). | Must |
| FR-02 | **Ekstraksi Frame Berkala**: Sistem mengekstrak tepat 1 *frame* video setiap detik (1 FPS) menggunakan OpenCV untuk efisiensi komputasi. | Must |
| FR-03 | **Pemulihan Koneksi (*Auto-Reconnect*)**: Sistem menyambungkan ulang aliran video secara otomatis apabila sesi jaringan terputus. | Should |
| FR-04 | **Deteksi Objek Multi-Model**: Sistem mendeteksi keberadaan objek angkot menggunakan model **YOLOv26n** (utama) atau **YOLOv8** (pembanding) serta menampilkan *bounding box*. | Must |
| FR-05 | **Pelacakan ID Unik**: Sistem mempertahankan ID unik setiap angkot menggunakan algoritma **ByteTrack** saat terjadi oklusi maupun *micro-movement*. | Must |
| FR-06 | **Konfigurasi ROI & Threshold**: Sistem menyediakan fitur penetapan poligon *Region of Interest* (ROI) dan ambang batas waktu pada area dilarang berhenti. | Must |
| FR-07 | **Kalkulasi Waktu Stasioner**: Sistem menghitung akumulasi durasi berhenti setiap ID angkot yang berada di dalam poligon ROI. | Must |
| FR-08 | **Pemicu Peringatan & Auto-Capture**: Sistem mencatat log pelanggaran ke *database*, mengunggah foto bukti (*auto-capture*), dan memicu sinyal WebSocket saat durasi melampaui *threshold*. | Must |
| FR-09 | **Visualisasi Dashboard & Analitik**: Sistem menampilkan *live monitor*, tabel riwayat pelanggaran, bukti foto, dan grafik analitik *real-time* pada aplikasi web Next.js. | Must |
| FR-10 | **Autentikasi Pengguna**: Sistem membatasi akses dasbor dan halaman konfigurasi menggunakan autentikasi *login* petugas/admin. | Should |

---

# 6. Non-Functional Requirements

## Kinerja (Performance)

* **NFR-01**: Pemrosesan inferensi deteksi (YOLOv26n/YOLOv8) dan pelacakan objek (ByteTrack) wajib berjalan stabil minimal pada kecepatan 1 hingga 3 FPS per aliran kamera.
* **NFR-03**: Waktu tunda (*latency*) antara tercapainya detik pelanggaran di *backend* hingga munculnya notifikasi peringatan pada dasbor web Next.js maksimal 5 detik.
* Avoid unnecessary API requests.
* Avoid unnecessary rendering or computation.

## Keandalan (Reliability)

* **NFR-02**: Kegagalan koneksi atau habisnya masa berlaku *token* URL `.m3u8` pada satu titik CCTV (misal: arah Empang) tidak boleh menyebabkan penghentian (*crash*) pada pemrosesan titik CCTV lainnya (Surken dan Balaikota).
* Sistem mencegah duplikasi pencatatan log untuk `track_id` yang sama selama kendaraan tersebut belum keluar dari zona ROI.

## Keamanan & Kepatuhan Infrastruktur (Security & Compliance)

* **NFR-04**: Penarikan *stream* dari portal BSW diatur secara wajar (*throttled* pada 1 FPS) agar tidak membebani *bandwidth* peladen Diskominfo Kota Bogor dan mencegah pemblokiran alamat IP (*DDoS-like behavior*).
* Endpoint konfigurasi sistem dan dasbor diproteksi menggunakan sesi autentikasi Supabase Auth (JWT).
* Validate user input.
* Never expose secrets or credentials in source code.

## Fleksibilitas & Kebergunaan (Maintainability & Usability)

* **NFR-05**: Parameter ambang batas waktu (*threshold* detik), titik koordinat poligon ROI, serta pemilihan bobot model aktif (`yolov26n_best.pt` / `yolov8_best.pt`) dapat diubah secara dinamis tanpa perlu melatih ulang model atau menulis ulang kode *pipeline* utama.
* Antarmuka dasbor dirancang dengan tata letak ruang kontrol (*control room UI*) yang jelas, kontras tinggi untuk indikator bahaya, dan responsif di layar monitor desktop maupun perangkat *mobile*.

---

# 7. Data Requirements

The product requires the following major data entities (dikelola pada PostgreSQL & Storage Supabase):

## Entitas Konfigurasi Kamera (`camera_configs`)

* `id` (UUID / Primary Key)
* `camera_name` (String: `Jl. Djuanda - Empang`, `Jl. Djuanda - Surken`, `Jl. Djuanda - Balaikota`)
* `stream_url` (Text: Tautan `.m3u8` aktif dari portal BSW)
* `resolution_info` (String: misal `1920x1080` untuk Djuanda, `704x576` untuk Balaikota)
* `roi_polygon` (JSONB: Array koordinat titik poligon `[[x1, y1], [x2, y2], ...]`)
* `threshold_seconds` (Integer: Default `60` hingga `120` detik)
* `is_active` (Boolean)

## Entitas Log Pelanggaran (`violation_logs`)

* `id` (UUID / Primary Key)
* `camera_id` (Foreign Key ke `camera_configs.id`)
* `vehicle_track_id` (String: ID unik dari ByteTrack, misal `Angkot_12`)
* `detected_at` (Timestamp with Time Zone: Waktu kejadian pelanggaran)
* `session_category` (Enum/String: `Rush Hour Pagi`, `Off-Peak Siang`, `Rush Hour Sore`, `Akhir Pekan`)
* `duration_seconds` (Integer: Total durasi stasioner saat terpicu)
* `model_used` (String: `YOLOv26n` atau `YOLOv8`)
* `inference_Speed_ms` (Float: Kecepatan inferensi saat kejadian untuk data komparasi riset)
* `evidence_image_url` (Text: URL publik file `.jpg` di Supabase Storage)

## Entitas Pengguna (`users` via Supabase Auth)

* Kredensial akun petugas dan administrator (Email, Password Hash, Role: `admin` / `operator`).

---

# 8. Error & Edge Cases

The product must properly handle:

* **Kedaluwarsa Token Stream BSW**: Ketika tautan `.m3u8` dari portal BSW terputus atau mengalami *timeout*, *worker thread* kamera terkait harus masuk ke status *Reconnecting* (dengan *exponential backoff*) dan mengirimkan indikator status "Stream Offline / Reconnecting" ke UI Next.js tanpa mematikan *thread* kamera lain.
* **Perbedaan Resolusi Kamera Ekstrem**: Kamera Balaikota memiliki resolusi lebih rendah ($\approx 704\text{ px}$) dibanding kamera Djuanda ($\approx 1920\text{ px}$). Koordinat poligon ROI wajib dinormalisasi (skala $0.0 - 1.0$) atau disesuaikan dengan dimensi asli *frame* masing-masing kamera agar pengecekan titik *centroid* tidak meleset.
* **Oklusi Sesaat (*Temporary Occlusion*)**: Apabila angkot yang sedang *ngetem* tertutup oleh bus atau kendaraan besar selama beberapa detik, *buffer* memori pelacak (`track_buffer` pada ByteTrack) dan masa tenggang (*grace period* $\approx 3-5\text{ detik}$) di *backend* harus menahan penghapusan *timer* `track_id` tersebut.
* **Pergerakan Merayap (*Micro-Movement*)**: Jika angkot bergeser maju perlahan di dalam poligon ROI untuk mencari penumpang, selama titik *bottom-center* *bounding box* masih berada di dalam poligon ROI, akumulasi *timer* tetap dilanjutkan (tidak di-reset).
* **Pencegahan Spam Auto-Capture**: Setelah sebuah `track_id` melampaui *threshold* (misal detik ke-60) dan telah di-*capture*, sistem menandai bendera `is_captured = True` pada memori ID tersebut sehingga tidak memotret ulang di detik ke-61, 62, dst.

---

# 9. UX Principles

The product should feel:

* **Real-Time & Actionable**: Layaknya dasbor *Command Center* modern; petugas dapat langsung mengenali situasi normal (indikator hijau) dan situasi pelanggaran aktif (indikator merah berkedip disertai bunyi peringatan).
* **Transparan secara Visual**: Setiap bukti pelanggaran yang tercatat di tabel riwayat wajib dapat diverifikasi langsung melalui foto *Auto-Capture* yang menampilkan *bounding box* dan *overlay* durasi waktu.
* **Siap untuk Demonstrasi Akademis**: Memudahkan beralih tampilan antara model utama (**YOLOv26n**) dan model pembanding (**YOLOv8**) secara mulus untuk keperluan pengujian dan presentasi hasil riset.

---

# 10. Success Criteria

The product is considered successful when:

* Sistem mampu mengekstraksi, mendeteksi, dan melacak objek angkot pada 3 titik CCTV kawasan BTM secara stabil pada kecepatan minimal 1–3 FPS.
* Logika spasial-temporal berhasil membedakan angkot yang sekadar melintas/antre singkat dengan angkot yang melakukan *loitering* ($\ge 60\text{ detik}$), termasuk saat terjadi *micro-movement*.
* Fitur *Auto-Capture* dan notifikasi *real-time* tampil pada dasbor Next.js dengan waktu tunda di bawah 5 detik.
* Dasbor menyajikan data komparasi yang valid antara arsitektur **YOLOv26n** dan **YOLOv8** (mendukung penulisan Bab IV *Results and Discussion* pada artikel jurnal JICT).
* Seluruh *deliverables* perangkat lunak dan dokumentasi pengujian selesai sebelum tenggat waktu akhir pada **22 November 2026**.

---

# 11. Constraints

The project has the following constraints:

* **Technology Constraint**:
  * **Frontend**: Next.js (React, TypeScript), Tailwind CSS, shadcn/ui, Recharts.
  * **Backend & AI Engine**: Python FastAPI, Ultralytics (YOLOv26n & YOLOv8), ByteTrack, OpenCV, Supervision.
  * **Database & Cloud Storage**: Supabase (PostgreSQL, Storage Bucket, Auth).
  * **Annotation Tool**: CVAT (Computer Vision Annotation Tool) dengan dataset 2.043 *frame* berlabel kendaraan + 3 *frame* negatif.
* **Infrastructure & Fair-Use Constraint**: Penarikan aliran video dari portal publik pemerintah (`bsw.kotabogor.go.id`) wajib dibatasi pada 1 FPS dan maksimal 3 kamera aktif agar tidak dianggap sebagai serangan anomali trafik (DDoS) oleh Diskominfo Kota Bogor.
* **Time Constraint**: Seluruh integrasi sistem web dan pengujian model wajib rampung sebelum batas akhir proyek pada **23 November 2026**.

---

# 12. Open Questions

Items that are not yet decided:

* **Hosting & Deployment Environment**: Apakah *backend* FastAPI yang menjalankan inferensi model YOLO akan di-*deploy* pada *cloud server* dengan dukungan GPU, atau dijalankan secara lokal (*on-premise* / laptop tim menggunakan *tunneling* seperti Ngrok/Cloudflare Tunnel) yang dihubungkan ke *frontend* Next.js (Vercel) dan Supabase saat sesi *live demo*?
* **Simulasi Fallback Stream**: Mengingat URL `.m3u8` dari BSW kadang mengalami perubahan *session token* atau kondisi malam/hujan yang sepi saat jam presentasi penguji, apakah kita akan menyediakan mode **"Simulasi Rekaman Video Lokal (.mp4)"** di *dashboard* sebagai *fallback* apabila koneksi ke server BSW sedang bermasalah saat *live demo*?

Agents MUST NOT make major product decisions based on assumptions when an open question affects architecture, security, data, or core user flow.

---

# 13. Change Log

| Version | Date | Change |
| --- | --- | --- |
| 1.0.0 | 11 November 2026 | Pembuatan dokumen PRD perdana SILOTER berdasarkan spesifikasi kebutuhan fungsional/non-fungsional jurnal JICT, karakteristik dataset CVAT 3 titik CCTV BTM, serta arsitektur Next.js + FastAPI + Supabase + Dual-Model (YOLOv26n & YOLOv8). |