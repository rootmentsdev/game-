import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './SnakeLadderGame.css';

const SnakeLadderGame = () => {
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameState, setGameState] = useState({
    positions: {},
    diceValue: 0,
    gameStarted: false,
    gameEnded: false,
    winner: null
  });
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [gameId, setGameId] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [theme, setTheme] = useState('classic');
  const [notifications, setNotifications] = useState([]);

  // Load saved game state from localStorage
  const loadSavedGameState = () => {
    try {
      const savedGameId = localStorage.getItem('snake-ladder-gameId');
      const savedPlayerName = localStorage.getItem('snake-ladder-playerName');
      const savedGameState = localStorage.getItem('snake-ladder-gameState');
      const savedTheme = localStorage.getItem('snake-ladder-theme');
      
      if (savedGameId && savedPlayerName && savedGameState) {
        return {
          gameId: savedGameId,
          playerName: savedPlayerName,
          gameState: JSON.parse(savedGameState),
          theme: savedTheme || 'classic'
        };
      }
    } catch (error) {
      console.log('Error loading saved game state:', error);
    }
    return null;
  };

  // Save game state to localStorage
  const saveGameState = (gameId, playerName, gameState, theme) => {
    try {
      localStorage.setItem('snake-ladder-gameId', gameId);
      localStorage.setItem('snake-ladder-playerName', playerName);
      localStorage.setItem('snake-ladder-gameState', JSON.stringify(gameState));
      localStorage.setItem('snake-ladder-theme', theme);
    } catch (error) {
      console.log('Error saving game state:', error);
    }
  };

  // Clear saved game state
  const clearSavedGameState = () => {
    try {
      localStorage.removeItem('snake-ladder-gameId');
      localStorage.removeItem('snake-ladder-playerName');
      localStorage.removeItem('snake-ladder-gameState');
      localStorage.removeItem('snake-ladder-theme');
    } catch (error) {
      console.log('Error clearing saved game state:', error);
    }
  };

  // Leave game function
  const leaveGame = () => {
    if (socket && gameId) {
      // Emit leave game to server
      socket.emit('leaveGame', { gameId });
    }
    
    // Clear local state
    clearSavedGameState();
    setGameState({
      positions: {},
      diceValue: 0,
      gameStarted: false,
      gameEnded: false,
      winner: null,
      currentPlayer: 0
    });
    setPlayers([]);
    setCurrentPlayer(0);
    setGameId('');
    
    // Redirect to lobby
    window.location.reload();
  };

  // Traditional Snake and Ladder positions (100 squares)
  const snakes = {
    16: 5, 25: 7, 35: 14, 46: 27, 54: 34, 58: 40, 59: 21, 67: 47, 72: 52, 80: 61, 85: 65, 92: 71
  };

  const ladders = {
    8: 30, 18: 39, 23: 43, 28: 49, 36: 57, 42: 62, 53: 73, 64: 84, 76: 96, 87: 98, 90: 99
  };

  const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  // Check if it's the current player's turn
  const isMyTurn = () => {
    // Check by player index and socket ID
    const currentPlayerId = players[currentPlayer]?.id;
    if (!currentPlayerId || !socket?.id) return false;
    
    // If socket IDs match, it's definitely your turn
    if (currentPlayerId === socket.id) return true;
    
    // For reconnected players, check by player name in localStorage
    const savedPlayerName = localStorage.getItem('snake-ladder-playerName');
    if (savedPlayerName) {
      const currentPlayerData = players[currentPlayer];
      return currentPlayerData?.name === savedPlayerName;
    }
    
    return false;
  };

  // Add notification function
  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  useEffect(() => {
    // Check for saved game state on page load
    const savedState = loadSavedGameState();
    if (savedState) {
      setPlayerName(savedState.playerName);
      setGameId(savedState.gameId);
      setTheme(savedState.theme);
      
      // Update game state to match saved state
      setGameState(savedState.gameState);
      setPlayers(savedState.gameState.players || []);
      setCurrentPlayer(savedState.gameState.currentPlayer || 0);
    }

    // Initialize socket connection
    const socketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://game-5fs1.onrender.com';
    const newSocket = io(socketUrl, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // If we have a saved game state, try to rejoin the game
      if (savedState && savedState.gameId && savedState.playerName) {
        console.log('Attempting to rejoin game:', savedState.gameId);
        newSocket.emit('joinGame', { 
          playerName: savedState.playerName, 
          gameId: savedState.gameId 
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.log('Socket error:', error);
      addNotification(error.message || 'Connection error', 'error');
    });

    newSocket.on('gameCreated', ({ gameId, message }) => {
      console.log(message);
      setGameId(gameId);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
      setCurrentPlayer(state.currentPlayer || 0);
      
      // Always update players list from game state
      if (state.players) {
        setPlayers(state.players);
        console.log('Updated players from gameState:', state.players);
      }
      
      // Save game state to localStorage
      if (state.gameStarted && playerName) {
        saveGameState(gameId, playerName, state, theme);
      }
    });

    newSocket.on('playerJoined', (data) => {
      console.log(data.message);
      
      // Update players list when someone joins
      if (data.gameState) {
        setPlayers(data.gameState.players);
        setGameState(data.gameState);
        setCurrentPlayer(data.gameState.currentPlayer || 0);
        console.log('Updated complete game state from playerJoined:', data.gameState);
      } else if (data.players) {
        setPlayers(data.players);
        console.log('Updated players list:', data.players);
      }
      
      // Show notification
      addNotification(data.message, 'join');
    });

    newSocket.on('gameStarted', (players) => {
      setPlayers(players);
      setGameState(prev => ({ ...prev, gameStarted: true }));
      
      // Save game state when game starts
      if (playerName && gameId) {
        saveGameState(gameId, playerName, { ...gameState, gameStarted: true }, theme);
      }
      
      console.log('Game started with players:', players);
    });

    newSocket.on('diceRolled', (data) => {
      setGameState(prev => ({ ...prev, diceValue: data.diceValue }));
    });

    newSocket.on('playerMoved', (data) => {
      setGameState(prev => ({
        ...prev,
        positions: { ...prev.positions, [data.playerId]: data.newPosition }
      }));
    });

    newSocket.on('playerLeft', (data) => {
      console.log(data.message);
      
      // Update players list when someone leaves
      if (data.gameState) {
        setPlayers(data.gameState.players);
        setGameState(data.gameState);
        setCurrentPlayer(data.gameState.currentPlayer || 0);
        console.log('Updated complete game state from playerLeft:', data.gameState);
      } else if (data.players) {
        setPlayers(data.players);
        console.log('Updated players list after someone left:', data.players);
      }
      
      // Show notification
      addNotification(data.message, 'leave');
    });

    newSocket.on('gameWon', (winner) => {
      setGameState(prev => ({ ...prev, gameEnded: true, winner }));
      
      // Clear saved game state when game ends
      clearSavedGameState();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinGame = () => {
    if (socket && playerName.trim() && joinGameId.trim()) {
      socket.emit('joinGame', { playerName: playerName.trim(), gameId: joinGameId.trim() });
      setGameId(joinGameId.trim());
      
      // Save initial game state when joining
      saveGameState(joinGameId.trim(), playerName.trim(), gameState, theme);
    }
  };

  const rollDice = () => {
    if (socket && gameState.gameStarted && !gameState.gameEnded) {
      socket.emit('rollDice');
    }
  };

  const makeMove = () => {
    if (socket && gameState.gameStarted && !gameState.gameEnded && gameState.diceValue > 0) {
      socket.emit('makeMove');
    }
  };

  const createNewGame = () => {
    if (socket && playerName.trim()) {
      const newGameId = Math.random().toString(36).substring(2, 8);
      socket.emit('createGame', { playerName: playerName.trim(), gameId: newGameId });
      setGameId(newGameId);
      
      // Save initial game state when creating
      saveGameState(newGameId, playerName.trim(), gameState, theme);
    }
  };

  const renderBoard = () => {
    const cells = [];
    
    // Traditional Snake and Ladder board: 10x10 grid (100 squares)
    // Bottom-left starts with 1, alternating row directions
    for (let row = 9; row >= 0; row--) {
      const cellsInRow = [];
      const isOddRow = row % 2 === 1; // Bottom row (row 9) is odd
      
      for (let col = 0; col < 10; col++) {
        let cellNum;
        
        if (isOddRow) {
          // Odd row (9, 7, 5, 3, 1): right to left
          cellNum = (row + 1) * 10 - col;
        } else {
          // Even row (8, 6, 4, 2, 0): left to right  
          cellNum = row * 10 + col + 1;
        }
        
        const isSnake = snakes[cellNum];
        const isLadder = ladders[cellNum];
        const isWinSquare = cellNum === 100;
        
        // Calculate cell color based on position (traditional pattern)
        const cellColorClass = getCellColorClass(cellNum);
        
        cellsInRow.push(
          <div
            key={cellNum}
            className={`cell ${cellColorClass} ${isSnake ? 'snake' : ''} ${isLadder ? 'ladder' : ''} ${isWinSquare ? 'win-square' : ''}`}
          >
            <span className="cell-number">{cellNum}</span>
            {isSnake && <div className="snake-icon">🐍</div>}
            {isLadder && <div className="ladder-icon">🪜</div>}
            {isWinSquare && <div className="win-icon">🏠</div>}
            {players.map((player, index) => (
              gameState.positions[player.id] === cellNum && (
                <div
                  key={player.id}
                  className="player-token"
                  style={{ backgroundColor: playerColors[index] }}
                  title={player.name}
                >
                  {index + 1}
                </div>
              )
            ))}
          </div>
        );
      }
      
      cells.push(
        <div key={row} className="board-row">
          {cellsInRow}
        </div>
      );
    }
    
    return (
      <div className="traditional-game-board">
        <h3 className="board-title">Snakes and Ladders</h3>
        <div className="game-board">{cells}</div>
      </div>
    );
  };

  // Generate cell color classes for traditional board pattern
  const getCellColorClass = (cellNum) => {
    // Traditional 4-color alternating pattern
    const patterns = ['light-blue', 'yellow', 'orange', 'light-pink'];
    return patterns[(Math.floor((cellNum - 1) / 10) + (cellNum - 1) % 10) % 4];
  };

  const getSnakeLadderInfo = (position) => {
    if (snakes[position]) {
      return `Snake to ${snakes[position]}`;
    }
    if (ladders[position]) {
      return `Ladder to ${ladders[position]}`;
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className="game-container">
        <div className="connection-message">
          <h2>Connecting to game server...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Check if we have a saved game state
  const hasSavedGame = loadSavedGameState();
  
  if (!gameState.gameStarted && !hasSavedGame) {
    return (
      <div className={`game-container ${theme === 'modern' ? 'modern-theme' : 'classic-theme'}`}>
        <div className="lobby">
          <h1>Snakes and Ladders - Multiplayer</h1>
          
          {/* Theme Selection */}
          <div className="theme-selection">
            <h3>Choose Theme:</h3>
            <div className="theme-buttons">
              <button 
                onClick={() => setTheme('classic')}
                className={`theme-btn ${theme === 'classic' ? 'active' : ''}`}
              >
                🎯 Classics Themed
              </button>
              <button 
                onClick={() => setTheme('modern')}
                className={`theme-btn ${theme === 'modern' ? 'active' : ''}`}
              >
                🌟 Modern Style
              </button>
            </div>
          </div>

          <div className="join-section">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="player-name-input"
            />
            
            {/* Room Join Section */}
            <div className="room-join-section">
              <input
                type="text"
                placeholder="Enter Room ID to join"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                className="room-id-input"
              />
              <button 
                onClick={joinGame} 
                disabled={!playerName.trim() || !joinGameId.trim()}
                className="join-room-btn"
              >
                Join Room
              </button>
            </div>

            {/* Or Create New Game */}
            <div className="create-section">
              <div className="divider">Or Create New Game</div>
              <button 
                onClick={createNewGame} 
                disabled={!playerName.trim()}
                className="create-game-btn"
              >
                Create New Game
              </button>
            </div>
          </div>
          
          {gameId && (
            <div className="game-info">
              <p>Game ID: <strong>{gameId}</strong></p>
              <p>Share this ID with other players to join!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`game-container ${theme === 'modern' ? 'modern-theme' : 'classic-theme'}`}>
      <div className="game-header">
        <h1>Snakes and Ladders</h1>
        <div className="theme-toggle">
          <button 
            onClick={() => setTheme(theme === 'classic' ? 'modern' : 'classic')}
            className="theme-switch"
          >
            {theme === 'classic' ? '🌟 Modern' : '🎯 Classic'}
          </button>
        </div>
        <div className="game-id">Room: {gameId}</div>
        <button 
          onClick={leaveGame}
          className="leave-game-btn"
          title="Leave game and return to lobby"
        >
          Leave Game
        </button>
      </div>

      <div className="game-info-panel">
        <div className="players-info">
          <h3>Players</h3>
          {players.length === 0 ? (
            <div className="no-players">
              <p>Waiting for players...</p>
            </div>
          ) : (
            players.map((player, index) => (
            <div key={player.id} className={`player-info ${index === currentPlayer ? 'player-info--current' : ''}`}>
              <div 
                className="player-color"
                style={{ backgroundColor: playerColors[index] }}
              >{index + 1}</div>
              <span>{player.name}</span>
              <span className="player-position">Pos: {gameState.positions[player.id] || 1}</span>
              {index === currentPlayer && (
                <span className="current-player-indicator">🎯</span>
              )}
            </div>
          ))
          )}
        </div>

        <div className="dice-section">
          <div className="dice-display">
            <div className="dice">{gameState.diceValue}</div>
          </div>
          {gameState.diceValue === 0 ? (
            <button 
              onClick={rollDice}
              disabled={gameState.gameEnded || !isMyTurn()}
              className="roll-button"
            >
              {!isMyTurn() ? 'Waiting for your turn...' : 'Roll Dice'}
            </button>
          ) : (
            <button 
              onClick={makeMove}
              disabled={gameState.gameEnded || !isMyTurn()}
              className="move-button"
            >
              {!isMyTurn() ? 'Waiting for your turn...' : `Move ${gameState.diceValue} steps`}
            </button>
          )}
          <div className="turn-info">
            {gameState.gameEnded ? (
              <h2 className="winner">🎉 {gameState.winner?.name} Wins! 🎉</h2>
            ) : (
              <p>
                It's {players[currentPlayer]?.name || `Player ${currentPlayer + 1}`}'s turn
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type}`}
          >
            {notification.type === 'join' && '👋 '}
            {notification.type === 'leave' && '👋 '}
            {notification.type === 'error' && '⚠️ '}
            {notification.message}
          </div>
        ))}
      </div>

      <div className="board-container">
        {renderBoard()}
      </div>

      <div className="game-stats">
        <h3>Game Rules</h3>
        <ul>
          <li>🎲 Roll the dice to move</li>
          <li>🐍 Snakes take you down</li>
          <li>🪜 Ladders take you up</li>
          <li>🎯 Reach 100 to win!</li>
        </ul>
      </div>
    </div>
  );
};

export default SnakeLadderGame;
