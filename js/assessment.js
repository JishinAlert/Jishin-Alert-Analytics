// ASSESSMENT ANALYTICS - WITH GRADE DISTRIBUTION CHART AND QUESTION TEXTS

console.log("📝 Assessment.js loaded");

// ✅ CRITICAL: Register ChartDataLabels plugin globally for Chart.js v4
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    console.log("✅ ChartDataLabels plugin registered!");
} else {
    console.warn("⚠️ ChartDataLabels plugin not found - percentages won't show on charts");
}

let allAssessmentQuizzes = [];
let currentAssessmentDifficulty = 'Easy';
let currentAssessmentPage = 1;
const assessmentItemsPerPage = 20;
let gradeChartInstance = null;

async function loadAssessmentData() {
    console.log("📥 Loading assessment data...");

    try {
        allAssessmentQuizzes = [];
        const usersSnapshot = await window.db.collection('users').get();
        console.log(`👥 Found ${usersSnapshot.size} users`);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userName = userData.displayName || userData.name || 'Unknown User';
            
            console.log(`👤 Checking user: ${userName} (${userDoc.id})`);

            const quizSnapshot = await userDoc.ref.collection('quizHistory').get();
            console.log(`  📚 Found ${quizSnapshot.size} quizzes for ${userName}`);

            quizSnapshot.forEach(doc => {
                const data = doc.data();
                
                let timestamp = new Date();
                if (data.timestamp && data.timestamp.toDate) {
                    timestamp = data.timestamp.toDate();
                } else if (typeof data.timestamp === 'string') {
                    timestamp = new Date(data.timestamp);
                }
                
                const score = (data.correctAnswers / data.totalQuestions) * 100;
                let grade = 'F';
                if (score >= 90) grade = 'A';
                else if (score >= 80) grade = 'B';
                else if (score >= 60) grade = 'C';
                else if (score >= 40) grade = 'D';
                
                allAssessmentQuizzes.push({
                    id: doc.id,
                    userId: userDoc.id,
                    userName: userName,
                    difficulty: data.difficulty || 'Easy',
                    correctAnswers: data.correctAnswers || 0,
                    wrongAnswers: data.wrongAnswers || 0,
                    totalQuestions: data.totalQuestions || 5,
                    playerAnswers: data.playerAnswers || [],
                    answerCorrectness: data.answerCorrectness || [],
                    answerTexts: data.answerTexts || [],
                    correctAnswerTexts: data.correctAnswerTexts || [],
                    questionTexts: data.questionTexts || [],
                    timestamp: timestamp,
                    score: Math.round(score),
                    grade: grade
                });
            });
        }

        console.log(`✅ Total quizzes loaded: ${allAssessmentQuizzes.length}`);

        if (allAssessmentQuizzes.length === 0) {
            console.warn("⚠️ No quiz data found");
            document.getElementById('quizTableBody').innerHTML = '<tr><td colspan="7" class="loading">No quiz attempts found in database</td></tr>';
            return;
        }

        allAssessmentQuizzes.sort((a, b) => b.timestamp - a.timestamp);
        updateQuizStats();
        updateQuestionAnalysis(currentAssessmentDifficulty);
        updateGradeChart(currentAssessmentDifficulty);
        currentAssessmentPage = 1;
        displayQuizHistory();
        
        setTimeout(() => initializeDifficultyTabs(), 100);

    } catch (error) {
        console.error("❌ Error loading assessment data:", error);
        document.getElementById('quizTableBody').innerHTML = `<tr><td colspan="7" class="loading">Error: ${error.message}</td></tr>`;
    }
}

