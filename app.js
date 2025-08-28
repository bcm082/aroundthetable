// Around the Table - 2025 Season Application
class AroundTheTable {
    constructor() {
        this.players = [
            { name: 'Corey', wins: 0, losses: 0 },
            { name: 'Jerry', wins: 0, losses: 0 },
            { name: 'Larry', wins: 0, losses: 0 },
            { name: 'Ramiz', wins: 0, losses: 0 },
            { name: 'Bruno', wins: 0, losses: 0 }
        ];
        
        this.currentWeek = 1;
        this.picks = JSON.parse(localStorage.getItem('att_picks_2025') || '[]');
        this.gameResults = JSON.parse(localStorage.getItem('att_results_2025') || '[]');
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.calculateCurrentWeek();
    }

    setupEventListeners() {
        // Mobile navigation
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Payout toggle
        const showPayouts = document.getElementById('showPayouts');
        if (showPayouts) {
            showPayouts.addEventListener('change', (e) => {
                const payoutMatrix = document.getElementById('payoutMatrix');
                if (payoutMatrix) {
                    payoutMatrix.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
    }

    loadData() {
        // Load saved player data
        const savedPlayers = localStorage.getItem('att_players_2025');
        if (savedPlayers) {
            this.players = JSON.parse(savedPlayers);
        }

        // Load current week
        const savedWeek = localStorage.getItem('att_current_week_2025');
        if (savedWeek) {
            this.currentWeek = parseInt(savedWeek);
        }
    }

    saveData() {
        localStorage.setItem('att_players_2025', JSON.stringify(this.players));
        localStorage.setItem('att_current_week_2025', this.currentWeek.toString());
        localStorage.setItem('att_picks_2025', JSON.stringify(this.picks));
        localStorage.setItem('att_results_2025', JSON.stringify(this.gameResults));
    }

    calculateCurrentWeek() {
        // Calculate current week based on total games played
        const totalGames = this.players.reduce((sum, player) => sum + player.wins + player.losses, 0);
        this.currentWeek = Math.floor(totalGames / this.players.length) + 1;
        
        const currentWeekElement = document.getElementById('currentWeek');
        if (currentWeekElement) {
            currentWeekElement.textContent = this.currentWeek;
        }
    }

    // Preserve original calculation logic exactly as it was
    calculateNetBalance(player) {
        const totalPlayers = this.players.length;
        const winAmount = player.wins * 5 * (totalPlayers - 1);
        const lossAmount = player.losses * 5 * (totalPlayers - 1);
        return winAmount - lossAmount;
    }

    updateUI() {
        this.updateStatsGrid();
        this.updateStandingsTable();
        this.updatePayoutMatrix();
        this.updateChampionSection();
    }

    updateStatsGrid() {
        const totalPlayers = this.players.length;
        const totalWeeks = Math.max(...this.players.map(p => p.wins + p.losses));
        const totalMoney = this.players.reduce((sum, player) => 
            sum + Math.abs(this.calculateNetBalance(player)), 0
        );
        
        // Find current leader
        const sortedPlayers = [...this.players].sort((a, b) => 
            this.calculateNetBalance(b) - this.calculateNetBalance(a)
        );
        const leader = sortedPlayers[0];

        // Update stats
        document.getElementById('totalPlayers').textContent = totalPlayers;
        document.getElementById('totalWeeks').textContent = totalWeeks;
        document.getElementById('totalMoney').textContent = `$${totalMoney}`;
        document.getElementById('leader').textContent = 
            this.calculateNetBalance(leader) > 0 ? leader.name : '-';
    }

    updateStandingsTable() {
        const tbody = document.querySelector('#playerTable tbody');
        if (!tbody) return;

        // Sort players by net balance (descending)
        const sortedPlayers = [...this.players].sort((a, b) => 
            this.calculateNetBalance(b) - this.calculateNetBalance(a)
        );

        tbody.innerHTML = '';

        sortedPlayers.forEach((player, index) => {
            const row = tbody.insertRow();
            const totalGames = player.wins + player.losses;
            const winPercentage = totalGames > 0 ? (player.wins / totalGames * 100).toFixed(1) : '0.0';
            const netBalance = this.calculateNetBalance(player);

            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="player-name">${player.name}</td>
                <td class="wins">${player.wins}</td>
                <td class="losses">${player.losses}</td>
                <td>${winPercentage}%</td>
                <td class="balance ${netBalance >= 0 ? 'positive' : 'negative'}">
                    ${netBalance >= 0 ? '+' : ''}$${netBalance}
                </td>
            `;

            // Add special styling for leader
            if (index === 0 && netBalance > 0) {
                row.classList.add('leader-row');
            }
        });
    }

    updatePayoutMatrix() {
        const payoutMatrix = document.getElementById('payoutMatrix');
        if (!payoutMatrix) return;

        const table = document.createElement('table');
        table.className = 'payout-table';
        
        // Header row
        const headerRow = table.insertRow();
        headerRow.insertCell().innerHTML = '<strong>Player / Owes</strong>';
        this.players.forEach(player => {
            const cell = headerRow.insertCell();
            cell.innerHTML = `<strong>${player.name}</strong>`;
        });

        // Player rows - using exact same logic as original
        this.players.forEach(player => {
            const row = table.insertRow();
            const nameCell = row.insertCell();
            nameCell.innerHTML = `<strong>${player.name}</strong>`;

            this.players.forEach(otherPlayer => {
                const cell = row.insertCell();
                if (player !== otherPlayer) {
                    const playerNet = this.calculateNetBalance(player) / (this.players.length - 1);
                    const otherPlayerNet = this.calculateNetBalance(otherPlayer) / (this.players.length - 1);
                    const difference = otherPlayerNet - playerNet;
                    cell.textContent = difference > 0 ? `$${difference.toFixed(2)}` : '-';
                } else {
                    cell.textContent = '-';
                }
            });
        });

        payoutMatrix.innerHTML = '';
        payoutMatrix.appendChild(table);
    }

    updateChampionSection() {
        const championSection = document.getElementById('championSection');
        const championName = document.getElementById('championName');
        
        if (!championSection || !championName) return;

        // Check if season is complete (all players have played same number of games and it's week 18+)
        const gameCounts = this.players.map(p => p.wins + p.losses);
        const allSameGames = gameCounts.every(count => count === gameCounts[0]);
        const seasonComplete = allSameGames && gameCounts[0] >= 17; // NFL regular season

        if (seasonComplete) {
            const winner = [...this.players].sort((a, b) => 
                this.calculateNetBalance(b) - this.calculateNetBalance(a)
            )[0];
            
            if (this.calculateNetBalance(winner) > 0) {
                championName.textContent = `${winner.name} is the 2025 Around the Table World Champion!`;
                championSection.style.display = 'block';
            }
        } else {
            championSection.style.display = 'none';
        }
    }

    refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        // Simulate API call delay
        setTimeout(() => {
            this.updateUI();
            
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }, 1000);
    }

    // Method to update player stats (for manual entry or API updates)
    updatePlayerStats(playerName, wins, losses) {
        const player = this.players.find(p => p.name === playerName);
        if (player) {
            player.wins = wins;
            player.losses = losses;
            this.saveData();
            this.updateUI();
        }
    }

    // Method to add a pick for a player
    addPick(playerName, week, team, opponent, isUnderdog = true) {
        const pick = {
            player: playerName,
            week: week,
            team: team,
            opponent: opponent,
            isUnderdog: isUnderdog,
            result: null, // 'win', 'loss', or null
            timestamp: new Date().toISOString()
        };
        
        this.picks.push(pick);
        this.saveData();
    }

    // Method to update game result
    updateGameResult(week, team, won) {
        const pick = this.picks.find(p => p.week === week && p.team === team);
        if (pick) {
            pick.result = won ? 'win' : 'loss';
            
            // Update player stats
            const player = this.players.find(p => p.name === pick.player);
            if (player) {
                if (won) {
                    player.wins++;
                } else {
                    player.losses++;
                }
            }
            
            this.saveData();
            this.updateUI();
        }
    }

    // Get player's pick history
    getPlayerHistory(playerName) {
        return this.picks.filter(pick => pick.player === playerName);
    }

    // Get current week's picks
    getCurrentWeekPicks() {
        return this.picks.filter(pick => pick.week === this.currentWeek);
    }

    // Export data for backup
    exportData() {
        const data = {
            players: this.players,
            picks: this.picks,
            gameResults: this.gameResults,
            currentWeek: this.currentWeek,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `around-the-table-2025-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Import data from backup
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.players = data.players || this.players;
            this.picks = data.picks || [];
            this.gameResults = data.gameResults || [];
            this.currentWeek = data.currentWeek || 1;
            
            this.saveData();
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AroundTheTable();
});

// Add some CSS for positive/negative balance styling
const style = document.createElement('style');
style.textContent = `
    .balance.positive {
        color: var(--success-color);
        font-weight: bold;
    }
    
    .balance.negative {
        color: var(--danger-color);
        font-weight: bold;
    }
    
    .leader-row {
        background: linear-gradient(135deg, #ffd700, #ffed4e) !important;
        font-weight: bold;
    }
    
    .leader-row:hover {
        background: linear-gradient(135deg, #ffed4e, #ffd700) !important;
    }
    
    .payout-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .payout-table th,
    .payout-table td {
        padding: 0.75rem;
        text-align: center;
        border: 1px solid var(--gray-300);
    }
    
    .payout-table th {
        background: var(--primary-color);
        color: var(--white);
        font-weight: 600;
    }
    
    .payout-table td {
        background: var(--white);
    }
`;
document.head.appendChild(style);
