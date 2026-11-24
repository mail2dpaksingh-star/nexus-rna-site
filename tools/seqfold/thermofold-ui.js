(function(){'use strict';
 const $=id=>document.getElementById(id), b64=[];let last=null,lastSVG='';let worker=null;let parameterPack=null;
 function status(msg,error){$('status').textContent=msg;$('status').className='small '+(error?'bad':'good');}
 function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type:type||'text/plain'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 function safe(t){return String(t).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));}
 function show(r){
  last=r;
  $('long-rna-results').hidden=true;
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
 function updateInputCount(){
  const raw=$('rna-input').value;
  const lines=raw.split(/\r?\n/).filter(line=>!/^\s*>/.test(line));
  const bases=lines.join('').replace(/[\s\d]/g,'').toUpperCase();
  const count=bases.length,limit=NexusThermoFold.LONG_MAX||10000;
  const countLabel=$('rna-count'),mode=$('rna-mode');
  countLabel.className='';
  if(count===0){
    countLabel.textContent='No sequence entered';
    mode.textContent='Paste RNA or import one FASTA record. Maximum input: 10,000 nt.';
  }else if(count>limit){
    countLabel.textContent=count.toLocaleString()+' nt entered — exceeds 10,000 nt limit';
    countLabel.className='bad';
    mode.textContent='Reduce the sequence to 10,000 nt or fewer before running.';
  }else if(/[^ACGUT]/.test(bases)){
    countLabel.textContent=count.toLocaleString()+' nt entered';
    countLabel.className='bad';
    mode.textContent='Invalid base detected. Use A, C, G, U (or DNA T) only.';
  }else if(count<=NexusThermoFold.MAX){
    countLabel.textContent=count.toLocaleString()+' nt entered (10,000 nt maximum)';
    mode.textContent='Mode: full-sequence, restricted-model MFE and ΔG at 37°C.';
  }else{
    const windowSize=NexusThermoFold.LONG_WINDOW||200;
    countLabel.textContent=count.toLocaleString()+' nt entered (10,000 nt maximum)';
    mode.textContent='Mode: '+Math.ceil(count/windowSize)+' independent '+windowSize+
      '-nt windows; NO whole-RNA MFE or ΔG.';
  }
 }
 function clearResults(){
  last=null;lastSVG='';
  $('dg').textContent='—';$('nt').textContent='—';$('pair').textContent='—';
  $('hairpin').innerHTML='<p class="small">Run folding to display the predicted stem–loop structure.</p>';
  $('hairpin-terms').textContent='Calculate a structure to view energy components.';
  $('hairpin-info').textContent='The dot-bracket representation remains available as a separate download.';
  $('long-rna-results').hidden=true;
  $('long-window-select').replaceChildren();$('long-window-summary').textContent='';
  for(const id of ['export-dbn','export-json','export-svg'])$(id).disabled=true;
 }
 function renderLongWindow(index){
  if(!last||last.mode!=='independent-windows')return;
  const w=last.windows[index];if(!w)return;
  const r=w.fold;
  const visual=NexusThermoLayout.render(r);
  lastSVG=visual.svg;
  $('hairpin').innerHTML=lastSVG;
  $('hairpin-info').textContent=
   'Local window '+w.index+' ('+w.start.toLocaleString()+'–'+w.end.toLocaleString()+
   ' nt, '+w.length+' nt): '+r.pairCount+' pairs; ΔG₃₇ = '+r.deltaG37.toFixed(2)+
   ' kcal/mol for this window only. No full-length structure or ΔG is calculated.';
  const details=[
    'LOCAL WINDOW '+w.start+'–'+w.end+' nt',
    'Window-only restricted-model ΔG₃₇: '+r.deltaG37.toFixed(2)+' kcal/mol',
    'Hairpins: '+r.loopCounts.hairpin+'; bulges: '+r.loopCounts.bulge+
    '; interior loops: '+r.loopCounts.internal+'; multibranch loops: '+r.loopCounts.multibranch,
    'All coordinates in the diagram are relative to this selected window; add '+(w.start-1)+' for transcript positions.',
    'Independent 200-nt segmentation excludes interactions outside this window.',
    ...r.parameterAudit.flags.map(x=>'['+x.level+'] '+x.part+': '+x.reason)
  ];
  $('hairpin-terms').textContent=details.join('\n');
  $('parameter-status').textContent=r.parameterPack
   ?'Researcher-supplied parameter pack loaded; individual window calculations use the selected restricted model. Parameter source requires independent verification.'
   :'No complete, independently qualified parameter library loaded; restricted built-in 37°C model applied to each window.';
 }
 function showLong(r){
  last=r;lastSVG='';
  $('dg').textContent='N/A';
  $('nt').textContent=r.length.toLocaleString();
  $('pair').textContent=r.pairCount.toLocaleString();
  $('long-rna-results').hidden=false;
  const sel=$('long-window-select');
  sel.replaceChildren();
  for(const w of r.windows){
    const opt=document.createElement('option');
    opt.value=String(w.index-1);
    opt.textContent='Window '+w.index+' · '+w.start.toLocaleString()+'–'+w.end.toLocaleString()+' nt · ΔG₃₇ '+w.fold.deltaG37.toFixed(2)+' kcal/mol';
    sel.appendChild(opt);
  }
  $('long-window-summary').textContent=
    'FULL RNA: '+r.length.toLocaleString()+' nt\n'+
    'MODE: '+r.windowCount+' independent '+r.windowSize+'-nt maximum windows; no cross-window pairing\n'+
    'GLOBAL MFE / ΔG: NOT CALCULATED\n\n'+
    r.windows.map(w=>
      String(w.index).padStart(2,'0')+'   '+String(w.start).padStart(5,' ')+
      '–'+String(w.end).padEnd(5,' ')+' nt   local ΔG₃₇ '+w.fold.deltaG37.toFixed(2).padStart(8,' ')+
      ' kcal/mol   '+w.fold.pairCount+' pairs').join('\n');
  renderLongWindow(0);
  for(const id of ['export-dbn','export-json','export-svg'])$(id).disabled=false;
  status('Windowed folding completed for '+r.length.toLocaleString()+' nt across '+r.windowCount+
   ' independent segments. Whole-transcript MFE and ΔG were NOT calculated.');
 }
 function run(){
  let sequence;
  try{sequence=NexusThermoFold.normalizeLong($('rna-input').value);}
  catch(e){status(e.message,true);return;}
  const long=sequence.length>NexusThermoFold.MAX;
  if(long&&typeof Worker==='undefined'){
    status('10 kb windowed folding requires Web Worker support. Try a current desktop/mobile browser on the deployed website.',true);
    return;
  }
  if(worker){worker.terminate();worker=null;}
  clearResults();
  $('run').disabled=true;$('cancel').disabled=false;
  status(long
    ?'Analyzing '+sequence.length.toLocaleString()+' nt in independent '+NexusThermoFold.LONG_WINDOW+
      '-nt windows. No full-length ΔG will be calculated.'
    :'Calculating restricted-model full-sequence minimum free energy for '+sequence.length.toLocaleString()+
      ' nt. Longer sequences may take additional processing time; you can cancel.');
  if(typeof Worker!=='undefined'){
    try{
      const active=new Worker('thermofold-worker.js');
      worker=active;
      active.onmessage=event=>{
        if(worker!==active)return;
        const data=event.data||{};
        if(data.progress){
          const p=data.progress;
          if(p.phase==='global'){
            status('Full-sequence MFE analysis: processed span '+p.completed.toLocaleString()+' of '+
              p.total.toLocaleString()+' nt. The restricted thermodynamic model is running on your device; you can cancel.');
          }else{
            status('Long RNA: window '+p.completed+'/'+p.total+
              ' completed ('+p.end.toLocaleString()+' / '+sequence.length.toLocaleString()+
              ' nt). Local folding only.');
          }
          return;
        }
        active.terminate();worker=null;
        $('run').disabled=false;$('cancel').disabled=true;
        if(data.ok){
          try{if(data.result?.mode==='independent-windows')showLong(data.result);else show(data.result);}
          catch(err){clearResults();status('Result visualization failed: '+err.message,true);}
        }else status(data.error||'Unknown folding worker error.',true);
      };
      active.onerror=()=>{
        if(worker!==active)return;
        active.terminate();worker=null;$('run').disabled=false;$('cancel').disabled=true;
        status('The folding worker failed. Try a shorter sequence or a modern browser.',true);
      };
      active.postMessage({sequence,mode:long?'windowed':'global',parameterPack});
    }catch(error){if(worker)worker.terminate();worker=null;$('run').disabled=false;$('cancel').disabled=true;status('Unable to start background folding: '+error.message,true);}
  }else{
    setTimeout(()=>{
      try{NexusThermoFold.setParameterPack(parameterPack);show(NexusThermoFold.fold(sequence));}
      catch(e){status(e.message,true);}
      finally{$('run').disabled=false;$('cancel').disabled=true;}
    },20);
  }
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
 $('run').addEventListener('click',run);
 $('cancel').addEventListener('click',()=>{if(worker)worker.terminate();worker=null;$('run').disabled=false;$('cancel').disabled=true;clearResults();status('Analysis cancelled. No partial-window predictions were published.');});
 $('long-window-select').addEventListener('change',e=>renderLongWindow(Number(e.target.value)));
 $('rna-input').addEventListener('input',()=>{
   if(worker){worker.terminate();worker=null;$('run').disabled=false;$('cancel').disabled=true;}
   if(last)clearResults();
   updateInputCount();
 });
 $('example').addEventListener('click',()=>{$('rna-input').value='>synthetic_hairpin\nGGGAAACCC';updateInputCount();status('Synthetic example loaded; click Analyze RNA structure.');});
 $('reset').addEventListener('click',()=>{if(worker)worker.terminate();worker=null;$('run').disabled=false;$('cancel').disabled=true;$('rna-input').value='';clearResults();updateInputCount();status('Cleared.');});
 $('rna-upload').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;
  if(file.size>250000){status('Choose a FASTA file under 250 KB.',true);return;}
  try{
    const raw=await file.text(),seq=NexusThermoFold.normalizeLong(raw);
    $('rna-input').value=raw;updateInputCount();
    status('Loaded '+seq.length.toLocaleString()+' nt. '+(seq.length>NexusThermoFold.MAX?'Windowed folding will be used.':'Restricted-model MFE will be used.')+' Click Analyze RNA structure.');
  }catch(error){status('Could not import: '+error.message,true);}
 });
 $('export-dbn').addEventListener('click',()=>{
  if(!last)return;
  const isLong=last.mode==='independent-windows';
  const title=isLong
   ?'>NEXUS_ThermoFold_10kb_windowed|global_deltaG=NOT_CALCULATED|nonoverlap_windows='+last.windowSize+'|nt='+last.length
   :'>NEXUS_ThermoFold_restricted_MFE|dG37='+last.deltaG37+'kcal_per_mol';
  download(isLong?'nexus_thermofold_10kb_windowed.dbn':'nexus_thermofold_restricted.dbn',
   title+'\n'+last.sequence+'\n'+last.dotBracket+'\n');
 });
 $('export-json').addEventListener('click',()=>{
  if(last)download(last.mode==='independent-windows'?'nexus_thermofold_10kb_windowed.json':'nexus_thermofold_restricted.json',
    JSON.stringify(last,null,2),'application/json');
 });
 $('export-svg').addEventListener('click',()=>{
  if(!lastSVG||!last)return;
  const isLong=last.mode==='independent-windows';
  const w=isLong?last.windows[Number($('long-window-select').value)||0]:null;
  const name=w?'nexus_thermofold_window_'+w.start+'-'+w.end+'.svg':'nexus_thermofold_structure.svg';
  download(name,lastSVG,'image/svg+xml');
 });
 updateInputCount();
})();
