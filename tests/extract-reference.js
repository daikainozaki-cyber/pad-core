/**
 * Extract reference voicing data from tombatossals/chords-db
 * Run: node tests/extract-reference.js
 * Outputs JSON to stdout for piping to file
 */

var fs = require('fs');
var path = require('path');

var CHORDS_DIR = '/tmp/chords-db/src/db/guitar/chords';

// Chords to extract (must match our benchmark set)
var TARGET = {
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
  'C/7':        { root: 0,  pcs: [0,4,7,10],    name: 'C7' },
  'A/m7':       { root: 9,  pcs: [0,3,7,10],    name: 'Am7' },
  'D/m7':       { root: 2,  pcs: [0,3,7,10],    name: 'Dm7' },
  'G/7':        { root: 7,  pcs: [0,4,7,10],    name: 'G7' },
  'C/maj7':     { root: 0,  pcs: [0,4,7,11],    name: 'Cmaj7' },
  'F/7':        { root: 5,  pcs: [0,4,7,10],    name: 'F7' },
  'E/7':        { root: 4,  pcs: [0,4,7,10],    name: 'E7' },
  'C#/m7':      { root: 1,  pcs: [0,3,7,10],    name: 'C#m7' },
  'C/9':        { root: 0,  pcs: [0,4,7,10,14], name: 'C9' },
  'A/m9':       { root: 9,  pcs: [0,3,7,10,14], name: 'Am9' },
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

for (var key in TARGET) {
  var parts = key.split('/');
  var filePath = path.join(CHORDS_DIR, parts[0], parts[1] + '.js');
  if (!fs.existsSync(filePath)) {
    console.error('Missing: ' + filePath);
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

console.error('Extracted ' + totalPositions + ' reference positions for ' + Object.keys(reference).length + ' chords');
process.stdout.write(JSON.stringify(reference, null, 2));
