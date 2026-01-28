// ==========================================
// Biopori Geo-Planner & Tracker - Jajarwayang
// PWA + Mobile-Optimized Version
// Firebase Realtime Database Edition
// ==========================================

// Import Firebase Service & Config
import FirebaseService from './firebaseService.js';

// Get OWNER_EMAIL dari berbagai source
let OWNER_EMAIL;

// Priority 1: Global config (from HTML) - works in production
if (window.__bioporiConfig?.ownerEmail) {
    OWNER_EMAIL = window.__bioporiConfig.ownerEmail;
    console.log('[Config] OWNER_EMAIL from window.__bioporiConfig:', OWNER_EMAIL);
}
// Priority 2: Local config files (development)
else {
    try {
        const config = await import('./config.js.local');
        OWNER_EMAIL = config.OWNER_EMAIL;
        console.log('[Config] OWNER_EMAIL from config.js.local:', OWNER_EMAIL);
    } catch (e) {
        try {
            const config = await import('./config.js');
            OWNER_EMAIL = config.OWNER_EMAIL;
            console.log('[Config] OWNER_EMAIL from config.js:', OWNER_EMAIL);
        } catch (e2) {
            console.warn('[Config] OWNER_EMAIL not found - readonly mode');
            OWNER_EMAIL = null;
        }
    }
}

// Expose to global scope for console and onclick handlers
window.FirebaseService = FirebaseService;

// ==========================================
// Authentication State
// ==========================================

let currentUser = null;
let isOwner = false;

// Load initial data on page load (PUBLIC mode - everyone can see markers)
console.log('[Init] Loading initial biopori data for public view...');
await loadData();

// Setup auth listener for login/logout
FirebaseService.onAuthStateChange(async (user) => {
    currentUser = user;
    isOwner = user && user.email === OWNER_EMAIL;
    
    console.log('[Auth] User:', user ? user.email : 'Not logged in');
    console.log('[Auth] Is Owner:', isOwner);
    
    updateAuthUI();
    
    // If logged in, setup real-time listener for live updates
    if (user) {
        console.log('[Auth] Setting up real-time listener for logged-in user');
        setupFirebaseListener();
    }
});

function updateAuthUI() {
    // Get all auth UI elements
    const desktopLoginView = document.getElementById('auth-login-view');
    const desktopLoggedInView = document.getElementById('auth-loggedin-view');
    const desktopUserEmail = document.getElementById('user-email');
    const desktopBtn = document.getElementById('desktop-btn-add');
    
    const mobileLoginView = document.getElementById('mobile-auth-login-view');
    const mobileLoggedInView = document.getElementById('mobile-auth-loggedin-view');
    const mobileUserEmail = document.getElementById('mobile-user-email');
    const mobileBtn = document.getElementById('fab-add');
    
    // Get all edit-only buttons
    const editButtons = document.querySelectorAll('[data-edit-only]');
    
    if (currentUser && isOwner) {
        // Show logged-in state (owner) - FULL ACCESS
        if (desktopLoginView) desktopLoginView.style.display = 'none';
        if (desktopLoggedInView) desktopLoggedInView.style.display = 'block';
        if (desktopUserEmail) desktopUserEmail.textContent = currentUser.email + ' (Admin)';
        if (desktopBtn) desktopBtn.disabled = false;
        
        if (mobileLoginView) mobileLoginView.style.display = 'none';
        if (mobileLoggedInView) mobileLoggedInView.style.display = 'block';
        if (mobileUserEmail) mobileUserEmail.textContent = currentUser.email + ' (Admin)';
        if (mobileBtn) mobileBtn.disabled = false;
        
        // Enable all edit buttons
        editButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    } else if (currentUser && !isOwner) {
        // Logged in but not owner (readonly)
        if (desktopLoginView) desktopLoginView.style.display = 'none';
        if (desktopLoggedInView) desktopLoggedInView.style.display = 'block';
        if (desktopUserEmail) desktopUserEmail.textContent = currentUser.email + ' (Viewer)';
        if (desktopBtn) desktopBtn.disabled = true;
        
        if (mobileLoginView) mobileLoginView.style.display = 'none';
        if (mobileLoggedInView) mobileLoggedInView.style.display = 'block';
        if (mobileUserEmail) mobileUserEmail.textContent = currentUser.email + ' (Viewer)';
        if (mobileBtn) mobileBtn.disabled = true;
        
        // Disable all edit buttons
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
    } else {
        // Not logged in (PUBLIC mode - can view all markers, but cannot edit)
        if (desktopLoginView) desktopLoginView.style.display = 'block';
        if (desktopLoggedInView) desktopLoggedInView.style.display = 'none';
        if (desktopBtn) desktopBtn.disabled = true;
        
        if (mobileLoginView) mobileLoginView.style.display = 'block';
        if (mobileLoggedInView) mobileLoggedInView.style.display = 'none';
        if (mobileBtn) mobileBtn.disabled = true;
        
        // Disable all edit buttons
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
        
        console.log('[Auth] PUBLIC mode - showing all markers without login');
    }
}

// Login handler
window.handleLogin = async () => {
    try {
        await FirebaseService.loginWithGoogle();
        console.log('[Auth] Login successful');
    } catch (error) {
        console.error('[Auth] Login failed:', error);
        alert('Login gagal: ' + error.message);
    }
};

