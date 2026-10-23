/* NEXUS SeqFold v0.6 precision research extensions. MIT. Browser-only. */
(function(root,factory){const api=factory(root.NexusSeq||(typeof require==='function'?require('./core.js'):null),root.NexusAdvanced||(typeof require==='function'?require('./advanced-core.js'):null),root.NexusAssembly||(typeof require==='function'?require('./assembly-core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.NexusPrecision=api;})(typeof globalThis!=='undefined'?globalThis:this,function(seq,adv,asm){
'use strict';if(!seq||!adv||!asm)throw Error('NEXUS core modules missing');
function dna(s,max=1200){s=String(s||'').replace(/^>[^\n]*\n/g,'').toUpperCase().replace(/\s/g,'');if(!s||s.length>max||!/^[ACGTN]+$/.test(s))throw Error('DNA must contain 1–'+max+' A/C/G/T/N bases');return s;}
function rna(s){s=String(s||'').toUpperCase().replace(/^>[^\n]*\n/g,'').replace(/\s/g,'').replace(/T/g,'U');if(!s||s.length>3000||!/^[ACGU]+$/.test(s))throw Error('Supply 1–3,000 unambiguous RNA bases (A/C/G/U).');return s;}
const PAIR={'AU':1,'UA':1,'GC':1,'CG':1,'GU':1,'UG':1};
function validPair(a,b){return !!PAIR[a+b];}
function stackEnergy(a,b,c,d){ // adjacent antiparallel stacked pair estimate (not calibrated Turner parameters)
 const ab=a+b,cd=c+d,weak=(ab==='GU'||ab==='UG'||cd==='GU'||cd==='UG');
 return weak?-0.65:((ab==='GC'||ab==='CG')&&(cd==='GC'||cd==='CG'))?-2.7:-1.6;
}
function foldEnergy(raw,{minLoop=3}={}){
 let s=rna(raw),n=s.length,loop=Number(minLoop);if(!Number.isInteger(loop)||loop<3||loop>10)throw Error('Hairpin minimum must be 3–10 nt');
 if(n>220){
  const windowSize=200,dots=[],pairs=[],windows=[];let relativeEnergy=0;
  for(let offset=0;offset<n;offset+=windowSize){
   const f=foldEnergy(s.slice(offset,offset+windowSize),{minLoop:loop});
   dots.push(f.dotBracket);relativeEnergy+=f.relativeEnergy;
   for(const [a,b] of f.pairs)pairs.push([a+offset,b+offset]);
   windows.push({start:offset+1,end:offset+f.sequence.length,pairCount:f.pairCount});
  }
  return {sequence:s,dotBracket:dots.join(''),pairCount:pairs.length,pairs,
    relativeEnergy:Number(relativeEnergy.toFixed(2)),maxLength:3000,windowSize,windows,mode:'independent-windows',
    algorithm:'WINDOWED relative-energy heuristic: independent 200-nt segments; no base pairing across segment boundaries. Sum of uncalibrated segment scores (NOT a full-length ΔG or comparable thermodynamic stability). The model omits multiloops, ensemble probabilities and experimentally calibrated folding parameters.'};
 }

 let W=Array.from({length:n},()=>new Float64Array(n)),V=Array.from({length:n},()=>new Float64Array(n)),tw=Array.from({length:n},()=>Array(n).fill(null)),tv=Array.from({length:n},()=>Array(n).fill(null));
 for(let i=0;i<n;i++)V[i].fill(Infinity);
 const w=(i,j)=>i>=j?0:W[i][j],v=(i,j)=>i>=j?Infinity:V[i][j];
 for(let span=1;span<n;span++)for(let i=0;i+span<n;i++){
  let j=i+span;
  if(span>loop&&validPair(s[i],s[j])){
   const ln=j-i-1,terminal=/^(AU|UA|GU|UG)$/.test(s[i]+s[j])?0.5:0;
   let best=5.3+1.15*Math.log(Math.max(1,ln/3))+terminal,trace=['hairpin'];
   if(i+1<j-1&&validPair(s[i+1],s[j-1])){let score=v(i+1,j-1)+stackEnergy(s[i],s[j],s[i+1],s[j-1]);if(score<best){best=score;trace=['stack',i+1,j-1];}}
   for(const [ii,jj,penalty] of [[i+2,j-1,3.2],[i+1,j-2,3.2],[i+2,j-2,4.5]])if(ii<jj&&validPair(s[ii],s[jj])){let score=v(ii,jj)+penalty+terminal;if(score<best){best=score;trace=['internal',ii,jj];}}
   V[i][j]=best;tv[i][j]=trace;
  }
  let best=w(i+1,j),trace=['left'];if(w(i,j-1)<best){best=w(i,j-1);trace=['right'];}
  if(V[i][j]<best){best=V[i][j];trace=['paired'];}
  for(let k=i+1;k<j;k++){let score=w(i,k)+w(k+1,j);if(score<best){best=score;trace=['split',k];}}
  W[i][j]=best;tw[i][j]=trace;
 }
 let dot=Array(n).fill('.'),pairs=[];
 function visitV(i,j){if(!Number.isFinite(v(i,j)))return;dot[i]='(';dot[j]=')';pairs.push([i+1,j+1]);let tr=tv[i][j];if(tr&&tr[0]!=='hairpin')visitV(tr[1],tr[2]);}
 function visitW(i,j){if(i>=j)return;let tr=tw[i][j];if(!tr)return;if(tr[0]==='left')visitW(i+1,j);else if(tr[0]==='right')visitW(i,j-1);else if(tr[0]==='paired')visitV(i,j);else{visitW(i,tr[1]);visitW(tr[1]+1,j);}}
 if(n)visitW(0,n-1);pairs.sort((a,b)=>a[0]-b[0]);return {sequence:s,dotBracket:dot.join(''),pairCount:pairs.length,pairs,relativeEnergy:Number(w(0,n-1).toFixed(2)),algorithm:'Simplified nearest-neighbor-inspired nested hairpin/stacking dynamic program; omits multiloops, dangles, salt and temperature parameters, sequence-specific loop tables and partition functions. Energy is an UNCALIBRATED relative score, NOT kcal/mol or ViennaRNA MFE.',maxLength:3000,mode:'single-window'};
}
function longest3PrimeDimer(a,b){ // longest uninterrupted complementary seed involving 3'-end of either oligo
 a=adv.cleanDNA(a,{max:100});b=adv.cleanDNA(b,{max:100});let rc=seq.reverseComplement(b),max=0;
 for(let shift=-rc.length;shift<=a.length;shift++){
  let run=0;for(let i=Math.max(0,shift);i<Math.min(a.length,shift+rc.length);i++){
    let j=i-shift;if(a[i]===rc[j])run++;else run=0;
    if(i===a.length-1||j===0)max=Math.max(max,run);
  }
 }return max;
}
function hairpinStem(dnaSeq){let a=adv.cleanDNA(dnaSeq,{max:100}),n=a.length,top=0;for(let i=0;i<n;i++)for(let j=i+4;j<n;j++){let k=0;while(i+k<j-k-3&&a[i+k]===seq.reverseComplement(a[j-k])&&k<10)k++;top=Math.max(top,k);}return top;}
function assessPrimers(template,opts={}){
 const base=adv.designPrimers(template,opts);let results=base.pairs.map((p,i)=>{
  let f3=longest3PrimeDimer(p.forward.sequence,p.reverse.sequence),s1=longest3PrimeDimer(p.forward.sequence,p.forward.sequence),s2=longest3PrimeDimer(p.reverse.sequence,p.reverse.sequence),h1=hairpinStem(p.forward.sequence),h2=hairpinStem(p.reverse.sequence);
  let warnings=[...p.warnings];if(f3>=4)warnings.push('3-prime inter-primer complementarity ≥4 nt');if(s1>=4||s2>=4)warnings.push('3-prime self-dimer complementarity ≥4 nt');if(h1>=4||h2>=4)warnings.push('Possible intramolecular stem ≥4 nt');
  return {...p,rank:i+1,threePrimeCross:f3,threePrimeSelfF:s1,threePrimeSelfR:s2,hairpinStemF:h1,hairpinStemR:h2,warnings:[...new Set(warnings)],revisedScore:Number((p.score+Math.max(0,f3-3)*4+Math.max(0,s1-3)*3+Math.max(0,s2-3)*3+Math.max(0,h1-3)*1.5+Math.max(0,h2-3)*1.5).toFixed(2))};
 });results.sort((a,b)=>a.revisedScore-b.revisedScore);results.forEach((p,i)=>p.rank=i+1);
 return {...base,pairs:results,algorithm:'Existing SantaLucia-inspired primer Tm screening + 3-prime dimer and heuristic hairpin checks; no Primer3 engine, thermodynamic oligo structure, genome-wide specificity or wet-lab validation.'};
}
function multiReadConsensus(reference,records,{minAligned=12,minIdentity=97,minQ=15,minCoverage=2}={}){
 let ref=dna(reference),rs=records||[];if(rs.length<2||rs.length>12)throw Error('Provide 2–12 reads.');let pile=Array.from({length:ref.length},()=>[]),used=[],rejected=[],indels=[];
 for(let x=0;x<rs.length;x++){
  let raw=rs[x],r=asm?{...raw,sequence:dna(raw.sequence)}:raw,q=Array.isArray(r.qualities)&&r.qualities.length===r.sequence.length?r.qualities:Array(r.sequence.length).fill(null);
  if(q.some(z=>z!==null&&(!Number.isFinite(z)||z<0||z>93)))throw Error('Invalid PHRED scores in read '+(x+1));
  let reverse=r.orientation==='reverse',name=String(r.name||'read_'+(x+1)),s=reverse?seq.reverseComplement(r.sequence):r.sequence,qual=reverse?[...q].reverse():q;
  let al=asm.alignAffine(ref,s,{mode:'overlap'});if(al.alignedPairs<minAligned||al.identity<minIdentity){rejected.push({name,alignedPairs:al.alignedPairs,identity:al.identity,reason:'Insufficient overlap/identity'});continue;}
  let ri=al.startA,si=al.startB,numIndels=0;
  for(let k=0;k<al.alignedA.length;k++){
   const a=al.alignedA[k],b=al.alignedB[k];if(a==='-'||b==='-'){numIndels++;indels.push({name,referenceIndex:ri+1,reference:a,read:b});}
   if(a!=='-')ri++;
   if(b!=='-'){
    let qv=qual[si]===null?null:qual[si];if(a!=='-'&&b!=='N'&&(qv===null||qv>=minQ)){pile[ri-1].push({base:b,quality:qv,name});}
    si++;
   }
  }
  used.push({name,orientation:reverse?'reverse':'forward',alignedPairs:al.alignedPairs,identity:Number(al.identity.toFixed(1)),indelColumns:numIndels,qualityAvailable:q.some(x=>x!==null)});
 }
 if(!used.length)throw Error('No reads satisfy the overlap criteria. Check orientation and reference region.');
 let consensus='',ambiguous=[],variants=[],depth=[];
 for(let i=0;i<ref.length;i++){
  let obs=pile[i],counts={A:0,C:0,G:0,T:0},weight={A:0,C:0,G:0,T:0};for(let x of obs){counts[x.base]++;weight[x.base]+=x.quality===null?1:Math.max(1,x.quality/20);}
  let sorted='ACGT'.split('').sort((a,b)=>counts[b]-counts[a]||weight[b]-weight[a]||a.localeCompare(b));let best=sorted[0],runner=sorted[1],call='N';
  if(obs.length>=minCoverage&&counts[best]>=2&&(counts[best]>counts[runner])&&weight[best]>weight[runner]*1.5)call=best;
  if(call==='N')ambiguous.push({position:i+1,reference:ref[i],depth:obs.length,counts});else if(call!==ref[i])variants.push({position:i+1,reference:ref[i],consensus:call,depth:obs.length,counts});
  consensus+=call;depth.push(obs.length);
 }
 return {reference:ref,consensus,coverage:depth,accepted:used,rejected,possibleIndels:indels.slice(0,300),variants,ambiguous:ambiguous.slice(0,500),ambiguousCount:consensus.split('').filter(x=>x==='N').length,maxDepth:Math.max(...depth),coveredBases:depth.filter(x=>x>=minCoverage).length,warnings:['Reference-guided base substitution screening only. Insertions/deletions are logged, not assembled into consensus. No de-novo contigs, circular assembly, basecalling, chromatogram peak review or validated variant calling.','Positions with insufficient independent agreement or depth are N; reference bases are never imputed.']};
}
const catalogue=[
 {name:'pUC19',accession:'M77789.2',length:2686,source:'NCBI GenBank',url:'https://www.ncbi.nlm.nih.gov/nuccore/M77789.2',bundled:true},
 {name:'pBR322',accession:'J01749.1',length:4361,source:'NCBI GenBank',url:'https://www.ncbi.nlm.nih.gov/nuccore/J01749.1',bundled:false},
 {name:'pUC18',accession:'L08752.1',length:null,source:'NCBI GenBank',url:'https://www.ncbi.nlm.nih.gov/nuccore/L08752.1',bundled:false},
 {name:'pBluescript SK(+)',accession:'X52325.1',length:null,source:'NCBI GenBank',url:'https://www.ncbi.nlm.nih.gov/nuccore/X52325.1',bundled:false},
];
return Object.freeze({foldEnergy,assessPrimers,longest3PrimeDimer,hairpinStem,multiReadConsensus,catalogue});
});
