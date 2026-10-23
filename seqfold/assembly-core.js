/* NEXUS SeqFold v0.5 | MIT | browser-only research screening
 * Affine gap pairwise alignment, two-read Sanger overlap consensus and enriched GenBank interchange.
 * This is not basecalling, validated variant calling, or a replacement for dedicated professional software.
 */
(function(root,factory){const api=factory(root.NexusSeq||(typeof require==='function'?require('./core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.NexusAssembly=api;})(typeof globalThis!=='undefined'?globalThis:this,function(core){
'use strict';if(!core)throw Error('NEXUS sequence core missing');
const SAFE=/^[ACGTN]+$/;const esc=s=>String(s||'').replace(/[^\x20-\x7e]/g,' ').slice(0,200);
function checkSeq(s,max=1200){s=String(s||'').toUpperCase().replace(/\s/g,'');if(!s||s.length>max||!SAFE.test(s))throw Error('Provide 1–'+max+' DNA letters A/C/G/T/N (no FASTA header).');return s;}
function alignAffine(seqA,seqB,options={}){
 let a=checkSeq(seqA),b=checkSeq(seqB),n=a.length,m=b.length,overlap=options.mode==='overlap';if(options.mode&& !['global','overlap'].includes(options.mode))throw Error('Mode must be global or overlap');
 let match=Number(options.match??2),mismatch=Number(options.mismatch??-4),gapOpen=Number(options.gapOpen??-6),gapExtend=Number(options.gapExtend??-1);
 if([match,mismatch,gapOpen,gapExtend].some(x=>!Number.isFinite(x)||Math.abs(x)>100))throw Error('Invalid alignment scores.');
 let stride=m+1,len=(n+1)*stride,NEG=-1e12,idx=(i,j)=>i*stride+j;
 let M=new Float64Array(len),X=new Float64Array(len),Y=new Float64Array(len),tm=new Uint8Array(len),tx=new Uint8Array(len),ty=new Uint8Array(len);
 M.fill(NEG);X.fill(NEG);Y.fill(NEG);M[0]=0;
 for(let i=1;i<=n;i++){let p=idx(i,0);if(overlap){M[p]=0;tm[p]=3;}else{X[p]=gapOpen+(i-1)*gapExtend;tx[p]=i===1?0:1;}}
 for(let j=1;j<=m;j++){let p=idx(0,j);if(overlap){M[p]=0;tm[p]=3;}else{Y[p]=gapOpen+(j-1)*gapExtend;ty[p]=j===1?0:2;}}
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){let p=idx(i,j),d=idx(i-1,j-1),u=idx(i-1,j),l=idx(i,j-1);let diag=[M[d],X[d],Y[d]],best=0;for(let k=1;k<3;k++)if(diag[k]>diag[best])best=k;M[p]=diag[best]+(a[i-1]===b[j-1]?match:mismatch);tm[p]=best;
 let ex=[M[u]+gapOpen,X[u]+gapExtend,Y[u]+gapOpen],ey=[M[l]+gapOpen,X[l]+gapOpen,Y[l]+gapExtend],bx=0,by=0;for(let k=1;k<3;k++){if(ex[k]>ex[bx])bx=k;if(ey[k]>ey[by])by=k;}X[p]=ex[bx];Y[p]=ey[by];tx[p]=bx;ty[p]=by;}
 let ei=n,ej=m,state=0,score=-Infinity;const visit=(i,j)=>{let p=idx(i,j),vs=[M[p],X[p],Y[p]];for(let k=0;k<3;k++)if(vs[k]>score){score=vs[k];ei=i;ej=j;state=k;}};
 if(overlap){for(let j=1;j<=m;j++)visit(n,j);for(let i=1;i<=n;i++)visit(i,m);}else visit(n,m);
 let endI=ei,endJ=ej,aa=[],bb=[],steps=0,i=ei,j=ej;
 while(i>0&&j>0){let p=idx(i,j),prev;if(state===0){prev=tm[p];aa.push(a[i-1]);bb.push(b[j-1]);i--;j--;}else if(state===1){prev=tx[p];aa.push(a[i-1]);bb.push('-');i--;}else {prev=ty[p];aa.push('-');bb.push(b[j-1]);j--;}state=prev;if(++steps>n+m+10)throw Error('Alignment traceback exceeded safety limit');}
 let startI=i,startJ=j;
 if(!overlap){while(i>0){aa.push(a[--i]);bb.push('-');}while(j>0){aa.push('-');bb.push(b[--j]);}startI=0;startJ=0;}
 aa.reverse();bb.reverse();let alignedA=aa.join(''),alignedB=bb.join(''),pairs=0,identical=0;
 for(let t=0;t<aa.length;t++)if(aa[t]!=='-'&&bb[t]!=='-'){pairs++;if(aa[t]===bb[t]&&aa[t]!=='N')identical++;}
 return {mode:overlap?'overlap':'global',score,alignedA,alignedB,startA:startI,endA:endI,startB:startJ,endB:endJ,alignedPairs:pairs,matches:identical,identity:pairs?100*identical/pairs:0,algorithm:'Gotoh affine-gap dynamic programming; free-end semi-global overlap or end-to-end global; research screening only'};
}
function normalizeRead(x,name){let raw=String(x?.sequence||'').toUpperCase().replace(/\s/g,'');if(!raw||raw.length>1200||!/^[ACGTNRYSWKMBDHV]+$/.test(raw))throw Error(name+': provide DNA base calls (≤1200)');let sequence=raw.replace(/[^ACGT]/g,'N'),quality=(x.qualities||[]);if(quality.length&&quality.length!==sequence.length)throw Error(name+': sequence/PHRED lengths differ');if(quality.some(q=>!Number.isFinite(q)||q<0||q>93))throw Error(name+': invalid PHRED value');return {sequence,qualities:quality.length?[...quality]:Array(sequence.length).fill(null),qualityAvailable:!!quality.length,name:String(x.name||name)};}
function orientReverse(read){return {...read,sequence:core.reverseComplement(read.sequence),qualities:[...read.qualities].reverse()};}
function assemblePair(forward,reverse,options={}){
 let F=normalizeRead(forward,'Forward'),R=orientReverse(normalizeRead(reverse,'Reverse'));
 let aln=alignAffine(F.sequence,R.sequence,{mode:'overlap'}),minOverlap=Number(options.minOverlap??30),minIdentity=Number(options.minIdentity??80);
 if(!Number.isFinite(minOverlap)||minOverlap<1||minOverlap>1200||!Number.isFinite(minIdentity)||minIdentity<0||minIdentity>100)throw Error('Invalid overlap settings');
 if(aln.alignedPairs<minOverlap||aln.identity<minIdentity)throw Error(`Insufficient overlap: ${aln.alignedPairs} aligned bases at ${aln.identity.toFixed(1)}% identity (requires ≥${minOverlap} bp and ≥${minIdentity}%). Check reverse-read orientation and trimming.`);
 let out=[],qout=[],coverage=[],differences=[],i=aln.startA,j=aln.startB;
 if(i>0){out.push(...F.sequence.slice(0,i));qout.push(...F.qualities.slice(0,i));coverage.push(...Array(i).fill(1));}
 else if(j>0){out.push(...R.sequence.slice(0,j));qout.push(...R.qualities.slice(0,j));coverage.push(...Array(j).fill(1));}
 for(let k=0;k<aln.alignedA.length;k++){
   let a=aln.alignedA[k],b=aln.alignedB[k],qa=null,qb=null,fi=null,rj=null;
   if(a!=='-'){fi=i;qa=F.qualities[i++];}if(b!=='-'){rj=j;qb=R.qualities[j++];}
   if(a==='-'||b==='-'){let called=a==='-'?b:a;out.push(called);qout.push(a==='-'?qb:qa);coverage.push(1);differences.push({type:'indel_in_overlap',forwardIndex:fi===null?null:fi+1,reverseOrientedIndex:rj===null?null:rj+1,forward:a,reverse:b});continue;}
   coverage.push(2);
   if(a===b&&a!=='N'){out.push(a);qout.push(qa===null?qb:qb===null?qa:Math.min(60,Math.max(qa,qb)+3));}
   else{let chosen='N';if(a!=='N'&&b==='N')chosen=a;else if(b!=='N'&&a==='N')chosen=b;else if(qa!==null&&qb!==null&&Math.abs(qa-qb)>=12&&Math.max(qa,qb)>=25)chosen=qa>qb?a:b;
     out.push(chosen);qout.push(chosen==='N'?0:(chosen===a?qa:qb));differences.push({type:'discordant_base',forwardIndex:fi+1,reverseOrientedIndex:rj+1,forward:a,reverse:b,forwardQ:qa,reverseQ:qb,consensus:chosen});}
 }
 if(aln.endA<F.sequence.length){let suff=F.sequence.slice(aln.endA);out.push(...suff);qout.push(...F.qualities.slice(aln.endA));coverage.push(...Array(suff.length).fill(1));}
 else if(aln.endB<R.sequence.length){let suff=R.sequence.slice(aln.endB);out.push(...suff);qout.push(...R.qualities.slice(aln.endB));coverage.push(...Array(suff.length).fill(1));}
 let sequence=out.join('');return {sequence,qualities:qout,coverage,alignedPairs:aln.alignedPairs,identity:aln.identity,overlapMatches:aln.matches,disagreements:differences,ambiguities:[...sequence].filter(c=>c==='N').length,forwardLength:F.sequence.length,reverseLength:R.sequence.length,alignment:aln,warning:'Heuristic two-read consensus from instrument base calls. No independent re-basecalling, circular assembly, mixed-peak detection, high-confidence variant calling or accuracy guarantee.'};
}
function diffReference(assembled,reference){let ref=checkSeq(reference,1200),seq=checkSeq(assembled.sequence||assembled,1200),aln=alignAffine(ref,seq,{mode:'global'}),rows=[],ri=0,si=0;for(let k=0;k<aln.alignedA.length;k++){let a=aln.alignedA[k],b=aln.alignedB[k];if(a!=='-')ri++;if(b!=='-')si++;if(a===b)continue;rows.push({type:a==='-'?'insertion':b==='-'?'deletion':'substitution',referencePosition:a==='-'?ri:ri,reference:a,consensus:b,consensusPosition:b==='-'?null:si,coverage:b==='-'?null:assembled.coverage?.[si-1]??null});}return {alignment:aln,differences:rows,warning:'Global consensus/reference screening only; ambiguous bases, repeats, low quality ends and indels require manual review.'};}
function parseLocation(raw,length){raw=String(raw||'').replace(/\s/g,'');if(!raw||raw.length>500||/[A-Za-z0-9_]+:/.test(raw))return null;let strand=raw.startsWith('complement(')?-1:1;let parts=[...raw.matchAll(/([<>]?\d+)\.\.([<>]?\d+)|([<>]?\d+)(?![.\d])/g)].map(m=>m[3]?[Number(m[3].replace(/[<>]/g,'')),Number(m[3].replace(/[<>]/g,''))]:[Number(m[1].replace(/[<>]/g,'')),Number(m[2].replace(/[<>]/g,''))]);if(!parts.length||parts.some(([s,e])=>s<1||e<s||e>length))return null;return {start:Math.min(...parts.map(p=>p[0])),end:Math.max(...parts.map(p=>p[1])),strand,parts,location:raw,joined:parts.length>1};}
function parseGenbankRich(input){let text=String(input||'').replace(/\r/g,'');if(!/^LOCUS\s/m.test(text)||!/^ORIGIN\s*$/m.test(text))throw Error('Expected GenBank with LOCUS and ORIGIN');let sequence=text.split(/^ORIGIN\s*$/m)[1].split(/^\/\//m)[0].replace(/[^a-zA-Z]/g,'').toUpperCase();if(!sequence||sequence.length>200000||!/^[ACGTNRYKMSWBDHV]+$/.test(sequence))throw Error('GenBank DNA sequence invalid / too large');let name=(text.match(/^LOCUS\s+(\S+)/m)||[])[1]||'Imported';let accession=(text.match(/^VERSION\s+(\S+)/m)||text.match(/^ACCESSION\s+(\S+)/m)||[])[1]||'';let circular=/^LOCUS\s+.*\bcircular\b/im.test(text);let definition=(text.match(/^DEFINITION\s+([^\n]+)/m)||[])[1]||name;let section=(text.match(/^FEATURES[^\n]*\n([\s\S]*?)(?=^(?:ORIGIN|BASE COUNT|CONTIG)\b)/m)||[])[1]||'';let features=[],current=null,activeQualifier=null;
 function flush(){if(!current)return;let loc=parseLocation(current.location,sequence.length);features.push({...current,...(loc||{start:null,end:null,strand:1,parts:[],joined:false}),valid:!!loc,unsupported:!loc,location:current.location});current=null;activeQualifier=null;}
 for(let line of section.split('\n')){
  let feat=line.match(/^ {5}(\S+)\s+(.+)$/);if(feat){flush();current={type:feat[1].slice(0,40),location:feat[2].trim(),qualifiers:{}};continue;}if(!current)continue;
  let data=line.slice(21).trim();if(!data)continue;
  if(data.startsWith('/')){let qm=data.match(/^\/([A-Za-z_0-9]+)(?:=(.*))?$/);if(!qm)continue;activeQualifier=qm[1];let value=(qm[2]||'').replace(/^"/,'').replace(/"$/,'');(current.qualifiers[activeQualifier]??=[]).push(value);}
  else if(activeQualifier){let list=current.qualifiers[activeQualifier];list[list.length-1]+=data.replace(/"$/,'');}
  else current.location+=data;
 }
 flush();features=features.slice(0,3000);return {name,accession,definition,sequence,circular,features,source:'Imported GenBank',warning:'Simple, join and complement location ranges supported for visualization and interchange. Remote/uncertain/more complex locations remain raw/unparsed; original record metadata is not fully retained.'};
}
function genbankRich(record){let seq=String(record.sequence||'').toUpperCase();if(!seq||seq.length>200000||!/^[ACGTNRYKMSWBDHV]+$/.test(seq))throw Error('Invalid DNA sequence');let name=esc(record.name).replace(/[^A-Za-z0-9_]/g,'_').slice(0,16)||'NEXUS';let n=seq.length,top=record.circular?'circular':'linear';let lines=[`LOCUS       ${name.padEnd(17)} ${String(n).padStart(7)} bp    DNA     ${top.padEnd(8)} SYN 19-OCT-2026`,`DEFINITION  ${esc(record.definition||record.name||name)}`,`ACCESSION   ${esc(record.accession||'').replace(/[^A-Za-z0-9_.]/g,'')}`,`FEATURES             Location/Qualifiers`];
 for(let f of (record.features||[]).slice(0,3000)){if(!/^\w{1,40}$/.test(f.type))continue;let location=String(f.location||((f.strand===-1?'complement(':'')+f.start+'..'+f.end+(f.strand===-1?')':''))).replace(/\s/g,'');if(!/^[A-Za-z0-9_<>^,.():]+$/.test(location)||location.length>500)continue;lines.push('     '+f.type.padEnd(15)+' '+location);for(let [key,vals] of Object.entries(f.qualifiers||{})){if(!/^\w{1,35}$/.test(key))continue;for(let val of vals.slice(0,30)){let clean=esc(val).replace(/"/g,"'");lines.push('                     /'+key+'="'+clean+'"');}}}
 lines.push('ORIGIN');for(let k=0;k<seq.length;k+=60)lines.push(String(k+1).padStart(9)+' '+(seq.slice(k,k+60).toLowerCase().match(/.{1,10}/g)||[]).join(' '));lines.push('//');return lines.join('\n')+'\n';}
return {alignAffine,assemblePair,diffReference,parseLocation,parseGenbankRich,genbankRich,version:'0.5.0'};
});