// Logout handler
window.handleLogout = async () => {
    try {
        await FirebaseService.logout();
        currentUser = null;
        isOwner = false;
        updateAuthUI();
        console.log('[Auth] Logout successful');
    } catch (error) {
        console.error('[Auth] Logout failed:', error);
    }
};

// Konfigurasi
const CONFIG = {
    // Koordinat pusat Jajarwayang (updated dari data survei)
    centerLat: -6.9507,
    centerLng: 109.6180,
    defaultZoom: 16,
    // Biaya per unit biopori untuk estimasi anggaran
    biayaPerUnit: 150000,
    // Development mode - set false untuk production
    devMode: true
};

// Warna marker berdasarkan kategori dan status
// Color Palette: Eco-Friendly GIS Theme
const COLORS = {
    // Primary Brand Colors
    primary: {
        forest: '#2d6a4f',      // Primary Green (Forest)
        leaf: '#52b788',        // Secondary Green (Leaf)
        earth: '#bc6c25'        // Accent Earth (Terracotta)
    },
    // Status Colors for Biopori Markers
    eksisting: {
        aktif: '#74c69d',           // Status Good - Light Green
        penuh: '#ffb703',           // Status Warning - Amber
        'perlu dikuras': '#ffb703', // Status Warning - Amber
        rusak: '#e63946'            // Status Danger - Soft Red
    },
    potensial: {
        'prioritas tinggi': '#bc6c25',  // Accent Earth - Terracotta
        'prioritas sedang': '#ffb703'   // Status Warning - Amber
    },
    // UI Colors
    ui: {
        water: '#0077b6',       // Water/Infiltration - Deep Blue
        bgDark: '#1b4332',      // Deep Background
        bgLight: '#f8f9fa'      // Surface Light
    }
};

// ==========================================
// PWA: Service Worker Registration
// ==========================================

// Only register Service Worker in production (not dev mode)
if ('serviceWorker' in navigator && !CONFIG.devMode) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('[PWA] Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            showUpdateAvailable();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('[PWA] Service Worker registration failed:', error);
            });
    });
} else if (CONFIG.devMode) {
    console.log('[DEV] Service Worker disabled in development mode');
    // Unregister any existing service worker in dev mode
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
                console.log('[DEV] Unregistered existing Service Worker');
            });
        });
    }
}

// ==========================================
// PWA: Install Prompt
// ==========================================

let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const btnInstall = document.getElementById('btn-install');
const btnCloseBanner = document.getElementById('btn-close-banner');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.classList.add('show');
});

btnInstall?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    deferredPrompt = null;
    installBanner.classList.remove('show');
});

btnCloseBanner?.addEventListener('click', () => {
    installBanner.classList.remove('show');
});

// ==========================================
// PWA: Offline Detection
// ==========================================

const offlineIndicator = document.getElementById('offline-indicator');

window.addEventListener('online', () => {
    offlineIndicator.classList.remove('show');
    console.log('[PWA] Back online');
});

window.addEventListener('offline', () => {
    offlineIndicator.classList.add('show');
    setTimeout(() => offlineIndicator.classList.remove('show'), 3000);
    console.log('[PWA] Gone offline');
});

function showUpdateAvailable() {
    if (confirm('Versi baru tersedia! Muat ulang untuk memperbarui?')) {
        window.location.reload();
    }
}

// Inisialisasi peta
const map = L.map('map').setView([CONFIG.centerLat, CONFIG.centerLng], CONFIG.defaultZoom);

// Tambahkan tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// ==========================================
// Desa Jajarwayang Boundary (GeoJSON)
// ==========================================

// Load GeoJSON boundary
let desaBoundary = null;
let boundaryLayer = null;

async function loadDesaBoundary() {
    try {
        const response = await fetch('desa-boundary.geojson');
        desaBoundary = await response.json();
        
        // Tampilkan boundary sebagai layer (semi-transparent)
        boundaryLayer = L.geoJSON(desaBoundary, {
            style: {
                color: '#52b788',        // Leaf green
                weight: 3,
                opacity: 0.6,
                fillColor: '#52b788',
                fillOpacity: 0.05,
                dashArray: '5, 5'
            }
        }).addTo(map);
        
        // Set maxBounds agar peta tidak bisa keluar dari desa
        const bounds = getBoundaryBounds(desaBoundary);
        map.setMaxBounds(bounds);
        map.fitBounds(bounds, { padding: [50, 50] });
        
        console.log('[Boundary] Desa Jajarwayang boundary loaded');
    } catch (error) {
        console.error('[Boundary] Error loading GeoJSON:', error);
    }
}

// Fungsi untuk menghitung bounds dari GeoJSON
function getBoundaryBounds(geojson) {
    const coords = geojson.geometry.coordinates[0];
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    
    return L.latLngBounds([south, west], [north, east]);
}

// Validasi apakah koordinat dalam batas desa
function isLocationInsideDesa(lat, lng) {
    if (!desaBoundary) return true; // Jika boundary belum load, izinkan dulu
    
    const point = turf.point([lng, lat]);
    const polygon = turf.polygon(desaBoundary.geometry.coordinates);
    
    return turf.booleanPointInPolygon(point, polygon);
}

// Load boundary saat inisalisasi
loadDesaBoundary();

// Layer groups untuk kategori berbeda
const layerEksisting = L.layerGroup().addTo(map);
const layerPotensial = L.layerGroup().addTo(map);

// Data storage
let allData = [];

// ==========================================
// Fungsi untuk membuat marker
// ==========================================

