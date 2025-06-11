import readline from 'readline/promises';

// Game Configuration
const GAME_CONFIG = {
  BOARD_SIZE: 10,
  NUM_SHIPS: 3,
  SHIP_LENGTH: 3,
  SYMBOLS: {
    WATER: '~',
    SHIP: 'S',
    HIT: 'X',
    MISS: 'O'
  }
};

// Ship class to represent individual ships
class Ship {
  constructor() {
    this.locations = [];
    this.hits = [];
  }

  addLocation(row, col) {
    const locationStr = `${row}${col}`;
    this.locations.push(locationStr);
    this.hits.push('');
  }

  hit(location) {
    const index = this.locations.indexOf(location);
    if (index >= 0 && this.hits[index] !== 'hit') {
      this.hits[index] = 'hit';
      return true;
    }
    return false;
  }

  isSunk() {
    return this.hits.every(hit => hit === 'hit');
  }

  hasLocation(location) {
    return this.locations.includes(location);
  }
}

// Board class to manage game boards
class Board {
  constructor(showShips = false) {
    this.size = GAME_CONFIG.BOARD_SIZE;
    this.showShips = showShips;
    this.grid = this.createGrid();
    this.ships = [];
  }

  createGrid() {
    return Array(this.size).fill().map(() => 
      Array(this.size).fill(GAME_CONFIG.SYMBOLS.WATER)
    );
  }

  placeShipsRandomly(numShips) {
    let placedShips = 0;
    
    while (placedShips < numShips) {
      const ship = this.generateRandomShip();
      if (ship) {
        this.ships.push(ship);
        if (this.showShips) {
          this.markShipOnGrid(ship);
        }
        placedShips++;
      }
    }
    
    console.log(`${numShips} ships placed randomly for ${this.showShips ? 'Player' : 'CPU'}.`);
  }

  generateRandomShip() {
    const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
    let startRow, startCol;

    if (orientation === 'horizontal') {
      startRow = Math.floor(Math.random() * this.size);
      startCol = Math.floor(Math.random() * (this.size - GAME_CONFIG.SHIP_LENGTH + 1));
    } else {
      startRow = Math.floor(Math.random() * (this.size - GAME_CONFIG.SHIP_LENGTH + 1));
      startCol = Math.floor(Math.random() * this.size);
    }

    // Check for collisions
    if (!this.canPlaceShip(startRow, startCol, orientation)) {
      return null;
    }

    // Create ship
    const ship = new Ship();
    for (let i = 0; i < GAME_CONFIG.SHIP_LENGTH; i++) {
      const row = orientation === 'horizontal' ? startRow : startRow + i;
      const col = orientation === 'horizontal' ? startCol + i : startCol;
      ship.addLocation(row, col);
    }

    return ship;
  }

  canPlaceShip(startRow, startCol, orientation) {
    for (let i = 0; i < GAME_CONFIG.SHIP_LENGTH; i++) {
      const row = orientation === 'horizontal' ? startRow : startRow + i;
      const col = orientation === 'horizontal' ? startCol + i : startCol;
      
      if (row >= this.size || col >= this.size || 
          this.grid[row][col] !== GAME_CONFIG.SYMBOLS.WATER) {
        return false;
      }
    }
    return true;
  }

  markShipOnGrid(ship) {
    ship.locations.forEach(location => {
      const row = parseInt(location[0]);
      const col = parseInt(location[1]);
      this.grid[row][col] = GAME_CONFIG.SYMBOLS.SHIP;
    });
  }

  processGuess(guess) {
    const row = parseInt(guess[0]);
    const col = parseInt(guess[1]);
    
    for (const ship of this.ships) {
      if (ship.hit(guess)) {
        this.grid[row][col] = GAME_CONFIG.SYMBOLS.HIT;
        return { hit: true, sunk: ship.isSunk() };
      }
    }
    
    this.grid[row][col] = GAME_CONFIG.SYMBOLS.MISS;
    return { hit: false, sunk: false };
  }

  getActivShipsCount() {
    return this.ships.filter(ship => !ship.isSunk()).length;
  }

  display() {
    let header = '  ';
    for (let h = 0; h < this.size; h++) {
      header += h + ' ';
    }
    
    const rows = [];
    for (let i = 0; i < this.size; i++) {
      let rowStr = i + ' ';
      for (let j = 0; j < this.size; j++) {
        rowStr += this.grid[i][j] + ' ';
      }
      rows.push(rowStr);
    }
    
    return { header, rows };
  }
}

// Player classes
class Player {
  constructor(name) {
    this.name = name;
    this.guesses = [];
  }

  hasGuessed(guess) {
    return this.guesses.includes(guess);
  }

  addGuess(guess) {
    this.guesses.push(guess);
  }
}

class HumanPlayer extends Player {
  constructor() {
    super('Player');
  }

  validateGuess(guess) {
    if (!guess || guess.length !== 2) {
      return { valid: false, message: 'Input must be exactly two digits (e.g., 00, 34, 98).' };
    }

    const row = parseInt(guess[0]);
    const col = parseInt(guess[1]);

    if (isNaN(row) || isNaN(col) || 
        row < 0 || row >= GAME_CONFIG.BOARD_SIZE || 
        col < 0 || col >= GAME_CONFIG.BOARD_SIZE) {
      return { 
        valid: false, 
        message: `Please enter valid coordinates between 0 and ${GAME_CONFIG.BOARD_SIZE - 1}.` 
      };
    }

    if (this.hasGuessed(guess)) {
      return { valid: false, message: 'You already guessed that location!' };
    }

    return { valid: true };
  }
}

class CPUPlayer extends Player {
  constructor() {
    super('CPU');
    this.mode = 'hunt'; // 'hunt' or 'target'
    this.targetQueue = [];
  }

