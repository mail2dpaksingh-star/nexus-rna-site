/* NEXUS QC presentation-only layer: reads the existing calculator's displayed result.
   Does not modify NexusQC, QC UI calculation methods, or NexusResearchGraphs. */
(function(){'use strict';
const d=document;
const by=id=>d.getElementById(id);
const result=by('result');
if(!result||!by('metric')||!by('qc-status')||!by('assay')||d.getElementById('nexus-qc-presentation'))return;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v==null?'':v).trim();
const numeric=v=>{const n=Number(clean(v).replace(/,/g,''));return clean(v)&&Number.isFinite(n)?n:null;};
const display=v=>v==null?'—':String(v);
const add=(p,tag,cls,text)=>{const n=d.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;p.appendChild(n);return n;};
function info(){
 const opt=by('assay').selectedOptions[0];
 const name=opt?opt.textContent.trim():'QC assay';
 const metricText=clean(by('metric').textContent);
 const metric=numeric(metricText);
 const unit=clean(by('unit').textContent);
 const status=clean(by('qc-status').textContent);
 const sample=clean(by('sample').value);
 const batch=clean(by('batch').value);
 const method=clean(by('method').value);
 const min=numeric(by('min').value);
 const max=numeric(by('max').value);
 const extra=[...by('extras').querySelectorAll('li')].map(n=>clean(n.textContent)).filter(Boolean);
 const flags=[...by('flags').querySelectorAll('li')].map(n=>clean(n.textContent)).filter(Boolean);
 const detail=clean(by('qc-info').textContent);
 return {name,metric,metricText,unit,status,sample,batch,method,min,max,extra,flags,detail};
}
const orig=d.createElement('div');orig.className='nexus-qc-pres-technical';orig.id='nexus-qc-technical';
while(result.firstChild)orig.appendChild(result.firstChild);
const root=add(result,'section','nexus-qc-pres');root.id='nexus-qc-presentation';root.setAttribute('aria-label','QC results presentation');
const header=add(root,'div','nexus-qc-pres-header');const heading=add(header,'div');add(heading,'h3','','Results presentation');add(heading,'p','','Live summary of your calculated analytical result');
const actions=add(root,'div','nexus-qc-pres-actions');
const briefButton=add(actions,'button','active','Presentation view');briefButton.type='button';briefButton.setAttribute('aria-pressed','true');
const detailButton=add(actions,'button','','Detailed analysis');detailButton.type='button';detailButton.setAttribute('aria-pressed','false');
const reportButton=add(actions,'button','','Download report HTML');reportButton.type='button';
const meta=add(root,'p','nexus-qc-pres-meta');
const summary=add(root,'div','nexus-qc-pres-summary');summary.id='nexus-qc-pres-summary';
const cards=add(summary,'div','nexus-qc-pres-cards');
const dataTable=add(summary,'div');
const narrative=add(summary,'div');
const review=add(summary,'div');
add(summary,'p','nexus-qc-pres-note','Research-only descriptive report. Criteria are supplied by the user and do not establish clinical or GMP release suitability.');
result.appendChild(orig);
function setView(mode){const pres=mode==='presentation';summary.hidden=!pres;orig.hidden=pres;briefButton.classList.toggle('active',pres);detailButton.classList.toggle('active',!pres);briefButton.setAttribute('aria-pressed',String(pres));detailButton.setAttribute('aria-pressed',String(!pres));}
function card(title,value,description,statusClass){const n=add(cards,'article','nexus-qc-pres-card'+(statusClass?' '+statusClass:''));add(n,'span','',title);add(n,'strong','',value);add(n,'small','',description);}
function table(rows){dataTable.replaceChildren();add(dataTable,'h4','','Analytical result summary');const w=add(dataTable,'div','nexus-qc-pres-table-wrap');const t=add(w,'table','nexus-qc-pres-table');const h=add(t,'thead');let tr=add(h,'tr');['Field','Recorded value'].forEach(x=>add(tr,'th','',x));const tb=add(t,'tbody');for(const row of rows){tr=add(tb,'tr');for(const val of row)add(tr,'td','',val);}}
function composeNarrative(r){let main=`For ${r.name}, the calculated result was ${r.metricText}${r.unit?' '+r.unit:''}.`;
 if(r.status.startsWith('Within user-defined'))main+=' This lies within the user-entered criterion. This is a numerical comparison, not an assay qualification or release decision.';
 else if(r.status.startsWith('Outside user-defined'))main+=' This falls outside the user-entered criterion and requires review against the appropriate method and controls.';
 else main+=' No comparison status is assigned because no criterion was provided.';
 return main;
}
function render(){
 if(result.hidden){reportButton.disabled=true;return;}
 const r=info();if(r.metric===null||!r.status){reportButton.disabled=true;return;}
 reportButton.disabled=false;
 meta.textContent=`${r.name} · ${r.sample||'Sample ID not supplied'}${r.batch?' · Batch '+r.batch:''}`;
 cards.replaceChildren();card('Primary analytical result',r.metricText,r.unit||'Calculated by existing NEXUS QC engine');
 const bounds=[r.min!==null?`≥ ${r.min}`:null,r.max!==null?`≤ ${r.max}`:null].filter(Boolean).join(' and ');
 card('User-defined criterion',bounds||'Not specified',r.unit&&bounds?r.unit:'No universal limits assumed');
 const cls=r.status.startsWith('Outside')?'status-outside':r.status.startsWith('Not assessed')?'status-unassessed':'';
 card('Criterion comparison',r.status,'No GMP or clinical release decision',cls);
 card('Traceability',r.sample||'Not supplied',r.method?'Method: '+r.method:'Method/SOP not supplied');
 table([['Assay',r.name],['Sample ID',r.sample||'Not supplied'],['Batch / lot',r.batch||'Not supplied'],['Method / SOP',r.method||'Not supplied'],['Primary result',r.metricText+(r.unit?' '+r.unit:'')],['Minimum criterion',display(r.min)],['Maximum criterion',display(r.max)],['Criterion comparison',r.status],...r.extra.map(t=>[(t.split(':')[0]||'Derived value').replace(/([a-z])([A-Z])/g,'$1 $2'),t.includes(':')?t.slice(t.indexOf(':')+1).trim():t])]);
 narrative.replaceChildren();add(narrative,'h4','','Observed result');add(narrative,'p','nexus-qc-pres-observation',composeNarrative(r));
 review.replaceChildren();if(r.flags.length){const issue=r.flags.filter(s=>/saturation|zero positives|cannot|exceed|invalid|outside|traceability is incomplete|not supplied|calibration|unvalidated|validate rather|not proof|experimental|incorrect|inhibition/i.test(s));if(issue.length){add(review,'p','nexus-qc-pres-alert',issue.slice(0,2).join(' '));}}
 const details=add(review,'details');const sum=add(details,'summary','','Method and review notes ('+r.flags.length+')');if(r.flags.length){const ul=add(details,'ul');r.flags.forEach(f=>add(ul,'li','',f));}else{add(details,'p','','No additional review notes for this calculation.');}
}
function reportHTML(r){const rows=[['Assay',r.name],['Sample ID',r.sample||'Not supplied'],['Batch / lot',r.batch||'Not supplied'],['Method / SOP',r.method||'Not supplied'],['Analytical result',r.metricText+(r.unit?' '+r.unit:'')],['Lower criterion',display(r.min)],['Upper criterion',display(r.max)],['Comparison',r.status],...r.extra.map(t=>[(t.split(':')[0]||'Derived value').replace(/([a-z])([A-Z])/g,'$1 $2'),t.includes(':')?t.slice(t.indexOf(':')+1).trim():t])];
const tds=rows.map(([a,b])=>'<tr><th>'+esc(a)+'</th><td>'+esc(b)+'</td></tr>').join('');
const noteItems=r.flags.map(n=>'<li>'+esc(n)+'</li>').join('');
const plot=by('qc-graph')?.querySelector('svg');const figure=plot?'<section><h2>Current graph</h2><div class="figure">'+plot.outerHTML+'</div><p class="sub">Graph view: '+esc(by('qc-graph-mode')?.selectedOptions[0]?.textContent||'Current selection')+'. Session trends reflect only results recorded during this browser session.</p></section>':'';
return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXUS QC Results Report</title><style>body{font:14px/1.5 Arial,sans-serif;max-width:980px;margin:30px auto;padding:0 22px;color:#203e3a}h1{font-size:28px}h2{font-size:18px;margin-top:26px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:#247c6c;font-weight:bold}.muted{color:#617a72}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.card{background:#f4f9f6;border:1px solid #dbeae1;border-radius:10px;padding:14px}.card strong{display:block;margin-top:8px;font-size:18px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}th,td{padding:9px;text-align:left;border-bottom:1px solid #dde9e3}th{background:#eff6f2;width:36%}.note{padding:13px;border-left:3px solid #69a592;background:#f4f9f6}.figure{border:1px solid #e2ebe6;border-radius:10px;padding:6px;overflow:auto}.figure svg{max-width:100%;height:auto;display:block}.sub{font-size:12px;color:#607c71}li{margin-bottom:4px}@media(max-width:600px){.cards{grid-template-columns:1fr}}@media print{body{margin:0;padding:12mm}.figure{break-inside:avoid}.cards{break-inside:avoid}}</style></head><body><p class="eyebrow">NEXUS RNA BioSolutions · Analytical QC research results</p><h1>'+esc(r.name)+'</h1><p class="muted">Sample: '+esc(r.sample||'Not supplied')+' · Batch: '+esc(r.batch||'Not supplied')+'</p><section class="cards"><div class="card">Primary result<strong>'+esc(r.metricText+(r.unit?' '+r.unit:''))+'</strong></div><div class="card">User criterion<strong>'+esc(([r.min!==null?'≥ '+r.min:null,r.max!==null?'≤ '+r.max:null].filter(Boolean).join(' and '))||'Not specified')+'</strong></div><div class="card">Comparison<strong>'+esc(r.status)+'</strong></div></section><h2>Analytical result summary</h2><table><tbody>'+tds+'</tbody></table><h2>Observed result</h2><p class="note">'+esc(composeNarrative(r))+'</p>'+figure+'<h2>Method and review notes</h2><ul>'+noteItems+'</ul><p class="note">Research-stage calculation; numerical comparison uses user-supplied criteria. Not a validated laboratory assay report, clinical decision, or GMP release authorization. Review original raw data, calibration, controls, method qualification, and sample traceability.</p><p class="sub">Generated locally from the NEXUS Analytical QC page. No network upload is required to generate this report.</p></body></html>';
}
function downloadReport(){if(result.hidden)return;const r=info();if(r.metric===null)return;const filename='NEXUS_QC_'+clean(by('assay').value||'assay').replace(/[^a-z0-9_-]/gi,'_')+'_Presentation_Report.html';const blob=new Blob([reportHTML(r)],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=add(d.body,'a');a.href=url;a.download=filename;a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
let queued=false;function scheduleRender(){if(queued)return;queued=true;Promise.resolve().then(()=>{queued=false;render();});}
briefButton.addEventListener('click',()=>setView('presentation'));
detailButton.addEventListener('click',()=>setView('detail'));
reportButton.addEventListener('click',downloadReport);
// Observe values written by the existing NEXUS QC engine rather than computing alternate statistics.
for(const id of ['metric','qc-status','unit','qc-info','extras','flags']){
 const n=by(id);if(n)new MutationObserver(scheduleRender).observe(n,{childList:true,characterData:true,subtree:true});
}
// A method/sample text edit may change traceability without changing the numeric result.
for(const id of ['assay','sample','batch','method','min','max'])by(id)?.addEventListener('input',()=>setTimeout(scheduleRender,320));
setView('presentation');scheduleRender();
})();
