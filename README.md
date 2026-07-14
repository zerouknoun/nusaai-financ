# NusaAI Finance 🔥

NusaAI Finance adalah aplikasi web pencatat keuangan modern yang dilengkapi dengan fitur PWA (Progressive Web App) dan asisten kecerdasan buatan (AI) terintegrasi menggunakan Google Gemini. Aplikasi ini berjalan secara *real-time* berkat sinkronisasi dengan Firebase.
untuk memulai demonya bisa di https://finace-nu.vercel.app/

## Fitur Utama

- **Pencatatan Keuangan Real-Time:** Sinkronisasi instan menggunakan Firebase Realtime Database.
- **Autentikasi Aman:** Login dan Register menggunakan Firebase Authentication.
- **Scanner Struk Otomatis:** Unggah foto struk belanja, dan AI (Gemini Flash) akan secara otomatis mengekstrak Total Harga dan menebak Kategori pengeluaran.
- **Asisten AI Finansial:** Dapatkan ringkasan, saran, dan tips keuangan bulanan berdasarkan pola transaksi Anda menggunakan asisten AI.
- **PWA (Progressive Web App):** Dapat diinstal di HP (Android/iOS) maupun Desktop layaknya aplikasi *native*, bahkan mendukung fitur *offline-ready* standar.
- **Desain Modern & Responsif:** Antarmuka bergaya *glassmorphism* dengan efek *hover*, bayangan menyala, dan transisi halus yang dioptimalkan baik untuk layar lebar (Desktop) maupun layar kecil (Mobile).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS & Lucide React (Icons)
- **Database & Auth:** Firebase (Realtime Database & Authentication)
- **Artificial Intelligence:** Google Generative AI (`@google/generative-ai` dengan model `gemini-1.5-flash`)
- **PWA Integration:** `next-pwa`
- **Deployment:** Vercel

---

## 🚀 Panduan Instalasi (Untuk Pengembangan di Perangkat Lain)

Jika Anda ingin melanjutkan pengembangan (*development*) aplikasi ini di laptop atau PC lain, ikuti langkah-langkah berikut:

### 1. Persiapan Awal
Pastikan perangkat baru Anda sudah terinstal:
- **Node.js** (versi 18.x atau terbaru)
- **Git**

### 2. Kloning Repositori
Buka Terminal / Command Prompt, lalu jalankan perintah ini untuk mengunduh kode dari GitHub:
```bash
git clone https://github.com/zerouknoun/nusaai-financ.git
cd nusaai-financ
```

### 3. Instalasi Dependensi
Instal semua modul yang dibutuhkan (seperti Next.js, Firebase, dll):
```bash
npm install
```

### 4. Konfigurasi Environment Variables (Variabel Lingkungan)
Agar aplikasi dapat terhubung ke Firebase dan Gemini, Anda **wajib** membuat sebuah file baru di folder utama proyek dengan nama `.env.local`. 

Isi file `.env.local` tersebut dengan kode berikut (sesuaikan valuenya dengan milik Anda):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=KunciAPI_Firebase_Anda
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aplikasifinace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://aplikasifinace-default-rtdb.asia-southeast1.firebasedatabase.app/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aplikasifinace
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aplikasifinace.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ID_Sender_Firebase
NEXT_PUBLIC_FIREBASE_APP_ID=App_ID_Firebase

GEMINI_API_KEY=KunciAPI_Gemini_Anda
```

> **Peringatan Penting:** File `.env.local` tidak akan (dan tidak boleh) ikut ter-upload ke GitHub demi keamanan data rahasia Anda. Oleh karena itu, Anda harus selalu membuatnya secara manual jika berpindah perangkat.

### 5. Menjalankan Server Lokal (Tahap Development)
Untuk melihat dan menguji aplikasi di komputer:
```bash
npm run dev
```
Buka browser Anda dan kunjungi `http://localhost:3000`. Jika Anda melakukan perubahan kode, halaman akan otomatis diperbarui.

---

## 📦 Panduan Build dan PWA

Karena aplikasi ini menggunakan `next-pwa`, perlu diingat bahwa **Service Worker PWA biasanya hanya di-*generate* saat Anda melakukan Build Production**.

Untuk menguji hasil kompilasi asli (sebelum diunggah ke internet):
```bash
npm run build
npm run start
```

*Catatan: Pastikan di `package.json` bagian `scripts.build` sudah menggunakan `next build --webpack` jika Anda menggunakan Next.js versi 15/16 yang secara default memicu Turbopack (karena `next-pwa` masih memiliki limitasi dengan Turbopack).*

---

## 🌐 Panduan Deployment (Vercel)

Aplikasi ini sangat cocok di-hosting menggunakan **Vercel**. Jika Anda ingin memperbarui versi di internet setelah melakukan perubahan kode, Anda bisa menggunakan Vercel CLI:

```bash
npx vercel --prod
```

**Penting Saat di Vercel:**
Pastikan Anda juga telah menambahkan *Environment Variables* (seperti `NEXT_PUBLIC_FIREBASE_API_KEY` dan `GEMINI_API_KEY`) di menu Settings > Environment Variables pada dashboard Vercel Anda, karena file `.env.local` tidak diunggah ke Vercel.

---

## Struktur Folder Utama

- `/src/app/` : Berisi halaman-halaman utama (`page.tsx`, `layout.tsx`, `/login/page.tsx`, `/profile/page.tsx`).
- `/src/app/api/` : Berisi backend serverless API untuk menghubungkan aplikasi dengan Gemini (`/analyze/route.ts` dan `/scan-receipt/route.ts`).
- `/public/` : Berisi aset statis (gambar, ikon PWA) dan file manifest PWA (`manifest.json`).
- `/src/lib/` : Konfigurasi inisialisasi pihak ketiga (misalnya `firebase.ts`).
