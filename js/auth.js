// ADMIN LOGIN

console.log("🔐 Auth script loading...");

// Function to wait for Firebase to be ready
function waitForFirebase(callback, attempts = 0) {
    console.log(`⏳ Checking Firebase... Attempt ${attempts + 1}`);
    
    if (window.auth && window.db) {
        console.log("✅ Firebase is ready!");
        callback();
    } else if (attempts < 20) {
        setTimeout(function() {
            waitForFirebase(callback, attempts + 1);
        }, 500);
    } else {
        console.error("❌ Firebase failed to load after 10 seconds!");
        alert("Failed to load Firebase. Please refresh the page.");
    }
}

// Wait for both DOM and Firebase to be ready
window.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM loaded, waiting for Firebase...");
    
    waitForFirebase(function() {
        console.log("🚀 Initializing login form...");
        
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const errorMessage = document.getElementById('errorMessage');

        if (!loginForm) {
            console.error("❌ Login form not found!");
            return;
        }

        // ✅ NEW: UserID Login System
        loginForm.onsubmit = async function(e) {
            e.preventDefault();
            
            console.log("🔑 Login button clicked!");

            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;

            console.log("👤 UserID entered:", userId);

            // Show loading state
            loginBtn.disabled = true;
            loginBtn.innerHTML = '🔄 Logging in...';
            errorMessage.style.display = 'none';

            try {
                // ✅ STEP 1: Query Firestore to find admin with this userID
                console.log("🔍 Searching for admin with userID:", userId);
                
                const adminQuery = await window.db.collection('Admin')
                    .where('userID', '==', userId)
                    .limit(1)
                    .get();

                if (adminQuery.empty) {
                    console.error("❌ No admin found with userID:", userId);
                    throw new Error('Invalid User ID! Admin not found.');
                }

                // ✅ STEP 2: Get the admin document
                const adminDoc = adminQuery.docs[0];
                const adminData = adminDoc.data();
                
                console.log("✅ Found admin:", adminData.displayName);
                console.log("📧 Admin email:", adminData.email);

                // ✅ STEP 3: Verify admin status
                if (adminData.isAdmin !== true && adminData.role !== 'admin') {
                    console.error("❌ User is not an admin");
                    throw new Error('Access Denied: You are not an admin!');
                }

                // ✅ STEP 4: Sign in with Firebase Auth using the email from Firestore
                console.log("🔐 Signing in with Firebase Auth...");
                
                const userCredential = await window.auth.signInWithEmailAndPassword(
                    adminData.email, 
                    password
                );

                console.log("✅ Firebase Auth successful!");
                console.log("👤 User UID:", userCredential.user.uid);

                // ✅ STEP 5: Save session data
                localStorage.setItem('adminUserId', userId);
                localStorage.setItem('adminEmail', adminData.email);
                localStorage.setItem('adminName', adminData.displayName || 'Admin');
                
                console.log("💾 Session saved");
                
                // Show success message
                loginBtn.innerHTML = '✅ Success! Redirecting...';
                
                // Redirect to dashboard
                setTimeout(function() {
                    console.log("🚀 Redirecting to dashboard...");
                    window.location.href = 'dashboard.html';
                }, 500);

            } catch (error) {
                console.error("❌ Login error:", error);
                
                let errorMsg = 'Login failed!';
                
                // Handle different error types
                if (error.message.includes('Invalid User ID')) {
                    errorMsg = '❌ Invalid User ID! Admin not found.';
                } else if (error.message.includes('Access Denied')) {
                    errorMsg = '❌ Access Denied: You are not an admin!';
                } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMsg = '❌ Wrong password!';
                } else if (error.code === 'auth/user-not-found') {
                    errorMsg = '❌ User not found in authentication system!';
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = '❌ Invalid email format in database!';
                } else if (error.code === 'auth/network-request-failed') {
                    errorMsg = '❌ Network error! Check your connection.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg = '❌ Too many failed attempts! Try again later.';
                } else if (error.message) {
                    errorMsg = '❌ ' + error.message;
                }
                
                // Display error message
                errorMessage.textContent = errorMsg;
                errorMessage.style.display = 'block';
                
                // Reset button
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span>Login to Dashboard</span>';
                
                // Sign out if somehow logged in
                if (window.auth.currentUser) {
                    await window.auth.signOut();
                    console.log("🔓 Signed out due to error");
                }
            }

            return false;
        };

        console.log("✅ Login form initialized with UserID system!");
    });
});