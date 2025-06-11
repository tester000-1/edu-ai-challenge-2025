// seabattle.test.js - Comprehensive Unit Tests for Sea Battle Game
// Testing Framework: Jest
// Target Coverage: 60%+ across core modules

import { Ship, Board, Player, HumanPlayer, CPUPlayer, SeaBattleGame, GAME_CONFIG } from './seabattle.js';

describe('GAME_CONFIG', () => {
  test('should have correct default configuration values', () => {
    expect(GAME_CONFIG.BOARD_SIZE).toBe(10);
    expect(GAME_CONFIG.NUM_SHIPS).toBe(3);
    expect(GAME_CONFIG.SHIP_LENGTH).toBe(3);
    expect(GAME_CONFIG.SYMBOLS.WATER).toBe('~');
    expect(GAME_CONFIG.SYMBOLS.SHIP).toBe('S');
    expect(GAME_CONFIG.SYMBOLS.HIT).toBe('X');
    expect(GAME_CONFIG.SYMBOLS.MISS).toBe('O');
  });
});

describe('Ship', () => {
  let ship;

  beforeEach(() => {
    ship = new Ship();
  });

  test('should create empty ship with no locations or hits', () => {
    expect(ship.locations).toEqual([]);
    expect(ship.hits).toEqual([]);
  });

  test('should add location correctly', () => {
    ship.addLocation(2, 3);
    expect(ship.locations).toContain('23');
    expect(ship.hits).toHaveLength(1);
    expect(ship.hits[0]).toBe('');
  });

  test('should add multiple locations correctly', () => {
    ship.addLocation(1, 1);
    ship.addLocation(1, 2);
    ship.addLocation(1, 3);
    
    expect(ship.locations).toEqual(['11', '12', '13']);
    expect(ship.hits).toHaveLength(3);
  });

  test('should register hit correctly', () => {
    ship.addLocation(5, 5);
    const hitResult = ship.hit('55');
    
    expect(hitResult).toBe(true);
    expect(ship.hits[0]).toBe('hit');
  });

  test('should not register hit on invalid location', () => {
    ship.addLocation(5, 5);
    const hitResult = ship.hit('44');
    
    expect(hitResult).toBe(false);
    expect(ship.hits[0]).toBe('');
  });

  test('should not register hit twice on same location', () => {
    ship.addLocation(5, 5);
    ship.hit('55');
    const secondHit = ship.hit('55');
    
    expect(secondHit).toBe(false);
  });

  test('should not be sunk initially', () => {
    ship.addLocation(1, 1);
    ship.addLocation(1, 2);
    expect(ship.isSunk()).toBe(false);
  });

  test('should be sunk when all locations hit', () => {
    ship.addLocation(1, 1);
    ship.addLocation(1, 2);
    ship.hit('11');
    ship.hit('12');
    
    expect(ship.isSunk()).toBe(true);
  });

  test('should not be sunk when partially hit', () => {
    ship.addLocation(1, 1);
    ship.addLocation(1, 2);
    ship.addLocation(1, 3);
    ship.hit('11');
    ship.hit('12');
    
    expect(ship.isSunk()).toBe(false);
  });

  test('should correctly identify if it has a location', () => {
    ship.addLocation(7, 8);
    expect(ship.hasLocation('78')).toBe(true);
    expect(ship.hasLocation('79')).toBe(false);
  });
});

