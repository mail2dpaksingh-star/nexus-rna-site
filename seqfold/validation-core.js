/* NEXUS SeqFold v0.7 — original MIT licensed research-screening algorithms.
   Scope: user-provided FASTA specificity checks, reference-free overlap read merging,
   dot-bracket metrics against independently generated RNAfold output. */
(function(root,factory){const api=factory(root.NexusSeq||(typeof require==='function'?require('./core.js'):null),root.NexusAssembly||(typeof require==='function'?require('./assembly-core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.NexusValidation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(seq,asm){
'use strict';if(!seq||!asm)throw Error('Required SeqFold modules missing');
const clean=s=>String(s||'').toUpperCase().replace(/\s/g,'');
function rev(s){return seq.reverseComplement(s);}
function primer(s){s=clean(s);if(s.length<12||s.length>40||!/^[ACGT]+$/.test(s))throw Error('Primer must contain 12–40 unambiguous A/C/G/T bases');return s;}
function parseFasta(text,{maxRecords=30,maxTotalBases=500000}={}){
 text=String(text||'').replace(/\r/g,'').trim();if(!text.startsWith('>'))throw Error('Provide FASTA with > headers.');let records=[],cur=null;
 for(let line of text.split('\n')){if(line.startsWith('>')){if(cur)records.push(cur);cur={name:line.slice(1).trim().slice(0,120)||'unnamed_'+(records.length+1),sequence:''};}else if(cur){cur.sequence+=line.trim().toUpperCase();}else if(line.trim())throw Error('Sequence data before a FASTA header');}
 if(cur)records.push(cur);let total=0;if(records.length>maxRecords)throw Error('Maximum '+maxRecords+' FASTA records');
 for(let r of records){r.sequence=r.sequence.replace(/\s/g,'');if(!r.sequence||!/^[ACGTN]+$/.test(r.sequence))throw Error('Invalid A/C/G/T/N sequence in '+r.name);total+=r.sequence.length;}
 if(total>maxTotalBases)throw Error('Background exceeds '+maxTotalBases+' bases; use a targeted region, not a whole genome.');return records;
}
function bindingHits(reference,query,{maxMismatch=2,terminal=5,side='right',maxHits=5000}={}){
 let hits=[],n=query.length,L=reference.length;if(n>L)return hits;
 for(let i=0;i<=L-n;i++){let m=0,terminalMismatch=0;
  for(let k=0;k<n;k++){if(reference[i+k]!==query[k]){m++;if((side==='right'&&k>=n-terminal)||(side==='left'&&k<terminal))terminalMismatch++;if(m>maxMismatch||terminalMismatch)break;}}
  if(m<=maxMismatch&&terminalMismatch===0){hits.push({start:i+1,end:i+n,mismatches:m});if(hits.length>=maxHits)break;}
 }return hits;
}
function specificity(forward,reverse,background,{maxMismatch=2,terminal=5,productMin=50,productMax=2000,maxResults=500}={}){
 const f=primer(forward),r=primer(reverse);
 if(!Number.isInteger(maxMismatch)||maxMismatch<0||maxMismatch>3||!Number.isInteger(terminal)||terminal<3||terminal>Math.min(f.length,r.length)||!Number.isInteger(productMin)||!Number.isInteger(productMax)||productMin<1||productMax<productMin||productMax>20000)throw Error('Invalid primer search parameters');
 let refs=typeof background==='string'?parseFasta(background):background;if(!Array.isArray(refs)||!refs.length)throw Error('Provide at least one local reference FASTA');
 let results=[],counts=[],truncated=false;
 for(const item of refs){let s=clean(item.sequence),name=String(item.name||'sequence');if(!/^[ACGTN]+$/.test(s))throw Error('Invalid local reference: '+name);
  // plus orientation: plus-strand F at left, revcomp(R) at right.
  // minus orientation: plus-strand R at left, revcomp(F) at right.
  let patterns=[{orient:'+',left:f,right:rev(r),left3:'right',right3:'left'},{orient:'-',left:r,right:rev(f),left3:'right',right3:'left'}];let matches=0;
  for(const p of patterns){let starts=bindingHits(s,p.left,{maxMismatch,terminal,side:p.left3});let ends=bindingHits(s,p.right,{maxMismatch,terminal,side:p.right3});
   for(let l of starts)for(let e of ends){let size=e.end-l.start+1;if(e.start<=l.start||size<productMin||size>productMax)continue;matches++;if(results.length<maxResults)results.push({reference:name,strand:p.orient,start:l.start,end:e.end,size,forwardMismatches:p.orient==='+'?l.mismatches:e.mismatches,reverseMismatches:p.orient==='+'?e.mismatches:l.mismatches});else truncated=true;}
  }
  counts.push({reference:name,amplicons:matches});
 }
 results.sort((a,b)=>a.forwardMismatches+a.reverseMismatches-b.forwardMismatches-b.reverseMismatches||a.reference.localeCompare(b.reference)||a.start-b.start);
 return {forward:f,reverse:r,searchedRecords:refs.length,totalBackgroundBases:refs.reduce((s,r)=>s+r.sequence.length,0),counts,amplicons:results,totalAmplicons:counts.reduce((n,r)=>n+r.amplicons,0),truncated,method:'Exact seed protection at each primer 3-prime terminal region; up to '+maxMismatch+' total mismatches per primer. Tests only the supplied FASTA sequences. No genome-wide claim, off-target thermodynamic binding model or primer-dimer validation.'};
}
function dotPairs(dot){dot=String(dot||'').trim();if(!dot||!/^[().]+$/.test(dot))throw Error('Use ViennaRNA-style dot-bracket using only ( ) and .');let st=[],pairs=[];for(let i=0;i<dot.length;i++){if(dot[i]==='(')st.push(i);else if(dot[i]===')'){if(!st.length)throw Error('Unbalanced closing parenthesis');let j=st.pop();pairs.push([j+1,i+1]);}}if(st.length)throw Error('Unbalanced opening parenthesis');return pairs;}
function compareFolds(seqRaw,nexusDot,externalDot,{externalDeltaG=null,externalVersion='user supplied'}={}){
 let s=clean(seqRaw).replace(/T/g,'U');if(!s||!/^[ACGU]+$/.test(s))throw Error('RNA must contain only A/C/G/U');if(nexusDot.length!==s.length||externalDot.length!==s.length)throw Error('Dot-bracket length must match RNA length');
 let a=dotPairs(nexusDot),b=dotPairs(externalDot),key=p=>p.join(','),setB=new Set(b.map(key)),tp=a.filter(p=>setB.has(key(p))).length,precision=a.length?tp/a.length:(b.length?0:1),recall=b.length?tp/b.length:(a.length?0:1),f1=(!a.length&&!b.length)?1:((precision+recall)?2*precision*recall/(precision+recall):0);
 let en=externalDeltaG===null||externalDeltaG===''?null:Number(externalDeltaG);if(en!==null&&!Number.isFinite(en))throw Error('External MFE must be a number or blank');
 return {sequence:s,length:s.length,nexusPairs:a.length,referencePairs:b.length,matchingPairs:tp,basePairDistance:a.length+b.length-2*tp,precision,recall,f1,nexusDot,externalDot,externalDeltaG:en,externalVersion:String(externalVersion).slice(0,100),note:'Comparative benchmark only: the external dot-bracket/MFE must come from independently run RNAfold or another named tool. The SeqFold heuristic has NO calibrated ΔG.'};
}
function normalized(record,index){let s=clean(record.sequence||'').replace(/[^ACGT]/g,'N');if(s.length<20||s.length>1200)throw Error('Read '+(index+1)+' length must be 20–1200 bases');let q=record.qualities||[];if(q.length&&q.length!==s.length)throw Error('Read '+(index+1)+' PHRED length differs from sequence length');if(q.some(v=>!Number.isFinite(v)||v<0||v>93))throw Error('Invalid PHRED quality');return {name:String(record.name||'read_'+(index+1)).slice(0,60),sequence:s,qualities:q.length?q:Array(s.length).fill(null)};}
function reversedRead(r){return {...r,sequence:rev(r.sequence),qualities:[...r.qualities].reverse()};}
function mergeContig(a,b,align,orientation){let prefix=[],pqual=[],depth=[],differences=[];
 let A=a.sequence,B=b.sequence,i=align.startA,j=align.startB;
 if(i&&j)throw Error('Ambiguous internal overlap; reads should share an end.');
 if(i>0){prefix.push(...A.slice(0,i));pqual.push(...a.qualities.slice(0,i));depth.push(...(a.coverage||Array(A.length).fill(1)).slice(0,i));}
 if(j>0){prefix.push(...B.slice(0,j));pqual.push(...b.qualities.slice(0,j));depth.push(...Array(j).fill(1));}
 for(let k=0;k<align.alignedA.length;k++){
   const x=align.alignedA[k],y=align.alignedB[k];let qa=null,qb=null,ca=0;
   if(x!=='-'){qa=a.qualities[i];ca=(a.coverage||[])[i]||1;i++;}if(y!=='-'){qb=b.qualities[j];j++;}
   let call='N',qual=null,cov=ca+(y==='-'?0:1);
   if(x==='-'||y==='-'){call=x==='-'?y:x;qual=x==='-'?qb:qa;differences.push({position:prefix.length+1,type:'gap',contig:x,read:y});}
   else if(x===y&&x!=='N'){call=x;qual=qa===null?qb:qb===null?qa:Math.max(qa,qb);}
   else if(x==='N'&&y!=='N'){call=y;qual=qb;}
   else if(y==='N'&&x!=='N'){call=x;qual=qa;}
   else if(qa!==null&&qb!==null&&Math.abs(qa-qb)>=15&&Math.max(qa,qb)>=28){call=qa>qb?x:y;qual=Math.max(qa,qb);differences.push({position:prefix.length+1,type:'quality-resolved',contig:x,read:y});}
   else differences.push({position:prefix.length+1,type:'unresolved',contig:x,read:y});
   prefix.push(call);pqual.push(qual);depth.push(cov);
 }
 if(align.endA<A.length){prefix.push(...A.slice(align.endA));pqual.push(...a.qualities.slice(align.endA));depth.push(...(a.coverage||Array(A.length).fill(1)).slice(align.endA));}
 else if(align.endB<B.length){prefix.push(...B.slice(align.endB));pqual.push(...b.qualities.slice(align.endB));depth.push(...Array(B.length-align.endB).fill(1));}
 return {sequence:prefix.join(''),qualities:pqual,coverage:depth,join:{read:b.name,orientation,overlap:align.alignedPairs,identity:align.identity,disagreements:differences.length},differences};
}
function deNovoAssemble(records,{minOverlap=30,minIdentity=92}={}){
 if(!Array.isArray(records)||records.length<2||records.length>8)throw Error('Supply 2–8 reads');let all=records.map(normalized);
 if(!Number.isInteger(minOverlap)||minOverlap<12||minOverlap>500||!Number.isFinite(minIdentity)||minIdentity<75||minIdentity>100)throw Error('Invalid overlap criteria');
 let used=new Set([0]),contig={...all[0],coverage:Array(all[0].sequence.length).fill(1)},joins=[],flagged=[];
 while(used.size<all.length){let choice=null;
  for(let rid=0;rid<all.length;rid++){if(used.has(rid))continue;
   for(let revFlag of [false,true]){let read=revFlag?reversedRead(all[rid]):all[rid];
    let alignment=asm.alignAffine(contig.sequence,read.sequence,{mode:'overlap'});
    if(alignment.startA>0&&alignment.startB>0)continue;
    if(alignment.alignedPairs<minOverlap||alignment.identity<minIdentity)continue;
    let score=alignment.alignedPairs*(alignment.identity/100)-(.15*(alignment.alignedA.length-alignment.alignedPairs));
    if(!choice||score>choice.score){choice={rid,read,revFlag,alignment,score};}
   }
  }
  if(!choice)break;
  let merged=mergeContig(contig,choice.read,choice.alignment,choice.revFlag?'reverse-complement':'forward');if(merged.sequence.length>5000)throw Error('Contig would exceed 5,000 bases');
  used.add(choice.rid);joins.push(merged.join);flagged.push(...merged.differences.slice(0,100));contig={name:'NEXUS_contig',sequence:merged.sequence,qualities:merged.qualities,coverage:merged.coverage};
 }
 return {consensus:contig.sequence,qualities:contig.qualities,coverage:contig.coverage,contigLength:contig.sequence.length,assembledReads:[...used].map(i=>all[i].name),unassembledReads:all.filter((x,i)=>!used.has(i)).map(x=>x.name),joins,flaggedPositions:flagged.slice(0,300),nCount:[...contig.sequence].filter(c=>c==='N').length,warning:'Experimental reference-free greedy overlap assembly, NOT phred/phrap or validated Sanger consensus. Indel columns, repeats, chimeras, low-quality ends and orientation ambiguities need manual review; unmatched reads are not silently incorporated.'};
}
return Object.freeze({parseFasta,bindingHits,specificity,dotPairs,compareFolds,deNovoAssemble});
});
