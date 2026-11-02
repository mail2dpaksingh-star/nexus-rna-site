/* NEXUS Guided Full Construct Review — exploratory annotation, NOT sequence validation.
   Reads files in browser only. Existing QA and importer unchanged.
*/
(function(root){'use strict';
 const $=id=>document.getElementById(id); const supported=!!(root.NexusConstructFileImport&&$('qa-import')&&$('qa-import-role')&&$('qa-modality')&&$('qa-run'));
 if(!supported)return;
 const clean=s=>{let x=String(s||'').replace(/^>[^\n]*\n/g,'').replace(/[\s\d]/g,'').toUpperCase();if(!x||!/^[ACGTU]+$/.test(x)||x.includes('T')&&x.includes('U'))throw Error('Provide one DNA/RNA sequence (A/C/G/T or A/C/G/U); no labels or ambiguous bases.');return x.replace(/U/g,'T');};
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
 <p class="qa-guide-sub">Import the entire DNA template once or paste its sequence. Suggested features are <strong>not verified</strong>; confirm their coordinates before the original RNA quality review.</p>
 <div class="qa-field"><label for="nexus-full-paste">Paste complete DNA construct (optional)</label><textarea id="nexus-full-paste" rows="3" spellcheck="false" placeholder="Paste one continuous DNA sequence, including upstream promoter and downstream DNA if present"></textarea></div>
 <div class="qa-actions"><button type="button" id="nexus-full-analyze" class="alt">Analyze complete sequence</button></div>
 <p id="nexus-full-status" role="status" class="qa-status"></p>
 <div id="nexus-full-results" hidden>
 <div class="qa-guide-evidence" id="nexus-full-evidence"></div>
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
 <p class="qa-guide-sub">A T7 promoter is <strong>DNA</strong> and must be excluded from the RNA transcript. Kozak bases span the 5′ UTR–CDS junction; an encoded secretion signal is part of the CDS. An exact secretion-signal boundary or antigen identity cannot be established by motif scanning alone.</p>
 <div class="qa-actions"><button type="button" id="nexus-full-confirm">Apply confirmed boundaries &amp; run review</button><button type="button" id="nexus-full-export" class="alt">Export proposed annotation JSON</button></div>
 <p class="qa-guide-sub">The original quality review still requires a verified reading frame, transcript architecture, cap-processing information and biological validation. Proposed annotations are not experimental evidence.</p>
 </div>`;
 const fileInput=$('qa-import'); const anchor=role.closest('.qa-field')||fileInput.closest('.qa-field');anchor.after(panel);
 const status=(t,bad=false)=>{const e=$('nexus-full-status');e.textContent=t;e.classList.toggle('bad',bad);};
 let current=null;
 function updateMap(){if(!current)return;const c=['tss','cds-start','cds-end','utr3-end','poly-start','poly-end'].map(k=>Number($('nexus-full-'+k).value)||0);
   const [tss,cs,ce,u3,ps,pe]=c;const rows=[['5′ UTR',tss,cs-1],['Coding sequence (includes signal + antigen)',cs,ce],['3′ UTR',ce+1,u3]];
   if(ps&&pe)rows.push(['DNA-encoded poly(A) candidate',ps,pe]);
   $('nexus-full-map').replaceChildren();for(const [title,a,b] of rows){const e=document.createElement('div');e.textContent=`${title}: ${a||'?'}–${b||'?'} (${a&&b&&b>=a?b-a+1:0} bp)`;$('nexus-full-map').append(e);}
 }
 for(const id of ['tss','cds-start','cds-end','utr3-end','poly-start','poly-end'])$('nexus-full-'+id).addEventListener('input',updateMap);
 function show(record,source){current={...record,source};panel.hidden=false;$('nexus-full-results').hidden=false;
   const c=record.coordinates;for(const [key,val]of Object.entries({'tss':c.tss,'cds-start':c.cdsStart,'cds-end':c.cdsEnd,'utr3-end':c.utr3End,'poly-start':c.polyStart,'poly-end':c.polyEnd}))$('nexus-full-'+key).value=val||'';
   const opts=$('nexus-full-orf');opts.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a CDS candidate / edit coordinates';opts.append(placeholder);
   for(const [i,o] of record.orfs.entries()){const e=document.createElement('option');e.value=String(i);e.textContent=`${o.start}–${o.end} (${o.length} nt), Kozak context score ${o.kozak}/3`;opts.append(e);}
   const notes=[`Uploaded sequence: ${record.dna.length} bp`,record.t7?`Canonical T7 promoter motif: ${record.t7.start}–${record.t7.end} (transcription start remains provisional)`:`T7 promoter: ${record.t7Matches?'Multiple exact matches; ambiguous':'not uniquely identified'}`,
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
   $('qa-run').click();status('The confirmed DNA regions were converted to RNA and sent to the existing review. T7 promoter and any downstream vector DNA were excluded. Cap chemistry and antigen identity remain unverified.');
 }catch(error){status(error.message,true);}});
 root.NexusFullConstructGuide=Object.freeze({suggest,ORFs,runs,genbankFeatures});
})(window);