function createMarker(item) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lng);
    const kategori = item.kategori?.toLowerCase() || '';
    const status = item.status?.toLowerCase() || '';
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    let marker;
    
    if (kategori === 'eksisting') {
        // Marker bulat solid untuk Eksisting
        const color = COLORS.eksisting[status] || COLORS.eksisting.aktif;
        marker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        });
    } else if (kategori === 'potensial') {
        // Marker dengan border dashed untuk Potensial
        const color = COLORS.potensial[status] || COLORS.potensial['prioritas sedang'];
        marker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: 'transparent',
            color: color,
            weight: 3,
            opacity: 1,
            fillOpacity: 0,
            dashArray: '5, 5'
        });
    } else {
        return null;
    }
    
    // Buat popup content
    const popupContent = createPopupContent(item);
    marker.bindPopup(popupContent);
    
    return { marker, kategori };
}

function createPopupContent(item) {
    const kategori = item.kategori?.toLowerCase() || '';
    const editBtn = `
        <button onclick="openEditModal('${item.id}')" 
                class="w-full mt-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-1">
            ✏️ Edit Kondisi
        </button>
    `;
    const deleteBtn = `
        <button onclick="deleteLocation('${item.id}')" 
                class="w-full mt-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-1">
            🗑️ Hapus Lokasi
        </button>
    `;
    
    if (kategori === 'eksisting') {
        return `
            <div class="p-2 min-w-[200px]">
                <h3 class="font-bold text-lg mb-2 text-green-700">🌿 ${item.id}</h3>
                <table class="text-sm w-full">
                    <tr><td class="font-semibold pr-2">Kategori:</td><td>${item.kategori}</td></tr>
                    <tr><td class="font-semibold pr-2">Status:</td><td><span class="px-2 py-1 rounded text-white text-xs" style="background-color: ${getStatusColor(item)}">${item.status}</span></td></tr>
                    <tr><td class="font-semibold pr-2">Tanggal Pasang:</td><td>${item.tanggal_pasang || '-'}</td></tr>
                    <tr><td class="font-semibold pr-2">Lokasi:</td><td>${item.lokasi_detail || '-'}</td></tr>
                    ${item.keterangan ? `<tr><td class="font-semibold pr-2">Keterangan:</td><td>${item.keterangan}</td></tr>` : ''}
                </table>
                ${editBtn}
                ${deleteBtn}
            </div>
        `;
    } else {
        // Popup untuk Potensial
        return `
            <div class="p-2 min-w-[200px]">
                <h3 class="font-bold text-lg mb-2 text-orange-600">📍 ${item.id}</h3>
                <div class="bg-orange-50 border-l-4 border-orange-400 p-2 mb-2">
                    <p class="text-sm font-semibold text-orange-800">Alasan Pemilihan Lokasi:</p>
                    <p class="text-sm text-gray-700">${item.keterangan || 'Tidak ada keterangan'}</p>
                </div>
                <table class="text-sm w-full">
                    <tr><td class="font-semibold pr-2">Kategori:</td><td>${item.kategori}</td></tr>
                    <tr><td class="font-semibold pr-2">Prioritas:</td><td><span class="px-2 py-1 rounded text-white text-xs" style="background-color: ${getStatusColor(item)}">${item.status}</span></td></tr>
                    <tr><td class="font-semibold pr-2">Lokasi:</td><td>${item.lokasi_detail || '-'}</td></tr>
                </table>
                ${editBtn}
                ${deleteBtn}
            </div>
        `;
    }
}

function getStatusColor(item) {
    const kategori = item.kategori?.toLowerCase() || '';
    const status = item.status?.toLowerCase() || '';
    
    if (kategori === 'eksisting') {
        return COLORS.eksisting[status] || COLORS.eksisting.aktif;
    } else {
        return COLORS.potensial[status] || COLORS.potensial['prioritas sedang'];
    }
}

// ==========================================
// Fungsi untuk menghapus lokasi biopori
// ==========================================

async function deleteLocation(id) {
    // Check if user is owner
    if (!isOwner) {
        alert('⛔ Hanya admin yang bisa menghapus lokasi.\nSilakan login dengan akun admin.');
        return;
    }
    
    // Konfirmasi hapus
    if (!confirm(`Apakah Anda yakin ingin menghapus lokasi "${id}"?\n\nData akan dihapus secara permanen dari database.`)) {
        return;
    }
    
    try {
        // Cari item untuk notifikasi sebelum delete
        const deletedItem = allData.find(item => item.id === id);
        
        // Delete dari Firebase
        await FirebaseService.deleteBiopori(id);
        
        // Hapus dari array lokal
        allData = allData.filter(item => item.id !== id);
        
        // Tutup popup
        map.closePopup();
        
        // Re-render markers
        renderMarkers();
        
        // Update statistik
        updateStatistics();
        
        // Tampilkan notifikasi sukses
        if (deletedItem) {
            showDeleteNotification(deletedItem);
        }
        
        console.log(`[Firebase] Lokasi "${id}" berhasil dihapus`);
    } catch (error) {
        console.error('[Firebase] Delete error:', error);
        alert('Gagal menghapus lokasi. Pastikan server berjalan.');
    }
}

