// ========================================
// PAD-CORE — Data & Constants (SSOT)
// Theory calculation data shared across all pad ecosystem apps
// ========================================

const NOTE_NAMES_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_NAMES_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const FLAT_MAJOR_KEYS = new Set([1, 3, 5, 6, 8, 10]); // Db, Eb, F, Gb, Ab, Bb

// ======== SCALES ========
const SCALES = [
  // cn = characteristic notes (intervals that define the mode's color)
  // Diatonic
  {id:0, cat:'○', num:1, name:'Major (Ionian)', pcs:[0,2,4,5,7,9,11], cn:[11]},
  {id:1, cat:'○', num:2, name:'Dorian', pcs:[0,2,3,5,7,9,10], cn:[9]},
  {id:2, cat:'○', num:3, name:'Phrygian', pcs:[0,1,3,5,7,8,10], cn:[1]},
  {id:3, cat:'○', num:4, name:'Lydian', pcs:[0,2,4,6,7,9,11], cn:[6]},
  {id:4, cat:'○', num:5, name:'Mixolydian', pcs:[0,2,4,5,7,9,10], cn:[10]},
  {id:5, cat:'○', num:6, name:'Natural Minor (Aeolian)', pcs:[0,2,3,5,7,8,10], cn:[8]},
  {id:6, cat:'○', num:7, name:'Locrian', pcs:[0,1,3,5,6,8,10], cn:[1,6]},
  // Harmonic Minor
  {id:7, cat:'■', num:1, name:'Harmonic Minor', pcs:[0,2,3,5,7,8,11], cn:[11]},
  {id:8, cat:'■', num:2, name:'Locrian \u266E6', pcs:[0,1,3,5,6,9,10], cn:[9]},
  {id:9, cat:'■', num:3, name:'Ionian #5', pcs:[0,2,4,5,8,9,11], cn:[8]},
  {id:10, cat:'■', num:4, name:'Dorian #4', pcs:[0,2,3,6,7,9,10], cn:[6]},
  {id:11, cat:'■', num:5, name:'Phrygian Dominant', pcs:[0,1,4,5,7,8,10], cn:[1,4]},
  {id:12, cat:'■', num:6, name:'Lydian #2', pcs:[0,3,4,6,7,9,11], cn:[3]},
  {id:13, cat:'■', num:7, name:'Functional Diminish', pcs:[0,1,3,4,6,8,10], cn:[6]},
  // Melodic Minor
  {id:14, cat:'◆', num:1, name:'Melodic Minor', pcs:[0,2,3,5,7,9,11], cn:[9,11]},
  {id:15, cat:'◆', num:2, name:'Dorian b2', pcs:[0,1,3,5,7,9,10], cn:[1]},
  {id:16, cat:'◆', num:3, name:'Lydian #5', pcs:[0,2,4,6,8,9,11], cn:[6,8]},
  {id:17, cat:'◆', num:4, name:'Lydian b7', pcs:[0,2,4,6,7,9,10], cn:[6,10]},
  {id:18, cat:'◆', num:5, name:'Mixolydian b6', pcs:[0,2,4,5,7,8,10], cn:[8]},
  {id:19, cat:'◆', num:6, name:'Locrian \u266E2', pcs:[0,2,3,5,6,8,10], cn:[2]},
  {id:20, cat:'◆', num:7, name:'Super Locrian (Altered)', pcs:[0,1,3,4,6,8,10], cn:[1,6,8]},
  // Pentatonic / Blues / Symmetric
  {id:21, cat:'', num:0, name:'Major Pentatonic', pcs:[0,2,4,7,9], cn:[]},
  {id:22, cat:'', num:0, name:'Minor Pentatonic', pcs:[0,3,5,7,10], cn:[]},
  {id:23, cat:'', num:0, name:'Blues', pcs:[0,3,5,6,7,10], cn:[6]},
  {id:24, cat:'', num:0, name:'Chromatic', pcs:[0,1,2,3,4,5,6,7,8,9,10,11], cn:[]},
  {id:25, cat:'', num:0, name:'Whole Tone', pcs:[0,2,4,6,8,10], cn:[]},
  {id:26, cat:'', num:0, name:'Half-Whole Diminish', pcs:[0,1,3,4,6,7,9,10], cn:[]},
  {id:27, cat:'', num:0, name:'Whole-Half Diminish', pcs:[0,2,3,5,6,8,9,11], cn:[]},
  // Bebop Scales (8 notes) - cn = passing tone
  {id:28, cat:'♪', num:0, name:'Bebop Major', pcs:[0,2,4,5,7,8,9,11], cn:[8]},
  {id:29, cat:'♪', num:0, name:'Bebop Dominant (Mixolydian)', pcs:[0,2,4,5,7,9,10,11], cn:[11]},
  {id:30, cat:'♪', num:0, name:'Bebop Dorian', pcs:[0,2,3,4,5,7,9,10], cn:[4]},
];

