// 🛡️ DASHBOARD PROTECTION

console.log("🛡️ Dashboard protection loading...");

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.auth && window.db) {
            console.log("✅ Firebase already ready!");
            resolve();
        } else {
            console.log("⏳ Waiting for Firebase...");
            window.addEventListener('firebaseReady', () => {
                console.log("✅ Firebase ready event received!");
                resolve();
            });
        }
    });
}

// Initialize dashboard protection
waitForFirebase().then(() => {
    console.log("🚀 Initializing dashboard protection...");
    
    // Check authentication on page load
    window.auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // No user logged in
            console.log("❌ No user logged in");
            redirectToLogin();
            return;
        }
        
        console.log("✅ User logged in:", user.uid);
        
        try {
            // Check if user is admin
            const userDoc = await window.db.collection('Admin').doc(user.uid).get();
            
            if (!userDoc.exists) {
                console.log("❌ User document not found");
                redirectToLogin();
                return;
            }
            
            const userData = userDoc.data();
            console.log("👤 User data:", userData);
            
            if (userData.isAdmin !== true && userData.role !== 'admin') {
                console.log("❌ User is not an admin");
                alert("Access Denied: You are not authorized to access this dashboard.");
                redirectToLogin();
                return;
            }
            
            console.log("✅ Admin verified!");
            
            // Display admin info
            displayAdminInfo(userData);
            
        } catch (error) {
            console.error("❌ Error checking admin status:", error);
            redirectToLogin();
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.auth.signOut();
                localStorage.clear();
                console.log("✅ Logged out successfully");
                window.location.href = 'admin.html';
            } catch (error) {
                console.error("❌ Logout error:", error);
            }
        });
        console.log("✅ Logout button handler attached");
    }
});

// Display admin information
function displayAdminInfo(userData) {
    const adminNameElement = document.getElementById('adminName');
    const adminEmailElement = document.getElementById('adminEmail');
    
    if (adminNameElement) {
        adminNameElement.textContent = userData.displayName || 'Admin';
    }
    
    if (adminEmailElement) {
        adminEmailElement.textContent = userData.email || '';
    }
}

// Redirect to login
function redirectToLogin() {
    if (window.auth) {
        window.auth.signOut();
    }
    localStorage.clear();
    window.location.href = 'admin.html';
}

console.log("✅ Dashboard protection loaded");