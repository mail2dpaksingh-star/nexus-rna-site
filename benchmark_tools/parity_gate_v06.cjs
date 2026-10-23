#!/usr/bin/env node
'use strict';
/* Scientific validation gate: does NOT compute a full ViennaRNA model. */
const fs=require('node:fs');
const T=require('../tools/seqfold/thermofold-core.js');
const B=require('../tools/seqfold/thermofold-benchmark-core.js');
const source=process.argv[2],dest=process.argv[3]||'thermofold_v06_parity_report.json';
if(!source){console.error('Usage: node benchmark_tools/parity_gate_v06.cjs external_rnafold_records.json [report.json]');process.exit(2);}
let report={status:'BLOCKED',reason:'Reference data missing or incomplete',minimumCases:125, scientificUse:'NOT QUALIFIED'};
try {
const input=JSON.parse(fs.readFileSync(source,'utf8'));
if(!Array.isArray(input)||input.length<125) throw Error('Require >=125 independently computed reference records.');
const ids=new Set();const rows=[];const versions=new Set();
for (const row of input){const r=B.validateRecord(row);if(ids.has(r.id))throw Error('Duplicate record ID: '+r.id);ids.add(r.id);
 if(!/viennarna.*rnafold/i.test(r.source)||!/RNAfold\s+\d/.test(r.source_version))throw Error('Missing authentic RNAfold version and source metadata.');
 if(r.provenance_type!=='independently_executed_RNAfold')throw Error('Reference provenance is not recorded as independently executed.');
 if(!r.options.includes('-d2')||!(/37|temp=37/.test(r.options)))throw Error('Model setting mismatch; require dangles=2 and 37°C.');
 if(!r.reference_structure||r.reference_dg===null)throw Error('Missing MFE structure or energy for '+r.id);
 versions.add(r.source_version);rows.push(B.compareRecord(r,T.fold(r.sequence)));
}
if(versions.size!==1)throw Error('Version mismatch between reference records.');
const stats=B.summarize(rows);
report={status:'EVALUATED_NOT_CERTIFIED',referenceVersion:[...versions][0],modelVersion:T.VERSION,records:rows.length,metrics:stats,
 provisionalNumericalTargets:{maeAtMostKcalMol:0.5,pairF1AtLeast:0.95,exactStructureAtLeast:0.90},
 provisionalTargetsMet:stats.maeKcalMol<=0.5&&stats.meanPairF1>=0.95&&stats.exactStructureFraction>=0.9,
 scientificUse:'RESEARCH ONLY; external computational agreement does not establish experimentally validated RNA structure prediction.',
 validationGaps:['RNAstructure reference independent', 'experimental structure comparison', 'complete Turner parameters', 'matched settings beyond dangles/temperature']};
} catch (e){report.reason=String(e.message);}
fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(report.status,report.reason||report.metrics);if(report.status==='BLOCKED'||!report.provisionalTargetsMet)process.exitCode=2;