describe('Board', () => {
  let board;

  beforeEach(() => {
    board = new Board(false);
  });

  test('should create board with correct dimensions', () => {
    expect(board.size).toBe(GAME_CONFIG.BOARD_SIZE);
    expect(board.grid).toHaveLength(GAME_CONFIG.BOARD_SIZE);
    expect(board.grid[0]).toHaveLength(GAME_CONFIG.BOARD_SIZE);
  });

  test('should initialize grid with water symbols', () => {
    board.grid.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBe(GAME_CONFIG.SYMBOLS.WATER);
      });
    });
  });

  test('should create grid correctly', () => {
    const newGrid = board.createGrid();
    expect(newGrid).toHaveLength(GAME_CONFIG.BOARD_SIZE);
    expect(newGrid[0]).toHaveLength(GAME_CONFIG.BOARD_SIZE);
    expect(newGrid[0][0]).toBe(GAME_CONFIG.SYMBOLS.WATER);
  });

  test('should check ship placement correctly - horizontal valid', () => {
    const canPlace = board.canPlaceShip(5, 2, 'horizontal');
    expect(canPlace).toBe(true);
  });

  test('should check ship placement correctly - vertical valid', () => {
    const canPlace = board.canPlaceShip(2, 5, 'vertical');
    expect(canPlace).toBe(true);
  });

  test('should reject ship placement out of bounds - horizontal', () => {
    const canPlace = board.canPlaceShip(0, 8, 'horizontal'); // Would go to column 10
    expect(canPlace).toBe(false);
  });

  test('should reject ship placement out of bounds - vertical', () => {
    const canPlace = board.canPlaceShip(8, 0, 'vertical'); // Would go to row 10
    expect(canPlace).toBe(false);
  });

  test('should generate random ship within bounds', () => {
    const ship = board.generateRandomShip();
    if (ship) {
      expect(ship.locations).toHaveLength(GAME_CONFIG.SHIP_LENGTH);
      ship.locations.forEach(location => {
        const row = parseInt(location[0]);
        const col = parseInt(location[1]);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(GAME_CONFIG.BOARD_SIZE);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThan(GAME_CONFIG.BOARD_SIZE);
      });
    }
  });

  test('should mark ship on grid when showShips is true', () => {
    const visibleBoard = new Board(true);
    const ship = new Ship();
    ship.addLocation(0, 0);
    ship.addLocation(0, 1);
    
    visibleBoard.markShipOnGrid(ship);
    expect(visibleBoard.grid[0][0]).toBe(GAME_CONFIG.SYMBOLS.SHIP);
    expect(visibleBoard.grid[0][1]).toBe(GAME_CONFIG.SYMBOLS.SHIP);
  });

  test('should process miss correctly', () => {
    const result = board.processGuess('55');
    expect(result.hit).toBe(false);
    expect(result.sunk).toBe(false);
    expect(board.grid[5][5]).toBe(GAME_CONFIG.SYMBOLS.MISS);
  });

  test('should process hit correctly', () => {
    const ship = new Ship();
    ship.addLocation(3, 4);
    board.ships.push(ship);
    
    const result = board.processGuess('34');
    expect(result.hit).toBe(true);
    expect(result.sunk).toBe(true); // Single location ship
    expect(board.grid[3][4]).toBe(GAME_CONFIG.SYMBOLS.HIT);
  });

  test('should count active ships correctly', () => {
    const ship1 = new Ship();
    ship1.addLocation(1, 1);
    const ship2 = new Ship();
    ship2.addLocation(2, 2);
    
    board.ships.push(ship1, ship2);
    expect(board.getActivShipsCount()).toBe(2);
    
    ship1.hit('11'); // Sink ship1
    expect(board.getActivShipsCount()).toBe(1);
  });

  test('should display board correctly', () => {
    const display = board.display();
    expect(display).toHaveProperty('header');
    expect(display).toHaveProperty('rows');
    expect(display.rows).toHaveLength(GAME_CONFIG.BOARD_SIZE);
  });

  test('should place ships randomly without overlapping', () => {
    board.placeShipsRandomly(2);
    expect(board.ships).toHaveLength(2);
    
    // Check no overlapping locations
    const allLocations = board.ships.flatMap(ship => ship.locations);
    const uniqueLocations = [...new Set(allLocations)];
    expect(allLocations).toHaveLength(uniqueLocations.length);
  });
});

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player('TestPlayer');
  });

  test('should initialize with name and empty guesses', () => {
    expect(player.name).toBe('TestPlayer');
    expect(player.guesses).toEqual([]);
  });

  test('should track guesses correctly', () => {
    expect(player.hasGuessed('12')).toBe(false);
    player.addGuess('12');
    expect(player.hasGuessed('12')).toBe(true);
    expect(player.guesses).toContain('12');
  });

  test('should handle multiple guesses', () => {
    player.addGuess('00');
    player.addGuess('99');
    player.addGuess('45');
    
    expect(player.guesses).toHaveLength(3);
    expect(player.hasGuessed('00')).toBe(true);
    expect(player.hasGuessed('99')).toBe(true);
    expect(player.hasGuessed('45')).toBe(true);
    expect(player.hasGuessed('11')).toBe(false);
  });
});

