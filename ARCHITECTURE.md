# SILOTER --- System Architecture

> Dokumen ini menjadi acuan teknis pengembangan SILOTER: sistem
> pemantauan aktivitas berhenti/mengetem angkutan umum berbasis CCTV
> untuk mendukung petugas Dishub Kota Bogor.

## 1. Ringkasan Sistem

SILOTER menggunakan arsitektur terpisah antara frontend, backend,
layanan AI, dan penyimpanan data.

-   **Frontend:** Next.js App Router, React, dan TypeScript untuk
    dashboard Command Center.
-   **Backend:** FastAPI untuk REST API, WebSocket, pengelolaan stream,
    dan orkestrasi inferensi.
-   **Computer Vision:** Ultralytics YOLOv26n dan YOLOv8 sebagai model
    pembanding, dengan ByteTrack untuk pelacakan objek.
-   **Data & Storage:** Supabase PostgreSQL, Supabase Auth, dan Supabase
    Storage.
-   **Sumber video:** CCTV Bogor Single Window (BSW) melalui HLS
    (`.m3u8`), dengan video lokal sebagai fallback pengujian.

Arsitektur dirancang agar pemrosesan video berlangsung di backend.
Browser hanya menampilkan stream hasil anotasi dan berinteraksi dengan
API.

## 2. Architecture Diagram

``` mermaid
flowchart TD
    Operator([Petugas Dishub / Admin])
    BSW[(Portal CCTV BSW\nHLS .m3u8)]

    subgraph Frontend[Presentation Layer — Next.js]
        UI[React UI / shadcn-ui]
        Player[MJPEG Live Stream Viewer]
        ROI[ROI Polygon Editor]
        Charts[Analytics & Report Export]
        WSClient[WebSocket Client]
    end

    subgraph Backend[Application & AI Layer — FastAPI]
        API[REST API]
        WSHub[WebSocket Manager]
        Worker[Stream Worker\nFrame Sampling & Reconnect]
        Models[YOLOv26n / YOLOv8 + ByteTrack]
        Rules[ROI & Loitering Rule Engine]
        Capture[Evidence Capture]
    end

    subgraph Supabase[Data & Storage Layer]
        Auth[(Supabase Auth)]
        DB[(PostgreSQL)]
        Storage[(Supabase Storage)]
    end

    BSW --> Worker
    Worker --> Models
    Models --> Rules
    Rules --> Player
    Rules --> WSHub
    Rules --> Capture
    Capture --> Storage
    Rules --> DB
    Operator --> UI
    UI <--> API
    UI <--> Auth
    API <--> DB
    API <--> Storage
    WSHub -.-> WSClient
```

## 3. Architecture Principles

1.  **Separation of concerns:** frontend menangani tampilan dan
    interaksi; backend menangani stream, inferensi, tracking, dan aturan
    deteksi.
2.  **Camera isolation:** setiap kamera diproses secara independen.
    Gangguan pada satu stream tidak boleh menghentikan kamera lain.
3.  **Controlled stream ingestion:** pengambilan frame dari sumber CCTV
    dibatasi sesuai konfigurasi sampling, dengan target awal 1 FPS dan
    maksimal tiga kamera aktif.
4.  **Configurable detection:** model YOLO, ROI, dan threshold dapat
    dikonfigurasi tanpa mengubah alur utama pipeline.
5.  **Reliable event timing:** durasi berhenti dihitung menggunakan
    timestamp/waktu aktual, bukan asumsi bahwa setiap frame yang
    diproses selalu berjarak tepat satu detik.
6.  **Human-in-the-loop:** event yang terdeteksi berstatus `Pending`
    sampai diverifikasi petugas.
7.  **Secure credentials:** secret dan service-role key hanya berada di
    backend atau environment server yang terlindungi.

## 4. Technology Stack

### Frontend --- `frontend/`

  Area            Teknologi
  --------------- ---------------------------------------
  Framework       Next.js App Router, React, TypeScript
  Styling & UI    Tailwind CSS, shadcn/ui, Lucide
  Data fetching   TanStack Query atau SWR
  Real-time       Native WebSocket API
  Charts          Recharts
  Export          `xlsx` dan `jspdf`

