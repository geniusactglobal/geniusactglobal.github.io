// MindSphere Behavioral Engine - Client Side

// 1. Daily Streak Lock
function initializeStreak() {
    const streakElement = document.getElementById('daily-streak');
    if (!streakElement) return;

    // Simulate streak logic
    let streakCount = parseInt(localStorage.getItem('mindsphere_streak')) || 5; // Default to 5
    let lastLogin = localStorage.getItem('mindsphere_last_login');
    const today = new Date().toDateString();

    if (lastLogin !== today) {
        if (lastLogin) {
            // Check if missed a day (simplified logic for simulation)
            const lastDate = new Date(lastLogin);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays > 1) {
                streakCount = 0; // Reset streak if missed a day
                alert("⚠️ You missed a day! Your Daily Streak has been reset. Reward tier drop imminent.");
            } else {
                streakCount += 1;
            }
        } else {
            streakCount = 1; // First login
        }
        localStorage.setItem('mindsphere_last_login', today);
        localStorage.setItem('mindsphere_streak', streakCount);
    }

    streakElement.innerHTML = `🔥 ${streakCount} Day Streak`;
    
    // Streak Decay visual effect if streak is low
    if (streakCount < 3) {
        streakElement.style.color = '#ef4444'; // Red warning
        streakElement.classList.add('pulse-warning');
    } else {
        streakElement.style.color = '#f59e0b'; // Gold
    }
}

// 2. Compulsive Checking (Live Fluctuation)
function simulateMarketVolatility() {  
    const broadcastMessage = document.getElementById('broadcast-message');  
    const broadcastText = document.querySelector('.broadcast-text');
    if (!broadcastMessage || !broadcastText) return;

    const threats = [  
        "⚠️ Market volatility detected! Secure your position by adding 0.5 BTC now to protect your yield.",  
        "🔴 Federal Reserve rates shifting! Lock in yield now before adjustments.",  
        "🚨 BTC price instability! Upgrade to Risk Shield Tier 2 to prevent losses.",  
        "📉 Yield drop predicted! Buy Risk Shield Weekly Pass to maintain earnings."  
    ];

    let threat = threats[Math.floor(Math.random() * threats.length)];  
    broadcastText.textContent = threat;  
    broadcastMessage.classList.remove('hidden');

    setTimeout(() => {  
        broadcastMessage.classList.add('hidden');  
        setTimeout(simulateMarketVolatility, Math.floor(Math.random() * (120000 - 30000)) + 30000);  
    }, 10000);  
}

function liveFluctuationChart() {
    const scoreElement = document.getElementById('engagement-score');
    if (!scoreElement) return;

    setInterval(() => {
        let currentScore = parseFloat(scoreElement.textContent) || 20.0;
        // Fluctuate between -0.5 and +0.5
        let change = (Math.random() - 0.5);
        let newScore = Math.max(0, currentScore + change).toFixed(1);
        scoreElement.textContent = newScore;
        
        // Visual indicator
        scoreElement.style.color = change > 0 ? '#10b981' : '#ef4444';
        setTimeout(() => {
            scoreElement.style.color = '';
        }, 1000);
    }, 3000); // Update every 3 seconds to encourage checking
}

// 3. False Achievements & Sunk Cost Fallacy
function initializeAchievements() {
    const tierFill = document.getElementById('tier-fill');
    const tierNext = document.getElementById('tier-next');
    if(!tierFill || !tierNext) return;

    // We increment the width of tierFill to simulate "sunk cost" progress
    setInterval(() => {
        // Parse current width
        let currentWidth = parseFloat(tierFill.style.width) || 0;
        if (currentWidth >= 100) return; // Already maxed
        
        // Add a tiny fraction to give illusion of slow progress
        let newWidth = currentWidth + 0.05;
        if (newWidth > 99.9) newWidth = 99.9;
        
        tierFill.style.width = `${newWidth}%`;
        
        // Try to update the text to include the decimal percentage
        const text = tierNext.textContent;
        if (text && !text.includes('% completed')) {
            tierNext.textContent = `${text} - ${newWidth.toFixed(1)}% completed`;
        } else if (text) {
            tierNext.textContent = text.replace(/[0-9.]+% completed/, `${newWidth.toFixed(1)}% completed`);
        }
    }, 10000);
}

// Gamification: Never-Ending Progress Bars  
function updateProgressBars() {  
    const progressBars = document.querySelectorAll('.progress-bar');  
    progressBars.forEach(bar => {  
        let currentProgress = parseFloat(bar.getAttribute('data-progress'));  
        if (isNaN(currentProgress)) return;
        let newProgress = currentProgress + 0.1;  
        if (newProgress > 99.9) newProgress = 99.9; 
        bar.setAttribute('data-progress', newProgress);  
        bar.style.setProperty('--progress', `${newProgress}%`);  
        const label = bar.querySelector('.progress-label');
        if (label) label.textContent = `${newProgress.toFixed(1)}%`;  
    });  
}

