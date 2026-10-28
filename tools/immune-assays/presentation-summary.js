/* NEXUS Immunology — presentation only. Does not alter NexusImmune.analyze or NexusResearchGraphs. */
(function(){
'use strict';
const doc=document, core=window.NexusImmune;
const result=doc.getElementById('result'), sourceRows=doc.getElementById('rows');
if(!core || !result || !sourceRows || !doc.getElementById('csv')) return;
const $=id=>doc.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
const display=(x,d=2)=>finite(x)?Number(x).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const add=(parent,tag,cls,text)=>{const n=el(tag,cls,text);parent.appendChild(n);return n;};
const ui=el('section','nexus-present-layer');ui.id='nexus-presentation-layer';
const toolbar=add(ui,'div','nexus-pres-toolbar');
const caption=add(toolbar,'div','nexus-pres-heading');add(caption,'h3','', 'Results presentation');add(caption,'p','','Visual summary calculated from the current assay data.');
const actions=add(toolbar,'div','nexus-pres-toolbar-actions');
const presentationBtn=add(actions,'button','nexus-pres-tab active','Presentation view');presentationBtn.type='button';presentationBtn.setAttribute('aria-pressed','true');
const detailedBtn=add(actions,'button','nexus-pres-tab','Detailed analysis');detailedBtn.type='button';detailedBtn.setAttribute('aria-pressed','false');
const exportBtn=add(actions,'button','nexus-pres-export','Download report HTML');exportBtn.type='button';
const content=add(ui,'div','nexus-pres-content');
const choiceRow=add(content,'div','nexus-pres-selections');
const assayLabel=add(choiceRow,'label','','Assay / measurement unit');const assaySelect=add(assayLabel,'select');assaySelect.setAttribute('aria-label','Assay and unit for presentation');
const groupLabel=add(choiceRow,'label','','Comparison group');const groupSelect=add(groupLabel,'select');groupSelect.setAttribute('aria-label','Comparison group for presentation');
const meta=add(content,'p','nexus-pres-meta');
const cards=add(content,'div','nexus-pres-cards');
const tableBlock=add(content,'div','nexus-pres-table-block');
const narrative=add(content,'div','nexus-pres-narrative');
const caveat=add(content,'p','nexus-pres-caveat','Research summary only. Group differences are descriptive; no significance test or therapeutic efficacy conclusion.');
const firstMetric=result.querySelector('.metricrow');
if(firstMetric)result.insertBefore(ui,firstMetric);else result.insertBefore(ui,result.firstChild.nextSibling);
doc.body.classList.add('nexus-immune-presentation-enabled');
let last=null,currentKey='',currentGroup='';
function pairKey(g){return JSON.stringify([g.assay,g.unit]);}
function uniquePairs(stats){return [...new Set(stats.map(pairKey))];}
function writeOptions(select,items,current){select.replaceChildren();for(const {value,label} of items){const o=doc.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);}if(items.some(x=>x.value===current))select.value=current;}
function setView(mode){const compact=mode==='presentation';result.classList.toggle('nexus-pres-brief',compact);presentationBtn.classList.toggle('active',compact);detailedBtn.classList.toggle('active',!compact);presentationBtn.setAttribute('aria-pressed',String(compact));detailedBtn.setAttribute('aria-pressed',String(!compact));content.hidden=!compact;}
function kpi(label,value,extra){const node=add(cards,'article','nexus-pres-kpi');add(node,'span','nexus-pres-kpi-label',label);add(node,'strong','nexus-pres-kpi-value',value);if(extra)add(node,'span','nexus-pres-kpi-caption',extra);}
function makeTable(rows,control){tableBlock.replaceChildren();add(tableBlock,'h4','','Group summary');const wrapper=add(tableBlock,'div','nexus-pres-table-scroll');const t=add(wrapper,'table','nexus-pres-table');const head=add(t,'thead');const tr=add(head,'tr');for(const label of ['Group','Independent n','Mean ± SD','CV','Fold vs control','Δ vs control'])add(tr,'th','',label);
const body=add(t,'tbody');for(const g of rows){const r=add(body,'tr');if(g.group===control)r.classList.add('nexus-pres-control');for(const value of [g.group,g.n,`${display(g.mean)} ± ${display(g.sd)}`,finite(g.cv)?display(g.cv)+'%':'—',finite(g.fold)?display(g.fold)+'×':'—',display(g.difference)])add(r,'td','',String(value));}}
function createNarrative(rows,c,chosen,assay,unit){narrative.replaceChildren();add(narrative,'h4','','Observed pattern');const msg=add(narrative,'p');
if(!c){msg.textContent=`The control group is not available for ${assay} (${unit}). Group averages can be displayed, but control comparisons are unavailable.`;return;}
if(!chosen || chosen.group===c.group){msg.textContent=`The control mean is ${display(c.mean)} ${unit}, based on ${c.n} independent sample(s). Choose a comparison group to describe the observed difference.`;return;}
const diff=chosen.mean-c.mean,direction=diff>0?'higher':diff<0?'lower':'equal';const s=`${chosen.group} had a ${direction} observed mean (${display(chosen.mean)} ${unit}; n=${chosen.n}) than ${c.group} (${display(c.mean)} ${unit}; n=${c.n}).`;
let addition='';if(finite(chosen.difference))addition=` The descriptive difference was ${diff>0?'+':''}${display(chosen.difference)} ${unit}.`;
if($('type').value!=='qpcr'&&finite(chosen.fold))addition+=` The ratio to control was ${display(chosen.fold)}×.`;
msg.textContent=s+addition;
}
function reportState(){if(!last||!currentKey)return null;const [assay,unit]=JSON.parse(currentKey);const rows=last.stats.filter(g=>pairKey(g)===currentKey);const c=rows.find(g=>g.group===last.control)||null;const chosen=rows.find(g=>g.group===currentGroup)||null;return {assay,unit,rows,c,chosen};}
function render(keepSelection=true){if(!last||!last.stats.length){cards.replaceChildren();tableBlock.replaceChildren();narrative.replaceChildren();exportBtn.disabled=true;return;}
const pairItems=uniquePairs(last.stats).map(value=>{const [a,u]=JSON.parse(value);return {value,label:a+' · '+u};});if(!keepSelection||!pairItems.some(o=>o.value===currentKey))currentKey=pairItems[0].value;writeOptions(assaySelect,pairItems,currentKey);
const {assay,unit,rows,c}=reportState()||{assay:'',unit:'',rows:[],c:null};const candidates=rows.filter(g=>g.group!==last.control);const groupItems=(candidates.length?candidates:rows).map(g=>({value:g.group,label:g.group}));if(!keepSelection||!groupItems.some(x=>x.value===currentGroup))currentGroup=(groupItems[0]||{}).value||'';writeOptions(groupSelect,groupItems,currentGroup);
const selected=rows.find(g=>g.group===currentGroup)||null;
meta.textContent=`${assay} · ${unit} · ${rows.length} group(s) · ${last.measurementCount} measurement row(s) · control: ${last.control}`;
cards.replaceChildren();kpi('Control mean',c?`${display(c.mean)} ${unit}`:'Not available',c?`${c.n} independent samples`:'No matching control for this assay');
kpi('Comparison mean',selected?`${display(selected.mean)} ${unit}`:'Not available',selected?`${selected.group} · n=${selected.n}`:'No comparison group');
kpi('Fold vs control',selected&&$('type').value!=='qpcr'&&finite(selected.fold)?display(selected.fold)+'×':'—',$('type').value==='qpcr'?'Not valid for raw Ct values':'Descriptive ratio');
kpi('Difference',selected&&finite(selected.difference)?((selected.difference>0?'+':'')+display(selected.difference)+' '+unit):'—','Comparison minus control');
makeTable(rows,last.control);createNarrative(rows,c,selected,assay,unit);exportBtn.disabled=false;
}
function analyzeFromCurrentInputs(){if(result.hidden)return;try{last=core.analyze({csv:$('csv').value,control:$('control').value,type:$('type').value});render(true);}catch(e){last=null;render(false);}}
function htmlReport(){const state=reportState();if(!state)return '';const {assay,unit,rows,c,chosen}=state;const td=g=>`<tr><td>${esc(g.group)}</td><td>${g.n}</td><td>${display(g.mean)}</td><td>${display(g.sd)}</td><td>${finite(g.cv)?display(g.cv)+'%':'—'}</td><td>${finite(g.fold)?display(g.fold)+'×':'—'}</td><td>${display(g.difference)}</td></tr>`;
const max=Math.max(1,...rows.map(g=>Math.max(0,Number(g.mean)||0)));
const bars=rows.every(g=>finite(g.mean)&&Number(g.mean)>=0)?rows.map(g=>`<div class="barrow"><span>${esc(g.group)}</span><div class="track"><div class="fill" style="width:${(Math.max(0,Number(g.mean)||0)/max*100).toFixed(2)}%"></div></div><b>${display(g.mean)} ${esc(unit)}</b></div>`).join(''):'<p>Bar visualization is omitted when a group mean is negative. See the numerical table above.</p>';
const message=narrative.querySelector('p')?.textContent||'';
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXUS Immunology Results — ${esc(assay)}</title><style>body{font:14px/1.55 Arial,sans-serif;color:#173438;margin:38px auto;max-width:980px;padding:0 24px}h1{font-size:27px;margin:0}h2{margin-top:28px;font-size:18px}small,.muted{color:#657a78}.eyebrow{text-transform:uppercase;font-size:11px;letter-spacing:.12em;color:#0a746c;font-weight:700}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}.card{padding:14px;border:1px solid #d5e7e1;border-radius:10px;background:#f5faf8}.card strong{display:block;font-size:18px;margin-top:5px}table{border-collapse:collapse;width:100%}th,td{padding:9px;text-align:left;border-bottom:1px solid #dfeae6}th{background:#eef6f2;font-size:12px}.barrow{display:grid;grid-template-columns:130px 1fr 150px;align-items:center;gap:9px;margin:12px 0;font-size:12px}.track{height:18px;background:#e5f0eb;border-radius:5px}.fill{height:100%;background:#328c7d;border-radius:5px}.note{background:#f5f8f6;padding:14px;border-left:3px solid #62a091}.foot{margin-top:24px;font-size:11px;color:#647974}@media(max-width:600px){.cards{grid-template-columns:repeat(2,1fr)}.barrow{grid-template-columns:80px 1fr 90px;font-size:10px}}@media print{body{margin:0;padding:14mm}h2{break-after:avoid}.cards,.barrow{break-inside:avoid}}</style></head><body><p class="eyebrow">NEXUS RNA BioSolutions · Research result summary</p><h1>${esc(assay)} — group comparison</h1><p class="muted">Unit: ${esc(unit)} · Control: ${esc(last.control)} · ${last.measurementCount} measurement rows · ${last.independentSamples} independent sample-group units</p><section class="cards"><div class="card">Control mean<strong>${c?display(c.mean):'—'} ${esc(unit)}</strong></div><div class="card">Comparison mean<strong>${chosen?display(chosen.mean):'—'} ${esc(unit)}</strong></div><div class="card">Fold versus control<strong>${chosen&&$('type').value!=='qpcr'&&finite(chosen.fold)?display(chosen.fold)+'×':'—'}</strong></div><div class="card">Difference<strong>${chosen&&finite(chosen.difference)?display(chosen.difference)+' '+esc(unit):'—'}</strong></div></section><h2>Group summary</h2><table><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th><th>CV</th><th>Fold</th><th>Difference</th></tr></thead><tbody>${rows.map(td).join('')}</tbody></table><h2>Mean comparison (descriptive)</h2>${bars}<h2>Observed pattern</h2><p>${esc(message)}</p><p class="note">Descriptive statistics only. Error bars and inferential statistics must be interpreted with the study design in mind. No significance testing, clinical decision or therapeutic efficacy claim is made by this report. Annotations and group labels come from the supplied data.</p><p class="foot">Report generated locally from the NEXUS Immunology module. Research-only output. No data uploaded by report generation.</p></body></html>`;
}
function downloadReport(){if(!last)return;const html=htmlReport();if(!html)return;const b=new Blob([html],{type:'text/html;charset=utf-8'});const u=URL.createObjectURL(b),a=doc.createElement('a');a.href=u;a.download='NEXUS_Immunology_Result_Report.html';doc.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);}
presentationBtn.addEventListener('click',()=>setView('presentation'));
detailedBtn.addEventListener('click',()=>setView('detailed'));
assaySelect.addEventListener('change',()=>{currentKey=assaySelect.value;currentGroup='';render(true);});
groupSelect.addEventListener('change',()=>{currentGroup=groupSelect.value;render(true);});
exportBtn.addEventListener('click',downloadReport);
new MutationObserver(()=>analyzeFromCurrentInputs()).observe(sourceRows,{childList:true});
setView('presentation');analyzeFromCurrentInputs();
})();
