// Dashboard JavaScript for GeniusAct Global — Campaign Contribution Dashboard

document.addEventListener('DOMContentLoaded', function () {
    // ==================== INITIALIZATION ====================
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'success') showVerificationSuccess();

    initMobileSidebar();
    initSidebarNav();
    initKYCForm();
    initTestimonialSlider();
    initBroadcasts();
    loadDonationHistory();
    animateProgressBars();
    animateEngagement();
    pollForUpdates();

    // ==================== MOBILE SIDEBAR ====================
    function initMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        const btn = document.createElement('button');
        btn.className = 'mobile-menu-btn';
        btn.innerHTML = '<i class="fas fa-bars"></i>';
        btn.setAttribute('aria-label', 'Open menu');
        btn.addEventListener('click', () => {
            const open = sidebar.classList.toggle('active');
            btn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            document.body.style.overflow = open ? 'hidden' : '';
        });
        document.body.insertBefore(btn, document.body.firstChild);
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !btn.contains(e.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-bars"></i>';
                document.body.style.overflow = '';
            }
        });
    }

    // ==================== SIDEBAR NAVIGATION ====================
    function initSidebarNav() {
        const links = document.querySelectorAll('.sidebar-nav a');
        links.forEach(link => {
            link.addEventListener('click', function (e) {
                links.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                // Close mobile sidebar on nav click
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    document.body.style.overflow = '';
                    const btn = document.querySelector('.mobile-menu-btn');
                    if (btn) btn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });
    }

    // ==================== DONATION HISTORY ====================
    // Sample donation data (in production, this would come from the backend API)
    const sampleDonations = [
        { id: 'RCP-2026-0412', amount: 250, date: '2026-04-12', description: 'General Campaign Fund', status: 'confirmed' },
        { id: 'RCP-2026-0328', amount: 100, date: '2026-03-28', description: 'GENIUS Act Initiative', status: 'confirmed' },
        { id: 'RCP-2026-0215', amount: 500, date: '2026-02-15', description: 'Premium Gold Tier Contribution', status: 'confirmed' },
        { id: 'RCP-2026-0130', amount: 50, date: '2026-01-30', description: 'Digital Outreach Fund', status: 'confirmed' },
        { id: 'RCP-2026-0105', amount: 75, date: '2026-01-05', description: 'General Campaign Fund', status: 'confirmed' },
    ];

    function loadDonationHistory() {
        const container = document.getElementById('donations-list');
        const countBadge = document.getElementById('donation-count');
        const noState = document.getElementById('no-donations');
        if (!container) return;

        // Try fetching from API first, fall back to sample data
        const donations = sampleDonations;

        if (donations.length === 0) {
            if (noState) noState.style.display = 'block';
            return;
        }

        if (noState) noState.style.display = 'none';
        if (countBadge) countBadge.textContent = `${donations.length} donation${donations.length !== 1 ? 's' : ''}`;

        let totalContributed = 0;
        donations.forEach((d, i) => {
            totalContributed += d.amount;
            const entry = document.createElement('div');
            entry.className = 'donation-entry';
            entry.style.animationDelay = `${i * 0.1}s`;
            const dateObj = new Date(d.date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            entry.innerHTML = `
                <div class="donation-icon"><i class="fas fa-receipt"></i></div>
                <div class="donation-details">
                    <h4>${d.description}</h4>
                    <p>${dateStr}</p>
                    <span class="donation-receipt">Receipt: ${d.id}</span>
                </div>
                <div class="donation-amount">${formatCurrency(d.amount)}</div>
            `;
            container.appendChild(entry);
        });

        // Update stats
        updateStat('stat-my-total', formatCurrency(totalContributed));
        updateStat('detail-contributed', formatCurrency(totalContributed));
        updateStat('detail-donations', donations.length.toString());
        updateStat('detail-member-since', formatDate(donations[donations.length - 1].date));

        // Update tier based on total
        updateTier(totalContributed);
        updateEngagementScore(donations.length, totalContributed);
    }

    // ==================== TIER SYSTEM ====================
    const tiers = [
        { name: 'Bronze Supporter', min: 0, max: 99, color: '#cd7f32', desc: 'Thank you for being part of our campaign community.' },
        { name: 'Silver Supporter', min: 100, max: 499, color: '#94a3b8', desc: 'Your consistent support is making a real difference.' },
        { name: 'Gold Supporter', min: 500, max: 1999, color: '#f59e0b', desc: 'You\'re a key pillar of our campaign\'s success.' },
        { name: 'Platinum Supporter', min: 2000, max: Infinity, color: '#6366f1', desc: 'You are among our most valued campaign leaders.' },
    ];

    function updateTier(totalAmount) {
        let tier = tiers[0];
        let tierIndex = 0;
        for (let i = 0; i < tiers.length; i++) {
            if (totalAmount >= tiers[i].min) { tier = tiers[i]; tierIndex = i; }
        }

        const badge = document.getElementById('tier-badge');
        const name = document.getElementById('tier-name');
        const nameShort = document.getElementById('tier-name-short');
        const desc = document.getElementById('tier-description');
        const fill = document.getElementById('tier-fill');
        const next = document.getElementById('tier-next');
        const levels = document.querySelectorAll('.tier-level');

        if (name) name.textContent = tier.name;
        if (nameShort) nameShort.textContent = tier.name;
        if (desc) desc.textContent = tier.desc;
        if (badge) badge.style.color = tier.color;

        // Progress to next tier
        if (tierIndex < tiers.length - 1) {
            const nextTier = tiers[tierIndex + 1];
            const progress = Math.min(100, ((totalAmount - tier.min) / (nextTier.min - tier.min)) * 100);
            if (fill) fill.style.width = progress + '%';
            if (next) next.textContent = `Next tier: ${nextTier.name} ($${nextTier.min}+)`;
        } else {
            if (fill) fill.style.width = '100%';
            if (next) next.textContent = 'Maximum tier reached!';
        }

        levels.forEach((lvl, i) => {
            lvl.classList.toggle('active', i <= tierIndex);
        });
    }

    // ==================== ENGAGEMENT SCORE ====================
    function updateEngagementScore(donationCount, totalAmount) {
        // Score based on donation frequency and total amount
        // Max 100: 40 points for amount, 40 for frequency, 20 base
        const amountScore = Math.min(40, (totalAmount / 1000) * 40);
        const freqScore = Math.min(40, donationCount * 8);
        const score = Math.round(Math.min(100, 20 + amountScore + freqScore));

        const scoreEl = document.getElementById('engagement-score');
        const ringEl = document.getElementById('engagement-ring-fill');

        if (scoreEl) {
            animateCounter(scoreEl, score);
        }
        if (ringEl) {
            setTimeout(() => {
                ringEl.setAttribute('stroke-dasharray', `${score} ${100 - score}`);
            }, 300);
        }
    }

    // ==================== PROGRESS BAR ANIMATION ====================
    function animateProgressBars() {
        const bars = document.querySelectorAll('.progress-bar');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const progress = bar.getAttribute('data-progress');
                    bar.style.width = progress + '%';
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.3 });

        bars.forEach(bar => {
            bar.style.width = '0';
            observer.observe(bar);
        });
    }

    function animateEngagement() {
        // Animate donut chart segments on scroll
        const donut = document.querySelector('.donut-chart');
        if (!donut) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    donut.classList.add('animated');
                    observer.unobserve(donut);
                }
            });
        }, { threshold: 0.3 });
        observer.observe(donut);
    }

    // ==================== KYC FORM ====================
    function initKYCForm() {
        const form = document.getElementById('kyc-form');
        const status = document.getElementById('kyc-status');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const origText = btn.textContent;
            btn.textContent = 'Processing...';
            btn.disabled = true;

            setTimeout(() => {
                form.reset();
                status.textContent = 'Identity verification submitted successfully! Your documents are being processed.';
                status.className = 'status-message success';
                status.style.display = 'block';
                btn.textContent = origText;
                btn.disabled = false;
                setTimeout(() => { status.style.display = 'none'; }, 5000);
            }, 1500);
        });
    }

    // ==================== TESTIMONIALS ====================
    function initTestimonialSlider() {
        const slides = document.querySelectorAll('.testimonial-slide');
        const prev = document.getElementById('prevTestimonial');
        const next = document.getElementById('nextTestimonial');
        if (slides.length === 0) return;
        let current = 0;

        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            slides[index].classList.add('active');
        }

        if (next) next.addEventListener('click', () => { current = (current + 1) % slides.length; showSlide(current); });
        if (prev) prev.addEventListener('click', () => { current = (current - 1 + slides.length) % slides.length; showSlide(current); });
        setInterval(() => { current = (current + 1) % slides.length; showSlide(current); }, 6000);
    }

    // ==================== BROADCASTS ====================
    function initBroadcasts() {
        const closeBtn = document.querySelector('.broadcast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('broadcast-message').classList.add('hidden');
            });
        }
    }

    function showBroadcast(message) {
        const banner = document.getElementById('broadcast-message');
        const text = document.querySelector('.broadcast-text');
        if (banner && text) {
            text.textContent = message;
            banner.classList.remove('hidden');
            setTimeout(() => banner.classList.add('hidden'), 12000);
        }
    }

    // ==================== POLLING ====================
    function pollForUpdates() {
        // In production, this would poll the backend API for new broadcasts and news
        // For now, show a welcome broadcast after 4 seconds
        setTimeout(() => {
            showBroadcast('Welcome back! The Q2 fundraising campaign is in full swing — thank you for your support.');
        }, 4000);
    }

    // ==================== UTILITIES ====================
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    function updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function animateCounter(el, target) {
        let current = 0;
        const duration = 1500;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            current = Math.round(target * progress);
            el.textContent = current;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ==================== PRINT SUPPORT ====================
    window.addEventListener('beforeprint', () => {
        document.body.style.backgroundColor = 'white';
        const sidebar = document.querySelector('.sidebar');
        const main = document.querySelector('.main-content');
        if (sidebar) sidebar.style.display = 'none';
        if (main) { main.style.marginLeft = '0'; main.style.width = '100%'; }
    });
    window.addEventListener('afterprint', () => location.reload());
});

// Show verification success message
function showVerificationSuccess() {
    const msg = document.createElement('div');
    msg.className = 'status-message success';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> Identity verification successful! You now have access to all dashboard features.';
    const main = document.querySelector('.main-content');
    if (main) {
        main.insertBefore(msg, main.children[1]); // After header
        setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => msg.remove(), 300); }, 5000);
    }
}