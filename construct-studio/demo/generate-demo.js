#!/usr/bin/env node
// Deterministic, entirely fabricated demonstration -- no data from real people or instruments.
const E=require('../evidence-core.js');
const A=require('../evidence-instrument-core.js');
const crypto=require('crypto'),fs=require('fs'),path=require('path');
const out=path.join(__dirname,'fixtures');fs.mkdirSync(out,{recursive:true});
const seqs={
 A:'GGAGCUCCUCAUGGCCGUGGAACCUUAAGCUAGCUAGCUAGU',
 B:'GGAGUUCCUCAUGGCAGUAGAACCCUAAGCUACCUAGCUAGU',
 C:'GGAGCACCUCAUGGCGGUUGAGCCAUAAUCUAGCUAGCUAGU'
};
const models=['A549','HEK293'],cands=['A','B','C'];
const base={A549:{A:110,B:147,C:128},HEK293:{A:145,B:166,C:153}};
const shift=[-10,1,9];const tech=[-2,2];
const id=(c,cell,i)=>`DM-${c}-${cell}-B${i}`;
let data=E.create();
for(const c of cands)data=E.registerConstruct(data,{key:`DEMO-RNA-${c}-V01`,name:`Synthetic RNA candidate ${c}`,sequence:seqs[c],source:'100% synthetic training exercise; no experimental support',sourceVersion:'DEMO-1823-1'}).data;
for(const cell of models)for(const c of cands)for(let i=1;i<=3;i++){
  const sample=id(c,cell,i);
  data=E.registerSample(data,{sampleId:sample,constructKey:`DEMO-RNA-${c}-V01`,cellModel:cell,biologicalReplicate:`BIO-0${i}`,experimentId:'DEMO-EXP-01',batchId:'DEMO-BATCH-01',condition:'Synthetic transfection',timeHours:24}).data;
  for(let t=0;t<2;t++)data=E.addMeasurement(data,{sampleId:sample,assay:'protein_expression',analyte:'Synthetic reporter signal',value:base[cell][c]+shift[i-1]+tech[t],unit:'RFU / 10000 cells',runId:'DEMO-NORM-RUN',technicalReplicate:`TECH-0${t+1}`,source:'SYNTHETIC; generated fixture; not instrument data',normalization:'Illustrative cell-count normalization',methodId:'DEMO-NORM-METHOD',flags:'SYNTHETIC TRAINING DATA'}).data;
}
// Synthetic decay tracks; each candidate single biological replicate, clearly exploratory.
for(const c of cands)for(const [k,time] of [0,6,12].entries()){
 const sid=`DM-${c}-A549-T${time}`;
 data=E.registerSample(data,{sampleId:sid,constructKey:`DEMO-RNA-${c}-V01`,cellModel:'A549',biologicalReplicate:'BIO-01',experimentId:'DEMO-DECAY-01',batchId:'DEMO-BATCH-01',condition:'Synthetic abundance decay',timeHours:time}).data;
 const init={A:100,B:105,C:99}[c],half={A:6,B:9,C:7.2}[c];
 for(let t=0;t<2;t++)data=E.addMeasurement(data,{sampleId:sid,assay:'rna_abundance',analyte:'Synthetic reporter RNA',value:Number((init*Math.pow(2,-time/half)*(1+0.012*(t?1:-1))).toFixed(4)),unit:'relative RNA units',runId:'DEMO-DECAY-RUN',technicalReplicate:`TECH-0${t+1}`,source:'SYNTHETIC simulated decay data',normalization:'Illustrative normalized signal',methodId:'DEMO-DECAY-METHOD',flags:'SYNTHETIC TRAINING DATA'}).data;
}
// Normalize generated timestamps so identical input always creates identical fixture bytes.
const fixedStamp='2026-10-22T00:00:00.000Z';
data.createdAt=fixedStamp;data.updatedAt=fixedStamp;
for(const c of data.constructs)c.registeredAt=fixedStamp;
for(const s of data.samples)s.registeredAt=fixedStamp;
for(const m of data.measurements)m.recordedAt=fixedStamp;
const synthetic=Object.freeze({status:'SYNTHETIC_ONLY',schemaVersion:'NEXUS-Demo-1823-1',title:'Synthetic RNA construct comparison study',createdFor:'Research software walkthrough',NOT_REAL_INSTRUMENT_EXPORT:true,
 notes:['All sequences, values, sample IDs and experiments are fabricated for testing and training.','A549 and HEK293 are labels in this simulation; no cells were cultured.','Candidate B was assigned larger illustrative signals by construction, not measured or predicted.','Results are descriptive and must not be treated as RNA-design performance evidence.','The apparent RNA-signal half-life demonstration has one biological replicate and is not experimentally validated.'],
 projectId:'NEXUS-DEMO-1823',evidence:data,baseline:'DEMO-RNA-A-V01'});
