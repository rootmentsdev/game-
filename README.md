# Multiplayer Snake and Ladder Game 🐍🪜

A real-time multiplayer Snake and Ladder game built with React, Socket.IO, and Express. Play with friends online from anywhere in the world!

![Game Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=Snake+and+Ladder+Game)

## 🎮 Features

- **Real-time Multiplayer**: Play with 2-4 players simultaneously
- **Modern UI**: Beautiful, responsive design with gradient backgrounds
- **Room System**: Create or join games with unique room IDs
- **Turn Management**: Automatic turn switching with rolling dice
- **Game Rules**: Classic Snake and Ladder gameplay
- **Live Updates**: Real-time position updates for all players
- **Mobile Friendly**: Responsive design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download this project**
   ```bash
   git clone <your-repo-url>
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Game

1. **Start the Server** (Terminal 1)
   ```bash
   npm run server:dev
   ```
   The server will run on `http://localhost:3001`

2. **Start the Frontend** (Terminal 2)
   ```bash
   npm run dev
   ```
   The game will be available at `http://localhost:5173`

## 🎯 How to Play

### Setup
1. Open the game in your browser: `http://localhost:5173`
2. Enter your name
3. **Create a New Game** or **Join Existing Game** with a Game ID
4. Share the Game ID with friends to let them join
5. Wait for at least 2 players to automatically start the game

### Gameplay
1. Players take turns rolling the dice
2. Move your piece by the number shown on the dice
3. **Ladders** (🪜) - Climb up to a higher position
4. **Snakes** (🐍) - Slide down to a lower position
5. **Six Bonus** - Roll a 6 and get another turn
6. **Win** - First player to reach square 100 wins!

### Board Layout
- 100 squares numbered 1-100
- Start at position 1, goal is position 100
- Snakes and ladders are color-coded:
  - **Red**: Snake positions (take you down)
  - **Green**: Ladder positions (take you up)

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── SnakeLadderGame.jsx    # Main game component
│   │   └── SnakeLadderGame.css    # Game styles
│   ├── App.jsx                     # App component
│   ├── App.css                     # App styles
│   └── index.css                   # Global styles
├── package.json                    # Frontend dependencies
└── README.md
server/
├── server.js                       # Socket.IO server
└── package.json                    # Server dependencies
```

## 🔧 Technical Details

### Frontend
- **React 19** - Modern React with hooks
- **Socket.IO Client** - Real-time communication
- **Vite** - Fast development server
- **CSS3** - Modern styling with gradients and animations

### Backend
- **Express.js** - Web server
- **Socket.IO** - Real-time bidirectional communication
- **Node.js** - Server runtime

### Game Logic
- **Turn-based gameplay** with automatic switching
- **Room-based** multiplayer with unique IDs
- **Position tracking** for all players
- **Win condition** detection
- **Snake/Ladder** automatic position updates

## 🎨 Game Features

### Visual Elements
- **Animated dice** with random number display
- **Player tokens** with unique colors (red, teal, blue, green)
- **Real-time board** updates
- **Responsive design** for mobile and desktop

### Multiplayer Features
- **Real-time synchronization** across all players
- **Automatic game state** management
- **Player join/leave** notifications
- **Turn indicators** showing current player
- **Win announcements** with celebration

## 🚀 Deployment Options

### Local Development
- Run both server and client locally as described above

### Production Deployment
You can deploy this to services like:
- **Vercel** (Frontend)
- **Railway** or **Heroku** (Backend)
- **Netlify** (Frontend)

Make sure to update environment variables for production URLs.

## 🛠️ Customization

### Game Settings
You can modify these in the code:
- Number of players (currently 2-4)
- Board size (currently 100 squares)
- Snake and ladder positions
- Turn rules (current: continue on 6)
- Win condition (currently reaching 100)

### Styling
- Colors and gradients in `SnakeLadderGame.css`
- Responsive breakpoints
- Animation timings
- Font families and sizes

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to server"**
- Make sure the server is running on port 3001
- Check that no firewall is blocking the connection
- Verify Socket.IO dependency is installed

**"Players not joining game"**
- Double-check the Game ID spelling
- Ensure all players are on the same network/server
- Refresh the browser page

**"Game not starting"**
- Need at least 2 players to start
- Check browser console for errors
- Verify Socket.IO events are firing

### Development Tips
- Use browser developer tools to monitor Socket.IO events
- Check server console for connection logs
- Ensure both server and client are using compatible Socket.IO versions

## 📱 Mobile Support

The game is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Tablet devices

## 🤝 Contributing

Want to add features to the game? Here are some ideas:
- Sound effects on dice roll and movement
- Chat system for players
- Tournament mode
- Custom board themes
- Player statistics and history
- Spectator mode

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy playing Snake and Ladder! 🎮**

For questions or support, please open an issue in the repository.