// 🔐 ADMIN LOGIN - WAIT FOR FIREBASE

console.log("🔐 Auth script loading...");

// Function to wait for Firebase to be ready
function waitForFirebase(callback, attempts = 0) {
    console.log(`⏳ Checking Firebase... Attempt ${attempts + 1}`);
    
    if (window.auth && window.db) {
        console.log("✅ Firebase is ready!");
        callback();
    } else if (attempts < 20) {
        // Try again after 500ms
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

        // Login form submit
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            
            console.log("🔑 Login button clicked!");

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            console.log("📧 Email:", email);

            // Show loading
            loginBtn.disabled = true;
            loginBtn.innerHTML = '🔄 Logging in...';
            errorMessage.style.display = 'none';

            // Sign in with Firebase
            console.log("🔐 Signing in...");
            
            window.auth.signInWithEmailAndPassword(email, password)
                .then(function(userCredential) {
                    console.log("✅ Signed in successfully!");
                    const user = userCredential.user;
                    console.log("👤 User ID:", user.uid);

                    // Check admin collection
                    console.log("🔍 Checking Admin collection...");
                    return window.db.collection('Admin').doc(user.uid).get();
                })
                .then(function(doc) {
                    console.log("📄 Document retrieved, exists:", doc.exists);

                    if (!doc.exists) {
                        throw new Error('User not found in Admin collection!');
                    }

                    const data = doc.data();
                    console.log("👤 User data:", data);

                    if (data.isAdmin === true || data.role === 'admin') {
                        console.log("✅ Admin verified!");
                        
                        // Save session
                        localStorage.setItem('adminEmail', email);
                        localStorage.setItem('adminName', data.displayName || 'Admin');
                        
                        // Show success message
                        loginBtn.innerHTML = '✅ Success! Redirecting...';
                        
                        // Redirect
                        setTimeout(function() {
                            console.log("🚀 Redirecting to dashboard...");
                            window.location.href = 'dashboard.html';
                        }, 500);
                    } else {
                        throw new Error('Access Denied: You are not an admin!');
                    }
                })
                .catch(function(error) {
                    console.error("❌ Login error:", error);
                    
                    let errorMsg = 'Login failed!';
                    
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        errorMsg = 'Wrong email or password!';
                    } else if (error.code === 'auth/user-not-found') {
                        errorMsg = 'User not found!';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMsg = 'Invalid email format!';
                    } else if (error.code === 'auth/network-request-failed') {
                        errorMsg = 'Network error!';
                    } else if (error.message) {
                        errorMsg = error.message;
                    }
                    
                    errorMessage.textContent = '❌ ' + errorMsg;
                    errorMessage.style.display = 'block';
                    
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = 'Login to Dashboard';
                    
                    // Sign out
                    if (window.auth.currentUser) {
                        window.auth.signOut();
                    }
                });

            return false;
        };

        console.log("✅ Login form initialized!");
    });
});