### Backend & AI --- `backend/`

  Area               Teknologi
  ------------------ -------------------------------------------
  API framework      FastAPI
  ASGI server        Uvicorn
  Computer vision    OpenCV, NumPy
  Object detection   Ultralytics YOLOv26n dan YOLOv8
  Object tracking    ByteTrack melalui Ultralytics
  Validation         Pydantic
  Streaming          FastAPI `StreamingResponse` dan WebSocket

### Data & External Services

-   **Database:** Supabase PostgreSQL.
-   **Authentication:** Supabase Auth dengan verifikasi JWT pada
    backend.
-   **Object storage:** Supabase Storage untuk foto bukti.
-   **Video source:** BSW HLS stream.
-   **Fallback source:** file MP4 lokal untuk pengujian dan demonstrasi.

> Versi paket, kompatibilitas model, dan kebutuhan perangkat keras harus
> dikunci serta diuji pada `requirements.txt` dan konfigurasi
> deployment.

## 5. Repository Structure

Struktur berikut merupakan target struktur proyek. Folder atau file yang
belum dibuat dapat ditambahkan secara bertahap sesuai kebutuhan
implementasi.

``` text
siloter-project/
├── .gitignore
├── AGENTS.md
├── ARCHITECTURE.md
├── PRD.md
├── README.md
│
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── requirements.txt
│   ├── main.py
│   ├── models/
│   │   ├── yolov26n_best.pt
│   │   ├── yolov8_best.pt
│   │   └── bytetrack.yaml
│   ├── data_fallback/
│   │   ├── empang_sample.mp4
│   │   ├── surken_sample.mp4
│   │   └── balaikota_sample.mp4
│   └── app/
│       ├── __init__.py
│       ├── core/
│       │   ├── config.py
│       │   └── supabase_client.py
│       ├── api/
│       │   ├── routes_cameras.py
│       │   ├── routes_stream.py
│       │   ├── routes_events.py
│       │   ├── routes_analytics.py
│       │   └── websocket.py
│       ├── services/
│       │   ├── stream_manager.py
│       │   ├── detector_tracker.py
│       │   ├── loitering_engine.py
│       │   └── capture_logger.py
│       └── schemas/
│           └── payload_schemas.py
│
└── frontend/
    ├── .env.local
    ├── package.json
    ├── package-lock.json
    ├── components.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── login/
    │   │   └── page.tsx
    │   ├── onboarding/
    │   │   └── page.tsx
    │   └── (dashboard)/
    │       ├── layout.tsx
    │       ├── dashboard/
    │       │   └── page.tsx
    │       ├── events/
    │       │   ├── page.tsx
    │       │   └── [id]/
    │       │       └── page.tsx
    │       ├── analytics/
    │       │   └── page.tsx
    │       ├── reports/
    │       │   └── page.tsx
    │       └── settings/
    │           └── page.tsx
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── cctv/
    │   ├── events/
    │   └── analytics/
    ├── hooks/
    │   ├── useWebSocketAlerts.ts
    │   └── useCameraConfig.ts
    ├── lib/
    │   ├── utils.ts
    │   ├── api-client.ts
    │   ├── supabase.ts
    │   └── export-utils.ts
    └── public/
```

**Catatan repository:**

-   Simpan `AGENTS.md`, `PRD.md`, dan `ARCHITECTURE.md` di root agar
    tidak ada dokumen instruksi yang duplikat.
-   `venv/`, `.env`, cache Python, hasil capture sementara, dan file
    video besar tidak boleh masuk Git.
-   File bobot `.pt` dan video fallback sebaiknya dikelola melalui
    penyimpanan artefak atau mekanisme berbagi tim, bukan dipaksakan ke
    repository jika ukurannya besar.
