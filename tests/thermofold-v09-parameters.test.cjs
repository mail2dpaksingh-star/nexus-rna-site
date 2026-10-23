'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const f=require('../tools/seqfold/thermofold-core.js');
const makePack=(t={})=>({schemaVersion:'nexus-turner-pack-v1',temperatureC:37,units:'kcal/mol',source:{name:'SYNTHETIC TEST DATA — NOT PUBLISHED',url:'https://example.org/test',version:'fixture-only'},tables:t});
test('Partial parameter packs are never labeled complete',()=>{
 const info=f.validateParameterPack(makePack({int11:{'GC|CG|A|A':-8.3}}));
 assert.equal(info.complete,false);assert.equal(info.summary.int11.loaded,1);
 assert.equal(info.summary.int11.expected,576);
});
test('Invalid values and malformed lookup keys are rejected',()=>{
 assert.throws(()=>f.validateParameterPack(makePack({int11:{'GC|CG|A|A':null}})),/Nonfinite/);
 assert.throws(()=>f.validateParameterPack(makePack({int11:{'GC|CG|AAA|A':-2}})),/Invalid internal-loop key/);
 assert.throws(()=>f.validateParameterPack(makePack({int11:{'AA|CG|A|A':-2}})),/Invalid internal-loop/);
});
test('Imported specialized internal loop overrides fallback, and can be cleared',()=>{
 const seq='GACAAAGAC'; const before=f.internalLoopTerms(seq,0,seq.length-1,2,6);
 const info=f.setParameterPack(makePack({int11:{'GC|CG|A|A':-8.3}}));
 assert.equal(info.complete,false);
 const after=f.internalLoopTerms(seq,0,seq.length-1,2,6);
 assert.equal(after.energy,-8.3);assert.match(after.method,/imported/);
 const folded=f.fold(seq);assert.ok(Math.abs(f.evaluateStructure(seq,folded.dotBracket).deltaG37Raw-folded.deltaG37)<.01);
 f.setParameterPack(null);assert.equal(f.internalLoopTerms(seq,0,seq.length-1,2,6).energy,before.energy);
});
test('Exterior two-sided mismatch takes precedence over two individual dangles when loaded',()=>{
 f.setParameterPack(makePack({dangle5:{'GC|A':-0.2},dangle3:{'GC|A':-0.4},terminalMismatch:{'GC|A|A':-0.5}}));
 const r=f.fold('AGGGAAACCCA');assert.equal(r.externalEndEnergy,-0.5);
 assert.equal(f.evaluateStructure(r.sequence,r.dotBracket).deltaG37,r.deltaG37);
 f.setParameterPack(null);
});
test('Real external tools are not inferred from local tests',()=>{
 assert.match(f.modelInfo().modelCompleteness,/incomplete/i);
 assert.match(f.modelInfo().warnings.join(' '),/independent/i);
});
