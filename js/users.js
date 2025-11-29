// USERS MANAGEMENT - AGE FILTER FULLY FIXED

console.log("👥 Users.js loaded");

let allUsers = [];
let filteredUsers = [];
let currentUserPage = 1;  // ⭐ RENAMED to avoid collision
const userItemsPerPage = 20;  // ⭐ RENAMED

async function loadUsers() {
    console.log("📥 Loading users...");

    const usersGrid = document.getElementById('usersGrid');
    usersGrid.innerHTML = '<p class="loading">Loading users...</p>';

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
                email: userData.email || 'No email',
                age: userData.age || null,
                gamesPlayed: gameplayCount,
                quizzesTaken: quizCount,
                feedbacksGiven: feedbackCount,
                createdAt: userData.createdAt || null
            });
        }

        console.log(`✅ Loaded ${allUsers.length} users`);
        console.log("📊 Users with ages:", allUsers.filter(u => u.age).map(u => ({ name: u.name, age: u.age })));
        
        filteredUsers = [...allUsers];
        currentUserPage = 1;
        
        // ⭐ CRITICAL: Create age filter BEFORE displaying users
        createAgeFilterUI();
        displayUsers();

    } catch (error) {
        console.error("❌ Error loading users:", error);
        usersGrid.innerHTML = '<p class="loading">Error loading users</p>';
    }
}

// ⭐ BRAND NEW: Create age filter UI from scratch
function createAgeFilterUI() {
    console.log("🔧 Creating age filter UI...");
    
    // Find or create page-controls container
    let pageControls = document.querySelector('#usersPage .page-controls');
    
    if (!pageControls) {
        console.log("⚠️ page-controls not found, creating it...");
        const usersPage = document.getElementById('usersPage');
        if (!usersPage) {
            console.error("❌ #usersPage not found!");
            return;
        }
        
        pageControls = document.createElement('div');
        pageControls.className = 'page-controls';
        pageControls.style.cssText = 'display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;';
        
        // Insert as first child of usersPage
        usersPage.insertBefore(pageControls, usersPage.firstChild);
        console.log("✅ Created page-controls container");
    }

    // Remove existing age filter
    const existingFilter = document.getElementById('ageFilter');
    if (existingFilter) {
        existingFilter.remove();
        console.log("🗑️ Removed old age filter");
    }

    // Create wrapper div for label + select
    const filterWrapper = document.createElement('div');
    filterWrapper.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    // Create label
    const label = document.createElement('label');
    label.textContent = 'Age:';
    label.style.cssText = 'color: #94a3b8; font-weight: 500; font-size: 0.9rem;';

    // Create select dropdown
    const ageFilter = document.createElement('select');
    ageFilter.id = 'ageFilter';
    ageFilter.className = 'filter-select';
    ageFilter.innerHTML = `
        <option value="all">All Ages</option>
        <option value="under18">Under 18</option>
        <option value="18-19">18-19</option>
        <option value="20-21">20-21</option>
        <option value="22-25">22-25</option>
        <option value="over25">Over 25</option>
    `;

    // Add change event listener
    ageFilter.addEventListener('change', function() {
        console.log("🔄 Age filter changed to:", this.value);
        applyUserFilters();
    });

    // Assemble and add to page
    filterWrapper.appendChild(label);
    filterWrapper.appendChild(ageFilter);
    
    // Insert at beginning of page-controls (before search)
    pageControls.insertBefore(filterWrapper, pageControls.firstChild);
    
    console.log("✅ Age filter UI created successfully!");
}

