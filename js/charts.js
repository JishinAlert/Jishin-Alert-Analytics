console.log("📊 Charts.js loaded");

// ✅ Register ChartDataLabels plugin for Chart.js v4
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    console.log("✅ ChartDataLabels plugin registered in charts.js!");
}

let chartInstances = {};

async function loadOverviewCharts() {
    console.log("📈 Loading charts...");

    try {
        await Promise.all([
            createDifficultyChart(),
            createVictoryChart(),
            createScoreChart(),
            createActivityChart()
        ]);

        console.log("✅ All charts loaded");
    } catch (error) {
        console.error("❌ Error loading charts:", error);
    }
}

async function createDifficultyChart() {
    const ctx = document.getElementById('difficultyChart');
    if (!ctx) return;

    try {
        // Count games by difficulty
        const difficultyCounts = { Easy: 0, Normal: 0, Hard: 0 };
        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory').get();
            
            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                const difficulty = data.gameMode || 'Normal';
                if (difficultyCounts.hasOwnProperty(difficulty)) {
                    difficultyCounts[difficulty]++;
                }
            });
        }

        // Destroy existing chart
        if (chartInstances.difficulty) {
            chartInstances.difficulty.destroy();
        }

        // Create chart
        chartInstances.difficulty = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Easy', 'Normal', 'Hard'],
                datasets: [{
                    data: [difficultyCounts.Easy, difficultyCounts.Normal, difficultyCounts.Hard],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    },
                    datalabels: {
                        color: '#ffffff',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        padding: {
                            top: 4,
                            bottom: 4,
                            left: 8,
                            right: 8
                        },
                        font: {
                            weight: 'bold',
                            size: 14,
                            family: 'Arial'
                        },
                        formatter: function(value, context) {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return percentage > 0 ? percentage + '%' : '';
                        },
                        display: function(context) {
                            return context.dataset.data[context.dataIndex] > 0;
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error creating difficulty chart:", error);
    }
}

async function createVictoryChart() {
    const ctx = document.getElementById('victoryChart');
    if (!ctx) return;

    try {
        let victories = 0;
        let failures = 0;
        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory').get();
            
            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.victory === true) {
                    victories++;
                } else {
                    failures++;
                }
            });
        }

        // Destroy existing chart
        if (chartInstances.victory) {
            chartInstances.victory.destroy();
        }

        // Create chart
        chartInstances.victory = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Victory', 'Failed'],
                datasets: [{
                    data: [victories, failures],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    },
                    datalabels: {
                        color: '#ffffff',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        padding: {
                            top: 4,
                            bottom: 4,
                            left: 8,
                            right: 8
                        },
                        font: {
                            weight: 'bold',
                            size: 14,
                            family: 'Arial'
                        },
                        formatter: function(value, context) {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return percentage > 0 ? percentage + '%' : '';
                        },
                        display: function(context) {
                            return context.dataset.data[context.dataIndex] > 0;
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error creating victory chart:", error);
    }
}

async function createScoreChart() {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;

    try {
        const scores = { Easy: [], Normal: [], Hard: [] };
        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory').get();
            
            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                const difficulty = data.gameMode || 'Normal';
                const score = data.finalScore || 0;
                
                if (scores.hasOwnProperty(difficulty)) {
                    scores[difficulty].push(score);
                }
            });
        }

        // Calculate averages
        const avgScores = {
            Easy: scores.Easy.length > 0 ? Math.round(scores.Easy.reduce((a, b) => a + b, 0) / scores.Easy.length) : 0,
            Normal: scores.Normal.length > 0 ? Math.round(scores.Normal.reduce((a, b) => a + b, 0) / scores.Normal.length) : 0,
            Hard: scores.Hard.length > 0 ? Math.round(scores.Hard.reduce((a, b) => a + b, 0) / scores.Hard.length) : 0
        };

        // Destroy existing chart
        if (chartInstances.score) {
            chartInstances.score.destroy();
        }

        // Create chart
        chartInstances.score = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Easy', 'Normal', 'Hard'],
                datasets: [{
                    label: 'Average Score',
                    data: [avgScores.Easy, avgScores.Normal, avgScores.Hard],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'center',
                        color: '#ffffff',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        borderRadius: 4,
                        padding: {
                            top: 4,
                            bottom: 4,
                            left: 8,
                            right: 8
                        },
                        font: {
                            weight: 'bold',
                            size: 14,
                            family: 'Arial'
                        },
                        formatter: function(value) {
                            return value > 0 ? value : '';
                        },
                        display: function(context) {
                            return context.dataset.data[context.dataIndex] > 0;
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#334155' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error creating score chart:", error);
    }
}

async function createActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    try {
        // Get last 7 days
        const last7Days = [];
        const activityCounts = {};
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            last7Days.push(dateStr);
            activityCounts[dateStr] = 0;
        }

        // Count activities per day
        const usersSnapshot = await window.db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
            const gameplaySnapshot = await userDoc.ref.collection('gameplayHistory').get();
            
            gameplaySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.timestamp) {
                    const dateStr = data.timestamp.toDate().toLocaleDateString();
                    if (activityCounts.hasOwnProperty(dateStr)) {
                        activityCounts[dateStr]++;
                    }
                }
            });
        }

        const counts = last7Days.map(date => activityCounts[date]);

        // Destroy existing chart
        if (chartInstances.activity) {
            chartInstances.activity.destroy();
        }

        // Create chart
        chartInstances.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Games Played',
                    data: counts,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { display: false }
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

    } catch (error) {
        console.error("Error creating activity chart:", error);
    }
}

console.log("✅ Charts.js ready");
