// USERS MANAGEMENT - TABLE VERSION (NO EMAIL)
console.log("👥 Users.js loaded");

let allUsers = [];
let filteredUsers = [];
let currentUserPage = 1;
const userItemsPerPage = 20;

async function loadUsers() {
    console.log("📥 Loading users...");

    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>';

    try {
        const snapshot = await window.db.collection('users').get();
        allUsers = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;

            const gameplaySnapshot = await doc.ref.collection('gameplayHistory').get();
            const gameplayCount = gameplaySnapshot.size;

            const quizSnapshot = await doc.ref.collection('quizHistory').get();
            const quizCount = quizSnapshot.size;

            const feedbackSnapshot = await window.db.collection('feedbacks')
                .where('userId', '==', userId)
                .get();
            const feedbackCount = feedbackSnapshot.size;

            allUsers.push({
                id: userId,
                name: userData.displayName || userData.name || 'Unknown',
                age: userData.age || null,
                gamesPlayed: gameplayCount,
                quizzesTaken: quizCount,
                feedbacksGiven: feedbackCount,
                totalActivity: gameplayCount + quizCount + feedbackCount
            });
        }

        console.log(`✅ Loaded ${allUsers.length} users`);
        
        updateUserStats();
        
        filteredUsers = [...allUsers];
        currentUserPage = 1;
        displayUsers();

    } catch (error) {
        console.error("❌ Error loading users:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">Error loading users</td></tr>';
    }
}

function updateUserStats() {
    const totalUsersEl = document.getElementById('totalUsersCount');
    if (totalUsersEl) totalUsersEl.textContent = allUsers.length;

    const activePlayers = allUsers.filter(u => u.gamesPlayed > 0).length;
    const activePlayersEl = document.getElementById('activePlayersCount');
    if (activePlayersEl) activePlayersEl.textContent = activePlayers;

    const quizTakers = allUsers.filter(u => u.quizzesTaken > 0).length;
    const quizTakersEl = document.getElementById('quizTakersCount');
    if (quizTakersEl) quizTakersEl.textContent = quizTakers;

    const feedbackContributors = allUsers.filter(u => u.feedbacksGiven > 0).length;
    const feedbackContributorsEl = document.getElementById('feedbackContributorsCount');
    if (feedbackContributorsEl) feedbackContributorsEl.textContent = feedbackContributors;
}