-   `frontend/.env.local` hanya berisi variabel yang memang boleh
    digunakan client. Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`
    di frontend.

## 6. System Layers

### 6.1 Presentation Layer

Next.js menyediakan halaman dan komponen untuk:

-   Login petugas.
-   Onboarding pemilihan kamera, pengaturan ROI, dan threshold.
-   Dashboard pemantauan CCTV dan status kamera.
-   Alert serta detail event.
-   Riwayat event dan validasi.
-   Analitik dan unduh laporan.

Frontend menampilkan stream MJPEG dari backend melalui elemen `<img>`,
menerima notifikasi melalui WebSocket, dan menggunakan REST API untuk
operasi data.

### 6.2 Application & AI Layer

FastAPI bertanggung jawab untuk:

-   Menyediakan REST API dan WebSocket.
-   Mengelola worker stream untuk setiap kamera.
-   Mengambil frame sesuai interval sampling.
-   Menjalankan deteksi YOLO dan tracking ByteTrack.
-   Mengevaluasi ROI dan durasi berhenti.
-   Mengirim frame beranotasi.
-   Membuat bukti foto dan menyimpan event.

### 6.3 Data & Storage Layer

Supabase menyimpan profil pengguna, konfigurasi kamera, event
pelanggaran, dan file bukti. Backend menjadi pihak yang mengakses
operasi sensitif dan memvalidasi otorisasi.

## 7. Frontend Architecture

### 7.1 Page Flow

1.  **Root (`/`):** memeriksa sesi pengguna dan mengarahkan ke login
    atau dashboard.
2.  **Login (`/login`):** autentikasi petugas melalui Supabase Auth.
3.  **Onboarding (`/onboarding`):** memilih kamera, menggambar ROI, dan
    menentukan threshold jika konfigurasi belum tersedia.
4.  **Dashboard (`/dashboard`):** menampilkan status kamera, live
    stream, ringkasan deteksi, dan alert aktif.
5.  **Event detail (`/events/[id]`):** menampilkan foto bukti, kamera,
    waktu, durasi, model, dan tindakan validasi.
6.  **Event history (`/events`):** menampilkan tabel event dengan filter
    tanggal, kamera, dan status.
7.  **Analytics (`/analytics`):** menampilkan statistik waktu dan
    perbandingan antarkamera/model.
8.  **Reports (`/reports`):** menyediakan ekspor data ke Excel atau PDF.
9.  **Settings (`/settings`):** mengelola ROI, threshold, dan model
    aktif sesuai hak akses.

### 7.2 Live Stream

Backend menyediakan endpoint MJPEG. Frontend menampilkan URL endpoint
tersebut menggunakan elemen `<img>`. Jika koneksi terputus, komponen
menampilkan status kamera dan opsi mencoba kembali.

### 7.3 State & Data Fetching

-   TanStack Query atau SWR digunakan untuk data REST, cache, dan
    revalidation.
-   `useWebSocketAlerts` menangani pesan alert real-time.
-   `useCameraConfig` mengelola konfigurasi kamera dan ROI di sisi
    frontend.
-   Status autentikasi mengikuti sesi Supabase dan pemeriksaan otorisasi
    backend.

## 8. Backend & Computer Vision Architecture

### 8.1 Stream Manager

`stream_manager.py` mengelola koneksi stream per kamera.

Tanggung jawab:

-   Membaca stream HLS atau file MP4 fallback.
-   Mengambil frame sesuai target sampling awal 1 FPS.
-   Menyimpan status koneksi setiap kamera.
-   Melakukan reconnect dengan exponential backoff.
-   Mengisolasi error agar kamera lain tetap berjalan.

Sampling 1 FPS adalah target laju pemrosesan, bukan jaminan bahwa setiap
frame selalu tiba tepat satu detik. Perhitungan durasi harus menggunakan
timestamp aktual.

### 8.2 Dual-Model Registry

`detector_tracker.py` menyediakan antarmuka seragam untuk model:

-   `yolov26n`: model utama.
-   `yolov8`: model pembanding.

Pemilihan model dilakukan melalui konfigurasi backend. Pergantian model
harus dikelola secara aman agar tidak merusak inferensi yang sedang
berjalan. Implementasi awal dapat melakukan pergantian pada batas siklus
pemrosesan atau dengan memuat model pengganti sebelum mengganti
referensi model aktif.

### 8.3 Object Tracking

Tracking menggunakan ByteTrack melalui API Ultralytics. `track_id`
digunakan untuk menghubungkan deteksi objek antarkerangka.

Contoh pemanggilan perlu disesuaikan dengan versi Ultralytics yang
dikunci:

``` python
results = model.track(
    frame,
    persist=True,
    tracker="bytetrack.yaml"
)
```

ID tracking dapat berubah ketika objek hilang terlalu lama atau tracker
kehilangan identitasnya. Karena itu, `track_id` tidak boleh dianggap
sebagai identitas kendaraan permanen.

### 8.4 Loitering & ROI Engine

`loitering_engine.py` mengevaluasi apakah kendaraan berada di dalam area
ROI dan sudah berhenti/mengetem selama threshold yang ditentukan.

-   Gunakan titik **bottom-center** bounding box sebagai anchor posisi
    kendaraan.
-   Uji posisi anchor terhadap poligon ROI dengan
    `cv2.pointPolygonTest`.
-   Simpan waktu mulai teramati di ROI dan timestamp observasi terakhir.
-   Toleransi micro-movement ditentukan dengan ambang perpindahan atau
    aturan status gerak, bukan dengan menganggap semua pergerakan kecil
    sebagai kendaraan berhenti.
-   Terapkan occlusion grace period agar kehilangan deteksi singkat
    tidak langsung menghapus state kendaraan.
-   Akhiri atau reset sesi berdasarkan aturan keluar ROI, kehilangan
    objek melewati grace period, atau kondisi lain yang ditetapkan.

Rumus anchor:

\[ x\_{anchor} = `\frac{x_1 + x_2}{2}`{=tex}, `\qquad `{=tex}y\_{anchor}
= y_2 \]

Durasi sesi:

\[ duration = timestamp\_{current} - timestamp\_{start} \]

Event dibuat ketika durasi memenuhi threshold dan belum pernah dibuat
untuk sesi tracking tersebut.

### 8.5 Evidence Capture

`capture_logger.py` menangani:

-   Pembuatan foto bukti saat event dipicu.
-   Kompresi JPEG dengan kualitas yang dapat dikonfigurasi.
-   Upload ke Supabase Storage.
-   Penyimpanan URL/path file pada record event.
-   Pencegahan capture berulang untuk satu sesi pelanggaran.

Batas ukuran file perlu diuji pada resolusi dan kualitas aktual. Jangan
menganggap ukuran foto pasti di bawah 500 KB tanpa pengujian.

## 9. Database Architecture

Skema awal menggunakan tiga tabel inti.

### 9.1 `camera_configs`

  -----------------------------------------------------------------------
  Kolom                   Tipe                    Keterangan
  ----------------------- ----------------------- -----------------------
  `id`                    UUID, PK                ID konfigurasi kamera

  `camera_code`           TEXT, UNIQUE            `empang`, `surken`,
                                                  atau `balaikota`

  `camera_name`           TEXT                    Nama tampilan kamera

  `stream_url`            TEXT                    URL stream;
                                                  pertimbangkan
                                                  penyimpanan yang aman

  `resolution_width`      INTEGER                 Lebar frame sumber

  `resolution_height`     INTEGER                 Tinggi frame sumber

  `roi_polygon`           JSONB                   Koordinat ROI
                                                  ternormalisasi

  `threshold_seconds`     INTEGER                 Ambang durasi

  `is_configured`         BOOLEAN                 Status konfigurasi
  -----------------------------------------------------------------------

### 9.2 `violation_events`

  Kolom                 Tipe               Keterangan
  --------------------- ------------------ -------------------------------------
  `id`                  UUID, PK           ID event
  `camera_id`           UUID, FK           Referensi `camera_configs.id`
  `vehicle_track_id`    TEXT               ID tracking pada sesi tersebut
  `detected_at`         TIMESTAMPTZ        Waktu event terdeteksi
  `duration_seconds`    INTEGER            Durasi sesi saat event dibuat
  `model_used`          TEXT               Model yang digunakan
  `inference_ms`        DOUBLE PRECISION   Waktu inferensi
  `evidence_path`       TEXT               Path file pada Supabase Storage
  `validation_status`   TEXT               `Pending`, `Valid`, atau `Invalid`
  `validated_by`        UUID, FK           Referensi pengguna yang memvalidasi
  `validated_at`        TIMESTAMPTZ        Waktu validasi

Kategori waktu seperti rush hour sebaiknya diturunkan dari timestamp
atau disimpan sebagai atribut analitik dengan definisi yang konsisten.

### 9.3 `users_profile`

  Kolom                Tipe          Keterangan
  -------------------- ------------- ----------------------------
  `id`                 UUID, PK/FK   Mengacu ke `auth.users.id`
  `full_name`          TEXT          Nama petugas
  `role`               TEXT          `operator` atau `admin`
  `preferred_camera`   TEXT          Kamera pilihan awal

Terapkan foreign key, constraint, index, dan Row Level Security (RLS)
sesuai kebutuhan. Akses service-role dari backend harus dibatasi dan
tidak menggantikan pemeriksaan otorisasi aplikasi.

## 10. ROI Coordinate Architecture

Koordinat ROI disimpan secara ternormalisasi terhadap resolusi frame
asli agar tetap konsisten pada resolusi kamera yang berbeda.

\[ x\_{norm} = `\frac{x_{pixel}}{W}`{=tex}, `\qquad`{=tex} y\_{norm} =
`\frac{y_{pixel}}{H}`{=tex} \]

Konversi kembali ke koordinat frame:

\[ x\_{pixel} = x\_{norm} `\times `{=tex}W, `\qquad`{=tex} y\_{pixel} =
y\_{norm} `\times `{=tex}H \]

Ketentuan:

-   Nilai koordinat berada pada rentang 0 sampai 1.
-   Normalisasi menggunakan dimensi frame sumber, bukan ukuran elemen
    video di browser.
-   Frontend harus mengonversi koordinat canvas ke koordinat relatif
    terhadap area video yang sebenarnya, dengan memperhitungkan
    letterboxing/cropping.
-   Backend memvalidasi jumlah titik, rentang koordinat, dan bentuk
    poligon sebelum menyimpan konfigurasi.

## 11. Authentication & Authorization

-   Supabase Auth digunakan untuk login dan pengelolaan sesi.
-   Backend memverifikasi JWT pada endpoint yang memerlukan autentikasi.
-   **Operator:** melihat stream, menerima alert, melihat event,
    memvalidasi event, dan mengunduh laporan.
-   **Admin:** seluruh hak operator ditambah mengubah ROI, threshold,
    konfigurasi kamera, dan model aktif.
-   Terapkan pemeriksaan role di backend. Menyembunyikan tombol di
    frontend saja bukan mekanisme otorisasi.

## 12. API & Real-Time Communication

### 12.1 REST API

  -------------------------------------------------------------------------------------
  Method                  Endpoint                              Fungsi
  ----------------------- ------------------------------------- -----------------------
  `GET`                   `/api/cameras`                        Daftar kamera dan
                                                                status

  `GET`                   `/api/cameras/{camera_code}/config`   Mengambil konfigurasi
                                                                kamera

  `PUT`                   `/api/cameras/{camera_code}/config`   Memperbarui ROI dan
                                                                threshold

  `GET`                   `/api/stream/{camera_code}`           Stream MJPEG beranotasi

  `GET`                   `/api/events`                         Daftar event dan filter

  `GET`                   `/api/events/{event_id}`              Detail event

  `PATCH`                 `/api/events/{event_id}/validate`     Validasi event

  `GET`                   `/api/analytics/summary`              Data ringkasan analitik

  `POST`                  `/api/model/switch`                   Mengganti model aktif
  -------------------------------------------------------------------------------------

Endpoint dan payload final mengikuti implementasi serta skema Pydantic.
Endpoint yang mengubah konfigurasi atau status wajib memerlukan
autentikasi dan otorisasi.

### 12.2 WebSocket

-   **Endpoint:** `/ws/alerts`
-   Backend mengirim pesan ketika event baru dibuat.
-   Frontend menerima pesan dan memperbarui alert tanpa polling
    terus-menerus.
-   Payload minimal memuat `event_id`, `camera_code`, `detected_at`,
    `duration_seconds`, dan status event.
-   Target latensi alert di bawah 5 detik diukur dari event dipicu
    sampai diterima frontend, dengan kondisi jaringan dan server
    pengujian yang dicatat.

## 13. State Management

### Backend

State sementara per kamera dan `track_id` dapat memuat:

-   Timestamp awal sesi.
-   Timestamp deteksi terakhir.
-   Posisi anchor terakhir.
-   Status berada di ROI.
-   Status event/capture.
-   Informasi grace period.

State in-memory cocok untuk implementasi awal satu instance. Jika
backend dijalankan multi-worker atau multi-instance, state tracking
perlu dipusatkan atau dipastikan setiap kamera hanya ditangani satu
worker yang konsisten.

### Frontend

-   Cache data REST dikelola TanStack Query atau SWR.
-   Notifikasi real-time dikelola hook WebSocket.
-   Konfigurasi ROI dapat diedit secara lokal sebelum disimpan ke
    backend.
-   Status login dan role digunakan untuk mengatur navigasi, sementara
    otorisasi tetap ditegakkan backend.

## 14. Error Handling, Logging & Resilience

-   Setiap worker kamera memiliki siklus hidup dan penanganan error
    sendiri.
-   Reconnect menggunakan exponential backoff dengan batas maksimum
    jeda.
-   Status kamera setidaknya mencakup `connected`, `reconnecting`, dan
    `offline`.
-   API menggunakan kode HTTP yang sesuai, antara lain `401`, `403`,
    `404`, dan `422`.
-   Log memuat timestamp, camera code, komponen, level, dan ringkasan
    error.
-   Jangan mencatat secret, token, atau kredensial ke log.
-   Kegagalan upload bukti perlu dicatat dan ditangani agar event tidak
    diam-diam kehilangan referensi bukti.

## 15. Security

-   Simpan `SUPABASE_URL`, key server, dan URL stream privat di
    environment backend.
-   Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke browser atau
    repository.
-   Gunakan `.env.example` dengan nilai placeholder, bukan secret aktif.
-   Terapkan CORS dengan daftar origin frontend yang diizinkan.
-   Validasi input ROI, threshold, camera code, dan parameter filter.
-   Terapkan RLS pada tabel Supabase dan kebijakan akses bucket Storage.
-   Batasi akses endpoint konfigurasi dan pergantian model untuk admin.
-   Terapkan pembatasan laju dan kebijakan akses stream sesuai ketentuan
    sumber CCTV.

## 16. Performance Considerations

Target awal yang perlu divalidasi melalui pengujian:

-   Sampling stream: sekitar 1 FPS per kamera.
-   Kamera aktif: maksimal tiga kamera pada konfigurasi awal.
-   Pipeline deteksi dan tracking: mampu memproses laju sampling tanpa
    antrean frame yang terus bertambah.
-   Alert: diterima frontend kurang dari 5 detik setelah event dipicu.
-   Reconnect satu kamera tidak mengganggu kamera lain.

Kinerja aktual bergantung pada resolusi, codec, perangkat CPU/GPU,
jumlah kamera, dan implementasi decode HLS. Catat waktu decode,
inferensi, tracking, upload, dan pengiriman alert secara terpisah.

## 17. Testing Strategy

1.  **Model evaluation:** bandingkan YOLOv26n dan YOLOv8 menggunakan
    data test yang sama. Laporkan Precision, Recall, mAP@50, mAP@50--95,
    dan inference time.
2.  **Tracking evaluation:** uji konsistensi ID pada kendaraan yang
    saling menutupi, keluar-masuk frame, dan bergerak rapat.
3.  **ROI testing:** uji normalisasi koordinat pada resolusi kamera
    berbeda serta validasi poligon.
4.  **Loitering testing:** uji kendaraan diam, merayap, keluar ROI,
    tertutup sementara, dan kembali terdeteksi.
5.  **Integration testing:** uji REST API, Supabase, upload bukti,
    WebSocket, dan validasi event.
6.  **Resilience testing:** putuskan satu stream dan pastikan kamera
    lain tetap berjalan serta kamera yang terputus dapat reconnect.
7.  **Frontend testing:** uji login, role, onboarding, dashboard, event
    validation, filter, dan ekspor laporan.

Pastikan pembagian data train/validation/test tidak bocor antar-frame
dari video yang sama. Jumlah frame dan versi dataset harus dicatat dalam
laporan eksperimen.

## 18. Deployment & Environment

### Frontend

-   Deploy ke Vercel atau platform yang mendukung Next.js.
-   Atur root directory ke `frontend/`.
-   Isi environment variable frontend hanya dengan nilai yang memang
    aman untuk client, seperti URL API dan Supabase anon/publishable
    key.

### Backend

-   Jalankan pada mesin yang memenuhi kebutuhan inferensi, idealnya
    dengan GPU jika hasil pengujian menunjukkan CPU tidak mencukupi.
-   Jalankan dari direktori `backend/`.
-   Contoh perintah pengembangan:

``` bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

