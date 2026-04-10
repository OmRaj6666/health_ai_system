document.addEventListener("DOMContentLoaded", () => {
    
    // --- Routing & Auth ---
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');
    const appContainer = document.querySelector('.app-container');

    function checkAuth() {
        return localStorage.getItem('vitality_auth') === 'true';
    }

    function navigateToHash() {
        let hash = window.location.hash || '#dashboard';
        const targetViewId = `view-${hash.substring(1)}`;
        
        if (!checkAuth() && hash !== '#login') {
            window.location.hash = '#login';
            return;
        }
        if (checkAuth() && hash === '#login') {
            window.location.hash = '#dashboard';
            return;
        }

        if (hash === '#login') appContainer.classList.add('hide-sidebar');
        else appContainer.classList.remove('hide-sidebar');
        
        if (!document.getElementById(targetViewId)) hash = '#dashboard';

        views.forEach(view => {
            if (view.id === targetViewId) {
                view.classList.remove('hidden-view');
                view.classList.add('active-view');
            } else {
                view.classList.remove('active-view');
                view.classList.add('hidden-view');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === hash) item.classList.add('active');
        });

        if (checkAuth()) loadViewData(hash.substring(1));
    }

    window.addEventListener('hashchange', navigateToHash);
    navigateToHash();

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('vitality_auth');
            window.location.hash = '#login';
        });
    }

    // --- Dynamic UI Helpers ---
    function updateDashboardHeader() {
        const greeting = document.getElementById('greeting-text');
        const dateEl = document.getElementById('current-date');
        if (!greeting || !dateEl) return;

        const hour = new Date().getHours();
        let greetMsg = "Good Morning";
        if (hour >= 12 && hour < 17) greetMsg = "Good Afternoon";
        if (hour >= 17) greetMsg = "Good Evening";
        
        greeting.innerText = greetMsg;
        dateEl.innerText = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    function animateGauge(score) {
        const bar = document.getElementById('gauge-progress-bar');
        const valText = document.getElementById('gauge-val');
        if (!bar || !valText) return;

        // SVG circumference is 2 * PI * 70 = 439.8 (approx 440)
        const circumference = 440;
        const offset = circumference - (score / 100) * circumference;
        
        bar.style.strokeDashoffset = offset;
        
        // Count up text
        let start = 0;
        const end = score;
        const duration = 1500;
        const step = (end / duration) * 10;
        
        const counter = setInterval(() => {
            start += step;
            if (start >= end) {
                valText.innerText = Math.round(end);
                clearInterval(counter);
            } else {
                valText.innerText = Math.round(start);
            }
        }, 10);
    }

    // --- Data Loading ---
    async function loadViewData(viewName) {
        if (viewName === 'dashboard') {
            updateDashboardHeader();
            loadDashboard();
        } else if (viewName === 'recommendations') loadRecommendations();
        else if (viewName === 'insights') loadInsights();

        const scoreData = await ApiService.getHealthScore();
        if (scoreData) {
            animateGauge(scoreData.score);
            const scoreText = document.getElementById('score-text');
            if (scoreText) scoreText.innerText = `Score: ${scoreData.score}`;
        }
    }

    // Dashboard Items
    async function loadDashboard() {
        const nudges = await ApiService.getNudges();
        const container = document.getElementById('dashboard-nudges');
        if (!container) return;
        container.innerHTML = '';

        if (nudges.length === 0) {
            container.innerHTML = '<p style="opacity:0.6; padding: 1rem;">No immediate actions. You\'re doing great!</p>';
        } else {
            nudges.forEach(nudge => {
                const el = document.createElement('div');
                el.style.cssText = 'padding: 1rem; border-radius: 0.75rem; background: hsla(0,0%,50%,0.05); margin-bottom: 0.75rem; display: flex; align-items: flex-start; gap: 0.75rem;';
                el.innerHTML = `
                    <i class="ph ph-info" style="color: var(--primary); margin-top:2px;"></i>
                    <span>${nudge.message}</span>
                `;
                container.appendChild(el);
            });
        }
    }

    // Tracker Form
    const trackerForm = document.getElementById('tracker-form');
    if (trackerForm) {
        trackerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = trackerForm.querySelector('button');
            const orig = btn.innerText;
            btn.innerText = 'Analyzing...';
            btn.disabled = true;

            const res = await ApiService.trackActivity(
                document.getElementById('activity-type').value,
                document.getElementById('activity-details').value
            );

            btn.innerText = orig;
            btn.disabled = false;

            if (res && res.status === 'success') {
                document.getElementById('activity-details').value = '';
                showNotification('log-notification', 'Activity logged successfully', 'success');
                loadViewData('dashboard');
            }
        });
    }

    // Recommendations
    async function loadRecommendations() {
        const container = document.getElementById('full-meals-container');
        if (!container) return;
        container.innerHTML = '<div class="skeleton-box"></div>';

        const meals = await ApiService.getDetailedRecommendations();
        container.innerHTML = '';
        meals.forEach(meal => {
            const el = document.createElement('div');
            el.className = 'data-card glass';
            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="font-weight:700;">${meal.name}</h4>
                    <span class="badge" style="background:var(--primary-glow); color:var(--primary); font-size:0.8rem;">${meal.calories} kcal</span>
                </div>
                <div class="macros-bar">
                    <div class="macro-box"><span class="macro-val">${meal.protein_g}g</span><span class="macro-lbl">Prot</span></div>
                    <div class="macro-box"><span class="macro-val">${meal.carbs_g}g</span><span class="macro-lbl">Carb</span></div>
                    <div class="macro-box"><span class="macro-val">${meal.fats_g}g</span><span class="macro-lbl">Fat</span></div>
                </div>
                <p style="font-size:0.875rem; opacity:0.8;">${meal.reason}</p>
            `;
            container.appendChild(el);
        });
    }

    // Insights
    async function loadInsights() {
        const container = document.getElementById('insights-container');
        if (!container) return;
        container.innerHTML = '<div class="skeleton-box"></div>';

        const insights = await ApiService.getInsights();
        container.innerHTML = '';
        insights.forEach(insight => {
            let icon = 'lightbulb';
            let color = 'var(--primary)';
            if (insight.severity === 'bad') { icon = 'warning-circle'; color = 'var(--accent-danger)'; }
            if (insight.severity === 'good') { icon = 'check-circle'; color = 'var(--accent-success)'; }

            const el = document.createElement('div');
            el.className = 'data-card glass';
            el.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                    <i class="ph ph-${icon}" style="font-size:1.5rem; color:${color};"></i>
                    <h4 style="font-weight:700;">${insight.title}</h4>
                </div>
                <p style="opacity:0.8; font-size:0.9rem;">${insight.desc}</p>
            `;
            container.appendChild(el);
        });
    }

    // Profile Form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = profileForm.querySelector('button');
            btn.innerText = 'Saving Protocol...';
            btn.disabled = true;

            const res = await ApiService.saveUserProfile({
                age: document.getElementById('prof-age').value,
                weight: document.getElementById('prof-weight').value,
                goal: document.getElementById('prof-goal').value,
                diet: document.getElementById('prof-diet').value,
            });

            btn.innerText = 'Save Parameters';
            btn.disabled = false;
            if (res) showNotification('profile-notification', 'Bio-profile updated', 'success');
        });
    }

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            btn.innerText = 'Establishing Secure Connection...';
            setTimeout(() => {
                localStorage.setItem('vitality_auth', 'true');
                window.location.hash = '#dashboard';
                btn.innerText = 'Access Dashboard';
            }, 1200);
        });
    }

    // Notifications
    function showNotification(id, msg, type) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = msg;
        el.className = `notification ${type}`;
        setTimeout(() => el.className = 'notification hidden', 3000);
    }
});
