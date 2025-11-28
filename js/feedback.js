// 💬 FEEDBACK VIEWER - FIXED TO MATCH C# FIELD NAME

console.log("💬 Feedback.js loaded");

let allFeedback = [];
let filteredFeedback = [];
let currentFeedbackPage = 1;
const feedbackItemsPerPage = 20;
let currentSortOrder = 'desc';

async function loadFeedback() {
    console.log("📥 Loading feedback...");

    const tableBody = document.getElementById('feedbackTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" class="loading">Loading feedback...</td></tr>';

    try {
        const snapshot = await window.db.collection('feedbacks').get();
        console.log(`📦 Found ${snapshot.size} feedback documents`);

        allFeedback = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("📄 Feedback document:", doc.id, data);
            
            //  C# saves timestamp as string
            let timestamp = new Date();
            if (data.timestamp) {
                if (typeof data.timestamp === 'string') {
                    timestamp = new Date(data.timestamp);
                } else if (data.timestamp.toDate) {
                    timestamp = data.timestamp.toDate();
                }
            } else if (data.philippinesTime) {
                // Fallback to philippinesTime if timestamp doesn't exist
                timestamp = new Date(data.philippinesTime);
            }
            
            // C# saves "feedback"
            const feedbackText = data.comments || data.feedback || data.test || 'No feedback text';
            
            allFeedback.push({
                id: doc.id,
                userId: data.userId || 'Unknown',
                userName: data.userName || data.displayName || 'Anonymous',
                feedback: feedbackText,  // Now correctly reads "comments" from C#
                timestamp: timestamp,
                email: data.email || 'N/A',
                rating: data.rating || 0
            });
        });

        console.log(`✅ Loaded ${allFeedback.length} feedback entries`);
        
        if (allFeedback.length === 0) {
            console.warn("⚠️ No feedback found");
            tableBody.innerHTML = '<tr><td colspan="4" class="loading">No feedback found in database</td></tr>';
            return;
        }
        
        updateFeedbackStats();
        filteredFeedback = [...allFeedback];
        currentFeedbackPage = 1;
        sortAndDisplayFeedback();

    } catch (error) {
        console.error("❌ Error loading feedback:", error);
        tableBody.innerHTML = `<tr><td colspan="4" class="loading">Error: ${error.message}</td></tr>`;
    }
}

function updateFeedbackStats() {
    document.getElementById('totalFeedback').textContent = allFeedback.length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekCount = allFeedback.filter(f => f.timestamp >= oneWeekAgo).length;
    document.getElementById('feedbackThisWeek').textContent = thisWeekCount;

    const uniqueUsers = new Set(allFeedback.map(f => f.userId)).size;
    document.getElementById('uniqueFeedbackUsers').textContent = uniqueUsers;

    if (allFeedback.length > 0) {
        const sortedByTime = [...allFeedback].sort((a, b) => b.timestamp - a.timestamp);
        const latest = sortedByTime[0].timestamp;
        const timeAgo = getTimeAgo(latest);
        document.getElementById('latestFeedbackTime').textContent = timeAgo;
    }
}

function sortAndDisplayFeedback() {
    filteredFeedback.sort((a, b) => {
        if (currentSortOrder === 'desc') {
            return b.timestamp - a.timestamp;
        } else {
            return a.timestamp - b.timestamp;
        }
    });
    displayFeedback();
}