-   Untuk production, gunakan konfigurasi server yang sesuai dan
    nonaktifkan `--reload`.
-   Pastikan frontend dapat menjangkau backend melalui HTTPS/WSS pada
    deployment publik.

## 19. Dependency Policy

-   Gunakan Ultralytics untuk menjalankan model dan integrasi ByteTrack
    selama versi yang dipilih mendukung konfigurasi tersebut.
-   Kunci versi dependensi yang sudah diuji pada `requirements.txt` dan
    lockfile/package manager frontend.
-   Gunakan komponen shadcn/ui yang tersedia sebelum menambahkan library
    UI baru.
-   Hindari dependensi duplikat untuk fungsi yang sudah ditangani stack
    utama.
-   Uji kompatibilitas versi PyTorch, CUDA, OpenCV, dan Ultralytics pada
    environment target.

## 20. Architecture Decision Records

### ADR-001 --- Dual-Model Benchmarking

YOLOv26n dan YOLOv8 disediakan dalam satu pipeline agar keduanya dapat
diuji menggunakan dataset dan kondisi yang sebanding. Model aktif
ditentukan melalui konfigurasi backend.

### ADR-002 --- Human-in-the-Loop Validation

Event baru berstatus `Pending` dan dapat diverifikasi petugas menjadi
`Valid` atau `Invalid`. Mekanisme ini membantu mengukur false positive
dan menjaga kualitas data laporan.

