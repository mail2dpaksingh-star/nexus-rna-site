/* NEXUS — professional restriction-site map v1.1, unique cutters throughout plasmid.
 * Pure presentation layer: maps the currently displayed record against a
 * curated 53-enzyme catalog. Existing cloning/digest code is not modified.
 * SVG labels: MCS sites + verified unique cutters; repeats stay in table.
 */
(function(root){
 'use strict';
 const d=root.document,S='http://www.w3.org/2000/svg';
 const map=d.getElementById('plasmid-svg');
 if(!map||!root.NEXUS_RE_UNIQUE||d.getElementById('nexus-map-label-toolbar')) return;
 const toolbar=d.createElement('div');toolbar.id='nexus-map-label-toolbar';toolbar.className='nexus-map-label-toolbar';
 const label=d.createElement('label');label.htmlFor='nexus-map-label-mode';label.textContent='Restriction sites on map';
 const mode=d.createElement('select');mode.id='nexus-map-label-mode';
 [['default','Unique cutters + MCS (recommended)'],['unique','Unique cutters only'],['mcs','MCS only'],['all','All mapped sites (limited labels)'],['none','Hide restriction labels']]
 .forEach(([value,title])=>{const op=d.createElement('option');op.value=value;op.textContent=title;mode.appendChild(op);});
 const status=d.createElement('span');status.className='nexus-map-label-status';status.setAttribute('aria-live','polite');
 toolbar.append(label,mode,status);map.parentNode.insertBefore(toolbar,map);
 const details=d.createElement('details');details.id='nexus-re-map-table';details.className='nexus-re-map-table';
 const summary=d.createElement('summary');summary.textContent='All recognized restriction enzymes and cut positions';
 const expl=d.createElement('p');expl.textContent='Predicted motif matches from 53 selected enzymes. Unique means exactly one matched recognition site in this entire displayed molecule. Recognition does not establish actual cutting, methylation compatibility or cloning success.';
 const filter=d.createElement('select');filter.setAttribute('aria-label','Filter restriction table');filter.id='nexus-re-table-filter';
 [['all','All detected enzymes'],['unique','Unique cutters'],['repeated','Multiple cutters']].forEach(([v,t])=>{const op=d.createElement('option');op.value=v;op.textContent=t;filter.appendChild(op);});
 const wrap=d.createElement('div');wrap.className='nexus-re-table-scroll';
 const table=d.createElement('table');table.innerHTML='<thead><tr><th>Enzyme</th><th>Recognition</th><th>Sites</th><th>Position(s), 1-based</th><th>In MCS</th></tr></thead>';
 const tbody=d.createElement('tbody');table.appendChild(tbody);wrap.appendChild(table);
 details.append(summary,expl,filter,wrap);map.parentNode.insertBefore(details,map.nextSibling);
 let result=null;
 function svgEl(name,attrs,parent,text){const e=d.createElementNS(S,name);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!==undefined)e.textContent=String(text);parent.appendChild(e);return e;}
 function putTable(){tbody.replaceChildren();if(!result)return;const kind=filter.value;const rows=result.enzymes.filter(x=>kind==='all'||(kind==='unique'&&x.unique)||(kind==='repeated'&&!x.unique));
   if(!rows.length){const tr=d.createElement('tr'),td=d.createElement('td');td.colSpan=5;td.textContent='No matches';tr.appendChild(td);tbody.appendChild(tr);return;}
   rows.forEach(r=>{const tr=d.createElement('tr');[r.enzyme,r.recognition,r.count,r.positions.join(', '),r.mcs?'Yes':'No'].forEach(val=>{const td=d.createElement('td');td.textContent=String(val);tr.appendChild(td);});tbody.appendChild(tr);});}
 // Allocate by side with equal vertical separation. Bounded labels are
 // explicitly capped: unshown sites remain available in the complete table.
 function allocate(items,minY,maxY){items.sort((a,b)=>a.ty-b.ty||a.start-b.start||a.enzyme.localeCompare(b.enzyme));const gap=22;
   if(items.length*gap>maxY-minY+gap)return items.slice(0,Math.floor((maxY-minY)/gap)+1);
   items.forEach((x,i)=>{x.ly=Math.max(minY+i*gap,Math.min(maxY-(items.length-i-1)*gap,x.ty));if(i)x.ly=Math.max(x.ly,items[i-1].ly+gap);});
   return items;
 }
 function draw(){const svg=map.querySelector('svg');if(!svg)return;
   svg.querySelectorAll('[data-nexus-re-outer="true"]').forEach(n=>n.remove());
   // Preserve original red site tick positions for linear view; hide only
   // the circular map's obsolete inside labels/ticks.
   const vb=(svg.getAttribute('viewBox')||'0 0 760 760').trim().split(/\s+/).map(Number),w=vb[2]||760,h=vb[3]||760;
   if(h<w*.85){status.textContent='Linear map unchanged; unique-site table is still available.';return;}
   svg.querySelectorAll('text').forEach(el=>{if(['#a13a56','#8b3550'].includes((el.getAttribute('fill')||'').toLowerCase()))el.remove();});
   svg.querySelectorAll('line').forEach(line=>{if((line.getAttribute('stroke')||'').toLowerCase()==='#b83f62')line.setAttribute('display','none');});
   if(!result)return;
   // Original map renderer summarized only its ten-enzyme catalog. The
   // expanded map must not leave a misleading six-site headline behind.
   const subtitle=[...svg.querySelectorAll('text')].find(t=>/\d+ mapped restriction sites/.test(t.textContent||''));
   if(subtitle)subtitle.textContent=subtitle.textContent.replace(/\d+ mapped restriction sites/,`${result.hits.length} RE motif matches (${result.librarySize} enzymes)`);
   let hits=result.hits.filter(r=>mode.value==='all'||(mode.value==='mcs'&&r.inMCS)||(mode.value==='unique'&&r.unique)||(mode.value==='default'&&(r.unique||r.inMCS)));
   if(mode.value==='none')hits=[];
   // Prioritize MCS markers, then single cutters outside MCS. Do not falsely
   // label non-unique sites as 'unique'; each name remains distinct.
   hits.sort((a,b)=>Number(b.inMCS)-Number(a.inMCS)||Number(b.unique)-Number(a.unique)||a.enzyme.localeCompare(b.enzyme)||a.start-b.start);
   const maxLabels=18,eligible=hits.length,visible=hits.slice(0,maxLabels);
   const cx=w/2,cy=w/2+12,R=w*.27;
   const selected=visible.map(hit=>{const angle=(hit.start-1)/result.sequenceLength*2*Math.PI-Math.PI/2;
     return {...hit,angle,tx:cx+(R+10)*Math.cos(angle),ty:cy+(R+10)*Math.sin(angle),side:Math.cos(angle)<0?'left':'right'};});
   const left=allocate(selected.filter(x=>x.side==='left'),113,h-108),right=allocate(selected.filter(x=>x.side==='right'),113,h-108);
   const layer=svgEl('g',{'data-nexus-re-outer':'true','pointer-events':'none','aria-label':'Restriction site labels outside the plasmid circle'},svg);
   [...left,...right].forEach(t=>{
     const leftSide=t.side==='left',rail=leftSide?145:w-145,textX=leftSide?135:w-135;
     const x1=cx+(R+30)*Math.cos(t.angle),y1=cy+(R+30)*Math.sin(t.angle);
     svgEl('polyline',{points:`${t.tx.toFixed(1)},${t.ty.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${rail},${(t.ly-4).toFixed(1)}`,'stroke':'#aa6479','stroke-width':1.05,fill:'none','stroke-linejoin':'round'},layer);
     svgEl('circle',{cx:t.tx.toFixed(1),cy:t.ty.toFixed(1),r:'2.6',fill:t.inMCS?'#b85b72':'#a87990'},layer);
     svgEl('text',{x:textX,y:t.ly,'text-anchor':leftSide?'end':'start','font-size':'11','font-weight':t.inMCS?'700':'550',fill:t.inMCS?'#8d344f':'#6e4960','font-family':'system-ui,Arial,sans-serif'},layer,`${t.enzyme} · ${t.start}`);
   });
   const n=result.enzymes.filter(x=>x.unique).length,tot=result.enzymes.length;
   status.textContent=`${n} unique cutter(s) among ${tot} detected enzyme(s). ${left.length+right.length} of ${eligible} eligible map label(s) shown; complete list below.`;
   svg.setAttribute('data-nexus-map-professional','true');
 }
 function update(){const svg=map.querySelector('svg');if(!svg)return;try{result=root.NEXUS_RE_UNIQUE.analyze(root.NEXUS_ACTIVE_PW_RECORD);putTable();draw();}
   catch(err){result=null;tbody.replaceChildren();status.textContent='Restriction map unavailable: '+err.message;}}
 const obs=new MutationObserver(update);obs.observe(map,{childList:true,subtree:false});
 mode.addEventListener('change',draw);filter.addEventListener('change',putTable);
 // Export the annotated map visible on screen, rather than the original
 // internal-label SVG. Other exports continue using their existing handlers.
 const exportBtn=d.getElementById('annotation-svg');
 if(exportBtn)exportBtn.addEventListener('click',e=>{
   const current=map.querySelector('svg');if(!current||!result)return;
   e.preventDefault();e.stopImmediatePropagation();
   const clone=current.cloneNode(true);clone.setAttribute('xmlns',S);
   const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=d.createElement('a');a.href=url;a.download='nexus_plasmid_map_annotated.svg';d.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 },true);
 root.NEXUS_PROFESSIONAL_MAP_STATUS={version:'1.1',mode:()=>mode.value,refresh:update};
 update();
})(window);