function showDeleteNotification(item) {
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = 'delete-notification';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">✅</span>
            <div>
                <div style="font-weight: 600;">Lokasi Dihapus</div>
                <div style="font-size: 12px; opacity: 0.9;">${item.id} - ${item.kategori}</div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Animasi masuk
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Hapus setelah 3 detik
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// Fungsi untuk edit/update kondisi biopori
// ==========================================

let currentEditingId = null;

function openEditModal(id) {
    if (!isOwner) {
        alert('⛔ Hanya admin yang bisa mengubah data.\nSilakan login dengan akun admin.');
        return;
    }

    // Cari item yang akan diedit
    const item = allData.find(x => x.id === id);
    if (!item) {
        alert('Data tidak ditemukan');
        return;
    }

    currentEditingId = id;

    // Set values
    document.getElementById('edit-location-id').textContent = item.id;
    document.getElementById('edit-input-kategori').value = item.kategori || '';
    document.getElementById('edit-input-status').value = item.status || '';
    document.getElementById('edit-input-tanggal').value = item.tanggal_pasang || '';
    document.getElementById('edit-input-lokasi').value = item.lokasi_detail || '';
    document.getElementById('edit-input-keterangan').value = item.keterangan || '';

    // Trigger kategori change untuk update status options
    document.getElementById('edit-input-kategori').dispatchEvent(new Event('change'));

    // Show modal
    document.getElementById('edit-location-modal').style.display = 'flex';
}

function hideEditModal() {
    document.getElementById('edit-location-modal').style.display = 'none';
    currentEditingId = null;
}

// ==========================================
// Firebase Configuration
// ==========================================
// Firebase Service is now used instead of REST API
console.log('[Init] Using Firebase Realtime Database');

// ==========================================
// Fungsi untuk memuat data dari Firebase
// ==========================================

async function loadData() {
    try {
        console.log('[Firebase] Loading all biopori data...');
        allData = await FirebaseService.getAllBiopori();
        
        renderMarkers();
        updateStatistics();
        
        console.log(`[Firebase] Loaded ${allData.length} records from Firebase`);
    } catch (error) {
        console.error('[Firebase] Load error:', error);
        alert('Gagal memuat data dari Firebase. Pastikan koneksi internet aktif.');
    }
}

// Setup real-time listener untuk Firebase
function setupFirebaseListener() {
    try {
        console.log('[Firebase] Setting up real-time listener...');
        FirebaseService.onBioporiChange((data) => {
            allData = data;
            renderMarkers();
            updateStatistics();
            console.log(`[Firebase RT] Data updated: ${data.length} records`);
        });
    } catch (error) {
        console.error('[Firebase] Listener setup error:', error);
    }
}

function renderMarkers() {
    // Clear existing markers
    layerEksisting.clearLayers();
    layerPotensial.clearLayers();
    
    allData.forEach(item => {
        const result = createMarker(item);
        if (result) {
            if (result.kategori === 'eksisting') {
                result.marker.addTo(layerEksisting);
            } else if (result.kategori === 'potensial') {
                result.marker.addTo(layerPotensial);
            }
        }
    });
}

// ==========================================
// Fungsi untuk update statistik
// ==========================================

function updateStatistics() {
    const eksisting = allData.filter(d => d.kategori?.toLowerCase() === 'eksisting');
    const potensial = allData.filter(d => d.kategori?.toLowerCase() === 'potensial');
    
    const aktif = eksisting.filter(d => d.status?.toLowerCase() === 'aktif');
    const penuh = eksisting.filter(d => ['penuh', 'perlu dikuras'].includes(d.status?.toLowerCase()));
    
    const prioritasTinggi = potensial.filter(d => d.status?.toLowerCase() === 'prioritas tinggi');
    const prioritasSedang = potensial.filter(d => d.status?.toLowerCase() === 'prioritas sedang');
    
    // Estimasi anggaran
    const totalAnggaran = potensial.length * CONFIG.biayaPerUnit;
    const formattedAnggaran = formatRupiah(totalAnggaran);
    const shortAnggaran = formatRupiahShort(totalAnggaran);
    
    // Update Desktop DOM
    const desktopElements = {
        'desktop-count-eksisting': eksisting.length,
        'desktop-count-aktif': aktif.length,
        'desktop-count-penuh': penuh.length,
        'desktop-count-potensial': potensial.length,
        'desktop-count-prioritas-tinggi': prioritasTinggi.length,
        'desktop-count-prioritas-sedang': prioritasSedang.length,
        'desktop-estimasi-anggaran': formattedAnggaran
    };
    
    // Update Mobile Bottom Sheet DOM
    const mobileElements = {
        'mobile-count-eksisting': eksisting.length,
        'mobile-count-potensial': potensial.length,
        'mobile-estimasi-anggaran': shortAnggaran,
        'sheet-count-eksisting': eksisting.length,
        'sheet-count-aktif': aktif.length,
        'sheet-count-penuh': penuh.length,
        'sheet-count-potensial': potensial.length,
        'sheet-count-prioritas-tinggi': prioritasTinggi.length,
        'sheet-count-prioritas-sedang': prioritasSedang.length
    };
    
    // Apply updates
    Object.entries({ ...desktopElements, ...mobileElements }).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

function formatRupiahShort(number) {
    if (number >= 1000000) {
        return 'Rp ' + (number / 1000000).toFixed(1) + 'jt';
    } else if (number >= 1000) {
        return 'Rp ' + (number / 1000).toFixed(0) + 'rb';
    }
    return 'Rp ' + number;
}

// ==========================================
// Event Handlers
// ==========================================

// Layer visibility state
let showEksisting = true;
let showPotensial = true;

function toggleLayerEksisting(show) {
    showEksisting = show;
    if (show) {
        map.addLayer(layerEksisting);
    } else {
        map.removeLayer(layerEksisting);
    }
    // Sync all checkboxes
    syncCheckboxes('eksisting', show);
}

function toggleLayerPotensial(show) {
    showPotensial = show;
    if (show) {
        map.addLayer(layerPotensial);
    } else {
        map.removeLayer(layerPotensial);
    }
    // Sync all checkboxes
    syncCheckboxes('potensial', show);
}

function syncCheckboxes(type, checked) {
    const ids = type === 'eksisting' 
        ? ['desktop-toggle-eksisting', 'mobile-toggle-eksisting']
        : ['desktop-toggle-potensial', 'mobile-toggle-potensial'];
    
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
    });
}

