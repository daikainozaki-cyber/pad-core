/**
 * Extract reference voicing data from tombatossals/chords-db
 * Run: node tests/extract-reference.js
 * Outputs JSON to stdout for piping to file
 */

var fs = require('fs');
var path = require('path');

var CHORDS_DIR = '/tmp/chords-db/src/db/guitar/chords';

// Comprehensive chord set: triads, 7ths, tensions, altered, sus, dim, aug
// key format: "ROOT/suffix" → maps to file path ROOT/suffix.js
var TARGET = {
  // === Triads ===
  'C/major':    { root: 0,  pcs: [0,4,7],       name: 'C' },
  'C/minor':    { root: 0,  pcs: [0,3,7],       name: 'Cm' },
  'D/major':    { root: 2,  pcs: [0,4,7],       name: 'D' },
  'D/minor':    { root: 2,  pcs: [0,3,7],       name: 'Dm' },
  'E/major':    { root: 4,  pcs: [0,4,7],       name: 'E' },
  'E/minor':    { root: 4,  pcs: [0,3,7],       name: 'Em' },
  'G/major':    { root: 7,  pcs: [0,4,7],       name: 'G' },
  'A/major':    { root: 9,  pcs: [0,4,7],       name: 'A' },
  'A/minor':    { root: 9,  pcs: [0,3,7],       name: 'Am' },
  'F/major':    { root: 5,  pcs: [0,4,7],       name: 'F' },
  'Bb/major':   { root: 10, pcs: [0,4,7],       name: 'Bb' },
  'C#/minor':   { root: 1,  pcs: [0,3,7],       name: 'C#m' },
  'F#/minor':   { root: 6,  pcs: [0,3,7],       name: 'F#m' },

  // === Dominant 7th ===
  'C/7':        { root: 0,  pcs: [0,4,7,10],    name: 'C7' },
  'G/7':        { root: 7,  pcs: [0,4,7,10],    name: 'G7' },
  'F/7':        { root: 5,  pcs: [0,4,7,10],    name: 'F7' },
  'E/7':        { root: 4,  pcs: [0,4,7,10],    name: 'E7' },
  'A/7':        { root: 9,  pcs: [0,4,7,10],    name: 'A7' },
  'D/7':        { root: 2,  pcs: [0,4,7,10],    name: 'D7' },
  'Bb/7':       { root: 10, pcs: [0,4,7,10],    name: 'Bb7' },

  // === Minor 7th ===
  'A/m7':       { root: 9,  pcs: [0,3,7,10],    name: 'Am7' },
  'D/m7':       { root: 2,  pcs: [0,3,7,10],    name: 'Dm7' },
  'E/m7':       { root: 4,  pcs: [0,3,7,10],    name: 'Em7' },
  'C#/m7':      { root: 1,  pcs: [0,3,7,10],    name: 'C#m7' },
  'F#/m7':      { root: 6,  pcs: [0,3,7,10],    name: 'F#m7' },

  // === Major 7th ===
  'C/maj7':     { root: 0,  pcs: [0,4,7,11],    name: 'Cmaj7' },
  'G/maj7':     { root: 7,  pcs: [0,4,7,11],    name: 'Gmaj7' },
  'F/maj7':     { root: 5,  pcs: [0,4,7,11],    name: 'Fmaj7' },
  'Bb/maj7':    { root: 10, pcs: [0,4,7,11],    name: 'Bbmaj7' },

  // === 9th chords (tension) ===
  'C/9':        { root: 0,  pcs: [0,4,7,10,14], name: 'C9' },
  'A/m9':       { root: 9,  pcs: [0,3,7,10,14], name: 'Am9' },
  'G/9':        { root: 7,  pcs: [0,4,7,10,14], name: 'G9' },
  'D/9':        { root: 2,  pcs: [0,4,7,10,14], name: 'D9' },
  'C/maj9':     { root: 0,  pcs: [0,4,7,11,14], name: 'Cmaj9' },
  'D/m9':       { root: 2,  pcs: [0,3,7,10,14], name: 'Dm9' },
  'E/m9':       { root: 4,  pcs: [0,3,7,10,14], name: 'Em9' },

  // === add9 ===
  'C/add9':     { root: 0,  pcs: [0,4,7,14],    name: 'Cadd9' },
  'G/add9':     { root: 7,  pcs: [0,4,7,14],    name: 'Gadd9' },
  'A/madd9':    { root: 9,  pcs: [0,3,7,14],    name: 'Am(add9)' },

  // === 6th chords ===
  'C/6':        { root: 0,  pcs: [0,4,7,9],     name: 'C6' },
  'A/m6':       { root: 9,  pcs: [0,3,7,9],     name: 'Am6' },
  'G/6':        { root: 7,  pcs: [0,4,7,9],     name: 'G6' },
  'C/69':       { root: 0,  pcs: [0,4,7,9,14],  name: 'C6/9' },

  // === Diminished ===
  'C/dim':      { root: 0,  pcs: [0,3,6],       name: 'Cdim' },
  'C/dim7':     { root: 0,  pcs: [0,3,6,9],     name: 'Cdim7' },
  'A/dim':      { root: 9,  pcs: [0,3,6],       name: 'Adim' },
  'A/dim7':     { root: 9,  pcs: [0,3,6,9],     name: 'Adim7' },

  // === Augmented ===
  'C/aug':      { root: 0,  pcs: [0,4,8],       name: 'Caug' },
  'G/aug':      { root: 7,  pcs: [0,4,8],       name: 'Gaug' },

  // === Half-diminished (m7b5) ===
  'C/m7b5':     { root: 0,  pcs: [0,3,6,10],    name: 'Cm7b5' },
  'F#/m7b5':    { root: 6,  pcs: [0,3,6,10],    name: 'F#m7b5' },
  'B/m7b5':     { root: 11, pcs: [0,3,6,10],    name: 'Bm7b5' },

  // === Altered dominants ===
  'C/7b5':      { root: 0,  pcs: [0,4,6,10],    name: 'C7b5' },
  'C/7b9':      { root: 0,  pcs: [0,4,7,10,13], name: 'C7b9' },
  'C/7#9':      { root: 0,  pcs: [0,4,7,10,15], name: 'C7#9' },
  'E/7b9':      { root: 4,  pcs: [0,4,7,10,13], name: 'E7b9' },
  'A/7b9':      { root: 9,  pcs: [0,4,7,10,13], name: 'A7b9' },

  // === Sus chords ===
  'C/sus4':     { root: 0,  pcs: [0,5,7],       name: 'Csus4' },
  'D/sus4':     { root: 2,  pcs: [0,5,7],       name: 'Dsus4' },
  'A/sus4':     { root: 9,  pcs: [0,5,7],       name: 'Asus4' },
  'C/sus2':     { root: 0,  pcs: [0,2,7],       name: 'Csus2' },
  'D/sus2':     { root: 2,  pcs: [0,2,7],       name: 'Dsus2' },
  'C/7sus4':    { root: 0,  pcs: [0,5,7,10],    name: 'C7sus4' },

  // === Minor-major 7th ===
  'C/mmaj7':    { root: 0,  pcs: [0,3,7,11],    name: 'CmMaj7' },
  'A/mmaj7':    { root: 9,  pcs: [0,3,7,11],    name: 'AmMaj7' },

  // === Aug7 ===
  'C/aug7':     { root: 0,  pcs: [0,4,8,10],    name: 'Caug7' },
  'G/aug7':     { root: 7,  pcs: [0,4,8,10],    name: 'Gaug7' },

  // === 11th/13th ===
  'C/9#11':     { root: 0,  pcs: [0,4,7,10,14,18], name: 'C9#11' },
  'C/13':       { root: 0,  pcs: [0,4,7,10,21],    name: 'C13' },
  'G/13':       { root: 7,  pcs: [0,4,7,10,21],    name: 'G13' },
};