function updateQuizStats() {
    const totalAttempts = allAssessmentQuizzes.length;
    const totalCorrect = allAssessmentQuizzes.reduce((sum, q) => sum + q.correctAnswers, 0);
    const totalWrong = allAssessmentQuizzes.reduce((sum, q) => sum + q.wrongAnswers, 0);
    const totalQuestions = allAssessmentQuizzes.reduce((sum, q) => sum + q.totalQuestions, 0);

    const avgCorrect = totalAttempts > 0 ? (totalCorrect / totalAttempts).toFixed(1) : 0;
    const avgWrong = totalAttempts > 0 ? (totalWrong / totalAttempts).toFixed(1) : 0;
    const successRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    document.getElementById('totalQuizAttempts').textContent = totalAttempts;
    document.getElementById('avgCorrect').textContent = `${avgCorrect}/5`;
    document.getElementById('avgWrong').textContent = `${avgWrong}/5`;
    document.getElementById('successRate').textContent = `${successRate}%`;
}

function updateGradeChart(difficulty) {
    console.log("📊 Creating grade chart for:", difficulty);

    const filteredQuizzes = allAssessmentQuizzes.filter(q => q.difficulty === difficulty);

    if (filteredQuizzes.length === 0) {
        const chartContainer = document.getElementById('assessmentGradeChartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="loading">No data for grade chart</p>';
        }
        return;
    }

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    filteredQuizzes.forEach(quiz => {
        gradeCounts[quiz.grade]++;
    });

    const total = filteredQuizzes.length;
    const gradePercentages = {
        A: Math.round((gradeCounts.A / total) * 100),
        B: Math.round((gradeCounts.B / total) * 100),
        C: Math.round((gradeCounts.C / total) * 100),
        D: Math.round((gradeCounts.D / total) * 100),
        F: Math.round((gradeCounts.F / total) * 100)
    };

    console.log("Grade Distribution:", gradeCounts, gradePercentages);

    const canvas = document.getElementById('assessmentGradeChart');
    if (!canvas) {
        console.error("❌ Canvas 'assessmentGradeChart' not found!");
        return;
    }

    if (gradeChartInstance) {
        gradeChartInstance.destroy();
    }

    gradeChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['A (100-90%)', 'B (80%)', 'C (60%)', 'D (40%)', 'F (<40%)'],
            datasets: [{
                data: [gradeCounts.A, gradeCounts.B, gradeCounts.C, gradeCounts.D, gradeCounts.F],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#f97316',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { 
                        color: '#94a3b8',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = gradePercentages[['A', 'B', 'C', 'D', 'F'][context.dataIndex]];
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
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
                        const percentage = gradePercentages[['A', 'B', 'C', 'D', 'F'][context.dataIndex]];
                        return percentage > 0 ? percentage + '%' : '';
                    },
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    },
                    textAlign: 'center',
                    anchor: 'center',
                    align: 'center'
                }
            }
        }
    });

    console.log("✅ Grade chart created!");
}