// Desktop toggle listeners
document.getElementById('desktop-toggle-eksisting')?.addEventListener('change', function() {
    toggleLayerEksisting(this.checked);
});

document.getElementById('desktop-toggle-potensial')?.addEventListener('change', function() {
    toggleLayerPotensial(this.checked);
});

// Mobile toggle listeners
document.getElementById('mobile-toggle-eksisting')?.addEventListener('change', function() {
    toggleLayerEksisting(this.checked);
});

document.getElementById('mobile-toggle-potensial')?.addEventListener('change', function() {
    toggleLayerPotensial(this.checked);
});

// FAB buttons for quick toggle
document.getElementById('fab-filter-eksisting')?.addEventListener('click', function() {
    toggleLayerEksisting(!showEksisting);
    this.style.opacity = showEksisting ? '1' : '0.5';
});

document.getElementById('fab-filter-potensial')?.addEventListener('click', function() {
    toggleLayerPotensial(!showPotensial);
    this.style.opacity = showPotensial ? '1' : '0.5';
});

// Find My Location - unified function with accuracy circle
let userLocationMarker = null;
let userAccuracyCircle = null;
let watchId = null;

function findMyLocation(button) {
    if (!navigator.geolocation) {
        alert('Geolocation tidak didukung oleh browser Anda.');
        return;
    }
    
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = button.classList.contains('fab') ? '⏳' : '⏳ Mencari lokasi...';
    
    // Clear previous watch if exists
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    // Use watchPosition for continuous updates (more accurate over time)
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Remove previous markers
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);
            }
            if (userAccuracyCircle) {
                map.removeLayer(userAccuracyCircle);
            }
            
            // Add accuracy circle (shows how accurate the position is)
            userAccuracyCircle = L.circle([latitude, longitude], {
                radius: accuracy,
                color: COLORS.ui.water,
                fillColor: COLORS.ui.water,
                fillOpacity: 0.15,
                weight: 2
            }).addTo(map);
            
            // Add user location marker with pulsing effect
            userLocationMarker = L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: `<div style="
                        background-color: ${COLORS.ui.water}; 
                        width: 20px; 
                        height: 20px; 
                        border-radius: 50%; 
                        border: 4px solid white; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        animation: pulse 2s infinite;
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            
            // Popup with accuracy info
            const accuracyText = accuracy < 20 ? '🎯 Sangat Akurat' : 
                                 accuracy < 50 ? '✅ Akurat' : 
                                 accuracy < 100 ? '⚠️ Cukup Akurat' : '❌ Kurang Akurat';
            
            userLocationMarker.bindPopup(`
                <div style="text-align: center;">
                    <strong>📍 Lokasi Anda</strong><br>
                    <small>Akurasi: ±${Math.round(accuracy)} meter</small><br>
                    <small>${accuracyText}</small><br>
                    <small style="color: #666;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</small>
                </div>
            `).openPopup();
            
            // Pan to location with appropriate zoom based on accuracy
            const zoomLevel = accuracy < 20 ? 19 : accuracy < 50 ? 18 : accuracy < 100 ? 17 : 16;
            map.setView([latitude, longitude], zoomLevel);
            
            // Reset button
            button.disabled = false;
            button.innerHTML = originalContent;
            
            // Stop watching after getting a good position (accuracy < 30m) or after 5 updates
            if (accuracy < 30) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        },
        (error) => {
            let message = 'Gagal mendapatkan lokasi: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message += 'Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message += 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
                    break;
                case error.TIMEOUT:
                    message += 'Permintaan timeout. Coba lagi di area terbuka.';
                    break;
                default:
                    message += 'Terjadi kesalahan.';
            }
            alert(message);
            
            // Reset button
            button.disabled = false;
            button.innerHTML = originalContent;
            
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        },
        {
            enableHighAccuracy: true,  // Force GPS (not WiFi/Cell)
            timeout: 15000,            // Wait up to 15 seconds
            maximumAge: 0              // Always get fresh position
        }
    );
}

// Desktop locate button
document.getElementById('desktop-btn-locate')?.addEventListener('click', function() {
    findMyLocation(this);
});

// Mobile FAB locate button
document.getElementById('fab-locate')?.addEventListener('click', function() {
    findMyLocation(this);
});

// ==========================================
// Mobile Bottom Sheet
// ==========================================

const bottomSheet = document.getElementById('bottom-sheet');
const sheetHandle = document.getElementById('sheet-handle');
const quickStats = document.getElementById('quick-stats');
let isSheetExpanded = false;

function toggleBottomSheet() {
    isSheetExpanded = !isSheetExpanded;
    bottomSheet.classList.toggle('expanded', isSheetExpanded);
}

// Toggle on handle click
sheetHandle?.addEventListener('click', toggleBottomSheet);
quickStats?.addEventListener('click', toggleBottomSheet);

// Touch gestures for bottom sheet
let startY = 0;
let currentY = 0;

bottomSheet?.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
}, { passive: true });

bottomSheet?.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    
    if (diff > 50 && !isSheetExpanded) {
        toggleBottomSheet();
    } else if (diff < -50 && isSheetExpanded) {
        toggleBottomSheet();
    }
}, { passive: true });

// ==========================================
// Inisialisasi
// ==========================================

// Add pulse animation for user location (using water color: #0077b6)
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(0, 119, 182, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(0, 119, 182, 0); }
        100% { box-shadow: 0 0 0 0 rgba(0, 119, 182, 0); }
    }
`;
document.head.appendChild(style);

