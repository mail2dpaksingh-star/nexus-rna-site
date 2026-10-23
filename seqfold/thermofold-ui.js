(function(){'use strict';
 const $=id=>document.getElementById(id), b64=[];let last=null,lastSVG='';let worker=null;let parameterPack=null;
 function status(msg,error){$('status').textContent=msg;$('status').className='small '+(error?'bad':'good');}
 function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type:type||'text/plain'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 function safe(t){return String(t).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));}
 function show(r){
  last=r;
  $('dg').textContent=r.deltaG37.toFixed(2);
  $('nt').textContent=r.length;
  $('pair').textContent=r.pairCount;
  const visual=NexusThermoLayout.render(r);
  lastSVG=visual.svg;
  $('hairpin').innerHTML=lastSVG;
  const details=[];
  for(const h of r.hairpinDetails||[])details.push(`Hairpin ${h.start}–${h.end}: ΔG = ${h.energy.toFixed(2)} kcal/mol (${h.method}); ${h.terms.map(t=>t.name+': '+t.value.toFixed(2)).join('; ')}`);
  for(const x of r.internalDetails||[])details.push(`Internal loop ${x.outerStart}–${x.outerEnd} → ${x.innerStart}–${x.innerEnd} (${x.left}×${x.right}): ΔG = ${x.energy.toFixed(2)} kcal/mol (${x.method}); ${x.terms.map(t=>t.name+': '+t.value.toFixed(2)).join('; ')}`);
  if(r.exteriorDetails?.some(d=>d.energy))details.push('Exterior end terms: '+r.exteriorDetails.map(d=>d.stem.join('–')+' '+d.mode+': '+d.energy.toFixed(2)+' kcal/mol').join('; '));
  const audit=r.parameterAudit;
  if(audit)details.push('\nMODEL PARAMETER COVERAGE (not a confidence score): '+(audit.flags.length?audit.flags.map(x=>'['+x.level.toUpperCase()+'] '+x.part+': '+x.reason).join('\n'):'No identified incomplete terms used by this particular structure; overall model remains incomplete.')+'\nExternal benchmark: '+audit.externalValidation);
  $('parameter-status').textContent=r.parameterPack ? ('Parameter pack: '+r.parameterPack.source.name+' ('+r.parameterPack.source.version+'). '+Object.entries(r.parameterPack.summary).map(([k,v])=>k+': '+v.loaded+'/'+v.expected).join('; ')+(r.parameterPack.complete?' · REQUIRED TABLES COMPLETE':' · INCOMPLETE / NON-QUALIFIED')) : 'Published lookup pack not loaded; incomplete built-in model remains active.';
  $('hairpin-terms').textContent=details.length?details.join('\n'):'No hairpin or internal-loop terms to inspect.';
  $('hairpin-terms').style.whiteSpace='pre-wrap';
  $('hairpin-info').textContent=visual.branched
   ? `Branched topology detected (${r.loopCounts?.multibranch||0} multibranch loops, ${visual.arcPairs} pairs). All pairs are shown in a sequence-ordered arc diagram because a single hairpin would be misleading.`
   : visual.componentCount
   ? `${visual.componentCount} stem–loop component(s) visualized${visual.hiddenExterior?`; ${visual.hiddenExterior} exterior unpaired nt omitted from the drawing`:''}. The complete nucleotide sequence and dot-bracket structure remain available in downloads.`
   : 'No base pairs selected by this model; the RNA is illustrated as an unpaired strand. Dot-bracket export remains available.';
  for(const id of ['export-dbn','export-json','export-svg'])$(id).disabled=false;
  status(`NEXUS restricted MFE v${r.version}: ${r.length} nt; hairpins ${r.loopCounts.hairpin}, bulges ${r.loopCounts.bulge}, interior loops ${r.loopCounts.internal}, multibranch loops ${r.loopCounts.multibranch}. Not ViennaRNA-equivalent.`);
 }
 function run(){
  let sequence=$('rna-input').value;
  try{NexusThermoFold.normalize(sequence)}catch(e){status(e.message,true);return;}
  $('run').disabled=true;status('Calculating partial-model minimum energy…');
  if(typeof Worker!=='undefined'){
    if(worker)worker.terminate();worker=new Worker('thermofold-worker.js');
    worker.onmessage=e=>{$('run').disabled=false;const d=e.data;if(d.ok)show(d.result);else status(d.error,true);worker.terminate();worker=null;};
    worker.onerror=e=>{$('run').disabled=false;status('Browser worker could not run. Try opening from a deployed site.',true);};
    worker.postMessage({sequence,parameterPack});
  } else {setTimeout(()=>{try{NexusThermoFold.setParameterPack(parameterPack);show(NexusThermoFold.fold(sequence));}catch(e){status(e.message,true);}finally{$('run').disabled=false;}},20);}
 }
 $('parameter-file').addEventListener('change',async e=>{
   const f=e.target.files?.[0];if(!f)return;
   if(f.size>1800000){status('Parameter JSON must be under 1.8 MB.',true);return;}
   try {const data=JSON.parse(await f.text());const checked=NexusThermoFold.validateParameterPack(data);
    parameterPack=data;$('parameter-status').textContent='Loaded '+checked.source.name+': '+Object.values(checked.summary).reduce((n,t)=>n+t.loaded,0)+' entries; '+(checked.complete?'required coverage present':'partial coverage only')+'. NOT independently validated.';
    status('Authentic-source parameter pack loaded in this browser tab. It will be used in the next calculation.');
   }catch(error){status('Invalid parameter pack: '+error.message,true);}
 });
 $('clear-parameters').addEventListener('click',()=>{parameterPack=null;NexusThermoFold.setParameterPack(null);$('parameter-file').value='';$('parameter-status').textContent='No external parameter pack loaded; restricted built-in model.';status('Cleared parameter pack.');});
 $('run').addEventListener('click',run);$('example').addEventListener('click',()=>{$('rna-input').value='>synthetic_hairpin\nGGGAAACCC';status('Synthetic example loaded; click Calculate.');});
 $('reset').addEventListener('click',()=>{if(worker)worker.terminate();worker=null;last=null;lastSVG='';$('rna-input').value='';$('dg').textContent='—';$('nt').textContent='—';$('pair').textContent='—';$('hairpin').innerHTML='<p class="small">Run folding to display the predicted stem–loop structure.</p>';$('hairpin-terms').textContent='Calculate a structure to view energy components.';$('hairpin-info').textContent='The dot-bracket representation remains available as a separate download.';for(const id of ['export-dbn','export-json','export-svg'])$(id).disabled=true;status('Cleared.');});
 $('rna-upload').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;if(file.size>250000){status('Choose a FASTA file under 250 KB.',true);return;}$('rna-input').value=await file.text();status('File loaded; click Calculate.');});
 $('export-dbn').addEventListener('click',()=>{if(last)download('nexus_thermofold_v05.dbn','>NEXUS_ThermoFold_v0.5_restricted_model|dG37='+last.deltaG37+'kcal_per_mol\n'+last.sequence+'\n'+last.dotBracket+'\n');});
 $('export-json').addEventListener('click',()=>{if(last)download('nexus_thermofold_v05.json',JSON.stringify(last,null,2),'application/json');});
 $('export-svg').addEventListener('click',()=>{if(lastSVG)download('nexus_thermofold_v05_secondary_structure.svg',lastSVG,'image/svg+xml');});
})();