// ======== ENHARMONIC SPELLING (circle of fifths) ========
const KEY_SPELLINGS = [
  NOTE_NAMES_FLAT,  // C  (jazz convention: flats)
  NOTE_NAMES_FLAT,  // Db (5b)
  NOTE_NAMES_SHARP, // D  (2#)
  NOTE_NAMES_FLAT,  // Eb (3b)
  NOTE_NAMES_SHARP, // E  (4#)
  NOTE_NAMES_FLAT,  // F  (1b)
  ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','Cb'], // Gb (6b: Cb not B)
  NOTE_NAMES_SHARP, // G  (1#)
  NOTE_NAMES_FLAT,  // Ab (4b)
  NOTE_NAMES_SHARP, // A  (3#)
  NOTE_NAMES_FLAT,  // Bb (2b)
  NOTE_NAMES_SHARP, // B  (5#)
];

// ======== QUALITY DEFINITIONS (Chord Builder Step 2) ========
// 4x3 grid matching Clover Chord Systems
const BUILDER_QUALITIES = [
  // Row 0
  [{name:'', label:'Maj', pcs:[0,4,7]}, {name:'m', label:'m', pcs:[0,3,7]}, {name:'m7(b5)', label:'m7\u207B\u2075', pcs:[0,3,6,10]}],
  // Row 1
  [{name:'6', label:'6', pcs:[0,4,7,9]}, {name:'m6', label:'m6', pcs:[0,3,7,9]}, {name:'dim', label:'dim', pcs:[0,3,6]}],
  // Row 2
  [{name:'7', label:'7', pcs:[0,4,7,10]}, {name:'m7', label:'m7', pcs:[0,3,7,10]}, {name:'dim7', label:'dim7', pcs:[0,3,6,9]}],
  // Row 3
  [{name:'\u25B37', label:'\u25B37', pcs:[0,4,7,11]}, {name:'m\u25B37', label:'m\u25B37', pcs:[0,3,7,11]}, {name:'aug', label:'aug', pcs:[0,4,8]}],
];

