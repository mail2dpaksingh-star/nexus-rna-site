/* NEXUS global navigation search v1.8.6 — local site index, no server requests. */
(function(){
'use strict';
const box=document.getElementById('global-search-input');
const panel=document.getElementById('global-search-results');
const form=document.getElementById('global-search-form');
const status=document.getElementById('global-search-status');
const wrap=document.getElementById('site-search');
if(!box||!panel||!form||!wrap)return;
const entries=[];const used=new Set();
function add(title,description,href,category,keywords){
 if(!href||!title||used.has(href))return;
 used.add(href);entries.push({title:String(title).replace(/^\d+\s*·\s*/,''),description,href,category,keywords:keywords||''});
}
// The directory is the single source of truth for live tool links.
for(const card of document.querySelectorAll('#tool-grid .tool-card')){
 const a=card.querySelector('a[href]');const h=card.querySelector('h3');
 if(!a||!h)continue;
 add(h.textContent.trim(),(card.querySelector('p')?.textContent||'').trim(),a.getAttribute('href'),(card.querySelector('.tool-tag')?.textContent||'Tool').trim(),card.getAttribute('data-keywords'));
}
// Site pages not listed as standalone research tools.
[
 ['Home','NEXUS RNA BioSolutions platform and research programs','index.html','Page','homepage start'],
 ['Oncology Therapeutics','RNA and LNP research for cancer and neoantigen applications','applications/oncology.html','Application','cancer vaccine tumor neoantigen'],
 ['Hematology Therapeutics','Cell-targeted RNA research, CAR-T, CAR-NK, leukemia','applications/hematology.html','Application','blood stem cell HSPC'],
 ['Scientific services and pricing','RNA development consulting and proposed software plans','services.html','Services','quote pricing consulting contact'],
 ['Sign in / Register','Email-link sign-in for NEXUS research users','account/sign-in.html','Account','login free signup registration'],
 ['My Research Workspace','Private cloud-project interface after account setup','account/workspace.html','Account','cloud save projects dashboard'],
 ['DNA ↔ RNA ↔ Protein Converter','One canonical sequence transcription and reverse-translation tool','tools/seqfold/convert.html','Research tool','dna to rna rna to dna rna to protein protein to dna'],
 ['RNA → Protein & AlphaFold DB','Translate RNA coding sequences and review known protein structures','tools/construct-studio/rna-protein.html','Research tool','alphafold structure translation pdb protein'],
 ['Advanced RNA Design Pro','Full construct architect, promoter engineering, capping and UTR design','tools/construct-studio/pro.html','Research tool','promoter polyA Kozak codon capping circular RNA'],
 ['Circular RNA Platform','Coding circular RNA architecture and junction review','tools/construct-studio/circular.html','Research tool','circRNA'],
 ['Mixture-process DOE','LNP design of experiments with compositional constraints','tools/doe-studio/mixture.html','Research tool','optimization formulation'],
 ['Project Hub','Explore connected local construct and assay records','tools/project-hub/index.html','Research tool','DBTL evidence reports'],
 ['Contact NEXUS','Send a nonconfidential inquiry about a project','index.html#contact','Page','scientific consultation inquiry']
].forEach(row=>add(...row));
const lower=s=>String(s||'').toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const short=(s,max)=>s.length>max?s.slice(0,max-1).trim()+'…':s;
let matches=[],active=-1;
function lookup(query){
 const q=lower(query).trim();const terms=q.split(/\s+/).filter(Boolean);
 if(!terms.length){const picks=['Advanced RNA Design Pro','SeqFold Studio','qPCR / ddPCR Primer & Probe','LNP Formulation Studio','My Research Workspace'];
   return picks.map(t=>entries.find(e=>e.title===t)).filter(Boolean);}
 return entries.map((entry,order)=>{
  const title=lower(entry.title),cat=lower(entry.category),keys=lower(entry.keywords),all=lower(entry.title+' '+entry.description+' '+entry.keywords+' '+entry.category);
  if(!terms.every(t=>all.includes(t)))return null;
  let score=0;if(title===q)score+=50;else if(title.includes(q))score+=25;
  for(const t of terms){if(title.includes(t))score+=8;if(keys.includes(t))score+=4;if(cat.includes(t))score+=2;}
  return {...entry,score,order};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.order-b.order).slice(0,7);
}
function setActive(i){active=i;const options=[...panel.querySelectorAll('[role="option"]')];options.forEach((a,j)=>{
  a.classList.toggle('active',j===i);a.setAttribute('aria-selected',String(j===i));
 });if(i>=0&&options[i]){box.setAttribute('aria-activedescendant',options[i].id);options[i].scrollIntoView({block:'nearest'});}else box.removeAttribute('aria-activedescendant');}
function hide(){panel.hidden=true;box.setAttribute('aria-expanded','false');box.removeAttribute('aria-activedescendant');active=-1;}
function render(){
 matches=lookup(box.value);active=-1;panel.replaceChildren();
 const title=document.createElement('div');title.className='site-search-label';title.textContent=box.value.trim()?'Matching tools & pages':'Popular destinations';panel.append(title);
 if(!matches.length){const d=document.createElement('div');d.className='site-search-empty';d.textContent='No matches. Try RNA, LNP, QC, ddPCR, oncology, or promoter.';panel.append(d);}
 else for(const [i,entry] of matches.entries()){
  const a=document.createElement('a');a.className='site-search-result';a.id='site-search-option-'+i;a.href=entry.href;a.setAttribute('role','option');a.setAttribute('aria-selected','false');
  const heading=document.createElement('strong');heading.textContent=entry.title;
  const tag=document.createElement('em');tag.textContent=entry.category;heading.append(tag);
  const desc=document.createElement('small');desc.textContent=short(entry.description,115);a.append(heading,desc);
  a.addEventListener('mouseenter',()=>setActive(i));panel.append(a);
 }
 const bottom=document.createElement('div');bottom.className='site-search-bottom';
 const browse=document.createElement('button');browse.type='button';browse.textContent='Browse all research tools →';
 browse.addEventListener('click',()=>{
  const toolSearch=document.getElementById('tool-search');if(toolSearch){toolSearch.value=box.value.trim();toolSearch.dispatchEvent(new Event('input',{bubbles:true}));}
  hide();document.getElementById('tools')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 const count=document.createElement('span');count.textContent=matches.length+' suggestion'+(matches.length===1?'':'s');bottom.append(browse,count);panel.append(bottom);
 panel.hidden=false;box.setAttribute('aria-expanded','true');status.textContent=matches.length+' suggestions available';
}
box.addEventListener('input',render);
box.addEventListener('focus',render);
box.addEventListener('keydown',e=>{
 if(e.key==='Escape'){hide();e.preventDefault();return;}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){
  if(panel.hidden)render();if(matches.length){setActive((active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length);}e.preventDefault();
 }
 if(e.key==='Enter'){e.preventDefault();if(panel.hidden)render();const found=matches[active>=0?active:0];if(found)window.location.assign(found.href);}
});
form.addEventListener('submit',e=>{e.preventDefault();const found=matches[active>=0?active:0]||lookup(box.value)[0];if(found)window.location.assign(found.href);else render();});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
  e.preventDefault();box.focus();box.select();
 }
});
document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))hide();});
document.addEventListener('focusin',e=>{if(!wrap.contains(e.target))hide();});
})();