function displayFeedback() {
    const tableBody = document.getElementById('feedbackTableBody');

    if (filteredFeedback.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">No feedback found</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    const startIndex = (currentFeedbackPage - 1) * feedbackItemsPerPage;
    const endIndex = startIndex + feedbackItemsPerPage;
    const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

    paginatedFeedback.forEach(feedback => {
        const row = document.createElement('tr');
        const shortFeedback = feedback.feedback.length > 100 
            ? feedback.feedback.substring(0, 100) + '...' 
            : feedback.feedback;

        row.innerHTML = `
            <td>${formatDate(feedback.timestamp)}</td>
            <td>${feedback.userName}</td>
            <td style="max-width: 400px;">${shortFeedback}</td>
            <td><button class="btn-view" onclick="showFeedbackDetails('${feedback.id}')">View</button></td>
        `;
        tableBody.appendChild(row);
    });

    addFeedbackPagination(filteredFeedback.length);
}

function addFeedbackPagination(totalItems) {
    const tableContainer = document.querySelector('#feedbackPage .table-container');
    const totalPages = Math.ceil(totalItems / feedbackItemsPerPage);

    const existingPagination = tableContainer.querySelector('.pagination-controls');
    if (existingPagination) existingPagination.remove();

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; padding: 20px;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.className = 'btn-secondary';
    prevBtn.disabled = currentFeedbackPage === 1;
    prevBtn.onclick = () => changeFeedbackPage(currentFeedbackPage - 1);
    paginationDiv.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = currentFeedbackPage === i ? 'btn-primary' : 'btn-secondary';
        pageBtn.style.minWidth = '40px';
        pageBtn.onclick = () => changeFeedbackPage(i);
        paginationDiv.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn-secondary';
    nextBtn.disabled = currentFeedbackPage === totalPages;
    nextBtn.onclick = () => changeFeedbackPage(currentFeedbackPage + 1);
    paginationDiv.appendChild(nextBtn);

    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'margin-left: 20px; color: #94a3b8;';
    pageInfo.textContent = `Page ${currentFeedbackPage} of ${totalPages} (${totalItems} entries)`;
    paginationDiv.appendChild(pageInfo);

    tableContainer.appendChild(paginationDiv);
}

function changeFeedbackPage(page) {
    currentFeedbackPage = page;
    displayFeedback();
    document.getElementById('feedbackTable').scrollIntoView({ behavior: 'smooth' });
}

const timeSortFilter = document.getElementById('timeSortFilter');
if (timeSortFilter) {
    timeSortFilter.addEventListener('change', function() {
        currentSortOrder = this.value;
        currentFeedbackPage = 1;
        sortAndDisplayFeedback();
    });
}

const exportFeedbackBtn = document.getElementById('exportFeedbackBtn');
if (exportFeedbackBtn) {
    exportFeedbackBtn.addEventListener('click', function() {
        const csv = convertFeedbackToCSV(filteredFeedback);
        downloadCSV(csv, 'jishin-alert-feedback.csv');
    });
}

function convertFeedbackToCSV(feedback) {
    const headers = ['Date', 'User', 'Email', 'Rating', 'Feedback'];
    const rows = feedback.map(f => [
        formatDate(f.timestamp),
        f.userName,
        f.email,
        f.rating,
        f.feedback.replace(/,/g, ';').replace(/\n/g, ' ')
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${field}"`).join(',') + '\n';
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

function showFeedbackDetails(feedbackId) {
    const feedback = allFeedback.find(f => f.id === feedbackId);
    if (!feedback) return;

    const modal = document.getElementById('feedbackModal');
    const modalBody = document.getElementById('feedbackModalBody');

    let detailsHTML = `
        <div class="detail-row">
            <span class="detail-label">User:</span>
            <span class="detail-value">${feedback.userName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Rating:</span>
            <span class="detail-value">${'⭐'.repeat(feedback.rating)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formatDate(feedback.timestamp)}</span>
        </div>
        <h3 style="margin-top: 20px; color: #94a3b8;">Feedback Message</h3>
        <div class="code-block" style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${feedback.feedback}</div>
    `;

    modalBody.innerHTML = detailsHTML;
    modal.classList.add('active');
}

const closeFeedbackModal = document.getElementById('closeFeedbackModal');
if (closeFeedbackModal) {
    closeFeedbackModal.addEventListener('click', () => {
        document.getElementById('feedbackModal').classList.remove('active');
    });
}

const feedbackModal = document.getElementById('feedbackModal');
if (feedbackModal) {
    feedbackModal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('active');
    });
}

function formatDate(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    return date.toLocaleDateString();
}

window.showFeedbackDetails = showFeedbackDetails;

console.log("✅ Feedback.js ready");