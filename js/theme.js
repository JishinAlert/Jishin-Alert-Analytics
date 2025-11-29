// 🎨 THEME SWITCHER - Works on ALL Pages (Login + Dashboard)

console.log("🎨 Theme.js loading...");

// ✅ STEP 1: Apply saved theme IMMEDIATELY (before page renders)
const savedTheme = localStorage.getItem('adminTheme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
console.log(`✅ Theme applied: ${savedTheme}`);

// ✅ STEP 2: Initialize toggle button (only on dashboard)
window.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (!themeToggle) {
        console.log("ℹ️ No theme toggle found (probably login page)");
        return;
    }

    console.log("🎛️ Theme toggle found, initializing...");

    // Set initial state
    updateToggleState();

    // Add click event
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        console.log(`🔄 Switching: ${currentTheme} → ${newTheme}`);
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('adminTheme', newTheme);
        
        // Update UI
        updateToggleState();
        showThemeNotification(newTheme);
    });

    console.log("✅ Theme toggle initialized!");
});

// Update toggle appearance
function updateToggleState() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const toggle = document.getElementById('themeToggle');
    
    if (!toggle) return;
    
    if (currentTheme === 'dark') {
        toggle.classList.add('dark');
    } else {
        toggle.classList.remove('dark');
    }
}

// Show notification
function showThemeNotification(theme) {
    // Remove existing notification
    const existingNotif = document.querySelector('.theme-notification');
    if (existingNotif) existingNotif.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 28px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
        z-index: 10000;
        animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 700;
        font-size: 0.95rem;
        letter-spacing: 0.3px;
    `;
    
    notification.textContent = theme === 'dark' 
        ? '🌙 Dark Mode Enabled' 
        : '☀️ Light Mode Enabled';
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes slideOutDown {
        from {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
        }
    }
`;
document.head.appendChild(style);

console.log("✅ Theme.js ready!");