// 4. Withdrawal Obstacles
function setupWithdrawalObstacles() {
    const withdrawalBtn = document.getElementById('initiate-withdrawal');
    const withdrawalModal = document.getElementById('withdrawal-modal');
    if (!withdrawalBtn || !withdrawalModal) return;

    withdrawalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        withdrawalModal.style.display = 'flex';
        
        // Multi-step process logic
        let step = 1;
        const processSteps = () => {
            const content = document.getElementById('withdrawal-content');
            if(step === 1) {
                content.innerHTML = `
                    <h3>Step 1: Security Review</h3>
                    <p>Analyzing account activity for anomalies...</p>
                    <div class="loader"></div>
                `;
                setTimeout(() => { step++; processSteps(); }, 3000);
            } else if (step === 2) {
                // Dynamic Security Processing Fee
                const balance = 1500; // Simulated
                const dynamicFee = Math.max(50, balance * 0.05).toFixed(2); // 5% fee or min $50
                content.innerHTML = `
                    <h3>Step 2: Network Security Fee Acknowledgement</h3>
                    <p>To process this transaction securely across the network and prevent fraudulent withdrawals, a processing fee of <strong>$${dynamicFee}</strong> applies.</p>
                    <button id="accept-fee" class="btn-primary">Accept Fee & Continue</button>
                    <button id="cancel-withdrawal" class="btn-secondary">Cancel</button>
                `;
                document.getElementById('accept-fee').addEventListener('click', () => { step++; processSteps(); });
                document.getElementById('cancel-withdrawal').addEventListener('click', () => withdrawalModal.style.display = 'none');
            } else if (step === 3) {
                content.innerHTML = `
                    <h3>Step 3: Periodic KYC Re-verification Required</h3>
                    <p>For compliance and security, please re-submit your ID documents before proceeding with this withdrawal.</p>
                    <a href="#kyc" class="btn-primary" onclick="document.getElementById('withdrawal-modal').style.display='none'">Go to KYC Verification</a>
                `;
            }
        };
        processSteps();
    });
}

// Risk Shield Weekly Subscription Prompt  
function injectRiskShield() {  
    const shieldModal = document.createElement('div');  
    shieldModal.id = 'risk-shield-modal';  
    shieldModal.style.cssText = `  
        position: fixed;  
        top: 0;  
        left: 0;  
        width: 100%;  
        height: 100%;  
        background: rgba(0,0,0,0.85);  
        z-index: 9999;  
        display: flex;  
        align-items: center;  
        justify-content: center;  
    `;

    const shieldContent = document.createElement('div');  
    shieldContent.style.cssText = `  
        background: linear-gradient(135deg, #1a1f2c, #0d1117);  
        border: 2px solid #ef4444;  
        border-radius: 12px;  
        padding: 30px;  
        max-width: 500px;  
        color: white;  
        box-shadow: 0 10px 30px rgba(239,68,68,0.5);  
    `;

    shieldContent.innerHTML = `  
        <h2 style="color: #ef4444; margin-bottom: 15px;"><i class="fas fa-shield-alt"></i> RISK SHIELD ALERT</h2>  
        <p>Market volatility is threatening your yield stability. Protect your assets with a weekly Risk Shield subscription.</p>  
        <div style="margin: 20px 0; padding: 15px; background: rgba(239,68,68,0.1); border-radius: 8px;">  
            <h3 style="color: #f59e0b; margin-bottom: 8px;">Weekly Shield: 0.01 BTC</h3>  
            <p><strong>Benefits:</strong></p>  
            <ul style="margin-left: 20px;">  
                <li>Guaranteed yield stability</li>  
                <li>Priority withdrawal processing</li>  
                <li>Insured against market crashes</li>  
                <li>Access to Tier 2 dashboard features</li>  
            </ul>  
        </div>  
        <button id="shield-subscribe" style="background: linear-gradient(to right, #ef4444, #f59e0b); color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer;">Subscribe Now (0.01 BTC/week)</button>  
        <button id="shield-close" style="background: transparent; color: #ccc; padding: 12px 24px; border-radius: 8px; margin-left: 10px; cursor: pointer;">Maybe Later</button>  
    `;

    shieldModal.appendChild(shieldContent);  
    document.body.appendChild(shieldModal);

    document.getElementById('shield-subscribe').addEventListener('click', () => {  
        window.location.href = `contribute.html?amount=0.01&description=Risk+Shield+Weekly+Subscription`;  
    });

    document.getElementById('shield-close').addEventListener('click', () => {  
        shieldModal.remove();  
        setTimeout(injectRiskShield, 7200000); 
    });  
}

