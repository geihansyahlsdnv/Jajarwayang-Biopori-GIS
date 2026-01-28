# Biopori Geo-Planner & Tracker - Jajarwayang

Progressive Web App (PWA) untuk mendata aset biopori (lubang resapan air) di Desa Jajarwayang, Kecamatan Bojong, Kabupaten Pekalongan, Jawa Tengah.

Aplikasi ini membantu petugas desa untuk:
- 📍 Memetakan lokasi biopori yang sudah ada (Eksisting)
- 🎯 Merencanakan lokasi untuk pemasangan biopori baru (Potensial)
- 📊 Melacak statistik dan progress pemasangan
- 🚀 Akses dari mobile device di lapangan (PWA + Offline support)

---

## ✨ Features

- ✅ **Owner-Based Access Control** - Login dengan Google untuk edit data, readonly mode untuk viewers
- ✅ **Dual Layer Visualization** - Tampilkan marker berbeda untuk Eksisting dan Potensial
- ✅ **GPS Geolocation** - Temukan lokasi saya dengan akurasi tinggi
- ✅ **Offline Support** - Tetap bisa akses saat sinyal lemah (PWA)
- ✅ **Installable** - Install ke homescreen seperti native app
- ✅ **Responsive Design** - Optimal di desktop & mobile
- ✅ **Boundary Validation** - Input otomatis ditolak jika di luar Desa Jajarwayang
- ✅ **Real-time Sync** - Data tersync otomatis via Firebase Realtime Database
- ✅ **No Backend Setup** - Client-side Firebase, plug & play

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Tailwind CSS, JavaScript (ES6+)
- **Map Engine:** Leaflet.js v1.9.4
- **Geospatial:** Turf.js (point-in-polygon validation)
- **Database:** Firebase Realtime Database
- **PWA:** Service Worker + Web App Manifest
- **Deployment:** Vercel (recommended)

---

## � Authentication

Aplikasi menggunakan **Firebase Authentication** dengan Google OAuth untuk mengamankan akses data:

### Access Levels

| Level | Owner Email | Permissions | Akses |
|-------|------------|-------------|-------|
| **Owner/Admin** | gehu@gmail.com | Add, Edit, Delete | Full |
| **Public Users** | Any Google Account | View Only | Readonly |
| **Anonymous** | - | View Only | Readonly |

### Cara Login
1. Klik tombol "🔐 Login dengan Google" di sidebar
2. Pilih akun Google Anda
3. Jika email Anda = Owner email → Full access
4. Jika email berbeda → Readonly mode

### Mengubah Owner Email
Edit file `config.js`:
```javascript
const OWNER_EMAIL = 'admin@example.com'; // Ganti dengan email admin
```

Untuk dokumentasi lengkap setup authentication, lihat [AUTH_SETUP.md](AUTH_SETUP.md)

---

## 🚀 Quick Start untuk Contributors

### 1. Clone Repository
```bash
git clone https://github.com/geihansyahlsdnv/Jajarwayang-Biopori-GIS.git
cd Jajarwayang-Biopori-GIS
```

### 2. Setup Firebase Credentials ⚠️

**PENTING:** Aplikasi memerlukan Firebase credentials untuk berfungsi.

#### Option A: Using `.env.local` (Development)
```bash
# Copy template
cp .env.example config.js.local

# Edit dengan credentials Firebase Anda
nano config.js.local
# atau buka dengan text editor favorit
```

Edit `config.js.local`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const OWNER_EMAIL = 'your-email@gmail.com';

export { firebaseConfig as default, OWNER_EMAIL };
```

#### Option B: Menggunakan Firebase Project Anda Sendiri
1. Go to [firebase.google.com](https://firebase.google.com)
2. Create a new project (name: `biopori-gis`)
3. Enable Realtime Database (region: `asia-southeast1`)
4. Setup Security Rules:
```json
{
  "rules": {
    "biopori": {
      ".read": true,
      ".write": true
    }
  }
}
```
5. Copy credentials dari Project Settings → Your apps → Web
6. Paste ke `config.js.local`

**⚠️ SECURITY:** File `config.js.local` tidak akan di-push (ada di `.gitignore`)

### 3. Run Locally

```bash
# Python built-in server
python3 -m http.server 8080