// ======== TENSION DEFINITIONS (Chord Builder Step 3) ========
const TENSION_ROWS = [
  // Row 0
  [
    {label:'sus4', mods:{replace3:5}},
    {label:'sus2', mods:{replace3:2}},
    {label:'aug', mods:{sharp5:true}},
    {label:'6', mods:{add:[9]}},
    {label:'9', mods:{add:[2]}},
    {label:'11', mods:{add:[2,5]}},
    {label:'13', mods:{add:[9]}},
    {label:'(9,13)', mods:{add:[2,9]}},
  ],
  // Row 1
  [
    {label:'add9', mods:{add:[2]}},
    {label:'b5', mods:{flat5:true}},
    {label:'6/9', mods:{add:[9,2]}},
    {label:'b9', mods:{add:[1]}},
    {label:'#11', mods:{add:[6]}},
    {label:'b13', mods:{add:[8]}},
  ],
  // Row 2
  [
    {label:'aug\n(9)', mods:{add:[2], sharp5:true}},
    {label:'6/9\n(#11)', mods:{add:[6,9,2]}},
    {label:'#9', mods:{add:[3]}},
    {label:'(9)\n(11)', mods:{add:[5,2]}},
    {label:'(11)\n(13)', mods:{add:[9,5]}},
  ],
  // Row 3
  [
    {label:'sus4\n(9)', mods:{replace3:5, add:[2]}},
    {label:'b5\n(b9)', mods:{add:[1], flat5:true}},
    null,
    null,
    {label:'(b11)\n(b13)', mods:{add:[8,4]}},
    null,
    null,
    null,
  ],
  // Row 4
  [
    {label:'sus4\n(b9)', mods:{replace3:5, add:[1]}},
    {label:'aug\n(b9)', mods:{sharp5:true, add:[1]}},
    null,
    {label:'(9)\n(#11)', mods:{add:[6,2]}},
    {label:'(#11)\n(b13)', mods:{add:[8,6]}},
    null,
    null,
    null,
  ],
  // Row 5
  [
    {label:'(#9)\n(#11)', mods:{add:[3,6]}},
    null,
    {label:'(9)\n(#11)\n(13)', mods:{add:[9,2,6]}},
    null,
    null,
    null,
    null,
    null,
  ],
  // Row 6
  [
    null,
    {label:'aug\n(#9)', mods:{add:[3], sharp5:true}},
    {label:'b5\n(#9)', mods:{add:[3], flat5:true}},
    {label:'(9)\n(b13)', mods:{add:[8,2]}},
    {label:'(b9)\n(13)', mods:{add:[1,9]}},
    null,
    null,
    null,
  ],
  // Row 7
  [
    null,
    null,
    null,
    {label:'(b9)\n(b13)', mods:{add:[8,1]}},
    {label:'(#9)\n(b13)', mods:{add:[3,8]}},
    null,
    null,
    null,
  ],
  // Row 8
  [
    null,
    null,
    null,
    {label:'(b9)\n(#9)\n(b13)', mods:{add:[8,1,3]}},
    null,
    null,
    null,
    null,
  ],
];

// ======== DEGREE NAME ↔ SEMITONE ========
// Complete mapping: chord tones + tensions + enharmonic aliases (superset of TENSION_NAME_TO_PC)
var DEGREE_TO_SEMITONE = {
  '1':0, 'b9':1, '9':2, '#9':3, 'b3':3, '3':4, '11':5,
  '#11':6, 'b5':6, '5':7, '#5':8, 'b13':8, '13':9, '6':9,
  'b7':10, '7':11, 'bb7':9
};

// ======== AVAILABLE TENSIONS PER SCALE ========
const PC_TO_TENSION_NAME = { 1:'b9', 2:'9', 3:'#9', 5:'11', 6:'#11', 8:'b13', 9:'13' };
const TENSION_NAME_TO_PC = { 'b9':1, '9':2, '#9':3, '11':5, '#11':6, 'b13':8, '13':9 };

const SCALE_AVAIL_TENSIONS = {
  // === Diatonic ===
  0:  { avail:['9','13'], avoid:['11'] },
  1:  { avail:['9','11','13'] },
  2:  { avail:['11'], avoid:['b9','b13'] },
  3:  { avail:['9','#11','13'] },
  4:  { avail:['9','13'], avoid:['11'] },
  5:  { avail:['9','11'], avoid:['b13'] },
  6:  { avail:['11','b13'], avoid:['b9'] },
  // === Harmonic Minor ===
  7:  { avail:['9','11','b13'] },
  8:  { avail:['11','13'], avoid:['b9'] },
  9:  { avail:['9','13'], avoid:['11'] },
  10: { avail:['9','#11','13'] },
  11: { avail:['b9','b13'], avoid:['11'] },
  12: { avail:['#11','13'] },
  13: { avail:['11','b13'] },
  // === Melodic Minor ===
  14: { avail:['9','11','13'] },
  15: { avail:['11','b13'], avoid:['b9'] },
  16: { avail:['9','#11','13'] },
  17: { avail:['9','#11','13'] },
  18: { avail:['9','b13'], avoid:['11'] },
  19: { avail:['9','11'] },
  20: { avail:['b9','#9','#11','b13'] },
  // === Symmetric / Special ===
  25: { avail:['9','#11','b13'] },
  26: { avail:['b9','#9','#11','13'] },
  27: { avail:['9','11','b13'] },
  // === Bebop (inherit from parent) ===
  28: { avail:['9','13'], avoid:['11'] },
  29: { avail:['9','13'], avoid:['11'] },
  30: { avail:['9','11','13'] },
};

