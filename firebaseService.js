// ==========================================
// Firebase Service Layer
// Handles Firebase Realtime Database + Authentication
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    get, 
    set, 
    push, 
    remove, 
    onValue,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Load Firebase config from environment variables (Vercel/Production) or import from file (Development)
let firebaseConfig;

// Try environment variables first (Vercel production)
if (import.meta.env.VITE_FIREBASE_API_KEY) {
    console.log('[Firebase] Loading config from environment variables (production)');
    firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
} else {
    // Try development file
    try {
        console.log('[Firebase] Loading config from config.js.local (development)');
        const config = await import("./config.js.local");
        firebaseConfig = config.default;
    } catch (e) {
        try {
            const config = await import("./config.js");
            firebaseConfig = config.default;
        } catch (e2) {
            console.error('[Firebase] Config not found!');
            console.error('[Firebase] For development: create config.js.local with your Firebase credentials');
            console.error('[Firebase] For Vercel: add environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.');
            throw new Error('Firebase configuration not found. See console for details.');
        }
    }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ==========================================
// Firebase Service Methods
// ==========================================

export const FirebaseService = {
    
    /**
     * Get all biopori data
     */
    async getAllBiopori() {
        try {
            const snapshot = await get(ref(database, 'biopori'));
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Convert Firebase object to array
                return Object.entries(data).map(([key, value]) => ({
                    ...value,
                    firebaseKey: key
                }));
            }
            return [];
        } catch (error) {
            console.error('[Firebase] Error getting all biopori:', error);
            throw error;
        }
    },

    /**
     * Get biopori by ID
     */
    async getBioporiById(id) {
        try {
            const snapshot = await get(ref(database, `biopori/${id}`));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('[Firebase] Error getting biopori by ID:', error);
            throw error;
        }
    },

    /**
     * Create new biopori entry
     */
    async createBiopori(data) {
        try {
            // Generate ID if not provided
            const id = data.id || `BPR-${Date.now()}`;
            
            const bioporiRef = ref(database, `biopori/${id}`);
            await set(bioporiRef, {
                id,
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            console.log(`[Firebase] Biopori "${id}" created successfully`);
            return { success: true, id };
        } catch (error) {
            console.error('[Firebase] Error creating biopori:', error);
            throw error;
        }
    },

    /**
     * Update biopori entry
     */
    async updateBiopori(id, data) {
        try {
            const bioporiRef = ref(database, `biopori/${id}`);
            await set(bioporiRef, {
                ...data,
                id,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`[Firebase] Biopori "${id}" updated successfully`);
            return { success: true };
        } catch (error) {
            console.error('[Firebase] Error updating biopori:', error);
            throw error;
        }
    },

    /**
     * Delete biopori entry
     */
    async deleteBiopori(id) {
        try {
            const bioporiRef = ref(database, `biopori/${id}`);
            await remove(bioporiRef);
            
            console.log(`[Firebase] Biopori "${id}" deleted successfully`);
            return { success: true };
        } catch (error) {
            console.error('[Firebase] Error deleting biopori:', error);
            throw error;
        }
    },

    /**
     * Get statistics
     */
    async getStats() {
        try {
            const data = await this.getAllBiopori();
            
            const eksisting = data.filter(d => d.kategori?.toLowerCase() === 'eksisting');
            const potensial = data.filter(d => d.kategori?.toLowerCase() === 'potensial');
            
            const prioritasTinggi = potensial.filter(d => d.status?.toLowerCase() === 'prioritas tinggi');
            const prioritasSedang = potensial.filter(d => d.status?.toLowerCase() === 'prioritas sedang');
            
            return {
                eksisting: eksisting.length,
                potensial: potensial.length,
                prioritasTinggi: prioritasTinggi.length,
                prioritasSedang: prioritasSedang.length,
                total: data.length
            };
        } catch (error) {
            console.error('[Firebase] Error getting stats:', error);
            throw error;
        }
    },

    /**
     * Listen to real-time updates
     */
    onBioporiChange(callback) {
        try {
            const bioporiRef = ref(database, 'biopori');
            
            return onValue(bioporiRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const array = Object.entries(data).map(([key, value]) => ({
                        ...value,
                        firebaseKey: key
                    }));
                    callback(array);
                } else {
                    callback([]);
                }
            }, (error) => {
                console.error('[Firebase] Real-time listener error:', error);
            });
        } catch (error) {
            console.error('[Firebase] Error setting up listener:', error);
            throw error;
        }
    },

    /**
     * Import data dari CSV (bulk insert)
     */
    async importFromCSV(csvData) {
        try {
            const bioporiRef = ref(database, 'biopori');
            const importedIds = [];
            
            for (const row of csvData) {
                const id = row.id || `BPR-${Date.now()}-${Math.random()}`;
                await set(ref(database, `biopori/${id}`), {
                    id,
                    ...row,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                importedIds.push(id);
            }
            
            console.log(`[Firebase] Imported ${importedIds.length} records`);
            return { success: true, count: importedIds.length, ids: importedIds };
        } catch (error) {
            console.error('[Firebase] Error importing data:', error);
            throw error;
        }
    },

    /**
     * Export all data
     */
    async exportToJSON() {
        try {
            const data = await this.getAllBiopori();
            const json = JSON.stringify(data, null, 2);
            
            // Create downloadable blob
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `biopori-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            return { success: true, count: data.length };
        } catch (error) {
            console.error('[Firebase] Error exporting data:', error);
            throw error;
        }
    },

    /**
     * Clear all data (danger!)
     */
    async clearAllData() {
        try {
            if (!confirm('⚠️ Ini akan MENGHAPUS SEMUA data! Lanjutkan?')) {
                return { success: false, message: 'Cancelled' };
            }
            
            const bioporiRef = ref(database, 'biopori');
            await remove(bioporiRef);
            
            console.log('[Firebase] All data cleared');
            return { success: true };
        } catch (error) {
            console.error('[Firebase] Error clearing data:', error);
            throw error;
        }
    },

    // ==========================================
    // Authentication Methods
    // ==========================================

    /**
     * Login dengan Google
     */
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log('[Auth] User logged in:', result.user.email);
            return result.user;
        } catch (error) {
            console.error('[Auth] Login error:', error);
            throw error;
        }
    },

    /**
     * Logout
     */
    async logout() {
        try {
            await signOut(auth);
            console.log('[Auth] User logged out');
        } catch (error) {
            console.error('[Auth] Logout error:', error);
            throw error;
        }
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return auth.currentUser;
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, callback);
    }
};

export default FirebaseService;
