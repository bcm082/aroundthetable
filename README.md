# Around the Table - NFL Underdog Betting League

A modern web application for tracking NFL underdog betting among friends. Built for the 2025 season with enhanced features, live odds integration, and automated result tracking.

![Around the Table Screenshot](https://via.placeholder.com/800x400/1a472a/ffffff?text=Around+the+Table+2025)

## 🏈 Game Rules

- **5 Players**: Corey, Jerry, Larry, Ramiz, Bruno
- **Weekly Picks**: Each player picks one NFL underdog team per week
- **Underdog Only**: Must pick teams with positive spreads (not favorites)
- **$5 Per Pick**: Winner collects $5 from each other player, loser pays $5 to each
- **Season Payouts**: Final settlements based on net balances at season end

## ✨ Features

### 2025 Season Enhancements
- **Modern UI**: Responsive design with professional styling
- **Live NFL Odds**: Real-time game lines and spreads
- **Pick Tracking**: Historical data for all player selections
- **Automated Results**: Auto-update wins/losses after games
- **2024 Archive**: Complete data from previous season
- **Mobile Friendly**: Works perfectly on all devices

### Core Functionality
- **Real-time Standings**: Live leaderboard with win/loss tracking
- **Payout Calculator**: Exact same calculation logic as original
- **Pick History**: Filter and view all past selections
- **Data Export**: Backup and export functionality
- **Local Storage**: All data persisted locally

## 🚀 Quick Start

### 1. Clone or Download
```bash
git clone <repository-url>
cd aroundthetable
```

### 2. Open in Browser
Simply open `index.html` in your web browser. No build process required!

### 3. Optional: Live Odds Setup
For live NFL odds, get a free API key from [The Odds API](https://the-odds-api.com/):
1. Visit the odds page in the app
2. Click "Enter API Key" when prompted
3. Paste your API key and save

## 📁 File Structure

```
aroundthetable/
├── index.html          # Main dashboard (2025 season)
├── picks.html          # Make weekly picks
├── odds.html           # Live NFL odds
├── history.html        # Pick history and stats
├── 2024.html          # 2024 season archive
├── styles.css         # Main stylesheet
├── app.js             # Core application logic
├── picks.js           # Pick management
├── odds.js            # NFL odds integration
├── history.js         # History and filtering
└── README.md          # This file
```

## 🎯 How to Use

### Making Picks
1. Go to **Make Picks** page
2. Select your player name
3. Choose from available underdog teams
4. Confirm your selection

### Viewing Odds
1. Visit **NFL Odds** page
2. Filter by week or show underdogs only
3. See live spreads and moneylines
4. Use for making informed picks

### Tracking History
1. Check **Pick History** page
2. Filter by player, week, or result
3. View in table or card format
4. Export data for backup

### Season Standings
1. Main dashboard shows current standings
2. Toggle payout matrix visibility
3. See real-time win/loss records
4. Champion declared at season end

## ⚙️ Configuration

### NFL Odds API Setup
1. Sign up at [The Odds API](https://the-odds-api.com/)
2. Get your free API key (500 requests/month)
3. In the app, go to NFL Odds page
4. Click "Enter API Key" and save

### Data Management
- All data stored in browser's localStorage
- Use export functions for backups
- Import/export available in each section

### Customization
- Modify `styles.css` for appearance changes
- Update player names in JavaScript files
- Adjust calculation logic in `app.js` if needed

## 🔧 Technical Details

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **Icons**: Font Awesome 6
- **Storage**: Browser localStorage
- **API**: The Odds API for NFL data

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance
- Lightweight: No frameworks or build tools
- Fast loading: Optimized CSS and JavaScript
- Responsive: Works on all screen sizes
- Offline: Core functionality works without internet

## 📊 Calculation Logic

The payout calculation preserves the exact same logic as the original:

```javascript
// For each player:
winAmount = wins × $5 × (totalPlayers - 1)
lossAmount = losses × $5 × (totalPlayers - 1)
netBalance = winAmount - lossAmount

// Payout matrix shows who owes whom at season end
```

## 🚀 Deployment

### GitHub Pages (Current)
1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select source branch (usually `main`)
4. Site will be available at `https://username.github.io/repository-name`

### Alternative Hosting
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect GitHub repository
- **Any Web Server**: Upload files to public directory

## 🔄 Data Migration

### From 2024 Season
The 2024 data is already archived in `2024.html`. To add new historical data:

1. Export current season data
2. Update `2024.html` with final results
3. Clear current season for new year
4. Update year references in code

### Backup Strategy
- Regular exports from each page
- Store JSON files safely
- Consider cloud storage for team access

## 🐛 Troubleshooting

### Common Issues

**Odds not loading?**
- Check API key is entered correctly
- Verify internet connection
- Check browser console for errors

**Picks not saving?**
- Ensure localStorage is enabled
- Check browser storage limits
- Try clearing browser cache

**Mobile display issues?**
- Update to latest browser version
- Check viewport meta tag
- Verify CSS media queries

### Support
- Check browser console for error messages
- Verify all files are in same directory
- Ensure proper file permissions

## 🎮 Game Management

### Weekly Routine
1. Check NFL schedule for upcoming games
2. Review odds for underdog opportunities
3. Remind players to make picks before games
4. Update results after games complete
5. Check standings and payouts

### Season End Process
1. Verify all game results are recorded
2. Calculate final standings
3. Generate payout matrix
4. Settle all debts between players
5. Archive season data
6. Reset for next season

## 📈 Future Enhancements

### Potential Features
- Push notifications for pick reminders
- Integration with more sportsbooks
- Advanced statistics and analytics
- Mobile app version
- Multi-league support

### API Integrations
- ESPN for game results
- Multiple odds providers
- Team logos and colors
- Weather data for games

## 📄 License

This project is for personal use among friends. Feel free to adapt for your own betting leagues.

## 🏆 Credits

**Original Concept**: Bruno (2024 Champion!)
**2025 Enhancement**: Built with modern web technologies
**Design**: Inspired by professional sports betting apps

---

**Good luck with your picks! 🍀**

*Remember: Always bet responsibly and only with money you can afford to lose.*
