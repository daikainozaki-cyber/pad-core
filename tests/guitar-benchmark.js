/**
 * Guitar Voicing Benchmark
 * Measures quality of padEnumGuitarChordForms output against known patterns.
 * Run: node tests/guitar-benchmark.js
 */

Object.assign(globalThis, require('../data.js'));
Object.assign(globalThis, require('../theory.js'));

var TUNING = [64, 59, 55, 50, 45, 40]; // E4 B3 G3 D3 A2 E2

// Comprehensive chord set matching extract-reference.js
var TEST_CHORDS = [
  // Triads
  { root: 0,  pcs: [0,4,7],       name: 'C' },
  { root: 0,  pcs: [0,3,7],       name: 'Cm' },
  { root: 2,  pcs: [0,4,7],       name: 'D' },
  { root: 2,  pcs: [0,3,7],       name: 'Dm' },
  { root: 4,  pcs: [0,4,7],       name: 'E' },
  { root: 4,  pcs: [0,3,7],       name: 'Em' },
  { root: 7,  pcs: [0,4,7],       name: 'G' },
  { root: 9,  pcs: [0,4,7],       name: 'A' },
  { root: 9,  pcs: [0,3,7],       name: 'Am' },
  { root: 5,  pcs: [0,4,7],       name: 'F' },
  { root: 10, pcs: [0,4,7],       name: 'Bb' },
  { root: 1,  pcs: [0,3,7],       name: 'C#m' },
  { root: 6,  pcs: [0,3,7],       name: 'F#m' },
  // Dominant 7th
  { root: 0,  pcs: [0,4,7,10],    name: 'C7' },
  { root: 7,  pcs: [0,4,7,10],    name: 'G7' },
  { root: 5,  pcs: [0,4,7,10],    name: 'F7' },
  { root: 4,  pcs: [0,4,7,10],    name: 'E7' },
  { root: 9,  pcs: [0,4,7,10],    name: 'A7' },
  { root: 2,  pcs: [0,4,7,10],    name: 'D7' },
  { root: 10, pcs: [0,4,7,10],    name: 'Bb7' },
  // Minor 7th
  { root: 9,  pcs: [0,3,7,10],    name: 'Am7' },
  { root: 2,  pcs: [0,3,7,10],    name: 'Dm7' },
  { root: 4,  pcs: [0,3,7,10],    name: 'Em7' },
  { root: 1,  pcs: [0,3,7,10],    name: 'C#m7' },
  { root: 6,  pcs: [0,3,7,10],    name: 'F#m7' },
  // Major 7th
  { root: 0,  pcs: [0,4,7,11],    name: 'Cmaj7' },
  { root: 7,  pcs: [0,4,7,11],    name: 'Gmaj7' },
  { root: 5,  pcs: [0,4,7,11],    name: 'Fmaj7' },
  { root: 10, pcs: [0,4,7,11],    name: 'Bbmaj7' },
  // 9th (tension)
  { root: 0,  pcs: [0,4,7,10,14], name: 'C9' },
  { root: 9,  pcs: [0,3,7,10,14], name: 'Am9' },
  { root: 7,  pcs: [0,4,7,10,14], name: 'G9' },
  { root: 2,  pcs: [0,4,7,10,14], name: 'D9' },
  { root: 0,  pcs: [0,4,7,11,14], name: 'Cmaj9' },
  { root: 2,  pcs: [0,3,7,10,14], name: 'Dm9' },
  { root: 4,  pcs: [0,3,7,10,14], name: 'Em9' },
  // add9
  { root: 0,  pcs: [0,4,7,14],    name: 'Cadd9' },
  { root: 7,  pcs: [0,4,7,14],    name: 'Gadd9' },
  { root: 9,  pcs: [0,3,7,14],    name: 'Am(add9)' },
  // 6th
  { root: 0,  pcs: [0,4,7,9],     name: 'C6' },
  { root: 9,  pcs: [0,3,7,9],     name: 'Am6' },
  { root: 7,  pcs: [0,4,7,9],     name: 'G6' },
  { root: 0,  pcs: [0,4,7,9,14],  name: 'C6(9)' },
  // Diminished
  { root: 0,  pcs: [0,3,6],       name: 'Cdim' },
  { root: 0,  pcs: [0,3,6,9],     name: 'Cdim7' },
  { root: 9,  pcs: [0,3,6],       name: 'Adim' },
  { root: 9,  pcs: [0,3,6,9],     name: 'Adim7' },
  // Augmented
  { root: 0,  pcs: [0,4,8],       name: 'Caug' },
  { root: 7,  pcs: [0,4,8],       name: 'Gaug' },
  // Half-diminished (m7b5)
  { root: 0,  pcs: [0,3,6,10],    name: 'Cm7b5' },
  { root: 6,  pcs: [0,3,6,10],    name: 'F#m7b5' },
  { root: 11, pcs: [0,3,6,10],    name: 'Bm7b5' },
  // Altered dominants
  { root: 0,  pcs: [0,4,6,10],    name: 'C7b5' },
  { root: 0,  pcs: [0,4,7,10,13], name: 'C7b9' },
  { root: 0,  pcs: [0,4,7,10,15], name: 'C7#9' },
  { root: 4,  pcs: [0,4,7,10,13], name: 'E7b9' },
  { root: 9,  pcs: [0,4,7,10,13], name: 'A7b9' },
  // Sus
  { root: 0,  pcs: [0,5,7],       name: 'Csus4' },
  { root: 2,  pcs: [0,5,7],       name: 'Dsus4' },
  { root: 9,  pcs: [0,5,7],       name: 'Asus4' },
  { root: 0,  pcs: [0,2,7],       name: 'Csus2' },
  { root: 2,  pcs: [0,2,7],       name: 'Dsus2' },
  { root: 0,  pcs: [0,5,7,10],    name: 'C7sus4' },
  // Minor-major 7th
  { root: 0,  pcs: [0,3,7,11],    name: 'CmMaj7' },
  { root: 9,  pcs: [0,3,7,11],    name: 'AmMaj7' },
  // Aug7
  { root: 0,  pcs: [0,4,8,10],    name: 'Caug7' },
  { root: 7,  pcs: [0,4,8,10],    name: 'Gaug7' },
  // 11th/13th
  { root: 0,  pcs: [0,4,7,10,14,18], name: 'C9#11' },
  { root: 0,  pcs: [0,4,7,10,21],    name: 'C13' },
  { root: 7,  pcs: [0,4,7,10,21],    name: 'G13' },
];

