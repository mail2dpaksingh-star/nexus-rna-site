/* NEXUS SeqFold qPCR / ddPCR assay candidate screening v0.1.
   Original browser-only research heuristics. This is NOT Primer3, genome-wide screening or a validated assay. */
(function(root,factory){
 const seq=root.NexusSeq||(typeof require==='function'?require('./core.js'):null);
 const adv=root.NexusAdvanced||(typeof require==='function'?require('./advanced-core.js'):null);
 const precision=root.NexusPrecision||(typeof require==='function'?require('./precision-core.js'):null);
 const api=factory(seq,adv,precision);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.NexusQPCR=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(seq,adv,precision){
 'use strict';
 if(!seq||!adv||!precision)throw Error('SeqFold sequence and primer metrics modules are required');
 const VERSION='1.5.0';
 function parseTemplate(raw,{maxLength=12000}={}){
  let str=String(raw||'').replace(/\r/g,'').trim(),name='User sequence';
  if(str.startsWith('>')){
   const lines=str.split('\n'); if(lines.filter(l=>l.startsWith('>')).length!==1)throw Error('Provide one DNA/cDNA FASTA record per assay.');
   name=lines[0].slice(1).trim().slice(0,100)||name;
   str=lines.slice(1).join('');
  }
  str=str.toUpperCase().replace(/[\s0-9]/g,'').replace(/U/g,'T');
  if(!str||str.length<65||str.length>maxLength||/[^ACGTN]/.test(str))throw Error('Provide 65–'+maxLength+' DNA/cDNA bases (A/C/G/T/N); one FASTA record maximum.');
  return {name,sequence:str,rnaConverted:/U/i.test(String(raw))};
 }
 function gc(str){return 100*(str.match(/[GC]/g)||[]).length/str.length;}
 function maxRun(s){let max=1,run=1;for(let i=1;i<s.length;i++){run=s[i]===s[i-1]?run+1:1;max=Math.max(max,run);}return max;}
 function matches(hay,needle){let n=0,from=0;for(;;){let i=hay.indexOf(needle,from);if(i<0)break;n++;from=i+1;}return n;}
 function tm(s,conditions){return adv.nearestTm(s,conditions);}
 function metrics(oligo,conditions){
  let value=adv.primerMetrics(oligo,conditions);
  return {...value,tm:Number(value.tm.toFixed(1)),gc:Number(value.gc.toFixed(1)),self3:precision.longest3PrimeDimer(oligo,oligo),hairpin:precision.hairpinStem(oligo)};
 }
 function preliminary(s,conditions,targetTm,mode){
  const g=gc(s),len=s.length,run=maxRun(s),threeG=(s.slice(-3).match(/[GC]/g)||[]).length;
  if(g<30||g>72||run>=6||threeG===3)return null;
  const t=tm(s,conditions);
  if(!Number.isFinite(t)||t<49||t>70)return null;
  let score=1.5*Math.abs(t-targetTm)+0.11*Math.abs(g-50)+0.20*Math.abs(len-21)+Math.max(0,run-3)*2.6;
  if(g<35||g>65)score+=4;
  if(threeG===0)score+=1;
  return {sequence:s,len,tm:Number(t.toFixed(1)),gc:Number(g.toFixed(1)),run,score:Number(score.toFixed(3))};
 }
 function generateCandidates(s,{start,end,conditions,primerTargetTm=60,ampliconMax=180}){
  const arr=[];
  for(let pos=start;pos<=end-19;pos++){
   let row=[];
   for(let len=19;len<=26 && pos+len<=end;len++){
    let segment=s.slice(pos,pos+len);if(segment.includes('N'))continue;
    let forward=preliminary(segment,conditions,primerTargetTm,'forward');
    if(forward)row.push({...forward,start:pos,end:pos+len-1,strand:'forward'});
    let reverse=preliminary(seq.reverseComplement(segment),conditions,primerTargetTm,'reverse');
    if(reverse)row.push({...reverse,start:pos,end:pos+len-1,strand:'reverse'});
   }
   row.sort((a,b)=>a.score-b.score);
   // Favor position diversity: per 12-base window keep candidates on both orientations.
   arr.push(...row.slice(0,7));
  }
  const byStrand={forward:[],reverse:[]};
  for(let strand of ['forward','reverse']){
   let selected=arr.filter(x=>x.strand===strand),buckets=new Map();
   for(let x of selected){const bucket=Math.floor((x.start-start)/12),list=buckets.get(bucket)||[];list.push(x);buckets.set(bucket,list);}
   for(let list of buckets.values()){list.sort((a,b)=>a.score-b.score);byStrand[strand].push(...list.slice(0,3));}
   byStrand[strand].sort((a,b)=>a.start-b.start||a.score-b.score);
  }
  return byStrand;
 }
 function probeFor(s,f,r,settings){
  const conditions=settings.conditions,innerStart=f.end+2,innerEnd=r.start-2;
  if(innerEnd-innerStart+1<18)return null;
  let best=null;
  for(let len=20;len<=30;len++)for(let pos=innerStart;pos+len-1<=innerEnd;pos++){
   const sense=s.slice(pos,pos+len);if(sense.includes('N'))continue;
   for(const strand of ['+','-']){
    const candidate=strand==='+'?sense:seq.reverseComplement(sense),g=gc(candidate),run=maxRun(candidate);
    if(candidate[0]==='G'||g<30||g>80||run>=5)continue;
    const t=tm(candidate,conditions),desired=Math.min(10,Math.max(3,t-(f.tm+r.tm)/2));
    let score=2*Math.abs((t-(f.tm+r.tm)/2)-6)+0.10*Math.abs(g-50)+0.18*Math.abs(len-24)+Math.max(0,run-3)*2;
    if(t-(f.tm+r.tm)/2<3||t-(f.tm+r.tm)/2>10)score+=18;
    let p={sequence:candidate,strand,start:pos,end:pos+len-1,length:len,tm:Number(t.toFixed(1)),gc:Number(g.toFixed(1)),deltaTm:Number((t-(f.tm+r.tm)/2).toFixed(1)),score:Number(score.toFixed(2)),run};
    if(!best||p.score<best.score)best=p;
   }
  }
  return best;
 }
 function design(raw,opts={}){
  const parsed=parseTemplate(raw),s=parsed.sequence,n=s.length;
  const assayMode=opts.assayMode||'qpcr',detection=opts.detection||'hydrolysis';
  if(!['qpcr','ddpcr'].includes(assayMode)||!['hydrolysis','dye'].includes(detection))throw Error('Choose qPCR/ddPCR and hydrolysis/dye detection.');
  const start=opts.start===undefined||opts.start===''?1:Number(opts.start),end=opts.end===undefined||opts.end===''?n:Number(opts.end);
  const minSize=opts.ampliconMin===undefined?65:Number(opts.ampliconMin),maxSize=opts.ampliconMax===undefined?180:Number(opts.ampliconMax);
  const focus=opts.focus===undefined||opts.focus===''?null:Number(opts.focus);
  const salt=opts.salt===undefined?50:Number(opts.salt),concentration=opts.concentration===undefined?250:Number(opts.concentration);
  const targetTm=opts.targetTm===undefined?60:Number(opts.targetTm);
  if(![start,end,minSize,maxSize].every(Number.isInteger)||start<1||end>n||end<=start||end-start+1>2500||minSize<60||maxSize>350||maxSize<minSize||end-start+1<minSize)throw Error('Design region must be 60–2,500 bases, inside template; amplicons must be 60–350 bp and fit within the region.');
  if(focus!==null&&(!Number.isInteger(focus)||focus<start||focus>end))throw Error('Focus coordinate must fall inside design region.');
  if(!Number.isFinite(salt)||salt<10||salt>200||!Number.isFinite(concentration)||concentration<20||concentration>2000||targetTm<54||targetTm>66)throw Error('Check salt 10–200 mM, oligo 20–2,000 nM and target Tm 54–66°C.');
  const conditions={salt,concentration};
  const pool=generateCandidates(s,{start:start-1,end,conditions,primerTargetTm:targetTm,ampliconMax:maxSize});
  let pairs=[];
  for(const f of pool.forward)for(const r of pool.reverse){
   const product=r.end-f.start+1;
   if(product<minSize||product>maxSize||r.start<=f.end+8||Math.abs(f.tm-r.tm)>5)continue;
   if(focus!==null&&(f.start+1>focus||r.end+1<focus))continue;
   // Both primer sequences bind on the plus template; reverse primer is supplied 5' to 3' reverse-complement.
   const score=f.score+r.score+Math.abs(f.tm-r.tm)*1.5+0.012*Math.abs(product-(minSize+maxSize)/2);
   pairs.push({forward:f,reverse:r,productSize:product,ampliconStart:f.start+1,ampliconEnd:r.end+1,score});
  }
  pairs.sort((a,b)=>a.score-b.score);
  const seen=new Set(),selected=[];
  // Examine a generous subset of pair candidates before returning a diverse ranked set.
  for(const pair of pairs){
   if(selected.length>=12)break;
   const key=Math.floor(pair.ampliconStart/8)+'|'+Math.floor(pair.ampliconEnd/8);
   if(seen.has(key))continue;
   const f=metrics(pair.forward.sequence,conditions),r=metrics(pair.reverse.sequence,conditions);
   const issues=[],cross3=precision.longest3PrimeDimer(f.sequence,r.sequence);
   if(cross3>=4)issues.push('Possible forward/reverse 3′ dimer seed (≥4 nt)');
   if(f.self3>=4||r.self3>=4)issues.push('Possible 3′ self-dimer seed');
   if(f.hairpin>=4||r.hairpin>=4)issues.push('Potential primer hairpin stem ≥4 nt');
   if(f.selfComplement>=6||r.selfComplement>=6)issues.push('Extended self-complementarity risk');
   if(Math.abs(f.tm-r.tm)>3)issues.push('Primer Tm mismatch >3°C');
   const bindF=matches(s,f.sequence)+matches(s,seq.reverseComplement(f.sequence));
   const bindR=matches(s,r.sequence)+matches(s,seq.reverseComplement(r.sequence));
   if(bindF>1||bindR>1)issues.push('Repeated exact primer binding site in submitted template');
   let probe=detection==='hydrolysis'?probeFor(s,pair.forward,pair.reverse,{conditions}):null;
   if(detection==='hydrolysis'&&!probe)continue;
   if(probe){
    const p=metrics(probe.sequence,conditions);
    if(p.hairpin>=4||p.self3>=4)issues.push('Potential probe secondary-structure motif');
    if(probe.deltaTm<3||probe.deltaTm>10)issues.push('Probe Tm outside preferred +3 to +10°C margin');
    probe={...probe,hairpin:p.hairpin,self3:p.self3};
   }
   selected.push({rank:0,forward:{...f,start:pair.forward.start+1,end:pair.forward.end+1},reverse:{...r,start:pair.reverse.start+1,end:pair.reverse.end+1},probe,productSize:pair.productSize,ampliconStart:pair.ampliconStart,ampliconEnd:pair.ampliconEnd,dimer3:cross3,score:Number((pair.score+(probe?probe.score:0)+issues.length*3).toFixed(2)),warnings:issues,requiresSpecificityConfirmation:true});
   seen.add(key);
  }
  selected.sort((a,b)=>a.score-b.score);selected.forEach((p,i)=>p.rank=i+1);
  const warnings=[
   'Predicted sequences and approximate unmodified DNA nearest-neighbor Tm are only candidates; reaction conditions, probe dyes/modifications and target sequence variants can change performance.',
   'No whole-genome/transcriptome specificity, exon junction annotation, splice-isoform discrimination or variant-coverage analysis is performed. Use NCBI Primer-BLAST and experimentally validate.',
   assayMode==='qpcr'?'For RNA RT-qPCR, check genomic DNA contamination, RT controls, assay efficiency, dynamic range and no-template controls.':'For ddPCR, independently establish droplet separation, rain, false-positive rate, controls and quantification limits.',
   detection==='hydrolysis'?'Probe reports use ordinary unmodified DNA Tm and do not account for MGB/LNA or fluorophore/quencher modifications.':'Dye-mode amplicons require melt analysis or orthogonal specificity checks as applicable.'
  ];
  return {schema:'nexus-qpcr-design-v1',softwareVersion:VERSION,template:{name:parsed.name,length:n},params:{assayMode,detection,start,end,ampliconMin:minSize,ampliconMax:maxSize,focus,salt,concentration,targetTm},candidates:selected,candidateCount: selected.length,scannedPairs:pairs.length,warnings,algorithm:'Original SeqFold candidate search based on nearest-neighbor-inspired oligo Tm and heuristic self/cross-complementarity. Not Primer3 or Primer-BLAST; no thermodynamic ΔG or predicted wet-lab performance.',sequence:s};
 }
 function csvCell(v){let t=String(v===undefined||v===null?'':v);if(/^[=+@\-\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}
 function exportCSV(result){
  if(!result||!Array.isArray(result.candidates))throw Error('Run a design first.');
  const keys=['rank','assayMode','template','ampliconStart','ampliconEnd','productSize','forwardSequence','forwardTmC','forwardGCpct','reverseSequence','reverseTmC','reverseGCpct','probeSequence','probeStrand','probeTmC','probeGCpct','probeDeltaTmC','score','warnings','verification'];
  const rows=result.candidates.map(p=>[p.rank,result.params.assayMode,result.template.name,p.ampliconStart,p.ampliconEnd,p.productSize,p.forward.sequence,p.forward.tm,p.forward.gc,p.reverse.sequence,p.reverse.tm,p.reverse.gc,p.probe?.sequence||'',p.probe?.strand||'',p.probe?.tm||'',p.probe?.gc||'',p.probe?.deltaTm||'',p.score,p.warnings.join('; '),'In silico candidate only']);
  return [keys.map(csvCell).join(','),...rows.map(r=>r.map(csvCell).join(','))].join('\r\n')+'\r\n';
 }
 return Object.freeze({parseTemplate,gc,metrics,design,exportCSV,VERSION});
});
