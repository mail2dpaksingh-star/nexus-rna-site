/* NEXUS Protein → Coding DNA / Codon Design v0.8. Research-only.
   This uses the previously bundled illustrative codon preference orders;
   it does not reconstruct the source gene or predict experimental expression. */
(function(root,factory){
  const seq=root.NexusSeq||(typeof require==='function'?require('./core.js'):null);
  const advanced=root.NexusAdvanced||(typeof require==='function'?require('./advanced-core.js'):null);
  const api=factory(seq,advanced);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.NexusProteinDesign=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(seq,advanced){
'use strict';
if(!seq||!advanced)throw Error('NEXUS Protein Design requires core and advanced-core modules.');
const NUCLEOTIDE=/^[ACGTURYSWKMBDHVN]+$/;
const AA=/^[ACDEFGHIKLMNPQRSTVWY*]+$/;
function cleanProtein(raw){const s=String(raw||'').toUpperCase().replace(/\s|\d/g,'').replace(/\.$/,'');
 if(!s||s.length>10000||!AA.test(s))throw Error('Protein input must contain 1–10,000 standard amino-acid letters (and an optional terminal *). For ambiguous sequences, choose the input type explicitly.');
 if(s.indexOf('*')!==-1&&s.indexOf('*')!==s.length-1)throw Error('Internal stop codons cannot be optimized as a single ORF.');return s;}
function cleanCodingDNA(raw){const s=String(raw||'').toUpperCase().replace(/[\s\d]/g,'').replace(/U/g,'T');
 if(!s||s.length>30000||/[^ACGT]/.test(s))throw Error('Coding DNA/RNA must contain only A/C/G/T or A/C/G/U (up to 30,000 nt).');
 if(s.length%3!==0)throw Error('Coding DNA/RNA must be in-frame: its length must be divisible by three.');
 const p=seq.translate(s);if(p.includes('*')&&p.indexOf('*')!==p.length-1)throw Error('Internal stop codon detected. Check the reading frame.');return s;}
function classify(raw,explicit='auto'){
 if(explicit==='nucleotide'||explicit==='dna')return 'dna';if(explicit==='protein')return 'protein';
 const s=String(raw||'').toUpperCase().replace(/[\s\d]/g,'').replace(/\.$/,'');
 if(!s)throw Error('Enter a DNA, RNA or protein sequence.');
 if(NUCLEOTIDE.test(s))return 'dna';if(AA.test(s))return 'protein';
 throw Error('Unsupported or mixed alphabet. Choose Protein or DNA/RNA explicitly and check the sequence.');
}
function design(raw,{inputType='auto',host='Human (heuristic)',gcTarget=52,avoid='GAATTC,GGATCC,AAGCTT',output='DNA'}={}){
 if(!['DNA','RNA'].includes(output))throw Error('Output must be DNA or RNA.');
 const kind=classify(raw,inputType),canonical=kind==='protein'?cleanProtein(raw):cleanCodingDNA(raw);
 const result=advanced.optimize(canonical,{inputType:kind,host,gcTarget,avoid});
 const verified=seq.translate(result.dna),protein=kind==='protein'?canonical:seq.translate(canonical);
 if(verified!==protein)throw Error('Safety check failed: coding sequence does not encode supplied amino-acid sequence.');
 const sequence=output==='RNA'?result.dna.replace(/T/g,'U'):result.dna;
 return {inputType:kind,host,output,protein,aaLength:protein.replace(/\*$/,'').length,dna:result.dna,sequence,length:sequence.length,gc:result.gc,originalGC:result.inputGC,codonsChanged:result.ntChanges,aaPreserved:true,warnings:[...result.warnings,'Back-translation generates one of many possible coding sequences. It does not recover the original DNA.','Codon priorities are heuristic; translation preservation does not imply improved expression or safety.'],method:'Illustrative host codon ordering with GC/motif heuristics and translation check; research-stage'};
}
return Object.freeze({cleanProtein,cleanCodingDNA,classify,design});
});
