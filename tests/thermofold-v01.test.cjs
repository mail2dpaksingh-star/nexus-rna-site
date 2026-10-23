'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const {fold,normalize,MAX,stackEnergy}=require('../tools/seqfold/thermofold-core-v01.js');
function checkBalanced(db){let depth=0;for(const c of db){if(c==='(')depth++;if(c===')')depth--;assert.ok(depth>=0);}assert.equal(depth,0);}
test('published GC/GC canonical stacking values',()=>{assert.equal(stackEnergy('GG','CC'),-3.26);assert.equal(stackEnergy('GC','CG'),-3.42);});
test('9nt hairpin hand calculation ∆G=5.4-2×3.26',()=>{const r=fold('GGGAAACCC');assert.equal(r.dotBracket,'(((...)))');assert.equal(r.deltaG37,-1.12);assert.equal(r.pairCount,3);});
test('all A unpaired and no spurious negative fold',()=>{let r=fold('AAAAAAAAAAAA');assert.equal(r.deltaG37,0);assert.equal(r.dotBracket,'.'.repeat(12));});
test('FASTA normalization and DNA to RNA',()=>{assert.equal(normalize('>id\nggg\nAAAtcc\n'),'GGGAAAUCC');});
test('invalid bases and overlength rejected',()=>{assert.throws(()=>fold('AXU'),/Only unmodified/);assert.throws(()=>fold('A'.repeat(MAX+1)),/supports up to/);});
test('deterministic, balanced dot-bracket and pair count',()=>{for(const s of ['GCGAAACGC','GGGAAAAACCC','CGCGAAAUUCGCG','GCGCGCGAAAAAGCGCGC']){const r=fold(s);checkBalanced(r.dotBracket);assert.equal((r.dotBracket.match(/\(/g)||[]).length,r.pairCount);assert.deepEqual(fold(s),r);}});
test('mixed motifs and medium-length synthetic input',()=>{const r=fold(('GCGAAACGC'+'UAAAGCC').repeat(8));assert.ok(Number.isFinite(r.deltaG37));assert.equal(r.length,128);checkBalanced(r.dotBracket);});
test('model metadata cannot be mistaken for ViennaRNA',()=>{let r=fold('GGGAAACCC');assert.match(r.modelCompleteness,/incomplete/);assert.match(r.warnings[0],/not a ViennaRNA/);assert.equal(r.parameterTemperatureC,37);});
