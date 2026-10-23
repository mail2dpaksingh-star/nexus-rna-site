'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {fold}=require('../tools/seqfold/thermofold-core.js');
const layout=require('../tools/seqfold/thermofold-layout.js');

test('hairpin figure shows every base and paired bonds',()=>{
 const r=fold('GGGAAACCC');
 const v=layout.render(r);
 assert.equal(v.componentCount,1);
 assert.equal(v.hiddenExterior,0);
 assert.match(v.svg,/Stem-loop 1/);
 assert.equal((v.svg.match(/<circle /g)||[]).length,9);
 assert.equal((v.svg.match(/stroke-dasharray="3 5"/g)||[]).length,r.pairCount);
 assert.match(v.svg,/aria-label="RNA secondary structure shown as conventional stem-loop/);
 assert.equal(r.deltaG37,-1.2);
});

test('base pair coordinates agree with dot-bracket structure',()=>{
 const s='GCGAAACGC'; const r=fold(s);
 const {roots,nodes}=layout.parsePairs(r);
 assert.equal(nodes.length,r.pairCount);
 assert.equal(roots.length,1);
 const g=layout.componentCoordinates(roots[0],r.sequence);
 assert.deepEqual(g.pairs,r.pairs);
 assert.equal(g.coords.size,s.length);
 for(const p of g.coords.values()){assert.ok(Number.isFinite(p.x));assert.ok(Number.isFinite(p.y));}
});

test('unpaired full RNA stays visible',()=>{
 const s='A'.repeat(65),r=fold(s),v=layout.render(r);
 assert.equal(v.componentCount,0);
 assert.equal((v.svg.match(/<circle /g)||[]).length,s.length);
});

test('exterior segments are accounted for and never assigned fake pairs',()=>{
 const r=fold('AAAAGGGAAACCCAAAA');
 const v=layout.render(r);
 assert.equal(v.componentCount,1);
 assert.equal(v.hiddenExterior,8);
 assert.equal((v.svg.match(/<circle /g)||[]).length,9);
});

test('multiple exterior stem-loops render independently',()=>{
 const r={sequence:'GGGAAACCCAAAAAAAAAGGGAAACCC',dotBracket:'(((...))).........(((...)))'},v=layout.render(r);
 assert.equal(v.componentCount,2);
 assert.match(v.svg,/Stem-loop 2/);
 assert.equal((v.svg.match(/<circle /g)||[]).length,18);
});

test('invalid bracket structures rejected',()=>{
 assert.throws(()=>layout.parsePairs({sequence:'ACGU',dotBracket:'((..'}),/Unbalanced/);
 assert.throws(()=>layout.parsePairs({sequence:'ACGU',dotBracket:')...'}),/Unbalanced/);
});
test('branched folds render as truthful arc diagrams instead of malformed hairpins',()=>{
 const r=fold('GGGGGGAAGCGAAACGCAAAAGGGAAACCCAACCCCCC');
 assert.ok(r.loopCounts.multibranch>0);
 const v=layout.render(r);
 assert.equal(v.branched,true);
 assert.equal(v.arcPairs,r.pairCount);
 assert.match(v.svg,/Branched RNA: sequence-ordered base-pair arc diagram/);
 assert.equal((v.svg.match(/<circle /g)||[]).length,r.length);
});
