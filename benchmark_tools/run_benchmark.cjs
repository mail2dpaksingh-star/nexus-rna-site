#!/usr/bin/env node
/* Generate honest NEXUS-versus-reference comparison report. */
'use strict';const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'), TF=require(path.join(root,'tools/seqfold/thermofold-core.js'));
const B=require(path.join(root,'tools/seqfold/thermofold-benchmark-core.js'));
const [,,source,dest='nexus_benchmark_results.json']=process.argv;
if(!source){console.error('Usage: node benchmark_tools/run_benchmark.cjs reference.json [report.json]');process.exit(2);}
try{
 const records=JSON.parse(fs.readFileSync(source,'utf8'));if(!Array.isArray(records)||!records.length)throw Error('Expected a nonempty JSON array');
 const rows=records.map(x=>{const r=B.validateRecord(x);const pred=TF.fold(r.sequence);return B.compareRecord(r,pred);});
 const report={reportVersion:B.VERSION,engineVersion:TF.VERSION,createdAtUTC:new Date().toISOString(),records:rows,summary:B.summarize(rows),
  disclaimer:'Reference predictor agreement is NOT experimental structure accuracy; NEXUS and ViennaRNA use unequal energy models.'};
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 const csv=dest.replace(/\.json$/i,'')+'.csv';fs.writeFileSync(csv,B.rowsCSV(rows));
 console.log(JSON.stringify(report.summary,null,2));console.log('Written',dest,csv);
}catch(e){console.error(e.message);process.exit(1);}
