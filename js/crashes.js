// 🐛 CRASH REPORTS VIEWER

console.log("🐛 Crashes.js loaded");

let allCrashes = [];
let filteredCrashes = [];
let currentCrashPage = 1;
const crashItemsPerPage = 20;

async function loadCrashReports() {
    console.log("📥 Loading crash reports...");

    const tableBody = document.getElementById('crashTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading crash reports...</td></tr>';

    try {
        const snapshot = await window.db.collection('crashReports')
            .orderBy('timestampUTC', 'desc')
            .limit(200)
            .get();

        allCrashes = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            allCrashes.push({
                id: doc.id,
                userId: data.userId || 'Unknown',
                displayName: data.displayName || 'Guest',
                errorMessage: data.errorMessage || 'No message',
                stackTrace: data.stackTrace || '',
                logType: data.logType || 'Error',
                sceneName: data.sceneName || 'Unknown',
                deviceModel: data.deviceModel || 'Unknown',
                deviceType: data.deviceType || 'Unknown',
                operatingSystem: data.operatingSystem || 'Unknown',
                timestamp: data.timestamp || 'N/A',
                timestampUTC: data.timestampUTC || 'N/A',
                isTestCrash: data.isTestCrash || false
            });
        });

        console.log(`✅ Loaded ${allCrashes.length} crash reports`);
        filteredCrashes = [...allCrashes];
        currentCrashPage = 1;
        displayCrashReports(filteredCrashes);

    } catch (error) {
        console.error("❌ Error loading crash reports:", error);
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">Error loading crash reports</td></tr>';
    }
}