describe('HumanPlayer', () => {
  let humanPlayer;

  beforeEach(() => {
    humanPlayer = new HumanPlayer();
  });

  test('should extend Player class', () => {
    expect(humanPlayer).toBeInstanceOf(Player);
    expect(humanPlayer.name).toBe('Player');
  });

  test('should validate correct guess format', () => {
    const validation = humanPlayer.validateGuess('34');
    expect(validation.valid).toBe(true);
  });

  test('should reject invalid guess - wrong length', () => {
    const validation = humanPlayer.validateGuess('123');
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('exactly two digits');
  });

  test('should reject invalid guess - null input', () => {
    const validation = humanPlayer.validateGuess(null);
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('exactly two digits');
  });

  test('should reject invalid guess - out of bounds coordinates', () => {
    const validationHigh = humanPlayer.validateGuess('9A');
    expect(validationHigh.valid).toBe(false);
    expect(validationHigh.message).toContain('valid coordinates');
  });

  test('should reject duplicate guess', () => {
    humanPlayer.addGuess('55');
    const validation = humanPlayer.validateGuess('55');
    expect(validation.valid).toBe(false);
    expect(validation.message).toContain('already guessed');
  });

  test('should accept valid coordinates at boundaries', () => {
    const validation00 = humanPlayer.validateGuess('00');
    const validation99 = humanPlayer.validateGuess('99');
    expect(validation00.valid).toBe(true);
    expect(validation99.valid).toBe(true);
  });
});

describe('CPUPlayer', () => {
  let cpuPlayer;

  beforeEach(() => {
    cpuPlayer = new CPUPlayer();
  });

  test('should extend Player class', () => {
    expect(cpuPlayer).toBeInstanceOf(Player);
    expect(cpuPlayer.name).toBe('CPU');
  });

  test('should initialize in hunt mode', () => {
    expect(cpuPlayer.mode).toBe('hunt');
    expect(cpuPlayer.targetQueue).toEqual([]);
  });

  test('should generate valid guess coordinates', () => {
    const guess = cpuPlayer.generateGuess();
    expect(guess).toHaveLength(2);
    
    const row = parseInt(guess[0]);
    const col = parseInt(guess[1]);
    expect(row).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(GAME_CONFIG.BOARD_SIZE);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThan(GAME_CONFIG.BOARD_SIZE);
  });

  test('should not generate duplicate guesses', () => {
    const guess1 = cpuPlayer.generateGuess();
    cpuPlayer.addGuess(guess1);
    const guess2 = cpuPlayer.generateGuess();
    
    expect(guess1).not.toBe(guess2);
  });

  test('should validate coordinates correctly', () => {
    expect(cpuPlayer.isValidCoordinate(0, 0)).toBe(true);
    expect(cpuPlayer.isValidCoordinate(9, 9)).toBe(true);
    expect(cpuPlayer.isValidCoordinate(-1, 5)).toBe(false);
    expect(cpuPlayer.isValidCoordinate(5, 10)).toBe(false);
    expect(cpuPlayer.isValidCoordinate(10, 5)).toBe(false);
  });

  test('should switch to target mode on hit', () => {
    cpuPlayer.onHit('55', false);
    expect(cpuPlayer.mode).toBe('target');
    expect(cpuPlayer.targetQueue.length).toBeGreaterThan(0);
  });

  test('should return to hunt mode when ship sunk', () => {
    cpuPlayer.mode = 'target';
    cpuPlayer.targetQueue = ['44', '66'];
    cpuPlayer.onHit('55', true);
    
    expect(cpuPlayer.mode).toBe('hunt');
    expect(cpuPlayer.targetQueue).toEqual([]);
  });

  test('should add adjacent targets correctly', () => {
    cpuPlayer.addAdjacentTargets('55');
    const expectedTargets = ['45', '65', '54', '56'];
    
    expectedTargets.forEach(target => {
      expect(cpuPlayer.targetQueue).toContain(target);
    });
  });

  test('should not add invalid adjacent targets', () => {
    cpuPlayer.addAdjacentTargets('00'); // Top-left corner
    
    // Should only add valid adjacent positions
    expect(cpuPlayer.targetQueue).toContain('10'); // Down
    expect(cpuPlayer.targetQueue).toContain('01'); // Right
    expect(cpuPlayer.targetQueue).not.toContain('-10'); // Invalid up
    expect(cpuPlayer.targetQueue).not.toContain('0-1'); // Invalid left
  });

  test('should not add duplicate targets to queue', () => {
    cpuPlayer.targetQueue = ['45'];
    cpuPlayer.addAdjacentTargets('55');
    
    const count45 = cpuPlayer.targetQueue.filter(target => target === '45').length;
    expect(count45).toBe(1);
  });

  test('should handle miss correctly in target mode', () => {
    cpuPlayer.mode = 'target';
    cpuPlayer.targetQueue = [];
    cpuPlayer.onMiss();
    
    expect(cpuPlayer.mode).toBe('hunt');
  });
});