// Parse frets string (hex-like: x=null, 0-9=fret, a=10, b=11, c=12)
// Input order: low E to high E. Output order: high E to low E (our convention)
function parseFrets(fretStr) {
  var result = [];
  for (var i = 0; i < fretStr.length; i++) {
    var ch = fretStr[i];
    if (ch === 'x' || ch === 'X') result.push(null);
    else if (ch >= '0' && ch <= '9') result.push(parseInt(ch));
    else if (ch >= 'a' && ch <= 'f') result.push(ch.charCodeAt(0) - 'a'.charCodeAt(0) + 10);
    else result.push(null);
  }
  // Reverse: low→high to high→low
  return result.reverse();
}

// Read JS module and extract positions (simple regex parse, no eval)
function extractPositions(filePath) {
  var content = fs.readFileSync(filePath, 'utf8');
  var positions = [];
  // Match frets: 'xxx' patterns
  var fretRegex = /frets:\s*'([^']+)'/g;
  var match;
  while ((match = fretRegex.exec(content)) !== null) {
    positions.push(parseFrets(match[1]));
  }
  return positions;
}

var reference = {};
var totalPositions = 0;
var missing = [];

for (var key in TARGET) {
  var parts = key.split('/');
  var filePath = path.join(CHORDS_DIR, parts[0], parts[1] + '.js');
  if (!fs.existsSync(filePath)) {
    missing.push(key);
    continue;
  }
  var positions = extractPositions(filePath);
  var info = TARGET[key];
  reference[info.name] = {
    root: info.root,
    pcs: info.pcs,
    positions: positions,
  };
  totalPositions += positions.length;
}

if (missing.length > 0) {
  console.error('Missing files: ' + missing.join(', '));
}
console.error('Extracted ' + totalPositions + ' reference positions for ' + Object.keys(reference).length + ' chords');
process.stdout.write(JSON.stringify(reference, null, 2));
