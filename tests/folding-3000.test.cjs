'use strict';
const assert=require('node:assert/strict');const path=require('node:path');const root=path.join(__dirname,'..');
const core=require('../tools/seqfold/core.js');const precision=require('../tools/seqfold/precision-core.js');const dbtl=require('../tools/construct-studio/dbtl-core.js');
const rna=('GCGCUUUAGCGC'+ 'AUGGCUAACGUAAGCGCCUA').repeat(94).slice(0,3000);
function validStructure(r, n, expectedTile){
 assert.equal(r.sequence.length,n);assert.equal(r.dotBracket.length,n);
 assert.ok(Array.isArray(r.windows));assert.equal(r.windows[0].start,1);assert.equal(r.windows.at(-1).end,n);
 assert.equal(r.windows.length,Math.ceil(n/expectedTile));
 assert.equal(r.pairCount,r.pairs.length);
 const stack=[],pairIds=[];
 for(let i=0;i<n;i++){
  const ch=r.dotBracket[i];if(ch==='(')stack.push(i+1);else if(ch===')'){assert.ok(stack.length);pairIds.push([stack.pop(),i+1]);}else assert.equal(ch,'.');
 }
 assert.equal(stack.length,0);assert.deepEqual(pairIds.sort((a,b)=>a[0]-b[0]),r.pairs);
 for(const [a,b] of r.pairs){assert.equal(Math.floor((a-1)/expectedTile),Math.floor((b-1)/expectedTile),'No long range window pairing claimed')}
}
const begin=performance.now();
const c=core.foldNussinov(rna);validStructure(c,3000,250);assert.equal(c.energyKcal,null);
const p=precision.foldEnergy(rna);validStructure(p,3000,200);assert.equal(p.maxLength,3000);
const d=dbtl.foldLocal(rna,core);validStructure(d,3000,250);
const win=dbtl.inputWindow(rna,1,3000);assert.equal(win.end,3000);
assert.throws(()=>core.foldNussinov(rna+'A'),/3,000/);
assert.throws(()=>precision.foldEnergy(rna+'A'),/3,000/);
assert.throws(()=>dbtl.foldLocal(rna+'A',core),/3000/);
assert.throws(()=>dbtl.inputWindow(rna,1,3001),/3,000/);
const small=core.foldNussinov('GCGCUUUAGCGC');assert.equal(small.mode,'single-window');assert.equal(small.windows,undefined);
const short=precision.foldEnergy('GCGCUUUAGCGC');assert.equal(short.mode,'single-window');assert.equal(short.windows,undefined);
// Test breakpoint exact 220/221, 350/351
assert.equal(precision.foldEnergy(rna.slice(0,220)).mode,'single-window');
assert.equal(precision.foldEnergy(rna.slice(0,221)).mode,'independent-windows');
assert.equal(core.foldNussinov(rna.slice(0,350)).mode,'single-window');
assert.equal(core.foldNussinov(rna.slice(0,351)).mode,'independent-windows');
console.log(`PASS: all 3,000-nt windowed fold checks and boundary validation (${Math.round(performance.now()-begin)} ms)`);
