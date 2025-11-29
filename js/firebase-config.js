// 🔥 FIREBASE CONFIGURATION

console.log("🔥 Firebase config loading...");

const firebaseConfig = {
    apiKey: "AIzaSyAePwIbPbjjgFlaHSD3cbvTLQewpxVkQ2E",
    authDomain: "jishinalertdatabase.firebaseapp.com",
    projectId: "jishinalertdatabase",
    storageBucket: "jishinalertdatabase.firebasestorage.app",
    messagingSenderId: "87614289165",
    appId: "1:87614289165:web:056729782ca2434111ac44",
    measurementId: "G-4P8ZH45YH4"
};

// Wait a bit for Firebase SDK to load
setTimeout(function() {
    console.log("🔥 Initializing Firebase...");
    console.log("🔍 Firebase available?", typeof firebase);
    
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK not loaded!");
        return;
    }

    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized");

        // Create global variables
        window.auth = firebase.auth();
        window.db = firebase.firestore();

        console.log("✅ Auth ready:", !!window.auth);
        console.log("✅ Firestore ready:", !!window.db);
        
        // Dispatch event
        window.dispatchEvent(new Event('firebaseReady'));
        console.log("✅ Firebase fully ready!");
        
    } catch (error) {
        console.error("❌ Firebase error:", error);
    }
}, 500); // Wait 500ms for SDK to load