const buf=JSON.stringify(synthetic,null,2)+'\n';fs.writeFileSync(path.join(out,'demo-study.json'),buf);
// CSV source tables emulate familiar vendor-export header names; no claim of vendor production.
const csv=(name,header,rows)=>{const quote=v=>{const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"';};const content=[header,...rows].map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n';fs.writeFileSync(path.join(out,name),content);return {name,sha256:crypto.createHash('sha256').update(content).digest('hex'),rows:rows.length};};
const samples=data.samples.filter(s=>s.experimentId==='DEMO-EXP-01');
const plate=[],qpcr=[],ddpcr=[],flow=[],bio=[];
let well=0;
for(const s of samples){const c=s.constructKey.split('-')[2];const bi=Number(s.biologicalReplicate.slice(-1));const cell=s.cellModel;let measure=base[cell][c]+shift[bi-1];
 for(let techNo=1;techNo<=2;techNo++){
  const w=String.fromCharCode(65+(well%8))+(1+Math.floor(well/8));well++;
  plate.push([w,s.sampleId,'Synthetic reporter',measure+(techNo===1?-2:2),'OK']);
  const cq=({A:23.9,B:23.0,C:23.4}[c]) + (cell==='HEK293'?-0.5:0) + 0.08*(bi-2)+(techNo===1?-.06:.06);
  qpcr.push([w,s.sampleId,'Synthetic reporter RNA',Number(cq.toFixed(2)),'AMP']);
 }
 const concentration=({A:115,B:143,C:128}[c])+(cell==='HEK293'?20:0)+(bi-2)*5;
 ddpcr.push([s.sampleId,'Synthetic RNA target',concentration,'Accepted']);
 flow.push([s.sampleId,'Synthetic marker+ gated population',Number((25+0.22*measure+(bi-2)*1.1).toFixed(2)),'PASS']);
 bio.push([s.sampleId,'Main RNA peak',Number((87+(c==='B'?2:c==='C'?1:0)+0.2*(bi-2)).toFixed(2)),880+bi*4,'PASS']);
}
const outputs=[];
outputs.push(csv('Gen5_style_SYNTHETIC.csv',['Well','Sample Name','Measurement','RFU','Status'],plate));
outputs.push(csv('QuantStudio_style_SYNTHETIC.csv',['Well Position','Sample','Target','Cq','Amp Status'],qpcr));
outputs.push(csv('BioRad_ddPCR_style_SYNTHETIC.csv',['Sample Name','Target','Concentration','Status'],ddpcr));
outputs.push(csv('FlowJo_style_SYNTHETIC.csv',['Sample','Population','% of Parent','Status'],flow));
outputs.push(csv('Bioanalyzer_style_SYNTHETIC.csv',['Sample Name','Peak Name','% of Total Area','Size [nt]','Status'],bio));
const summaries=E.summaries(data),comparison=A.compare(data,'DEMO-RNA-A-V01'),halfLives=E.apparentHalfLives(data);
fs.writeFileSync(path.join(out,'demo-comparison.json'),JSON.stringify({source:'SYNTHETIC DEMONSTRATION',comparison,summaries,halfLives},null,2)+'\n');
fs.writeFileSync(path.join(out,'demo-comparison.csv'),A.csv(comparison.map(r=>({construct:r.constructKey,baseline:r.baseline,cell:r.cellModel,assay:r.assay,biologicalN:r.nBiological,technicalN:r.nTechnical,mean:r.mean,baselineMean:r.baselineMean,delta:r.delta,ratio:r.ratio,status:r.status,warnings:r.warnings?.join('; ')})),['construct','baseline','cell','assay','biologicalN','technicalN','mean','baselineMean','delta','ratio','status','warnings']));
const manifest={dataset:'NEXUS_DEMO_1823',type:'synthetic_training_data',authentic_vendor_export:false,release:'v1.8.23',generatedBy:'tools/construct-studio/demo/generate-demo.js',createdOn:'2026-10-22',constructs:data.constructs.length,samples:data.samples.length,measurements:data.measurements.length,biologicalReplicates:3,technicalRepeatsPerObservation:2,generatedFiles:outputs,
 notes:'Hashes verify file integrity after distribution only; do not establish authenticity or vendor qualification.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({constructs:data.constructs.length,samples:data.samples.length,measurements:data.measurements.length,comparisons:comparison.length,files:outputs},null,2));
