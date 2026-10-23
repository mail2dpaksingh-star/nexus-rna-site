/* NEXUS Construct Studio QA v1.8.20. Original, browser-local rules.
 * A review of sequence integrity and design documentation; NOT predictive biology or GMP release. */
(function(root,factory){const api=factory(root.NexusUTR||(typeof require==='function'?require('./utr-core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.NexusConstructQA=api;})(typeof globalThis!=='undefined'?globalThis:this,function(UTR){
'use strict';if(!UTR)throw Error('NexusUTR is required');
const LIMIT=50000, STOP=new Set(['UAA','UAG','UGA']);
function clean(raw,label='RNA',allowEmpty=true){let s=String(raw??'').trim();if((s.match(/^>/gm)||[]).length>1)throw Error(label+': only one FASTA record is supported');s=s.replace(/^>[^\n]*(?:\n|$)/,'').replace(/\s/g,'').toUpperCase().replace(/T/g,'U');if(s.length>LIMIT)throw Error(label+': exceeds '+LIMIT+' nt');if(!allowEmpty&&!s)throw Error(label+': sequence required');if(/[^ACGU]/.test(s))throw Error(label+': ambiguous, invalid or modified bases require separate annotation (A/C/G/U only)');return s;}
function makeIssue(level,code,message,component){return {level,code,message,component};}
function runLength(s){let n=0,best=0,last='';for(const b of s){n=b===last?n+1:1;last=b;best=Math.max(best,n);}return best;}
function count(s,motif){let n=0,p=-1;while((p=s.indexOf(motif,p+1))>=0)n++;return n;}
function regions(parts){let offset=1;return parts.filter(x=>x.sequence.length>0).map(x=>{const out={name:x.name,start:offset,end:offset+x.sequence.length-1,length:x.sequence.length};offset=out.end+1;return out;});}
function issuesSmall(seq,miRNA){let issues=[];if(!seq)issues.push(makeIssue('block','GUIDE_REQUIRED','Provide a guide/target RNA sequence.','guide'));
 if(seq&&(seq.length<18||seq.length>30))issues.push(makeIssue('review','GUIDE_LENGTH','Length outside the typical 18–30-nt mature small-RNA review range; verify whether this is a precursor.','guide'));
 if(seq&&seq.length>=8)issues.push(makeIssue('info','SEED_ANNOTATION','Positions 2–8 are reported as a seed-region annotation, not a verified target or off-target prediction.','guide'));
 issues.push(makeIssue('review','BIOLOGICAL_VALIDATION',miRNA?'miRNA processing, strand loading, target selectivity and expression require experimental confirmation.':'Small RNA duplex pairing, strand loading and knockdown require assay-specific confirmation.','assay'));
 return issues;}
function linear(input){const route=input.route==='cell'?'cell':'ivt',utr5=clean(input.utr5,'5′ UTR'),cds=clean(input.cds,'CDS'),utr3=clean(input.utr3,'3′ UTR'),cap=String(input.cap||'unspecified');let issues=[],tail=route==='ivt'?Number(input.polyA??0):0;
 if(route==='ivt'&&(!Number.isInteger(tail)||tail<0||tail>1500))throw Error('IVT poly(A) tail length must be an integer between 0 and 1,500 nt');
 const parts=[{name:'5′ UTR',sequence:utr5},{name:'CDS',sequence:cds},{name:'3′ UTR',sequence:utr3},{name:'poly(A)',sequence:'A'.repeat(tail)}],sequence=parts.map(x=>x.sequence).join('');
 if(!cds)issues.push(makeIssue('block','CDS_REQUIRED','Enter a complete coding sequence for this protein-coding design.','CDS'));
 else {
  if(cds.length%3!==0)issues.push(makeIssue('block','FRAME','CDS length must be divisible by three.','CDS'));
  if(cds.slice(0,3)!=='AUG')issues.push(makeIssue('block','START','A full coding sequence should begin with AUG (alternative initiation needs a separate assay plan).','CDS'));
  if(!STOP.has(cds.slice(-3)))issues.push(makeIssue('block','STOP','CDS lacks a terminal in-frame UAA/UAG/UGA stop codon.','CDS'));
  for(let i=3;i+2<cds.length-3;i+=3){if(STOP.has(cds.slice(i,i+3))){issues.push(makeIssue('block','PREMATURE_STOP','In-frame stop at CDS nt '+(i+1)+'.','CDS'));break;}}
 }
 if(!utr5)issues.push(makeIssue('review','UTR5_MISSING','5′ UTR not supplied: translation-initiation context cannot be evaluated.','5′ UTR'));
 if(!utr3)issues.push(makeIssue('review','UTR3_MISSING','3′ UTR not supplied: regulatory context is incomplete.','3′ UTR'));
 const aug=count(utr5,'AUG');if(aug)issues.push(makeIssue('review','UPSTREAM_AUG',aug+' upstream AUG motif(s) in 5′ UTR; potential uORFs and start competition require review.','5′ UTR'));
 if(utr5){const minus3=utr5.length>=3?utr5[utr5.length-3]:null,plus4=cds.length>=4?cds[3]:null;
 if(minus3&&!/[AG]/.test(minus3))issues.push(makeIssue('review','KOZAK_MINUS3','Kozak position −3 is not A/G (not a quantitative translation prediction).','5′ UTR'));
 if(plus4&&plus4!=='G')issues.push(makeIssue('info','KOZAK_PLUS4','Position +4 is not G; effect depends on context.','CDS'));
 }
 if(count(utr3,'AUUUA'))issues.push(makeIssue('info','AU_RICH','AUUUA regulatory motif(s) present; does not establish RNA instability.','3′ UTR'));
 for(const p of parts){if(p.name==='poly(A)'||!p.sequence)continue;if(runLength(p.sequence)>=8)issues.push(makeIssue('review','HOMOPOLYMER','At least one run of 8+ identical bases in '+p.name+'.',''+p.name));}
 if(route==='ivt'){
  if(!['co','post','none','unspecified'].includes(cap))throw Error('Unknown IVT capping strategy');
  if(cap==='none'||cap==='unspecified')issues.push(makeIssue('review','CAP_UNVERIFIED','No verified capping strategy documented.','Cap'));
  issues.push(makeIssue('info','CAP_NOT_SEQUENCE','5′ cap chemistry is not part of the RNA nucleotide sequence and requires analytical verification.','Cap'));
  if(tail===0)issues.push(makeIssue('review','POLYA_MISSING','No terminal poly(A) tail recorded; verify the intended construct design.','poly(A)'));
 }else{
  if(cap!=='cellular'&&cap!=='unspecified')issues.push(makeIssue('block','CAP_MODE','Co/post-transcriptional IVT capping cannot be assigned as the mammalian DNA-vector processing route.','Cap'));
  if(Number(input.polyA||0)>0)issues.push(makeIssue('block','TAIL_MODE','Do not append an IVT poly(A) tail as a fixed RNA sequence for a DNA-driven expression record.','poly(A)'));
  issues.push(makeIssue('review','DNA_PROCESSING','Confirm the appropriate mammalian promoter, 3′ processing cassette and transcript boundaries experimentally.','DNA cassette'));
 }
 if(input.targeting && input.targeting!=='none')issues.push(makeIssue('review','TARGETING_VALIDATION','Encoded targeting segment selection does not verify cleavage, membrane topology or localization.','protein'));
 issues.push(makeIssue('info','POTENCY_NOT_PREDICTED','No quantitative protein expression, transcript half-life, potency or therapeutic activity is inferred.','model'));
 const translates=cds.length>0&&cds.length%3===0&&cds.startsWith('AUG')&&!issues.some(x=>x.code==='PREMATURE_STOP')?UTR.translate(cds):null;
 const r={schema:'nexus-construct-review-v1',modality:route==='ivt'?'linear-ivt':'linear-cell',source:String(input.source||'manual'),sequence,components:parts.map(x=>({name:x.name,length:x.sequence.length})),coordinateMap:regions(parts),protein:translates,metrics:{length:sequence.length,cdsLength:cds.length,proteinLength:translates?.replace(/\*$/,'').length??null,gcPercent:UTR.gc(sequence),utr5Length:utr5.length,utr3Length:utr3.length,polyALength:tail,upstreamAUGs:aug,utr3AUUUA:count(utr3,'AUUUA'),maxHomopolymerNonTail:Math.max(...parts.slice(0,3).map(p=>runLength(p.sequence)))},issues};return finish(r);}
function small(input){const subtype=['mirna','sirna','rnaa'].includes(input.modality)?input.modality:'sirna',s=clean(input.guide,'Guide RNA'),issues=issuesSmall(s,subtype==='mirna');
 if(subtype==='rnaa')issues.push(makeIssue('review','RNAA_NOT_REPLICON','Small activating RNA (RNAa) is distinct from replicon saRNA; activation requires measured endogenous expression.','modality'));
 return finish({schema:'nexus-construct-review-v1',modality:subtype,source:String(input.source||'manual'),sequence:s,components:[{name:'Mature guide RNA',length:s.length}],coordinateMap:regions([{name:'Mature guide RNA',sequence:s}]),metrics:{length:s.length,gcPercent:UTR.gc(s),seed:s.length>=8?s.slice(1,8):null},issues});}
function circle(input){const seq=clean(input.sequence,'Linearized circRNA',false);const issues=[makeIssue('review','CIRCULARITY_UNVERIFIED','A linearized sequence does not prove a closed RNA. Verify junction and residual linear RNA.','junction'),makeIssue('review','INITIATION_UNVERIFIED','Circular-RNA translation initiation requires experimentally supported evidence.','translation')];
 if(input.cap&&input.cap!=='none')issues.push(makeIssue('block','CIRC_CAP','Conventional terminal 5′ capping is not applicable to mature circRNA.','cap'));
 if(Number(input.polyA||0)>0)issues.push(makeIssue('block','CIRC_TAIL','A terminal poly(A) tail is not part of a covalently closed RNA.','poly(A)'));
 if(seq.length<30)issues.push(makeIssue('review','SHORT_CIRCLE','Sequence is unusually short for the proposed coding circRNA use; confirm input and purpose.','sequence'));
 const junction=seq.slice(-Math.min(20,seq.length))+seq.slice(0,Math.min(20,seq.length));return finish({schema:'nexus-construct-review-v1',modality:'circ',source:String(input.source||'manual'),sequence:seq,components:[{name:'Linearized circRNA',length:seq.length}],coordinateMap:[{name:'Linearized circRNA',start:1,end:seq.length,length:seq.length}],junction,metrics:{length:seq.length,gcPercent:UTR.gc(seq),junctionWindow:junction},issues});}
function replicon(input){const s=clean(input.sequence||'','Full-length replicon');const issues=[makeIssue('review','REPLICON_ARCHITECTURE','A replicon needs validated annotation of replicase, regulatory regions and cargo; generic CDS/UTR checks are insufficient.','replicon'),makeIssue('review','AMPLIFICATION_QC','Replication, dsRNA species and innate sensing require separate verification.','assay')];
 if(!s)issues.push(makeIssue('block','NO_SEQUENCE','No sequence supplied for sequence-level review.','sequence'));
 return finish({schema:'nexus-construct-review-v1',modality:'selfamp',source:String(input.source||'manual'),sequence:s,components:[],coordinateMap:[],metrics:{length:s.length,gcPercent:UTR.gc(s)},issues});}
function finish(record){const blockers=record.issues.filter(x=>x.level==='block').length,reviews=record.issues.filter(x=>x.level==='review').length;record.summary={blockingIssues:blockers,reviewItems:reviews,informationalItems:record.issues.length-blockers-reviews,status:blockers?'INPUT_INCOMPLETE':reviews?'RESEARCH_REVIEW_REQUIRED':'RESEARCH_REVIEW_ONLY'};record.method='NEXUS Construct QA v1.8.20 · deterministic sequence/documentation checks';record.validation='Research stage only. Not a measured expression model, not a validated release assay, and not GMP/clinical approval.';return record;}
function audit(input){if(!input||typeof input!=='object')throw Error('Supply a construct record');switch(input.modality){case 'linear-ivt':return linear({...input,route:'ivt'});case 'linear-cell':return linear({...input,route:'cell'});case 'mirna':case 'sirna':case 'rnaa':return small(input);case 'circ':return circle(input);case 'selfamp':return replicon(input);default:throw Error('Unsupported modality. Select a documented RNA type.');}}
function fromExisting(record){if(!record||typeof record!=='object')throw Error('Invalid construct JSON');if(record.schema==='nexus-full-rna-construct-v1'){
 const c=record.componentSequences||{};const out=audit({modality:record.mode==='cell'?'linear-cell':'linear-ivt',utr5:c.utr5,cds:c.cds,utr3:c.utr3,polyA:record.mode==='cell'?0:record.polyATailLength,cap:record.mode==='cell'?'cellular':(record.capping?.strategy||'unspecified'),targeting:(record.coding?.signalPeptide||record.coding?.anchorSegment)?'encoded':'none',source:'Advanced RNA Design Pro JSON'});if(record.transcript&&clean(record.transcript)!==out.sequence)out.issues.unshift(makeIssue('block','SOURCE_MISMATCH','Original transcript differs from the exported component sequence assembly.','import'));return finish(out);}
 if(record.schema==='nexus-circrna-research-v1'){const out=audit({modality:'circ',sequence:record.sequence,cap:'none',polyA:0,source:'Circular RNA Studio JSON'});if(record.segments&&['initiationElement','coding','junctionSpacer'].every(k=>typeof record.segments[k]==='string')){const combined=clean(record.segments.initiationElement)+clean(record.segments.coding)+clean(record.segments.junctionSpacer);if(combined!==out.sequence)out.issues.unshift(makeIssue('block','SOURCE_MISMATCH','Segment sequences do not match the exported circular RNA sequence.','import'));}return finish(out);} 
 if(record.schema==='nexus-utr-research-v1'){const c=record.components||{};const out=audit({modality:'linear-ivt',utr5:c.utr5,cds:c.cds,utr3:c.utr3,polyA:0,cap:'unspecified',source:'CDS & UTR Studio JSON (unprocessed transcript)'});if(record.transcript&&clean(record.transcript)!==out.sequence)out.issues.unshift(makeIssue('block','SOURCE_MISMATCH','Original transcript differs from the component sequence assembly.','import'));return finish(out);}
 throw Error('Unsupported file schema. Import Full RNA Design Pro, Circular RNA, or CDS/UTR research JSON.');}
return Object.freeze({audit,fromExisting,clean,regions});
});
