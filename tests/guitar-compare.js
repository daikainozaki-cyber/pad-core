/**
 * Compare padEnumGuitarChordForms output with reference voicings.
 * Measures: coverage (how many reference voicings we find) and ranking quality.
 * Run: node tests/guitar-compare.js
 */

Object.assign(globalThis, require('../data.js'));
Object.assign(globalThis, require('../theory.js'));
var fs = require('fs');

var TUNING = [64, 59, 55, 50, 45, 40]; // E4 B3 G3 D3 A2 E2
var reference = JSON.parse(fs.readFileSync(__dirname + '/reference-voicings.json', 'utf8'));

function fretsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

var totalRef = 0, covered = 0, coveredTop15 = 0, coveredTop10 = 0;
var uncoveredList = [];
var coveredRanks = [];
var chordCount = 0;

for (var chordName in reference) {
  var chord = reference[chordName];
  var forms = padEnumGuitarChordForms(chord.pcs, chord.root, TUNING, 12, 5, { maxResults: 30 });

  chordCount++;
  var refPositions = chord.positions;

  for (var ri = 0; ri < refPositions.length; ri++) {
    var refFrets = refPositions[ri];
    totalRef++;

    var foundAt = -1;
    for (var fi = 0; fi < forms.length; fi++) {
      if (fretsEqual(forms[fi].frets, refFrets)) {
        foundAt = fi;
        break;
      }
    }

    if (foundAt >= 0) {
      covered++;
      coveredRanks.push(foundAt + 1);
      if (foundAt < 15) coveredTop15++;
      if (foundAt < 10) coveredTop10++;
    } else {
      uncoveredList.push(chordName + ': [' + refFrets.map(function(f) { return f === null ? 'x' : f; }).join(',') + ']');
    }
  }
}

console.log('=== Reference Comparison ===');
console.log('Chords: ' + chordCount);
console.log('Reference positions: ' + totalRef);
console.log('Covered (in top 30): ' + covered + '/' + totalRef + ' (' + (100 * covered / totalRef).toFixed(1) + '%)');
console.log('Covered (in top 15): ' + coveredTop15 + '/' + totalRef + ' (' + (100 * coveredTop15 / totalRef).toFixed(1) + '%)');
console.log('Covered (in top 10): ' + coveredTop10 + '/' + totalRef + ' (' + (100 * coveredTop10 / totalRef).toFixed(1) + '%)');

if (coveredRanks.length > 0) {
  coveredRanks.sort(function(a, b) { return a - b; });
  var avgRank = coveredRanks.reduce(function(s, r) { return s + r; }, 0) / coveredRanks.length;
  var medianRank = coveredRanks[Math.floor(coveredRanks.length / 2)];
  console.log('Avg rank of covered: ' + avgRank.toFixed(1));
  console.log('Median rank of covered: ' + medianRank);
}

console.log('\nUncovered reference voicings (' + uncoveredList.length + '):');
uncoveredList.forEach(function(item) { console.log('  ' + item); });