  generateGuess() {
    let guess;
    
    if (this.mode === 'target' && this.targetQueue.length > 0) {
      guess = this.targetQueue.shift();
      console.log(`CPU targets: ${guess}`);
      
      if (this.hasGuessed(guess)) {
        if (this.targetQueue.length === 0) {
          this.mode = 'hunt';
        }
        return this.generateGuess(); // Recursive call for new guess
      }
    } else {
      this.mode = 'hunt';
      do {
        const row = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
        const col = Math.floor(Math.random() * GAME_CONFIG.BOARD_SIZE);
        guess = `${row}${col}`;
      } while (this.hasGuessed(guess));
    }
    
    return guess;
  }

  onHit(guess, sunk) {
    if (sunk) {
      this.mode = 'hunt';
      this.targetQueue = [];
    } else {
      this.mode = 'target';
      this.addAdjacentTargets(guess);
    }
  }

  onMiss() {
    if (this.mode === 'target' && this.targetQueue.length === 0) {
      this.mode = 'hunt';
    }
  }

  addAdjacentTargets(guess) {
    const row = parseInt(guess[0]);
    const col = parseInt(guess[1]);
    
    const adjacent = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 }
    ];

    adjacent.forEach(({ r, c }) => {
      if (this.isValidCoordinate(r, c)) {
        const adjGuess = `${r}${c}`;
        if (!this.hasGuessed(adjGuess) && !this.targetQueue.includes(adjGuess)) {
          this.targetQueue.push(adjGuess);
        }
      }
    });
  }

  isValidCoordinate(row, col) {
    return row >= 0 && row < GAME_CONFIG.BOARD_SIZE && 
           col >= 0 && col < GAME_CONFIG.BOARD_SIZE;
  }
}

// Main Game class
class SeaBattleGame {
  constructor() {
    this.playerBoard = new Board(true);  // Show ships on player board
    this.cpuBoard = new Board(false);    // Hide ships on CPU board
    this.humanPlayer = new HumanPlayer();
    this.cpuPlayer = new CPUPlayer();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    console.log('Boards created.');
    
    // Place ships for both players
    this.playerBoard.placeShipsRandomly(GAME_CONFIG.NUM_SHIPS);
    this.cpuBoard.placeShipsRandomly(GAME_CONFIG.NUM_SHIPS);
    
    console.log("\nLet's play Sea Battle!");
    console.log(`Try to sink the ${GAME_CONFIG.NUM_SHIPS} enemy ships.`);
  }

  displayBoards() {
    console.log('\n   --- OPPONENT BOARD ---          --- YOUR BOARD ---');
    
    const cpuDisplay = this.cpuBoard.display();
    const playerDisplay = this.playerBoard.display();
    
    console.log(cpuDisplay.header + '     ' + playerDisplay.header);
    
    for (let i = 0; i < GAME_CONFIG.BOARD_SIZE; i++) {
      console.log(cpuDisplay.rows[i] + '    ' + playerDisplay.rows[i]);
    }
    
    console.log('\n');
  }

  async processPlayerTurn() {
    const answer = await this.rl.question('Enter your guess (e.g., 00): ');
    const validation = this.humanPlayer.validateGuess(answer);
    
    if (!validation.valid) {
      console.log(`Oops, ${validation.message}`);
      return false;
    }
    
    this.humanPlayer.addGuess(answer);
    const result = this.cpuBoard.processGuess(answer);
    
    if (result.hit) {
      console.log('PLAYER HIT!');
      if (result.sunk) {
        console.log('You sunk an enemy battleship!');
      }
    } else {
      console.log('PLAYER MISS.');
    }
    
    return true;
  }

  processCPUTurn() {
    console.log("\n--- CPU's Turn ---");
    
    const guess = this.cpuPlayer.generateGuess();
    this.cpuPlayer.addGuess(guess);
    
    const result = this.playerBoard.processGuess(guess);
    
    if (result.hit) {
      console.log(`CPU HIT at ${guess}!`);
      if (result.sunk) {
        console.log('CPU sunk your battleship!');
      }
      this.cpuPlayer.onHit(guess, result.sunk);
    } else {
      console.log(`CPU MISS at ${guess}.`);
      this.cpuPlayer.onMiss();
    }
  }

  checkGameOver() {
    const playerShipsLeft = this.playerBoard.getActivShipsCount();
    const cpuShipsLeft = this.cpuBoard.getActivShipsCount();
    
    if (cpuShipsLeft === 0) {
      console.log('\n*** CONGRATULATIONS! You sunk all enemy battleships! ***');
      this.displayBoards();
      return true;
    }
    
    if (playerShipsLeft === 0) {
      console.log('\n*** GAME OVER! The CPU sunk all your battleships! ***');
      this.displayBoards();
      return true;
    }
    
    return false;
  }

  async gameLoop() {
    while (true) {
      if (this.checkGameOver()) {
        break;
      }
      
      this.displayBoards();
      
      // Player turn
      const playerMadeValidGuess = await this.processPlayerTurn();
      if (!playerMadeValidGuess) {
        continue; // Invalid guess, try again
      }
      
      if (this.checkGameOver()) {
        break;
      }
      
      // CPU turn
      this.processCPUTurn();
      
      if (this.checkGameOver()) {
        break;
      }
    }
    
    this.rl.close();
  }

  async start() {
    try {
      await this.initialize();
      await this.gameLoop();
    } catch (error) {
      console.error('Game error:', error);
      this.rl.close();
    }
  }
}

// Export classes for testing
export { Ship, Board, Player, HumanPlayer, CPUPlayer, SeaBattleGame, GAME_CONFIG };

// Start the game when run directly
if (process.argv[1] && process.argv[1].includes('seabattle')) {
  const game = new SeaBattleGame();
  game.start();
}
