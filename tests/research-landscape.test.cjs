const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const backend=readFileSync(path.join(root,'functions/api/research-landscape.js'),'utf8');
const main=async()=>await import('data:text/javascript;base64,'+Buffer.from(backend).toString('base64'));
const res=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}});
const fixtures={
 esearch:{esearchresult:{count:'1',idlist:['40248694']}},
 esummary:{result:{uids:['40248694'],'40248694':{title:'Transient CAR NK mRNA research',authors:[{name:'Wang J'}],pubdate:'2025',articleids:[],source:'Journal'}}},
 trials:{totalCount:1,studies:[{protocolSection:{identificationModule:{nctId:'NCT12345678',briefTitle:'CAR NK mRNA study'},sponsorCollaboratorsModule:{leadSponsor:{name:'Clinical Research Sponsor',class:'OTHER'}},statusModule:{overallStatus:'RECRUITING',studyFirstPostDateStruct:{date:'2026-05-01'}},conditionsModule:{conditions:['AML']},armsInterventionsModule:{interventions:[{name:'CAR NK cells'}]},designModule:{phases:['PHASE1']}}}]}
};
async function runServer(query,handler){
 const old=global.fetch;global.fetch=async(url)=>handler(new URL(url));
 try{const m=await main();return await m.onRequestGet({request:new Request('https://nexus-rna-site.pages.dev/api/research-landscape?q='+encodeURIComponent(query))});}
 finally{global.fetch=old;}
}
test('rejects empty, long, sequence-like or private-looking query without network requests',async()=>{
 for(const q of ['', 'A'.repeat(121), 'A'.repeat(50), 'test@example.com','https://malicious.test']){
  const r=await runServer(q,()=>{throw Error('should not fetch')});
  assert.equal(r.status,400,q);
  assert.equal(r.headers.get('cache-control'),'no-store');
 }
});
test('retrieves PubMed and ClinicalTrials sources through fixed HTTPS API hosts',async()=>{
 const hosts=[];
 const response=await runServer('CAR NK mRNA',u=>{
  hosts.push(u.hostname);
  if(u.pathname.endsWith('esearch.fcgi'))return res(fixtures.esearch);
  if(u.pathname.endsWith('esummary.fcgi'))return res(fixtures.esummary);
  if(u.hostname==='clinicaltrials.gov')return res(fixtures.trials);
  throw Error('unexpected source '+u.href);
 });
 assert.equal(response.status,200);
 const j=await response.json();
 assert.equal(j.schema,'nexus-live-landscape-v1');
 assert.equal(j.records.length,2);
 assert.ok(j.records.some(x=>x.id==='PMID:40248694'));
 assert.ok(j.records.some(x=>x.id==='NCT12345678'&&x.organization==='Clinical Research Sponsor'));
 assert.deepEqual(new Set(hosts),new Set(['eutils.ncbi.nlm.nih.gov','clinicaltrials.gov']));
 assert.match(j.scope,/do not prove exact duplication/i);
});
test('when one source fails, preserve returned evidence and expose partial failure',async()=>{
 const r=await runServer('EphA2 sarcoma',u=>{
   if(u.hostname==='clinicaltrials.gov')return res({error:'failure'},503);
   if(u.pathname.endsWith('esearch.fcgi'))return res(fixtures.esearch);
   return res(fixtures.esummary);
 });
 assert.equal(r.status,200);const j=await r.json();
 assert.equal(j.records.length,1);
 assert.ok(j.sourceErrors.some(x=>x.startsWith('ClinicalTrials.gov')));
});
test('when all upstreams fail, return 502 instead of declaring no matching studies',async()=>{
 const r=await runServer('EphA2 sarcoma',()=>res({error:'unavailable'},503));
 assert.equal(r.status,502);
 const j=await r.json();assert.match(j.error,/temporarily unavailable/i);
});
test('studio has manual live search only, local metadata matching, and an archive fallback',()=>{
 const code=readFileSync(path.join(root,'tools/construct-studio/landscape-live.js'),'utf8');
 assert.match(code,/btn\.addEventListener\('click'/);
 assert.match(code,/snapshot-v1/);
 assert.match(code,/compare\(record,d\)/);
 assert.match(code,/records\.map\(x=>/);
 assert.doesNotMatch(code,/document\.addEventListener\('DOMContentLoaded',[^\n]*fetch/);
 assert.equal(code,readFileSync(path.join(root,'construct-studio/landscape-live.js'),'utf8'));
 for(const folder of ['tools/construct-studio','construct-studio']){
  const html=readFileSync(path.join(root,folder,'index.html'),'utf8');
  for(const id of ['landscape-live-search','landscape-live-results','landscape-target','landscape-indication','landscape-model','landscape-delivery','landscape-endpoint'])assert.ok(html.includes('id="'+id+'"'),id);
 }
});
test('monthly snapshot stores provenance and is not silently treated as already populated',()=>{
 const snapshot=JSON.parse(readFileSync(path.join(root,'assets/nexus-research-landscape.json'),'utf8'));
 assert.equal(snapshot.schema,'nexus-research-landscape-snapshot-v1');
 assert.ok(Array.isArray(snapshot.records));
 if(snapshot.records.length===0)assert.equal(snapshot.updatedAt,null);
 if(snapshot.records.length>0)assert.ok(snapshot.updatedAt&&snapshot.records.every(x=>/^(PMID:|NCT)/.test(x.id)));
 const collector=readFileSync(path.join(root,'scripts/update_research_landscape.py'),'utf8');
 assert.match(collector,/Insufficient verified public research records/);
 assert.match(collector,/TOPICS =/);
});
