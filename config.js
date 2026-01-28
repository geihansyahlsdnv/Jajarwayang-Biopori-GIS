// ==========================================
// Firebase Configuration
// IMPORTANT: Fill in your Firebase credentials from console.firebase.google.com
// Get these from: Project Settings → Your apps → Web app → firebaseConfig
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyD9vOn4Z4T5Wxp1HpQg1s2y9iQbKpSC6W8",
    authDomain: "jajarwayang-biopori-gis.firebaseapp.com",
    databaseURL: "https://jajarwayang-biopori-gis-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "jajarwayang-biopori-gis",
    storageBucket: "jajarwayang-biopori-gis.firebasestorage.app",
    messagingSenderId: "100000397446",
    appId: "1:100000397446:web:345c7f5ac6e757de18f907"
};

// ==========================================
// Owner Configuration (for access control)
// ==========================================
// Set this to the owner/admin email address
// Only this email can add/edit/delete biopori data
// Others can only view (readonly mode)

const OWNER_EMAIL = 'geihansyahlsdnv@gmail.com'; // Change to actual owner email

// Example (DO NOT use in production - get your own credentials):
// const firebaseConfig = {
//     apiKey: "AIzaSyDjPkL3KnK0EkV7m2X1A2B3C4D5E6F7G8H",
//     authDomain: "biopori-gis.firebaseapp.com",
//     projectId: "biopori-gis",
//     storageBucket: "biopori-gis.appspot.com",
//     messagingSenderId: "123456789",
//     appId: "1:123456789:web:abcd1234efgh5678",
//     measurementId: "G-ABCD1234EF"
// };

// Validate configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_")) {
    console.error('[Config] ❌ Firebase configuration is not set!');
    console.error('[Config] Please fill in firebaseConfig in config.js with your Firebase credentials.');
    console.error('[Config] Get your credentials from: console.firebase.google.com → Project Settings → Your apps');
} else {
    console.log('[Config] ✅ Firebase configuration loaded');
}

// Export both config and owner email
export { firebaseConfig as default, OWNER_EMAIL };
