/* NEXUS Plasmid of Choice — display and availability gate only.
   Preserves the underlying Workbench selection and existing assembly engines.
   Catalog metadata never becomes a sequence. No network calls or sequence fabrication. */
(function(root){ 'use strict';
 const doc=root.document, native=doc && doc.getElementById('choose-record');
 const catalogAPI=root.NEXUS_VECTOR_CATALOG_MCS;
 if(!native||!catalogAPI||doc.getElementById('nexus-choice-summary'))return;
 const categories=['General cloning','E. coli expression','Mammalian expression','IVT / mRNA templates','Lentiviral vectors','CAR expression'];
 const LOCAL_KEY='nexus-local-vector-catalog-v1';
 const nativeItems=[...native.options].map((el,i)=>{
  const name=el.textContent.replace(/\s*\([0-9,]+\s*bp\)\s*$/,'').trim();
  const isDemo=/SYNTHETIC DEMO/i.test(name), isVirtual=/virtual demo/i.test(name);
  return {key:String(i),name,category:'General cloning',availability:'ready',
   promoter:isDemo?'Illustrative promoter':'Not independently annotated',
   reference:isDemo?'Illustrative synthetic reference':isVirtual?'Educational modified sequence':'GenBank M77789.2',
   url:!isDemo&&!isVirtual?'https://www.ncbi.nlm.nih.gov/nuccore/M77789.2':'',
   sourceNote:isDemo?'Synthetic teaching-only DNA, not a verified plasmid':isVirtual?'Virtual educational sequence; not an authenticated plasmid':'Bundled exact pUC19 reference sequence',
   size:((root.NEXUS_DEMO_PLASMID&&i===0)?root.NEXUS_DEMO_PLASMID.sequence.length:
      (root.NEXUS_STARTER_PLASMIDS||[])[i-1]?.sequence?.length)||null,
   topology:'Circular',backboneId:i};
 });
 function safeText(value,max=160){return String(value==null?'':value).replace(/[<>\x00-\x1f]/g,' ').trim().slice(0,max);}
 function safeUrl(value){try{const u=new URL(String(value));return u.protocol==='https:'?u.href:'';}catch(_){return '';}}
 function importedEntries(){try{return (JSON.parse(root.localStorage?.getItem(LOCAL_KEY)||'[]')||[]).filter(x=>x&&categories.includes(x.category)&&x.name).slice(0,2000).map((x,i)=>({key:'import:'+i,name:safeText(x.name),category:x.category,availability:'catalog',promoter:safeText(x.promoter)||'Unspecified',reference:safeText(x.reference)||'User catalog record',url:safeUrl(x.url),sourceNote:'User-imported catalog metadata — verify all fields'}));}catch(_){return [];}}
 function getChoices(){
  const refs=(catalogAPI.STARTERS||[]).filter(r=>!(/^pUC19$/i.test(r.name)&&nativeItems.some(x=>/pUC19 \(GenBank M77789\.2\)/i.test(x.name))))
   .map(r=>({key:'ref:'+r.id,name:safeText(r.name),category:r.category,availability:'catalog',promoter:safeText(r.promoter)||'Unspecified',reference:safeText(r.reference),url:safeUrl(r.url),sourceNote:'Reference metadata; complete sequence is not bundled'}));
  return [...nativeItems,...refs,...importedEntries()];
 }
 const group=native.closest('.field');
 const label=group.querySelector('label[for="choose-record"]');
 if(label)label.textContent='Plasmid of choice';
 const searchWrap=doc.createElement('div');searchWrap.className='nexus-choice-search';
 const searchLabel=doc.createElement('label');searchLabel.htmlFor='nexus-choice-search-field';searchLabel.textContent='Search plasmid library (optional)';
 const search=doc.createElement('input');search.id='nexus-choice-search-field';search.type='search';search.placeholder='Search pUC19, pET, CMV, T7, CAR...';
 searchWrap.append(searchLabel,search);group.insertBefore(searchWrap,native);
 const helper=doc.createElement('p');helper.className='nexus-choice-hint';helper.textContent='Choose a verified sequence-backed record to work on its map, MCS and restriction sites. Catalog entries show reference metadata until you import DNA.';group.append(helper);
 const panel=doc.createElement('section');panel.id='nexus-choice-summary';panel.className='nexus-choice-summary';panel.setAttribute('aria-live','polite');
 const title=doc.createElement('h3');title.textContent='Selected plasmid summary';
 const state=doc.createElement('p');state.className='nexus-choice-state';
 const grid=doc.createElement('dl');grid.className='nexus-choice-grid';
 const note=doc.createElement('p');note.className='nexus-choice-note';
 const provider=doc.createElement('a');provider.target='_blank';provider.rel='noopener noreferrer';provider.textContent='View source reference';provider.hidden=true;
 panel.append(title,state,grid,note,provider);group.insertAdjacentElement('afterend',panel);
 const link=doc.createElement('link');link.rel='stylesheet';link.href='plasmid-choice.css';doc.head.append(link);
 let selection=native.value||'0', catalogOnly=false;
 function field(k,v){const wrap=doc.createElement('div');const dt=doc.createElement('dt');dt.textContent=k;const dd=doc.createElement('dd');dd.textContent=v;wrap.append(dt,dd);grid.append(wrap);}
 function setGates(block){catalogOnly=block;doc.getElementById('pane-annotation')?.classList.toggle('nexus-choice-catalog-only',block);
  for(const id of ['nexus-bridge-run','nexus-bridge-use-backbone','mcs-build']){
   const el=doc.getElementById(id);if(el){el.setAttribute('aria-disabled',String(block));el.classList.toggle('nexus-choice-blocked',block);}
  }
 }
 function renderSummary(key){
  const current=getChoices().find(x=>x.key===key);
  grid.replaceChildren();provider.hidden=true;provider.removeAttribute('href');
  if(!current && key!=='__working__'){
   state.textContent='Choose a plasmid from the library.';note.textContent='No plasmid is selected.';setGates(true);return;
  }
  let item=current;
  if(key==='__working__'){
   const r=root.NEXUS_GET_CURRENT_RECORD?.();
   if(!r?.sequence){state.textContent='No working plasmid loaded';note.textContent='Import a FASTA or GenBank record into the Workbench first.';setGates(true);return;}
   item={name:r.name,category:'Current working / imported plasmid',availability:'ready',size:r.sequence.length,
     promoter:'Read annotations in the current record',reference:r.accession||'User-provided / working copy',url:'',
     sourceNote:'Working copy. Imported sequence identity and annotations have not been independently verified.',topology:r.circular?'Circular':'Linear'};
  }
  const ready=item.availability==='ready';
  state.textContent=(ready?'Sequence-backed':'Catalog only')+' · '+item.name;
  state.className='nexus-choice-state '+(ready?'nexus-choice-ready':'nexus-choice-metadata');
  field('Category',item.category);field('DNA sequence',ready?'Available in Workbench':'Not included — import verified FASTA / GenBank');
  field('Length',item.size?item.size.toLocaleString()+' bp':'Not verified');
  field('Promoter',item.promoter||'Not verified');
  field('Origin / selection marker',ready&&/SYNTHETIC DEMO/i.test(item.name)?'Illustrative features; not biologically verified':'Review imported annotated sequence / provider record');
  field('MCS and restriction sites',ready?'Calculated from the selected sequence; requires annotated MCS for region targeting':'Unavailable until a complete sequence is imported');
  field('Source',item.reference||'No accession recorded');
  note.textContent=ready?(item.sourceNote+' · Sequence-level virtual assembly is not a laboratory cloning protocol.'):
   'Metadata only. The existing working plasmid has NOT been replaced. To assemble with this vector, import its authorized, sequence-verified GenBank/FASTA record, then select “Use current working copy” here. MCS/restriction assembly for this catalog selection is blocked.';
  if(item.url){provider.href=item.url;provider.hidden=false;}
  setGates(!ready);
 }
 function drawOptions(){
  const q=search.value.trim().toLowerCase(),current=selection;
  const options=getChoices().filter(v=>!q||[v.name,v.category,v.promoter,v.reference].join(' ').toLowerCase().includes(q));
  native.replaceChildren();
  const currentGroup=doc.createElement('optgroup');currentGroup.label='Loaded / imported plasmid';
  const active=doc.createElement('option');active.value='__working__';active.textContent='Use current working copy (imported or edited)';currentGroup.append(active);native.append(currentGroup);
  for(const category of categories){const matches=options.filter(v=>v.category===category);if(!matches.length)continue;
   const grp=doc.createElement('optgroup');grp.label=category;
   for(const rec of matches){const opt=doc.createElement('option');opt.value=rec.key;opt.textContent=rec.name+(rec.availability==='ready'?' · sequence available':' · import sequence');grp.append(opt);}native.append(grp);
  }
  if(options.length===0){const o=doc.createElement('option');o.value='__none__';o.textContent='No catalog matches';o.disabled=true;native.append(o);}
  if([...native.options].some(x=>x.value===current))native.value=current;
  else {selection='__working__';native.value='__working__';}
  renderSummary(selection);
 }
 // This capture listener prevents the pre-existing numeric-index handler from
 // interpreting catalog IDs as zero and unintentionally loading the demo vector.
 native.addEventListener('change',e=>{
  const value=native.value;selection=value;
  if(!/^\d+$/.test(value)){
   e.stopImmediatePropagation();
   renderSummary(value);
   return;
  }
 },true);
 // The existing Workbench handler runs first for numeric indices, then we render.
 native.addEventListener('change',()=>{if(/^\d+$/.test(native.value))renderSummary(native.value);});
 // Safety gate: catalog metadata must never trigger the old, still-loaded
 // working plasmid's virtual assembly as though it were the chosen catalog vector.
 doc.addEventListener('click',e=>{
  if(!catalogOnly)return;
  const el=e.target.closest?.('#nexus-bridge-run,#nexus-bridge-use-backbone,#mcs-build');
  if(!el)return;
  e.preventDefault();e.stopImmediatePropagation();
  note.textContent='This catalog entry has no sequence loaded. Import its full verified DNA and select “Use current working copy” before assembling.';
  panel.scrollIntoView({block:'nearest',behavior:'auto'});
 },true);
 const demo=doc.getElementById('annotation-demo');
 demo?.addEventListener('click',()=>{selection='0';native.value='0';renderSummary('0');});
 // After an import completes, the original UI updates record-summary. Do not
 // silently identify imported DNA as a catalog-listed plasmid by name alone.
 const summary=doc.getElementById('record-summary');
 if(summary&&root.MutationObserver){const obs=new MutationObserver(()=>{
  if(!doc.getElementById('import-file-v3')?.dataset.nexusChoicePending)return;
  delete doc.getElementById('import-file-v3').dataset.nexusChoicePending;
  selection='__working__';native.value='__working__';renderSummary(selection);
 });obs.observe(summary,{childList:true,characterData:true,subtree:true});}
 doc.getElementById('import-file-v3')?.addEventListener('change',e=>{if(e.target.files?.length)e.currentTarget.dataset.nexusChoicePending='yes';},true);
 search.addEventListener('input',drawOptions);
 doc.getElementById('mcs-import-csv')?.addEventListener('change',()=>root.setTimeout(drawOptions,400));
 doc.getElementById('mcs-clear-catalog')?.addEventListener('click',()=>root.setTimeout(drawOptions,0));
 drawOptions();
 root.NEXUS_PLASMID_CHOICE={version:'1.0',getSelection:()=>selection,getCatalogOnly:()=>catalogOnly,refresh:drawOptions};
})(window);