// ======== CHORD NAME PARSING DATA ========

// Root note name → pitch class (0-11)
var PAD_ROOT_TO_PC = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

// Quality string → intervals (semitones from root)
// Sorted by key length desc for longest-match parsing
var PAD_QUALITY_INTERVALS = {
  // Multi-tension combinations
  '7(b9,b13)':  [0, 4, 7, 10, 13, 20],
  '7(#9,b13)':  [0, 4, 7, 10, 15, 20],
  '7(9,b13)':   [0, 4, 7, 10, 14, 20],
  '7(b9,#11)':  [0, 4, 7, 10, 13, 18],
  '7(#9,#11)':  [0, 4, 7, 10, 15, 18],
  '7(9,#11)':   [0, 4, 7, 10, 14, 18],
  '7(9,13)':    [0, 4, 7, 10, 14, 21],
  'maj7(#11)':  [0, 4, 7, 11, 18],
  '\u25B37(#11)': [0, 4, 7, 11, 18],
  // m7b5 + tensions
  'm7b5(b13)':  [0, 3, 6, 10, 20],
  'm7b5(11)':   [0, 3, 6, 10, 17],
  'm7b5(9)':    [0, 3, 6, 10, 14],
  // maj7 + tensions
  'maj7(13)':   [0, 4, 7, 11, 21],
  'maj7(9)':    [0, 4, 7, 11, 14],
  // m7 + tensions
  'm7(13)':     [0, 3, 7, 10, 21],
  'm7(11)':     [0, 3, 7, 10, 17],
  'm7(9)':      [0, 3, 7, 10, 14],
  // 7 + tension explicit form
  '7(13)':      [0, 4, 7, 10, 14, 21],
  '7(11)':      [0, 4, 7, 10, 14, 17],
  '7(9)':       [0, 4, 7, 10, 14],
  // Quartal (4th stacking)
  'quartal':    [0, 5, 10, 15],
  // 4-5 char qualities
  '7sus4':  [0, 5, 7, 10],
  'm7b5':   [0, 3, 6, 10],
  'm7-5':   [0, 3, 6, 10],
  'madd9':  [0, 3, 7, 14],
  'add9':   [0, 4, 7, 14],
  'aug7':   [0, 4, 8, 10],
  '7alt':   [0, 4, 6, 10, 13, 15],
  'dim7':   [0, 3, 6, 9],
  'maj9':   [0, 4, 7, 11, 14],
  'maj7':   [0, 4, 7, 11],
  'min9':   [0, 3, 7, 10, 14],
  'min7':   [0, 3, 7, 10],
  'sus4':   [0, 5, 7],
  'sus2':   [0, 2, 7],
  // Parenthesized tensions
  'm7(b5)': [0, 3, 6, 10],
  '7(b9)':  [0, 4, 7, 10, 13],
  '7(#9)':  [0, 4, 7, 10, 15],
  '7(#11)': [0, 4, 7, 10, 18],
  '7(b13)': [0, 4, 7, 10, 20],
  '7(#5)':  [0, 4, 8, 10],
  '7(b5)':  [0, 4, 6, 10],
  // Unicode / special symbols
  'm\u25B37': [0, 3, 7, 11],  // m△7
  '\u25B39':  [0, 4, 7, 11, 14], // △9
  '\u25B37':  [0, 4, 7, 11],  // △7
  '\u00F87':  [0, 3, 6, 10],  // ø7
  '\u00B07':  [0, 3, 6, 9],   // °7
  // Short forms
  'mMaj7': [0, 3, 7, 11],
  'mM7':  [0, 3, 7, 11],
  '6/9':  [0, 4, 7, 9, 14],
  '7#9':  [0, 4, 7, 10, 15],
  '7b9':  [0, 4, 7, 10, 13],
  '7#5':  [0, 4, 8, 10],
  '7b5':  [0, 4, 6, 10],
  'maj':  [0, 4, 7],
  'M9':   [0, 4, 7, 11, 14],
  'M7':   [0, 4, 7, 11],
  // 3 char
  'dim':  [0, 3, 6],
  'aug':  [0, 4, 8],
  // 2 char
  'm9':   [0, 3, 7, 10, 14],
  'm7':   [0, 3, 7, 10],
  'm6':   [0, 3, 7, 9],
  '13':   [0, 4, 7, 10, 14, 21],
  '11':   [0, 4, 7, 10, 14, 17],
  // 1 char
  '9':    [0, 4, 7, 10, 14],
  '7':    [0, 4, 7, 10],
  '6':    [0, 4, 7, 9],
  'q':    [0, 5, 10, 15],
  'h':    [0, 3, 6, 10],
  '\u00F8': [0, 3, 6, 10],    // ø
  '\u00B0': [0, 3, 6],        // °
  '+':    [0, 4, 8],
  '-':    [0, 3, 7],          // minus = minor
  'm':    [0, 3, 7],
  // Empty = major triad
  '':     [0, 4, 7],
};

