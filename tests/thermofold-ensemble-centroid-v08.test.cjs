'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const ensemble=require('../tools/seqfold/thermofold-ensemble-core.js');
const fold=require('../tools/seqfold/thermofold-core.js');
const pairs=new Set(['AU','UA','CG','GC','GU','UG']);
const RT=0.0019872041*310.15;
function enumerate(seq,i=0,j=seq.length-1){
 if(i>j)return [''];
 const out=enumerate(seq,i+1,j).map(t=>'.'+t);
 for(let k=i+4;k<=j;k++)if(pairs.has(seq[i]+seq[k]))
  for(const inside of enumerate(seq,i+1,k-1))for(const after of enumerate(seq,k+1,j))
    out.push('('+inside+')'+after);
 return out;
}
function pairSet(db){const stack=[],set=new Set();for(let i=0;i<db.length;i++){
 if(db[i]==='(')stack.push(i+1);
 if(db[i]===')')set.add(stack.pop()+'-'+(i+1));
}return set;}
function diff(a,b){let count=0;for(const v of a)if(!b.has(v))count++;for(const v of b)if(!a.has(v))count++;return count;}
function approx(a,b,tol=1e-7){assert.ok(Math.abs(a-b)<tol,`actual ${a} expected ${b}`);}
for(const seq of ['GGGAAACCC','GGGAUUCCC','GGGAAAUUUCCC','AUGCGCAUUAGU','GCGCAAAAGCGC']){
 test('centroid/ensemble expected pair distance agrees with exhaustive independent enumeration: '+seq,()=>{
  const all=[];let z=0;
  for(const db of enumerate(seq)){
   let energy;try{energy=fold.evaluateStructure(seq,db).deltaG37Raw;}catch{continue;}
   const w=Math.exp(-energy/RT);all.push({db,set:pairSet(db),w});z+=w;
  }
  const r=ensemble.run(seq,{cutoff:0});
  const centroidSet=pairSet(r.centroidStructure),mfeSet=pairSet(r.mfeStructure);
  const expectCentroid=all.reduce((v,x)=>v+x.w/z*diff(centroidSet,x.set),0);
  const expectMfe=all.reduce((v,x)=>v+x.w/z*diff(mfeSet,x.set),0);
  const expectDiversity=all.reduce((v,x)=>v+x.w/z*all.reduce((t,y)=>t+y.w/z*diff(x.set,y.set),0),0);
  approx(r.centroidExpectedDistance,expectCentroid);
  approx(r.mfeExpectedDistance,expectMfe);
  approx(r.expectedEnsemblePairDistance,expectDiversity);
  // Centroid is optimal for this small valid-structure test set.
  let minDistance=Infinity;
  for(const x of all){const d=all.reduce((v,y)=>v+y.w/z*diff(x.set,y.set),0);if(d<minDistance)minDistance=d;}
  approx(expectCentroid,minDistance,1e-6);
  assert.ok(r.centroidExpectedDistance<=r.mfeExpectedDistance+1e-8);
  assert.equal(r.centroidStructure.length,seq.length);
  assert.equal(r.centroidPairs.length,centroidSet.size);
 });
}
test('threshold filtering does not affect centroid or structural distances',()=>{
 const a=ensemble.run('GGGAAAUUUCCC',{cutoff:0}),b=ensemble.run('GGGAAAUUUCCC',{cutoff:0.9});
 assert.equal(a.centroidStructure,b.centroidStructure);
 approx(a.expectedEnsemblePairDistance,b.expectedEnsemblePairDistance);
 approx(a.centroidExpectedDistance,b.centroidExpectedDistance);
});
test('per-structure parameter audit distinguishes incomplete parameter use from model accuracy',()=>{
 const a=fold.fold('GGGAAACCC');
 assert.equal(a.parameterAudit.externalValidation.startsWith('NOT COMPLETED'),true);
 assert.ok(a.parameterAudit.flags.some(x=>x.part.includes('hairpin')));
 assert.ok(a.parameterAudit.summary.partial>=1);
});
