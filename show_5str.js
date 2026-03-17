var t = require('./theory.js');
var tuning = [64, 59, 55, 50, 45, 40];
var ivNames = ['R','b9','9','b3','3','11','b5','5','#5','6/13','b7','7'];

function show(label, pcs, root, opts) {
  if (!opts) opts = {};
  opts.maxResults = opts.maxResults || 20;
  var forms = t.padEnumGuitarChordForms(pcs, root, tuning, 14, 5, opts);
  console.log('--- ' + label + ' (total: ' + forms.length + ') ---');
  for (var i = 0; i < Math.min(12, forms.length); i++) {
    var f = forms[i];
    var tab = [], ivs = [];
    for (var s = 5; s >= 0; s--) {
      if (f.frets[s] !== null) {
        var diff = (((tuning[s] + f.frets[s]) % 12) - root + 12) % 12;
        tab.push(f.frets[s]);
        ivs.push(ivNames[diff]);
      } else { tab.push('x'); ivs.push('x'); }
    }
    console.log('  #' + (i+1) + ' [' + tab.join(', ') + ']  ' + ivs.join('-') + '  fU=' + f.fingerUnits);
  }
  console.log('');
}

// C6/9: C=0, PCS=[0,4,7,9,14] (R-3-5-6-9)
show('C6/9', [0,4,7,9,14], 0);
show('C6/9 (fifthOpt)', [0,4,7,9,14], 0, { fifthOptional: true });

// G6/9: G=7
show('G6/9', [0,4,7,9,14], 7);
show('G6/9 (fifthOpt)', [0,4,7,9,14], 7, { fifthOptional: true });

// D6/9: D=2
show('D6/9', [0,4,7,9,14], 2);

// Check: does guideToneBonus apply? 6/9 has 3rd but no 7th
// → guideToneBonus requires BOTH 3rd AND 7th → won't apply to 6/9
console.log('--- Note: 6/9 has no 7th, so guideToneBonus=0 ---');
