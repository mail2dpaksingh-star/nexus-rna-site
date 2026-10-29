/* NEXUS vector catalog + sequence-grounded MCS/restriction targeting.
 * Metadata catalog entries never become synthetic sequences. The existing NEXUS
 * Plasmid Bridge performs virtual sequence assembly; no chemistry is simulated.
 * All calculations browser-local. No external API or automatic downloads.
 */
(function(root,build){
  const api=build();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root&&root.document){root.NEXUS_VECTOR_CATALOG_MCS=api;api.install(root.document,root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const MOTIFS=[
 ['EcoRI','GAATTC',1],['BamHI','GGATCC',1],['HindIII','AAGCTT',1],['XhoI','CTCGAG',1],
 ['NotI','GCGGCCGC',2],['PstI','CTGCAG',5],['NheI','GCTAGC',1],['XbaI','TCTAGA',1],
 ['SpeI','ACTAGT',1],['SacI','GAGCTC',5],['KpnI','GGTACC',5],['SalI','GTCGAC',1],
 ['SmaI','CCCGGG',3],['NdeI','CATATG',2],['NcoI','CCATGG',1],['MluI','ACGCGT',1],
 ['BglII','AGATCT',1],['EcoRV','GATATC',3],['SphI','GCATGC',5],['ApaI','GGGCCC',5]
];
const CATEGORY=['General cloning','E. coli expression','Mammalian expression','IVT / mRNA templates','Lentiviral vectors','CAR expression'];
const REF='https://www.snapgene.com/plasmids';
const AG='https://www.addgene.org/search/catalog/plasmids/';
// Indexed reference names, not bundled sequence records. Exact sequence/rights
// must be checked on the linked provider record before assembly.
const STARTERS=[
 ['pUC19','General cloning','lac', 'M77789.2','https://www.ncbi.nlm.nih.gov/nuccore/M77789.2'],
 ['pBR322','General cloning','tet / bla','J01749.1','https://www.ncbi.nlm.nih.gov/nuccore/J01749.1'],
 ['pBluescript II SK(+)','General cloning','lac','Catalog reference',REF],
 ['pGEM-T Easy','General cloning','T7 / SP6','Catalog reference',REF],
 ['pCR2.1-TOPO','General cloning','lac','Catalog reference',REF],
 ['pJET1.2/blunt','General cloning','T7','Catalog reference',REF],
 ['pET-28a(+)','E. coli expression','T7','Catalog reference',REF],
 ['pET-21a(+)','E. coli expression','T7','Catalog reference',REF],
 ['pETDuet-1','E. coli expression','T7','Catalog reference',REF],
 ['pCDFDuet-1','E. coli expression','T7','Catalog reference',REF],
 ['pGEX-6P-1','E. coli expression','tac','Catalog reference',REF],
 ['pBAD/His','E. coli expression','araBAD','Catalog reference',REF],
 ['pMAL-c5X','E. coli expression','tac','Catalog reference',REF],
 ['pcDNA3.1(+)','Mammalian expression','CMV','Catalog reference',REF],
 ['pCAGGS','Mammalian expression','CAG','Catalog reference',AG],
 ['pEGFP-N1','Mammalian expression','CMV','Catalog reference',REF],
 ['pCMV-Tag2B','Mammalian expression','CMV','Catalog reference',AG],
 ['pGL4.10[luc2]','Mammalian expression','User-selected','Catalog reference',REF],
 ['pGEM4Z-T7-5\u2032UTR-EGFP-3\u2032UTR-A64','IVT / mRNA templates','T7','Addgene #203348','https://www.addgene.org/203348/'],
 ['pGEM4Z-T7-5\u2032UTR-mGreenLantern-3\u2032UTR-A64','IVT / mRNA templates','T7','Addgene #203349','https://www.addgene.org/203349/'],
 ['pGEM-4Z','IVT / mRNA templates','T7 / SP6','Catalog reference',REF],
 ['pLKO.1 puro','Lentiviral vectors','U6','Addgene #8453','https://www.addgene.org/8453/'],
 ['pLKO.3G','Lentiviral vectors','U6','Addgene #14748','https://www.addgene.org/14748/'],
 ['pLKO.1 TRC cloning','Lentiviral vectors','U6','Addgene #10878','https://www.addgene.org/10878/'],
 ['pLVX-Puro','Lentiviral vectors','CMV','Catalog reference',AG],
 ['FUW-[EF1α-CD19 4-1BB]','CAR expression','EF1a','Addgene #218336','https://www.addgene.org/218336/'],
 ['DN-28z-CAR-miSFIT-Scramble','CAR expression','Review source','Addgene #221640','https://www.addgene.org/221640/'],
 ['DN-28z-CAR-miSFIT-12-C','CAR expression','Review source','Addgene #221634','https://www.addgene.org/221634/'],
 ['pRRLSIN-[EF1α-HER1 4-1BB]','CAR expression','EF1a','Addgene #218341','https://www.addgene.org/218341/']
].map(([name,category,promoter,reference,url],i)=>({id:'ref-'+i,name,category,promoter,reference,url,sequenceAvailable:false}));
const KEY='nexus-local-vector-catalog-v1';
function motifs(sequence){
 const seq=String(sequence||'').toUpperCase().replace(/\s/g,'');
 if(!seq.length||/[^ACGT]/.test(seq)) throw Error('Select a DNA backbone containing only A/C/G/T.');
 const n=seq.length,out=[];
 for(const [enzyme,motif,cutOffset] of MOTIFS){
  const wrap=seq+seq.slice(0,motif.length-1);
  for(let i=0;i<n;i++)if(wrap.slice(i,i+motif.length)===motif)
   out.push({enzyme,motif,start:i+1,end:((i+motif.length-1)%n)+1,cut:(i+cutOffset)%n,cutOffset});
 }
 return out.sort((a,b)=>a.start-b.start||a.enzyme.localeCompare(b.enzyme));
}
function mcsRegions(backbone){return (backbone.features||[]).filter(f=>/\bMCS\b|polylinker|multiple.cloning/i.test(String(f.label||''))&&Number.isInteger(+f.start)&&Number.isInteger(+f.end)&&f.end>=f.start&&f.end<=backbone.sequence.length).map(f=>({start:+f.start,end:+f.end,label:String(f.label)}));}
function locationInfo(backbone){const all=motifs(backbone.sequence),mcs=mcsRegions(backbone);
 const counts={};all.forEach(x=>counts[x.enzyme]=(counts[x.enzyme]||0)+1);
 return {all:all.map(x=>({...x,count:counts[x.enzyme],inMCS:mcs.some(f=>x.start>=f.start&&x.start<=f.end)})),mcs};}
function target(backbone,kind,id1,id2){
 const info=locationInfo(backbone),at=k=>{const v=info.all.find(x=>x.enzyme+'@'+x.start===k);if(!v)throw Error('Selected restriction site is not present in the loaded backbone sequence.');return v;};
 if(kind==='mcs'){
  const feature=info.mcs[Number(id1)];if(!feature)throw Error('This backbone has no annotated MCS. Import an annotated GenBank file or select a restriction site.');
  return {settings:{mode:'replace',start:feature.start,end:feature.end},label:'Replace '+feature.label+' ('+feature.start+'–'+feature.end+')',warning:'This is sequence replacement of an annotated MCS, not a restriction-digestion or ligation simulation.'};
 }
 if(kind==='site'){
  const s=at(id1);
  return {settings:{mode:'insert',after:s.cut},label:s.enzyme+' · motif at '+s.start+' · cut boundary '+s.cut,warning:'A single-site virtual insertion does not establish compatible ends or successful ligation. The selected restriction site may be interrupted by insertion.'};
 }
 if(kind==='pair'){
  const a=at(id1),b=at(id2);
  if(a.start===b.start)throw Error('Choose two distinct recognition sites.');
  const lo=Math.min(a.cut,b.cut),hi=Math.max(a.cut,b.cut);
  if(hi===lo)throw Error('The selected enzymes resolve to the same insertion boundary.');
  if(hi-lo>backbone.sequence.length*.5)throw Error('This simple linear-interval replacement would remove over half the vector. Review the desired circular arc or choose another pair.');
  return {settings:{mode:'replace',start:lo+1,end:hi},label:a.enzyme+' / '+b.enzyme+' · replace between cut boundaries '+lo+' and '+hi,warning:'Dual-site replacement is coordinate-level only. Overhang identity, digestion, insert-end design, ligation, methylation and biological expression are NOT simulated.'};
 }
 throw Error('Unknown target mode.');
}
function goodUrl(value){try{const u=new URL(String(value));return u.protocol==='https:'?u.href:'';}catch(_){return '';}}
function safe(t,max=140){return String(t==null?'':t).replace(/[<>\x00-\x1f]/g,' ').slice(0,max).trim();}
function parseCatalogCSV(data){
  // Properly quoted CSV, with limits; no external data loading. Header matching.
  const txt=String(data||'');if(txt.length>500000)throw Error('Catalog CSV must be below 500 KB.');
  const rows=[];let cur='',row=[],quote=false;
  for(let i=0;i<txt.length;i++){const c=txt[i];if(quote){if(c==='"'&&txt[i+1]==='"'){cur+='"';i++;}else if(c==='"')quote=false;else cur+=c;}
   else if(c==='"')quote=true;else if(c===','){row.push(cur);cur='';}else if(c==='\n'){row.push(cur.replace(/\r$/,''));rows.push(row);cur='';row=[];}else cur+=c;}
  if(quote)throw Error('Unclosed CSV quote.');row.push(cur);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length<2)throw Error('Catalog CSV must have a header and at least one row.');
  const header=rows.shift().map(x=>x.trim().toLowerCase());const ix=k=>header.indexOf(k);
  if(['name','category','promoter','reference','url'].some(k=>ix(k)<0)) throw Error('Required columns: name,category,promoter,reference,url');
  return rows.slice(0,2000).filter(r=>r.some(x=>x.trim())).map((r,i)=>{
   const category=safe(r[ix('category')],70);if(!CATEGORY.includes(category))throw Error('Unknown category in catalog row '+(i+2));
   return {id:'custom-'+i,name:safe(r[ix('name')]),category,promoter:safe(r[ix('promoter')]),reference:safe(r[ix('reference')]),url:goodUrl(r[ix('url')]),sequenceAvailable:false};
  }).filter(r=>r.name);
}
function install(doc,root){
 const anchor=doc.getElementById('nexus-plasmid-assembly');if(!anchor||doc.getElementById('nexus-vector-catalog-mcs'))return;
 const style=doc.createElement('link');style.rel='stylesheet';style.href='vector-catalog-mcs.css';doc.head.append(style);
 const panel=doc.createElement('section');panel.id='nexus-vector-catalog-mcs';panel.className='nexus-mcs-panel';
 panel.innerHTML=`<h2>Vector library &amp; restriction-site cloning</h2>
 <p>Search by vector class and promoter. <strong>Only sequence-loaded vectors</strong> can be used for virtual insertion; catalog entries are reference links, not manufactured sequences.</p>
 <div class="nexus-mcs-grid"><label>Vector category<select id="mcs-category"></select></label><label>Promoter filter<select id="mcs-promoter"><option value="">All promoter classes</option></select></label><label>Search vectors<input id="mcs-search" placeholder="pUC19, pET, CMV, T7, CAR..."></label></div>
 <div class="nexus-mcs-results"><p id="mcs-total"></p><div id="mcs-vector-results" aria-live="polite"></div></div>
 <p class="nexus-mcs-muted">Catalog references open their original provider pages. Import your authorized complete GenBank/FASTA sequence into the existing Plasmid Workbench, then press <strong>Use current plasmid</strong>. FASTA without feature annotations may have no selectable MCS.</p>
 <div class="nexus-mcs-actions"><label class="btn" for="mcs-import-csv">Import reference catalog CSV (metadata)</label><input id="mcs-import-csv" type="file" accept=".csv,text/csv" hidden><button class="btn" type="button" id="mcs-download-template">Download catalog CSV template</button><button class="btn" type="button" id="mcs-clear-catalog">Clear imported catalog</button></div>
 <div class="nexus-mcs-divider"></div><h3>Select MCS or restriction-site target</h3><p id="mcs-backbone-meta" role="status">Load a circular DNA backbone using the existing Workbench, then click Use current plasmid.</p>
 <div class="nexus-mcs-grid"><label>Target type<select id="mcs-target-kind"><option value="mcs">Annotated MCS (replace entire region)</option><option value="site">One mapped restriction site</option><option value="pair">Two mapped restriction sites</option></select></label>
 <label>First target<select id="mcs-site-first"></select></label><label id="mcs-second-wrap" hidden>Second restriction site<select id="mcs-site-second"></select></label></div>
 <p id="mcs-target-description" class="nexus-mcs-muted"></p>
 <button class="btn primary" type="button" id="mcs-build">Assemble at selected site</button><p id="mcs-status" role="status"></p>
 <details><summary>Advanced: manual coordinate-based assembly</summary><p>The previous numeric-coordinate controls remain available here for expert users.</p><div id="mcs-advanced"></div></details>
 <details><summary>Methods &amp; limitations</summary><p>Restriction motif positions are computed from the selected DNA backbone, including origin-spanning matches. The displayed enzyme position denotes a recognition motif; the boundary is based on the canonical top-strand cut offset for supported palindromic Type II enzymes.</p><p>Assembly is <strong>sequence-level concatenation or replacement only</strong>. Sticky/blunt end compatibility, overhang repair, ligation, enzyme methylation sensitivity, star activity, frame preservation and functional expression are not established. The tool will not infer nonexistent enzyme sites or create a vector from catalog metadata.</p><p>Lentiviral and CAR entries are discovery-only until complete authorized sequence records are imported and reviewed. Follow institutional biosafety and material-use requirements for viral and engineered-cell research.</p></details>`;
 anchor.insertAdjacentElement('beforebegin',panel);
 const $=id=>doc.getElementById(id);let imported=[];
 try{const tmp=JSON.parse(root.localStorage.getItem(KEY)||'[]');if(Array.isArray(tmp))imported=tmp.slice(0,2000).filter(x=>x&&typeof x.name==='string'&&CATEGORY.includes(x.category)).map(x=>({...x,url:goodUrl(x.url),sequenceAvailable:false}));}catch(_){ }
 const all=()=>STARTERS.concat(imported);
 const category=$('mcs-category');category.add(new Option('All vector classes',''));CATEGORY.forEach(c=>category.add(new Option(c,c)));
 const prs=[...new Set(STARTERS.flatMap(v=>v.promoter.split(/\s*\/\s*/)))].sort();prs.forEach(p=>$('mcs-promoter').add(new Option(p,p)));
 function renderCatalog(){const c=category.value,p=$('mcs-promoter').value,q=$('mcs-search').value.toLowerCase().trim();
  const records=all().filter(v=>(!c||v.category===c)&&(!p||v.promoter.toLowerCase().includes(p.toLowerCase()))&&(!q||[v.name,v.category,v.promoter,v.reference].join(' ').toLowerCase().includes(q)));
  $('mcs-total').textContent=`${records.length} matching catalog record(s) · ${all().length} starter/imported references. Full sequences are not bundled except for vectors already present in the Workbench.`;
  const parent=$('mcs-vector-results');parent.replaceChildren();
  records.slice(0,80).forEach(v=>{const card=doc.createElement('div');card.className='nexus-mcs-record';
   const label=doc.createElement('strong');label.textContent=v.name;card.appendChild(label);
   const meta=doc.createElement('small');meta.textContent=v.category+' · promoter: '+v.promoter+' · '+v.reference;card.appendChild(meta);
   if(v.url){const a=doc.createElement('a');a.href=v.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='View provider record';card.appendChild(a);}
   const note=doc.createElement('span');note.textContent='Sequence import required unless already selected in Workbench';card.append(note);
   parent.append(card);
  });
  if(records.length>80){const rest=doc.createElement('p');rest.textContent='Showing first 80 matches. Narrow search to see more.';parent.append(rest);}
 }
 [category,$('mcs-promoter'),$('mcs-search')].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',renderCatalog));
 $('mcs-import-csv').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{if(file.size>500000)throw Error('Catalog file must be below 500 KB.');imported=parseCatalogCSV(await file.text());try{root.localStorage.setItem(KEY,JSON.stringify(imported));}catch(_){ }renderCatalog();status('Imported '+imported.length+' metadata records. Each complete plasmid sequence must still be imported separately.');}catch(err){status(err.message,true);}});
 $('mcs-clear-catalog').addEventListener('click',()=>{imported=[];try{root.localStorage.removeItem(KEY);}catch(_){ }renderCatalog();status('Imported catalog references cleared; bundled references unchanged.');});
 $('mcs-download-template').addEventListener('click',()=>{const data='name,category,promoter,reference,url\n"Example vector name","Mammalian expression","CMV","Provider accession","https://www.addgene.org/"\n';
  const uri=root.URL.createObjectURL(new Blob([data],{type:'text/csv'}));const a=doc.createElement('a');a.href=uri;a.download='NEXUS_vector_catalog_template.csv';a.click();root.setTimeout(()=>root.URL.revokeObjectURL(uri),1500);});
 const oldControls=doc.createElement('div'),oldMode=$('nexus-bridge-mode').closest('.nexus-bridge-controls'),oldCoords=$('nexus-bridge-after').closest('.nexus-bridge-controls');
 // Move, never delete, the previous controls. Bridge handlers still reference these IDs.
 $('mcs-advanced').append(oldMode,oldCoords);
 const selectA=$('mcs-site-first'),selectB=$('mcs-site-second');let base=null,info=null;
 function status(msg,bad=false){$('mcs-status').textContent=msg;$('mcs-status').classList.toggle('nexus-mcs-error',bad);}
 function safeBackbone(){const b=root.NEXUS_GET_CURRENT_RECORD?.();if(!b||!b.circular)throw Error('Please select a circular plasmid in Workbench first.');return b;}
 function setOptions(sel,list){sel.replaceChildren();for(const opt of list)sel.add(new Option(opt.label,opt.key));}
 function populate(){base=safeBackbone();info=locationInfo(base);
  const kind=$('mcs-target-kind').value,ms=kind==='mcs';$('mcs-second-wrap').hidden=kind!=='pair';
  const options=ms?info.mcs.map((f,i)=>({key:String(i),label:f.label+' ('+f.start+'–'+f.end+')'})):
    info.all.filter(s=>kind!=='pair'||s.inMCS).map(s=>({key:s.enzyme+'@'+s.start,label:s.enzyme+' · recognition '+s.start+' · '+(s.count===1?'unique':'total '+s.count)+(s.inMCS?' · MCS':'')}));
  setOptions(selectA,options);setOptions(selectB,options);
  $('mcs-backbone-meta').textContent=base.name+' · '+base.sequence.length+' bp · '+info.mcs.length+' MCS annotation(s) · '+info.all.length+' recognized restriction motif occurrence(s).';
  $('mcs-target-description').textContent=options.length?'Choose a mapped target from the selected backbone; no manual base number is required.':ms?'No MCS annotation found. Import an annotated vector or select a restriction site.':'No supported recognition sites in this scope; choose Any restriction site, or import a different vector.';
  $('mcs-build').disabled=!options.length;
 }
 $('mcs-target-kind').addEventListener('change',()=>{try{populate();}catch(e){status(e.message,true);}});
 $('nexus-bridge-use-backbone').addEventListener('click',()=>{try{populate();status('Recognition sites mapped from the selected vector sequence.');}catch(e){status(e.message,true);}});
 $('mcs-build').addEventListener('click',()=>{try{
  if(!base)throw Error('Click Use current plasmid to load its sequence and map restriction sites.');
  // Prevent silently applying saved targets to another record.
  const current=safeBackbone();if(current.sequence!==base.sequence||current.name!==base.name)throw Error('Active plasmid changed. Click Use current plasmid again before assembly.');
  const t=target(base,$('mcs-target-kind').value,selectA.value,selectB.value);
  const mode=$('nexus-bridge-mode');mode.value=t.settings.mode;mode.dispatchEvent(new Event('change'));
  if(t.settings.mode==='insert')$('nexus-bridge-after').value=String(t.settings.after);
  else{$('nexus-bridge-start').value=String(t.settings.start);$('nexus-bridge-end').value=String(t.settings.end);}
  const before=$('nexus-bridge-status').textContent;
  $('nexus-bridge-run').click();
  const err=$('nexus-bridge-status').classList.contains('nexus-bridge-error');
  if(err){status($('nexus-bridge-status').textContent,true);return;}
  status(t.label+' — virtual assembly generated. '+t.warning);
 }catch(e){status(e.message,true);}});
 renderCatalog();try{populate();}catch(e){$('mcs-backbone-meta').textContent=e.message;}
}
return {motifs,locationInfo,target,mcsRegions,parseCatalogCSV,STARTERS,install};
});
