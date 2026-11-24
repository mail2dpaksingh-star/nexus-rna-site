/* NEXUS mRNA-display in-silico peptide library input and variant helper.
   Research use; sequences are processed locally, not synthesized or screened. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.NexusPeptideLibraryCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const AA="ACDEFGHIKLMNPQRSTVWY",MAX_SEEDS=1000,MAX_LIBRARY=2000;
  const code="TTT:F TTC:F TTA:L TTG:L TCT:S TCC:S TCA:S TCG:S TAT:Y TAC:Y TAA:* TAG:* TGT:C TGC:C TGA:* TGG:W CTT:L CTC:L CTA:L CTG:L CCT:P CCC:P CCA:P CCG:P CAT:H CAC:H CAA:Q CAG:Q CGT:R CGC:R CGA:R CGG:R ATT:I ATC:I ATA:I ATG:M ACT:T ACC:T ACA:T ACG:T AAT:N AAC:N AAA:K AAG:K AGT:S AGC:S AGA:R AGG:R GTT:V GTC:V GTA:V GTG:V GCT:A GCC:A GCA:A GCG:A GAT:D GAC:D GAA:E GAG:E GGT:G GGC:G GGA:G GGG:G";
  const CODONS=Object.fromEntries(code.split(" ").map(part=>part.split(":")));
  const DNA_BY_AA={};
  for(const [dna,aa] of Object.entries(CODONS))if(aa!=="*"&&!DNA_BY_AA[aa])DNA_BY_AA[aa]=dna;
  function formatName(s,i){
    return String(s||"Sequence "+i).trim().replace(/[\t\r\n<>]/g," ").slice(0,100)||"Sequence "+i;
  }
  function records(raw){
    const t=String(raw||"").replace(/\r\n?/g,"\n").trim();
    if(!t)throw Error("Paste one or more peptide or coding-DNA sequences, or upload a file.");
    if(t.length>256000)throw Error("Input is too large. Import up to 1,000 records from a file smaller than 250 KB.");
    const result=[];
    if(/^>/m.test(t)){
      let active=null;
      for(const line of t.split("\n")){
        if(line.trim().startsWith(">")){
          if(active)result.push(active);
          active={name:line.trim().slice(1),sequence:""};
        }else if(active){
          active.sequence+=line.trim();
        }else if(line.trim())throw Error("For FASTA input, begin each record with a > sequence header.");
      }
      if(active)result.push(active);
    }else{
      for(const rawLine of t.split("\n")){
        const line=rawLine.trim();
        if(!line||line.startsWith("#"))continue;
        const fields=line.includes("\t")?line.split("\t"):line.includes(",")?line.split(","):[line];
        if(fields.length>2)throw Error("Each plain-text row must contain one sequence, or name,sequence.");
        const seq=String(fields.length===2?fields[1]:fields[0]).trim().replace(/^"|"$/g,"");
        if(/^(sequence|peptide|coding[_ ]?dna|dna|rna)$/i.test(seq))continue;
        result.push({name:fields.length===2?fields[0].replace(/^"|"$/g,""):"Sequence "+(result.length+1),sequence:seq});
      }
    }
    if(!result.length)throw Error("No sequence records were found.");
    if(result.length>MAX_SEEDS)throw Error("The custom input accepts at most "+MAX_SEEDS.toLocaleString()+" seed sequences per analysis.");
    return result.map((r,i)=>({name:formatName(r.name,i+1),raw:r.sequence}));
  }
  function normalizeEntry(raw,type,name,i){
    const seq=String(raw||"").toUpperCase().replace(/[\s\d]/g,"");
    if(type==="peptide"){
      if(!new RegExp("^["+AA+"]{2,60}$").test(seq))throw Error(name+": peptides must be 2–60 standard amino acids (one-letter codes), without stops or ambiguity.");
      const dna=[...seq].map(aa=>DNA_BY_AA[aa]).join("");
      return {id:i,name,peptide:seq,dna,kind:"seed",source:"User peptide",dnaOrigin:"Illustrative reverse translation",mutation:""};
    }
    if(type!=="dna")throw Error("Select peptide or coding DNA/RNA as the input type.");
    const dna=seq.replace(/U/g,"T");
    if(!/^[ACGT]+$/.test(dna))throw Error(name+": coding DNA/RNA must contain only A, C, G, T or U.");
    if(dna.length<6||dna.length>183||dna.length%3)throw Error(name+": coding region must be 6–183 bases (2–60 amino acids, with optional terminal stop), divisible by 3.");
    const aas=[];
    for(let pos=0;pos<dna.length;pos+=3){
      const aa=CODONS[dna.slice(pos,pos+3)];
      if(!aa)throw Error(name+": unrecognized codon at base "+(pos+1)+".");
      if(aa==="*"&&pos!==dna.length-3)throw Error(name+": internal stop codon at position "+(pos+1)+".");
      if(aa!=="*")aas.push(aa);
    }
    const peptide=aas.join("");
    if(peptide.length<2)throw Error(name+": the translation must encode at least two amino acids.");
    return {id:i,name,peptide,dna,kind:"seed",source:"User coding DNA/RNA",dnaOrigin:"User-provided sequence",mutation:""};
  }
  function parsePositions(raw,length){
    const t=String(raw||"").trim();
    if(!t)throw Error("Enter one or more 1-based positions to generate single-substitution variants.");
    if(!/^[0-9,;\s]+$/.test(t))throw Error("Mutation positions must be whole numbers separated by commas, for example 3,5,8.");
    const parts=t.split(/[,;\s]+/).filter(Boolean);
    const positions=[...new Set(parts.map(Number))];
    if(!positions.length||positions.length>12||positions.some(n=>!Number.isSafeInteger(n)||n<1||n>length)){
      throw Error("Use 1–12 unique mutation positions within every input peptide (1–"+length+").");
    }
    return positions.sort((a,b)=>a-b);
  }
  function build({raw,type="peptide",positions="",variants=false}={}){
    const seeds=records(raw).map((r,i)=>normalizeEntry(r.raw,type,r.name,i+1));
    let predicted=seeds.length;
    const bySeed=[];
    if(variants){
      for(const s of seeds){
        const p=parsePositions(positions,s.peptide.length);
        predicted+=p.length*(AA.length-1);
        bySeed.push(p);
      }
    }
    if(predicted>MAX_LIBRARY)throw Error("This design requests up to "+predicted.toLocaleString()+" entries. Reduce seed sequences or mutation positions (maximum "+MAX_LIBRARY.toLocaleString()+").");
    const entries=[],seen=new Set();
    function add(e){
      const key=e.peptide+"|"+e.dna;
      if(seen.has(key))return;
      seen.add(key);entries.push(e);
    }
    for(let i=0;i<seeds.length;i++){
      const seed=seeds[i];add(seed);
      if(!variants)continue;
      for(const position of bySeed[i]){
        const before=seed.peptide[position-1];
        for(const after of AA){
          if(after===before)continue;
          const peptide=seed.peptide.slice(0,position-1)+after+seed.peptide.slice(position);
          const dna=seed.dna.slice(0,(position-1)*3)+DNA_BY_AA[after]+seed.dna.slice(position*3);
          // Original codons elsewhere, including an optional terminal stop, remain unchanged.
          add({id:entries.length+1,name:seed.name,peptide,dna,kind:"single substitution",
               source:seed.source,dnaOrigin:"Computational variant; one substituted codon",
               mutation:before+position+after});
        }
      }
    }
    return {seeds:seeds.length,variants:entries.filter(e=>e.kind!=="seed").length,
            total:entries.length,entries,maxLibrary:MAX_LIBRARY};
  }
  function fasta(entries,which="peptide"){
    if(!["peptide","dna"].includes(which))throw Error("Choose peptide or DNA FASTA export.");
    return entries.map((e,i)=>{
      const seq=which==="peptide"?e.peptide:e.dna;
      const label=String(e.name||"Sequence_"+(i+1)).replace(/[^A-Za-z0-9_.-]+/g,"_").slice(0,60);
      const id=label+"_"+(i+1)+(e.mutation?"_"+e.mutation:"");
      return ">"+id+"|"+e.kind.replace(/\s+/g,"_")+"\n"+(seq.match(/.{1,70}/g)||[]).join("\n");
    }).join("\n")+"\n";
  }
  return Object.freeze({AA,MAX_SEEDS,MAX_LIBRARY,records,parsePositions,build,fasta});
});
