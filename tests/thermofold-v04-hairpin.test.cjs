'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const core=require('../tools/seqfold/thermofold-core.js');
const v=(sequence)=>core.hairpinTerms(sequence,0,sequence.length-1);
test('Turner 2004 special CGAG tetraloop uses its documented 3.5 kcal/mol loop energy',()=>{
 const r=v('CCGAGG'); assert.equal(r.energy,3.5);assert.match(r.method,/experimental special-loop/);
 assert.equal(core.evaluateStructure('CCGAGG','(....)').deltaG37,3.5);
});
test('three-C loop: Turner C3 penalty is +1.5 kcal/mol',()=>{
 assert.equal(v('GCCCC').energy,6.9);
 assert.equal(core.evaluateStructure('GCCCC','(...)').deltaG37,6.9);
});
test('all-C six-nt loop: documented initiation plus (0.3 n +1.6) penalty',()=>{
 assert.equal(+v('GCCCCCCC').energy.toFixed(2),8.8);
});
test('documented terminal first mismatch bonuses are sequence sensitive',()=>{
 const base=v('GAAAAAC'), uu=v('GUAAUUC'), gg=v('GGAAAGC'), ga=v('GGAAGAC');
 // compare matched length: 5-base loops for each case
 assert.equal(base.energy,5.7); assert.equal(uu.energy,4.8);
 assert.equal(gg.energy,4.9);assert.equal(ga.energy,4.8);
});
test('hairpin calculations preserve MFE and independent reconstruction agreement',()=>{
 for(const s of ['GGGAAACCC','GGGAAAACCC','GCGGUUUACGC','CCGAGG','GCCCC','GCCCCCCC','GGGGGGAAGCGAAACGCAAAAGGGAAACCCAACCCCCC']){
  const r=core.fold(s),other=core.evaluateStructure(s,r.dotBracket);
  assert.equal(r.deltaG37,other.deltaG37,s);
  assert.ok(Array.isArray(r.hairpinDetails));
  assert.ok(r.warnings.some(w=>/NOT|not/.test(w)));
 }
});
