/* NEXUS Plasmid Feature Inspector + annotated region editor. Research-stage, browser-local only. */
(()=>{'use strict';
 const W=window.NexusWorkbench, R=window.NexusRegion;
 if(!W||!R)return;
 const style=document.createElement('style');
 style.textContent=`
 .nexus-map-feature:hover,[data-nexus-feature-index]:hover{opacity:.8}
 [data-nexus-feature-index]:focus-visible{outline:3px solid #14616c;outline-offset:3px}
 .nexus-feature-inspector{background:#edf6f2;color:#183a44;border:1px solid #c9dfd6;border-radius:14px;padding:17px;margin:14px 0 24px;font:14px/1.5 system-ui,sans-serif;max-width:100%;box-sizing:border-box}
 .nexus-feature-inspector h3{font-size:18px;margin:0 0 8px;color:#133f49}.nexus-feature-inspector h4{font-size:15px;margin:15px 0 7px;color:#194751}
 .nexus-feature-inspector p{margin:7px 0}.nexus-feature-inspector .nexus-f-warning{color:#8b4c24;font-weight:600}
 .nexus-feature-inspector .nexus-f-small{font-size:12px;color:#52716d}
 .nexus-feature-inspector .nexus-f-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin:12px 0}
 .nexus-feature-inspector label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:650;min-width:0}
 .nexus-feature-inspector input,.nexus-feature-inspector select{width:100%;max-width:100%;box-sizing:border-box;border:1px solid #b9d1c7;background:white;color:#163946;border-radius:8px;padding:9px;font:14px system-ui,sans-serif}
 .nexus-feature-inspector textarea{display:block;width:100%;box-sizing:border-box;min-height:125px;font:13px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;background:white;color:#173f46;border:1px solid #b9d1c7;border-radius:9px;padding:10px;resize:vertical;white-space:pre;overflow:auto}
 .nexus-feature-inspector button{font:600 13px system-ui,sans-serif;border:1px solid #b5d4c5;background:#e3f1e9;border-radius:8px;color:#123943;padding:9px 12px;cursor:pointer;margin:6px 7px 3px 0}
 .nexus-feature-inspector button:hover{background:#d3eadd}.nexus-feature-inspector button:focus-visible{outline:2px solid #117a73;outline-offset:2px}
 .nexus-feature-inspector .nexus-f-list{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
 .nexus-feature-inspector .nexus-f-chip{border:1px solid #c5dcd4;border-radius:8px;padding:7px 9px;background:white;font-size:12px}
 .nexus-feature-inspector .nexus-f-chip button{padding:3px 7px;margin:0 0 0 6px;font-size:11px}
 .nexus-feature-inspector .nexus-f-tracks{max-height:430px;overflow:auto;background:#fff;border:1px solid #d3e6dc;border-radius:10px;padding:10px;margin:8px 0;white-space:pre}
 .nexus-feature-inspector .nexus-f-block{margin:0 0 14px;padding:0 0 8px;border-bottom:1px solid #e2e9e6}
 .nexus-feature-inspector .nexus-f-trackline{display:flex;gap:4px;font:12px/1.6 ui-monospace,Consolas,monospace;white-space:pre;width:max-content;max-width:none}
 .nexus-feature-inspector .nexus-f-trackline .nexus-f-tracklabel{display:inline-block;width:23ch;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:pre}
 .nexus-feature-inspector .nexus-f-trackseq{color:#143a45;font-weight:700}
 .nexus-feature-inspector .nexus-f-marker{font-weight:750}
 .nexus-feature-inspector [hidden]{display:none!important}`;
 document.head.appendChild(style);
 const mk=(tag,cls,text)=>{let e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const wrap=seq=>(seq.match(/.{1,70}/g)||[]).join('\n');
 const fname=text=>String(text||'region').replace(/[^A-Za-z0-9._-]+/g,'_').slice(0,72)||'region';
 function download(file,text,mime='text/plain;charset=utf-8'){
  const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function input(label,type='text',value=''){const box=mk('label'),text=mk('span','',label),ctl=mk('input');ctl.type=type;ctl.value=String(value);box.append(text,ctl);return [box,ctl];}
 function choice(label,options){const box=mk('label'),text=mk('span','',label),ctl=mk('select');box.append(text,ctl);for(const [value,title] of options){const o=mk('option','',title);o.value=value;ctl.append(o);}return [box,ctl];}
 function action(text,parent){let b=mk('button','',text);b.type='button';parent.append(b);return b;}
 function isDemo(record){return record?.id==='nexus-annotated-teaching-demo'||/synthetic|illustrative|teaching vector/i.test(String(record?.source||''));}
 function trackColor(type,label){let t=(type+' '+label).toLowerCase();if(/promoter|cmv|t7 /.test(t))return '#7952b3';if(/5.?utr|3.?utr/.test(t))return '#098778';if(/rbs|ribosome/.test(t))return '#b17b16';if(/cds|insert|goi/.test(t))return '#c34261';if(/terminator/.test(t))return '#2679a8';if(/origin/.test(t))return '#12856a';return '#53699b';}
 const maps=[{id:'plasmid-svg',record:()=>window.NEXUS_GET_CURRENT_RECORD?.()}, {id:'plib-map',record:()=>window.NEXUS_GET_ADVANCED_MAP_RECORD?.('plib-map')}, {id:'clone-map',record:()=>window.NEXUS_GET_ADVANCED_MAP_RECORD?.('clone-map')}];
 for(const config of maps){const map=document.getElementById(config.id);if(!map)continue;
  const panel=mk('section','nexus-feature-inspector');panel.setAttribute('aria-label','Select, annotate and download plasmid region');
  const title=mk('h3','','Selected plasmid region · 5′ → 3′');const instruction=mk('p','','Click a colored feature arrow, or enter reference positions to select any DNA region. Add your own verified or proposed feature labels beneath the sequence.');
  const rangeGrid=mk('div','nexus-f-grid');
  const [startBox,start]=input('Reference start (1-based)','number','1'),[endBox,end]=input('Reference end (inclusive)','number','100'),[strandBox,strand]=choice('View selected DNA as', [['1','Forward strand (+), 5′→3′'],['-1','Reverse complement (−), 5′→3′']]);
  rangeGrid.append(startBox,endBox,strandBox);
  const choose=action('Select coordinates',panel);
  const info=mk('p'),warning=mk('p','nexus-f-warning'),hint=mk('p','nexus-f-small','Reference and annotation positions use 1-based inclusive coordinates. If the plasmid is circular, start > end selects a region crossing the origin.');
  panel.append(title,instruction,rangeGrid,info,warning,hint);
  const seqTitle=mk('h4','','Nucleotide sequence');const textarea=mk('textarea');textarea.readOnly=true;textarea.setAttribute('aria-label','Selected DNA 5 prime to 3 prime sequence');
  const copy=action('Copy sequence',panel),fasta=action('Download FASTA',panel);
  const editorTitle=mk('h4','','Add an annotation under the selected sequence');
  const editHint=mk('p','nexus-f-small','Labels describe features you know or hypothesize. NEXUS does not infer CMV/T7 promoters, ribosome-binding sites, or UTR identity from sequence alone. Coordinates below are relative to the exported region (1..length).');
  const editGrid=mk('div','nexus-f-grid');
  const [typeBox,type]=choice('Annotation type', [['promoter|CMV promoter','CMV promoter'],['promoter|T7 promoter','T7 promoter'],['regulatory|RBS','RBS / Shine–Dalgarno'],['misc_feature|5′ UTR','5′ UTR'],['misc_feature|3′ UTR','3′ UTR'],['CDS|Coding sequence','CDS / ORF'],['misc_feature|Insert / GOI','Insert / GOI'],['terminator|Terminator','Terminator'],['rep_origin|Origin of replication','Origin of replication'],['misc_feature|Custom feature','Custom feature']]);
  const [labelBox,label]=input('Editable label','text','CMV promoter'),[fStartBox,fStart]=input('Region start','number','1'),[fEndBox,fEnd]=input('Region end','number','100');
  const [fStrandBox,fStrand]=choice('Annotation strand', [['1','Forward (+)'],['-1','Reverse (−)']]);
  editGrid.append(typeBox,labelBox,fStartBox,fEndBox,fStrandBox);
  const add=action('Add annotation',panel),annotationList=mk('div','nexus-f-list');
  const tracksTitle=mk('h4','','Sequence with annotation tracks');const tracks=mk('div','nexus-f-tracks');tracks.setAttribute('role','region');tracks.setAttribute('aria-label','Sequence alignment with annotation tracks');tracks.tabIndex=0;
  const exportTitle=mk('h4','','Download selected region');
  const exports=mk('div');const annotated=action('Annotated TXT',exports),json=action('Annotated JSON',exports),gb=action('GenBank (.gb)',exports),importBtn=action('Import annotated JSON',exports),importFile=mk('input');importFile.type='file';importFile.accept='.json,application/json';importFile.hidden=true;
  const exportHint=mk('p','nexus-f-small','FASTA contains nucleotides only; download annotated TXT, JSON or GenBank to retain feature labels. Exported GenBank uses a linear selected region with simple clipped annotations. Export does not modify the original plasmid or your saved library.');
  panel.append(seqTitle,textarea,copy,fasta,editorTitle,editHint,editGrid,add,annotationList,tracksTitle,tracks,exportTitle,exports,importFile,exportHint);
  map.insertAdjacentElement('afterend',panel);
  let region=null,annotations=[],record=null;
  const available=()=>{for(let e of [copy,fasta,add,annotated,json,gb,importBtn,textarea])e.disabled=!region;};
  function renderTracks(){tracks.replaceChildren();if(!region){tracks.textContent='Select a plasmid feature or reference region to display the sequence with annotation tracks.';return;}
    for(const b of R.rowsOf(region.sequence,annotations)){
      const block=mk('div','nexus-f-block'),heading=mk('div','nexus-f-trackline','Region nucleotides '+b.start+'–'+b.end),base=mk('div','nexus-f-trackline');
      const left=mk('span','nexus-f-tracklabel','Sequence 5′→3′');const bases=mk('span','nexus-f-trackseq',b.sequence);base.append(left,bases);block.append(heading,base);
      for(const row of b.rows){let line=mk('div','nexus-f-trackline');const lab=mk('span','nexus-f-tracklabel',row.label),marker=mk('span','nexus-f-marker',row.track);marker.style.color=trackColor(row.type,row.label);line.title=`${row.label}: ${row.type}, ${row.strand===-1?'reverse':'forward'} strand (${row.origin})`;line.append(lab,marker);block.append(line);}
      tracks.append(block);
    }
  }
  function renderList(){annotationList.replaceChildren();if(!region)return;
    if(!annotations.length)annotationList.append(mk('span','nexus-f-small','No annotation tracks yet. Use the editor above to add one.'));
    annotations.forEach((a,i)=>{const chip=mk('span','nexus-f-chip');const name=mk('span','',`${a.label} · ${a.start}–${a.end} · ${a.strand===-1?'−':'+'}${a.origin==='reference'?' · from existing map':''}${a.partial?' · clipped':''}`);const remove=action('Remove',chip);remove.setAttribute('aria-label','Remove annotation '+a.label+' from region export');remove.addEventListener('click',()=>{annotations.splice(i,1);renderList();renderTracks();});chip.prepend(name);annotationList.append(chip);});
  }
  function reset(){region=null;record=null;annotations=[];textarea.value='';info.textContent='';warning.textContent='';copy.textContent='Copy sequence';renderList();renderTracks();available();}
  function setRegion(rec,a,b,dir,clickedLabel){
    try{
      const next=R.chooseRegion(rec,a,b,dir);const projected=R.projectFeatures(rec,next);
      record=rec;region=next;annotations=projected;
      start.value=String(next.start);end.value=String(next.end);strand.value=String(next.orientation);
      title.textContent=(clickedLabel||'Selected region')+' · 5′→3′ DNA';
      info.textContent=`${next.name} · reference ${next.start.toLocaleString()}..${next.end.toLocaleString()}${next.wrapped?' (across origin)':''} · ${next.length.toLocaleString()} nt · ${next.orientation===-1?'− reverse complement':'+ forward strand'} · ${annotations.length} existing annotation(s)`;
      warning.textContent=isDemo(rec)?'SYNTHETIC DEMO: illustration only, not a verified biological plasmid.':'';
      textarea.value=wrap(next.sequence);fStart.value='1';fEnd.value=String(next.length);copy.textContent='Copy sequence';
      renderList();renderTracks();available();
    }catch(err){warning.textContent='Unable to select region: '+(err.message||String(err));}
  }
  function selectFeature(index){try{
    const rec=config.record();if(!rec||!Array.isArray(rec.features))throw Error('No selected sequence-backed record.');
    if(!Number.isInteger(index)||index<0||index>=Math.min(rec.features.length,35))throw Error('Selected arrow is outside the mapped features.');
    const f=W.sanitizeFeature(rec.features[index],rec.sequence.length);
    setRegion(rec,f.start,f.end,f.strand,f.label);
  }catch(err){warning.textContent='Unable to select feature: '+(err.message||String(err));}}
  function target(event){return event.target instanceof Element?event.target.closest('[data-nexus-feature-index]'):null;}
  map.addEventListener('click',e=>{const el=target(e);if(el&&map.contains(el))selectFeature(Number(el.dataset.nexusFeatureIndex));});
  map.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=target(e);if(!el||!map.contains(el))return;e.preventDefault();selectFeature(Number(el.dataset.nexusFeatureIndex));});
  choose.addEventListener('click',()=>{const rec=config.record();if(!rec){warning.textContent='No plasmid record is selected.';return;}setRegion(rec,start.value,end.value,strand.value,'Selected region');});
  type.addEventListener('change',()=>{label.value=type.value.split('|')[1]||'Custom feature';});
  add.addEventListener('click',()=>{if(!region)return;try{
    if(annotations.length>=100)throw Error('Up to 100 annotation tracks per selected region are supported.');
    const a=R.cleanAnnotation({start:fStart.value,end:fEnd.value,label:label.value,type:type.value.split('|')[0],strand:fStrand.value,origin:'user'},region.length);
    annotations.push(a);warning.textContent=isDemo(record)?'SYNTHETIC DEMO: annotation applies only to a synthetic teaching construct.':'';renderList();renderTracks();
  }catch(err){warning.textContent='Annotation not added: '+(err.message||String(err));}});
  copy.addEventListener('click',async()=>{if(!region)return;try{await navigator.clipboard.writeText(region.sequence);copy.textContent='Copied';}catch(_){textarea.focus();textarea.select();copy.textContent='Select text, press Ctrl+C';}});
  const baseName=()=>fname((region?.name||'plasmid')+'_region_'+region.start+'-'+region.end);
  fasta.addEventListener('click',()=>{if(!region)return;download(baseName()+'.fasta',`>${baseName()} strand=${region.orientation===-1?'-':'+'} length=${region.length} range=${region.start}..${region.end}\n${wrap(region.sequence)}\n`);});
  annotated.addEventListener('click',()=>{if(region)download(baseName()+'_annotated.txt',R.annotatedText(region,annotations));});
  function payload(){return {format:'nexus-selected-region-v1',application:'NEXUS RNA BioSolutions',provenance:'User annotations are not sequence-validated; inspect original GenBank source for complex features.',record:{name:region.name,source:region.source,synthetic:isDemo(record),length:region.recordLength},selection:{start:region.start,end:region.end,orientation:region.orientation,wrapped:region.wrapped,length:region.length},sequence:region.sequence,annotations:annotations.map(a=>({...a}))};}
  json.addEventListener('click',()=>{if(region)download(baseName()+'_annotated.json',JSON.stringify(payload(),null,2)+'\n','application/json');});
  gb.addEventListener('click',()=>{if(!region)return;try{
     let features=R.genbankFeatures(annotations,region.length);download(baseName()+'_annotated.gb',W.writeGenBank({name:baseName(),sequence:region.sequence,features,circular:false,source:region.source}));
    }catch(e){warning.textContent='GenBank export failed: '+String(e.message||e);}});
  importBtn.addEventListener('click',()=>{if(region)importFile.click();});
  importFile.addEventListener('change',async()=>{const file=importFile.files[0];importFile.value='';if(!file||!region)return;
    try{if(file.size>2000000)throw Error('JSON file exceeds 2 MB.');const saved=JSON.parse(await file.text());if(saved.format!=='nexus-selected-region-v1'||saved.sequence!==region.sequence||!Array.isArray(saved.annotations))throw Error('Select the exact same DNA region and orientation before importing these annotations.');
      if(saved.annotations.length>100)throw Error('Too many annotations.');annotations=saved.annotations.map(a=>R.cleanAnnotation(a,region.length));renderList();renderTracks();warning.textContent='Imported annotations into the current region preview. The original plasmid record was not changed.';
    }catch(err){warning.textContent='Import failed: '+String(err.message||err);}
  });
  // When the active plasmid or topology is changed and map SVG is replaced, discard stale selections.
  new MutationObserver(()=>{title.textContent='Selected plasmid region · 5′ → 3′';reset();const rec=config.record();if(rec?.sequence){start.value='1';end.value=String(Math.min(rec.sequence.length,100));}}).observe(map,{childList:true});
  reset();const initial=config.record();if(initial?.sequence)end.value=String(Math.min(initial.sequence.length,100));
 }
})();