### ADR-003 --- Controlled Frame Sampling

Sampling awal ditetapkan sekitar 1 FPS untuk membatasi beban pemrosesan
dan akses stream. Durasi berhenti tetap dihitung berdasarkan timestamp
aktual, bukan jumlah frame semata.

### ADR-004 --- Normalized ROI Coordinates

Koordinat ROI disimpan pada rentang 0--1 terhadap resolusi frame sumber
agar konfigurasi dapat digunakan pada tampilan frontend dan resolusi
kamera yang berbeda.

## 21. Architecture Change Policy

Perubahan pada stack utama, alur halaman, skema database, format
koordinat ROI, protokol komunikasi, atau pipeline deteksi harus:

1.  Memiliki alasan teknis yang jelas.
2.  Dievaluasi dampaknya terhadap frontend, backend, data, dan
    pengujian.
3.  Diperbarui pada dokumen ini.
4.  Diselaraskan dengan `PRD.md` jika berdampak pada kebutuhan produk.

## 22. Implementation Checklist

-   [ ] Dokumen proyek utama berada di root repository.
-   [ ] Backend FastAPI dapat dijalankan dan konfigurasi environment
    terdokumentasi.
-   [ ] Setiap kamera memiliki worker dan status koneksi independen.
-   [ ] Sampling frame memiliki batas laju dan timestamp aktual.
-   [ ] YOLOv26n dan YOLOv8 dapat dipilih melalui konfigurasi backend.
-   [ ] Tracking ByteTrack berjalan dan state sesi ditangani dengan
    aman.
