# Korfball Hub — Presensi & Live Game Statistics

Platform terintegrasi untuk manajemen presensi latihan dan pencatatan statistik pertandingan live (*event-based*) bagi tim **Korfball Bantul**, dibangun di atas template monorepo RBAC production-ready (*NestJS 12 + Drizzle ORM + PostgreSQL / NeonDB* dan *Next.js 16 App Router + Tailwind CSS v4 + Shadcn UI*).

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![NestJS](https://img.shields.io/badge/NestJS-12-red)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-blue)
![Shadcn UI](https://img.shields.io/badge/Shadcn-UI-black)
![PWA](https://img.shields.io/badge/PWA-Ready-green)

---

## 🌟 Fitur Utama

1. **Struktur 3 Role Utama**:
   - **SuperAdmin / Manager** (`admin`): Akses penuh ke seluruh sistem, manajemen tim, atlet, sesi, pertandingan, RBAC, dan audit log.
   - **Coach & Official** (`coach`): Mengelola sesi latihan, presensi massal, setup match, dan menjalankan live recorder di pinggir lapangan.
   - **Athlete** (`athlete`): Self check-in mandiri dengan kode sesi 6 karakter, pengajuan izin latihan, riwayat kehadiran pribadi, dan statistik performa diri.

2. **Jadwal Latihan Rutin & Presensi (GPS Geofence + Hybrid)**:
   - Preset jadwal otomatis di **WIFA SPORT CENTER**: **Selasa 18.00–20.00 WIB** & **Sabtu 19.00–21.00 WIB**.
   - Batch generator sesi latihan bulanan instan (`POST /api/sessions/generate-routine`).
   - Pemilih lokasi venue interaktif dengan **Leaflet + OpenStreetMap** dan visualisasi radius 100m.
   - **Self Check-In Hybrid**: Check-in 1-tap via sensor GPS perangkat atlet di lokasi dan fallback kode 6 digit acak jika GPS indoor terkendala.
   - Lembar presensi official interaktif (segmented `H/T/I/A`) dengan polling non-destruktif 10 detik.
   - Toleransi keterlambatan server 15 menit dan rate-limiting kode salah 5/10 menit.
   - Finalisasi sesi otomatis menandai atlet aktif tanpa presensi sebagai `ABSENT` (BR-07).
   - Export rekap presensi multi-sheet Excel (.xlsx).

3. **Live Game Stat Recorder (PWA)**:
   - Pencatatan berbasis event (*event-sourcing*): `SM`, `RIM`, `PM`, `DR`, `OR`, `D`, `AS`, `IT`, `TOV`, `F`, `YC`, `RC`, `SUBSTITUTION`, `TIMEOUT`.
   - Layout tablet landscape 3-kolom dan mobile portrait yang responsif.
   - **Offline Outbox (IndexedDB)**: Sinkronisasi otomatis saat online kembali dengan idempotensi penuh via UUID dari client (`ON CONFLICT DO NOTHING`).
   - Stopwatch pertandingan bebas drift (*performance.now* synchronization).
   - Sheet assist otomatis (auto-dismiss 4 detik) dan pemilih zona tembakan SVG (sektor 1–8 & ring 1–6).
   - Haptic feedback & Screen Wake Lock saat mencatat pertandingan di GOR.

4. **Box Score, Leaderboard & Laporan**:
   - Box score otomatis per babak (B1/B2) dan running score teruji 100% identik dengan score sheet turnamen Korfball (Fixture Game 2 & Game 4).
   - Laporan resmi pertandingan cetak-siap (*print-ready*) A4 landscape `@media print` dan export XLSX.
   - Leaderboard agregat pemain (GP, PTS, PPG, %FG, RPG, APG, EFF, EPG) dengan sorting dan filter minimum GP.
   - Profil karir atlet dengan visual tren efisiensi pertandingan (EFF trend bars) dan game log lengkap.
   - Dashboard role-aware menyajikan kartu sesi hari ini, quick check-in code copy, dan active match score.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Backend** | NestJS 12, TypeScript (ESM via `tsx`), Express platform |
| **Database & ORM** | PostgreSQL / NeonDB Serverless + Drizzle ORM |
| **Caching & Invalidation** | Redis (`ioredis`) dengan fallback In-Memory (10m TTL) |
| **Auth** | Stateless JWT (`access_token` 15m, `refresh_token` 7d) in `httpOnly` cookies |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4 |
| **UI Primitives** | Shadcn UI (Radix UI primitives + CVA) |
| **Offline Storage** | IndexedDB (`idb-keyval`) |
| **PWA** | Web App Manifest + Service Worker + App Icons |
| **Quality & Tests** | Biome (linter & formatter) + Vitest across all workspaces |

---

## 🚀 Memulai (Quick Start)

### 1. Konfigurasi Environment

Pastikan file environment telah terpasang:
- `backend/.env` (mengarah ke NeonDB connection string dan rahasia JWT)
- `frontend/.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:3001/api`)

### 2. Migrasi Database & Seeding Demo Data

```bash
# Generate & jalankan migrasi Drizzle ke PostgreSQL / NeonDB
npm run migrate

# Seed RBAC dasar (permissions & 3 roles)
npm run seed

# Seed data demo lengkap: Tim Bantul, 20 Atlet, 2 Tim Lawan, Sesi Rutin, dan Akun Demo
npm run seed:demo
```

### 3. Akun Demo Bawaan

| Role | Email | Password | Kegunaan |
|---|---|---|---|
| **SuperAdmin** | `admin@korfballbantul.id` | `Admin123!` | Manajemen tim, atlet, penautan akun, sesi, audit log |
| **Coach & Official** | `coach@korfballbantul.id` | `Coach123!` | Kelola lembar presensi, live game recorder, box score |
| **Athlete (Putri)** | `rukmi@korfballbantul.id` | `Athlete123!` | Self check-in 1-tap GPS & pengajuan izin atlet putri |
| **Athlete (Putra)** | `guntur@korfballbantul.id` | `Athlete123!` | Self check-in 1-tap GPS & pengajuan izin atlet putra |

> Lihat daftar lengkap seluruh kredensial pengujian di [docs/CREDS.md](docs/CREDS.md) dan panduan operasional di [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

### 4. Menjalankan Server Pengembangan

```bash
# Terminal 1: Backend NestJS (port 3001, Swagger di http://localhost:3001/api/docs)
npm run dev:backend

# Terminal 2: Frontend Next.js 16 (port 3000 di http://localhost:3000)
npm run dev:frontend
```

---

## 📱 Instalasi Progressive Web App (PWA)

1. **Android Chrome**: Buka `http://localhost:3000` (atau URL hosting HTTPS), tekan menu browser `⋮` lalu pilih **"Install app"** atau **"Tambahkan ke Layar Utama"**.
2. **iOS Safari**: Buka web di Safari, tekan tombol **Share** (kotak panah ke atas) lalu pilih **"Add to Home Screen"**.
3. Aplikasi akan berjalan standalone dalam layar penuh tanpa bilah navigasi browser, mendukung offline cache shell dan outbox pencatatan pertandingan di GOR Sasana Krida.

---

## 🧪 Testing & Code Quality

Proyek dilengkapi dengan 60 test files (256 test cases) yang mencakup unit test kalkulator, fixture knowledge, outbox sync, RBAC permissions, dan pilot scenarios E2E.

```bash
# Menjalankan seluruh test suites Vitest
npm test

# Menjalankan Biome check (format, lint, dan typecheck tsc)
npm run check

# Memperbaiki formatting dan lint otomatis
npm run format:fix
npm run lint:fix

# Membangun build produksi
npm run build:backend
npm run build:frontend
```

---

## 📄 Dokumentasi Terkait

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — **Buku Panduan Pengguna Lengkap & Skenario Uji Coba Pilot (Wajib Baca Penguji)**
- [docs/CREDS.md](docs/CREDS.md) — Kredensial Login Lengkap Seluruh Role & Profil
- [docs/PRD.md](docs/PRD.md) — Product Requirements Document v2.2 (Spesifikasi Bisnis & BR-01 s/d BR-35)
- [docs/USER_FLOW.md](docs/USER_FLOW.md) — Alur Pengguna (User Flow) & Diagram Interaksi
- [docs/USER_STORIES.md](docs/USER_STORIES.md) — User Stories & Kriteria Penerimaan
- [docs/API.md](docs/API.md) — Ringkasan Kontrak API dan Endpoint Lengkap
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Arsitektur Sistem, Model Data, dan Event Sourcing
- [docs/PROGRESS.md](docs/PROGRESS.md) — Pelacakan Progres Pengerjaan Monorepo
- [AGENTS.md](AGENTS.md) — Panduan Operasional AI Coding Assistant

---

## ⚖️ Lisensi

Hak Cipta © 2026 Korfball Bantul. Dilisensikan di bawah lisensi MIT.
