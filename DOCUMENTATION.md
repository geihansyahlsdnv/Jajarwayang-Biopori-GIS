# Biopori GIS - Complete Documentation

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Firebase Setup](#firebase-setup)
3. [Authentication](#authentication)
4. [Technical Specification](#technical-specification)
5. [Deployment](#deployment)
6. [Testing Guide](#testing-guide)

---

## 🚀 Quick Start

### Installation
```bash
# Clone repository
git clone <repo-url>
cd biopori-gis

# No build step needed - pure frontend app
# Just open index.html in browser
```

### Local Development
1. Open `index.html` in web browser (or use live server)
2. App requires internet (Firebase backend)
3. Login with Google account
4. Add/edit biopori locations on map

### Features
- 🗺️ Interactive map with Leaflet.js
- 📍 Add/edit/delete biopori locations
- 🔐 Google OAuth authentication
- 👤 Owner-based access control
- 🌐 Works offline (PWA)
- 📱 Mobile responsive

---

## 🔥 Firebase Setup

### Firebase Project Creation
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: `jajarwayang-biopori-gis`
3. Region: `asia-southeast1` (Indonesia)
4. Enable Realtime Database
5. Set security rules:

```json
{
  "rules": {
    "biopori": {
      ".read": true,
      ".write": "root.child('biopori').child(auth.uid).exists() || auth.uid === 'owner-email-here'",
      "$uid": {
        ".read": true,
        ".write": "auth.uid === $uid || auth.uid === 'owner-email-here'"
      }
    }
  }
}
```

### Credentials Configuration
1. Copy Firebase config from Console
2. Update `config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "jajarwayang-biopori-gis",
    databaseURL: "https://jajarwayang-biopori-gis-default-rtdb.asia-southeast1.firebasedatabase.app",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
};

const OWNER_EMAIL = "geihansyahlsdnv@gmail.com"; // Your email
```

### Enable Google OAuth
1. Firebase Console → Authentication
2. Enable Google sign-in method
3. Add authorized domains:
   - `localhost` (development)
   - `yourdomain.com` (production)
   - `yourdomain.vercel.app` (Vercel)

---

## 🔐 Authentication

### Access Control
- **Public**: View map, view biopori data
- **Admin (Owner)**: Add/edit/delete locations, update conditions
- **Other Users**: View only (no edit permissions)

### Login Flow
```
User clicks "Login" → Google OAuth → Verify email → 
If owner → Enable edit buttons → Access granted
If not owner → View only → Edit buttons disabled
```

### Checking Admin Status
```javascript
// In script.js
const isOwner = userEmail === OWNER_EMAIL;
if (isOwner) {
    // Show edit/delete buttons
} else {
    // Show view only
}
```

---

## 💻 Technical Specification

### Architecture
```
Frontend (Client-side)
├── index.html (UI + forms)
├── script.js (Logic + map handlers)
├── firebaseService.js (Firebase API)
└── config.js (Configuration)
    ↓
Firebase Realtime Database (Backend)
└── biopori/ (Data collection)
    └── {location_id} (Each biopori record)
```

### Data Structure
```javascript
{
  "biopori": {
    "BPR-001": {
      "id": "BPR-001",
      "lat": -6.951,
      "lng": 109.618,
      "kategori": "Eksisting",
      "status": "Aktif",
      "tanggal_pasang": "2024-01-15",
      "lokasi_detail": "RT 01/RW 02, Depan rumah Pak Budi",
      "keterangan": "Berfungsi baik, perlu perawatan 6 bulan sekali"
    }
  }
}
```

### Technologies Used
| Component | Tech |
|-----------|------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Map | Leaflet.js 1.9.4 |
| Authentication | Firebase Auth (Google OAuth) |
| Database | Firebase Realtime Database |
| Geospatial | Turf.js |
| CSS Framework | Tailwind CSS |
| PWA | Service Worker API |
| Deployment | Vercel |

### File Structure
```
biopori-gis/
├── index.html           # UI & forms
├── script.js            # Main logic (1500+ lines)
├── firebaseService.js   # Firebase wrapper
├── config.js            # Configuration
├── service-worker.js    # PWA offline
├── manifest.json        # PWA metadata
├── desa-boundary.geojson # Map boundary
├── README.md            # Main documentation
├── vercel.json          # Deployment config
└── docs/                # Documentation folder
```

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect GitHub repo to Vercel
3. Auto-deploy on push
4. Environment: Set in Vercel dashboard

### Manual Deployment
```bash
# Build (optional - no build needed)
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables
Create `.env.local`:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=jajarwayang-biopori-gis
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Authentication
- [ ] Click "Login dengan Google" → Google OAuth popup
- [ ] Login with Google → Redirect back to app
- [ ] Email displays in sidebar
- [ ] Owner email → Edit buttons enabled
- [ ] Non-owner email → Edit buttons disabled
- [ ] Click "Logout" → Return to login view

#### Adding Location (Admin Only)
- [ ] Click "Tambah Lokasi" button
- [ ] Click on map → Modal opens with coordinates
- [ ] OR enter coordinates manually (Latitude -6.951, Longitude 109.618)
- [ ] Select kategori & status
- [ ] Add lokasi detail & keterangan
- [ ] Click "Simpan Lokasi" → Data saved to Firebase
- [ ] Marker appears on map
- [ ] Statistics update

#### Editing Location
- [ ] Click marker on map → Popup shows
- [ ] Click "✏️ Edit Kondisi" → Edit modal opens
- [ ] Change kategori: Potensial → Eksisting
- [ ] Change status (Aktif, Penuh, Prioritas, etc)
- [ ] Update tanggal, lokasi, keterangan
- [ ] Click "Simpan Perubahan" → Update saved
- [ ] Marker color changes on map

#### Deleting Location
- [ ] Open edit modal
- [ ] Click "🗑️ Hapus Lokasi" button
- [ ] Confirm deletion
- [ ] Data removed from Firebase
- [ ] Marker disappears from map
- [ ] Statistics update

#### Data Validation
- [ ] Try empty coordinates → Shows error
- [ ] Try invalid numbers → Shows error
- [ ] Try coords outside boundary → Warning with confirm
- [ ] Submit valid data → Success toast message

#### Map Features
- [ ] Pan/zoom map smooth
- [ ] Boundary polygon visible (green dashed)
- [ ] Markers color-coded by kategori
- [ ] Popup shows on marker click
- [ ] Location services button works
- [ ] Filter toggles hide/show markers

#### Mobile Responsiveness
- [ ] Test on mobile browser (Chrome DevTools)
- [ ] Bottom sheet slides up/down
- [ ] FAB buttons accessible
- [ ] Touch targets ≥ 48px
- [ ] Forms readable on small screen
- [ ] Map responsive

#### Offline Mode (PWA)
- [ ] First visit → Service worker installs
- [ ] Disconnect internet (DevTools)
- [ ] App still loads (from cache)
- [ ] "Offline" indicator shows
- [ ] View cached data
- [ ] Reconnect → Sync with Firebase

---

## 🐛 Troubleshooting

### Login not working
- Check Firebase credentials in `config.js`
- Verify Google OAuth is enabled in Firebase Console
- Check authorized domains

### Data not syncing
- Check Firebase Realtime Database connection
- Open DevTools Console → Check for errors
- Verify user is owner (check `OWNER_EMAIL`)

### Map not loading
- Check Leaflet.js CDN is available
- Verify desa-boundary.geojson exists
- Check browser console for errors

### Offline not working
- Verify service-worker.js is registered
- Check browser supports Service Worker
- Clear cache: DevTools → Application → Clear storage

---

## 📞 Support

For issues or questions:
1. Check error messages in browser console
2. Review [techspec.md](techspec.md) for technical details
3. Check [Firebase documentation](https://firebase.google.com/docs)

---

**Last Updated**: January 28, 2026  
**Status**: Production Ready ✅  
**Version**: 1.0.0
