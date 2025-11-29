// MAIN DASHBOARD APP - FIXED TIMESTAMP HANDLING

console.log("📱 App.js loading...");

window.addEventListener('firebaseReady', function() {
    console.log("🚀 App initialized!");
    initializeNavigation();
    initializeRefreshButton();
    loadOverviewData();
});

function initializeNavigation() {
    console.log("🧭 Setting up navigation...");
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageName = this.getAttribute('data-page');
            console.log("📄 Navigating to:", pageName);

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            pages.forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(pageName + 'Page');
            if (targetPage) {
                targetPage.classList.add('active');
                updatePageTitle(pageName);
                loadPageData(pageName);
            }
        });
    });

    console.log("✅ Navigation ready");
}

function updatePageTitle(pageName) {
    const titles = {
        'overview': 'Overview Dashboard',
        'users': 'User Management',
        'gameplay': 'Gameplay History',
        'assessment': 'Assessment Analytics',
        'feedback': 'Feedback',
        'crashes': 'Crash Reports'
    };

    const subtitles = {
        'overview': 'Real-time analytics and insights',
        'users': 'View and manage all users',
        'gameplay': 'Complete gameplay history',
        'assessment': 'Quiz performance analytics',
        'feedback': 'User feedback and ratings',
        'crashes': 'Error tracking and debugging'
    };

    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
    document.getElementById('pageSubtitle').textContent = subtitles[pageName] || '';
}

function loadPageData(pageName) {
    console.log("📊 Loading data for:", pageName);

    switch(pageName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'users':
            if (typeof loadUsers === 'function') loadUsers();
            break;
        case 'gameplay':
            if (typeof loadGameplayHistory === 'function') loadGameplayHistory();
            break;
        case 'assessment':
            if (typeof loadAssessmentData === 'function') loadAssessmentData();
            break;
        case 'feedback':
            if (typeof loadFeedback === 'function') loadFeedback();
            break;
        case 'crashes':
            if (typeof loadCrashReports === 'function') loadCrashReports();
            break;
    }
}

async function loadOverviewData() {
    console.log("📊 Loading overview data...");

    try {
        const [usersData, gameplayData, quizData] = await Promise.all([
            loadUsersCount(),
            loadGameplayCount(),
            loadQuizCount()
        ]);

        document.getElementById('totalUsers').textContent = usersData.total;
        document.getElementById('totalGames').textContent = gameplayData.total;
        document.getElementById('totalQuizzes').textContent = quizData.total;
        document.getElementById('avgScore').textContent = gameplayData.avgScore + '%';

        updateLastUpdated();

        if (typeof loadOverviewCharts === 'function') {
            loadOverviewCharts();
        }

        loadRecentActivity();

        console.log("✅ Overview data loaded!");

    } catch (error) {
        console.error("❌ Error loading overview:", error);
    }
}

async function loadUsersCount() {
    try {
        const snapshot = await window.db.collection('users').get();
        return { total: snapshot.size };
    } catch (error) {
        console.error("Error loading users:", error);
        return { total: 0 };
    }
}

async function loadGameplayCount() {
    try {
        let totalGames = 0;
        let totalScore = 0;
        let gameCount = 0;

        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory').get();
            totalGames += gameplaySnapshot.size;

            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.finalScore) {
                    totalScore += data.finalScore;
                    gameCount++;
                }
            });
        }

        const avgScore = gameCount > 0 ? Math.round((totalScore / gameCount) * 100 / 300) : 0;

        return { total: totalGames, avgScore };
    } catch (error) {
        console.error("Error loading gameplay:", error);
        return { total: 0, avgScore: 0 };
    }
}

async function loadQuizCount() {
    try {
        let totalQuizzes = 0;

        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const quizSnapshot = await userDoc.ref.collection('quizHistory').get();
            totalQuizzes += quizSnapshot.size;
        }

        return { total: totalQuizzes };
    } catch (error) {
        console.error("Error loading quizzes:", error);
        return { total: 0 };
    }
}

//  ⭐ FIXED: Handle both Firestore timestamps AND string timestamps
async function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    activityList.innerHTML = '<p class="loading">Loading recent activity...</p>';

    try {
        const activities = [];
        const usersSnapshot = await window.db.collection('users').limit(20).get();

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userName = userData.displayName || userData.name || 'Unknown User';

            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory')
                .orderBy('timestamp', 'desc')
                .limit(3)
                .get();

            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                
                // ⭐ FIX: Handle both timestamp types
                let timestamp = new Date();
                if (data.timestamp) {
                    if (typeof data.timestamp === 'string') {
                        timestamp = new Date(data.timestamp);
                    } else if (data.timestamp.toDate) {
                        timestamp = data.timestamp.toDate();
                    }
                }
                
                activities.push({
                    type: 'gameplay',
                    user: userName,
                    action: `Completed ${data.gameMode || 'Normal'} mode - Score: ${data.finalScore || 0}`,
                    timestamp: timestamp,
                    icon: '🎮'
                });
            });

            const quizSnapshot = await userDoc.ref.collection('quizHistory')
                .orderBy('timestamp', 'desc')
                .limit(3)
                .get();

            quizSnapshot.forEach(doc => {
                const data = doc.data();
                
                // ⭐ FIX: Handle both timestamp types
                let timestamp = new Date();
                if (data.timestamp) {
                    if (typeof data.timestamp === 'string') {
                        timestamp = new Date(data.timestamp);
                    } else if (data.timestamp.toDate) {
                        timestamp = data.timestamp.toDate();
                    }
                }
                
                activities.push({
                    type: 'quiz',
                    user: userName,
                    action: `Took ${data.difficulty || 'Easy'} quiz - Score: ${data.correctAnswers}/${data.totalQuestions}`,
                    timestamp: timestamp,
                    icon: '📝'
                });
            });
        }

        activities.sort((a, b) => b.timestamp - a.timestamp);

        activityList.innerHTML = '';
        activities.slice(0, 10).forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <p><strong>${activity.user}</strong> ${activity.action}</p>
                    <p class="activity-time">${formatTimeAgo(activity.timestamp)}</p>
                </div>
            `;
            activityList.appendChild(item);
        });

        if (activities.length === 0) {
            activityList.innerHTML = '<p class="loading">No recent activity</p>';
        }

    } catch (error) {
        console.error("Error loading activity:", error);
        activityList.innerHTML = '<p class="loading">Error loading activity</p>';
    }
}

function initializeRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log("🔄 Refreshing data...");
            this.disabled = true;
            this.innerHTML = '<span>🔄 Refreshing...</span>';

            const activePage = document.querySelector('.nav-item.active').getAttribute('data-page');
            loadPageData(activePage);

            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = '<span>🔄 Refresh Data</span>';
            }, 2000);
        });
    }
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdated').textContent = timeString;
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    
    return date.toLocaleDateString();
}

console.log("✅ App.js loaded");