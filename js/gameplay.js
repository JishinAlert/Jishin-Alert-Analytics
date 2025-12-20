console.log("🎮 Gameplay.js loaded");

let allGameplay = [];
let filteredGameplay = [];
let currentGameplayPage = 1;
const gameplayItemsPerPage = 20;
let gameplayGradeChartInstance = null;

async function loadGameplayHistory() {
    console.log("📥 Loading gameplay history...");

    const tableBody = document.getElementById('gameplayTableBody');
    tableBody.innerHTML = '<tr><td colspan="8" class="loading">Loading gameplay data...</td></tr>';

    try {
        allGameplay = [];
        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userName = userData.displayName || userData.name || 'Unknown User';

            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory')
                .orderBy('timestamp', 'desc')
                .get();

            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                allGameplay.push({
                    id: doc.id,
                    userId: userDoc.id,
                    userName: userName,
                    difficulty: data.gameMode || 'Normal',
                    victory: data.victory || false,
                    score: data.finalScore || 0,
                    grade: data.overallGrade || 'N/A',
                    timeTaken: data.timeTaken || 0,
                    objectivesCompleted: data.objectivesCompleted || 0,
                    totalObjectives: data.totalObjectives || 0,
                    timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
                });
            });
        }

        allGameplay.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ Loaded ${allGameplay.length} gameplay records`);
        filteredGameplay = [...allGameplay];
        currentGameplayPage = 1;

        updateGameplayGradeChart('all');
        
        displayGameplayHistory(filteredGameplay);

    } catch (error) {
        console.error("❌ Error loading gameplay:", error);
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">Error loading gameplay data</td></tr>';
    }
}

function updateGameplayGradeChart(difficulty) {
    console.log("📊 Creating gameplay grade chart for:", difficulty);

    let filteredGames;
    if (difficulty === 'all') {
        filteredGames = [...allGameplay];
    } else {
        filteredGames = allGameplay.filter(g => g.difficulty === difficulty);
    }

    console.log(`📊 Filtered games count: ${filteredGames.length}`);

    if (filteredGames.length === 0) {
        const chartContainer = document.getElementById('gameplayGradeChartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="loading" style="text-align: center; padding: 40px;">No data available for this difficulty level</p>';
        }
        return;
    }

    // Count grades
    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    filteredGames.forEach(game => {
        const grade = game.grade.toUpperCase();
        if (gradeCounts.hasOwnProperty(grade)) {
            gradeCounts[grade]++;
        }
    });

    console.log("Grade counts:", gradeCounts);

    // Calculate percentages
    const total = filteredGames.length;
    const gradePercentages = {
        A: Math.round((gradeCounts.A / total) * 100),
        B: Math.round((gradeCounts.B / total) * 100),
        C: Math.round((gradeCounts.C / total) * 100),
        D: Math.round((gradeCounts.D / total) * 100),
        F: Math.round((gradeCounts.F / total) * 100)
    };

    // Get canvas
    const canvas = document.getElementById('gameplayGradeChart');
    if (!canvas) {
        console.error("❌ Canvas 'gameplayGradeChart' not found!");
        return;
    }

    // Destroy existing chart
    if (gameplayGradeChartInstance) {
        gameplayGradeChartInstance.destroy();
        gameplayGradeChartInstance = null;
    }

    // Create chart
    gameplayGradeChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['A Grade', 'B Grade', 'C Grade', 'D Grade', 'F Grade'],
            datasets: [{
                label: 'Number of Games',
                data: [gradeCounts.A, gradeCounts.B, gradeCounts.C, gradeCounts.D, gradeCounts.F],
                backgroundColor: [
                    '#10b981', // A - Green
                    '#3b82f6', // B - Blue
                    '#f59e0b', // C - Orange
                    '#f97316', // D - Dark Orange
                    '#ef4444'  // F - Red
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            const percentage = gradePercentages[['A', 'B', 'C', 'D', 'F'][context.dataIndex]];
                            return `${value} games (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#94a3b8',
                        stepSize: 1
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });

    // Update percentage labels
    const chartContainer = document.getElementById('gameplayGradeChartContainer');
    const existingLabels = chartContainer.querySelector('.grade-percentages');
    if (existingLabels) existingLabels.remove();

    const labelsDiv = document.createElement('div');
    labelsDiv.className = 'grade-percentages';
    labelsDiv.style.cssText = 'display: flex; justify-content: space-around; margin-top: 20px; padding: 15px; background: #020617; border-radius: 8px;';
    
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
    
    grades.forEach((grade, index) => {
        const gradeDiv = document.createElement('div');
        gradeDiv.style.cssText = 'text-align: center;';
        gradeDiv.innerHTML = `
            <div style="font-size: 1.5rem; font-weight: 700; color: ${colors[index]};">${gradePercentages[grade]}%</div>
            <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 5px;">Grade ${grade}</div>
            <div style="color: #64748b; font-size: 0.95rem; margin-top: 8px;">${gradeCounts[grade]} games</div>
        `;
        labelsDiv.appendChild(gradeDiv);
    });

    chartContainer.appendChild(labelsDiv);

    console.log("✅ Gameplay grade chart created!");
}