// ==========================================
// Add Location Feature
// ==========================================

let isAddMode = false;
let tempMarker = null;
let selectedCoords = null;

const addModeIndicator = document.getElementById('add-mode-indicator');
const addLocationModal = document.getElementById('add-location-modal');
const addLocationForm = document.getElementById('add-location-form');
const inputKategori = document.getElementById('input-kategori');
const inputStatus = document.getElementById('input-status');
const tanggalGroup = document.getElementById('tanggal-group');

// Status options based on category
const statusOptions = {
    'Eksisting': [
        { value: 'Aktif', label: 'Aktif (Berfungsi Baik)' },
        { value: 'Penuh', label: 'Penuh (Perlu Dikuras)' }
    ],
    'Potensial': [
        { value: 'Prioritas Tinggi', label: 'Prioritas Tinggi' },
        { value: 'Prioritas Sedang', label: 'Prioritas Sedang' }
    ]
};

// Toggle Add Mode
function enableAddMode() {
    isAddMode = true;
    addModeIndicator?.classList.add('show');
    map.getContainer().style.cursor = 'crosshair';
    
    // Update FAB button appearance
    const fabAdd = document.getElementById('fab-add');
    if (fabAdd) {
        fabAdd.style.background = COLORS.eksisting.rusak; // status-danger
        fabAdd.innerHTML = '✕';
    }
    
    // Update desktop button
    const desktopBtnAdd = document.getElementById('desktop-btn-add');
    if (desktopBtnAdd) {
        desktopBtnAdd.classList.remove('bg-green-600', 'hover:bg-green-700');
        desktopBtnAdd.classList.add('bg-red-600', 'hover:bg-red-700');
        desktopBtnAdd.innerHTML = '✕ Batal Tambah Lokasi';
    }
}

function disableAddMode() {
    isAddMode = false;
    addModeIndicator?.classList.remove('show');
    map.getContainer().style.cursor = '';
    
    // Remove temp marker if exists
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    selectedCoords = null;
    
    // Reset FAB button
    const fabAdd = document.getElementById('fab-add');
    if (fabAdd) {
        fabAdd.style.background = COLORS.primary.earth; // accent-earth
        fabAdd.innerHTML = '+';
    }
    
    // Reset desktop button
    const desktopBtnAdd = document.getElementById('desktop-btn-add');
    if (desktopBtnAdd) {
        desktopBtnAdd.classList.remove('bg-red-600', 'hover:bg-red-700');
        desktopBtnAdd.classList.add('bg-green-600', 'hover:bg-green-700');
        desktopBtnAdd.innerHTML = '➕ Tambah Lokasi Biopori';
    }
}

function toggleAddMode() {
    if (isAddMode) {
        disableAddMode();
    } else {
        enableAddMode();
    }
}

