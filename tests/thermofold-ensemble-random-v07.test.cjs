'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../tools/seqfold/thermofold-core.js'),E=require('../tools/seqfold/thermofold-ensemble-core.js');
const RT=.0019872041*310.15,possible=new Set(['AU','UA','GC','CG','GU','UG']);
let rng=20261022;function random(){rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;}
function enumDot(s,i=0,j=s.length-1){if(i>j)return [''];let result=enumDot(s,i+1,j).map(x=>'.'+x);
 for(let k=i+4;k<=j;k++)if(possible.has(s[i]+s[k]))for(const a of enumDot(s,i+1,k-1))for(const b of enumDot(s,k+1,j))result.push('('+a+')'+b);
 return result;}
const close=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-9),`Observed ${a}, expected ${b}`);
test('40 seeded randomized reference enumerations match partition Z and pair marginals',()=>{
 for(let testIdx=0;testIdx<40;testIdx++){
  const n=8+Math.floor(random()*6);let s='';for(let i=0;i<n;i++)s+='ACGU'[Math.floor(random()*4)];
  const all=enumDot(s);let z=0,num=0;const ps=new Map();
  for(const db of all){let energy;try{energy=model.evaluateStructure(s,db).deltaG37Raw;}catch{continue;}
   const w=Math.exp(-energy/RT);z+=w;const stack=[];
   for(let i=0;i<db.length;i++){if(db[i]==='(')stack.push(i+1);else if(db[i]===')'){
     const name=stack.pop()+'-'+(i+1);ps.set(name,(ps.get(name)||0)+w);num+=w;
   }}
  }
  const got=E.run(s,{cutoff:0});close(got.partitionFunction,z);close(got.expectedPairs,num/z);
  for(const [pair,p] of ps){const [a,b]=pair.split('-').map(Number),found=got.probabilities.find(q=>q.i===a&&q.j===b);close(found?.p||0,p/z);}
 }
});
test('110 nucleotide limit produces finite distribution',()=>{
 let s='';for(let i=0;i<110;i++)s+='ACGU'[(i*7+Math.floor(i/5))%4];
 let r=E.run(s,{cutoff:.03});assert.equal(r.length,110);assert.ok(Number.isFinite(r.partitionFunction));
 assert.ok(r.unpairedProbability.every(x=>x>=0&&x<=1));assert.ok(r.mfeProbability>=0&&r.mfeProbability<=1);
});