function displayGameplayHistory(data) {
    const tableBody = document.getElementById('gameplayTableBody');

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">No gameplay data found</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    const startIndex = (currentGameplayPage - 1) * gameplayItemsPerPage;
    const endIndex = startIndex + gameplayItemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    paginatedData.forEach(game => {
        const row = document.createElement('tr');
        
        const gradeColors = {
            'A': 'badge-success',
            'B': 'badge-info',
            'C': 'badge-warning',
            'D': 'badge-warning',
            'F': 'badge-danger'
        };
        
        const gradeClass = gradeColors[game.grade.toUpperCase()] || 'badge-info';
        
        row.innerHTML = `
            <td>${formatDate(game.timestamp)}</td>
            <td>${game.userName}</td>
            <td><span class="badge badge-info">${game.difficulty}</span></td>
            <td><span class="badge ${game.victory ? 'badge-success' : 'badge-danger'}">
                ${game.victory ? '✅ Victory' : '❌ Failed'}
            </span></td>
            <td>${game.score}</td>
            <td><span class="badge ${gradeClass}">${game.grade}</span></td>
            <td>${formatTime(game.timeTaken)}</td>
            <td>${game.objectivesCompleted}/${game.totalObjectives}</td>
        `;
        tableBody.appendChild(row);
    });

    addGameplayPagination(data.length);
}

function addGameplayPagination(totalItems) {
    const tableContainer = document.querySelector('#gameplayPage .table-container');
    const totalPages = Math.ceil(totalItems / gameplayItemsPerPage);

    const existingPagination = tableContainer.querySelector('.pagination-controls');
    if (existingPagination) existingPagination.remove();

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; padding: 20px;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.className = 'btn-secondary';
    prevBtn.disabled = currentGameplayPage === 1;
    prevBtn.onclick = () => changeGameplayPage(currentGameplayPage - 1);
    paginationDiv.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = currentGameplayPage === i ? 'btn-primary' : 'btn-secondary';
        pageBtn.style.minWidth = '40px';
        pageBtn.onclick = () => changeGameplayPage(i);
        paginationDiv.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn-secondary';
    nextBtn.disabled = currentGameplayPage === totalPages;
    nextBtn.onclick = () => changeGameplayPage(currentGameplayPage + 1);
    paginationDiv.appendChild(nextBtn);

    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'margin-left: 20px; color: #94a3b8;';
    pageInfo.textContent = `Page ${currentGameplayPage} of ${totalPages} (${totalItems} records)`;
    paginationDiv.appendChild(pageInfo);

    tableContainer.appendChild(paginationDiv);
}

function changeGameplayPage(page) {
    currentGameplayPage = page;
    displayGameplayHistory(filteredGameplay);
    document.getElementById('gameplayTable').scrollIntoView({ behavior: 'smooth' });
}

// ⭐ UPDATED: Synchronized filters
const difficultyFilter = document.getElementById('difficultyFilter');
const resultFilter = document.getElementById('resultFilter');

if (difficultyFilter) {
    difficultyFilter.addEventListener('change', applyFilters);
}

if (resultFilter) {
    resultFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    let filtered = [...allGameplay];

    const difficulty = difficultyFilter.value;
    
    // ⭐ SYNC: Update chart when difficulty filter changes
    updateGameplayGradeChart(difficulty);
    
    if (difficulty !== 'all') {
        filtered = filtered.filter(g => g.difficulty === difficulty);
    }

    const result = resultFilter.value;
    if (result === 'victory') {
        filtered = filtered.filter(g => g.victory === true);
    } else if (result === 'failed') {
        filtered = filtered.filter(g => g.victory === false);
    }

    filteredGameplay = filtered;
    currentGameplayPage = 1;
    displayGameplayHistory(filteredGameplay);
}

const exportGameplayBtn = document.getElementById('exportGameplayBtn');
if (exportGameplayBtn) {
    exportGameplayBtn.addEventListener('click', function() {
        console.log("📥 Exporting gameplay data...");
        const csv = convertGameplayToCSV(filteredGameplay);
        downloadCSV(csv, 'jishin-alert-gameplay.csv');
    });
}

function convertGameplayToCSV(data) {
    const headers = ['Date', 'User', 'Difficulty', 'Result', 'Score', 'Grade', 'Time', 'Objectives'];
    const rows = data.map(g => [
        formatDate(g.timestamp),
        g.userName,
        g.difficulty,
        g.victory ? 'Victory' : 'Failed',
        g.score,
        g.grade,
        formatTime(g.timeTaken),
        `${g.objectivesCompleted}/${g.totalObjectives}`
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

function formatDate(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

console.log("✅ Gameplay.js ready");
