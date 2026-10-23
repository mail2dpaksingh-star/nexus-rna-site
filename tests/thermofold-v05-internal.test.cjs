'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const f=require('../tools/seqfold/thermofold-core.js');
function build(l,r,outer='GC',inner='AU',left='A'.repeat(l),right='A'.repeat(r)){
 const s=outer[0]+left+inner[0]+'AAA'+inner[1]+right+outer[1];
 const i=0,p=1+l,q=p+4,j=s.length-1;
 return {s,i,j,p,q,structure:'('+'.'.repeat(l)+'('+'...'+')'+'.'.repeat(r)+')'};
}
test('version 0.5 and explicit incomplete-model metadata',()=>{
 assert.equal(f.VERSION,'0.9.0');
 const r=f.modelInfo();assert.match(r.modelCompleteness,/incomplete/);
 assert.ok(r.warnings.some(w=>/lookup|tables/i.test(w)));
});
test('Turner generic 1x5 initiation, 0.6 asymmetry, and AU 0.7 closure',()=>{
 let x=build(1,5,'GC','AU');let r=f.internalLoopTerms(x.s,x.i,x.j,x.p,x.q);
 assert.ok(Math.abs(r.energy-5.1)<1e-10); // 2.0 + 0.6*4 + 0.7, no mismatch bonuses
 assert.equal(r.terms.some(t=>/terminal mismatch/.test(t.name)),false);
 assert.equal(r.method.includes('zero-mismatch'),true);
});
test('two AU/GU closing pairs add a separately auditable 0.7 kcal/mol apiece',()=>{
 let x=build(1,5,'GU','UA');let r=f.internalLoopTerms(x.s,x.i,x.j,x.p,x.q);
 assert.ok(Math.abs(r.energy-5.8)<1e-10); // 2 + 2.4 + 1.4
 assert.equal(r.terms.filter(t=>/closure/.test(t.name)).length,2);
});
test('three-by-three generic mismatch rules apply on both loop boundaries',()=>{
 const x=build(3,3,'GC','CG','AGG','AAA');
 // outer A(left) + G(right) gives AG bonus -0.8; inner has no bonus
 let r=f.internalLoopTerms(x.s,x.i,x.j,x.p,x.q);
 assert.ok(Math.abs(r.energy-1.2)<1e-10); // 2.0 - 0.8 AG
 assert.ok(r.terms.some(t=>t.name==='AG terminal mismatch'));
});
test('two-by-three GG/UU selected bonuses are explicitly partial',()=>{
 const x=build(2,3,'GC','CG','GA','AAG');
 let r=f.internalLoopTerms(x.s,x.i,x.j,x.p,x.q);
 assert.match(r.method,/partial/i);
 assert.equal(r.left,2);assert.equal(r.right,3);
});
test('internal loop structure evaluator matches reported decomposed terms',()=>{
 for(const [l,r,outer,inner] of [[1,5,'GC','AU'],[3,3,'GC','CG'],[2,3,'GU','CG'],[4,4,'GC','GU']]){
  const x=build(l,r,outer,inner);
  const score=f.evaluateStructure(x.s,x.structure);
  assert.equal(score.loopCounts.internal,1);
  assert.equal(score.internalDetails.length,1);
  assert.equal(score.internalDetails[0].energy,Math.round(f.internalLoopTerms(x.s,x.i,x.j,x.p,x.q).energy*100)/100);
  assert.ok(Number.isFinite(score.deltaG37));
 }
});
test('MFE dynamic programming still reconciles with independent structure-scoring recursion',()=>{
 for(const s of ['GGGAAACCC','GGGGGGAAGCGAAACGCAAAAGGGAAACCCAACCCCCC','GCAAAACGUAGUACGACAGUGGUUCCAAGGCAU','GGUGAAAUACCC']){
  let r=f.fold(s),v=f.evaluateStructure(s,r.dotBracket);
  assert.equal(r.deltaG37,v.deltaG37);
  assert.deepEqual(r.internalDetails,v.internalDetails);
 }
});
