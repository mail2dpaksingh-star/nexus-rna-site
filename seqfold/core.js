/* NEXUS SeqFold Studio — original client-side implementation. MIT License. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexusSeq=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DNA='ACGTRYSWKMBDHVN', RNA='ACGURYSWKMBDHVN';
const COMP={A:'T',T:'A',U:'A',C:'G',G:'C',R:'Y',Y:'R',S:'S',W:'W',K:'M',M:'K',B:'V',D:'H',H:'D',V:'B',N:'N'};
const ENZYMES=[['EcoRI','GAATTC',1],['BamHI','GGATCC',1],['HindIII','AAGCTT',1],['NotI','GCGGCCGC',2],['XhoI','CTCGAG',1],['PstI','CTGCAG',5],['NheI','GCTAGC',1],['KpnI','GGTACC',5],['SmaI','CCCGGG',3],['SpeI','ACTAGT',1]];
const CODONS='TTT:F TTC:F TTA:L TTG:L TCT:S TCC:S TCA:S TCG:S TAT:Y TAC:Y TAA:* TAG:* TGT:C TGC:C TGA:* TGG:W CTT:L CTC:L CTA:L CTG:L CCT:P CCC:P CCA:P CCG:P CAT:H CAC:H CAA:Q CAG:Q CGT:R CGC:R CGA:R CGG:R ATT:I ATC:I ATA:I ATG:M ACT:T ACC:T ACA:T ACG:T AAT:N AAC:N AAA:K AAG:K AGT:S AGC:S AGA:R AGG:R GTT:V GTC:V GTA:V GTG:V GCT:A GCC:A GCA:A GCG:A GAT:D GAC:D GAA:E GAG:E GGT:G GGC:G GGA:G GGG:G'.split(' ').reduce((a,v)=>{let p=v.split(':');a[p[0]]=p[1];return a;},{});
function parseFasta(text){let records=[], current=null;for(let ln of String(text||'').replace(/\r/g,'').split('\n')){if(ln.trim().startsWith('>')){if(current)records.push(current);current={name:ln.trim().slice(1).trim()||`Sequence ${records.length+1}`,sequence:''};continue;}if(!ln.trim())continue;if(!current)current={name:'Untitled sequence',sequence:''};current.sequence+=ln.replace(/[\s0-9]/g,'').toUpperCase();}if(current)records.push(current);return records.filter(r=>r.sequence.length>0);}
function validate(seq,{maxLength=200000}={}){if(!seq)throw Error('Enter a DNA or RNA sequence first.');if(seq.length>maxLength)throw Error(`The browser analysis limit is ${maxLength.toLocaleString()} nucleotides.`);const invalid=[...new Set(seq.replace(/[ACGTURYSWKMBDHVN]/g,''))];if(invalid.length)throw Error('Unsupported sequence symbols: '+invalid.join(' ')+'. Use IUPAC nucleotide codes.');if(seq.includes('T')&&seq.includes('U'))throw Error('Sequence contains both T and U. Choose one alphabet or convert before analysis.');return true;}
function toDNA(seq){return seq.replace(/U/g,'T');}function toRNA(seq){return seq.replace(/T/g,'U');}
function reverseComplement(seq){return [...seq].reverse().map(b=>COMP[b]||'N').join('').replace(/T/g,seq.includes('U')&&!seq.includes('T')?'U':'T');}
function summarize(seq){validate(seq);const counts={A:0,C:0,G:0,T:0,U:0,ambiguous:0};for(let b of seq)if(Object.prototype.hasOwnProperty.call(counts,b)&&b!=='ambiguous')counts[b]++;else counts.ambiguous++;const canonical=seq.length-counts.ambiguous;let gc=canonical?100*(counts.G+counts.C)/canonical:0;const kind=seq.includes('U')?'RNA':seq.includes('T')?'DNA':'DNA/RNA';return {length:seq.length,counts,kind,gc,at:canonical?100*(counts.A+counts.T+counts.U)/canonical:0,ambiguous:counts.ambiguous,approxDsDNAkDa:toDNA(seq).length*0.66};}
function translate(seq, frame=0){let s=toDNA(seq),out='';for(let i=frame;i+2<s.length;i+=3)out+=(CODONS[s.slice(i,i+3)]||'X');return out;}
function sixFrames(seq){validate(seq);const f=toDNA(seq),r=reverseComplement(f);return [0,1,2].map(i=>({frame:`+${i+1}`,aa:translate(f,i)})).concat([0,1,2].map(i=>({frame:`-${i+1}`,aa:translate(r,i)})));}
function findOrfs(seq,minAmino=5){validate(seq);const n=seq.length, f=toDNA(seq),r=reverseComplement(f),stops=new Set(['TAA','TAG','TGA']),result=[];for(let strand of ['+','-']){let s=strand==='+'?f:r;for(let frame=0;frame<3;frame++){let starts=[];for(let i=frame;i+2<n;i+=3){let trip=s.slice(i,i+3);if(trip==='ATG')starts.push(i);if(stops.has(trip)){for(let st of starts){let aaLen=(i-st)/3;if(aaLen>=minAmino){let start=strand==='+'?st+1:n-(i+3)+1,end=strand==='+'?i+3:n-st;result.push({strand,frame:frame+1,start,end,aaLength:aaLen,protein:translate(s.slice(st,i),0),stop:trip});}}starts=[];}}}}return result.sort((a,b)=>b.aaLength-a.aaLength||a.start-b.start);}
function restrictions(seq,names=ENZYMES.map(x=>x[0])){validate(seq);let s=toDNA(seq),sites=[],enzUsed=[];for(const [name,motif,offset] of ENZYMES){if(!names.includes(name))continue;let hits=[];for(let i=0;i<=s.length-motif.length;i++)if(s.slice(i,i+motif.length)===motif)hits.push({enzyme:name,recognition:motif,start:i+1,cut:i+offset});sites.push(...hits);enzUsed.push({name,motif,offset,count:hits.length});}sites.sort((a,b)=>a.cut-b.cut||a.enzyme.localeCompare(b.enzyme));const cuts=[0,...new Set(sites.map(p=>p.cut).filter(p=>p>0&&p<s.length)),s.length].sort((a,b)=>a-b);return {enzymes:enzUsed,sites,fragments:cuts.slice(1).map((x,i)=>x-cuts[i]).sort((a,b)=>b-a)};}
function findMotif(seq,motif){validate(seq);let pat=String(motif||'').toUpperCase().replace(/\s/g,'').replace(/U/g,'T');if(!pat||!new RegExp(`^[${DNA}]+$`).test(pat))throw Error('Enter a nucleotide motif using IUPAC notation.');const map={A:'A',T:'T',C:'C',G:'G',R:'[AG]',Y:'[CT]',S:'[GC]',W:'[AT]',K:'[GT]',M:'[AC]',B:'[CGT]',D:'[AGT]',H:'[ACT]',V:'[ACG]',N:'[ACGT]'};const rx=new RegExp('^'+[...pat].map(b=>map[b]).join('')+'$');const s=toDNA(seq),hits=[];for(let i=0;i<=s.length-pat.length;i++)if(rx.test(s.slice(i,i+pat.length)))hits.push(i+1);return hits;}
function kmerCounts(seq,k=3){validate(seq);k=Number(k);if(!Number.isInteger(k)||k<1||k>6)throw Error('k must be 1 through 6.');const s=toDNA(seq),counts={};for(let i=0;i<=s.length-k;i++){let mer=s.slice(i,i+k);if(/^[ACGT]+$/.test(mer))counts[mer]=(counts[mer]||0)+1;}return Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([kmer,count])=>({kmer,count}));}
function pairable(a,b,allowGU=true){return (a==='A'&&b==='U')||(a==='U'&&b==='A')||(a==='G'&&b==='C')||(a==='C'&&b==='G')||(allowGU&&((a==='G'&&b==='U')||(a==='U'&&b==='G')));}
function foldNussinov(seq,{minLoop=3,allowGU=true,maxLength=3000}={}){
 validate(seq,{maxLength:Math.min(Number(maxLength)||3000,3000)});
 const s=toRNA(seq),n=s.length;
 if(/[^ACGU]/.test(s))throw Error('Folding requires unambiguous A/C/G/U nucleotides.');
 if(!Number.isInteger(minLoop)||minLoop<0||minLoop>12)throw Error('Minimum hairpin loop must be 0–12 nt.');
 // Beyond 350 nt, fold independent bounded segments. This is NOT a global full-length fold.
 // The short original Nussinov DP remains unchanged for sequences at or below 350 nt.
 if(n>350){
   const windowSize=250,parts=[],dots=[],pairs=[],windows=[];
   for(let offset=0;offset<n;offset+=windowSize){
     const fragment=foldNussinov(s.slice(offset,offset+windowSize),{minLoop,allowGU,maxLength:350});
     dots.push(fragment.dotBracket);
     for(const [a,b] of fragment.pairs)pairs.push([a+offset,b+offset]);
     windows.push({start:offset+1,end:offset+fragment.sequence.length,pairCount:fragment.pairCount});
   }
   return {sequence:s,dotBracket:dots.join(''),pairs,pairCount:pairs.length,
     pairedFraction:100*(2*pairs.length/n),minLoop,allowGU,
     mode:'independent-windows',windowSize,windows,
     method:'WINDOWED Nussinov heuristic: independent 250-nt segments only. No cross-window base pairs, global minimum, pseudoknots, or thermodynamic ΔG are predicted.',energyKcal:null};
 }
 const score=Array.from({length:n},()=>new Int16Array(n)),dir=Array.from({length:n},()=>new Int16Array(n));
 const get=(i,j)=>(i>=j?0:score[i][j]);
 for(let span=1;span<n;span++)for(let i=0;i+span<n;i++){
  let j=i+span,best=get(i+1,j),code=0;
  if(get(i,j-1)>best){best=get(i,j-1);code=-1;}
  if(j-i>minLoop&&pairable(s[i],s[j],allowGU)){
    let q=get(i+1,j-1)+1;if(q>best){best=q;code=-2;}
  }
  for(let k=i+1;k<j;k++){
    let q=get(i,k)+get(k+1,j);if(q>best){best=q;code=k;}
  }
  score[i][j]=best;dir[i][j]=code;
 }
 const struct=Array(n).fill('.'),pairs=[];
 function back(i,j){if(i>=j)return;const d=dir[i][j];if(d===-2){struct[i]='(';struct[j]=')';pairs.push([i+1,j+1]);back(i+1,j-1);}else if(d===-1)back(i,j-1);else if(d===0)back(i+1,j);else{back(i,d);back(d+1,j);}}
 if(n>1)back(0,n-1);
 pairs.sort((a,b)=>a[0]-b[0]);
 return {sequence:s,dotBracket:struct.join(''),pairs,pairCount:pairs.length,pairedFraction:100*(2*pairs.length/n),minLoop,allowGU,mode:'single-window',method:'Nussinov maximum-base-pair (no nearest-neighbor thermodynamics)',energyKcal:null};
}
function alignPair(seqA,seqB,{mode='global',match=2,mismatch=-1,gap=-2,maxLength=700}={}){validate(seqA,{maxLength});validate(seqB,{maxLength});if(!['global','local'].includes(mode))throw Error('Unknown alignment mode.');let a=toDNA(seqA),b=toDNA(seqB),rows=a.length+1,cols=b.length+1,scores=new Int32Array(rows*cols),trace=new Uint8Array(rows*cols);const at=(i,j)=>i*cols+j;for(let i=1;i<rows;i++){if(mode==='global'){scores[at(i,0)]=i*gap;trace[at(i,0)]=2;}}for(let j=1;j<cols;j++){if(mode==='global'){scores[at(0,j)]=j*gap;trace[at(0,j)]=3;}}let maxScore=mode==='global'?null:0,mi=0,mj=0;for(let i=1;i<rows;i++)for(let j=1;j<cols;j++){let d=scores[at(i-1,j-1)]+(a[i-1]===b[j-1]?match:mismatch),u=scores[at(i-1,j)]+gap,l=scores[at(i,j-1)]+gap,best=d,direction=1;if(u>best){best=u;direction=2;}if(l>best){best=l;direction=3;}if(mode==='local'&&best<=0){best=0;direction=0;}scores[at(i,j)]=best;trace[at(i,j)]=direction;if(mode==='local'&&best>maxScore){maxScore=best;mi=i;mj=j;}}let i=mode==='global'?a.length:mi,j=mode==='global'?b.length:mj,finishI=i,finishJ=j,outA=[],outB=[],matches=0;while(i>0||j>0){let d=trace[at(i,j)];if(!d||mode==='local'&&scores[at(i,j)]===0)break;if(d===1){outA.push(a[--i]);outB.push(b[--j]);if(outA[outA.length-1]===outB[outB.length-1])matches++;}else if(d===2){outA.push(a[--i]);outB.push('-');}else{outA.push('-');outB.push(b[--j]);}}outA.reverse();outB.reverse();const al=outA.join(''),bl=outB.join(''),mask=[...al].map((ch,k)=>ch===bl[k]?'|':ch==='-'||bl[k]==='-'?' ':'·').join('');return {mode,score:mode==='global'?scores[at(a.length,b.length)]:maxScore,alignedA:al,alignedB:bl,comparison:mask,matches,columns:al.length,identity:al.length?100*matches/al.length:0,startA:i+1,endA:finishI,startB:j+1,endB:finishJ};}
function primerQc(seq){validate(seq);const s=toDNA(seq),n=s.length;const gc=(s.match(/[GC]/g)||[]).length;const a=(s.match(/A/g)||[]).length,t=(s.match(/T/g)||[]).length;const tm=2*(a+t)+4*gc,homopolymer=/(A{5,}|T{5,}|G{5,}|C{5,})/.test(s),gcClamped=/[GC]$/.test(s);return {sequence:s,length:n,gc:100*gc/n,roughTm:tm,homopolymer,gcClamped,note:'Wallace-rule rough estimate; not salt-, concentration-, or secondary-structure-corrected.'};}
return Object.freeze({parseFasta,validate,toDNA,toRNA,reverseComplement,summarize,translate,sixFrames,findOrfs,restrictions,findMotif,kmerCounts,foldNussinov,alignPair,primerQc,ENZYMES});
});