-   [ ] ROI disimpan ternormalisasi dan divalidasi backend.
-   [ ] Micro-movement dan occlusion grace period diuji.
-   [ ] Event dibuat satu kali per sesi pelanggaran.
-   [ ] Foto bukti tersimpan dan terhubung dengan event.
-   [ ] WebSocket mengirim alert ke frontend.
-   [ ] Login, role, dan otorisasi endpoint diterapkan.
-   [ ] Petugas dapat mengubah status event menjadi `Valid` atau
    `Invalid`.
-   [ ] Dashboard, riwayat, analitik, dan ekspor laporan berfungsi.
-   [ ] Reconnect satu kamera tidak menghentikan kamera lainnya.
-   [ ] Secret dan file besar tidak masuk repository.

## AI Agent Rules

AI coding agents yang mengerjakan repository SILOTER wajib:

-   Mengikuti pemisahan `frontend/` dan `backend/` pada dokumen ini.
-   Menggunakan stack yang telah ditetapkan kecuali ada keputusan
    perubahan yang disetujui.
-   Memeriksa struktur dan kode yang sudah ada sebelum membuat file atau
    dependensi baru.
-   Tidak membuat duplikasi dokumen instruksi di subfolder tanpa
    kebutuhan yang jelas.
-   Tidak menjalankan pengambilan stream tanpa pembatas laju.
-   Tidak mengekspos service-role key atau secret ke frontend.
-   Memvalidasi koordinat ROI terhadap resolusi frame sumber.
-   Mempertahankan isolasi worker antar kamera.
-   Memperbarui dokumentasi ketika mengubah arsitektur, API, atau skema
    data.
