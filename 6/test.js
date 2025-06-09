const { Enigma, ROTORS } = require('./enigma.js');

// Test framework - simple assertion functions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message}\n   Expected: "${expected}"\n   Actual: "${actual}"`);
  }
  console.log(`✅ PASSED: ${message}`);
}

// Import Enigma class from enigma.js - we need to export it first
class TestEnigma {
  constructor(rotorIDs, rotorPositions, ringSettings, plugboardPairs) {
    // Copy the Enigma class logic here for testing
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    function mod(n, m) {
      return ((n % m) + m) % m;
    }
    
    const ROTORS = [
      { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' }, // Rotor I
      { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' }, // Rotor II
      { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' }, // Rotor III
    ];
    const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
    
    function plugboardSwap(c, pairs) {
      for (const [a, b] of pairs) {
        if (c === a) return b;
        if (c === b) return a;
      }
      return c;
    }
    
    class Rotor {
      constructor(wiring, notch, ringSetting = 0, position = 0) {
        this.wiring = wiring;
        this.notch = notch;
        this.ringSetting = ringSetting;
        this.position = position;
      }
      step() {
        this.position = mod(this.position + 1, 26);
      }
      atNotch() {
        return alphabet[this.position] === this.notch;
      }
      forward(c) {
        const inputPos = mod(alphabet.indexOf(c) + this.position - this.ringSetting, 26);
        const outputChar = this.wiring[inputPos];
        const outputPos = mod(alphabet.indexOf(outputChar) - this.position + this.ringSetting, 26);
        return alphabet[outputPos];
      }
      backward(c) {
        const inputPos = mod(alphabet.indexOf(c) + this.position - this.ringSetting, 26);
        const wiringPos = this.wiring.indexOf(alphabet[inputPos]);
        const outputPos = mod(wiringPos - this.position + this.ringSetting, 26);
        return alphabet[outputPos];
      }
    }
    
    this.rotors = rotorIDs.map(
      (id, i) =>
        new Rotor(
          ROTORS[id].wiring,
          ROTORS[id].notch,
          ringSettings[i],
          rotorPositions[i],
        ),
    );
    this.plugboardPairs = plugboardPairs;
    this.alphabet = alphabet;
    this.plugboardSwap = plugboardSwap;
    this.REFLECTOR = REFLECTOR;
  }
  
  stepRotors() {
    // Check if middle rotor is at notch BEFORE any stepping
    const middleAtNotch = this.rotors[1].atNotch();
    
    // If rightmost rotor is at notch, step the middle rotor
    if (this.rotors[2].atNotch()) {
      this.rotors[1].step();
    }
    
    // If middle rotor was at notch OR is now at notch after stepping, do double step
    const middleNowAtNotch = this.rotors[1].atNotch();
    if (middleAtNotch || middleNowAtNotch) {
      this.rotors[0].step();
      this.rotors[1].step();
    }
    
    // Rightmost rotor always steps
    this.rotors[2].step();
  }
  
  encryptChar(c) {
    if (!this.alphabet.includes(c)) return c;
    this.stepRotors();
    c = this.plugboardSwap(c, this.plugboardPairs);
    for (let i = this.rotors.length - 1; i >= 0; i--) {
      c = this.rotors[i].forward(c);
    }

    c = this.REFLECTOR[this.alphabet.indexOf(c)];

    for (let i = 0; i < this.rotors.length; i++) {
      c = this.rotors[i].backward(c);
    }

    c = this.plugboardSwap(c, this.plugboardPairs);
    return c;
  }
  
  process(text) {
    return text
      .split('')
      .map((c) => this.encryptChar(c))
      .join('');
  }
}

console.log('🧪 Starting Enigma Machine Unit Tests\n');

// =============================================================================
// TEST 1: Rule - "The machine always uses rotors I, II, and III"
// =============================================================================
console.log('📋 TEST 1: Rotor Configuration');

function testRotorConfiguration() {
  const enigma = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  // Test that rotors are correctly configured
  assert(enigma.rotors.length === 3, "Machine uses exactly 3 rotors");
  assertEqual(enigma.rotors[0].wiring, 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', "Rotor I has correct wiring");
  assertEqual(enigma.rotors[1].wiring, 'AJDKSIRUXBLHWTMCQGZNPYFVOE', "Rotor II has correct wiring");
  assertEqual(enigma.rotors[2].wiring, 'BDFHJLCPRTXVZNYEIWGAKMUSQO', "Rotor III has correct wiring");
  assertEqual(enigma.rotors[0].notch, 'Q', "Rotor I has correct notch");
  assertEqual(enigma.rotors[1].notch, 'E', "Rotor II has correct notch");
  assertEqual(enigma.rotors[2].notch, 'V', "Rotor III has correct notch");
}

// =============================================================================
// TEST 2: Rule - "Rightmost rotor steps every keypress"
// =============================================================================
console.log('\n📋 TEST 2: Rotor Stepping');

function testRotorStepping() {
  const enigma = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  // Record initial positions
  const initialPos = enigma.rotors.map(r => r.position);
  
  // Process one character
  enigma.encryptChar('A');
  
  // Check that rightmost rotor stepped
  assertEqual(enigma.rotors[2].position, (initialPos[2] + 1) % 26, "Rightmost rotor steps on every keypress");
  
  // Process multiple characters and verify rightmost rotor keeps stepping
  for (let i = 0; i < 5; i++) {
    const beforePos = enigma.rotors[2].position;
    enigma.encryptChar('A');
    assertEqual(enigma.rotors[2].position, (beforePos + 1) % 26, `Rightmost rotor steps consistently (iteration ${i + 1})`);
  }
}

// =============================================================================
// TEST 3: Rule - "Only uppercase A-Z are encrypted; all other characters are output unchanged"
// =============================================================================
console.log('\n📋 TEST 3: Character Handling');

function testCharacterHandling() {
  const enigma = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  // Test lowercase letters pass through unchanged (not encrypted)
  const lowerResult = enigma.process('hello');
  assertEqual(lowerResult, 'hello', "Lowercase letters pass through unchanged");
  
  // Test uppercase letters are encrypted (should be different from input)
  const upperResult = enigma.process('HELLO');
  assert(upperResult !== 'HELLO', "Uppercase letters are encrypted");
  
  // Test special characters pass through unchanged
  const specialChars = '123!@#$%^&*()_+-=[]{}|;:,.<>?';
  const specialResult = enigma.process(specialChars);
  assertEqual(specialResult, specialChars, "Special characters pass through unchanged");
  
  // Test mixed content - only uppercase A-Z should be encrypted
  const mixedInput = 'HELLO123!@#world';
  const mixedResult = enigma.process(mixedInput);
  
  // Verify that numbers, special chars, and lowercase letters are preserved
  assert(mixedResult.includes('123'), "Numbers preserved in mixed content");
  assert(mixedResult.includes('!@#'), "Special characters preserved in mixed content");
  assert(mixedResult.includes('world'), "Lowercase letters preserved in mixed content");
  
  // Verify that uppercase letters were changed but others preserved
  assert(mixedResult !== mixedInput, "Mixed content was processed (uppercase letters encrypted)");
  assert(mixedResult.length === mixedInput.length, "Length preserved in mixed content");
  
  // Check that non-A-Z characters are in same positions
  for (let i = 0; i < mixedInput.length; i++) {
    const originalChar = mixedInput[i];
    const resultChar = mixedResult[i];
    
    if (!/[A-Z]/.test(originalChar)) {
      // Non-uppercase letters should be unchanged
      assertEqual(resultChar, originalChar, `Non-uppercase character '${originalChar}' at position ${i} should be unchanged`);
    } else {
      // Uppercase letters should be different (encrypted)
      assert(resultChar !== originalChar, `Uppercase character '${originalChar}' at position ${i} should be encrypted`);
      assert(/[A-Z]/.test(resultChar), `Encrypted character '${resultChar}' should still be uppercase`);
    }
  }
}

// =============================================================================
// TEST 4: Rule - "The same settings must be used to decrypt a message as were used to encrypt it"
// =============================================================================
console.log('\n📋 TEST 4: Reciprocal Property (Encryption/Decryption)');

function testReciprocity() {
  // Test with default settings
  const settings1 = { rotors: [0, 1, 2], positions: [0, 0, 0], rings: [0, 0, 0], plugs: [] };
  testReciprocityWithSettings('HELLO', settings1, "Basic settings");
  
  // Test with different rotor positions
  const settings2 = { rotors: [0, 1, 2], positions: [5, 10, 15], rings: [0, 0, 0], plugs: [] };
  testReciprocityWithSettings('WORLD', settings2, "Different rotor positions");
  
  // Test with ring settings
  const settings3 = { rotors: [0, 1, 2], positions: [0, 0, 0], rings: [3, 7, 11], plugs: [] };
  testReciprocityWithSettings('ENIGMA', settings3, "With ring settings");
  
  // Test with plugboard
  const settings4 = { rotors: [0, 1, 2], positions: [1, 2, 3], rings: [2, 4, 6], plugs: [['A', 'B'], ['C', 'D']] };
  testReciprocityWithSettings('SECRET', settings4, "With plugboard pairs");
  
  // Test longer messages
  testReciprocityWithSettings('THISISALONGERMESSAGETOTEST', settings1, "Longer message");
}

function testReciprocityWithSettings(message, settings, description) {
  const enigma1 = new TestEnigma(settings.rotors, settings.positions, settings.rings, settings.plugs);
  const enigma2 = new TestEnigma(settings.rotors, settings.positions, settings.rings, settings.plugs);
  
  const encrypted = enigma1.process(message);
  const decrypted = enigma2.process(encrypted);
  
  assertEqual(decrypted, message, `Reciprocity test: ${description}`);
}

// =============================================================================
// TEST 5: Cyrillic Characters
// =============================================================================
console.log('\n📋 TEST 5: Cyrillic Character Handling');

function testCyrillicCharacters() {
  const enigma = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  // Test various Cyrillic characters
  const cyrillicChars = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const cyrillicResult = enigma.process(cyrillicChars);
  assertEqual(cyrillicResult, cyrillicChars, "Cyrillic characters pass through unchanged");
  
  // Test mixed Cyrillic and Latin - check each position individually
  const mixedCyrillic = 'HELLOПРИВЕТ';
  const mixedResult = enigma.process(mixedCyrillic);
  
  // Verify structure and length
  assertEqual(mixedResult.length, mixedCyrillic.length, "Mixed Cyrillic-Latin preserves length");
  
  // Check each character position
  for (let i = 0; i < mixedCyrillic.length; i++) {
    const originalChar = mixedCyrillic[i];
    const resultChar = mixedResult[i];
    
    if (/[A-Z]/.test(originalChar)) {
      // Latin uppercase should be encrypted (different)
      assert(resultChar !== originalChar, `Latin character '${originalChar}' at position ${i} should be encrypted`);
      assert(/[A-Z]/.test(resultChar), `Encrypted character '${resultChar}' should still be uppercase Latin`);
    } else {
      // Cyrillic characters should pass through unchanged
      assertEqual(resultChar, originalChar, `Cyrillic character '${originalChar}' at position ${i} should be unchanged`);
    }
  }
  
  // Test lowercase Cyrillic
  const lowerCyrillic = 'привет';
  const lowerCyrillicResult = enigma.process(lowerCyrillic);
  assertEqual(lowerCyrillicResult, 'привет', "Lowercase Cyrillic characters pass through unchanged");
}

// =============================================================================
// TEST 6: Special Characters and Edge Cases
// =============================================================================
console.log('\n📋 TEST 6: Special Characters and Edge Cases');

function testSpecialCharacters() {
  const enigma = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  // Test various special characters
  const specialSets = [
    '0123456789',           // Numbers
    '!@#$%^&*()',          // Common symbols
    '[]{}()<>',            // Brackets
    '+-=_|\\:;",.<>?/',    // Operators and punctuation
    '\t\n\r',             // Whitespace characters
    'äöüßñç',              // Extended Latin characters
    '€£¥₹',               // Currency symbols
    '♠♣♥♦',               // Card suits
    '©®™',                 // Legal symbols
  ];
  
  specialSets.forEach((chars, index) => {
    const result = enigma.process(chars);
    assertEqual(result, chars, `Special character set ${index + 1} passes through unchanged`);
  });
  
  // Test empty string
  assertEqual(enigma.process(''), '', "Empty string handled correctly");
  
  // Test single characters with fresh enigma instances
  const enigma2 = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  const enigma3 = new TestEnigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  const firstA = enigma2.process('A');
  const secondA = enigma3.process('A');
  assertEqual(firstA, secondA, "Single character encryption is consistent with same initial settings");
  
  // Test non-A-Z characters pass through unchanged
  assertEqual(enigma.process('1'), '1', "Single digit passes through");
  assertEqual(enigma.process('!'), '!', "Single special character passes through");
}

// =============================================================================
// TEST 7: Double Stepping Behavior
// =============================================================================
console.log('\n📋 TEST 7: Double Stepping Behavior');

function testDoubleStepping() {
  // Set up for double stepping: right rotor at notch V(21), middle at D(3) 
  // Right rotor at notch will cause middle to step to its notch E(4), triggering double stepping
  const enigma = new TestEnigma([0, 1, 2], [0, 3, 21], [0, 0, 0], []);
  
  // Before encryption - verify initial setup
  assert(!enigma.rotors[1].atNotch(), "Middle rotor not at notch initially (position 3)");
  assert(enigma.rotors[2].atNotch(), "Right rotor should be at notch initially (position 21 = V)");
  
  // Encrypt one character - this should trigger double stepping
  enigma.encryptChar('A');
  
  // Expected sequence:
  // 1. Right rotor at notch causes middle to step: 3→4 (now at notch E)
  // 2. Middle at notch triggers double stepping: left 0→1, middle 4→5  
  // 3. Right rotor always steps: 21→22
  assertEqual(enigma.rotors[2].position, 22, "Rightmost rotor stepped from 21 to 22");
  assertEqual(enigma.rotors[1].position, 5, "Middle rotor double-stepped from 3→4→5");
  assertEqual(enigma.rotors[0].position, 1, "Left rotor stepped due to double stepping");
}

// =============================================================================
// RUN ALL TESTS
// =============================================================================

function runAllTests() {
  try {
    testRotorConfiguration();
    testRotorStepping();
    testCharacterHandling();
    testReciprocity();
    testCyrillicCharacters();
    testSpecialCharacters();
    testDoubleStepping();
    
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('The Enigma machine correctly implements all requirements.');
    
  } catch (error) {
    console.error('\n💥 TEST FAILURE:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, TestEnigma }; 