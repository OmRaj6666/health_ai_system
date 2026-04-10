// Since FastAPI and Frontend are served together in production, we use relative paths.
// If testing locally where they are separate, we fallback to localhost:8080.
const currentHost = window.location.hostname;
const API_BASE_URL = currentHost === '127.0.0.1' || currentHost === 'localhost' ? 'http://localhost:8080' : '';

class ApiService {
    static async getHealthScore() {
        try {
            const response = await fetch(`${API_BASE_URL}/health-score`);
            return await response.json();
        } catch (error) {
            console.error(error); return null;
        }
    }

    static async trackActivity(type, details) {
        try {
            const response = await fetch(`${API_BASE_URL}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity_type: type, details })
            });
            return await response.json();
        } catch (error) {
            console.error(error); return null;
        }
    }

    static async getNudges() {
        try {
            const response = await fetch(`${API_BASE_URL}/nudges`);
            return await response.json();
        } catch (error) {
            console.error(error); return [];
        }
    }

    static async getDetailedRecommendations() {
        try {
            const response = await fetch(`${API_BASE_URL}/recommend`);
            return await response.json();
        } catch (error) {
            console.error(error); return [];
        }
    }

    static async getInsights() {
        try {
            const response = await fetch(`${API_BASE_URL}/behavior`);
            return await response.json();
        } catch (error) {
            console.error(error); return [];
        }
    }

    static async saveUserProfile(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(error); return null;
        }
    }
}