function updateQuestionAnalysis(difficulty) {
    console.log("📊 Analyzing questions for:", difficulty);

    const container = document.getElementById('questionStatsContainer');
    const filteredQuizzes = allAssessmentQuizzes.filter(q => q.difficulty === difficulty);

    if (filteredQuizzes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #1e293b; border-radius: 12px; margin: 20px 0;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📊</div>
                <h3 style="color: #94a3b8; margin-bottom: 10px;">No Data for ${difficulty} Mode</h3>
                <p style="color: #64748b;">No quiz attempts found for this difficulty level</p>
            </div>
        `;
        return;
    }

    const difficultyColors = {
        'Easy': { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', icon: '🟢' },
        'Normal': { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', icon: '🟡' },
        'Hard': { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', icon: '🔴' }
    };

    const colors = difficultyColors[difficulty] || difficultyColors['Easy'];

    let html = `
        <div style="background: ${colors.bg}; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid ${colors.text};">
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 2.5rem;">${colors.icon}</span>
                <div>
                    <h3 style="color: ${colors.text}; margin: 0; font-size: 1.5rem; font-weight: 700;">${difficulty} Mode Analysis</h3>
                    <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 0.9rem;">Based on ${filteredQuizzes.length} quiz attempt${filteredQuizzes.length !== 1 ? 's' : ''}</p>
                </div>
            </div>
        </div>
    `;

    const newestQuiz = filteredQuizzes[0];
    const currentQuestionTexts = newestQuiz.questionTexts || [];

    const questionStats = [];
    for (let i = 0; i < 5; i++) {
        let correct = 0;
        let total = 0;
        
        let questionText = "Question not available";
        if (currentQuestionTexts[i]) {
            questionText = currentQuestionTexts[i];
        }

        filteredQuizzes.forEach(quiz => {
            if (quiz.answerCorrectness && quiz.answerCorrectness[i] !== undefined) {
                total++;
                if (quiz.answerCorrectness[i] === true) correct++;
            }
        });

        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        questionStats.push({ 
            number: i + 1, 
            correct, 
            wrong: total - correct, 
            total, 
            accuracy,
            questionText: questionText
        });
    }

    questionStats.forEach(stat => {
        const accuracyClass = stat.accuracy >= 70 ? 'high' : (stat.accuracy >= 50 ? 'medium' : 'low');
        
        html += `
            <div class="question-stat">
                <div class="question-header">
                    <span class="question-title">Q${stat.number}: ${stat.questionText}</span>
                    <span class="question-accuracy ${accuracyClass}">${stat.accuracy}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${accuracyClass}" style="width: ${stat.accuracy}%"></div>
                </div>
                <div class="question-details">
                    <span>✅ Correct: ${stat.correct}</span>
                    <span>❌ Wrong: ${stat.wrong}</span>
                    <span>📊 Total: ${stat.total} attempts</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function displayQuizHistory() {
    const tableBody = document.getElementById('quizTableBody');

    if (allAssessmentQuizzes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">No quiz data found</td></tr>';
        return;
    }

    const startIndex = (currentAssessmentPage - 1) * assessmentItemsPerPage;
    const endIndex = startIndex + assessmentItemsPerPage;
    const paginatedQuizzes = allAssessmentQuizzes.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    paginatedQuizzes.forEach(quiz => {
        const row = document.createElement('tr');
        
        const gradeColors = {
            'A': 'badge-success',
            'B': 'badge-info',
            'C': 'badge-warning',
            'D': 'badge-warning',
            'F': 'badge-danger'
        };
        
        row.innerHTML = `
            <td>${formatDate(quiz.timestamp)}</td>
            <td>${quiz.userName}</td>
            <td><span class="badge badge-info">${quiz.difficulty}</span></td>
            <td>${quiz.correctAnswers}</td>
            <td>${quiz.wrongAnswers}</td>
            <td>${quiz.score}%</td>
            <td><span class="badge ${gradeColors[quiz.grade]}">${quiz.grade}</span></td>
            <td><button class="btn-view" onclick="showQuizDetails('${quiz.id}')">View</button></td>
        `;
        tableBody.appendChild(row);
    });

    addQuizPagination();
}

function addQuizPagination() {
    const tableContainer = document.querySelector('#assessmentPage .table-container');
    const totalPages = Math.ceil(allAssessmentQuizzes.length / assessmentItemsPerPage);

    const existingPagination = tableContainer.querySelector('.pagination-controls');
    if (existingPagination) existingPagination.remove();

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; padding: 20px;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.className = 'btn-secondary';
    prevBtn.disabled = currentAssessmentPage === 1;
    prevBtn.onclick = () => changeQuizPage(currentAssessmentPage - 1);
    paginationDiv.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = currentAssessmentPage === i ? 'btn-primary' : 'btn-secondary';
        pageBtn.style.minWidth = '40px';
        pageBtn.onclick = () => changeQuizPage(i);
        paginationDiv.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn-secondary';
    nextBtn.disabled = currentAssessmentPage === totalPages;
    nextBtn.onclick = () => changeQuizPage(currentAssessmentPage + 1);
    paginationDiv.appendChild(nextBtn);

    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'margin-left: 20px; color: #94a3b8;';
    pageInfo.textContent = `Page ${currentAssessmentPage} of ${totalPages}`;
    paginationDiv.appendChild(pageInfo);

    tableContainer.appendChild(paginationDiv);
}

function changeQuizPage(page) {
    currentAssessmentPage = page;
    displayQuizHistory();
    document.getElementById('quizTable').scrollIntoView({ behavior: 'smooth' });
}

function initializeDifficultyTabs() {
    console.log("🔧 Initializing difficulty tabs...");
    const tabBtns = document.querySelectorAll('.difficulty-tabs .tab-btn');
    
    if (tabBtns.length === 0) {
        console.error("❌ Tab buttons not found!");
        return;
    }

    tabBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const difficulty = this.getAttribute('data-difficulty');
            console.log("🖱️ Tab clicked:", difficulty);
            
            document.querySelectorAll('.difficulty-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentAssessmentDifficulty = difficulty;
            updateQuestionAnalysis(difficulty);
            updateGradeChart(difficulty);
        });
    });

    console.log("✅ Tabs initialized");
}

