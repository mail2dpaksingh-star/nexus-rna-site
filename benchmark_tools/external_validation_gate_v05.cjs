#!/usr/bin/env node
/* Gate for an actual independent reference study, not a synthetic-data pass. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const bench=require(path.join(root,'tools/seqfold/thermofold-benchmark-core.js'));
const tf=require(path.join(root,'tools/seqfold/thermofold-core.js'));
const args=process.argv.slice(2);const refs=args[0], dest=args[1]||'thermofold_v05_external_gate.json';
const cases=JSON.parse(fs.readFileSync(path.join(root,'tools/seqfold/benchmarks/challenge_cases.json'),'utf8'));
const eligibleKinds=new Set(['independently_executed_RNAfold','independently_executed_RNAstructure']);
const expected=new Map(cases.map(c=>[c.id,c.sequence]));
const report={product:'NEXUS ThermoFold',engineVersion:tf.VERSION,createdAtUTC:new Date().toISOString(),
 benchmarkDesign:'125 predefined challenge sequences',expectedCases:cases.length,
 status:'NOT VALIDATED',referenceProvenanceVerified:false,
 warnings:['Declared reference provenance cannot itself certify that results were independently produced.',
 'Agreement with another predictor is not agreement with experimentally measured RNA structures.',
 'Restricted NEXUS model and external software may use non-equivalent energy settings.'],
 metrics:null,missingIds:[],invalidRecords:[]};
function write(){fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(report.status+' — '+report.invalidRecords.length+' invalid references; '+report.missingIds.length+' missing; output '+dest);}
if(!refs||!fs.existsSync(refs)){
 report.status='BLOCKED: independently generated references not supplied';
 report.missingIds=[...expected.keys()];write();process.exitCode=2;
}else{
 let data;try{data=JSON.parse(fs.readFileSync(refs,'utf8'));if(!Array.isArray(data))throw Error('Reference input must be array');}
 catch(e){report.invalidRecords.push(e.message);report.status='BLOCKED: invalid JSON';write();process.exit(2);}
 const valid=new Map();
 for(const item of data){try{
  const x=bench.validateRecord(item);
  if(!expected.has(x.id)||expected.get(x.id)!==x.sequence)throw Error('ID or sequence does not match frozen challenge manifest');
  if(!eligibleKinds.has(x.provenance_type))throw Error('Independently executed reference provenance required');
  if(x.reference_structure.length!==x.sequence.length||x.reference_dg===null)throw Error('Must provide both structure and ΔG');
  if(valid.has(x.id))throw Error('Duplicate reference ID');
  valid.set(x.id,x);
 }catch(e){report.invalidRecords.push({id:String(item?.id||''),reason:e.message});}}
 report.missingIds=[...expected.keys()].filter(id=>!valid.has(id));
 if(report.invalidRecords.length||report.missingIds.length){report.status='BLOCKED: external reference set incomplete or invalid';write();process.exitCode=2;}
 else{
  const rows=cases.map(x=>bench.compareRecord(valid.get(x.id),tf.fold(x.sequence)));
  report.status='COMPARISON COMPLETED — SCIENTIFIC VALIDATION STILL PENDING';
  report.metrics=bench.summarize(rows);report.referenceSetSHA256=crypto.createHash('sha256').update(fs.readFileSync(refs)).digest('hex');
  report.referenceProvenanceVerified=false;
  report.note='Independent reference *declarations* are present; audit and reproduction in separate environments remain required.';
  write();
 }
}
