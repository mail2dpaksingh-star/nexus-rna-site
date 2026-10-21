/* UI for browser-local NEXUS SeqFold qPCR/ddPCR research primer-probe designer. */
(function(){'use strict';
 const engine=globalThis.NexusQPCR, validation=globalThis.NexusValidation;
 const bridge=globalThis.NexusBridge;
 const $=id=>document.getElementById(id);
 let current=null, template='';
 const synthetic='>Synthetic_qPCR_ddPCR_research_demo\nATGCGACCTGGACGTGCATCTACGTTAGGCTGCTACGTTGACGCTTACGATGCTACCGTTATGCTACGATCGTTGGCTTAGCGATCGATCGTTACGGATTCGGTACGATCGTCGTCATAGCGTGGCTACGTTAGCGATTCGACGATCGATGCGTCTAGCGTATCGATCCGTTGCGACTACGGTCATCGATACGTTGCTAGCTGATCGATCGTACGTTGGCTCGACTGCCATGTACGATCGTTGCTGATTGCGATCGATCGTGCTAGCATCGATCGTATGATCGCTAGCGTAGCGATACGTGCGATCCTGATCGTGCAC';
 function safe(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function error(text){$('qp-status').textContent=text;$('qp-status').style.color='#a33336';}
 function message(text){$('qp-status').textContent=text;$('qp-status').style.color='#225d54';}
 function setDownload(data,filename,mime){let url=URL.createObjectURL(new Blob([data],{type:mime})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function chosen(){let index=Number($('qp-choice').value);return current&&current.candidates[index]||null;}
 function drawCandidate(p){
  let probe=p.probe,pr=probe?`<div><b>Hydrolysis probe · ${safe(probe.strand==='+'?'forward strand':'reverse complement')}</b><div class="assay-code">5′-${safe(probe.sequence)}-3′</div><small>Tm ${probe.tm}°C · GC ${probe.gc}% · Tm margin +${probe.deltaTm}°C · bases ${probe.start+1}–${probe.end+1}</small></div>`:`<div><b>Dye-mode assay</b><small>No probe required; verify specificity and product identity separately.</small></div>`;
  let flags=p.warnings.length?`<div class="warnings"><b>Design review:</b><ul>${p.warnings.map(x=>'<li>'+safe(x)+'</li>').join('')}</ul></div>`:`<div class="callout">No heuristic red flags in this candidate. This is not experimental validation.</div>`;
  return `<article class="assay-card"><h3>Candidate ${p.rank} <span class="tag">${p.productSize} bp · score ${p.score}</span></h3><div class="assay-track" aria-label="Predicted amplicon region"><span class="f-region">F primer<br>${p.forward.start}–${p.forward.end}</span><span class="middle">Internal amplicon${probe?' / probe':''}</span>${probe?`<span class="p-region">Probe<br>${probe.start+1}–${probe.end+1}</span>`:''}<span class="r-region">R primer<br>${p.reverse.start}–${p.reverse.end}</span></div><div class="assay-grid"><div><b>Forward primer · 5′→3′</b><div class="assay-code">${safe(p.forward.sequence)}</div><small>Tm ${p.forward.tm}°C · GC ${p.forward.gc}% · ${p.forward.length} nt</small></div><div><b>Reverse primer · 5′→3′</b><div class="assay-code">${safe(p.reverse.sequence)}</div><small>Tm ${p.reverse.tm}°C · GC ${p.reverse.gc}% · ${p.reverse.length} nt</small></div>${pr}</div><p class="data-note">Amplicon template coordinates ${p.ampliconStart}–${p.ampliconEnd} (1-based, inclusive) · 3′ cross-dimer seed ${p.dimer3} nt · Probe sequence is unmodified, with labeling chemistry to be decided separately.</p>${flags}</article>`;
 }
 function render(r){
  let n=r.candidates.length;
  $('qp-summary').innerHTML=`<span>${safe(r.template.name)} · ${r.template.length} bases</span><span>${safe(r.params.assayMode.toUpperCase())} · ${safe(r.params.detection)}</span><span>${n} candidates · ${r.scannedPairs} primer combinations screened</span>`;
  $('qp-results').innerHTML=n?r.candidates.map(drawCandidate).join(''):'<div class="empty-result">No candidates met the selected screening constraints. Try a different sequence, longer region or compatible size window. No result means no predicted candidate, not that PCR is impossible.</div>';
  $('qp-choice').innerHTML=n?r.candidates.map((x,i)=>`<option value="${i}">Candidate ${x.rank} · ${x.productSize} bp</option>`).join(''):'<option value="">No candidate available</option>';
  $('qp-export-csv').disabled=!n;$('qp-export-json').disabled=!n;
 }
 if(bridge&&typeof bridge.init==='function')bridge.init('qpcrDesign',()=>current?{...current,verificationStatus:'Unvalidated research candidate'}:null);
 $('qp-design').addEventListener('click',()=>{try{
  $('qp-design').disabled=true;
  const input=$('qp-template').value;
  const options={assayMode:$('qp-mode').value,detection:$('qp-detection').value,ampliconMin:Number($('qp-min').value),ampliconMax:Number($('qp-max').value),targetTm:Number($('qp-tm').value),start:Number($('qp-start').value),end:$('qp-end').value?Number($('qp-end').value):'',focus:$('qp-focus').value||'',salt:Number($('qp-salt').value),concentration:Number($('qp-conc').value)};
  current=engine.design(input,options);template=engine.parseTemplate(input).sequence;render(current);
  message(current.candidates.length?`Generated ${current.candidates.length} research candidates. Check design flags and confirm with independent specificity testing.`:'No candidate satisfied all settings; widen the region or revise parameters.');
 }catch(e){current=null;$('qp-results').innerHTML='<div class="empty-result">Design failed: '+safe(e.message)+'</div>';$('qp-choice').innerHTML='<option value="">No candidate</option>';$('qp-export-csv').disabled=true;$('qp-export-json').disabled=true;error(e.message);}finally{$('qp-design').disabled=false;}});
 $('qp-mode').addEventListener('change',()=>{if([150,180].includes(Number($('qp-max').value)))$('qp-max').value=$('qp-mode').value==='ddpcr'?'150':'180';});
 $('qp-example').addEventListener('click',()=>{$('qp-template').value=synthetic;$('qp-start').value='1';$('qp-end').value='';$('qp-focus').value='';message('Synthetic demonstration loaded. Click Design primer / probe candidates.');});
 $('qp-clear').addEventListener('click',()=>{$('qp-template').value='';current=null;template='';$('qp-results').innerHTML='<div class="empty-result">Enter a sequence and run the designer.</div>';$('qp-choice').innerHTML='<option value="">Generate a design first</option>';$('qp-export-csv').disabled=true;$('qp-export-json').disabled=true;message('Sequence cleared.');});
 $('qp-upload').addEventListener('change',async e=>{let f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error('FASTA file exceeds 100 KB.');const raw=await f.text();engine.parseTemplate(raw);$('qp-template').value=raw;message('Loaded '+f.name+'. Run the design to screen candidate assays.');}catch(x){error(x.message);}finally{e.target.value='';}});
 $('qp-export-csv').addEventListener('click',()=>{if(!current)return;setDownload(engine.exportCSV(current),'NEXUS_qPCR_ddPCR_assay_candidates.csv','text/csv;charset=utf-8');});
 $('qp-export-json').addEventListener('click',()=>{if(!current)return;const report={...current,exportedAt:new Date().toISOString(),verificationStatus:'Unvalidated in silico research candidates'};setDownload(JSON.stringify(report,null,2),'NEXUS_qPCR_ddPCR_design_report.json','application/json');});
 $('qp-reference-demo').addEventListener('click',()=>{try{if(!template)template=engine.parseTemplate($('qp-template').value).sequence;$('qp-reference').value='>User_target_local_reference\n'+template;message('Loaded the submitted target sequence as the sole local reference (NOT an off-target background).');}catch(e){error(e.message);}});
 $('qp-screen').addEventListener('click',()=>{try{const p=chosen();if(!p)throw Error('First generate a primer pair.');const background=$('qp-reference').value.trim();if(!background)throw Error('Provide background FASTA; none is auto-downloaded.');const result=validation.specificity(p.forward.sequence,p.reverse.sequence,background,{maxMismatch:Number($('qp-mismatch').value),productMin:Number($('qp-min').value),productMax:Number($('qp-max').value)});
   $('qp-screen-result').style.display='block';$('qp-screen-result').innerHTML='<table class="tbl"><thead><tr><th>Reference</th><th>Strand</th><th>Start</th><th>End</th><th>Product</th><th>Forward MM</th><th>Reverse MM</th></tr></thead><tbody>'+(result.amplicons.length?result.amplicons.slice(0,60).map(p=>`<tr><td>${safe(p.reference)}</td><td>${safe(p.strand)}</td><td>${p.start}</td><td>${p.end}</td><td>${p.size}</td><td>${p.forwardMismatches}</td><td>${p.reverseMismatches}</td></tr>`).join(''):'<tr><td colspan="7">No amplicons within provided local FASTA and selected mismatch constraints.</td></tr>')+'</tbody></table>';
   $('qp-screen-status').textContent=`Screened ${result.searchedRecords} FASTA records (${result.totalBackgroundBases} bp); ${result.totalAmplicons} predicted local products.${result.truncated?' Output truncated.':''} This is NOT genome-wide specificity.`;
 }catch(e){$('qp-screen-status').textContent='Screening issue: '+e.message;}});
})();
