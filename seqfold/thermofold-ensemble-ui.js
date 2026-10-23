(function(){'use strict';
const $=id=>document.getElementById(id);let last=null,lastSvg='';
const status=(s,error=false)=>{$('status').textContent=s;$('status').className='muted '+(error?'bad':'good');};
const download=(name,content,type)=>{const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);};
const fmt=x=>Number.isFinite(x)?x.toFixed(3):'—';
function draw(r){
 const n=r.length,w=500,h=500,pad=45,sz=w-pad*2,svg=[];
 svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="RNA base-pair probability dot plot">`);
 svg.push(`<rect width="${w}" height="${h}" fill="#fbfffc"/><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#34555b"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="#34555b"/>`);
 const tick=()=>[1,Math.round(n/2),n].filter((v,i,a)=>a.indexOf(v)===i);
 for(const t of tick()){const x=pad+(t-1)*sz/Math.max(1,n-1),y=h-pad-(t-1)*sz/Math.max(1,n-1);
 svg.push(`<text x="${x}" y="${h-pad+18}" font-size="12" text-anchor="middle" fill="#315657">${t}</text><text x="${pad-10}" y="${y+4}" font-size="12" text-anchor="end" fill="#315657">${t}</text>`);}
 svg.push(`<text x="${w/2}" y="${h-8}" text-anchor="middle" fill="#315657" font-size="13">Nucleotide i</text><text x="14" y="${h/2}" transform="rotate(-90 14 ${h/2})" text-anchor="middle" fill="#315657" font-size="13">Nucleotide j</text>`);
 for(const {i,j,p,pair} of r.probabilities){let x=pad+(i-1)*sz/Math.max(1,n-1),y=h-pad-(j-1)*sz/Math.max(1,n-1);
  const radius=1.7+Math.sqrt(p)*6.5,red=Math.round(23+105*p),green=Math.round(139-80*p),blue=Math.round(127-76*p);
  svg.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="rgb(${red},${green},${blue})" fill-opacity=".88"><title>${pair} ${i}–${j}: ${(p*100).toFixed(1)}%</title></circle>`);
 }
 if(!r.probabilities.length)svg.push(`<text x="250" y="260" text-anchor="middle" fill="#65847d">No pairs above threshold</text>`);
 svg.push('</svg>');return svg.join('');
}
function show(r){last=r;lastSvg=draw(r);$('plot').innerHTML=lastSvg;
 $('dg').textContent=fmt(r.ensembleFreeEnergy);$('pairs').textContent=fmt(r.expectedPairs);$('confidence').textContent=(r.mfeProbability*100).toFixed(1)+'%';
 $('diversity').textContent=fmt(r.expectedEnsemblePairDistance);
 $('centroid-distance').textContent=fmt(r.centroidExpectedDistance);
 $('mfe-distance').textContent=fmt(r.mfeExpectedDistance);
 $('centroid-pairs').textContent=String(r.centroidPairCount);
 const drawing=NexusThermoLayout.render({sequence:r.sequence,dotBracket:r.centroidStructure});
 $('centroid-view').innerHTML=drawing.svg;
 $('centroid-note').textContent=`Probability-based centroid (noncrossing, minimum hairpin length): ${r.centroidPairCount} pairs. Model-derived—not a measured structure.`;

 const tbody=$('rows');tbody.replaceChildren();
 for(const v of r.probabilities.slice(0,50)){
  const tr=document.createElement('tr');for(const val of [v.i,v.j,v.pair,(v.p*100).toFixed(2)+'%']){const td=document.createElement('td');td.textContent=String(val);tr.append(td);}tbody.append(tr);
 }
 if(!r.probabilities.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.textContent='No pairing probability above the selected cutoff';row.append(cell);tbody.append(row);}
 $('footnote').textContent=`${r.length} nt · ${r.probabilities.length} displayed pairs at ≥${(r.cutoff*100).toFixed(0)}% · 37°C · NEXUS restricted energy model; no external folding engine used.`;
 for(const key of ['json','csv','svg'])$(key).disabled=false;status('Ensemble calculation completed. Model-dependent, not experimentally validated.');
}
function execute(){try{
 status('Calculating ensemble probabilities…');const r=NexusThermoFoldEnsemble.run($('seq').value,{cutoff:Number($('cutoff').value)});show(r);
 }catch(e){status(e.message,true);}}
$('run').addEventListener('click',()=>{requestAnimationFrame(()=>setTimeout(execute,10));});
$('sample').addEventListener('click',()=>{$('seq').value='>synthetic_hairpin_demo\nGGGAAACCC';status('Synthetic example loaded.');});
$('clear').addEventListener('click',()=>{last=null;lastSvg='';$('seq').value='';$('plot').textContent='Results will appear after analysis.';$('rows').innerHTML='<tr><td colspan="4">No analysis yet</td></tr>';for(const k of ['dg','pairs','confidence'])$(k).textContent='—';for(const k of ['json','csv','svg'])$(k).disabled=true;status('Cleared.');});
$('fasta').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>250000){status('Choose a file smaller than 250 KB.',true);return;}$('seq').value=await f.text();status('FASTA loaded.');});
$('json').addEventListener('click',()=>{if(last)download('nexus_thermofold_ensemble_v08.json',JSON.stringify(last,null,2),'application/json');});
$('csv').addEventListener('click',()=>{if(last)download('nexus_thermofold_pairs_v08.csv','position_i,position_j,pair_type,probability\n'+last.probabilities.map(x=>[x.i,x.j,x.pair,x.p].join(',')).join('\n')+'\n','text/csv');});
$('svg').addEventListener('click',()=>{if(lastSvg)download('nexus_thermofold_ensemble_v08.svg',lastSvg,'image/svg+xml');});
})();
