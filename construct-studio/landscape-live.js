/* Research Landscape v2 — voluntary, public-keyword source retrieval; no auto-send. */
(function(){
 'use strict';
 const get=id=>document.getElementById(id),btn=get('landscape-live-search'),list=get('landscape-live-results'),status=get('landscape-live-status');
 if(!btn||!list||!status)return;
 const FIELDS=['research-keywords','landscape-target','landscape-indication','landscape-model','landscape-delivery','landscape-endpoint'];
 const clean=v=>String(v||'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,120);
 const norm=v=>clean(v).toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
 const stamp=s=>{const t=Date.parse(s);return Number.isFinite(t)?new Date(t).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'unknown date'};
 const allowedLink=u=>{try{const x=new URL(u);return x.protocol==='https:'&&['pubmed.ncbi.nlm.nih.gov','clinicaltrials.gov'].includes(x.hostname)?x.href:null;}catch(_){return null}};
 let controller=null;
 function textNode(tag,content,cls){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=content;return e}
 function label(k){return {target:'Target',indication:'Indication',model:'NK model',delivery:'Delivery',endpoint:'Readout'}[k]||k}
 function fields(){return {target:clean(get('landscape-target').value),indication:clean(get('landscape-indication').value),model:clean(get('landscape-model').value),delivery:clean(get('landscape-delivery').value),endpoint:clean(get('landscape-endpoint').value)}}
 function makeQuery(d){
  const words=[clean(get('research-keywords').value),d.target,d.indication,d.delivery].filter(Boolean);
  const unique=[...new Set(words.map(s=>s.toLowerCase()))];
  let q=unique.join(' ');
  if(!q||q.length<3)throw Error('Enter non-confidential public research keywords, target or indication before searching.');
  if(q.length>120)throw Error('Public search keywords and dimensions exceed 120 characters; shorten the query.');
  if(!/^[\p{L}\p{N}\s\-/()+,.]+$/u.test(q)||/@|https?:|(?:[ACGTU]{45,})/i.test(q))throw Error('Search accepts public research terms only; do not submit email, URLs or nucleotide sequences.');
  return q;
 }
 function compare(record,d){
  const hay=norm([record.title,record.organization,record.journal,(record.conditions||[]).join(' '),(record.interventions||[]).join(' ')].join(' '));
  const found=[],notFound=[],unspecified=[];
  Object.entries(d).forEach(([k,val])=>{
   if(!val)return;
   const search=norm(val);
   if(search.length<3){unspecified.push(label(k));return;}
   // Whole token / phrase matching in source metadata, not protocol similarity.
   if((' '+hay+' ').includes(' '+search+' '))found.push(label(k));else notFound.push(label(k));
  });
  const level=found.length>=2?'Multiple shared terms':found.length?'One shared term':'No selected terms found';
  return {found,notFound,unspecified,level};
 }
 function clear(){
  if(controller){controller.abort();controller=null;}
  list.replaceChildren();status.textContent='No current source search for these inputs. Choose Search current research to retrieve evidence.';
  status.dataset.state='idle';
 }
 FIELDS.concat(['strategy','nk-focus','nk-model','cell']).forEach(id=>get(id)?.addEventListener('input',clear));
 FIELDS.concat(['strategy','nk-focus','nk-model','cell']).forEach(id=>get(id)?.addEventListener('change',clear));
 function card(record,d){
  const node=document.createElement('article');node.className='rl-record';
  const link=allowedLink(record.url),heading=textNode('h4',record.title||'Untitled source');
  if(link){const a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=record.title||record.id;heading.replaceChildren(a)}
  const kind=record.type==='trial'?'Clinical trial registry':'Research publication',metadata=[kind,record.id,record.date,record.organization||record.authors?.join(', '),record.journal,record.status&&record.status.replace(/_/g,' ')].filter(Boolean).join(' · ');
  const matched=compare(record,d);
  const match=textNode('p',matched.level+(matched.found.length?' ('+matched.found.join(', ')+')':'')+'. Comparison uses public title/registry metadata only; methods may differ.','rl-match');
  const note=textNode('p','Metadata does not establish an identical experiment, complete prior art, clinical efficacy, novelty or patent freedom to operate.','rl-note');
  node.append(textNode('small',metadata,'rl-meta'),heading,match,note);
  return {node,priority:matched.found.length};
 }
 function show(data,d,mode){
  list.replaceChildren();
  const records=(data.records||[]).filter(x=>x&&allowedLink(x.url)).slice(0,65);
  const ranked=records.map(x=>card(x,d)).sort((a,b)=>b.priority-a.priority);
  const cap=mode==='snapshot'?20:16; ranked.slice(0,cap).forEach(x=>list.append(x.node));
  if(!ranked.length)list.append(textNode('p','No indexed records were returned. This is not evidence that the research is unique.','rl-empty'));
  const date=data.fetchedAt||data.updatedAt||data.updated_at;
  const sourceLabel=mode==='snapshot'?'monthly indexed snapshot (not a live match to your exact query)':'on-demand PubMed and ClinicalTrials.gov';
  const n=ranked.length;
  status.textContent=n+' source records from '+sourceLabel+' · Retrieved '+stamp(date)+'.'+(data.sourceErrors?.length?' Partial source failure: '+data.sourceErrors.join('; ')+'.':'');
  status.dataset.state=mode;
  document.dispatchEvent(new CustomEvent('nexus:landscape',{detail:{source:mode,queriedAt:date,query:data.query||'',sourceErrors:data.sourceErrors||[],records:records.map(x=>({id:x.id,type:x.type,title:x.title,url:x.url,organization:x.organization||'',status:x.status||''})),reviewStatus:'Title/metadata screening only; manual full-text, methods, registry, prior-art and patent review required'}}));
 }
 async function loadSnapshot(d){
  const url=new URL('../../assets/nexus-research-landscape.json',location.href);
  const rsp=await fetch(url.toString(),{cache:'no-store'});
  if(!rsp.ok)throw Error('No published monthly snapshot available');
  const data=await rsp.json();if(data.schema!=='nexus-research-landscape-snapshot-v1'||!Array.isArray(data.records)||!data.updatedAt)throw Error('Monthly index has not yet been collected');
  show(data,d,'snapshot');
 }
 btn.addEventListener('click',async()=>{
  if(controller)controller.abort();controller=new AbortController();
  const d=fields();let query;
  try{query=makeQuery(d)}catch(e){status.textContent=e.message;status.dataset.state='error';return;}
  status.textContent='Searching current PubMed and ClinicalTrials.gov records…';status.dataset.state='loading';list.replaceChildren();btn.disabled=true;
  try{
   const url=new URL('/api/research-landscape',location.origin);url.searchParams.set('q',query);
   const abort=controller;const timeout=setTimeout(()=>abort.abort(),18000);
   try{
    const rsp=await fetch(url.toString(),{signal:abort.signal,cache:'no-store',credentials:'omit'});
    if(!rsp.ok)throw Error('Live research API unavailable (HTTP '+rsp.status+')');
    const data=await rsp.json();
    if(data.schema!=='nexus-live-landscape-v1'||!Array.isArray(data.records))throw Error('Unexpected research result format');
    show(data,d,'live');
   }finally{clearTimeout(timeout)}
  }catch(e){
   if(e.name==='AbortError'){status.textContent='Research search cancelled. Previous evidence is not current for these inputs.';return;}
   try{await loadSnapshot(d)}catch(_){status.textContent='Live source retrieval is unavailable, and no updated monthly snapshot is available. You can still use the curated publications and direct source links above. No novelty conclusion is possible.';status.dataset.state='error';}
  }finally{btn.disabled=false;controller=null;}
 });
})();