function displayUsers() {
    const tableBody = document.getElementById('usersTableBody');

    if (filteredUsers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    const startIndex = (currentUserPage - 1) * userItemsPerPage;
    const endIndex = startIndex + userItemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    paginatedUsers.forEach(user => {
        const row = document.createElement('tr');
        
        const totalActivity = user.gamesPlayed + user.quizzesTaken;
        let activityBadge = 'badge-danger';
        let activityText = 'Inactive';
        
        if (totalActivity >= 10) {
            activityBadge = 'badge-success';
            activityText = 'Active';
        } else if (totalActivity >= 3) {
            activityBadge = 'badge-warning';
            activityText = 'Moderate';
        } else if (totalActivity >= 1) {
            activityBadge = 'badge-info';
            activityText = 'New';
        }

        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--button-gradient); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1rem; flex-shrink: 0;">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style="font-weight: 600; color: var(--text-primary);">${user.name}</span>
                </div>
            </td>
            <td>${user.age ? `<span style="color: var(--text-primary);">${user.age}</span>` : '<span style="color: #64748b;">N/A</span>'}</td>
            <td><span class="badge badge-info">${user.gamesPlayed}</span></td>
            <td><span class="badge badge-info">${user.quizzesTaken}</span></td>
            <td><span class="badge badge-info">${user.feedbacksGiven}</span></td>
            <td><span class="badge ${activityBadge}">${activityText}</span></td>
            <td><button class="btn-view" onclick="showUserDetails('${user.id}')">View</button></td>
        `;
        tableBody.appendChild(row);
    });

    addUserPagination();
}

function addUserPagination() {
    const tableContainer = document.querySelector('#usersPage .table-container');
    const totalPages = Math.ceil(filteredUsers.length / userItemsPerPage);

    const existingPagination = tableContainer.querySelector('.pagination-controls');
    if (existingPagination) existingPagination.remove();

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; padding: 20px; flex-wrap: wrap;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.className = 'btn-secondary';
    prevBtn.disabled = currentUserPage === 1;
    prevBtn.onclick = () => changeUserPage(currentUserPage - 1);
    paginationDiv.appendChild(prevBtn);

    const startPage = Math.max(1, currentUserPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = currentUserPage === i ? 'btn-primary' : 'btn-secondary';
        pageBtn.style.minWidth = '40px';
        pageBtn.onclick = () => changeUserPage(i);
        paginationDiv.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn-secondary';
    nextBtn.disabled = currentUserPage === totalPages;
    nextBtn.onclick = () => changeUserPage(currentUserPage + 1);
    paginationDiv.appendChild(nextBtn);

    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'margin-left: 20px; color: var(--text-secondary);';
    pageInfo.textContent = `Page ${currentUserPage} of ${totalPages} (${filteredUsers.length} users)`;
    paginationDiv.appendChild(pageInfo);

    tableContainer.appendChild(paginationDiv);
}

function changeUserPage(page) {
    currentUserPage = page;
    displayUsers();
    document.getElementById('usersTable').scrollIntoView({ behavior: 'smooth' });
}

function initializeFilters() {
    const userSearch = document.getElementById('userSearch');
    const ageFilter = document.getElementById('ageFilter');
    const activityFilter = document.getElementById('activityFilter');

    if (userSearch) userSearch.addEventListener('input', applyUserFilters);
    if (ageFilter) ageFilter.addEventListener('change', applyUserFilters);
    if (activityFilter) activityFilter.addEventListener('change', applyUserFilters);
}

function applyUserFilters() {
    const userSearch = document.getElementById('userSearch');
    const ageFilter = document.getElementById('ageFilter');
    const activityFilter = document.getElementById('activityFilter');

    const searchTerm = userSearch ? userSearch.value.toLowerCase() : '';
    const ageFilterValue = ageFilter ? ageFilter.value : 'all';
    const activityFilterValue = activityFilter ? activityFilter.value : 'all';

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm);

        let matchesAge = true;
        if (ageFilterValue !== 'all') {
            if (!user.age) {
                matchesAge = false;
            } else {
                const age = parseInt(user.age);
                switch(ageFilterValue) {
                    case 'under18': matchesAge = age < 18; break;
                    case '18-19': matchesAge = age >= 18 && age <= 19; break;
                    case '20-21': matchesAge = age >= 20 && age <= 21; break;
                    case '22-25': matchesAge = age >= 22 && age <= 25; break;
                    case 'over25': matchesAge = age > 25; break;
                }
            }
        }

        let matchesActivity = true;
        if (activityFilterValue !== 'all') {
            const totalActivity = user.gamesPlayed + user.quizzesTaken;
            switch(activityFilterValue) {
                case 'active': matchesActivity = totalActivity >= 10; break;
                case 'moderate': matchesActivity = totalActivity >= 3 && totalActivity < 10; break;
                case 'new': matchesActivity = totalActivity >= 1 && totalActivity < 3; break;
                case 'inactive': matchesActivity = totalActivity === 0; break;
            }
        }

        return matchesSearch && matchesAge && matchesActivity;
    });

    currentUserPage = 1;
    displayUsers();
}

function showUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userModal');
    const modalBody = document.getElementById('userModalBody');
    const modalTitle = document.getElementById('modalUserName');
    
    modalTitle.textContent = user.name;

    const totalActivity = user.gamesPlayed + user.quizzesTaken;
    let activityLevel = 'Inactive';
    let activityColor = '#ef4444';
    
    if (totalActivity >= 10) { activityLevel = 'Active'; activityColor = '#10b981'; }
    else if (totalActivity >= 3) { activityLevel = 'Moderate'; activityColor = '#f59e0b'; }
    else if (totalActivity >= 1) { activityLevel = 'New'; activityColor = '#3b82f6'; }

    modalBody.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">User ID:</span>
            <span class="detail-value" style="font-size: 0.75rem; word-break: break-all; font-family: monospace;">${user.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Display Name:</span>
            <span class="detail-value">${user.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Age:</span>
            <span class="detail-value">${user.age || 'Not provided'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Activity Level:</span>
            <span class="detail-value" style="color: ${activityColor}; font-weight: 700;">${activityLevel}</span>
        </div>
        
        <h3 style="margin-top: 25px; margin-bottom: 15px; color: var(--text-secondary);">📊 Activity Statistics</h3>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="background: var(--darker-bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border-color);">
                <div style="font-size: 2rem; margin-bottom: 5px;">🎮</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary-color);">${user.gamesPlayed}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">Games Played</div>
            </div>
            <div style="background: var(--darker-bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border-color);">
                <div style="font-size: 2rem; margin-bottom: 5px;">📝</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary-color);">${user.quizzesTaken}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">Quizzes Taken</div>
            </div>
            <div style="background: var(--darker-bg); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid var(--border-color);">
                <div style="font-size: 2rem; margin-bottom: 5px;">💬</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary-color);">${user.feedbacksGiven}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">Feedback Given</div>
            </div>
        </div>

        <div class="detail-row" style="background: var(--darker-bg); padding: 15px; border-radius: 10px; margin-top: 15px;">
            <span class="detail-label">Total Interactions:</span>
            <span class="detail-value" style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">${user.gamesPlayed + user.quizzesTaken + user.feedbacksGiven}</span>
        </div>
    `;

    modal.classList.add('active');
}

const closeUserModal = document.getElementById('closeUserModal');
if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
        document.getElementById('userModal').classList.remove('active');
    });
}

const userModal = document.getElementById('userModal');
if (userModal) {
    userModal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('active');
    });
}

const exportUsersBtn = document.getElementById('exportUsersBtn');
if (exportUsersBtn) {
    exportUsersBtn.addEventListener('click', function() {
        const csv = convertUsersToCSV(filteredUsers);
        downloadCSV(csv, 'jishin-alert-users.csv');
    });
}

function convertUsersToCSV(users) {
    const headers = ['Name', 'Age', 'Games Played', 'Quizzes Taken', 'Feedback Given', 'Total Activity', 'Status'];
    const rows = users.map(u => {
        const totalActivity = u.gamesPlayed + u.quizzesTaken;
        let status = 'Inactive';
        if (totalActivity >= 10) status = 'Active';
        else if (totalActivity >= 3) status = 'Moderate';
        else if (totalActivity >= 1) status = 'New';
        
        return [u.name, u.age || 'N/A', u.gamesPlayed, u.quizzesTaken, u.feedbacksGiven, u.gamesPlayed + u.quizzesTaken + u.feedbacksGiven, status];
    });
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => { csv += row.map(field => `"${field}"`).join(',') + '\n'; });
    return csv;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', initializeFilters);
window.showUserDetails = showUserDetails;

console.log("✅ Users.js ready");
