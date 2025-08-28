// History Management System
class HistoryManager {
    constructor() {
        this.allPicks = [];
        this.filteredPicks = [];
        this.currentView = 'table'; // 'table' or 'cards'
        this.filters = {
            player: 'all',
            week: 'all',
            result: 'all'
        };
        
        this.init();
    }

    init() {
        this.loadPicksData();
        this.setupEventListeners();
        this.populateWeekFilter();
        this.updateStats();
        this.displayHistory();
        this.updatePlayerBreakdown();
    }

    setupEventListeners() {
        const playerFilter = document.getElementById('playerFilter');
        const weekFilter = document.getElementById('weekFilter');
        const resultFilter = document.getElementById('resultFilter');
        const tableViewBtn = document.getElementById('tableViewBtn');
        const cardViewBtn = document.getElementById('cardViewBtn');
        const exportBtn = document.getElementById('exportHistoryBtn');

        if (playerFilter) {
            playerFilter.addEventListener('change', (e) => {
                this.filters.player = e.target.value;
                this.applyFilters();
            });
        }

        if (weekFilter) {
            weekFilter.addEventListener('change', (e) => {
                this.filters.week = e.target.value;
                this.applyFilters();
            });
        }

        if (resultFilter) {
            resultFilter.addEventListener('change', (e) => {
                this.filters.result = e.target.value;
                this.applyFilters();
            });
        }

        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => this.switchView('table'));
        }

        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => this.switchView('cards'));
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportHistory());
        }
    }

    loadPicksData() {
        // Load picks from localStorage
        this.allPicks = JSON.parse(localStorage.getItem('att_picks_2025') || '[]');
        
        // Add some mock data if no picks exist for demonstration
        if (this.allPicks.length === 0) {
            this.allPicks = this.getMockHistoryData();
        }
        
        // Sort picks by week and timestamp
        this.allPicks.sort((a, b) => {
            if (a.week !== b.week) {
                return b.week - a.week; // Most recent week first
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        this.filteredPicks = [...this.allPicks];
    }

    getMockHistoryData() {
        return [
            {
                player: 'Bruno',
                week: 1,
                team: 'Chicago Bears',
                opponent: 'Green Bay Packers',
                spread: 3.5,
                moneyline: 150,
                gameTime: '2024-09-08T20:20:00.000Z',
                result: 'win',
                timestamp: '2024-09-06T15:30:00.000Z'
            },
            {
                player: 'Corey',
                week: 1,
                team: 'Jacksonville Jaguars',
                opponent: 'Buffalo Bills',
                spread: 7.5,
                moneyline: 280,
                gameTime: '2024-09-08T17:00:00.000Z',
                result: 'loss',
                timestamp: '2024-09-06T14:15:00.000Z'
            },
            {
                player: 'Jerry',
                week: 1,
                team: 'New York Giants',
                opponent: 'Dallas Cowboys',
                spread: 4.5,
                moneyline: 170,
                gameTime: '2024-09-08T16:25:00.000Z',
                result: 'loss',
                timestamp: '2024-09-06T16:45:00.000Z'
            },
            {
                player: 'Larry',
                week: 2,
                team: 'Carolina Panthers',
                opponent: 'New Orleans Saints',
                spread: 6.0,
                moneyline: 220,
                gameTime: '2024-09-15T13:00:00.000Z',
                result: 'pending',
                timestamp: '2024-09-13T10:30:00.000Z'
            },
            {
                player: 'Ramiz',
                week: 2,
                team: 'Denver Broncos',
                opponent: 'Pittsburgh Steelers',
                spread: 2.5,
                moneyline: 120,
                gameTime: '2024-09-15T16:05:00.000Z',
                result: 'pending',
                timestamp: '2024-09-13T11:15:00.000Z'
            }
        ];
    }

    populateWeekFilter() {
        const weekFilter = document.getElementById('weekFilter');
        if (!weekFilter) return;

        // Get unique weeks from picks
        const weeks = [...new Set(this.allPicks.map(pick => pick.week))].sort((a, b) => b - a);
        
        // Clear existing options except "All Weeks"
        const allWeeksOption = weekFilter.querySelector('option[value="all"]');
        weekFilter.innerHTML = '';
        weekFilter.appendChild(allWeeksOption);
        
        weeks.forEach(week => {
            const option = document.createElement('option');
            option.value = week;
            option.textContent = `Week ${week}`;
            weekFilter.appendChild(option);
        });
    }

    applyFilters() {
        this.filteredPicks = this.allPicks.filter(pick => {
            // Player filter
            if (this.filters.player !== 'all' && pick.player !== this.filters.player) {
                return false;
            }
            
            // Week filter
            if (this.filters.week !== 'all' && pick.week !== parseInt(this.filters.week)) {
                return false;
            }
            
            // Result filter
            if (this.filters.result !== 'all') {
                if (this.filters.result === 'pending' && pick.result !== null) {
                    return false;
                }
                if (this.filters.result !== 'pending' && pick.result !== this.filters.result) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.updateStats();
        this.displayHistory();
        this.updatePlayerBreakdown();
    }

    updateStats() {
        const totalPicks = this.filteredPicks.length;
        const wins = this.filteredPicks.filter(pick => pick.result === 'win').length;
        const losses = this.filteredPicks.filter(pick => pick.result === 'loss').length;
        const winRate = totalPicks > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;
        
        document.getElementById('totalPicks').textContent = totalPicks;
        document.getElementById('totalWins').textContent = wins;
        document.getElementById('totalLosses').textContent = losses;
        document.getElementById('winPercentage').textContent = `${winRate}%`;
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        const tableBtn = document.getElementById('tableViewBtn');
        const cardBtn = document.getElementById('cardViewBtn');
        
        if (tableBtn && cardBtn) {
            tableBtn.classList.toggle('active', view === 'table');
            cardBtn.classList.toggle('active', view === 'cards');
        }
        
        this.displayHistory();
    }

    displayHistory() {
        const container = document.getElementById('historyContainer');
        if (!container) return;
        
        if (this.filteredPicks.length === 0) {
            container.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No picks found</h3>
                    <p>Try adjusting your filters or make some picks to see history.</p>
                </div>
            `;
            return;
        }
        
        if (this.currentView === 'table') {
            this.displayTableView(container);
        } else {
            this.displayCardView(container);
        }
    }

    displayTableView(container) {
        const table = document.createElement('table');
        table.className = 'history-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Week</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Opponent</th>
                    <th>Spread</th>
                    <th>Game Time</th>
                    <th>Result</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        this.filteredPicks.forEach(pick => {
            const row = tbody.insertRow();
            const gameTime = new Date(pick.gameTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            
            const resultText = pick.result === null ? 'Pending' : 
                              pick.result === 'win' ? 'Win' : 'Loss';
            const resultClass = pick.result === null ? 'pending' : pick.result;
            
            row.innerHTML = `
                <td>Week ${pick.week}</td>
                <td><strong>${pick.player}</strong></td>
                <td><strong>${pick.team}</strong></td>
                <td>${pick.opponent}</td>
                <td>+${pick.spread}</td>
                <td>${gameTime}</td>
                <td><span class="result-badge ${resultClass}">${resultText}</span></td>
            `;
        });
        
        container.innerHTML = '';
        container.appendChild(table);
    }

    displayCardView(container) {
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'history-cards';
        
        this.filteredPicks.forEach(pick => {
            const card = this.createHistoryCard(pick);
            cardsContainer.appendChild(card);
        });
        
        container.innerHTML = '';
        container.appendChild(cardsContainer);
    }

    createHistoryCard(pick) {
        const card = document.createElement('div');
        const resultClass = pick.result === null ? 'pending' : pick.result;
        card.className = `history-card ${resultClass}`;
        
        const gameTime = new Date(pick.gameTime).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        const resultText = pick.result === null ? 'Pending' : 
                          pick.result === 'win' ? 'Win' : 'Loss';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-player">${pick.player}</div>
                <div class="card-week">Week ${pick.week}</div>
            </div>
            
            <div class="card-matchup">
                <span class="card-team">${pick.team}</span> vs ${pick.opponent}
            </div>
            
            <div class="card-details">
                <div class="card-spread">+${pick.spread}</div>
                <div class="card-game-time">
                    <i class="fas fa-clock"></i> ${gameTime}
                </div>
            </div>
            
            <div class="card-result ${resultClass}">
                ${resultText}
            </div>
        `;
        
        return card;
    }

    updatePlayerBreakdown() {
        const playerBreakdown = document.getElementById('playerBreakdown');
        const container = document.getElementById('playerBreakdownContainer');
        
        if (!container) return;
        
        // Show breakdown only if filtering by specific player or showing all
        if (this.filters.player !== 'all') {
            playerBreakdown.style.display = 'none';
            return;
        }
        
        playerBreakdown.style.display = 'block';
        
        const players = ['Corey', 'Jerry', 'Larry', 'Ramiz', 'Bruno'];
        container.innerHTML = '';
        
        players.forEach(player => {
            const playerPicks = this.filteredPicks.filter(pick => pick.player === player);
            const wins = playerPicks.filter(pick => pick.result === 'win').length;
            const losses = playerPicks.filter(pick => pick.result === 'loss').length;
            const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;
            
            const card = document.createElement('div');
            card.className = 'player-summary-card';
            
            card.innerHTML = `
                <div class="player-summary-name">${player}</div>
                <div class="player-summary-stats">
                    <div class="player-summary-stat">
                        <div class="value">${wins}</div>
                        <div class="label">Wins</div>
                    </div>
                    <div class="player-summary-stat">
                        <div class="value">${losses}</div>
                        <div class="label">Losses</div>
                    </div>
                </div>
                <div class="player-summary-winrate">${winRate}% Win Rate</div>
            `;
            
            container.appendChild(card);
        });
    }

    exportHistory() {
        const data = {
            picks: this.filteredPicks,
            filters: this.filters,
            exportDate: new Date().toISOString(),
            totalStats: {
                totalPicks: this.filteredPicks.length,
                wins: this.filteredPicks.filter(pick => pick.result === 'win').length,
                losses: this.filteredPicks.filter(pick => pick.result === 'loss').length,
                pending: this.filteredPicks.filter(pick => pick.result === null).length
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `around-the-table-history-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Show success message
        this.showSuccessMessage('History exported successfully!');
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: bold;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    // Method to refresh data (called when picks are updated)
    refreshData() {
        this.loadPicksData();
        this.populateWeekFilter();
        this.applyFilters();
    }

    // Method to update pick result (for automated result checking)
    updatePickResult(player, week, team, result) {
        const pick = this.allPicks.find(p => 
            p.player === player && p.week === week && p.team === team
        );
        
        if (pick) {
            pick.result = result;
            // Save back to localStorage
            localStorage.setItem('att_picks_2025', JSON.stringify(this.allPicks));
            this.refreshData();
            return true;
        }
        
        return false;
    }

    // Method to get player statistics
    getPlayerStats(player) {
        const playerPicks = this.allPicks.filter(pick => pick.player === player);
        const wins = playerPicks.filter(pick => pick.result === 'win').length;
        const losses = playerPicks.filter(pick => pick.result === 'loss').length;
        const pending = playerPicks.filter(pick => pick.result === null).length;
        const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
        
        return {
            totalPicks: playerPicks.length,
            wins,
            losses,
            pending,
            winRate: parseFloat(winRate.toFixed(1))
        };
    }

    // Method to get week statistics
    getWeekStats(week) {
        const weekPicks = this.allPicks.filter(pick => pick.week === week);
        const wins = weekPicks.filter(pick => pick.result === 'win').length;
        const losses = weekPicks.filter(pick => pick.result === 'loss').length;
        const pending = weekPicks.filter(pick => pick.result === null).length;
        
        return {
            totalPicks: weekPicks.length,
            wins,
            losses,
            pending,
            players: weekPicks.map(pick => pick.player)
        };
    }
}

// Initialize history app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('historyContainer')) {
        window.historyApp = new HistoryManager();
    }
});

// Add CSS animations
const historyStyle = document.createElement('style');
historyStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .history-table {
        overflow-x: auto;
        display: block;
        white-space: nowrap;
    }
    
    .history-table thead,
    .history-table tbody,
    .history-table tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
    
    .history-table tbody {
        display: block;
        max-height: 600px;
        overflow-y: auto;
    }
`;
document.head.appendChild(historyStyle);