function showQuizDetails(quizId) {
    const quiz = allAssessmentQuizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const modal = document.getElementById('quizModal');
    const modalBody = document.getElementById('quizModalBody');

    let detailsHTML = `
        <div class="detail-row"><span class="detail-label">User:</span><span class="detail-value">${quiz.userName}</span></div>
        <div class="detail-row"><span class="detail-label">Difficulty:</span><span class="detail-value">${quiz.difficulty}</span></div>
        <div class="detail-row"><span class="detail-label">Score:</span><span class="detail-value">${quiz.correctAnswers}/${quiz.totalQuestions} (${quiz.score}%)</span></div>
        <div class="detail-row"><span class="detail-label">Grade:</span><span class="detail-value" style="font-size: 1.5rem; font-weight: 700;">${quiz.grade}</span></div>
        <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${formatDate(quiz.timestamp)}</span></div>
        <h3 style="margin-top: 20px; color: #94a3b8;">Question Answers:</h3>
    `;

    for (let i = 0; i < quiz.totalQuestions; i++) {
        const isCorrect = quiz.answerCorrectness[i];
        const userAnswer = quiz.answerTexts[i] || 'No answer';
        const correctAnswer = quiz.correctAnswerTexts[i] || 'Unknown';
        const questionText = quiz.questionTexts[i] || `Question ${i + 1}`;

        detailsHTML += `
            <div style="padding: 15px; margin: 10px 0; background: #020617; border-radius: 8px; border-left: 3px solid ${isCorrect ? '#10b981' : '#ef4444'}">
                <strong style="color: #f1f5f9;">Q${i + 1}: ${questionText} ${isCorrect ? '✅' : '❌'}</strong>
                <p style="margin: 8px 0 5px 0; color: #94a3b8;">Your answer:</p>
                <p style="margin: 0; padding: 8px 12px; background: ${isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 6px; color: ${isCorrect ? '#10b981' : '#ef4444'};">${userAnswer}</p>
                ${!isCorrect ? `<p style="margin: 8px 0 5px 0; color: #94a3b8;">Correct answer:</p><p style="margin: 0; padding: 8px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; color: #10b981;">${correctAnswer}</p>` : ''}
            </div>
        `;
    }

    modalBody.innerHTML = detailsHTML;
    modal.classList.add('active');
}

const closeQuizModal = document.getElementById('closeQuizModal');
if (closeQuizModal) {
    closeQuizModal.addEventListener('click', () => {
        document.getElementById('quizModal').classList.remove('active');
    });
}

const quizModal = document.getElementById('quizModal');
if (quizModal) {
    quizModal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('active');
    });
}

function formatDate(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

window.showQuizDetails = showQuizDetails;

console.log("✅ Assessment.js ready");
