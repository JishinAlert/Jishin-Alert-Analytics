// 📱 MOBILE HAMBURGER MENU - SCROLL FIX

console.log("📱 Mobile menu.js loading...");

window.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    console.log("🔍 Looking for mobile menu elements...");
    console.log("  menuBtn:", menuBtn ? "✅ Found" : "❌ Not found");
    console.log("  sidebar:", sidebar ? "✅ Found" : "❌ Not found");
    console.log("  overlay:", overlay ? "✅ Found" : "❌ Not found");
    
    if (!menuBtn || !sidebar || !overlay) {
        console.log("ℹ️ Mobile menu elements not found");
        return;
    }

    console.log("✅ All mobile menu elements found!");

    // ✅ CRITICAL: Ensure body can scroll
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';

    // Toggle menu
    menuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🍔 Hamburger clicked!");
        
        const isActive = menuBtn.classList.contains('active');
        
        if (isActive) {
            console.log("🔒 Closing menu");
            closeMenu();
        } else {
            console.log("🔓 Opening menu");
            openMenu();
        }
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔒 Overlay clicked, closing menu");
        closeMenu();
    });

    // Close menu when nav item clicked (mobile only)
    const navItems = document.querySelectorAll('.nav-item');
    console.log(`📋 Found ${navItems.length} nav items`);
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                console.log("📱 Nav item clicked on mobile, closing menu");
                closeMenu();
            }
        });
    });

    // ✅ Helper functions
    function openMenu() {
        menuBtn.classList.add('active');
        sidebar.classList.add('active');
        overlay.classList.add('active');
        
        // ✅ CRITICAL: Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menuBtn.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        
        // ✅ CRITICAL: Re-enable body scroll when menu closes
        document.body.style.overflow = 'auto';
    }

    // ✅ Close menu on window resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMenu();
            document.body.style.overflow = 'auto';
        }
    });

    console.log("✅ Mobile menu initialized!");
});

console.log("✅ Mobile menu.js ready!");