// Pre-sorted keys for matching (longest first)
var PAD_QUALITY_KEYS = Object.keys(PAD_QUALITY_INTERVALS).sort(function(a, b) { return b.length - a.length; });

// Alias → canonical display name (shortcuts that should show the real name)
var PAD_QUALITY_DISPLAY = {
  'h':   'm7b5',
  'q':   'quartal',
  '-':   'm',
  '+':   'aug',
  '\u00F8': 'm7b5',  // ø
  '\u00B0': 'dim',   // °
  'M7':  'maj7',
  'mMaj7': 'm\u25B37',  // mMaj7 → m△7
  'mM7': 'm\u25B37',    // mM7 → m△7
};

// ======== PAD GRID CONSTANTS ========
const GRID = {
  ROWS: 8, COLS: 8,
  BASE_MIDI: 36, ROW_INTERVAL: 5, COL_INTERVAL: 1,
  PAD_SIZE: 62, PAD_GAP: 4, MARGIN: 20,
};

const GRID_32 = {
  ROWS: 4, COLS: 8,
  BASE_MIDI: 36, ROW_INTERVAL: 5, COL_INTERVAL: 1,
  PAD_SIZE: 0, PAD_GAP: 4, MARGIN: 8,
};

const SCALE_DEGREE_NAMES = ['R','b2','2','b3','3','4','b5','5','b6','6','b7','7'];

// Instrument diagram color palette (Okabe-Ito colorblind-safe)
const PAD_INST_COLORS = {
  root: '#E69F00',          // amber (matches --pad-root)
  rootText: '#000',
  bass: '#ff9800',          // orange (matches pad bass)
  bassText: '#000',
  guide3: '#CC79A7',        // pink (matches --pad-guide3)
  guide7: '#009E73',        // green (matches --pad-guide7)
  tension: '#0072B2',       // blue (matches --pad-tension)
  avoid: '#D55E00',         // red-orange (matches --pad-avoid)
  omitted: '#555',          // dim gray (matches --pad-omitted)
  chord: '#56B4E9',         // sky blue (matches --pad-chord)
  overlay: '#56B4E9',       // sky blue (scale overlay)
  overlayChar: '#F0E442',   // yellow (characteristic note overlay)
  overlayText: '#aaa',
  padRange: '#56B4E9',      // pad range highlight
  mute: '#D55E00',          // mute X mark
  // Piano-specific (white/black key color variants)
  pianoChordWhite: '#90CAF9',     // active chord tone on white key
  pianoChordBlack: '#4A90D9',     // active chord tone on black key
  pianoOverlayWhite: '#b8d8ec',   // overlay on white key
  pianoOverlayCharWhite: '#e8dfa0', // overlay char on white key
  charNote: '#F0E442',            // characteristic note (scale mode)
};

