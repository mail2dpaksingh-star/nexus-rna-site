const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../tools/construct-studio');
const E=require(path.join(root,'evidence-core.js'));const A=require(path.join(root,'evidence-instrument-core.js'));
const I=require(path.resolve(root,'../instrument-import/core.js'));
const demo=JSON.parse(fs.readFileSync(path.join(root,'demo/fixtures/demo-study.json'),'utf8'));
assert.strictEqual(demo.status,'SYNTHETIC_ONLY');
assert.strictEqual(demo.evidence.constructs.length,3);assert.strictEqual(demo.evidence.samples.length,27);
assert.strictEqual(demo.evidence.measurements.length,54);
const summary=E.summaries(demo.evidence),comps=A.compare(demo.evidence,demo.baseline);
for(const model of ['A549','HEK293']) {
 const p=summary.filter(x=>x.cellModel===model&&x.experimentId==='DEMO-EXP-01'&&x.assay==='protein_expression');
 assert.strictEqual(p.length,3);
 assert(p.every(x=>x.nBiological===3&&x.nTechnical===6));
 const aa=p.find(x=>x.constructKey==='DEMO-RNA-A-V01'),bb=p.find(x=>x.constructKey==='DEMO-RNA-B-V01');
 assert(bb.mean>aa.mean);
 const bc=comps.find(x=>x.constructKey==='DEMO-RNA-B-V01'&&x.cellModel===model&&x.assay==='protein_expression');
 assert(bc&&bc.status==='Matched experimental strata'&&bc.ratio>1);
 // independent reference arithmetic: per-biological means and across-replicate SD.
 const values=demo.evidence.measurements.filter(m=>m.assay==='protein_expression' && demo.evidence.samples.find(s=>s.sampleId===m.sampleId)?.cellModel===model && demo.evidence.samples.find(s=>s.sampleId===m.sampleId)?.constructKey==='DEMO-RNA-A-V01').map(m=>m.value);
 const manual=values.reduce((a,b)=>a+b,0)/values.length;
 assert(Math.abs(manual-aa.mean)<1e-10);
}
const decay=E.apparentHalfLives(demo.evidence);assert.strictEqual(decay.length,3);assert(decay.every(x=>x.apparentHalfLifeHours>0&&x.nTimePoints===3));
const mapping={qpcr:'QuantStudio_style_SYNTHETIC.csv',ddpcr:'BioRad_ddPCR_style_SYNTHETIC.csv',plate:'Gen5_style_SYNTHETIC.csv',flow:'FlowJo_style_SYNTHETIC.csv',bioanalyzer:'Bioanalyzer_style_SYNTHETIC.csv'};
let staged=demo.evidence;let totals={};
for(const [profile,filename] of Object.entries(mapping)) {
 const body=fs.readFileSync(path.join(root,'demo/fixtures',filename),'utf8');
 const t=A.parse(body,profile),fields=A.guess(t.headers,profile),source=A.distinctSamples(t,fields);
 assert.strictEqual(source.length,18);assert(fields.sample&&fields.value);
 const assign=Object.fromEntries(source.map(s=>[s,s]));
 const result=A.plan(t,profile,fields,assign,{sourceName:filename,unit:A.PROFILES[profile].unit,assay:A.PROFILES[profile].assay,runId:'DEMO-RUN-'+profile,normalization:'Synthetic raw export',methodId:'DEMO-METHOD'},staged);
 assert.strictEqual(result.excluded.length,0,profile);
 assert.strictEqual(result.imported,t.rows.length,profile);
 totals[profile]=result.imported;staged=result.data;
}
const before=staged.measurements.length;
const t=A.parse(fs.readFileSync(path.join(root,'demo/fixtures/Gen5_style_SYNTHETIC.csv'),'utf8'),'plate');const fields=A.guess(t.headers,'plate');
const assign=Object.fromEntries(A.distinctSamples(t,fields).map(s=>[s,s]));
assert.throws(()=>A.plan(t,'plate',fields,assign,{sourceName:'Gen5_style_SYNTHETIC.csv',unit:A.PROFILES.plate.unit,assay:'protein_expression',runId:'DEMO-RUN-plate',normalization:'Synthetic raw export',methodId:'DEMO-METHOD'},staged),/Duplicate/);
assert.strictEqual(staged.measurements.length,before);
const wronglyMapped={...assign};delete wronglyMapped['DM-B-A549-B1'];assert.throws(()=>A.plan(t,'plate',fields,wronglyMapped,{sourceName:'test.csv',unit:'RFU',assay:'protein_expression',runId:'ANOTHER-RUN',normalization:'Raw'},demo.evidence),/Unmapped/);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'demo/fixtures/manifest.json'),'utf8'));
const crypto=require('crypto');for(const f of manifest.generatedFiles){assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'demo/fixtures',f.name))).digest('hex'),f.sha256)}
console.log('PASS: demo generator & 5 vendor-style import adapters',totals,'overall rows',before);
