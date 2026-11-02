(function(){'use strict';const $=id=>document.getElementById(id);let current=null,imported=null;
function status(msg,bad=false){$('qa-message').textContent=msg;$('qa-message').classList.toggle('bad',bad);}
function download(name,text,mime){const blob=new Blob([text],{type:mime||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function selection(){let m=$('qa-modality').value,isLinear=m.startsWith('linear-');document.querySelectorAll('.qa-linear').forEach(x=>x.hidden=!isLinear);document.querySelectorAll('.qa-other').forEach(x=>x.hidden=isLinear);$('qa-cap').value=m==='linear-cell'?'cellular':'co';$('qa-poly').value=m==='linear-cell'?'0':'100';}
for(const id of ['qa-utr5','qa-cds','qa-utr3','qa-poly','qa-cap','qa-sequence'])$(id).addEventListener('input',()=>{if(imported){imported=null;status('Imported record cleared because manual inputs were edited.');}});
$('qa-modality').addEventListener('change',()=>{imported=null;selection();status('Manual modality selected. Run the review for updated results.');});selection();
function manual(){const m=$('qa-modality').value;return m.startsWith('linear-')?{modality:m,utr5:$('qa-utr5').value,cds:$('qa-cds').value,utr3:$('qa-utr3').value,polyA:$('qa-poly').value,cap:$('qa-cap').value}:{modality:m,[m==='mirna'||m==='sirna'||m==='rnaa'?'guide':'sequence']:$('qa-sequence').value,cap:'none',polyA:0};}
function render(r){current=r;$('qa-result').hidden=false;$('qa-empty').hidden=true;$('qa-heading').textContent=r.modality.replace(/-/g,' ').toUpperCase()+' · '+r.summary.status.replace(/_/g,' ');$('qa-length').textContent=String(r.metrics.length);$('qa-gc').textContent=r.metrics.gcPercent===null?'N/A':r.metrics.gcPercent+'%';$('qa-blocks').textContent=String(r.summary.blockingIssues);$('qa-reviews').textContent=String(r.summary.reviewItems);$('qa-map').replaceChildren();for(const item of r.coordinateMap){const d=document.createElement('div');d.className='qa-segment';d.textContent=item.name+' · '+item.start+'–'+item.end+' ('+item.length+' nt)';$('qa-map').append(d);}const issues=$('qa-issues');issues.replaceChildren();for(const x of r.issues){const d=document.createElement('article');d.className='qa-issue '+x.level;const h=document.createElement('b');h.textContent=x.level.toUpperCase()+' · '+x.code;const t=document.createElement('div');t.textContent=x.message;const s=document.createElement('small');s.textContent=x.component;d.append(h,t,s);issues.append(d);}const seq=r.sequence;$('qa-preview').textContent=seq.length>600?seq.slice(0,300)+'\n… '+(seq.length-600)+' nt omitted from preview …\n'+seq.slice(-300):seq||'(no input sequence)';status('Completed local review. '+r.summary.blockingIssues+' blockers and '+r.summary.reviewItems+' review items.');}
$('qa-run').addEventListener('click',()=>{try{const r=imported?NexusConstructQA.fromExisting(imported):NexusConstructQA.audit(manual());render(r);}catch(e){current=null;$('qa-result').hidden=true;$('qa-empty').hidden=false;status(e.message,true);}});
$('qa-import').addEventListener('change',async e=>{try{
 const f=e.target.files?.[0];if(!f)return;
 const x=await NexusConstructFileImport.parse(f);
 if(x.format==='json'&&['nexus-full-rna-construct-v1','nexus-circrna-research-v1','nexus-utr-research-v1'].includes(x.record?.schema)){const result=NexusConstructQA.fromExisting(x.record);imported=x.record;render(result);status('Imported annotated NEXUS JSON '+f.name+' for local quality review.');return;}
 imported=null;
 const role=$('qa-import-role').value;
 const m=$('qa-modality').value;const isLinear=m.startsWith('linear-');
 if(!Object.keys(x.components||{}).length && !role)throw Error('Choose a sequence role below the file selector before importing sequence-only files.');
 if(!isLinear && Object.keys(x.components||{}).length)throw Error('For segmented UTR/CDS files, select a linear mRNA modality first.');
 if(isLinear && role==='whole' && !Object.keys(x.components||{}).length)throw Error('A full-length transcript cannot be split into CDS and UTRs automatically. Use a CSV/TSV with labeled components or enter boundaries manually.');
 if(isLinear){for(const key of ['utr5','cds','utr3'])$('qa-'+key).value='';
   const comps=x.components||{};
   if(Object.keys(comps).length){for(const key of ['utr5','cds','utr3'])if(comps[key])$('qa-'+key).value=NexusConstructFileImport.nucleic(comps[key],'rna');}
   else if(['cds','utr5','utr3'].includes(role))$('qa-'+role).value=NexusConstructFileImport.nucleic(x.sequence,'rna');
   else throw Error('Choose CDS, 5′ UTR, or 3′ UTR.');
   $('qa-cap').value=m==='linear-cell'?'cellular':'unspecified';$('qa-poly').value='0';
 }else{$('qa-sequence').value=NexusConstructFileImport.nucleic(x.sequence,'rna');}
 current=null;$('qa-result').hidden=true;$('qa-empty').hidden=false;
 status('Loaded '+f.name+'. Verify sequence role, UTR/CDS boundaries, cap/processing and poly(A); then click Run construct review. No annotation inferred from FASTA/TXT.');
}catch(error){imported=null;status(error.message,true);}finally{e.target.value='';}});
$('qa-example').addEventListener('click',()=>{imported=null;$('qa-modality').value='linear-ivt';selection();$('qa-utr5').value='GCCACC';$('qa-cds').value='AUGGCUCAGGAACCUUAA';$('qa-utr3').value='ACUGCUAUUUAUGC';$('qa-poly').value='90';$('qa-cap').value='co';$('qa-run').click();});
$('qa-clear').addEventListener('click',()=>{imported=null;current=null;for(const id of ['qa-utr5','qa-cds','qa-utr3','qa-sequence'])$(id).value='';$('qa-result').hidden=true;$('qa-empty').hidden=false;status('Cleared.');});
$('qa-json').addEventListener('click',()=>{if(current){download('NEXUS_Construct_Quality_Review.json',JSON.stringify({...current,exportedAt:new Date().toISOString()},null,2),'application/json');}});
$('qa-fasta').addEventListener('click',()=>{if(current?.sequence)download('NEXUS_Construct_Sequence.fasta',NexusUTR.fasta(current.modality+'_research_not_verified',current.sequence),'text/plain');});
try{const handoff=sessionStorage.getItem('nexus:construct-review-handoff');if(handoff){sessionStorage.removeItem('nexus:construct-review-handoff');const json=JSON.parse(handoff),review=NexusConstructQA.fromExisting(json);imported=json;render(review);status('Received design directly from RNA Construct Studio.');}}catch(error){status('Design handoff could not be opened: '+error.message,true);}
$('qa-save').addEventListener('click',()=>{try{if(!current)throw Error('Run a review first');NexusBridge.saveModule('constructQA',current);$('qa-save-message').textContent='Saved to '+NexusBridge.activeId()+' in local Project Hub.';}catch(e){$('qa-save-message').textContent=e.message;}});
})();
