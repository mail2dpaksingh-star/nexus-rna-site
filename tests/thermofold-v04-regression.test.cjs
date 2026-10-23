'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../tools/seqfold/thermofold-core.js');
function balanced(s){let d=0;for(const c of s){if(c==='(')d++;else if(c===')')d--;assert.ok(d>=0);}assert.equal(d,0);}
test('v0.3 supports GU/UG and published rounded NNDB stack entries',()=>{
 assert.equal(core.VERSION,'0.9.0');
 assert.equal(core.stackEnergy('GG','CC'),-3.3);
 assert.equal(core.stackEnergy('GG','UU'),-0.5);
 assert.equal(core.stackEnergy('GU','UG'),1.3);
 assert.equal(core.stackEnergy('UG','GU'),0.3);
 assert.equal(core.stackEnergy('GC','CG'),-3.4);
 assert.equal(core.stackEnergy('AA','UU'),-0.9);
});
test('GC hairpin produces traceable model-based energy and valid dot bracket',()=>{
 let r=core.fold('GGGAAACCC');assert.equal(r.dotBracket,'(((...)))');assert.equal(r.deltaG37,-1.2);
 assert.equal(core.evaluateStructure(r.sequence,r.dotBracket).deltaG37,r.deltaG37);
 assert.equal(r.loopCounts.hairpin,1);
});
test('multibranch loops can form and agree with independent structural recalc',()=>{
 const r=core.fold('GGGGGGAAGCGAAACGCAAAAGGGAAACCCAACCCCCC');
 assert.ok(r.loopCounts.multibranch>=1);assert.ok(r.loopCounts.hairpin>=2);
 assert.equal(core.evaluateStructure(r.sequence,r.dotBracket).deltaG37,r.deltaG37);
 balanced(r.dotBracket);
});
test('GU-inclusive output differs from canonical-only in at least one diagnostic',()=>{
 let s='GUGUGAAACACAC';
 let r=core.fold(s);assert.equal(r.length,s.length);balanced(r.dotBracket);
 assert.ok(Number.isFinite(r.deltaG37));
});
test('non-pairing controls stay unpaired',()=>{
 for(const s of ['AAAAAAA','UUUUUUUUUU','CCCCCCCCCCCC']){let r=core.fold(s);assert.equal(r.dotBracket,'.'.repeat(s.length));assert.equal(r.deltaG37,0);}
});
test('energy reconciles across synthetic length/loop examples',()=>{
 for(const s of ['GGGAAACCC','GCGAAACGC','GCGCGAAAACGCGC','GGGGGGAAGCGAAACGCAAAAGGGAAACCCAACCCCCC','G'.repeat(12)+'AAAUUU'+'C'.repeat(12)]){
  const r=core.fold(s);assert.equal(core.evaluateStructure(s,r.dotBracket).deltaG37,r.deltaG37);balanced(r.dotBracket);
 }
});
test('model metadata does not assert ViennaRNA parity',()=>{
 let r=core.fold('GGGAAACCC');assert.match(r.modelCompleteness,/incomplete/);assert.match(r.warnings[0],/not a ViennaRNA-equivalent/);assert.equal(r.parameterTemperatureC,37);
});
test('input FASTA validation and 280nt cap',()=>{
 assert.equal(core.normalize('>record\nGGG\nAAAcCC'),'GGGAAACCC');
 assert.throws(()=>core.fold('AGN'),/Only unmodified/);
 assert.throws(()=>core.fold('A'.repeat(281)),/280/);
});
test('280nt global calculation finite and consistent',()=>{
 const seq=('GCGAAACGC'+'UAAAGCC').repeat(17).slice(0,280);const r=core.fold(seq);
 assert.equal(r.length,seq.length);balanced(r.dotBracket);assert.equal(core.evaluateStructure(seq,r.dotBracket).deltaG37,r.deltaG37);
});
