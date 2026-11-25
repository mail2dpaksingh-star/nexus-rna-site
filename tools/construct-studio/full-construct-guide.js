/* NEXUS Guided Full Construct Review — exploratory annotation, NOT sequence validation.
   Reads files in browser only. Existing QA and importer unchanged.
*/
(function(root){'use strict';
 const $=id=>document.getElementById(id); const supported=!!(root.NexusConstructFileImport&&$('qa-import')&&$('qa-import-role')&&$('qa-modality')&&$('qa-run'));
 if(!supported)return;
 const clean=s=>{let x=String(s||'').replace(/^>[^\n]*\n/g,'').replace(/[\s\d]/g,'').toUpperCase();if(!x||!/^[ACGT]+$/.test(x))throw Error('Complete DNA construct requires A/C/G/T only (no RNA U), supplied 5′→3′ in coding/sense orientation. Check strand orientation; do not paste an RNA transcript.');return x;};
 const reverseComplement=s=>s.replace(/[ACGT]/g,ch=>({A:'T',C:'G',G:'C',T:'A'})[ch]).split('').reverse().join('');
 const promoter='TAATACGACTCACTATA';
 function genbankFeatures(text){
   if(!/^FEATURES\s/m.test(text))return [];
   const area=(text.split(/^FEATURES\s.*$/m)[1]||'').split(/^ORIGIN\s*$/m)[0];
   const lines=area.split(/\r?\n/),out=[];let current=null;
   for(const line of lines){
     let m=line.match(/^\s{5}([a-zA-Z0-9_'-]+)\s+(.+)$/);
     if(m){const typ=m[1],loc=m[2].trim();let basic=loc.match(/^(\d+)\.\.(\d+)$/);current=null;
       if(basic){current={type:typ.toLowerCase(),start:+basic[1],end:+basic[2],location:loc,note:''};out.push(current);}continue;}
     if(current){const q=line.match(/^\s+\/(?:label|note|product|gene|standard_name)="?([^"\n]+)"?\s*$/);if(q)current.note+=' '+q[1];}
   }
   return out;
 }
 function ORFs(dna,startAfter){const stop=new Set(['TAA','TGA','TAG']),found=[];
   for(let i=Math.max(0,startAfter);i+2<dna.length;i++){
     if(dna.slice(i,i+3)!=='ATG')continue;
     for(let j=i+3;j+2<dna.length;j+=3){const triplet=dna.slice(j,j+3);if(!stop.has(triplet))continue;
       const minus3=i>=3?dna[i-3]:'',plus4=dna[i+3]||'',kozak=(/[AG]/.test(minus3)?2:0)+(plus4==='G'?1:0),len=j+3-i;
       if(len>=30)found.push({start:i+1,end:j+3,length:len,kozak,context:dna.slice(Math.max(0,i-6),i+6)});
       break;
     }
   }
   return found.sort((a,b)=>(b.kozak-a.kozak)||b.length-a.length).slice(0,30);
 }
 function runs(dna){return Array.from(dna.matchAll(/A{20,}/g)).map(m=>({start:m.index+1,end:m.index+m[0].length,length:m[0].length}));}
 function suggest(seq,metadata=''){
   const dna=clean(seq),features=genbankFeatures(metadata);
   const promoterStarts=Array.from(dna.matchAll(new RegExp(promoter,'g'))).map(m=>m.index+1);
   const t7=promoterStarts.length===1?{start:promoterStarts[0],end:promoterStarts[0]+promoter.length-1}:null;
   const origin=t7?t7.end+1:1;
   const named=type=>features.find(f=>f.type===type && f.start>=1 && f.end<=dna.length);
   const curated5=named('5\'utr')||named('5utr');const curated3=named('3\'utr')||named('3utr');const curatedCDS=named('cds');
   const orfs=ORFs(dna,origin-1);
   const cds=(curatedCDS?{start:curatedCDS.start,end:curatedCDS.end,kozak:null,length:curatedCDS.end-curatedCDS.start+1,source:'GenBank'}:orfs[0]||null);
   const aruns=runs(dna).filter(a=>!cds||a.start>cds.end),poly=aruns.length?aruns.sort((a,b)=>b.length-a.length)[0]:null;
   const transcriptionStart=curated5?.start||origin;
   const utr3End=curated3?.end||(poly?poly.start-1:dna.length);
   return {dna,features,t7,t7Matches:promoterStarts.length,orfs,cds,poly,otherA:runs(dna),sourceEvidence:curatedCDS?'GenBank CDS feature':'start/stop codon hypothesis',coordinates:{tss:transcriptionStart,cdsStart:cds?.start||0,cdsEnd:cds?.end||0,utr3End:utr3End,polyStart:poly?.start||0,polyEnd:poly?.end||0},annotated:!!(curated5&&curated3&&curatedCDS)};
 }
 const role=$('qa-import-role');if(!role.querySelector('[value="full-guided"]')){const opt=document.createElement('option');opt.value='full-guided';opt.textContent='Complete DNA construct — guided feature mapping (T7, UTR, CDS, poly(A))';role.insertBefore(opt,role.options[role.options.length-1]||null);}
 const panel=document.createElement('section');panel.id='nexus-full-guide';panel.className='qa-guide';panel.hidden=true;
 panel.innerHTML=`<h3>Complete DNA Construct — Guided Annotation</h3>
 <p class="qa-guide-sub">Import or paste the full <strong>DNA sequence (A, C, G, T)</strong> in 5′→3′ coding/sense-strand orientation. If your file is the opposite (template) strand, first obtain its reverse complement. Suggested features are <strong>not verified</strong>; confirm their coordinates before a separate RNA quality review.</p>
 <div class="qa-field"><label for="nexus-full-paste">Paste complete DNA construct (optional)</label><textarea id="nexus-full-paste" rows="3" spellcheck="false" placeholder="Paste one continuous DNA sequence, including upstream promoter and downstream DNA if present"></textarea></div>
 <div class="qa-actions"><button type="button" id="nexus-full-analyze" class="alt">Analyze complete sequence</button></div>
 <p id="nexus-full-status" role="status" class="qa-status"></p>
 <div id="nexus-full-results" hidden>
 <div class="qa-guide-evidence" id="nexus-full-evidence"></div>
 <div class="qa-field"><label for="nexus-full-dna-sequence">Complete DNA construct — 5′→3′ coding strand (A / T / G / C)</label><textarea id="nexus-full-dna-sequence" rows="6" readonly spellcheck="false" aria-describedby="nexus-full-dna-help"></textarea><small id="nexus-full-dna-help" class="qa-muted">Read-only original DNA sequence, including promoter and any downstream DNA; not the resulting RNA. Full sequence and coordinate annotations are retained in the DNA JSON export.</small></div>
 <div class="qa-field"><label for="nexus-full-orf">Proposed CDS (select candidate)</label><select id="nexus-full-orf"></select><small class="qa-muted">ORFs from start/stop codons are hypotheses, not antigen identification.</small></div>
 <div class="qa-guide-map" id="nexus-full-map"></div>
 <p class="qa-guide-sub">Coordinates refer to the <strong>uploaded DNA template</strong> (1-based inclusive), not the resulting RNA transcript.</p>
 <div class="qa-guide-grid">
 <label>Transcribed 5′ UTR start<input type="number" id="nexus-full-tss" min="1" step="1"></label>
 <label>CDS start (ATG)<input type="number" id="nexus-full-cds-start" min="1" step="1"></label>
 <label>CDS end (stop inclusive)<input type="number" id="nexus-full-cds-end" min="1" step="1"></label>
 <label>3′ UTR end<input type="number" id="nexus-full-utr3-end" min="1" step="1"></label>
 <label>DNA poly(A) start (optional)<input type="number" id="nexus-full-poly-start" min="0" step="1"></label>
 <label>DNA poly(A) end (optional)<input type="number" id="nexus-full-poly-end" min="0" step="1"></label>
 </div>
 <p class="qa-guide-sub">A T7 promoter is <strong>DNA</strong> and is excluded from the RNA transcript. The coordinate map above and full sequence view are in DNA bases (T, never U). Kozak bases span the 5′ UTR–CDS junction; a signal peptide is encoded within the CDS. Motif scanning does not verify promoter function, transcription start, encoded protein identity or sequence correctness.</p>
 <div id="nexus-full-rna-preview" hidden class="qa-field"><label for="nexus-full-rna-sequence">Provisional transcribed region — RNA projection (5′→3′, U instead of T)</label><textarea id="nexus-full-rna-sequence" rows="4" readonly spellcheck="false"></textarea><small class="qa-muted">Shown separately after you confirm DNA boundaries. Excludes promoter and downstream vector DNA; transcript start, processing, cap and final poly(A) still require verification.</small></div>
 <div class="qa-actions"><button type="button" id="nexus-full-confirm">Apply confirmed boundaries &amp; run review</button><button type="button" id="nexus-full-export" class="alt">Export proposed annotation JSON</button></div>
 <p class="qa-guide-sub">The original quality review still requires a verified reading frame, transcript architecture, cap-processing information and biological validation. Proposed annotations are not experimental evidence.</p>
 </div>`;
 const fileInput=$('qa-import'); const anchor=role.closest('.qa-field')||fileInput.closest('.qa-field');anchor.after(panel);
 const status=(t,bad=false)=>{const e=$('nexus-full-status');e.textContent=t;e.classList.toggle('bad',bad);};
 let current=null;
 function updateMap(){if(!current)return;const c=['tss','cds-start','cds-end','utr3-end','poly-start','poly-end'].map(k=>Number($('nexus-full-'+k).value)||0);
   const [tss,cs,ce,u3,ps,pe]=c;const rows=[...(current.t7?[['T7 promoter candidate — DNA only',current.t7.start,current.t7.end]]:[]),['5′ UTR — DNA',tss,cs-1],['CDS — DNA (includes any encoded signal)',cs,ce],['3′ UTR — DNA',ce+1,u3]];
   if(ps&&pe)rows.push(['DNA-encoded poly(A) candidate',ps,pe]);
   $('nexus-full-rna-preview').hidden=true;$('nexus-full-rna-sequence').value='';
   $('nexus-full-map').replaceChildren();for(const [title,a,b] of rows){const e=document.createElement('div'),valid=a>=1&&b>=a&&b<=current.dna.length,seq=valid?current.dna.slice(a-1,b):'';const preview=seq.length<=36?seq:seq.slice(0,18)+'…'+seq.slice(-12);e.textContent=`${title}: ${a||'?'}–${b||'?'} (${valid?b-a+1:0} bp)${valid?' · 5′–'+preview+'–3′':''}`;$('nexus-full-map').append(e);}
 }
 for(const id of ['tss','cds-start','cds-end','utr3-end','poly-start','poly-end'])$('nexus-full-'+id).addEventListener('input',updateMap);
 function show(record,source){current={...record,source};panel.hidden=false;$('nexus-full-results').hidden=false;
   $('nexus-full-dna-sequence').value=record.dna.match(/.{1,80}/g).join('\n');
   const c=record.coordinates;for(const [key,val]of Object.entries({'tss':c.tss,'cds-start':c.cdsStart,'cds-end':c.cdsEnd,'utr3-end':c.utr3End,'poly-start':c.polyStart,'poly-end':c.polyEnd}))$('nexus-full-'+key).value=val||'';
   const opts=$('nexus-full-orf');opts.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a CDS candidate / edit coordinates';opts.append(placeholder);
   for(const [i,o] of record.orfs.entries()){const e=document.createElement('option');e.value=String(i);e.textContent=`${o.start}–${o.end} (${o.length} nt), Kozak context score ${o.kozak}/3`;opts.append(e);}
   const notes=[`Uploaded DNA: ${record.dna.length} bp · 5′→3′ coding/sense orientation assumed (not independently checked)`,record.t7?`Canonical T7 promoter motif: ${record.t7.start}–${record.t7.end} (transcription start remains provisional)`:`T7 promoter: ${record.t7Matches?'Multiple exact matches; ambiguous':'not uniquely identified'}`,
     record.cds?`Coding-region candidate: ${record.cds.start}–${record.cds.end} (${record.sourceEvidence})`:'No complete ORF confidently proposed; enter CDS boundaries',
     record.poly?`A tract: ${record.poly.start}–${record.poly.end} (${record.poly.length} A bases; encoded poly(A) candidate, not proven transcript terminus)`:'No long DNA poly(A) run detected',
     'Secretion signal / antigen identity: not inferred; supply verified feature annotation if available'];
   const e=$('nexus-full-evidence');e.replaceChildren();notes.forEach(n=>{const p=document.createElement('p');p.textContent=n;e.append(p);});
   status('Candidate map generated. Check each field and correct boundaries before review.');updateMap();panel.scrollIntoView({block:'nearest'});
 }
 $('nexus-full-orf').addEventListener('change',e=>{const i=Number(e.target.value);if(e.target.value!==''&&current?.orfs?.[i]){const o=current.orfs[i];$('nexus-full-cds-start').value=o.start;$('nexus-full-cds-end').value=o.end;const u=Number($('nexus-full-utr3-end').value);if(u<=o.end)$('nexus-full-utr3-end').value=current.poly?.start?current.poly.start-1:current.dna.length;updateMap();}});
 role.addEventListener('change',()=>{panel.hidden=role.value!=='full-guided';if(role.value==='full-guided'){panel.hidden=false;status('Choose a file above, or paste the full sequence below and click Analyze complete sequence.');}});
 fileInput.addEventListener('change',async event=>{
   if(role.value!=='full-guided')return;event.stopImmediatePropagation();
   try{const file=event.target.files?.[0];if(!file)return;if(file.size>2000000)throw Error('Maximum file size is 2 MB.');
     const result=await root.NexusConstructFileImport.parse(file);
     if(!result.sequence)throw Error('No nucleotide sequence found in the file.');
     let raw='';if(result.format==='genbank')raw=await file.text();
     show(suggest(result.sequence,raw),file.name);
   }catch(error){panel.hidden=false;status(error.message,true);}
   finally{event.target.value='';}
 },true);
 $('nexus-full-analyze').addEventListener('click',()=>{try{show(suggest($('nexus-full-paste').value),'Pasted complete DNA');}catch(error){panel.hidden=false;status(error.message,true);}});
 function mapped(){if(!current)throw Error('Import or paste a full DNA sequence first.');
   const N=current.dna.length,get=k=>Number($('nexus-full-'+k).value)||0;
   const tss=get('tss'),cs=get('cds-start'),ce=get('cds-end'),end=get('utr3-end'),ps=get('poly-start'),pe=get('poly-end');
   if(![tss,cs,ce,end].every(Number.isInteger)||tss<1||cs<=tss||ce<cs||end<=ce||end>N)throw Error('Check UTR/CDS coordinates: 1 ≤ transcription start < CDS start ≤ CDS end < 3′ UTR end ≤ sequence length.');
   if((ce-cs+1)%3!==0)throw Error('CDS length must be divisible by three. Confirm the reading frame.');
   const cds=current.dna.slice(cs-1,ce);
   if(!cds.startsWith('ATG')||!['TAA','TGA','TAG'].includes(cds.slice(-3)))throw Error('Selected CDS must begin with ATG and end with an in-frame stop codon.');
   if(Boolean(ps)!==Boolean(pe))throw Error('Provide both poly(A) coordinates or leave both blank.');
   if(ps||pe){if(ps!==end+1||pe<ps||pe>N||!/^[A]+$/.test(current.dna.slice(ps-1,pe)))throw Error('DNA poly(A) region must immediately follow the 3′ UTR and consist entirely of A bases.');}
   return {source:current.source,dna:current.dna,roles:{utr5:{start:tss,end:cs-1},cds:{start:cs,end:ce},utr3:{start:ce+1,end}, ...(ps?{polyA:{start:ps,end:pe}}:{})},promoter:current.t7,notes:'User-confirmed DNA-template coordinates; not independently sequence-validated.'};
 }
 function download(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('nexus-full-export').addEventListener('click',()=>{try{const m=mapped();download('NEXUS_Full_DNA_Construct_Annotations.json',{schema:'nexus-full-dna-template-annotation-v1',...m});status('Exported reviewed coordinate annotation JSON.');}catch(error){status(error.message,true);}});
 $('nexus-full-confirm').addEventListener('click',()=>{try{const m=mapped(),slice=region=>m.dna.slice(region.start-1,region.end).replace(/T/g,'U');
   if(!$('qa-modality').value.startsWith('linear-'))throw Error('For this construct choose a linear mRNA modality first.');
   for(const [id,key] of [['qa-utr5','utr5'],['qa-cds','cds'],['qa-utr3','utr3']]){$(id).value=slice(m.roles[key]);$(id).dispatchEvent(new Event('input',{bubbles:true}));}
   $('qa-poly').value=m.roles.polyA?m.roles.polyA.end-m.roles.polyA.start+1:0;
   $('qa-cap').value=$('qa-modality').value==='linear-ivt'?'unspecified':'cellular';
   const rna=m.dna.slice(m.roles.utr5.start-1,m.roles.utr3.end).replace(/T/g,'U');
   $('nexus-full-rna-sequence').value=rna.match(/.{1,80}/g).join('\n');
   $('nexus-full-rna-preview').hidden=false;
   $('qa-run').click();status('DNA annotated in A/T/G/C. Transcribed region was projected separately in RNA (A/U/G/C) and sent to RNA review. Promoter and downstream vector DNA are excluded; strand orientation, true transcript boundaries and cap/poly(A) processing still require confirmation.');
 }catch(error){status(error.message,true);}});
 root.NexusFullConstructGuide=Object.freeze({suggest,ORFs,runs,genbankFeatures});
})(window);