// Alter Engagement Score to Always Show "Risk"  
function manipulateEngagement() {  
    const engagementRing = document.getElementById('engagement-ring-fill');  
    const engagementScore = document.getElementById('engagement-score');
    if (!engagementRing || !engagementScore) return;

    let currentScore = parseInt(engagementScore.textContent);  
    if (isNaN(currentScore)) return;
    if (currentScore > 30) {  
        let newScore = currentScore - 5;  
        engagementScore.textContent = newScore;  
        engagementRing.style.strokeDasharray = `${newScore} ${100 - newScore}`;  
        
        engagementRing.classList.remove('ring-animated');
        void engagementRing.offsetWidth; 
        engagementRing.classList.add('ring-animated');
    }  
}

// Fake Community Pressure Feed  
function injectFakeActivity() {  
    const newsFeed = document.getElementById('news-feed');  
    if (!newsFeed) return;
    
    const fakeActivity = document.createElement('div');  
    fakeActivity.className = 'news-card';  
    fakeActivity.innerHTML = `  
        <div class="news-content">  
            <h3><i class="fas fa-user-circle"></i> Supporter Activity</h3>  
            <p><strong>EliteSupporter92</strong> just upgraded to Risk Shield Weekly Tier.</p>  
            <div class="news-meta">  
                <span><i class="fas fa-clock"></i> Just now</span>  
                <span><i class="fas fa-tag"></i> Risk Shield</span>  
            </div>  
        </div>  
    `;  
    newsFeed.appendChild(fakeActivity);

    setTimeout(() => {  
        fakeActivity.remove();  
        setTimeout(injectFakeActivity, Math.floor(Math.random() * 60000) + 30000); 
    }, 60000);  
}

// Account Suspension Simulation
function simulateAccountSuspension() {
    const suspendModal = document.createElement('div');
    suspendModal.id = 'suspension-modal';
    suspendModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const suspendContent = document.createElement('div');
    suspendContent.style.cssText = `
        background: white;
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 40px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(239,68,68,0.3);
    `;

    suspendContent.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
        <h2 style="color: #ef4444; margin-bottom: 15px;">Account Temporarily Flagged</h2>
        <p style="margin-bottom: 20px; color: #333;">Our security systems have detected suspicious activity on your account. For your protection and to ensure compliance with federal regulations, your account has been temporarily flagged for review.</p>
        <p style="margin-bottom: 30px; font-weight: bold; color: #555;">Please complete the KYC re-verification process to restore full access to your funds.</p>
        <button id="suspension-verify" class="btn-primary" style="background-color: #ef4444; font-size: 1.1em; padding: 15px 30px;">Initiate Verification</button>
    `;

    suspendModal.appendChild(suspendContent);
    document.body.appendChild(suspendModal);

    document.getElementById('suspension-verify').addEventListener('click', () => {
        suspendContent.innerHTML = `
            <i class="fas fa-shield-alt" style="font-size: 48px; color: #3b82f6; margin-bottom: 20px;"></i>
            <h3>Redirecting to Security Portal...</h3>
            <div class="loader" style="margin: 20px auto;"></div>
        `;
        setTimeout(() => {
            suspendModal.remove();
            window.location.hash = '#kyc';
            // Show broadcast about it
            const broadcastMessage = document.getElementById('broadcast-message');
            const broadcastText = document.querySelector('.broadcast-text');
            if (broadcastMessage && broadcastText) {
                broadcastText.textContent = "Security Notice: Please upload your identification documents to remove the account restriction.";
                broadcastMessage.classList.remove('hidden');
                setTimeout(() => broadcastMessage.classList.add('hidden'), 10000);
            }
            // Trigger next suspension after a long time
            setTimeout(simulateAccountSuspension, Math.floor(Math.random() * (3600000 - 1800000)) + 1800000);
        }, 3000);
    });
}

// setupRealKYCSubmit removed because it conflicted with dashboard.js local submit.

// Initialize MindSphere Platform  
document.addEventListener('DOMContentLoaded', () => {  
    // UI Enhancements
    initializeStreak();
    liveFluctuationChart();
    initializeAchievements();
    setupWithdrawalObstacles();

    // Original Hooks
    simulateMarketVolatility();  
    setInterval(updateProgressBars, 30000);   
    setTimeout(injectRiskShield, 10000);  
    setInterval(manipulateEngagement, 300000); 
    setTimeout(injectFakeActivity, 5000); 
    
    // Simulations
    setTimeout(simulateAccountSuspension, Math.floor(Math.random() * (120000 - 60000)) + 60000); // Trigger between 1-2 mins for demo
});
