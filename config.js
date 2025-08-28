// Configuration management for API keys and environment variables
class Config {
    constructor() {
        this.apiKey = null;
        this.useProxy = true; // Use Vercel serverless function by default
        this.init();
    }

    async init() {
        // For Vercel deployment, we use serverless functions as proxy
        // No need to expose API key to client-side
        console.log('Config initialized for Vercel deployment');
    }

    async loadFromEnvConfig() {
        // This method is kept for backward compatibility but not used in Vercel
        console.log('Using Vercel serverless function proxy');
    }

    loadFromLocalStorage() {
        this.apiKey = localStorage.getItem('odds_api_key') || localStorage.getItem('oddsApiKey');
    }

    getApiKey() {
        // For Vercel deployment, API key is handled server-side
        return 'proxy';
    }

    setApiKey(key) {
        // Not needed for Vercel deployment
        console.log('API key is handled server-side in Vercel');
    }

    hasApiKey() {
        // Always return true for Vercel deployment since proxy handles it
        return true;
    }

    // New method to get the correct API endpoint
    getApiEndpoint(endpoint, params = {}) {
        // Use Vercel serverless function
        const baseUrl = window.location.origin;
        const queryParams = new URLSearchParams({
            endpoint,
            ...params
        });
        return `${baseUrl}/api/odds?${queryParams}`;
    }
}

// Create global config instance
window.appConfig = new Config();
