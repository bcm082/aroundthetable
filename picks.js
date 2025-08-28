// Picks management for CSV-based data
class PicksManager {
    constructor() {
        this.picks = [];
        this.filteredPicks = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPicks();
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshPicksBtn');
        const weekFilter = document.getElementById('weekPickSelect');
        const playerFilter = document.getElementById('playerFilter');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPicks());
        }

        if (weekFilter) {
            weekFilter.addEventListener('change', () => this.filterAndDisplayPicks());
        }

        if (playerFilter) {
            playerFilter.addEventListener('change', () => this.filterAndDisplayPicks());
        }
    }

    async loadPicks() {
        try {
            const response = await fetch('./picks.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            this.picks = this.parseCSV(csvText);
            
            this.populateWeekFilter();
            this.filterAndDisplayPicks();
            this.updateSummary();
            
        } catch (error) {
            console.error('Error loading picks:', error);
            this.showError('Failed to load picks from CSV file. Make sure picks.csv exists.');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const picks = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 3) {
                picks.push({
                    week: parseInt(values[0]) || 1,
                    name: values[1],
                    team: values[2]
                });
            }
        }
        
        return picks;
    }

    populateWeekFilter() {
        const weekFilter = document.getElementById('weekPickSelect');
        if (!weekFilter) return;

        // Get unique weeks
        const weeks = [...new Set(this.picks.map(pick => pick.week))].sort((a, b) => a - b);
        
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

    filterAndDisplayPicks() {
        const weekFilter = document.getElementById('weekPickSelect');
        const playerFilter = document.getElementById('playerFilter');
        
        const selectedWeek = weekFilter ? weekFilter.value : 'all';
        const selectedPlayer = playerFilter ? playerFilter.value : 'all';
        
        this.filteredPicks = this.picks.filter(pick => {
            const weekMatch = selectedWeek === 'all' || pick.week === parseInt(selectedWeek);
            const playerMatch = selectedPlayer === 'all' || pick.name === selectedPlayer;
            return weekMatch && playerMatch;
        });
        
        this.displayPicks();
    }

    displayPicks() {
        const container = document.getElementById('picksContainer');
        if (!container) return;

        if (this.filteredPicks.length === 0) {
            container.innerHTML = `
                <div class="no-picks">
                    <i class="fas fa-clipboard" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No picks found</h3>
                    <p>No picks match the current filters or the CSV file is empty.</p>
                </div>
            `;
            return;
        }

        // Group picks by week
        const picksByWeek = {};
        this.filteredPicks.forEach(pick => {
            if (!picksByWeek[pick.week]) {
                picksByWeek[pick.week] = [];
            }
            picksByWeek[pick.week].push(pick);
        });

        // Sort weeks
        const sortedWeeks = Object.keys(picksByWeek).sort((a, b) => parseInt(a) - parseInt(b));

        container.innerHTML = '';

        sortedWeeks.forEach(week => {
            const weekSection = document.createElement('div');
            weekSection.className = 'week-section';
            
            const weekHeader = document.createElement('div');
            weekHeader.className = 'week-header';
            weekHeader.innerHTML = `<i class="fas fa-calendar-week"></i> Week ${week}`;
            
            const weekPicks = document.createElement('div');
            weekPicks.className = 'week-picks';
            
            // Sort picks by player name
            picksByWeek[week].sort((a, b) => a.name.localeCompare(b.name));
            
            picksByWeek[week].forEach(pick => {
                const pickCard = document.createElement('div');
                pickCard.className = 'pick-card';
                
                pickCard.innerHTML = `
                    <div class="pick-player">${pick.name}</div>
                    <div class="pick-team">${pick.team}</div>
                    <div class="pick-meta">Week ${pick.week}</div>
                `;
                
                weekPicks.appendChild(pickCard);
            });
            
            weekSection.appendChild(weekHeader);
            weekSection.appendChild(weekPicks);
            container.appendChild(weekSection);
        });
    }

    updateSummary() {
        const summary = document.getElementById('picksSummary');
        if (!summary) return;

        const totalPicks = this.picks.length;
        const weeks = [...new Set(this.picks.map(pick => pick.week))].length;
        const players = [...new Set(this.picks.map(pick => pick.name))].length;

        summary.textContent = `${totalPicks} total picks • ${weeks} weeks • ${players} players`;
    }

    showError(message) {
        const container = document.getElementById('picksContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
                <h3>Error Loading Picks</h3>
                <p>${message}</p>
                <button onclick="picksManager.loadPicks()" class="btn btn-primary">
                    <i class="fas fa-retry"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Initialize picks manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('picksContainer')) {
        window.picksManager = new PicksManager();
    }
});

// Additional CSS for picks display
const picksStyle = document.createElement('style');
picksStyle.textContent = `
    .no-picks,
    .error-message {
        text-align: center;
        padding: 3rem;
        color: var(--gray-600);
    }
    
    .no-picks h3,
    .error-message h3 {
        color: var(--gray-700);
        margin-bottom: 0.5rem;
    }
    
    .error-message {
        background: var(--gray-50);
        border-radius: var(--border-radius);
        border: 2px solid var(--danger-color);
    }
`;
document.head.appendChild(picksStyle);
