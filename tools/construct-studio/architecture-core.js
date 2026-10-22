/* NEXUS v1.8.4 full construct architecture engine: sequence composition and design documentation, NOT predictions of activity. */
(function(root,factory){const api=factory(root.NexusUTR||(typeof require==='function'?require('./utr-core.js'):null),root.NexusPro||(typeof require==='function'?require('./pro-core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;root.NexusArchitecture=api;})(typeof globalThis!=='undefined'?globalThis:this,function(UTR,Pro){'use strict';
if(!UTR||!Pro)throw Error('NEXUS RNA core missing');
const PEPTIDE=/^[ACDEFGHIKLMNPQRSTVWY]+$/;
const CAP={none:'No capping specified',co:'Co-transcriptional capping planned',post:'Post-transcriptional capping planned',cellular:'Endogenous nuclear RNA processing (DNA-driven expression)'};
function peptide(raw,label){const s=String(raw||'').replace(/\s/g,'').toUpperCase();if(s&&(!PEPTIDE.test(s)||s.length>150))throw Error(label+' must use standard amino acid one-letter codes, maximum 150 residues.');return s;}
function cleanRNA(raw,limit=1500){const s=String(raw||'').replace(/\s/g,'').toUpperCase().replaceAll('T','U');if(s.length>limit||!/^[ACGU]*$/.test(s))throw Error('RNA sequences must contain A/C/G/U and fit the maximum '+limit+' nt.');return s;}
function normalizeCoding(raw,type){const result=UTR.codingCandidates(raw,type||'cds');return result;}
function report(args){const mode=args.mode==='cell'?'cell':'ivt',cap=mode==='cell'?'cellular':(args.cap||'co');if(!CAP[cap]||(mode==='ivt'&&cap==='cellular'))throw Error('Invalid capping method');
 const promoterMode=mode==='cell'?'CELL':'IVT';const promoterType=String(args.promoterType|| (mode==='cell'?'CMV':'T7'));let pReview=null;
 if(String(args.promoterDNA||'').trim())pReview=Pro.analyzePromoter(args.promoterDNA,promoterMode,promoterType,'DNA template');
 const signal=peptide(args.signal,'Signal peptide'),anchor=peptide(args.anchor,'Transmembrane/anchor segment');
 const targeting=String(args.targeting||'none');if(!['none','signal','anchor','both'].includes(targeting))throw Error('Choose membrane targeting options');
 if(targeting==='none'&&(signal||anchor))throw Error('Choose a targeting mode to include supplied peptide segments');
 if((targeting==='signal'||targeting==='both')&&!signal)throw Error('Provide an experimentally characterized signal peptide for this strategy');
 if((targeting==='anchor'||targeting==='both')&&!anchor)throw Error('Provide an experimentally characterized anchor/TM peptide for this strategy');
 const inputType=args.inputType==='protein'?'protein':'cds';const core=normalizeCoding(args.coding,inputType),coreProtein=core.protein.replace(/\*$/,'');const append=targeting==='anchor'||targeting==='both'?anchor:'';const prepend=targeting==='signal'||targeting==='both'?signal:'';
 if(prepend&&!prepend.startsWith('M'))throw Error('The N-terminal signal peptide must include the initiator methionine (M).');
 const protein=prepend+(prepend?coreProtein.replace(/^M/,''):coreProtein)+append+'*';const added=!!prepend||!!append;
 const candidates=added?UTR.codingCandidates(protein,'protein',args.codonWeights||''):UTR.codingCandidates(args.coding,inputType,args.codonWeights||'');const choice=Number(args.codonIndex||0);
 if(!Number.isInteger(choice)||choice<0||choice>=candidates.candidates.length)throw Error('Invalid codon design choice');const cds=candidates.candidates[choice].sequence;
 if(UTR.translate(cds)!==protein)throw Error('Encoded protein does not match desired segments');
 let utr5=cleanRNA(args.utr5),utr3=cleanRNA(args.utr3),kozContext=String(args.kozak||'retain');if(kozContext==='canonical'){
  if(utr5.length<6)throw Error('To engineer a six-base Kozak context, supply at least six 5′ UTR nucleotides.');
  utr5=utr5.slice(0,-6)+'GCCACC';
 }else if(kozContext!=='retain')throw Error('Unknown Kozak context option');
 const fiveFeatures=UTR.fiveFeatures(utr5,cds),threeFeatures=UTR.threeFeatures(utr3);
 let tail=mode==='ivt'?Number(args.polyA||0):0;
 if(mode==='ivt'&&(!Number.isInteger(tail)||tail<0||tail>300))throw Error('IVT poly(A) tail length must be 0–300 nt.');
 if(mode==='ivt'&&args.polyAStrategy==='none'&&tail!==0)throw Error('Set the poly(A) length to 0 when choosing no poly(A) tail.');
 const template=utr5+cds+utr3,product=template+'A'.repeat(tail),flags=[];
 if(!utr5||!utr3)flags.push('UTR sequence is missing: transcript regulatory design is incomplete.');
 flags.push(...fiveFeatures.flags,...threeFeatures.flags);
 if(!pReview)flags.push('Promoter DNA not supplied. DNA-template sequence and transcription-start position remain unverified.');
 if(pReview)flags.push(...pReview.notes);
 if(mode==='ivt'){
   const chem=String(args.capChemistry||'unspecified');
   if(chem==='cleancap-ag'){
    if(cap!=='co')flags.push('CleanCap AG-type selected with non-co-transcriptional strategy: review incompatible selections.');
    if(promoterType!=='T7')flags.push('CleanCap AG compatibility shown in cited vendor protocols is for T7; do not assume SP6/T3 compatibility.');
    if(!pReview||!pReview.downstream)flags.push('CleanCap AG: transcription initiation dinucleotide not evaluable without a correctly oriented T7 promoter and downstream template.');
    else if(!pReview.downstream.startsWith('AG'))flags.push('CleanCap AG-type requires an AG 5′ initiation context in the cited T7 protocol; supplied downstream bases appear to be '+pReview.downstream.slice(0,2)+'.');
   }
   if(chem==='arca'&&cap!=='co')flags.push('ARCA-type analog is a co-transcriptional option; selected strategy needs review.');
   if(chem==='enzyme'&&cap!=='post')flags.push('Enzymatic capping typically belongs to a post-transcriptional strategy.');
   if(cap==='none')flags.push('Uncapped IVT RNA selected: reduced cap-dependent translation is possible. Verify intended use and innate sensing.');
   if(cap==='co')flags.push('Co-transcriptional capping requires chemistry- and initiation-sequence compatibility. This tool does not model reagent-specific incorporation.');
   if(cap==='post')flags.push('Post-transcriptional capping selected; conversion and Cap0/Cap1 state must be measured.');
   if(tail===0)flags.push('No poly(A) tail specified; confirm whether the construct is intended to be non-polyadenylated.');
   flags.push('Capping identity/efficiency is metadata, not a base sequence feature. Verify by suitable analytical methods.');
 }else{
   if(args.polyASignal&&String(args.polyASignal).trim()){
    const sig=Pro.cleanDNA(args.polyASignal);if(sig.length>200)throw Error('DNA polyadenylation cassette must be at most 200 nt');
   }else flags.push('Cellular transcript 3′ cleavage/polyadenylation requires a validated vector processing cassette, not merely a specified tail length.');
   flags.push('A mammalian DNA promoter is part of the vector; cellular capping and polyadenylation are processing events, not guaranteed.');if(promoterType==='U6')flags.push('U6 is typically a Pol III small-RNA expression context, not a substitute for a Pol II protein-coding mRNA promoter.');
 }
 if(prepend)flags.push('An optional signal peptide was prepended; the original coding protein start methionine was removed at the fusion junction for this design hypothesis. Verify the resulting N-terminus and processing.');
 if(targeting!=='none')flags.push('Targeting peptides are encoded in the protein; membrane topology, cleavage and cell-surface localization require experiments.');
 if(candidates.hasHostWeights===false)flags.push('No host-context codon table supplied. Synonymous optimization is heuristic only.');
 const sequenceComponents={utr5,cds,utr3,polyATail:mode==='ivt'?'A'.repeat(tail):null};
 return {schema:'nexus-full-rna-construct-v1',version:'1.8.4',createdAt:new Date().toISOString(),mode,assembly:'Linear protein-coding RNA or DNA-driven expression plan',templateDNA:{promoterType,promoterMode,sequence:pReview?pReview.sequence:null,analysis:pReview,polyadenylationSignalDNA:mode==='cell'?String(args.polyASignal||'').trim().toUpperCase():null},capping:{strategy:cap,description:CAP[cap],capType:mode==='ivt'?(cap==='none'?'none':(args.capType||'not-specified')):'cell-processed',chemistry:mode==='ivt'?(args.capChemistry||'unspecified'):null,predictedEfficiency:null},coding:{originalType:inputType,codonVariant:choice,designLabel:candidates.candidates[choice].name,originalProtein:coreProtein,signalPeptide:prepend,anchorSegment:append,expectedProtein:protein,candidatesAvailable:candidates.candidates.length},kozak:{choice:kozContext,review:fiveFeatures.koz},componentSequences:sequenceComponents,transcript:product,transcriptLength:product.length,codingLength:cds.length,polyATailLength:mode==='ivt'?tail:null,polyATemplateChoice:mode==='ivt'?(args.polyAStrategy||'template-coded'):'cellular-processing',proteinLength:protein.length-1,features:{five:fiveFeatures,three:threeFeatures,gc:UTR.gc(product)},validationFlags:flags,validationChecklist:['DNA promoter orientation and transcript start site verified','Cap chemistry and capping percentage verified if applicable','Poly(A) presence and length distribution assessed','RNA identity/integrity and dsRNA impurities evaluated','Protein identity, cellular expression and localization confirmed','Target-cell context and innate immune activation reviewed'],limitations:'No prediction of protein yield, promoter strength, capping efficiency, UTR stability, biological targeting or clinical outcome.'};
}
function circle(args){const coding=normalizeCoding(args.coding,args.inputType==='protein'?'protein':'cds');const idx=Number(args.codonIndex||0);if(!Number.isInteger(idx)||idx<0||idx>=coding.candidates.length)throw Error('Invalid CDS variant');const cds=coding.candidates[idx].sequence,internal=cleanRNA(args.internalEntry||'',2500),spacer=cleanRNA(args.spacer||'',300);const seq=internal+cds+spacer;
 if(!seq||seq.length>30000)throw Error('Invalid proposed circular sequence size.');
 const junction=(seq.slice(-Math.min(20,seq.length))+seq.slice(0,Math.min(20,seq.length)));const notes=['This is a conceptual circular-product map. A linear sequence export does NOT establish a covalently closed molecule.','circRNA normally lacks a free 5′ cap and a terminal poly(A) tail.','Internal initiation must be demonstrated experimentally; supplied IRES elements are not validated by this tool.','Circularization chemistry/back-splicing, junction purity, linear RNA carryover and immunogenicity require method-specific validation.'];
 if(!internal)notes.push('No initiation region supplied: protein expression cannot be assumed.');
 if(!spacer)notes.push('No junction spacer supplied; evaluate the back-splice or ligation junction for structural and functional effects.');
 return {schema:'nexus-circrna-research-v1',version:'1.8.4',createdAt:new Date().toISOString(),modality:'Circular RNA hypothesis',sequence:seq,sequenceLength:seq.length,segments:{initiationElement:internal,coding:cds,junctionSpacer:spacer},circleJunction:junction,protein:coding.protein,cap:'absent from mature circular product',polyA:'no terminal poly(A) tail',mechanism:String(args.mechanism||'unspecified'),qualityReview:['Junction-spanning RT-PCR and junction sequence confirmation','Circularity vs residual linear RNA: orthogonal tests','RNA integrity and purity assessment','Cellular expression and functional protein measurement','Innate sensing and product-specific impurities'],flags:notes};
}
return Object.freeze({report,circle,cleanRNA,peptide,CAP});
});
