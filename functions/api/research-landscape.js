/* Public-only research discovery. Cloudflare Pages Functions; never accepts DNA/RNA sequences or credentials. */
const BASE='https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const CT='https://clinicaltrials.gov/api/v2/studies';
const LIMIT=8;
function txt(v,n=200){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);}
function queryValid(q){return q.length>=3&&q.length<=120&&/^[\p{L}\p{N}\s\-/()+,.]+$/u.test(q)&&!/@|https?:|(?:[ACGTU]{45,})/i.test(q);}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
async function getJSON(url){
 const response=await fetch(url.toString(),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8500)});
 if(!response.ok)throw Error('Upstream HTTP '+response.status);
 const raw=await response.text();if(raw.length>350000)throw Error('Source response too large');
 return JSON.parse(raw);
}
function allowDOI(raw){const d=txt(raw,120);return /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(d)?d:'';}
async function pubmed(q){
 const search=new URL('esearch.fcgi',BASE);search.search=new URLSearchParams({db:'pubmed',term:q,retmode:'json',retmax:String(LIMIT),sort:'pub date'}).toString();
 const first=await getJSON(search);const ids=(first?.esearchresult?.idlist||[]).map(String).filter(x=>/^\d{1,10}$/.test(x)).slice(0,LIMIT);
 const total=Number(first?.esearchresult?.count||0);if(!ids.length)return {reportedCount:Number.isFinite(total)?total:0,records:[]};
 const summary=new URL('esummary.fcgi',BASE);summary.search=new URLSearchParams({db:'pubmed',id:ids.join(','),retmode:'json'}).toString();
 const details=await getJSON(summary);
 const records=ids.map(id=>{const x=details?.result?.[id];if(!x)return null;
   const doi=(x.articleids||[]).find(a=>a.idtype==='doi')?.value||'';
   return {id:'PMID:'+id,type:'publication',title:txt(x.title,350),authors:(x.authors||[]).slice(0,5).map(a=>txt(a.name,100)).filter(Boolean),organization:'',date:txt(x.pubdate,60),journal:txt(x.fulljournalname||x.source,130),doi:allowDOI(doi),url:'https://pubmed.ncbi.nlm.nih.gov/'+id+'/',source:'PubMed',abstractAvailable:false};
 }).filter(x=>x&&x.title);
 return {reportedCount:Number.isFinite(total)?total:0,records};
}
async function trials(q){
 const url=new URL(CT);url.search=new URLSearchParams({'query.term':q,format:'json',pageSize:String(LIMIT),countTotal:'true'}).toString();
 const r=await getJSON(url);
 const records=(Array.isArray(r.studies)?r.studies:[]).slice(0,LIMIT).map(study=>{
   const p=study.protocolSection||{},id=txt(p.identificationModule?.nctId,16);if(!/^NCT\d{8}$/.test(id))return null;
   const status=p.statusModule||{},lead=p.sponsorCollaboratorsModule?.leadSponsor||{};
   return {id,type:'trial',title:txt(p.identificationModule?.briefTitle,350),
     organization:txt(lead.name,150),sponsorClass:txt(lead.class,45),
     status:txt(status.overallStatus,65),date:txt(status.studyFirstPostDateStruct?.date||status.lastUpdatePostDateStruct?.date,30),
     conditions:(p.conditionsModule?.conditions||[]).slice(0,6).map(x=>txt(x,80)),
     interventions:(p.armsInterventionsModule?.interventions||[]).slice(0,6).map(x=>txt(x.name,80)),
     phases:(p.designModule?.phases||[]).slice(0,4).map(x=>txt(x,30)),
     url:'https://clinicaltrials.gov/study/'+id,source:'ClinicalTrials.gov'};
 }).filter(x=>x&&x.title);
 return {reportedCount:Number.isFinite(Number(r.totalCount))?Number(r.totalCount):null,records};
}
export async function onRequestGet({request}){
 const u=new URL(request.url),q=txt(u.searchParams.get('q'),140);
 if(!queryValid(q))return json({error:'Use 3–120 public, non-confidential research keywords. Do not enter sequences, credentials or personal data.'},400);
 const settled=await Promise.allSettled([pubmed(q),trials(q)]);
 const sources=['PubMed','ClinicalTrials.gov'];const issues=[];const results={};
 settled.forEach((s,i)=>{const k=sources[i];if(s.status==='fulfilled')results[k]=s.value;else{results[k]={reportedCount:null,records:[]};issues.push(k+' temporarily unavailable');}});
 if(issues.length===2)return json({error:'Public research sources are temporarily unavailable. Use the direct source links or the saved monthly digest.',sourcesAvailable:[],sourceErrors:issues},502);
 return json({schema:'nexus-live-landscape-v1',query:q,fetchedAt:new Date().toISOString(),records:[...results.PubMed.records,...results['ClinicalTrials.gov'].records],reportedTotals:{pubmed:results.PubMed.reportedCount,clinicalTrials:results['ClinicalTrials.gov'].reportedCount},sourcesAvailable:sources.filter(s=>!issues.some(e=>e.startsWith(s))),sourceErrors:issues,scope:'First '+LIMIT+' results per source; PubMed sorts by publication date. Registry status is not efficacy; title and record matching do not prove exact duplication, novelty or FTO.'});
}
