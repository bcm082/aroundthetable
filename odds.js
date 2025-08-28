// NFL Odds API Integration
class NFLOdds {
    constructor() {
        this.apiKey = null; // User needs to add their API key
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        this.sport = 'americanfootball_nfl';
        this.region = 'us';
        this.market = 'spreads,h2h'; // spreads and moneyline
        this.oddsFormat = 'american';
        this.dateFormat = 'iso';
        
        this.games = [];
        this.lastUpdated = null;
        this.currentWeek = 1; // Always start with Week 1 for 2025 season
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkApiKey();
        
        // Try to load cached data first
        this.loadCachedData();
        
        // Always try to fetch real data, show proper message if no API key
        this.fetchOdds();
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshOdds');
        const weekFilter = document.getElementById('weekFilter');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.fetchOdds());
        }
        
        if (weekFilter) {
            weekFilter.addEventListener('change', () => this.displayOdds());
        }
    }


    async checkApiKey() {
        // Wait for config to initialize
        await window.appConfig.init();
        this.apiKey = window.appConfig.getApiKey();
        
        console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
        
        if (!this.apiKey) {
            this.showApiKeyPrompt();
        }
    }

    showApiKeyPrompt() {
        const statusText = document.getElementById('statusText');
        const statusIcon = document.getElementById('statusIcon');
        
        if (statusText && statusIcon) {
            statusIcon.className = 'fas fa-circle error';
            statusText.innerHTML = `
                <strong>API Key Required:</strong> 
                <a href="https://the-odds-api.com/" target="_blank">Get your free API key</a> 
                or <button onclick="oddsApp.enterApiKey()" class="btn btn-sm btn-primary">Enter API Key</button>
            `;
        }
    }

    enterApiKey() {
        const apiKey = prompt('Enter your The Odds API key:');
        if (apiKey && apiKey.trim()) {
            this.apiKey = apiKey.trim();
            localStorage.setItem('odds_api_key', this.apiKey);
            this.updateStatus('loading', 'Connecting with API key...');
            this.fetchOdds();
        }
    }

    getCurrentNFLWeek() {
        // For 2025 season, always return Week 1 until season starts
        // This ensures we show Week 1 games even before the season begins
        const now = new Date();
        const seasonStart = new Date('2025-09-04'); // 2025 NFL season start (approximate)
        
        if (now < seasonStart) {
            return 1; // Always show Week 1 before season starts
        }
        
        const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }

    async fetchOdds() {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (errorElement) errorElement.style.display = 'none';

        if (!this.apiKey) {
            this.showNoApiKeyMessage();
            return;
        }

        try {
            // Use Vercel serverless function proxy
            const url = window.appConfig.getApiEndpoint('odds', {
                regions: this.region,
                markets: this.market,
                oddsFormat: this.oddsFormat,
                dateFormat: this.dateFormat
            });
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.games = this.processOddsData(data);
            this.lastUpdated = new Date();
            
            // Cache the data
            this.saveToCache();
            
            this.populateWeekFilter();
            this.updateStatus('connected', 'Connected to live odds');
            this.displayOdds();
            
        } catch (error) {
            console.error('Error fetching odds:', error);
            this.updateStatus('error', `Error: ${error.message}`);
            
            // Fall back to cached data or show error
            if (this.games.length === 0) {
                this.showNoApiKeyMessage();
            }
        }
    }

    processOddsData(apiData) {
        return apiData.map(game => {
            const homeTeam = game.home_team;
            const awayTeam = game.away_team;
            const gameTime = new Date(game.commence_time);
            
            // Get the best odds from available bookmakers
            const bestOdds = this.getBestOdds(game.bookmakers, homeTeam, awayTeam);
            
            return {
                id: game.id,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                gameTime: gameTime,
                week: this.getWeekFromDate(gameTime),
                spread: bestOdds.spread,
                moneyline: bestOdds.moneyline,
                isHomeUnderdog: bestOdds.spread.home > 0 || bestOdds.moneyline.home > 0,
                isAwayUnderdog: bestOdds.spread.away > 0 || bestOdds.moneyline.away > 0
            };
        });
    }

    getBestOdds(bookmakers, homeTeam, awayTeam) {
        // For simplicity, use the first bookmaker's odds
        // In a real app, you'd compare across bookmakers for best odds
        const bookmaker = bookmakers[0];
        
        let spread = { home: 0, away: 0 };
        let moneyline = { home: 0, away: 0 };
        
        if (bookmaker && bookmaker.markets) {
            const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
            const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
            
            if (spreadMarket && spreadMarket.outcomes) {
                const homeSpread = spreadMarket.outcomes.find(o => o.name === homeTeam);
                const awaySpread = spreadMarket.outcomes.find(o => o.name === awayTeam);
                
                if (homeSpread) spread.home = homeSpread.point || 0;
                if (awaySpread) spread.away = awaySpread.point || 0;
            }
            
            if (h2hMarket && h2hMarket.outcomes) {
                const homeML = h2hMarket.outcomes.find(o => o.name === homeTeam);
                const awayML = h2hMarket.outcomes.find(o => o.name === awayTeam);
                
                if (homeML) moneyline.home = homeML.price || 0;
                if (awayML) moneyline.away = awayML.price || 0;
            }
        }
        
        return { spread, moneyline };
    }

    getWeekFromDate(gameDate) {
        // Simple week calculation - in real app, use NFL schedule data
        const seasonStart = new Date('2025-09-04'); // 2025 NFL season start
        const weeksSinceStart = Math.floor((gameDate - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(1, Math.min(18, weeksSinceStart + 1));
    }

    showNoApiKeyMessage() {
        const container = document.getElementById('oddsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="no-games">
                <i class="fas fa-key" style="font-size: 3rem; color: var(--warning-color); margin-bottom: 1rem;"></i>
                <h3>API Key Required</h3>
                <p>To view live NFL odds and game lines, you need an API key from The Odds API.</p>
                <div style="margin-top: 1.5rem;">
                    <a href="https://the-odds-api.com/" target="_blank" class="btn btn-primary" style="margin-right: 1rem;">
                        <i class="fas fa-external-link-alt"></i> Get Free API Key
                    </a>
                    <button onclick="oddsApp.enterApiKey()" class="btn btn-secondary">
                        <i class="fas fa-key"></i> Enter API Key
                    </button>
                </div>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--gray-600);">
                    The Odds API provides free access to live NFL odds and game lines.
                </p>
            </div>
        `;
        
        this.updateStatus('error', 'API key required for live odds');
    }

    populateWeekFilter() {
        const weekFilter = document.getElementById('weekFilter');
        if (!weekFilter || this.games.length === 0) return;
        
        // Get unique weeks from games
        const weeks = [...new Set(this.games.map(game => game.week))].sort((a, b) => a - b);
        
        // Clear existing options except "All Weeks"
        weekFilter.innerHTML = '<option value="all">All Weeks</option>';
        
        // Add week options
        weeks.forEach(week => {
            const option = document.createElement('option');
            option.value = week;
            option.textContent = `Week ${week}`;
            weekFilter.appendChild(option);
        });
    }

    displayOdds() {
        const container = document.getElementById('oddsContainer');
        const weekFilter = document.getElementById('weekFilter');
        
        if (!container) return;
        
        if (this.games.length === 0) {
            container.innerHTML = `
                <div class="no-games">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No games available</h3>
                    <p>No NFL games found in the current data. Try refreshing the odds.</p>
                </div>
            `;
            return;
        }
        
        // Filter games by selected week
        const selectedWeek = weekFilter ? weekFilter.value : 'all';
        let filteredGames = this.games;
        
        if (selectedWeek !== 'all') {
            filteredGames = this.games.filter(game => game.week === parseInt(selectedWeek));
        }
        
        if (filteredGames.length === 0) {
            container.innerHTML = `
                <div class="no-games">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No games found for ${selectedWeek === 'all' ? 'any week' : `Week ${selectedWeek}`}</h3>
                    <p>Try selecting a different week or refresh the odds.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // Sort games by date
        const sortedGames = [...filteredGames].sort((a, b) => a.gameTime - b.gameTime);
        
        sortedGames.forEach(game => {
            const gameCard = this.createGameCard(game);
            container.appendChild(gameCard);
        });
        
        // Update page title to show filtered game count
        const sectionHeader = document.querySelector('.odds-section .section-header h2');
        if (sectionHeader) {
            const weekText = selectedWeek === 'all' ? 'All Weeks' : `Week ${selectedWeek}`;
            sectionHeader.innerHTML = `<i class="fas fa-football-ball"></i> Game Lines - ${weekText} (${filteredGames.length} games)`;
        }
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = `game-card ${game.isHomeUnderdog || game.isAwayUnderdog ? 'underdog-game' : ''}`;
        
        const gameTime = game.gameTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        card.innerHTML = `
            <div class="game-header">
                <div class="game-time">
                    <i class="fas fa-clock"></i> ${gameTime}
                </div>
                <div class="week-badge">Week ${game.week}</div>
            </div>
            
            <div class="game-matchup">
                <div class="team ${game.isAwayUnderdog ? 'underdog' : 'favorite'}">
                    <div class="team-name">${game.awayTeam}</div>
                    <div class="team-record">@ ${game.homeTeam}</div>
                </div>
                
                <div class="odds-display">
                    <div class="spread">
                        ${game.awayTeam}: ${game.spread.away > 0 ? '+' : ''}${game.spread.away}
                    </div>
                    <div class="spread">
                        ${game.homeTeam}: ${game.spread.home > 0 ? '+' : ''}${game.spread.home}
                    </div>
                    <div class="moneyline">
                        ML: ${game.moneyline.away > 0 ? '+' : ''}${game.moneyline.away} / ${game.moneyline.home > 0 ? '+' : ''}${game.moneyline.home}
                    </div>
                </div>
                
                <div class="team ${game.isHomeUnderdog ? 'underdog' : 'favorite'}">
                    <div class="team-name">${game.homeTeam}</div>
                    <div class="team-record">Home</div>
                </div>
            </div>
            
            ${game.isHomeUnderdog || game.isAwayUnderdog ? `
                <div class="underdog-notice">
                    <i class="fas fa-star"></i>
                    ${game.isHomeUnderdog ? game.homeTeam : game.awayTeam} is the underdog - eligible for Around the Table!
                </div>
            ` : ''}
        `;
        
        return card;
    }

    updateStatus(status, message) {
        const statusIcon = document.getElementById('statusIcon');
        const statusText = document.getElementById('statusText');
        const lastUpdated = document.getElementById('lastUpdated');
        
        if (statusIcon) {
            statusIcon.className = `fas fa-circle ${status}`;
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        if (status === 'connected' && lastUpdated) {
            lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    saveToCache() {
        const cacheData = {
            games: this.games,
            lastUpdated: this.lastUpdated,
            timestamp: Date.now()
        };
        localStorage.setItem('odds_cache', JSON.stringify(cacheData));
    }

    loadCachedData() {
        const cached = localStorage.getItem('odds_cache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                const cacheAge = Date.now() - data.timestamp;
                
                // Use cached data if less than 30 minutes old
                if (cacheAge < 30 * 60 * 1000) {
                    this.games = data.games;
                    this.lastUpdated = new Date(data.lastUpdated);
                    this.updateStatus('connected', 'Using cached odds data');
                    this.displayOdds();
                    return true;
                }
            } catch (error) {
                console.error('Error loading cached data:', error);
            }
        }
        return false;
    }

    // Method to get underdog teams for picks page
    getUnderdogTeams(week = null) {
        const targetWeek = week || this.currentWeek;
        return this.games
            .filter(game => game.week === targetWeek)
            .flatMap(game => {
                const underdogs = [];
                if (game.isHomeUnderdog) {
                    underdogs.push({
                        team: game.homeTeam,
                        opponent: game.awayTeam,
                        spread: game.spread.home,
                        moneyline: game.moneyline.home,
                        gameTime: game.gameTime
                    });
                }
                if (game.isAwayUnderdog) {
                    underdogs.push({
                        team: game.awayTeam,
                        opponent: game.homeTeam,
                        spread: game.spread.away,
                        moneyline: game.moneyline.away,
                        gameTime: game.gameTime
                    });
                }
                return underdogs;
            });
    }
}

// Initialize odds app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('oddsContainer')) {
        window.oddsApp = new NFLOdds();
    }
});

// Additional CSS for game cards
const oddsStyle = document.createElement('style');
oddsStyle.textContent = `
    .week-badge {
        background: var(--primary-color);
        color: var(--white);
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .underdog-notice {
        margin-top: 1rem;
        padding: 0.75rem;
        background: linear-gradient(135deg, var(--success-color), var(--accent-color));
        color: var(--white);
        border-radius: var(--border-radius);
        text-align: center;
        font-weight: bold;
    }
    
    .underdog-notice i {
        margin-right: 0.5rem;
        color: #ffd700;
    }
    
    .no-games {
        text-align: center;
        padding: 3rem;
        color: var(--gray-600);
    }
    
    .no-games h3 {
        color: var(--gray-700);
        margin-bottom: 0.5rem;
    }
    
    .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
    }
`;
document.head.appendChild(oddsStyle);