# Atau gunakan Live Server (VS Code)
# Right-click index.html → Open with Live Server
```

Open: **http://localhost:8080** 🗺️

### 4. Development Workflow

```bash
# 1. Buat branch untuk fitur baru
git checkout -b feature/nama-fitur

# 2. Commit changes
git add .
git commit -m "Add: deskripsi perubahan"

# 3. Push ke GitHub
git push origin feature/nama-fitur

# 4. Buat Pull Request di GitHub
```

### 5. Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login dan deploy
vercel

# Atau: Setup via GitHub integration di vercel.com
```

**Environment Variables di Vercel:**
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
... (semua Firebase config)
```

---

## 📱 Usage

### Desktop
- **Sidebar** (kiri) untuk filter & statistik
- **Map** (tengah) untuk visualisasi
- Klik peta untuk tambah lokasi

### Mobile
- **Bottom Sheet** untuk statistik & filter (swipe up)
- **FAB Buttons** (bawah kanan) untuk aksi cepat
- Klik peta untuk tambah lokasi

### Adding Locations
1. Klik tombol "Tambah Lokasi Biopori" atau FAB button
2. Klik di peta untuk pilih koordinat
3. Isi form:
   - **Kategori:** Eksisting atau Potensial
   - **Status:** Aktif, Penuh, Prioritas Tinggi, dll
   - **Lokasi Detail:** RT/RW, nama jalan
   - **Keterangan:** Catatan tambahan
4. Klik "Simpan Lokasi"

### Deleting Locations
1. Klik marker untuk buka popup
2. Klik "Hapus Lokasi"
3. Konfirmasi
4. Data akan terhapus dari Firebase

---

## 🔒 Firebase Security

### Development (Current)
```json
{
  "rules": {
    "biopori": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Production
Implement authentication:
```json
{
  "rules": {
    "biopori": {
      ".read": "auth != null",
      ".write": "auth != null && 
                 (root.child('admins').child(auth.uid).exists())"
    }
  }
}
```

Setup Firebase Authentication (Google Sign-In recommended)

---

## 📚 Documentation

Lihat [docs/techspec.md](docs/techspec.md) untuk dokumentasi teknis lengkap:
- Data Schema
- API Documentation
- Geospatial Implementation
- Deployment Options
- Troubleshooting

---

## 🐛 Troubleshooting

### "ERR_NGROK_8012" - Connection Lost
- ngrok session timeout
- Solution: Restart ngrok atau gunakan Vercel untuk production

### Firebase Data Not Syncing
- Check internet connection
- Verify Firebase credentials di `.env`
- Check Firebase security rules
- Look at browser console untuk error messages

### Map Not Showing Boundary
- Verify `desa-boundary.geojson` exists
- Check GeoJSON format valid
- Check browser console untuk error

### Offline Mode Not Working
- PWA only works di HTTPS (vercel) atau localhost
- For ngrok: firebaseService.js needs CORS fix

---

## 📊 Data Export

Di browser console:
```javascript
// Export all data ke JSON file
FirebaseService.exportToJSON()

// Get statistics
const stats = await FirebaseService.getStats()
console.log(stats)
```

---

## 🔄 Roadmap

- [ ] User Authentication (Google Sign-In)
- [ ] Multi-user support dengan role-based access
- [ ] Data backup otomatis ke Google Sheets
- [ ] 3D visualization dengan Mapbox GL
- [ ] Print map dengan statistik
- [ ] Mobile native app (React Native / Flutter)
- [ ] AI-powered location suggestions
- [ ] Analytics dashboard

---

## 📝 License

MIT License - Feel free to use & modify

---

## 👥 Contributors

- Geihansyah (Project Lead)
- [Your Name Here]

---

## 📧 Support

Untuk issues & questions:
1. Check [FAQ di docs](docs/techspec.md)
2. Create GitHub issue
3. Email: your@email.com

---

## 🙏 Acknowledgments

- Leaflet.js team untuk map engine
- Firebase untuk realtime database
- Vercel untuk hosting
- OpenStreetMap contributors untuk tile data
- Desa Jajarwayang untuk data survei biopori

---

**Last Updated:** January 28, 2026
**Version:** 3.4
**Status:** Production Ready
