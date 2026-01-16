// Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Chart instances
let profitChart = null;
let revenueChart = null;

// DOM Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const revenueInput = document.getElementById('revenue');
const expensesInput = document.getElementById('expenses');
const cashInput = document.getElementById('cash');
const loadingOverlay = document.getElementById('loadingOverlay');
const metricsSection = document.getElementById('metricsSection');
const chartsSection = document.getElementById('chartsSection');
const strategySection = document.getElementById('strategySection');

// Event Listeners
analyzeBtn.addEventListener('click', runAnalysis);

// Allow Enter key to trigger analysis
[revenueInput, expensesInput, cashInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            runAnalysis();
        }
    });
});

// Main Analysis Function
async function runAnalysis() {
    const revenue = parseFloat(revenueInput.value);
    const expenses = parseFloat(expensesInput.value);
    const cash = parseFloat(cashInput.value);

    // Validation
    if (isNaN(revenue) || isNaN(expenses) || isNaN(cash)) {
        alert('Please enter valid numbers for all fields');
        return;
    }

    if (revenue < 0 || expenses < 0 || cash < 0) {
        alert('All values must be positive');
        return;
    }

    // Show loading
    showLoading();

    try {
        // Call API
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                revenue: revenue,
                expenses: expenses,
                cash: cash
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();

        // Update UI with results
        updateMetrics(data.metrics);
        updateCharts(data.forecasts);
        updateStrategy(data.strategy, data.risk_level);

        // Show sections with animation
        setTimeout(() => {
            metricsSection.style.display = 'block';
            chartsSection.style.display = 'block';
            strategySection.style.display = 'block';
            
            // Smooth scroll to results
            metricsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 500);

    } catch (error) {
        console.error('Analysis error:', error);
        alert('Failed to analyze data. Please ensure the backend server is running.');
    } finally {
        hideLoading();
    }
}

// Update Metrics Display
function updateMetrics(metrics) {
    const profitValue = document.getElementById('profitValue');
    const marginValue = document.getElementById('marginValue');
    const burnValue = document.getElementById('burnValue');
    const runwayValue = document.getElementById('runwayValue');
    const growthValue = document.getElementById('growthValue');

    // Animate numbers
    animateValue(profitValue, 0, metrics.profit, 1000, true);
    animateValue(marginValue, 0, metrics.profit_margin, 1000, false, '%');
    animateValue(burnValue, 0, metrics.burn_rate, 1000, true, '/mo');
    
    if (metrics.runway === Infinity) {
        runwayValue.textContent = '∞';
    } else {
        animateValue(runwayValue, 0, metrics.runway, 1000, false, ' months');
    }
    
    animateValue(growthValue, 0, metrics.growth_score, 1000, false, '/100');

    // Color code profit
    if (metrics.profit >= 0) {
        profitValue.style.color = '#10b981';
    } else {
        profitValue.style.color = '#ef4444';
    }
}

// Animate Number Values
function animateValue(element, start, end, duration, isCurrency = false, suffix = '') {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * easeOutQuart(progress);
        
        if (isCurrency) {
            element.textContent = formatCurrency(current) + suffix;
        } else {
            element.textContent = current.toFixed(1) + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Easing function
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// Format Currency
function formatCurrency(value) {
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const formatted = '$' + absValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return isNegative ? '-' + formatted : formatted;
}

// Update Charts
function updateCharts(forecasts) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Profit Chart
    const profitCtx = document.getElementById('profitChart').getContext('2d');
    
    if (profitChart) {
        profitChart.destroy();
    }
    
    profitChart = new Chart(profitCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Projected Profit',
                data: forecasts.profit,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            weight: 600
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Profit: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Projected Revenue',
                data: forecasts.revenue,
                backgroundColor: 'rgba(118, 75, 162, 0.8)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(118, 75, 162, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            weight: 600
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Update Strategy with Typing Animation
function updateStrategy(strategyText, riskLevel) {
    const strategyElement = document.getElementById('strategyText');
    const riskBadge = document.getElementById('riskBadge');
    const riskLevelElement = document.getElementById('riskLevel');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Update risk badge
    riskBadge.className = 'risk-badge ' + riskLevel.toLowerCase();
    riskLevelElement.textContent = riskLevel + ' Risk';
    
    // Show typing indicator
    typingIndicator.style.display = 'flex';
    strategyElement.textContent = '';
    
    // Simulate typing animation
    let i = 0;
    const speed = 20; // milliseconds per character
    
    setTimeout(() => {
        typingIndicator.style.display = 'none';
        
        const typeWriter = () => {
            if (i < strategyText.length) {
                strategyElement.textContent += strategyText.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        };
        
        typeWriter();
    }, 1500);
}

// Loading Functions
function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Initialize
console.log('FinSight AI initialized');
console.log('Backend URL:', API_BASE_URL);