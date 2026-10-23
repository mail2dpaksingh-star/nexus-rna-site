#!/usr/bin/env node
/* Run independent NEXUS v0.9 predictions; deliberately NOT an external accuracy benchmark. */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const casesFile=path.join(root,'tools/seqfold/benchmarks/challenge_cases.json');
const cases=JSON.parse(fs.readFileSync(casesFile,'utf8'));
const TF=require(path.join(root,'tools/seqfold/thermofold-core.js'));
if(cases.length!==125)throw Error('Exactly 125 input cases required');
const out=[],t0=Date.now();
for (const c of cases){
  const start=Date.now();
  try{
    const result=TF.fold(c.sequence);
    const st=result.structure||result.dotBracket||result.dot_bracket;
    const dg=result.deltaG37??result.dg??result.energy??result.mfe;
    if(typeof st!=='string'||!Number.isFinite(dg)||st.length!==c.sequence.length)throw Error('Invalid calculation output '+JSON.stringify(Object.keys(result)));
    out.push({id:c.id,length:c.sequence.length,sequence:c.sequence,structure:st,dg,elapsed_ms:Date.now()-start,status:'NEXUS_RESTRICTED_MODEL'});
  }catch(e){out.push({id:c.id,length:c.sequence.length,error:e.message,elapsed_ms:Date.now()-start,status:'FAILED'});}
}
const hash=crypto.createHash('sha256').update(fs.readFileSync(casesFile)).digest('hex');
const base={kind:'INTERNAL_BASELINE_NOT_EXTERNAL_BENCHMARK',engine_version:TF.VERSION,cases_sha256:hash,
  n_cases:out.length,n_success:out.filter(r=>r.status==='NEXUS_RESTRICTED_MODEL').length,
  total_elapsed_ms:Date.now()-t0,reference_records_count:0,statistics_against_RNAfold:null,
  warning:'These are NEXUS results only; no RNAfold or experimental structure comparison was executed.',rows:out};
const dest=path.join(root,'validation_results','nexus_125_internal_baseline.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(base,null,2)+'\n');
console.log(JSON.stringify({n_cases:base.n_cases,n_success:base.n_success,elapsed_ms:base.total_elapsed_ms,examples:out.slice(0,2)},null,2));
if(base.n_success!==125)process.exitCode=1;
