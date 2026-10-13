# 🎵 DayMusic Web APK (Cloudflare Edition)

A personal, high-performance **DayMusic Web Client & PWA ("Web APK")** built using React 19, TypeScript, Vite, and Cloudflare Pages Functions.

---

## 🌟 Fitur Utama

1. **Desain & Pengalaman Identik YouTube Music**:
   - Deep OLED dark mode (`#030303`), surfaces, red accent branding.
   - Top search bar dengan **real-time autocomplete suggestions**.
   - Category chips ("Energize", "Workout", "Relax", "Focus", "Pop", "Indonesian Hits", dll.).
   - Horizontal music shelves ("Quick picks", "Trending songs", "Explore").
   - Left sidebar & mobile bottom navigation responsive.

2. **Playback Audio & Video Lengkap**:
   - **Song & Video Mode Toggle**: Dengarkan musik dengan cover art & lirik, atau ganti ke mode video musik YouTube resmi tanpa reload.
   - Sticky player bar di bagian bawah dengan scrubber timeline, volume slider, repeat (off/all/one), shuffle, next/prev.
   - **Expanded Now Playing View**:
     - **UP NEXT**: Antrian radio YouTube Music otomatis dengan opsi hapus & reorder.
     - **LYRICS**: Lirik time-synced (real-time sinkron waktu) dengan auto-scroll dan tap-to-seek, didukung YouTube Music & LRCLIB.
     - **RELATED**: Rekomendasi lagu dan info artis terkait.
   - **MediaSession API**: Kontrol playback langsung dari lockscreen HP atau media bar OS Windows/Mac.

3. **Koleksi Musik Pribadi**:
   - Like lagu (tersimpan di playlist *Liked Music*).
   - Buat custom playlist sendiri.
   - Riwayat putar (History).
   - Backup & Restore data playlist/like dalam format JSON.

4. **Web APK (PWA Installable)**:
   - Dilengkapi `manifest.webmanifest` & Service Worker.
   - Bisa di-install langsung di HP Android, iPhone, atau Desktop menjadi aplikasi standalone (Web APK) dengan tombol **Install App**.

5. **Cloudflare Pages Edge Ready**:
   - Dilengkapi Cloudflare Pages Function di `functions/api/[[catchall]].js` untuk proxy YouTube Music InnerTube API langsung di Cloudflare Edge Network.
   - Bebas CORS, tanpa perlu server Python terpisah.

---

## 🚀 Cara Menjalankan Secara Lokal

```bash
# Masuk ke folder proyek
cd "c:\yt music web"

# Jalankan server development Vite
npm run dev
```

Buka browser di: `http://127.0.0.1:5173/`

---

## ☁️ Cara Deploy ke Cloudflare Pages (Gratis untuk Pribadi)

Proyek ini sudah dirancang **100% kompatibel dengan Cloudflare Pages & Functions**.

### Cara 1: Menggunakan Wrangler CLI (Rekomendasi Cepat)

1. Build proyek:
   ```bash
   npm run build
   ```
2. Deploy langsung ke Cloudflare Pages:
   ```bash
   npx wrangler pages deploy dist
   ```
   *Saat pertama kali dijalankan, Anda akan diminta login ke akun Cloudflare di browser. Pilih nama project (misal: `ytmusic-pribadi`), selesai!*

### Cara 2: Menggunakan Git & Cloudflare Dashboard

1. Push repository ini ke akun GitHub / GitLab Anda.
2. Buka dashboard Cloudflare: [dash.cloudflare.com](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Pilih repository Anda dengan konfigurasi build berikut:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Klik **Save and Deploy**. Cloudflare akan otomatis membaca folder `functions/api` sebagai edge API proxy dan mempublikasikan web app Anda ke domain `https://ytmusic-pribadi.pages.dev`!

---

## 📱 Cara Install Sebagai Aplikasi (Web APK) di HP

- **Android (Google Chrome)**: Buka web Anda di Cloudflare, tekan tombol titik tiga di pojok kanan atas browser > pilih **"Install app"** atau **"Tambahkan ke Layar Utama"**. Aplikasi akan terpasang di menu HP seperti APK biasa!
- **iOS (Safari)**: Buka web Anda, tekan tombol **Share** (ikon kotak panah ke atas) > pilih **"Add to Home Screen"**.
- **Desktop (Chrome / Edge)**: Klik ikon install di ujung kanan address bar.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Modern Vanilla CSS (Design system YouTube Music asli)
- **Icons**: Lucide React
- **API Backend**: Cloudflare Pages Functions (Edge Serverless V8)
- **YouTube Engine**: InnerTube Web Remix Client + YouTube IFrame API
- **Lyrics Engine**: YouTube Music InnerTube + LRCLIB Synced Lyrics
"# daymusic" 
"# daymusic" 
