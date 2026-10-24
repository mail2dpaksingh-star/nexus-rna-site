/* NEXUS map feature inspector — local-only 5′→3′ annotated sequence preview. */
(()=>{'use strict';
 const W=window.NexusWorkbench;
 if(!W)return;
 const css=document.createElement('style');
 css.textContent=`.nexus-map-feature:hover {opacity:.78} .nexus-map-feature:focus-visible {outline:3px solid #14616c;outline-offset:3px}
 .nexus-feature-inspector {background:#edf6f2;color:#183a44;border:1px solid #c9dfd6;border-radius:13px;padding:16px;margin:12px 0 18px;font:14px/1.6 system-ui,sans-serif}
 .nexus-feature-inspector h3{font-size:17px;margin:0 0 7px;color:#133f49}
 .nexus-feature-inspector .nexus-f-meta{margin:4px 0 8px;overflow-wrap:anywhere}
 .nexus-feature-inspector .nexus-f-warning{margin:6px 0;color:#855024}
 .nexus-feature-inspector textarea{display:block;width:100%;box-sizing:border-box;min-height:126px;font:13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;background:white;color:#173f46;border:1px solid #b9d1c7;border-radius:9px;padding:10px;resize:vertical;white-space:pre;overflow:auto}
 .nexus-feature-inspector button{font:600 13px system-ui,sans-serif;border:1px solid #b5d4c5;background:#e3f1e9;border-radius:8px;color:#123943;padding:9px 13px;cursor:pointer;margin:7px 8px 0 0}
 .nexus-feature-inspector button:focus-visible{outline:2px solid #117a73;outline-offset:2px}
 .nexus-feature-inspector .nexus-f-note{font-size:12px;color:#4a6b70;margin:6px 0 0}`;
 document.head.appendChild(css);
 function make(tag,className,text){let e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function format(sequence){return (sequence.match(/.{1,70}/g)||[]).join('\n');}
 function download(name,value){let blob=new Blob([value],{type:'text/plain;charset=utf-8'}),link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function fastaName(name){return String(name||'feature').replace(/[^A-Za-z0-9._-]+/g,'_').slice(0,70)||'feature';}
 const maps=[
  {id:'plasmid-svg',record:()=>window.NEXUS_GET_CURRENT_RECORD?.()},
  {id:'plib-map',record:()=>window.NEXUS_GET_ADVANCED_MAP_RECORD?.('plib-map')},
  {id:'clone-map',record:()=>window.NEXUS_GET_ADVANCED_MAP_RECORD?.('clone-map')}
 ];
 for(const config of maps){let map=document.getElementById(config.id);if(!map)continue;
  let panel=make('section','nexus-feature-inspector');panel.setAttribute('aria-live','polite');
  let heading=make('h3','','Feature sequence (5′→3′)');
  let help=make('p','nexus-f-meta','Select a colored component arrow or its label on the plasmid map to inspect its nucleotide sequence. You can also use Tab, then Enter.');
  let info=make('p','nexus-f-meta');let note=make('p','nexus-f-warning');let textarea=make('textarea');textarea.readOnly=true;textarea.setAttribute('aria-label','Selected feature nucleotide sequence in 5 prime to 3 prime orientation');textarea.hidden=true;
  let copyBtn=make('button','','Copy sequence');copyBtn.type='button';copyBtn.hidden=true;
  let exportBtn=make('button','','Download FASTA');exportBtn.type='button';exportBtn.hidden=true;
  let source=make('p','nexus-f-note');panel.append(heading,help,info,note,textarea,copyBtn,exportBtn,source);map.insertAdjacentElement('afterend',panel);
  let last=null;
  function reset(){info.textContent='';note.textContent='';source.textContent='';textarea.value='';textarea.hidden=true;copyBtn.hidden=true;exportBtn.hidden=true;last=null;}
  function inspect(index){try{
   const record=config.record();if(!record||!Array.isArray(record.features))throw Error('No sequence-backed plasmid record selected.');
   if(!Number.isInteger(index)||index<0||index>=Math.min(record.features.length,35))throw Error('Feature selection outside the displayed map.');
   const feature=W.sanitizeFeature(record.features[index],record.sequence.length);
   const seq=W.extract(record,feature);
   if(seq.length!==feature.end-feature.start+1)throw Error('Unexpected sequence length.');
   last={sequence:seq,label:feature.label,record:record.name,start:feature.start,end:feature.end,strand:feature.strand};
   copyBtn.textContent='Copy sequence';
   heading.textContent=feature.label+' — 5′→3′ DNA sequence';
   info.textContent=`${record.name||'Plasmid'} · ${feature.type} · reference coordinates ${feature.start.toLocaleString()}–${feature.end.toLocaleString()} bp (inclusive) · ${seq.length.toLocaleString()} nt · strand ${feature.strand===-1?'− (reverse complement)':'+'}`;
   note.textContent=(record.id==='nexus-annotated-teaching-demo'||/synthetic|illustrative/i.test(String(record.source||'')))?
    'SYNTHETIC DEMO: This sequence is derived from the illustrative DNA fixture; it does not represent a verified biological construct.':'';
   source.textContent='The displayed sequence follows the annotated feature strand in its 5′→3′ direction. Reference coordinates are on the forward sequence; joined/wraparound features are not supported.';
   textarea.value=format(seq);textarea.hidden=false;copyBtn.hidden=false;exportBtn.hidden=false;
  }catch(err){reset();info.textContent='Unable to inspect feature: '+String(err.message||err);}}
  function featureTarget(event){return event.target instanceof Element?event.target.closest('[data-nexus-feature-index]'):null;}
  map.addEventListener('click',e=>{const target=featureTarget(e);if(target&&map.contains(target))inspect(Number(target.dataset.nexusFeatureIndex));});
  map.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;let target=featureTarget(e);if(!target||!map.contains(target))return;e.preventDefault();inspect(Number(target.dataset.nexusFeatureIndex));});
  copyBtn.addEventListener('click',async()=>{if(!last)return;try{await navigator.clipboard.writeText(last.sequence);copyBtn.textContent='Copied';}catch(_){textarea.focus();textarea.select();copyBtn.textContent='Select text and copy (Ctrl+C)';}});
  exportBtn.addEventListener('click',()=>{if(!last)return;const file=fastaName(last.record+'_'+last.label)+'.fasta';const title=`>${fastaName(last.label)} reference=${fastaName(last.record)} range=${last.start}-${last.end} strand=${last.strand} orientation=5to3`;
   download(file,title+'\n'+format(last.sequence)+'\n');});
  // Only observe replacement of the SVG, not edits within it; changing plasmids must clear a stale selection.
  new MutationObserver(()=>{heading.textContent='Feature sequence (5′→3′)';copyBtn.textContent='Copy sequence';reset();}).observe(map,{childList:true});
 }
})();
