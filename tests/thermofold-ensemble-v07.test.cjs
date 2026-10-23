'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const base=require('../tools/seqfold/thermofold-core.js');
const ens=require('../tools/seqfold/thermofold-ensemble-core.js');
const allowed=new Set(['AU','UA','CG','GC','GU','UG']);
const RT=0.0019872041*310.15;
// Independent brute-force enumeration: interval first-base choices, no reuse
// of the ensemble recursion's dynamic-programming code or energy additions.
function enumerate(seq,i=0,j=seq.length-1){
 if(i>j)return [''];
 const out=enumerate(seq,i+1,j).map(t=>'.'+t);
 for(let k=i+4;k<=j;k++){
  if(!allowed.has(seq[i]+seq[k]))continue;
  const ins=enumerate(seq,i+1,k-1),after=enumerate(seq,k+1,j);
  for(const a of ins)for(const b of after)out.push('('+a+')'+b);
 }
 return out;
}
function exhaustive(seq){
 const structs=enumerate(seq),P=new Map();let Z=0,pairs=0,min=Infinity;
 for(const db of structs){
  let e;try{e=base.evaluateStructure(seq,db).deltaG37Raw;}catch{continue;}
  const w=Math.exp(-e/RT);Z+=w;if(e<min)min=e;
  const st=[];for(let k=0;k<db.length;k++){
   if(db[k]==='(')st.push(k+1);
   if(db[k]===')'){const key=st.pop()+'-'+(k+1);P.set(key,(P.get(key)||0)+w);pairs+=w;}
  }
 }
 for(const [key,v] of P)P.set(key,v/Z);
 return {Z,expectedPairs:pairs/Z,pairProb:P,min,structureCount:structs.length};
}
const approx=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`expected ${expected}, got ${actual}`);
const cases=['AAAAA','GGGAAACCC','GGGAUUCCC','GGGUUACCC','AUGCGCAUUAGU','GAGAAACUCAA','GGGAAAUUUCCC','GGGGAUUUCCCC','GCGCAAAAGCGC','GGGAAAGGGAAACCC'];
for(const seq of cases)test(`partition and base pairs match independently enumerated structures: ${seq}`,()=>{
 const expected=exhaustive(seq),actual=ens.run(seq,{cutoff:0});
 approx(actual.partitionFunction,expected.Z);approx(actual.expectedPairs,expected.expectedPairs);
 for(const [key,p] of expected.pairProb){const [i,j]=key.split('-').map(Number);const got=actual.probabilities.find(x=>x.i===i&&x.j===j);approx(got?.p||0,p);}
 approx(actual.ensembleFreeEnergy,-RT*Math.log(expected.Z));
 approx(actual.mfeDeltaG,Math.round(expected.min*100)/100,1e-2);
 assert.ok(actual.unpairedProbability.every(x=>x>=0&&x<=1+1e-8));
});
test('strictly errors on invalid sequence and invalid cutoff',()=>{
 assert.throws(()=>ens.run('NNNN'));assert.throws(()=>ens.run('A'.repeat(111)));assert.throws(()=>ens.run('GGGAAACCC',{cutoff:2}));
});
