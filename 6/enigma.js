const readline = require('readline');

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
    // Apply ring setting and position offset to get internal wiring position
    const inputPos = mod(alphabet.indexOf(c) + this.position - this.ringSetting, 26);
    const outputChar = this.wiring[inputPos];
    // Apply inverse offset to get final output position
    const outputPos = mod(alphabet.indexOf(outputChar) - this.position + this.ringSetting, 26);
    return alphabet[outputPos];
  }
  backward(c) {
    // Apply ring setting and position offset to find position in wiring
    const inputPos = mod(alphabet.indexOf(c) + this.position - this.ringSetting, 26);
    const wiringPos = this.wiring.indexOf(alphabet[inputPos]);
    // Apply inverse offset to get final output position  
    const outputPos = mod(wiringPos - this.position + this.ringSetting, 26);
    return alphabet[outputPos];
  }
}

class Enigma {
  constructor(rotorIDs, rotorPositions, ringSettings, plugboardPairs) {
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
    if (!alphabet.includes(c)) return c;
    this.stepRotors();
    c = plugboardSwap(c, this.plugboardPairs);
    for (let i = this.rotors.length - 1; i >= 0; i--) {
      c = this.rotors[i].forward(c);
    }

    c = REFLECTOR[alphabet.indexOf(c)];

    for (let i = 0; i < this.rotors.length; i++) {
      c = this.rotors[i].backward(c);
    }

    // Apply plugboard swap again on the way out (critical fix!)
    c = plugboardSwap(c, this.plugboardPairs);
    return c;
  }
  process(text) {
    return text
      .split('')
      .map((c) => this.encryptChar(c))
      .join('');
  }
}

function promptEnigma() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter message: ', (message) => {
    rl.question('Rotor positions (e.g. 0 0 0): ', (posStr) => {
      const rotorPositions = posStr.split(' ').map(Number);
      rl.question('Ring settings (e.g. 0 0 0): ', (ringStr) => {
        const ringSettings = ringStr.split(' ').map(Number);
        rl.question('Plugboard pairs (e.g. AB CD): ', (plugStr) => {
          const plugPairs =
            plugStr
              .toUpperCase()
              .match(/([A-Z]{2})/g)
              ?.map((pair) => [pair[0], pair[1]]) || [];

          const enigma = new Enigma(
            [0, 1, 2],
            rotorPositions,
            ringSettings,
            plugPairs,
          );
          const result = enigma.process(message);
          console.log('Output:', result);
          rl.close();
        });
      });
    });
  });
}

if (require.main === module) {
  promptEnigma();
}
