/* NEXUS ThermoFold v0.1.1 — visual layout only. The coordinates do not affect
   folding, base pairs or model-based energies. Stem-loop representations are
   conventional 2D schematics, not 3D models or equilibrium populations. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexusThermoLayout=api;})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const GAP=29, PAIR_STEP=39, RADIUS=14;
 function fmt(n){return Number(n.toFixed(2));}
 function svgEsc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function parsePairs(result){
   const seq=String(result.sequence||'');
   if(!/^[ACGU]+$/.test(seq))throw Error('The structure viewer requires an unmodified RNA sequence.');
   if(typeof result.dotBracket!=='string'||result.dotBracket.length!==seq.length)throw Error('Missing or mismatched dot-bracket structure.');
   const stack=[], roots=[], nodes=[], pairing=new Map();
   for(let i=0;i<result.dotBracket.length;i++){
     const c=result.dotBracket[i];
     if(c==='('){const node={a:i+1,b:null,child:null,children:[],parent:stack.length?stack[stack.length-1]:null};if(node.parent){node.parent.children.push(node);if(node.parent.children.length===1)node.parent.child=node;}else roots.push(node);stack.push(node);nodes.push(node);}
     else if(c===')'){const node=stack.pop();if(!node)throw Error('Unbalanced pairing notation.');node.b=i+1;pairing.set(node.a,node.b);}
     else if(c!=='.')throw Error('Invalid pairing notation.');
   }
   if(stack.length)throw Error('Unbalanced pairing notation.');
   return {seq,roots,nodes,pairing};
 }
 function componentCoordinates(root,seq){
   let node=root, y=0, previous=null;
   const coords=new Map(), pairs=[];
   while(node){
     const a=node.a,b=node.b;
     if(previous){
       const left=a-previous.a-1,right=previous.b-b-1;
       const dy=PAIR_STEP+Math.max(left,right)*15;
       const nextY=y-dy;
       for(let k=1;k<=left;k++){const t=k/(left+1);coords.set(previous.a+k,{x:-GAP-(16+left*4)*Math.sin(Math.PI*t),y:y+(nextY-y)*t});}
       for(let k=1;k<=right;k++){const t=k/(right+1);coords.set(b+k,{x:GAP+(16+right*4)*Math.sin(Math.PI*t),y:nextY+(y-nextY)*t});}
       y=nextY;
     }
     coords.set(a,{x:-GAP,y});coords.set(b,{x:GAP,y});pairs.push([a,b]);
     previous=node;node=node.child;
   }
   const last=previous, loopCount=last.b-last.a-1;
   // A near-circular RNA hairpin loop above the closing base pair.
   // The arc radius scales with loop size, keeping nucleotide positions legible.
   const r=Math.max(GAP+3, (loopCount+1)*19/5.2);
   const drop=Math.sqrt(r*r-GAP*GAP);
   const start=Math.acos(-GAP/r), end=2*Math.PI+Math.acos(GAP/r);
   for(let k=1;k<=loopCount;k++){
     const t=k/(loopCount+1),theta=start+t*(end-start);
     coords.set(last.a+k,{x:r*Math.cos(theta),y:y-drop+r*Math.sin(theta)});
   }
   for(let i=root.a;i<=root.b;i++){if(!coords.has(i))throw Error('Unable to place nucleotide '+i);}
   return {coords,pairs,start:root.a,end:root.b};
 }
 function moleculeColors(nt,paired){
   if(!paired)return {fill:'#fff2d3',stroke:'#c7a25a',text:'#745322'};
   if(nt==='G'||nt==='C')return {fill:'#0f817b',stroke:'#075957',text:'#ffffff'};
   return {fill:'#4d8ac8',stroke:'#286399',text:'#ffffff'};
 }
 function renderArcDiagram(seq,nodes){
   const dx=22, x0=45, width=Math.max(360,x0*2+dx*(seq.length-1)),y=260,height=332;
   const paired=new Set(),pairs=[];
   for(const n of nodes){paired.add(n.a);paired.add(n.b);pairs.push([n.a,n.b]);}
   const items=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="RNA branched secondary structure shown as base-pair arcs">`,
   `<text x="${x0}" y="28" font-size="14" font-weight="700" fill="#245c59">Branched RNA: sequence-ordered base-pair arc diagram</text>`,
   `<text x="${x0}" y="49" font-size="11" fill="#547b75">Every selected pair is shown; arcs are a topology schematic, not molecular geometry.</text>`];
   items.push(`<path d="M${x0} ${y} H${x0+dx*(seq.length-1)}" stroke="#a6c8c1" stroke-width="2"/>`);
   for(const [a,b] of pairs){
     const x1=x0+(a-1)*dx,x2=x0+(b-1)*dx,span=b-a;
     const rise=Math.min(170,32+17*Math.sqrt(span));
     const wobble=(seq[a-1]+seq[b-1]==='GU'||seq[a-1]+seq[b-1]==='UG');
     items.push(`<path d="M${x1} ${y-14} Q${(x1+x2)/2} ${y-14-rise*2} ${x2} ${y-14}" stroke="${wobble?'#bb7434':'#37877f'}" stroke-width="${wobble?2.5:1.6}" stroke-opacity=".66" stroke-dasharray="${wobble?'5 4':'none'}" fill="none"/>`);
   }
   for(let i=0;i<seq.length;i++){
     const x=x0+i*dx,c=moleculeColors(seq[i],paired.has(i+1));
     items.push(`<circle cx="${x}" cy="${y}" r="10" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1"/><text x="${x}" y="${y+3.5}" font-size="10" text-anchor="middle" font-weight="700" fill="${c.text}">${seq[i]}</text>`);
     if((i+1)%10===0)items.push(`<text x="${x}" y="${y+25}" font-size="10" text-anchor="middle" fill="#608079">${i+1}</text>`);
   }
   items.push(`<text x="${x0}" y="${y+48}" font-size="12" fill="#285f59">5′</text><text x="${width-x0}" y="${y+48}" text-anchor="end" font-size="12" fill="#285f59">3′</text></svg>`);
   return {svg:items.join(''),componentCount:0,hiddenExterior:0,branched:true,arcPairs:pairs.length};
 }
 function render(result){
   const {seq,roots,nodes}=parsePairs(result);
   if(nodes.some(n=>n.children.length>1))return renderArcDiagram(seq,nodes);
   const groups=[], placements=[], paired=new Set();
   let xCursor=30, ymax=0, svgWidth=0;
   if(!roots.length){
     // An entirely unpaired RNA is displayed as a wrapped, continuous strand.
     const perRow=26,dx=27,dy=39,coords=[];
     for(let i=0;i<seq.length;i++){
       const row=Math.floor(i/perRow),col=i%perRow;
       coords.push({x:40+(row%2?perRow-1-col:col)*dx,y:62+row*dy});
     }
     const width=Math.max(370,40+(Math.min(perRow,seq.length)-1)*dx+60),height=110+(Math.ceil(seq.length/perRow)-1)*dy;
     const lines=[];
     for(let i=1;i<seq.length;i++){const a=coords[i-1],b=coords[i];lines.push(`<path d="M${fmt(a.x)} ${fmt(a.y)} L${fmt(b.x)} ${fmt(b.y)}" stroke="#a9c2bd" stroke-width="3" fill="none"/>`);}
     for(let i=0;i<seq.length;i++){const p=coords[i],c=moleculeColors(seq[i],false);lines.push(`<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="${RADIUS}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/><text x="${fmt(p.x)}" y="${fmt(p.y+4.3)}" text-anchor="middle" font-size="12" font-family="system-ui,sans-serif" font-weight="700" fill="${c.text}">${seq[i]}</text>`);}
     lines.push(`<text x="18" y="25" font-size="13" fill="#285f59" font-weight="700">5′</text><text x="${width-20}" y="${height-16}" text-anchor="end" font-size="13" fill="#285f59" font-weight="700">3′</text>`);
     return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="RNA strand with no base pairs predicted by the restricted model">${lines.join('')}</svg>`,componentCount:0,hiddenExterior:0};
   }
   for(const root of roots){
     const obj=componentCoordinates(root,seq);for(const [a,b] of obj.pairs){paired.add(a);paired.add(b);}
     const ps=[...obj.coords.values()],minx=Math.min(...ps.map(p=>p.x)),maxx=Math.max(...ps.map(p=>p.x)),miny=Math.min(...ps.map(p=>p.y)),maxy=Math.max(...ps.map(p=>p.y));
     const width=Math.max(165,maxx-minx+72),height=maxy-miny+105;
     groups.push({obj,width,height,minx,miny,maxy,root,x:xCursor});
     xCursor+=width+20; ymax=Math.max(ymax,height);svgWidth=xCursor+5;
   }
   const fullWidth=Math.max(350,svgWidth),fullHeight=Math.max(200,ymax+23);
   if(groups.length===1)groups[0].x=Math.max(0,(fullWidth-groups[0].width)/2);
   const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(fullWidth)}" height="${fmt(fullHeight)}" viewBox="0 0 ${fmt(fullWidth)} ${fmt(fullHeight)}" role="img" aria-label="RNA secondary structure shown as conventional stem-loop nucleotide drawings">`];
   for(let idx=0;idx<groups.length;idx++){
     const g=groups[idx],{obj}=g,offsetX=g.x+36-g.minx,offsetY=48-g.miny;
     const pt=k=>{const p=obj.coords.get(k);return {x:fmt(p.x+offsetX),y:fmt(p.y+offsetY)};};
     out.push(`<g aria-label="Stem-loop ${idx+1}, nucleotides ${obj.start} to ${obj.end}">`);
     for(let k=obj.start+1;k<=obj.end;k++){
       const a=pt(k-1),b=pt(k);
       out.push(`<path d="M${a.x} ${a.y} L${b.x} ${b.y}" stroke="#a9c2bd" stroke-width="3" stroke-linecap="round" fill="none"/>`);
     }
     for(const [a,b] of obj.pairs){const p=pt(a),q=pt(b);out.push(`<path d="M${p.x} ${p.y} L${q.x} ${q.y}" stroke="#6c9f98" stroke-width="2" stroke-dasharray="3 5" fill="none"/>`);}
     for(let k=obj.start;k<=obj.end;k++){
       const p=pt(k),nt=seq[k-1],c=moleculeColors(nt,paired.has(k));
       out.push(`<circle cx="${p.x}" cy="${p.y}" r="${RADIUS}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);
       out.push(`<text x="${p.x}" y="${fmt(p.y+4.4)}" font-size="12" text-anchor="middle" font-weight="700" font-family="system-ui,sans-serif" fill="${c.text}">${nt}</text>`);
     }
     const endA=pt(obj.start),endB=pt(obj.end);
     out.push(`<text x="${fmt(endA.x-27)}" y="${fmt(endA.y+5)}" text-anchor="end" font-size="13" fill="#2e6e65" font-weight="700" font-family="system-ui,sans-serif">${obj.start===1?'5′':'nt '+obj.start}</text>`);
     out.push(`<text x="${fmt(endB.x+27)}" y="${fmt(endB.y+5)}" font-size="13" fill="#2e6e65" font-weight="700" font-family="system-ui,sans-serif">${obj.end===seq.length?'3′':'nt '+obj.end}</text>`);
     const labelY=Math.max(...[...obj.coords.values()].map(p=>p.y+offsetY))+38;
     out.push(`<text x="${fmt(g.x+g.width/2)}" y="${fmt(labelY)}" text-anchor="middle" font-size="12" fill="#3f716d" font-family="system-ui,sans-serif">Stem-loop ${idx+1} · nt ${obj.start}–${obj.end}</text>`);
     out.push('</g>');
   }
   out.push('</svg>');
   let covered=0;for(const root of roots)covered+=root.b-root.a+1;
   return {svg:out.join(''),componentCount:roots.length,hiddenExterior:seq.length-covered};
 }
 return {render,parsePairs,componentCoordinates};
});
