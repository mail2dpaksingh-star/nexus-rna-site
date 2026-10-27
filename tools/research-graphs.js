/* NEXUS research chart exports v1.0 — client-only SVG, PNG and CSV.
 * Presentation of supplied/descriptively calculated values only.
 * No statistical inference, GMP release, or cross-unit pooling. */
(function(root, factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  root.NexusResearchGraphs=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const colors=['#157c78','#6275bd','#ba6e43','#875da4','#c05c75','#59856d','#aa8346','#5189a2'];
const escapeXML=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const number=n=>n===null||n===undefined||n===''?null:(Number.isFinite(Number(n))?Number(n):null);
const fmt=n=>n==null||!Number.isFinite(n)?'—':Number(n).toLocaleString('en-US',{maximumSignificantDigits:5});
const text=(x,y,s,attrs='')=>`<text x="${x}" y="${y}" ${attrs}>${escapeXML(s)}</text>`;
const line=(x1,y1,x2,y2,stroke='#c9d8d2',width=1,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
const rect=(x,y,w,h,fill,rx=0)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${fill}" rx="${rx}"/>`;
function domain(values){const a=values.filter(Number.isFinite);let lo=Math.min(0,...a),hi=Math.max(0,...a);if(lo===hi){const d=Math.abs(lo)||1;lo=lo<0?lo-d*.25:0;hi=hi>0?hi+d*.25:d*.25;}else{const p=(hi-lo)*.085;if(lo<0)lo-=p;if(hi>0)hi+=p;}return [lo,hi];}
function svg(body,width,height,title,description){return `<svg xmlns="${NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXML(title)}"><title>${escapeXML(title)}</title><desc>${escapeXML(description)}</desc>${rect(0,0,width,height,'#ffffff',12)}${body}</svg>`;}
function axes(y0,y1,low,high,x1,x2,steps=4){let z='';for(let i=0;i<=steps;i++){let v=low+(high-low)*i/steps,y=y1-(y1-y0)*i/steps;z+=line(x1,y,x2,y,'#e8eee9',1)+text(x1-11,y+4,fmt(v),'text-anchor="end" font-size="11" fill="#45635d"');}return z;}
function clamp(v,lo,hi){return Math.min(hi,Math.max(lo,v));}
function xAxes(lo,hi,x1,x2,top,bottom){let out='';for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,x=x1+(x2-x1)*i/4;out+=line(x,top,x,bottom,'#e8eee9',1)+text(x,bottom+19,fmt(v),'text-anchor="middle" font-size="10" fill="#45635d"');}return out;}
function qcCurrent(r){if(!r||!Number.isFinite(Number(r.metric)))throw Error('Calculate a numeric QC result first.');const W=840,H=300,left=110,right=795,top=108,bottom=234;
 const metric=Number(r.metric),min=number(r.minimum),max=number(r.maximum),d=domain([metric,...(min===null?[]:[min]),...(max===null?[]:[max])]);const x=v=>left+(v-d[0])/(d[1]-d[0])*(right-left);
 let body=text(30,40,'QC primary result','font-size="20" font-weight="700" fill="#193a3a"')+text(30,63,r.name+' · '+r.unit,'font-size="12" fill="#54736e"')+xAxes(d[0],d[1],left,right,top,bottom);
 const zy=169;body+=line(x(0),105,x(0),234,'#93ada4',1.3);
 body+=rect(Math.min(x(0),x(metric)),zy-19,Math.abs(x(metric)-x(0)),38,'#167e71',5);
 body+=`<circle cx="${x(metric)}" cy="${zy}" r="6" fill="#095b55"/>`+text(x(metric),zy-32,fmt(metric),'text-anchor="middle" font-size="14" font-weight="700" fill="#12544e"');
 for(const [value,label,color] of [[min,'Minimum','#b97331'],[max,'Maximum','#995b95']]){if(value!==null){body+=line(x(value),top,x(value),bottom,color,2,'5 4')+text(clamp(x(value),left+40,right-40),top-10,label+': '+fmt(value),`text-anchor="middle" font-size="11" fill="${color}"`);}}
 body+=text(left,270,'User-defined criteria only; no GMP/clinical release decision.','font-size="11" fill="#647e79"');
 return {svg:svg(body,W,H,'NEXUS QC result for '+r.name,'Primary result and user-defined minimum/maximum'),csv:[['assay','sample_id','batch_id','method_id','unit','result','minimum','maximum','criterion_status'],[r.name,r.sampleId,r.batchId,r.methodId,r.unit,metric,min??'',max??'',r.status]],message:'Graph shows one assay result and user-supplied limits. It is not a QC release decision.'};}
function qcTrend(rows){if(!rows||!rows.length)throw Error('Calculate at least one QC result to create a trend.');const W=840,H=355,left=100,right=785,top=86,bottom=264,d=domain(rows.map(r=>Number(r.metric)));
 const x=i=>left+(rows.length===1?.5:i/(rows.length-1))*(right-left),y=v=>bottom-(v-d[0])/(d[1]-d[0])*(bottom-top);
 let body=text(30,40,'QC session trend','font-size="20" font-weight="700" fill="#193a3a"')+text(30,61,rows[0].name+' · '+rows[0].unit,'font-size="12" fill="#54736e"')+axes(top,bottom,d[0],d[1],left,right,4);
 if(rows.length>1)body+=`<polyline fill="none" stroke="#147f74" stroke-width="2.5" points="${rows.map((r,i)=>x(i)+','+y(Number(r.metric))).join(' ')}"/>`;
 rows.forEach((r,i)=>{body+=`<circle cx="${x(i)}" cy="${y(Number(r.metric))}" r="5.5" fill="#147f74"/>`;if(rows.length<=14||i%Math.ceil(rows.length/14)===0)body+=text(x(i),bottom+20,String(i+1),'text-anchor="middle" font-size="10" fill="#405c57"');});
 body+=text((left+right)/2,bottom+44,'Session calculation order','font-size="11" text-anchor="middle" fill="#54736e"');
 body+=text(left,335,'Single assay/unit only; values are local to this browser session.','font-size="11" fill="#647e79"');
 return {svg:svg(body,W,H,'NEXUS QC session trend','Primary result over calculation order; no cross-assay pooling'),csv:[['order','assay','sample_id','batch_id','method_id','unit','metric','minimum','maximum','status'],...rows.map((r,i)=>[i+1,r.name,r.sampleId,r.batchId,r.methodId,r.unit,r.metric,r.minimum??'',r.maximum??'',r.status])],message:'Session trend contains recorded Calculate & review results for the selected assay only.'};}
function immuneGroups(result,mode='mean'){
 if(!result||!Array.isArray(result.stats))throw Error('Summarize assay data first.');
 if(!['mean','fold','difference'].includes(mode))throw Error('Unsupported chart mode.');
 const sets=new Map();for(const g of result.stats){const key=JSON.stringify([g.assay,g.unit]);if(!sets.has(key))sets.set(key,[]);sets.get(key).push(g);}
 const W=900,groupGap=24,panelTop=90;
 const panels=[...sets.entries()].map(([key,groups])=>({key,groups}));const totalRows=panels.reduce((s,p)=>s+p.groups.length,0);
 if(totalRows>90)throw Error('Up to 90 group rows can be graphed at once; narrow the source dataset for export.');
 const height=panelTop+panels.reduce((s,p)=>s+80+p.groups.length*41+groupGap,0)+25;let body=text(26,38,mode==='mean'?'Immune assay group means ± SD':mode==='fold'?'Fold relative to control':'Difference from control','font-size="22" font-weight="700" fill="#183739"')+text(26,62,`Control: ${result.control} · ${sets.size} assay/unit panel(s)`,'font-size="12" fill="#53716e"');
 const left=245,right=840,barLeft=left+10,barRight=right-16;let ytop=panelTop;const csv=[['assay','unit','group','independent_n','mean','sd','fold_vs_control','difference_vs_control','plotted_value','plot_mode']];let drawn=0;
 for(const panel of panels){const [assay,unit]=JSON.parse(panel.key),groups=panel.groups;const units=mode==='mean'?unit:mode==='fold'?'× vs control':unit+' Δ vs control';
 body+=rect(18,ytop-25,W-36,55+groups.length*41+11,'#f4f9f6',8);
 body+=text(32,ytop,assay+' · '+units,'font-size="15" font-weight="700" fill="#1f5048"');
 let vectors=groups.map(g=>({g,value:mode==='mean'?number(g.mean):mode==='fold'?number(g.fold):number(g.difference)}));
 let bounds=[0];vectors.forEach(({g,value})=>{if(value!==null){bounds.push(value);if(mode==='mean'&&g.sd!==null){bounds.push(value-Math.abs(g.sd),value+Math.abs(g.sd));}}});
 let [lo,hi]=domain(bounds);const scale=v=>barLeft+(v-lo)/(hi-lo)*(barRight-barLeft),zero=scale(0);let rowY=ytop+39;
 body+=line(zero,ytop+19,zero,ytop+26+groups.length*41,'#a2bbb1',1.3);
 vectors.forEach(({g,value},i)=>{const yy=rowY+i*41;body+=text(left-12,yy+5,g.group.length>28?g.group.slice(0,27)+'…':g.group,'text-anchor="end" font-size="12" fill="#25453f"');
  if(value===null)body+=text(barLeft+12,yy+4,'Not defined for this control / assay','font-size="11" fill="#8a6a55"');
  else {let xp=scale(value),color=colors[i%colors.length];body+=rect(Math.min(zero,xp),yy-11,Math.abs(xp-zero),22,color,3)+`<circle cx="${xp}" cy="${yy}" r="3" fill="${color}"/>`;
    if(mode==='mean'&&g.sd!=null){let p1=scale(value-Math.abs(g.sd)),p2=scale(value+Math.abs(g.sd));body+=line(p1,yy,p2,yy,'#1f3e3c',2)+line(p1,yy-6,p1,yy+6,'#1f3e3c',1.6)+line(p2,yy-6,p2,yy+6,'#1f3e3c',1.6);}
    body+=text(Math.min(W-18,Math.max(barLeft+12,xp+12)),yy-14,fmt(value)+(mode==='mean'?'  n='+g.n:''),'font-size="11" fill="#173a36"');}
  csv.push([g.assay,g.unit,g.group,g.n,g.mean,g.sd??'',g.fold??'',g.difference??'',value??'',mode]);drawn++;});
 ytop+=80+groups.length*41+groupGap;
 }
 body+=text(28,height-19,mode==='mean'?'Whiskers = ± 1 sample SD (n ≥ 2); means use independent samples.':'Descriptive contrasts only; absent controls or qPCR Ct may yield undefined ratios.','font-size="11" fill="#526f6a"');
 return {svg:svg(body,W,height,'NEXUS Immune Assay '+mode,'Assay and unit stratified descriptive group comparisons'),csv,message:`${drawn} plotted row(s), grouped by assay and unit. Descriptive only; no p-values or therapeutic efficacy claims.`};}
function rowsCSV(rows){return rows.map(row=>row.map(x=>{const t=x==null?'':String(x);return /[,"\r\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;}).join(',')).join('\r\n')+'\r\n';}
function safeName(str){return String(str||'result').replace(/[^a-z0-9_-]/gi,'_').slice(0,85);}
function download(data,filename,mime){if(typeof document==='undefined')throw Error('Download needs a browser.');const b=data instanceof Blob?data:new Blob([data],{type:mime});const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function exportSVG(plot,basename){if(!plot||!plot.svg)throw Error('Graph not ready.');download('<?xml version="1.0" encoding="UTF-8"?>\n'+plot.svg,safeName(basename)+'.svg','image/svg+xml;charset=utf-8');}
function exportCSV(plot,basename){if(!plot||!plot.csv)throw Error('Graph not ready.');download(rowsCSV(plot.csv),safeName(basename)+'.csv','text/csv;charset=utf-8');}
async function exportPNG(plot,basename){if(!plot||!plot.svg)throw Error('Graph not ready.');if(typeof Image==='undefined')throw Error('PNG export requires a browser.');let img=new Image(),blob=new Blob([plot.svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
 try {await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Unable to render SVG as PNG. Try SVG export.'));img.src=url;});const canvas=document.createElement('canvas');const w=Number((plot.svg.match(/\bwidth="(\d+)"/)||[])[1]),h=Number((plot.svg.match(/\bheight="(\d+)"/)||[])[1]);if(!(w>0&&h>0&&w*h<=50000000))throw Error('Invalid chart size.');canvas.width=w*2;canvas.height=h*2;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);const out=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!out)throw Error('PNG export unavailable. Try SVG.');download(out,safeName(basename)+'.png','image/png');}finally{URL.revokeObjectURL(url);}}
return {qcCurrent,qcTrend,immuneGroups,rowsCSV,exportSVG,exportCSV,exportPNG};
});
