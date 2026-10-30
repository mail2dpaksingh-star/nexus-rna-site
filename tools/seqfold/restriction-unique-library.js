/* NEXUS extended restriction-site map — display-only v1.1.
 * Enzyme recognition / canonical offsets curated from Biopython's
 * REBASE-derived Bio.Restriction data (see README). 53 palindromic enzymes.
 * Does NOT alter the original restriction digest or cloning engines.
 */
(function(root){
 'use strict';
 const ENZYMES=[["AatII","GACGTC",5],["AflII","CTTAAG",1],["AgeI","ACCGGT",1],["ApaI","GGGCCC",5],["AscI","GGCGCGCC",2],["AvrII","CCTAGG",1],["BamHI","GGATCC",1],["BclI","TGATCA",1],["BglII","AGATCT",1],["BsaBI","GATNNNNATC",5],["BspEI","TCCGGA",1],["BspHI","TCATGA",1],["BssHII","GCGCGC",1],["BstBI","TTCGAA",2],["BstZ17I","GTATAC",3],["ClaI","ATCGAT",2],["DraI","TTTAAA",3],["EagI","CGGCCG",1],["EcoRI","GAATTC",1],["EcoRV","GATATC",3],["FseI","GGCCGGCC",6],["HaeIII","GGCC",2],["HincII","GTYRAC",3],["HindIII","AAGCTT",1],["HpaI","GTTAAC",3],["KpnI","GGTACC",5],["MfeI","CAATTG",1],["MluI","ACGCGT",1],["MscI","TGGCCA",3],["NaeI","GCCGGC",3],["NarI","GGCGCC",2],["NcoI","CCATGG",1],["NdeI","CATATG",2],["NheI","GCTAGC",1],["NotI","GCGGCCGC",2],["NruI","TCGCGA",3],["PacI","TTAATTAA",5],["PmeI","GTTTAAAC",4],["PstI","CTGCAG",5],["PvuI","CGATCG",4],["PvuII","CAGCTG",3],["SacI","GAGCTC",5],["SalI","GTCGAC",1],["ScaI","AGTACT",3],["SmaI","CCCGGG",3],["SnaBI","TACGTA",3],["SpeI","ACTAGT",1],["SphI","GCATGC",5],["SspI","AATATT",3],["StuI","AGGCCT",3],["XbaI","TCTAGA",1],["XhoI","CTCGAG",1],["XmaI","CCCGGG",1]];
 const IUPAC={A:'A',C:'C',G:'G',T:'T',R:'[AG]',Y:'[CT]',S:'[GC]',W:'[AT]',K:'[GT]',M:'[AC]',B:'[CGT]',D:'[AGT]',H:'[ACT]',V:'[ACG]',N:'[ACGT]'};
 const compiled=ENZYMES.map(([name,motif,offset])=>({name,motif,offset,rx:new RegExp('^'+[...motif].map(ch=>IUPAC[ch]).join('')+'$')}));
 function analyze(record){
   if(!record || typeof record.sequence!=='string') throw Error('No active plasmid sequence.');
   const s=record.sequence.replace(/\s/g,'').toUpperCase().replace(/U/g,'T');
   if(!s || /[^ACGT]/.test(s)) throw Error('A complete A/C/G/T sequence is required for reliable unique-site classification.');
   const circular=record.circular!==false,n=s.length;
   const features=(record.features||[]).filter(f=>/\bMCS\b|polylinker|multiple cloning/i.test(String(f.label||'')));
   const mcs=features.map(f=>[Number(f.start),Number(f.end)]).filter(a=>a.every(x=>Number.isInteger(x)&&x>=1&&x<=n));
   const hits=[],byEnzyme=[];
   for(const enzyme of compiled){
     const m=enzyme.motif.length,search=circular?s+s.slice(0,m-1):s;
     const positions=[];
     const count=circular?n:Math.max(0,n-m+1);
     for(let i=0;i<count;i++)if(enzyme.rx.test(search.slice(i,i+m))){
       const start=i+1;
       const cut=(i+enzyme.offset)%n; // 0-based cleavage boundary, not a base coordinate
       const inMCS=mcs.some(([a,b])=>a<=b?(start>=a&&start<=b):(start>=a||start<=b));
       positions.push({enzyme:enzyme.name,recognition:enzyme.motif,start,cutBoundary:cut,inMCS});
     }
     if(positions.length){
       const isUnique=positions.length===1;
       for(const hit of positions){hit.unique=isUnique;hit.count=positions.length; hits.push(hit);}
       byEnzyme.push({enzyme:enzyme.name,recognition:enzyme.motif,count:positions.length,positions:positions.map(h=>h.start),mcs:positions.some(h=>h.inMCS),unique:isUnique});
     }
   }
   hits.sort((a,b)=>a.start-b.start||a.enzyme.localeCompare(b.enzyme));
   byEnzyme.sort((a,b)=>a.enzyme.localeCompare(b.enzyme));
   return {name:record.name||'Plasmid',sequenceLength:n,circular,mcs,hits,enzymes:byEnzyme,librarySize:compiled.length};
 }
 root.NEXUS_RE_UNIQUE={version:'1.1',librarySize:compiled.length,analyze};
})(window);