// Standard guitar tuning (high to low): E4, B3, G3, D3, A2, E2
const PAD_GUITAR_TUNING = [64, 59, 55, 50, 45, 40];
const PAD_GUITAR_NAMES  = ['E', 'B', 'G', 'D', 'A', 'E'];

// Standard bass tuning (high to low): G2, D2, A1, E1
const PAD_BASS_TUNING = [43, 38, 33, 28];
const PAD_BASS_NAMES  = ['G', 'D', 'A', 'E'];


// ======== CHORD DETECTION DATABASE ========
// Built from BUILDER_QUALITIES + tension extensions for chord detection

function padBuildChordDetectDB() {
  var db = [];
  BUILDER_QUALITIES.flat().forEach(function(q) {
    if (!q) return;
    db.push({ name: q.name || 'Maj', pcs: q.pcs, pcsSet: new Set(q.pcs) });
  });
  var tensionChords = [
    // 9th chords
    { name: '7(9)', pcs: [0,4,7,10,2] },
    { name: 'm7(9)', pcs: [0,3,7,10,2] },
    { name: '△7(9)', pcs: [0,4,7,11,2] },
    { name: '6/9', pcs: [0,4,7,9,2] },
    { name: 'm6/9', pcs: [0,3,7,9,2] },
    { name: '7(b9)', pcs: [0,4,7,10,1] },
    { name: '7(#9)', pcs: [0,4,7,10,3] },
    { name: 'm7(b9)', pcs: [0,3,7,10,1] },
    // 11th chords
    { name: '7(9,11)', pcs: [0,4,7,10,2,5] },
    { name: 'm7(9,11)', pcs: [0,3,7,10,2,5] },
    { name: '△7(9,#11)', pcs: [0,4,7,11,2,6] },
    { name: '7(#11)', pcs: [0,4,7,10,6] },
    // 13th chords
    { name: '7(9,13)', pcs: [0,4,7,10,2,9] },
    { name: 'm7(9,13)', pcs: [0,3,7,10,2,9] },
    { name: '△7(9,13)', pcs: [0,4,7,11,2,9] },
    { name: '7(b13)', pcs: [0,4,7,10,8] },
    // Combined tensions
    { name: '7(9,#11)', pcs: [0,4,7,10,2,6] },
    { name: '7(9,b13)', pcs: [0,4,7,10,2,8] },
    { name: '7(b9,#11)', pcs: [0,4,7,10,1,6] },
    { name: '7(b9,b13)', pcs: [0,4,7,10,1,8] },
    { name: '7(#9,b13)', pcs: [0,4,7,10,3,8] },
    { name: '7(b9,13)', pcs: [0,4,7,10,1,9] },
    { name: '7(#9,13)', pcs: [0,4,7,10,3,9] },
    { name: '7(#11,13)', pcs: [0,4,7,10,6,9] },
    { name: '7(9,#11,13)', pcs: [0,4,7,10,2,6,9] },
    { name: '7(b9,#11,13)', pcs: [0,4,7,10,1,6,9] },
    // Compact combined tensions (no 5th)
    { name: '7(9,#11)', pcs: [0,4,10,2,6] },
    { name: '7(9,b13)', pcs: [0,4,10,2,8] },
    { name: '7(9,13)', pcs: [0,4,10,2,9] },
    { name: '7(b9,#11)', pcs: [0,4,10,1,6] },
    { name: '7(b9,b13)', pcs: [0,4,10,1,8] },
    { name: '7(b9,13)', pcs: [0,4,10,1,9] },
    { name: '7(#9,b13)', pcs: [0,4,10,3,8] },
    { name: '7(#9,13)', pcs: [0,4,10,3,9] },
    { name: '7(#11,13)', pcs: [0,4,10,6,9] },
    // Compact tension voicings (no 5th)
    { name: '7(13)', pcs: [0,4,10,9] },
    { name: 'm7(13)', pcs: [0,3,10,9] },
    { name: '△7(13)', pcs: [0,4,11,9] },
    { name: '7(11)', pcs: [0,4,10,5] },
    { name: 'm7(11)', pcs: [0,3,10,5] },
    { name: '7(9)', pcs: [0,4,10,2] },
    { name: 'm7(9)', pcs: [0,3,10,2] },
    { name: '△7(9)', pcs: [0,4,11,2] },
    // sus chords
    { name: 'sus4', pcs: [0,5,7] },
    { name: 'sus2', pcs: [0,2,7] },
    { name: '7sus4', pcs: [0,5,7,10] },
    { name: '7sus4(9)', pcs: [0,5,7,10,2] },
    { name: '7sus4(9)', pcs: [0,5,10,2] },
    { name: '7sus4(9,13)', pcs: [0,5,7,10,2,9] },
    { name: '7sus4(9,13)', pcs: [0,5,10,2,9] },
    { name: '7sus4(b9)', pcs: [0,5,7,10,1] },
    { name: '7sus4(b9)', pcs: [0,5,10,1] },
    // add chords
    { name: 'add9', pcs: [0,4,7,2] },
    { name: 'madd9', pcs: [0,3,7,2] },
  ];
  tensionChords.forEach(function(c) {
    db.push({ name: c.name, pcs: c.pcs, pcsSet: new Set(c.pcs) });
  });
  return db;
}
var CHORD_DETECT_DB = padBuildChordDetectDB();