describe('SeaBattleGame Integration', () => {
  let game;

  beforeEach(() => {
    game = new SeaBattleGame();
  });

  test('should initialize with correct board setup', () => {
    expect(game.playerBoard).toBeInstanceOf(Board);
    expect(game.cpuBoard).toBeInstanceOf(Board);
    expect(game.humanPlayer).toBeInstanceOf(HumanPlayer);
    expect(game.cpuPlayer).toBeInstanceOf(CPUPlayer);
  });

  test('should check game over correctly - player wins', () => {
    // Mock CPU board with no active ships
    game.cpuBoard.getActivShipsCount = () => 0;
    game.playerBoard.getActivShipsCount = () => 2;
    
    const gameOver = game.checkGameOver();
    expect(gameOver).toBe(true);
  });

  test('should check game over correctly - CPU wins', () => {
    // Mock player board with no active ships
    game.cpuBoard.getActivShipsCount = () => 2;
    game.playerBoard.getActivShipsCount = () => 0;
    
    const gameOver = game.checkGameOver();
    expect(gameOver).toBe(true);
  });

  test('should check game over correctly - game continues', () => {
    // Mock both boards with active ships
    game.cpuBoard.getActivShipsCount = () => 2;
    game.playerBoard.getActivShipsCount = () => 1;
    
    const gameOver = game.checkGameOver();
    expect(gameOver).toBe(false);
  });

  test('should process CPU turn correctly', () => {
    // Mock CPU player to return specific guess
    const mockGuess = '34';
    let generateGuessCalled = false;
    let addGuessCalled = false;
    let addGuessCalledWith = null;
    let processGuessCalled = false;
    let processGuessCalledWith = null;
    let onHitCalled = false;
    let onHitCalledWith = null;
    
    game.cpuPlayer.generateGuess = () => {
      generateGuessCalled = true;
      return mockGuess;
    };
    game.cpuPlayer.addGuess = (guess) => {
      addGuessCalled = true;
      addGuessCalledWith = guess;
    };
    game.playerBoard.processGuess = (guess) => {
      processGuessCalled = true;
      processGuessCalledWith = guess;
      return { hit: true, sunk: false };
    };
    game.cpuPlayer.onHit = (guess, sunk) => {
      onHitCalled = true;
      onHitCalledWith = { guess, sunk };
    };
    
    game.processCPUTurn();
    
    expect(generateGuessCalled).toBe(true);
    expect(addGuessCalled).toBe(true);
    expect(addGuessCalledWith).toBe(mockGuess);
    expect(processGuessCalled).toBe(true);
    expect(processGuessCalledWith).toBe(mockGuess);
    expect(onHitCalled).toBe(true);
    expect(onHitCalledWith.guess).toBe(mockGuess);
    expect(onHitCalledWith.sunk).toBe(false);
  });
});

describe('Game Logic Edge Cases', () => {
  test('should handle ship placement with no valid positions', () => {
    const board = new Board(false);
    // Fill the board to make placement impossible
    for (let i = 0; i < board.size; i++) {
      for (let j = 0; j < board.size; j++) {
        board.grid[i][j] = 'X';
      }
    }
    
    const ship = board.generateRandomShip();
    expect(ship).toBeNull();
  });

  test('should handle multiple hits on same ship location gracefully', () => {
    const ship = new Ship();
    ship.addLocation(1, 1);
    
    expect(ship.hit('11')).toBe(true);
    expect(ship.hit('11')).toBe(false); // Second hit should return false
    expect(ship.isSunk()).toBe(true);
  });

  test('should handle CPU target queue edge cases', () => {
    const cpu = new CPUPlayer();
    cpu.mode = 'target';
    
    // Add many guesses but not all
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 10; j++) {
        cpu.addGuess(`${i}${j}`);
      }
    }
    
    // Should still be able to generate a guess from remaining positions
    expect(() => cpu.generateGuess()).not.toThrow();
  });
});

// Performance Tests
describe('Performance Tests', () => {
  test('should handle rapid ship placement', () => {
    const board = new Board(false);
    const startTime = Date.now();
    
    board.placeShipsRandomly(3);
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    expect(board.ships).toHaveLength(3);
  });

  test('should handle many CPU guesses efficiently', () => {
    const cpu = new CPUPlayer();
    const startTime = Date.now();
    
    // Generate 50 unique guesses
    const guesses = new Set();
    while (guesses.size < 50) {
      const guess = cpu.generateGuess();
      cpu.addGuess(guess);
      guesses.add(guess);
    }
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    expect(guesses.size).toBe(50);
  });
}); 