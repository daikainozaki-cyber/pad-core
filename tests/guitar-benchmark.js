/**
 * Guitar Voicing Benchmark
 * Measures quality of padEnumGuitarChordForms output against known patterns.
 * Run: node tests/guitar-benchmark.js
 */

Object.assign(globalThis, require('../data.js'));
Object.assign(globalThis, require('../theory.js'));

var TUNING = [64, 59, 55, 50, 45, 40]; // E4 B3 G3 D3 A2 E2
var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Test chords: rootPC, intervals, name
var TEST_CHORDS = [
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
  { root: 0,  pcs: [0,4,7,10],    name: 'C7' },
  { root: 9,  pcs: [0,3,7,10],    name: 'Am7' },
  { root: 2,  pcs: [0,3,7,10],    name: 'Dm7' },
  { root: 7,  pcs: [0,4,7,10],    name: 'G7' },
  { root: 0,  pcs: [0,4,7,11],    name: 'Cmaj7' },
  { root: 5,  pcs: [0,4,7,10],    name: 'F7' },
  { root: 4,  pcs: [0,4,7,10],    name: 'E7' },
  { root: 1,  pcs: [0,3,7,10],    name: 'C#m7' },
  { root: 0,  pcs: [0,4,7,10,14], name: 'C9' },
  { root: 9,  pcs: [0,3,7,10,14], name: 'Am9' },
];

// Quality checks — each returns a penalty description or null
function checkBrokenBarre(f) {
  // Find minFrettedFret and check if it forms a real barre
  var minFret = Infinity;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] !== null && f.frets[i] > 0 && f.frets[i] < minFret) {
      minFret = f.frets[i];
    }
  }
  if (minFret === Infinity) return null;

  // Collect strings at minFret
  var barreStrings = [];
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] === minFret) barreStrings.push(i);
  }
  if (barreStrings.length < 2) return null; // single string, not a barre attempt

  // Check if barre is contiguous (no gaps between barre strings)
  // OR if there's a muted/differently-fretted string between barre strings
  var first = barreStrings[0], last = barreStrings[barreStrings.length - 1];
  for (var i = first + 1; i < last; i++) {
    if (f.frets[i] === null || (f.frets[i] !== null && f.frets[i] < minFret)) {
      return 'broken_barre';
    }
  }
  return null;
}

function checkSubsetOfFullBarre(forms, idx) {
  var f = forms[idx];
  // Check if this form is a strict subset of another form in the list
  for (var j = 0; j < forms.length; j++) {
    if (j === idx) continue;
    var other = forms[j];
    if (other.stringCount <= f.stringCount) continue;
    var isSubset = true;
    for (var s = 0; s < f.frets.length; s++) {
      if (f.frets[s] === null) continue;
      if (other.frets[s] !== f.frets[s]) { isSubset = false; break; }
    }
    if (isSubset) return 'subset_of_#' + (j + 1);
  }
  return null;
}

function checkOpenHighFretClash(f) {
  var hasOpen = false, maxFret = 0;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] === 0) hasOpen = true;
    if (f.frets[i] !== null && f.frets[i] > maxFret) maxFret = f.frets[i];
  }
  if (hasOpen && maxFret >= 4) return 'open+fret' + maxFret;
  return null;
}

function checkThinHighPos(f) {
  if (f.stringCount > 3) return null;
  var minFret = Infinity;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] !== null && f.frets[i] > 0 && f.frets[i] < minFret) minFret = f.frets[i];
  }
  if (minFret >= 3) return 'thin_' + f.stringCount + 'str@fret' + minFret;
  return null;
}

function checkOvercrowded(f) {
  if (f.stringCount >= 6 && f.span >= 4) return 'crowded_6str_span' + f.span;
  return null;
}

function checkInteriorGap(f) {
  // Find first and last sounding strings
  var first = -1, last = -1;
  for (var i = 0; i < f.frets.length; i++) {
    if (f.frets[i] !== null) {
      if (first === -1) first = i;
      last = i;
    }
  }
  // Count interior gaps between fretted (non-open) strings
  var frettedGaps = 0;
  for (var i = first + 1; i < last; i++) {
    if (f.frets[i] === null) {
      // Check if neighbors are fretted (not open)
      var prevFretted = false, nextFretted = false;
      for (var j = i - 1; j >= 0; j--) {
        if (f.frets[j] !== null) { prevFretted = f.frets[j] > 0; break; }
      }
      for (var j = i + 1; j < f.frets.length; j++) {
        if (f.frets[j] !== null) { nextFretted = f.frets[j] > 0; break; }
      }
      if (prevFretted && nextFretted) frettedGaps++;
    }
  }
  if (frettedGaps > 0) return 'interior_gap_' + frettedGaps;
  return null;
}

// Run benchmark
function runBenchmark(label) {
  var totalForms = 0;
  var issues = { broken_barre: 0, subset: 0, open_high: 0, thin_high: 0, overcrowded: 0, interior_gap: 0 };
  var issueDetails = [];

  TEST_CHORDS.forEach(function(chord) {
    var forms = padEnumGuitarChordForms(chord.pcs, chord.root, TUNING, 12, 5, { maxResults: 30 });
    totalForms += forms.length;

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
        var fretStr = f.frets.map(function(fr) { return fr === null ? 'x' : fr; }).join(',');
        if (found.some(function(c) { return c.indexOf('broken') >= 0 || c.indexOf('overcrowded') >= 0; })) {
          issueDetails.push(chord.name + ' #' + (i+1) + ' [' + fretStr + ']: ' + found.join(', '));
        }
        found.forEach(function(c) {
          if (c.indexOf('broken') >= 0) issues.broken_barre++;
          else if (c.indexOf('subset') >= 0) issues.subset++;
          else if (c.indexOf('open+') >= 0) issues.open_high++;
          else if (c.indexOf('thin') >= 0) issues.thin_high++;
          else if (c.indexOf('crowded') >= 0) issues.overcrowded++;
          else if (c.indexOf('interior') >= 0) issues.interior_gap++;
        });
      }
    });
  });

  console.log('\n=== ' + label + ' ===');
  console.log('Chords tested: ' + TEST_CHORDS.length);
  console.log('Total forms generated: ' + totalForms);
  console.log('Avg forms/chord: ' + (totalForms / TEST_CHORDS.length).toFixed(1));
  console.log('Issues detected:');
  console.log('  Broken barre:     ' + issues.broken_barre);
  console.log('  Subset forms:     ' + issues.subset);
  console.log('  Open+high fret:   ' + issues.open_high);
  console.log('  Thin high-pos:    ' + issues.thin_high);
  console.log('  Overcrowded:      ' + issues.overcrowded);
  console.log('  Interior gap:     ' + issues.interior_gap);
  var totalIssues = 0;
  for (var k in issues) totalIssues += issues[k];
  console.log('  TOTAL issues:     ' + totalIssues + ' / ' + totalForms + ' (' + (100 * totalIssues / totalForms).toFixed(1) + '%)');

  if (issueDetails.length > 0 && issueDetails.length <= 20) {
    console.log('\nBroken barre / overcrowded details:');
    issueDetails.forEach(function(d) { console.log('  ' + d); });
  }

  return { totalForms: totalForms, issues: issues };
}

runBenchmark('BEFORE improvements');