var TRIAD_DETECT_DB = [
  { name: 'Maj', pcs: [0,4,7] },
  { name: 'm', pcs: [0,3,7] },
  { name: 'dim', pcs: [0,3,6] },
  { name: 'aug', pcs: [0,4,8] },
  { name: 'sus4', pcs: [0,5,7] },
  { name: 'sus2', pcs: [0,2,7] },
];

var TETRAD_DETECT_DB = [
  { name: '△7', pcs: [0,4,7,11] },
  { name: '7', pcs: [0,4,7,10] },
  { name: 'm7', pcs: [0,3,7,10] },
  { name: 'm△7', pcs: [0,3,7,11] },
  { name: 'm7(b5)', pcs: [0,3,6,10] },
  { name: 'dim7', pcs: [0,3,6,9] },
  { name: '6', pcs: [0,4,7,9] },
  { name: 'm6', pcs: [0,3,7,9] },
  { name: '7sus4', pcs: [0,5,7,10] },
];

// ======== COLOR THEME (Okabe-Ito colorblind-safe) ========

var PAD_THEME_OKABE_ITO = {
  root:     '#E69F00',
  bass:     '#ff9800',
  guide3:   '#009E73',
  guide7:   '#CC79A7',
  tension:  '#56B4E9',
  chord:    '#56B4E9',
  inactive: '#2a2a3e',
  mute:     '#D55E00',
};

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  NOTE_NAMES_SHARP, NOTE_NAMES_FLAT, FLAT_MAJOR_KEYS,
  SCALES, KEY_SPELLINGS,
  BUILDER_QUALITIES, TENSION_ROWS,
  DEGREE_TO_SEMITONE, PC_TO_TENSION_NAME, TENSION_NAME_TO_PC, SCALE_AVAIL_TENSIONS,
  PAD_ROOT_TO_PC, PAD_QUALITY_INTERVALS, PAD_QUALITY_KEYS, PAD_QUALITY_DISPLAY,
  GRID, GRID_32, SCALE_DEGREE_NAMES,
  PAD_INST_COLORS, PAD_GUITAR_TUNING, PAD_GUITAR_NAMES, PAD_BASS_TUNING, PAD_BASS_NAMES,
  padBuildChordDetectDB, CHORD_DETECT_DB, TRIAD_DETECT_DB, TETRAD_DETECT_DB,
  PAD_THEME_OKABE_ITO,
};
