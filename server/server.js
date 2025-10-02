const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Store active games
const games = new Map();

// Traditional Snake and Ladder positions (100 squares)
const snakes = {
  16: 5, 25: 7, 35: 14, 46: 27, 54: 34, 58: 40, 59: 21, 67: 47, 72: 52, 80: 61, 85: 65, 92: 71
};

const ladders = {
  8: 30, 18: 39, 23: 43, 28: 49, 36: 57, 42: 62, 53: 73, 64: 84, 76: 96, 87: 98, 90: 99
};

class Game {
  constructor(gameId, creatorId, creatorName) {
    this.gameId = gameId;
    this.players = [{ id: creatorId, name: creatorName, isCreator: true }];
    this.currentPlayerIndex = 0;
    this.positions = { [creatorId]: 1 };
    this.diceValue = 0;
    this.gameStarted = false;
    this.gameEnded = false;
    this.winner = null;
    this.currentPlayer = creatorId;
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= 4) {
      throw new Error('Game is full');
    }
    
    // Allow joining started games if not full
    if (this.gameStarted && this.gameEnded) {
      throw new Error('Game has ended');
    }
    
    const existingPlayer = this.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return existingPlayer;
    }

    this.players.push({ id: playerId, name: playerName, isCreator: false });
    
    // If game is already started, add player at position 1
    if (this.gameStarted) {
      this.positions[playerId] = 1;
    } else {
      this.positions[playerId] = 1;
    }
    
    return { id: playerId, name: playerName, isCreator: false };
  }

  startGame() {
    if (this.players.length < 1) {
      throw new Error('Need at least 1 player to start');
    }
    
    this.gameStarted = true;
    return this.getGameState();
  }

  rollDice() {
    if (!this.gameStarted || this.gameEnded) {
      throw new Error('Game not in progress');
    }
    
    this.diceValue = Math.floor(Math.random() * 6) + 1;
    return this.diceValue;
  }

  movePlayer(playerId, diceValue) {
    if (this.currentPlayer !== playerId) {
      throw new Error('Not your turn');
    }

    const currentPosition = this.positions[playerId];
    let newPosition = Math.min(currentPosition + diceValue, 100);

    // Check for snake or ladder
    if (snakes[newPosition]) {
      newPosition = snakes[newPosition];
      console.log(`Snake! Player ${playerId} moved from ${currentPosition + diceValue} to ${newPosition}`);
    } else if (ladders[newPosition]) {
      newPosition = ladders[newPosition];
      console.log(`Ladder! Player ${playerId} moved from ${currentPosition + diceValue} to ${newPosition}`);
    }

    this.positions[playerId] = newPosition;

    // Check for win condition
    if (newPosition === 100) {
      this.gameEnded = true;
      this.winner = this.players.find(p => p.id === playerId);
      return { newPosition, hasWon: true, winner: this.winner };
    }

    // Reset dice value to 0 for next roll
    this.diceValue = 0;
    
    // Move to next player only if diceValue was not 6 (if rolled 6, same player continues)
    if (diceValue !== 6) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      this.currentPlayer = this.players[this.currentPlayerIndex].id;
    }

    return { newPosition, hasWon: false };
  }

  getGameState() {
    return {
      gameId: this.gameId,
      players: this.players,
      currentPlayer: this.currentPlayerIndex,
      positions: this.positions,
      diceValue: this.diceValue,
      gameStarted: this.gameStarted,
      gameEnded: this.gameEnded,
      winner: this.winner
    };
  }

  hasPlayer(playerId) {
    return this.players.some(p => p.id === playerId);
  }
}

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('createGame', ({ playerName, gameId }) => {
    try {
      const game = new Game(gameId, socket.id, playerName);
      games.set(gameId, game);
      socket.join(gameId);
      
      // Auto-start single player game for testing
      const gameState = game.startGame();
      
      socket.emit('gameCreated', { gameId, message: 'Game created successfully!' });
      socket.emit('gameStarted', game.players);
      socket.emit('gameState', gameState);
      console.log(`Game ${gameId} created by ${playerName} (${socket.id})`);
    } catch (error) {
      socket.emit('gameError', error.message);
    }
  });

  socket.on('joinGame', ({ playerName, gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const player = game.addPlayer(socket.id, playerName);
      socket.join(gameId);
      
      // Broadcast to all players in the game
      io.to(gameId).emit('playerJoined', { 
        message: `${playerName} joined the game`,
        playerCount: game.players.length,
        players: game.players,
        gameState: game.getGameState()
      });
      
      // Send current game state to the joining player
      socket.emit('gameState', game.getGameState());
      
      // Broadcast updated game state to all players
      io.to(gameId).emit('gameState', game.getGameState());
      
      // If joining an already started game, emit gameStarted for the new player
      if (game.gameStarted) {
        socket.emit('gameStarted', game.players);
      }
      
      // Auto-start game if 2+ players (only if not already started)
      if (game.players.length >= 2 && !game.gameStarted) {
        const gameState = game.startGame();
        io.to(gameId).emit('gameStarted', game.players);
        io.to(gameId).emit('gameState', gameState);
      }
      
      console.log(`${playerName} (${socket.id}) joined game ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
      console.log(`Error joining game ${gameId}: ${error.message}`);
    }
  });

  socket.on('rollDice', () => {
    try {
      const gameId = Array.from(socket.rooms)[1]; // First room after socket's own room
      const game = games.get(gameId);
      
      if (!game || !game.hasPlayer(socket.id)) {
        socket.emit('error', { message: 'Not in a valid game' });
        return;
      }

      const diceValue = game.rollDice();
      
      socket.emit('diceRolled', { diceValue });
      io.to(gameId).emit('gameState', game.getGameState());
      
      console.log(`Player ${socket.id} rolled ${diceValue}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('makeMove', () => {
    try {
      const gameId = Array.from(socket.rooms)[1];
      const game = games.get(gameId);
      
      if (!game || !game.hasPlayer(socket.id)) {
        socket.emit('error', { message: 'Not in a valid game' });
        return;
      }

      const result = game.movePlayer(socket.id, game.diceValue);
      
      io.to(gameId).emit('playerMoved', {
        playerId: socket.id,
        newPosition: result.newPosition,
        diceValue: game.diceValue
      });

      io.to(gameId).emit('gameState', game.getGameState());

      if (result.hasWon) {
        io.to(gameId).emit('gameWon', result.winner);
        console.log(`Game ${gameId} won by ${result.winner.name}!`);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leaveGame', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (game && game.hasPlayer(socket.id)) {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const playerName = game.players[playerIndex].name;
          game.players.splice(playerIndex, 1);
          delete game.positions[socket.id];
          socket.leave(gameId);
          
          console.log(`${playerName} (${socket.id}) left game ${gameId}`);
          
          // Clean up game if no players left
          if (game.players.length === 0) {
            games.delete(gameId);
            console.log(`Game ${gameId} deleted - no players left`);
          } else {
            // Notify remaining players
            io.to(gameId).emit('playerLeft', { 
              message: `${playerName} left the game`,
              players: game.players,
              gameState: game.getGameState()
            });
            
            // Adjust current player index if needed
            if (game.currentPlayerIndex >= game.players.length) {
              game.currentPlayerIndex = 0;
              game.currentPlayer = game.players[0].id;
            } else if (game.currentPlayer === socket.id) {
              game.currentPlayerIndex = 0;
              game.currentPlayer = game.players[0].id;
            }
            
            io.to(gameId).emit('gameState', game.getGameState());
          }
        }
      }
    } catch (error) {
      console.log(`Error handling leave game: ${error.message}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Remove player from all games
    for (const [gameId, game] of games.entries()) {
      if (game.hasPlayer(socket.id)) {
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const playerName = game.players[playerIndex].name;
          game.players.splice(playerIndex, 1);
          delete game.positions[socket.id];
          
          // Clean up game if no players left
          if (game.players.length === 0) {
            games.delete(gameId);
            console.log(`Game ${gameId} deleted - no players left`);
          } else {
            // Notify remaining players
            io.to(gameId).emit('playerLeft', { 
              message: `${playerName} left the game`,
              players: game.players,
              gameState: game.getGameState()
            });
            
            // Adjust current player index if needed
            if (game.currentPlayerIndex >= game.players.length) {
              game.currentPlayerIndex = 0;
              game.currentPlayer = game.players[0].id;
            } else if (game.currentPlayer === socket.id) {
              game.currentPlayerIndex = 0;
              game.currentPlayer = game.players[0].id;
            }
            
            io.to(gameId).emit('gameState', game.getGameState());
          }
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});