function displayCrashReports(crashes) {
    const tableBody = document.getElementById('crashTableBody');

    if (crashes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">No crash reports found 🎉</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    // ⭐ PAGINATION: Calculate slice
    const startIndex = (currentCrashPage - 1) * crashItemsPerPage;
    const endIndex = startIndex + crashItemsPerPage;
    const paginatedCrashes = crashes.slice(startIndex, endIndex);

    paginatedCrashes.forEach(crash => {
        const row = document.createElement('tr');
        
        // Highlight test crashes
        if (crash.isTestCrash) {
            row.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        }

        row.innerHTML = `
            <td>${crash.timestamp}</td>
            <td>${crash.displayName}</td>
            <td><span class="badge ${crash.logType === 'Exception' ? 'badge-danger' : 'badge-warning'}">${crash.logType}</span></td>
            <td>${crash.sceneName}</td>
            <td>${crash.deviceModel}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${crash.errorMessage}</td>
            <td><button class="btn-view" onclick="showCrashDetails('${crash.id}')">View</button></td>
        `;
        tableBody.appendChild(row);
    });

    // ⭐ ADD PAGINATION CONTROLS
    addCrashPagination(crashes.length);
}

function addCrashPagination(totalItems) {
    const tableContainer = document.querySelector('#crashesPage .table-container');
    const totalPages = Math.ceil(totalItems / crashItemsPerPage);

    // Remove existing pagination
    const existingPagination = tableContainer.querySelector('.pagination-controls');
    if (existingPagination) existingPagination.remove();

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-top: 20px;
        padding: 20px;
    `;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.className = 'btn-secondary';
    prevBtn.disabled = currentCrashPage === 1;
    prevBtn.onclick = () => changeCrashPage(currentCrashPage - 1);
    paginationDiv.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = currentCrashPage === i ? 'btn-primary' : 'btn-secondary';
        pageBtn.style.minWidth = '40px';
        pageBtn.onclick = () => changeCrashPage(i);
        paginationDiv.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn-secondary';
    nextBtn.disabled = currentCrashPage === totalPages;
    nextBtn.onclick = () => changeCrashPage(currentCrashPage + 1);
    paginationDiv.appendChild(nextBtn);

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'margin-left: 20px; color: #94a3b8;';
    pageInfo.textContent = `Page ${currentCrashPage} of ${totalPages} (${totalItems} reports)`;
    paginationDiv.appendChild(pageInfo);

    tableContainer.appendChild(paginationDiv);
}

function changeCrashPage(page) {
    currentCrashPage = page;
    displayCrashReports(filteredCrashes);
    document.getElementById('crashTable').scrollIntoView({ behavior: 'smooth' });
}

// Filter by crash type
const crashFilter = document.getElementById('crashFilter');
if (crashFilter) {
    crashFilter.addEventListener('change', function() {
        const filterType = this.value;
        
        if (filterType === 'all') {
            filteredCrashes = [...allCrashes];
        } else {
            filteredCrashes = allCrashes.filter(c => c.logType === filterType);
        }
        
        currentCrashPage = 1; // Reset to first page when filtering
        displayCrashReports(filteredCrashes);
    });
}

// Export crashes
const exportCrashesBtn = document.getElementById('exportCrashesBtn');
if (exportCrashesBtn) {
    exportCrashesBtn.addEventListener('click', function() {
        console.log("📥 Exporting crash reports...");
        
        const csv = convertCrashesToCSV(filteredCrashes);
        downloadCSV(csv, 'jishin-alert-crashes.csv');
    });
}

function convertCrashesToCSV(crashes) {
    const headers = ['Date', 'User', 'Type', 'Scene', 'Device', 'OS', 'Error Message'];
    const rows = crashes.map(c => [
        c.timestamp,
        c.displayName,
        c.logType,
        c.sceneName,
        c.deviceModel,
        c.operatingSystem,
        c.errorMessage.replace(/,/g, ';') // Replace commas in error messages
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

// Show crash details modal
function showCrashDetails(crashId) {
    const crash = allCrashes.find(c => c.id === crashId);
    if (!crash) return;

    console.log("🐛 Showing crash details:", crash);

    const modal = document.getElementById('crashModal');
    const modalBody = document.getElementById('crashModalBody');

    let detailsHTML = `
        ${crash.isTestCrash ? '<div style="padding: 10px; background: rgba(245, 158, 11, 0.2); border-radius: 8px; margin-bottom: 15px; color: #f59e0b; font-weight: 600;">🧪 TEST CRASH</div>' : ''}
        
        <div class="detail-row">
            <span class="detail-label">User:</span>
            <span class="detail-value">${crash.displayName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">User ID:</span>
            <span class="detail-value" style="font-size: 0.8rem;">${crash.userId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Error Type:</span>
            <span class="detail-value">${crash.logType}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Scene:</span>
            <span class="detail-value">${crash.sceneName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Local Time:</span>
            <span class="detail-value">${crash.timestamp}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">UTC Time:</span>
            <span class="detail-value">${crash.timestampUTC}</span>
        </div>
        
        <h3 style="margin-top: 20px; color: #94a3b8;">Device Information</h3>
        <div class="detail-row">
            <span class="detail-label">Device:</span>
            <span class="detail-value">${crash.deviceModel}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Device Type:</span>
            <span class="detail-value">${crash.deviceType}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Operating System:</span>
            <span class="detail-value">${crash.operatingSystem}</span>
        </div>
        
        <h3 style="margin-top: 20px; color: #94a3b8;">Error Message</h3>
        <div class="code-block">${crash.errorMessage}</div>
        
        <h3 style="margin-top: 20px; color: #94a3b8;">Stack Trace</h3>
        <div class="code-block" style="max-height: 300px; overflow-y: auto;">${crash.stackTrace || 'No stack trace available'}</div>
    `;

    modalBody.innerHTML = detailsHTML;
    modal.classList.add('active');
}

// Close crash modal
const closeCrashModal = document.getElementById('closeCrashModal');
if (closeCrashModal) {
    closeCrashModal.addEventListener('click', function() {
        document.getElementById('crashModal').classList.remove('active');
    });
}

// Close modal on outside click
const crashModal = document.getElementById('crashModal');
if (crashModal) {
    crashModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

// Make showCrashDetails globally accessible
window.showCrashDetails = showCrashDetails;

console.log("✅ Crashes.js ready");