// Map click handler for adding location
map.on('click', function(e) {
    if (!isAddMode) return;
    
    const { lat, lng } = e.latlng;
    
    // ===== VALIDASI: Cek apakah lokasi dalam batas Desa Jajarwayang =====
    if (!isLocationInsideDesa(lat, lng)) {
        // Tampilkan warning
        alert('⚠️ Lokasi berada di luar Desa Jajarwayang!\n\nAnda hanya dapat menambahkan biopori dalam wilayah desa.');
        console.warn('[Boundary] Location rejected - outside desa boundary');
        return;
    }
    
    selectedCoords = { lat, lng };
    
    // Remove previous temp marker
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    // Add temp marker at clicked location
    tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'temp-marker',
            html: `<div style="
                background-color: ${COLORS.primary.earth}; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                border: 4px solid white; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    
    // Show the form modal
    showAddLocationModal(lat, lng);
});

// Show modal with coordinates
function showAddLocationModal(lat, lng) {
    // Reset form tapi jangan reset input-lat dan input-lng
    const kategoriInput = document.getElementById('input-kategori');
    const statusInput = document.getElementById('input-status');
    const tanggalInput = document.getElementById('input-tanggal');
    const lokasiInput = document.getElementById('input-lokasi');
    const keteranganInput = document.getElementById('input-keterangan');
    
    // Clear other fields but preserve lat/lng
    kategoriInput.value = '';
    statusInput.value = '';
    tanggalInput.value = '';
    lokasiInput.value = '';
    keteranganInput.value = '';
    
    // Set coordinates
    document.getElementById('input-lat').value = lat;
    document.getElementById('input-lng').value = lng;
    
    inputStatus.disabled = true;
    inputStatus.innerHTML = '<option value="">Pilih kategori dulu...</option>';
    tanggalGroup.style.display = 'none';
    
    addLocationModal?.classList.add('show');
}

function hideAddLocationModal() {
    addLocationModal?.classList.remove('show');
}

// Category change handler - update status options
inputKategori?.addEventListener('change', function() {
    const kategori = this.value;
    
    if (kategori && statusOptions[kategori]) {
        inputStatus.disabled = false;
        inputStatus.innerHTML = '<option value="">Pilih status...</option>' + 
            statusOptions[kategori].map(opt => 
                `<option value="${opt.value}">${opt.label}</option>`
            ).join('');
        
        // Show/hide tanggal field based on category
        tanggalGroup.style.display = kategori === 'Eksisting' ? 'block' : 'none';
    } else {
        inputStatus.disabled = true;
        inputStatus.innerHTML = '<option value="">Pilih kategori dulu...</option>';
        tanggalGroup.style.display = 'none';
    }
});

// Form submission - using Firebase
addLocationForm?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Check permission - only owner can add locations
    if (!isOwner) {
        alert('⛔ Hanya admin yang dapat menambahkan lokasi baru. Silakan login dengan akun admin.');
        return;
    }
    
    // Validasi koordinat input
    const latInputStr = document.getElementById('input-lat')?.value?.trim();
    const lngInputStr = document.getElementById('input-lng')?.value?.trim();
    
    if (!latInputStr || !lngInputStr) {
        alert('⚠️ Silakan isi koordinat (latitude dan longitude)!\nAnda bisa:\n1. Klik tombol "📍 Pilih dari Map" untuk memilih dari peta\n2. Atau masukkan angka koordinat secara manual');
        return;
    }
    
    const lat = parseFloat(latInputStr);
    const lng = parseFloat(lngInputStr);
    
    // Validasi format dan range
    if (isNaN(lat) || isNaN(lng)) {
        alert('❌ Format koordinat tidak valid!\nGunakan angka desimal. Contoh: -6.951 dan 109.618');
        return;
    }
    
    if (lat < -90 || lat > 90) {
        alert(`❌ Latitude tidak valid: ${lat}\nRange: -90 sampai 90`);
        return;
    }
    
    if (lng < -180 || lng > 180) {
        alert(`❌ Longitude tidak valid: ${lng}\nRange: -180 sampai 180`);
        return;
    }
    
    console.log('[Form] Coordinates valid:', { lat, lng });
    
    // Cek batas desa
    if (!isLocationInsideDesa(lat, lng)) {
        const confirm_add = window.confirm('⚠️ Koordinat ini berada di LUAR batas Desa Jajarwayang!\n\nLanjutkan menambahkan data ini?');
        if (!confirm_add) return;
    }
    
    const kategori = document.getElementById('input-kategori').value;
    
    if (!kategori) {
        alert('⚠️ Pilih kategori biopori terlebih dahulu!');
        return;
    }
    
    // Generate ID based on kategori
    const prefix = kategori === 'Eksisting' ? 'BPR' : 'POT';
    const timestamp = Date.now();
    const generatedId = `${prefix}-${timestamp}`;
    
    // Create new data entry
    const newEntry = {
        id: generatedId,
        lat: lat,
        lng: lng,
        kategori: kategori,
        tanggal_pasang: document.getElementById('input-tanggal')?.value || '',
        lokasi_detail: document.getElementById('input-lokasi').value,
        status: document.getElementById('input-status').value,
        keterangan: document.getElementById('input-keterangan').value || `Ditambahkan via app ${new Date().toLocaleDateString('id-ID')}`
    };
    
    try {
        // Create in Firebase
        await FirebaseService.createBiopori(newEntry);
        
        // Add to allData array
        allData.push(newEntry);
        
        // Re-render markers and update stats
        renderMarkers();
        updateStatistics();
        
        // Hide modal and disable add mode
        hideAddLocationModal();
        disableAddMode();
        
        // Show success message
        showToast(`✅ Lokasi ${newEntry.id} berhasil disimpan ke Firebase!`);
        
        console.log('[Firebase] New location created:', newEntry);
    } catch (error) {
        console.error('[Firebase] Create error:', error);
        alert('Gagal menyimpan lokasi. Pastikan koneksi internet aktif.');
    }
});

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: ${COLORS.ui.bgDark};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 3000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modal handlers
document.getElementById('btn-close-modal')?.addEventListener('click', function() {
    hideAddLocationModal();
    disableAddMode();
});

document.getElementById('btn-cancel-form')?.addEventListener('click', function() {
    hideAddLocationModal();
    disableAddMode();
});

// Button "Pilih dari Map" - enable add mode
document.getElementById('btn-select-from-map')?.addEventListener('click', function(e) {
    e.preventDefault();
    hideAddLocationModal();
    enableAddMode();
});

// Real-time validation untuk koordinat input
document.getElementById('input-lat')?.addEventListener('change', function() {
    validateAndUpdateCoords();
});

document.getElementById('input-lng')?.addEventListener('change', function() {
    validateAndUpdateCoords();
});

// Validasi koordinat dan tampilkan preview marker
function validateAndUpdateCoords() {
    const latStr = document.getElementById('input-lat')?.value.trim();
    const lngStr = document.getElementById('input-lng')?.value.trim();
    
    // Tunggu sampai keduanya terisi
    if (!latStr || !lngStr) {
        console.log('[Form] Waiting for both coordinates');
        return;
    }
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    // Validasi format - harus angka valid
    if (isNaN(lat) || isNaN(lng)) {
        console.warn('[Form] Invalid coordinate format');
        return;
    }
    
    // Validasi range
    if (lat < -90 || lat > 90) {
        console.warn('[Form] Latitude out of range:', lat);
        return;
    }
    
    if (lng < -180 || lng > 180) {
        console.warn('[Form] Longitude out of range:', lng);
        return;
    }
    
    // Cek apakah dalam batas desa
    if (!isLocationInsideDesa(lat, lng)) {
        console.warn('[Boundary] Coordinates outside desa boundary:', { lat, lng });
        // Tetap biarkan user submit, warning akan ditampilkan saat submit
    }
    
    console.log('[Form] Coordinates valid:', { lat, lng });
}

// Close modal on overlay click
addLocationModal?.addEventListener('click', function(e) {
    if (e.target === this) {
        hideAddLocationModal();
        disableAddMode();
    }
});

// FAB add button handler
document.getElementById('fab-add')?.addEventListener('click', toggleAddMode);

// Desktop add button handler
document.getElementById('desktop-btn-add')?.addEventListener('click', toggleAddMode);

// ==========================================
// Edit Location Modal Handlers
// ==========================================

// Edit kategori change handler
document.getElementById('edit-input-kategori')?.addEventListener('change', function() {
    const kategori = this.value;
    const statusSelect = document.getElementById('edit-input-status');
    const tanggalGroup = document.getElementById('edit-tanggal-group');
    
    if (kategori && statusOptions[kategori]) {
        statusSelect.disabled = false;
        statusSelect.innerHTML = '<option value="">Pilih status...</option>' + 
            statusOptions[kategori].map(opt => 
                `<option value="${opt.value}">${opt.label}</option>`
            ).join('');
        
        // Show/hide tanggal field based on category
        tanggalGroup.style.display = kategori === 'Eksisting' ? 'block' : 'none';
    } else {
        statusSelect.disabled = true;
        statusSelect.innerHTML = '<option value="">Pilih kategori dulu...</option>';
        tanggalGroup.style.display = 'none';
    }
});

// Edit form submission
document.getElementById('edit-location-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!isOwner) {
        alert('⛔ Hanya admin yang dapat mengubah data.');
        return;
    }
    
    if (!currentEditingId) {
        alert('Error: ID tidak ditemukan');
        return;
    }
    
    const kategori = document.getElementById('edit-input-kategori').value;
    const status = document.getElementById('edit-input-status').value;
    
    if (!kategori || !status) {
        alert('⚠️ Silakan pilih kategori dan status');
        return;
    }
    
    try {
        // Update di Firebase
        const updatedData = {
            kategori: kategori,
            status: status,
            tanggal_pasang: document.getElementById('edit-input-tanggal').value || '',
            lokasi_detail: document.getElementById('edit-input-lokasi').value,
            keterangan: document.getElementById('edit-input-keterangan').value
        };
        
        await FirebaseService.updateBiopori(currentEditingId, updatedData);
        
        // Update lokal array
        const itemIndex = allData.findIndex(x => x.id === currentEditingId);
        if (itemIndex !== -1) {
            allData[itemIndex] = { ...allData[itemIndex], ...updatedData };
        }
        
        // Re-render
        renderMarkers();
        updateStatistics();
        
        // Tutup modal
        hideEditModal();
        map.closePopup();
        
        // Show success
        showToast(`✅ Kondisi ${currentEditingId} berhasil diperbarui!`);
        
        console.log('[Firebase] Update successful:', currentEditingId);
    } catch (error) {
        console.error('[Firebase] Update error:', error);
        alert('Gagal mengubah data. Silakan coba lagi.');
    }
});

// Close edit modal buttons
document.getElementById('btn-edit-close-modal')?.addEventListener('click', hideEditModal);
document.getElementById('btn-edit-cancel-form')?.addEventListener('click', hideEditModal);

// Delete button in edit modal
document.getElementById('btn-edit-delete')?.addEventListener('click', async function(e) {
    e.preventDefault();
    if (currentEditingId) {
        hideEditModal();
        await deleteLocation(currentEditingId);
    }
});

// Close modal on overlay click
document.getElementById('edit-location-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        hideEditModal();
    }
});

// Expose for onclick handlers
window.openEditModal = openEditModal;

// ==========================================
// Export Data Function (for saving to CSV)
// ==========================================

function exportToCSV() {
    const headers = ['id', 'lat', 'lng', 'kategori', 'tanggal_pasang', 'lokasi_detail', 'status', 'keterangan'];
    const csvContent = [
        headers.join(','),
        ...allData.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biopori-data-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Expose export function globally
window.exportBioporiData = exportToCSV;

// ==========================================
// Import Data from CSV
// ==========================================

async function importDataFromCSV() {
    try {
        console.log('📥 Starting CSV import...');
        const response = await fetch('data.csv');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        
        let count = 0;
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const [id, lat, lng, kategori, tanggal_pasang, lokasi_detail, status, keterangan] = lines[i].split(',');
            
            const data = {
                id: id.trim(),
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                kategori: kategori.trim(),
                tanggal_pasang: tanggal_pasang.trim(),
                lokasi_detail: lokasi_detail.trim(),
                status: status.trim(),
                keterangan: keterangan.trim()
            };
            
            await FirebaseService.createBiopori(data);
            console.log(`✅ Imported: ${data.id}`);
            count++;
        }
        
        console.log(`✅ All ${count} data imported!`);
        
        // Reload to show all data
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('❌ Import error:', error);
    }
}

// Expose import function globally
window.importDataFromCSV = importDataFromCSV;

// Expose deleteLocation for onclick handlers
window.deleteLocation = deleteLocation;

// Load data dan setup Firebase listener saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupFirebaseListener();
});