// Quality checks
function checkBrokenBarre(f) {
  if (f.isBrokenBarre) return 'broken_barre';
  return null;
}

function checkSubsetOfFullBarre(forms, idx) {
  var f = forms[idx];
  for (var j = 0; j < forms.length; j++) {
    if (j === idx) continue;
    var other = forms[j];
    if (other.stringCount <= f.stringCount) continue;
    var isSubset = true;
    for (var s = 0; s < f.frets.length; s++) {
      if (f.frets[s] === null) continue;
      if (other.frets[s] !== f.frets[s]) { isSubset = false; break; }
    }
    if (isSubset) return 'subset';
  }
  return null;
}

function checkOpenHighFretClash(f) {
  var hasOpen = false, maxFret = 0;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] === 0) hasOpen = true;
    if (f.frets[i] !== null && f.frets[i] > maxFret) maxFret = f.frets[i];
  }
  if (hasOpen && maxFret >= 4) return 'open_high';
  return null;
}

function checkThinHighPos(f) {
  if (f.stringCount > 3) return null;
  var minFret = Infinity;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] !== null && f.frets[i] > 0 && f.frets[i] < minFret) minFret = f.frets[i];
  }
  if (minFret >= 3) return 'thin_high';
  return null;
}

function checkOvercrowded(f) {
  if (f.stringCount >= 6 && f.span >= 4) return 'overcrowded';
  return null;
}

function checkInteriorGap(f) {
  var first = -1, last = -1;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] !== null) {
      if (first === -1) first = i;
      last = i;
    }
  }
  for (var i = first + 1; i < last; i++) {
    if (f.frets[i] === null) return 'interior_gap';
  }
  return null;
}

// Run benchmark
var totalForms = 0;
var issues = { broken_barre: 0, subset: 0, open_high: 0, thin_high: 0, overcrowded: 0, interior_gap: 0 };
var categoryStats = {};

TEST_CHORDS.forEach(function(chord) {
  var forms = padEnumGuitarChordForms(chord.pcs, chord.root, TUNING, 12, 5, { maxResults: 30 });
  totalForms += forms.length;

  // Categorize chord
  var cat = 'triad';
  if (chord.pcs.some(function(p) { return p >= 13; })) cat = 'tension';
  else if (chord.pcs.length >= 4) cat = '7th';
  else if (chord.pcs.some(function(p) { return p === 6 || p === 8; })) cat = 'dim/aug';
  if (!categoryStats[cat]) categoryStats[cat] = { total: 0, issues: 0 };
  categoryStats[cat].total += forms.length;

  forms.forEach(function(f, i) {
    var checks = [
      checkBrokenBarre(f),
      checkSubsetOfFullBarre(forms, i),
      checkOpenHighFretClash(f),
      checkThinHighPos(f),
      checkOvercrowded(f),
      checkInteriorGap(f),
    ];
    var found = checks.filter(function(c) { return c !== null; });
    if (found.length > 0) {
      categoryStats[cat].issues += found.length;
      found.forEach(function(c) {
        if (issues[c] !== undefined) issues[c]++;
      });
    }
  });
});

console.log('=== Guitar Voicing Benchmark ===');
console.log('Chords tested: ' + TEST_CHORDS.length);
console.log('Total forms generated: ' + totalForms);
console.log('Avg forms/chord: ' + (totalForms / TEST_CHORDS.length).toFixed(1));
console.log('\nIssues detected:');
console.log('  Broken barre:     ' + issues.broken_barre);
console.log('  Subset forms:     ' + issues.subset);
console.log('  Open+high fret:   ' + issues.open_high);
console.log('  Thin high-pos:    ' + issues.thin_high);
console.log('  Overcrowded:      ' + issues.overcrowded);
console.log('  Interior gap:     ' + issues.interior_gap);
var totalIssues = 0;
for (var k in issues) totalIssues += issues[k];
console.log('  TOTAL issues:     ' + totalIssues + ' / ' + totalForms + ' (' + (100 * totalIssues / totalForms).toFixed(1) + '%)');

console.log('\nBy category:');
for (var cat in categoryStats) {
  var s = categoryStats[cat];
  console.log('  ' + cat + ': ' + s.total + ' forms, ' + s.issues + ' issues (' + (100 * s.issues / s.total).toFixed(1) + '%)');
}
