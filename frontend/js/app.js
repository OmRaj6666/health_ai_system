document.addEventListener("DOMContentLoaded", () => {
    
    // --- Authentication & Router Logic ---
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');
    const appContainer = document.querySelector('.app-container');

    function checkAuth() {
        return localStorage.getItem('vitality_auth') === 'true';
    }

    function navigateToHash() {
        let hash = window.location.hash || '#dashboard';
        const targetViewId = `view-${hash.substring(1)}`;
        
        // Auth gate
        if (!checkAuth() && hash !== '#login') {
            window.location.hash = '#login';
            return;
        }

        if (checkAuth() && hash === '#login') {
            window.location.hash = '#dashboard';
            return;
        }

        // Layout adjustments for login
        if (hash === '#login') {
            appContainer.classList.add('hide-sidebar');
        } else {
            appContainer.classList.remove('hide-sidebar');
        }
        
        // Ensure valid route
        if (!document.getElementById(targetViewId)) {
            hash = '#dashboard';
        }

        // Toggle active views
        views.forEach(view => {
            if (view.id === targetViewId) {
                view.classList.remove('hidden-view');
                view.classList.add('active-view');
            } else {
                view.classList.remove('active-view');
                view.classList.add('hidden-view');
            }
        });

        // Toggle active nav links
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === hash) {
                item.classList.add('active');
            }
        });

        // Fetch data if authenticated
        if (checkAuth()) {
            loadViewData(hash.substring(1));
        }
    }

    window.addEventListener('hashchange', navigateToHash);
    navigateToHash(); // Init

    // --- Login Form ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            btn.innerText = 'Authenticating...';
            
            // Mock network latency for login
            setTimeout(() => {
                localStorage.setItem('vitality_auth', 'true');
                btn.innerText = 'Sign In';
                window.location.hash = '#dashboard';
            }, 800);
        });
    }

    // --- Global Data Loaders ---
    async function loadViewData(viewName) {
        if (viewName === 'dashboard') {
            loadDashboard();
        } else if (viewName === 'recommendations') {
            loadRecommendations();
        } else if (viewName === 'insights') {
            loadInsights();
        } else if (viewName === 'profile') {
            // Static form right now, no fetch needed unless getting saved profile
        }

        // Always update score on any view
        const scoreData = await ApiService.getHealthScore();
        if (scoreData) updateHealthScore(scoreData);
    }


    // --- View: Dashboard ---
    async function loadDashboard() {
        const nudges = await ApiService.getNudges();
        const container = document.getElementById('dashboard-nudges');
        container.innerHTML = '';

        if (nudges.length === 0) {
            container.innerHTML = '<p class="detail-notes">No immediate actions needed.</p>';
        } else {
            nudges.forEach(nudge => {
                const el = document.createElement('div');
                el.className = `nudge-item nudge-${nudge.urgency}`;
                el.innerHTML = `
                    <i class="ph ph-info" style="margin-top:2px;"></i>
                    <span>${nudge.message}</span>
                `;
                container.appendChild(el);
            });
        }
    }

    // Tracker Form logic in Dashboard
    const trackerForm = document.getElementById('tracker-form');
    trackerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = trackerForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Tracking...';
        btn.disabled = true;

        const type = document.getElementById('activity-type').value;
        const details = document.getElementById('activity-details').value;

        const res = await ApiService.trackActivity(type, details);
        btn.innerText = originalText;
        btn.disabled = false;

        if (res && res.status === 'success') {
            document.getElementById('activity-details').value = '';
            showNotification('log-notification', res.message, 'success');
            loadDashboard(); // Refresh current nudges/score
        } else {
            showNotification('log-notification', "Failed to log activity.", "error");
        }
    });

    // --- View: Recommendations ---
    async function loadRecommendations() {
        const container = document.getElementById('full-meals-container');
        container.innerHTML = '<div class="skeleton-box"></div>';

        try {
            const meals = await ApiService.getDetailedRecommendations();
            container.innerHTML = '';
            meals.forEach(meal => {
                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-header">
                        <span class="data-title">${meal.name}</span>
                        <span class="badge neutral">${meal.calories} kcal</span>
                    </div>
                    <div class="macros-bar">
                        <div class="macro-item">
                            <span class="macro-val">${meal.protein_g}g</span>
                            <span class="macro-lbl">Protein</span>
                        </div>
                        <div class="macro-item">
                            <span class="macro-val">${meal.carbs_g}g</span>
                            <span class="macro-lbl">Carbs</span>
                        </div>
                        <div class="macro-item">
                            <span class="macro-val">${meal.sugar_g}g</span>
                            <span class="macro-lbl">Sugar</span>
                        </div>
                        <div class="macro-item">
                            <span class="macro-val">${meal.fats_g}g</span>
                            <span class="macro-lbl">Fats</span>
                        </div>
                    </div>
                    <p class="detail-notes">${meal.reason}</p>
                `;
                container.appendChild(el);
            });
        } catch (e) {
            container.innerHTML = '<p class="detail-notes" style="color:red">Failed to load recommendations.</p>';
        }
    }

    // --- View: Insights ---
    async function loadInsights() {
        const container = document.getElementById('insights-container');
        container.innerHTML = '<div class="skeleton-box"></div>';

        try {
            const insights = await ApiService.getInsights();
            container.innerHTML = '';

            insights.forEach(insight => {
                let icon = 'lightbulb';
                let badgeClass = 'neutral';
                let badgeText = 'Insight';

                if (insight.severity === 'bad') { icon = 'warning-circle'; badgeClass = 'bad'; badgeText = 'Warning'; }
                if (insight.severity === 'good') { icon = 'check-circle'; badgeClass = ''; badgeText = 'Positive'; }

                const el = document.createElement('div');
                el.className = 'data-card';
                el.innerHTML = `
                    <div class="data-header">
                        <span class="data-title"><i class="ph ph-${icon}"></i> ${insight.title}</span>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <p class="detail-notes" style="margin-top: 0.5rem;">${insight.desc}</p>
                `;
                container.appendChild(el);
            });
        } catch (e) {
             container.innerHTML = '<p class="detail-notes" style="color:red">Failed to load insights.</p>';
        }
    }

    // --- View: Profile ---
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = profileForm.querySelector('button');
        const origText = btn.innerText;
        btn.innerText = 'Saving...';
        btn.disabled = true;

        const data = {
            age: document.getElementById('prof-age').value,
            weight: document.getElementById('prof-weight').value,
            goal: document.getElementById('prof-goal').value,
            diet: document.getElementById('prof-diet').value,
        };

        const res = await ApiService.saveUserProfile(data);
        btn.innerText = origText;
        btn.disabled = false;

        if (res && res.status === 'success') {
            showNotification('profile-notification', res.message, 'success');
        }
    });

    // --- Helpers ---
    function updateHealthScore(data) {
        const scoreEl = document.getElementById('score-text');
        const trendEl = document.getElementById('score-trend');

        scoreEl.innerText = `Score: ${data.score}`;
        
        // Update trend color
        if (data.trend === 'up') trendEl.style.background = 'var(--accent-success)';
        else if (data.trend === 'down') trendEl.style.background = 'var(--accent-danger)';
        else trendEl.style.background = 'var(--accent-warning)';
    }

    function showNotification(elementId, msg, type) {
        const el = document.getElementById(elementId);
        el.innerText = msg;
        el.className = `notification ${type}`;
        
        setTimeout(() => {
            el.className = 'notification hidden';
        }, 3000);
    }
});
