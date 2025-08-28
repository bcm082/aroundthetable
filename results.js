// Automated Game Result Checking and Balance Updates
// This module handles fetching completed game results and updating player records

class GameResultChecker {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        this.lastChecked = localStorage.getItem('lastResultCheck') || null;
        this.checkInterval = 30 * 60 * 1000; // 30 minutes
        this.autoCheckEnabled = localStorage.getItem('autoCheckEnabled') === 'true';
    }

    // Initialize automatic result checking
    async init() {
        await this.loadApiKey();
        this.setupUI();
        if (this.autoCheckEnabled && this.apiKey) {
            this.startAutoCheck();
        }
    }

    async loadApiKey() {
        // Wait for config to initialize
        await window.appConfig.init();
        this.apiKey = window.appConfig.getApiKey();
    }

    // Set up UI controls for result checking
    setupUI() {
        const container = document.getElementById('result-checker');
        if (!container) return;

        container.innerHTML = `
            <div class="result-checker-panel">
                <h3><i class="fas fa-sync-alt"></i> Automated Result Checking</h3>
                
                <div class="status-section">
                    <div class="status-item">
                        <label>Status:</label>
                        <span id="check-status" class="status-indicator">
                            ${this.autoCheckEnabled ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="status-item">
                        <label>Last Check:</label>
                        <span id="last-check">${this.formatLastCheck()}</span>
                    </div>
                </div>

                <div class="controls-section">
                    <button id="manual-check-btn" class="btn btn-primary">
                        <i class="fas fa-search"></i> Check Results Now
                    </button>
                    <button id="toggle-auto-btn" class="btn btn-secondary">
                        <i class="fas fa-${this.autoCheckEnabled ? 'pause' : 'play'}"></i>
                        ${this.autoCheckEnabled ? 'Disable' : 'Enable'} Auto Check
                    </button>
                </div>

                <div class="settings-section">
                    <label for="check-frequency">Check Frequency:</label>
                    <select id="check-frequency">
                        <option value="15">Every 15 minutes</option>
                        <option value="30" selected>Every 30 minutes</option>
                        <option value="60">Every hour</option>
                        <option value="120">Every 2 hours</option>
                    </select>
                </div>

                <div id="result-log" class="result-log"></div>
            </div>
        `;

        this.attachEventListeners();
    }

    // Attach event listeners to UI elements
    attachEventListeners() {
        const manualBtn = document.getElementById('manual-check-btn');
        const toggleBtn = document.getElementById('toggle-auto-btn');
        const frequencySelect = document.getElementById('check-frequency');

        if (manualBtn) {
            manualBtn.addEventListener('click', () => this.checkResultsManually());
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAutoCheck());
        }

        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => {
                this.checkInterval = parseInt(e.target.value) * 60 * 1000;
                if (this.autoCheckEnabled) {
                    this.restartAutoCheck();
                }
            });
        }
    }

    // Format last check time for display
    formatLastCheck() {
        if (!this.lastChecked) return 'Never';
        const date = new Date(this.lastChecked);
        return date.toLocaleString();
    }

    // Start automatic checking
    startAutoCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }

        this.checkTimer = setInterval(() => {
            this.checkCompletedGames();
        }, this.checkInterval);

        this.updateStatus('Active');
        this.log('Automatic result checking started');
    }

    // Stop automatic checking
    stopAutoCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }

        this.updateStatus('Inactive');
        this.log('Automatic result checking stopped');
    }

    // Restart automatic checking with new settings
    restartAutoCheck() {
        this.stopAutoCheck();
        this.startAutoCheck();
    }

    // Toggle automatic checking on/off
    toggleAutoCheck() {
        this.autoCheckEnabled = !this.autoCheckEnabled;
        localStorage.setItem('autoCheckEnabled', this.autoCheckEnabled.toString());

        const toggleBtn = document.getElementById('toggle-auto-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = `
                <i class="fas fa-${this.autoCheckEnabled ? 'pause' : 'play'}"></i>
                ${this.autoCheckEnabled ? 'Disable' : 'Enable'} Auto Check
            `;
        }

        if (this.autoCheckEnabled && this.apiKey) {
            this.startAutoCheck();
        } else {
            this.stopAutoCheck();
        }
    }

    // Manual result check triggered by user
    async checkResultsManually() {
        const btn = document.getElementById('manual-check-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        }

        try {
            await this.checkCompletedGames();
            this.log('Manual check completed successfully');
        } catch (error) {
            this.log(`Manual check failed: ${error.message}`, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-search"></i> Check Results Now';
            }
        }
    }

    // Main function to check completed games and update results
    async checkCompletedGames() {
        if (!this.apiKey) {
            this.log('API key not found. Please set up your API key first.', 'error');
            return;
        }

        try {
            // Get current week picks that need result checking
            const picks = this.getPendingPicks();
            if (picks.length === 0) {
                this.log('No pending picks found for result checking');
                return;
            }

            // Fetch completed game scores
            const completedGames = await this.fetchCompletedGames();
            
            // Process results for each pick
            let updatedCount = 0;
            for (const pick of picks) {
                const gameResult = this.findGameResult(pick, completedGames);
                if (gameResult) {
                    this.updatePickResult(pick, gameResult);
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                this.updatePlayerStandings();
                this.log(`Updated ${updatedCount} pick results`);
                
                // Trigger UI refresh on main page
                if (typeof window.updateStandings === 'function') {
                    window.updateStandings();
                }
            } else {
                this.log('No new results to update');
            }

            this.lastChecked = new Date().toISOString();
            localStorage.setItem('lastResultCheck', this.lastChecked);
            this.updateLastCheckDisplay();

        } catch (error) {
            console.error('Error checking game results:', error);
            this.log(`Error checking results: ${error.message}`, 'error');
        }
    }

    // Get picks that are pending result updates
    getPendingPicks() {
        const allPicks = JSON.parse(localStorage.getItem('playerPicks') || '[]');
        return allPicks.filter(pick => 
            pick.result === 'pending' && 
            new Date(pick.gameTime) < new Date()
        );
    }

    // Fetch completed game scores from API
    async fetchCompletedGames() {
        // Use Vercel serverless function proxy
        const url = window.appConfig.getApiEndpoint('scores', {
            daysFrom: 7
        });
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.filter(game => game.completed);
    }

    // Find the result for a specific pick
    findGameResult(pick, completedGames) {
        return completedGames.find(game => {
            const homeTeam = this.normalizeTeamName(game.home_team);
            const awayTeam = this.normalizeTeamName(game.away_team);
            const pickTeam = this.normalizeTeamName(pick.team);
            
            return (homeTeam === pickTeam || awayTeam === pickTeam) &&
                   new Date(game.commence_time).toDateString() === new Date(pick.gameTime).toDateString();
        });
    }

    // Normalize team names for comparison
    normalizeTeamName(teamName) {
        return teamName.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z]/g, '');
    }

    // Update a pick with its result
    updatePickResult(pick, gameResult) {
        const pickTeam = this.normalizeTeamName(pick.team);
        const homeTeam = this.normalizeTeamName(gameResult.home_team);
        const awayTeam = this.normalizeTeamName(gameResult.away_team);
        
        let pickWon = false;
        
        if (pickTeam === homeTeam) {
            pickWon = gameResult.scores.find(s => s.name === gameResult.home_team).score >
                     gameResult.scores.find(s => s.name === gameResult.away_team).score;
        } else if (pickTeam === awayTeam) {
            pickWon = gameResult.scores.find(s => s.name === gameResult.away_team).score >
                     gameResult.scores.find(s => s.name === gameResult.home_team).score;
        }

        // Update pick result
        pick.result = pickWon ? 'win' : 'loss';
        pick.finalScore = this.formatScore(gameResult);
        pick.updatedAt = new Date().toISOString();

        // Save updated picks
        const allPicks = JSON.parse(localStorage.getItem('playerPicks') || '[]');
        const pickIndex = allPicks.findIndex(p => 
            p.player === pick.player && 
            p.week === pick.week && 
            p.team === pick.team
        );
        
        if (pickIndex !== -1) {
            allPicks[pickIndex] = pick;
            localStorage.setItem('playerPicks', JSON.stringify(allPicks));
        }

        this.log(`${pick.player}'s pick (${pick.team}) result: ${pick.result.toUpperCase()}`);
    }

    // Format game score for display
    formatScore(gameResult) {
        const homeScore = gameResult.scores.find(s => s.name === gameResult.home_team).score;
        const awayScore = gameResult.scores.find(s => s.name === gameResult.away_team).score;
        return `${gameResult.away_team} ${awayScore} - ${gameResult.home_team} ${homeScore}`;
    }

    // Update player standings after result changes
    updatePlayerStandings() {
        const allPicks = JSON.parse(localStorage.getItem('playerPicks') || '[]');
        const players = ['Corey', 'Jerry', 'Larry', 'Ramiz', 'Bruno'];
        
        const standings = players.map(player => {
            const playerPicks = allPicks.filter(pick => pick.player === player);
            const wins = playerPicks.filter(pick => pick.result === 'win').length;
            const losses = playerPicks.filter(pick => pick.result === 'loss').length;
            
            // Use same calculation logic as original
            const winAmount = wins * 5 * (players.length - 1);
            const lossAmount = losses * 5 * (players.length - 1);
            const netBalance = winAmount - lossAmount;
            
            return {
                player,
                wins,
                losses,
                winAmount,
                lossAmount,
                netBalance
            };
        });

        localStorage.setItem('playerStandings', JSON.stringify(standings));
    }

    // Update status display
    updateStatus(status) {
        const statusElement = document.getElementById('check-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status-indicator ${status.toLowerCase()}`;
        }
    }

    // Update last check time display
    updateLastCheckDisplay() {
        const lastCheckElement = document.getElementById('last-check');
        if (lastCheckElement) {
            lastCheckElement.textContent = this.formatLastCheck();
        }
    }

    // Log messages to the result log
    log(message, type = 'info') {
        console.log(`[ResultChecker] ${message}`);
        
        const logElement = document.getElementById('result-log');
        if (logElement) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.innerHTML = `
                <span class="timestamp">${timestamp}</span>
                <span class="message">${message}</span>
            `;
            
            logElement.insertBefore(logEntry, logElement.firstChild);
            
            // Keep only last 20 log entries
            while (logElement.children.length > 20) {
                logElement.removeChild(logElement.lastChild);
            }
        }
    }
}

// Initialize result checker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('result-checker')) {
        window.gameResultChecker = new GameResultChecker();
        window.gameResultChecker.init();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameResultChecker;
}