function displayUsers() {
    const usersGrid = document.getElementById('usersGrid');

    if (filteredUsers.length === 0) {
        usersGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>No users found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    const startIndex = (currentUserPage - 1) * userItemsPerPage;
    const endIndex = startIndex + userItemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    usersGrid.innerHTML = '';

    paginatedUsers.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    ${user.age ? `<p style="font-size: 0.85rem; color: #64748b;">🎂 Age: ${user.age}</p>` : ''}
                </div>
            </div>
            <div class="user-stats">
                <div class="user-stat">
                    <p>Games</p>
                    <p>${user.gamesPlayed}</p>
                </div>
                <div class="user-stat">
                    <p>Quizzes</p>
                    <p>${user.quizzesTaken}</p>
                </div>
                <div class="user-stat">
                    <p>Feedback</p>
                    <p>${user.feedbacksGiven}</p>
                </div>
            </div>
        `;

        userCard.addEventListener('click', () => showUserDetails(user));
        usersGrid.appendChild(userCard);
    });

    addUserPagination();
}

function addUserPagination() {
    const usersGrid = document.getElementById('usersGrid');
    const totalPages = Math.ceil(filteredUsers.length / userItemsPerPage);

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 30px; padding: 20px; grid-column: 1 / -1;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.className = 'btn-secondary';
    prevBtn.disabled = currentUserPage === 1;
    prevBtn.onclick = () => changeUserPage(currentUserPage - 1);
    paginationDiv.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
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
    pageInfo.style.cssText = 'margin-left: 20px; color: #94a3b8;';
    pageInfo.textContent = `Page ${currentUserPage} of ${totalPages} (${filteredUsers.length} users)`;
    paginationDiv.appendChild(pageInfo);

    usersGrid.appendChild(paginationDiv);
}

function changeUserPage(page) {
    currentUserPage = page;
    displayUsers();
    document.getElementById('usersGrid').scrollIntoView({ behavior: 'smooth' });
}

// Search functionality
const userSearch = document.getElementById('userSearch');
if (userSearch) {
    userSearch.addEventListener('input', applyUserFilters);
}

// ⭐ FIXED: Apply filters function
function applyUserFilters() {
    const searchTerm = userSearch ? userSearch.value.toLowerCase() : '';
    const ageFilterElement = document.getElementById('ageFilter');
    const ageFilterValue = ageFilterElement ? ageFilterElement.value : 'all';

    console.log("🔍 APPLYING FILTERS - Search:", searchTerm, "| Age:", ageFilterValue);

    filteredUsers = allUsers.filter(user => {
        // Search filter
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                             user.email.toLowerCase().includes(searchTerm);

        // Age filter
        let matchesAge = true;
        if (ageFilterValue !== 'all') {
            if (!user.age || user.age === null) {
                matchesAge = false;
            } else {
                const age = parseInt(user.age);
                
                switch(ageFilterValue) {
                    case 'under18': 
                        matchesAge = age < 18;
                        break;
                    case '18-19': 
                        matchesAge = age >= 18 && age <= 19;
                        break;
                    case '20-21': 
                        matchesAge = age >= 20 && age <= 21;
                        break;
                    case '20-21': 
                        matchesAge = age >= 20 && age <= 21;
                        break;
                    case '22-25': 
                        matchesAge = age >= 22 && age <= 25;
                        break;
                    case 'over25': 
                        matchesAge = age > 25;
                        break;
                }
                
                console.log(`  👤 ${user.name} (age ${age}): ${matchesAge ? '✅ MATCH' : '❌ NO MATCH'}`);
            }
        }

        return matchesSearch && matchesAge;
    });

    console.log(`✅ Filter result: ${filteredUsers.length} users`);
    currentUserPage = 1;
    displayUsers();
}

function showUserDetails(user) {
    alert(`User Details:\nName: ${user.name}\nEmail: ${user.email}\nAge: ${user.age || 'N/A'}\nGames: ${user.gamesPlayed}\nQuizzes: ${user.quizzesTaken}\nFeedback: ${user.feedbacksGiven}`);
}

const exportUsersBtn = document.getElementById('exportUsersBtn');
if (exportUsersBtn) {
    exportUsersBtn.addEventListener('click', function() {
        const csv = convertUsersToCSV(filteredUsers);
        downloadCSV(csv, 'jishin-alert-users.csv');
    });
}

function convertUsersToCSV(users) {
    const headers = ['Name', 'Email', 'Age', 'Games Played', 'Quizzes Taken', 'Feedback Given'];
    const rows = users.map(u => [u.name, u.email, u.age || 'N/A', u.gamesPlayed, u.quizzesTaken, u.feedbacksGiven]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });
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

console.log("✅ Users.js ready");