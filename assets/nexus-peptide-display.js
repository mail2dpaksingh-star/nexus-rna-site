/* mRNA-display peptide library: in-silico design and selection-data exploration.
   No remote APIs, external dependencies or experimental-binder predictions. */
(function(){
  "use strict";
  const TARGET="#mrna-display-library";
  const CUSTOM=window.NexusPeptideLibraryCore;
  const GENETIC_CODE={
    TTT:"F",TTC:"F",TTA:"L",TTG:"L",TCT:"S",TCC:"S",TCA:"S",TCG:"S",
    TAT:"Y",TAC:"Y",TAA:"*",TAG:"*",TGT:"C",TGC:"C",TGA:"*",TGG:"W",
    CTT:"L",CTC:"L",CTA:"L",CTG:"L",CCT:"P",CCC:"P",CCA:"P",CCG:"P",
    CAT:"H",CAC:"H",CAA:"Q",CAG:"Q",CGT:"R",CGC:"R",CGA:"R",CGG:"R",
    ATT:"I",ATC:"I",ATA:"I",ATG:"M",ACT:"T",ACC:"T",ACA:"T",ACG:"T",
    AAT:"N",AAC:"N",AAA:"K",AAG:"K",AGT:"S",AGC:"S",AGA:"R",AGG:"R",
    GTT:"V",GTC:"V",GTA:"V",GTG:"V",GCT:"A",GCC:"A",GCA:"A",GCG:"A",
    GAT:"D",GAC:"D",GAA:"E",GAG:"E",GGT:"G",GGC:"G",GGA:"G",GGG:"G"
  };
  function codons(scheme){
    const bases="ACGT", second=scheme==="NDT"?"AGT":bases;
    const third=scheme==="NDT"?"T":scheme==="NNS"?"CG":"GT";
    const out=[];
    for(const a of bases)for(const b of second)for(const c of third)out.push(a+b+c);
    return out;
  }
  function randomIndex(max){
    if(window.crypto&&typeof window.crypto.getRandomValues==="function"){
      const a=new Uint32Array(1);window.crypto.getRandomValues(a);return a[0]%max;
    }
    return Math.floor(Math.random()*max);
  }
  function fmtPower(base,n){
    const v=BigInt(base)**BigInt(n);
    return v.toLocaleString("en-US")+" (~"+Math.pow(base,n).toExponential(2)+")";
  }
  const dialog=document.createElement("dialog");
  dialog.id="nexus-mrna-display-dialog";
  dialog.className="nmd-dialog";
  dialog.setAttribute("aria-labelledby","nmd-title");
  dialog.innerHTML=[
  '<header class="nmd-head"><p class="nmd-eyebrow">NEXUS · Peptide Discovery</p>',
  '<h2 id="nmd-title">mRNA Display · Peptide Library</h2>',
  '<p class="nmd-intro">Design exploratory peptide libraries and compare selection-round sequence counts using published mRNA-display principles. No experimental screening or binder-affinity claims.</p>',
  '<button class="nmd-close" id="nmd-close" aria-label="Close peptide library workbench" type="button">×</button></header>',
  '<div class="nmd-body"><div class="nmd-tabs" role="tablist" aria-label="Library workflows">',
  '<button class="nmd-tab" type="button" data-nmd-tab="custom" role="tab" aria-selected="true">Add my sequences</button><button class="nmd-tab" type="button" data-nmd-tab="design" role="tab" aria-selected="false">Randomized library</button>',
  '<button class="nmd-tab" type="button" data-nmd-tab="analysis" role="tab" aria-selected="false">Selection enrichment</button></div>',
  '<section class="nmd-section" data-nmd-pane="custom" role="tabpanel">',
  '<h3>Build a peptide library from your own sequences</h3>',
  '<p class="nmd-help">Paste sequences directly or import a FASTA, CSV or text file. Choose peptide or coding DNA/RNA input; no account is required. Each input sequence becomes a library entry.</p>',
  '<div class="nmd-grid nmd-custom-grid">',
  '<div class="nmd-field"><label for="nmd-custom-type">Sequence type</label><select id="nmd-custom-type"><option value="peptide">Peptide amino-acid sequence</option><option value="dna">Coding DNA / RNA (5′→3′)</option></select></div>',
  '<div class="nmd-field"><label for="nmd-custom-file">Import your sequence file</label><input type="file" id="nmd-custom-file" accept=".fa,.fasta,.faa,.fna,.txt,.csv,.tsv" aria-label="Import peptide or coding DNA sequences"></div></div>',
  '<div class="nmd-field"><label for="nmd-custom-input">Paste your sequences here</label>',
  '<textarea id="nmd-custom-input" spellcheck="false" rows="7" placeholder=">Peptide_1&#10;GWRYVL&#10;>Peptide_2&#10;LNWKFV"></textarea></div>',
  '<p class="nmd-help" id="nmd-custom-hint">Use one peptide per line, multi-record FASTA, or name,sequence CSV. Supports 2–60 standard amino acids per peptide and up to 1,000 input sequences. Uploaded sequences remain in your browser.</p>',
  '<div class="nmd-field"><label for="nmd-custom-positions">Optional positions to mutate (1-based)</label>',
  '<input id="nmd-custom-positions" type="text" placeholder="e.g. 3,5,8" spellcheck="false"></div>',
  '<p class="nmd-help">To create additional peptide variants, enter positions and select Generate single substitutions. Each selected position is replaced with each of the 19 alternative amino acids, one change at a time; up to 2,000 total entries.</p>',
  '<div class="nmd-controls"><button type="button" class="nmd-primary" id="nmd-custom-build">Build library from my sequences</button>',
  '<button type="button" class="nmd-secondary" id="nmd-custom-mutate">Generate single substitutions</button>',
  '<button type="button" class="nmd-secondary" id="nmd-custom-example">Load example</button></div>',
  '<p class="nmd-status" id="nmd-custom-status" role="status" aria-live="polite"></p>',
  '<div class="nmd-metrics"><div class="nmd-metric"><strong id="nmd-custom-seeds">—</strong><span>Original sequences</span></div>',
  '<div class="nmd-metric"><strong id="nmd-custom-variants">—</strong><span>Generated variants</span></div>',
  '<div class="nmd-metric"><strong id="nmd-custom-total">—</strong><span>Library entries</span></div></div>',
  '<div class="nmd-table-wrap"><table><thead><tr><th>Source</th><th>Peptide (AA)</th><th>Coding DNA (5′→3′)</th><th>Mutation</th></tr></thead>',
  '<tbody id="nmd-custom-table"><tr><td colspan="4">Add or import sequences to build your library.</td></tr></tbody></table></div>',
  '<div class="nmd-controls"><button type="button" class="nmd-secondary" id="nmd-custom-csv" disabled>Export library CSV</button>',
  '<button type="button" class="nmd-secondary" id="nmd-custom-aa-fasta" disabled>Export peptide FASTA</button>',
  '<button type="button" class="nmd-secondary" id="nmd-custom-dna-fasta" disabled>Export coding DNA FASTA</button></div>',
  '<p class="nmd-disclaimer">Peptide input is reverse-translated to one illustrative DNA coding sequence per peptide; no codon optimization or biological expression prediction is implied. DNA/RNA input is translated in the supplied reading frame, allowing an optional terminal stop codon. This is a computational sequence library, not a synthesis-ready mRNA-display template: promoters, translation initiation, genotype–phenotype fusion, puromycin linkers, cyclization, selection and target binding are not established.</p>',
  '</section>',
  '<section class="nmd-section" data-nmd-pane="design" role="tabpanel" hidden>',
  '<div class="nmd-grid">',
  '<div class="nmd-field"><label for="nmd-pattern">Codon randomization</label><select id="nmd-pattern"><option value="NNK">NNK · 32 codons</option><option value="NNS">NNS · 32 codons</option><option value="NDT">NDT · 12 amino acids</option></select></div>',
  '<div class="nmd-field"><label for="nmd-positions">Random peptide positions</label><input id="nmd-positions" type="number" min="4" max="18" step="1" value="10"></div>',
  '<div class="nmd-field"><label for="nmd-scaffold">Peptide architecture</label><select id="nmd-scaffold"><option value="linear">Linear peptide</option><option value="cys">Cysteine-flanked concept</option></select></div></div>',
  '<p class="nmd-help">NNK/NNS encode all 20 standard amino acids but each contain one stop codon. NDT encodes 12 amino acids without a stop codon. Cysteine flanks are a design motif, not proof of cyclization.</p>',
  '<div class="nmd-metrics"><div class="nmd-metric"><strong id="nmd-aa-diversity">—</strong><span>Unique amino-acid combinations (theoretical)</span></div>',
  '<div class="nmd-metric"><strong id="nmd-dna-diversity">—</strong><span>Degenerate coding-region variants</span></div>',
  '<div class="nmd-metric"><strong id="nmd-stop">—</strong><span>Random-region premature-stop probability</span></div></div>',
  '<div class="nmd-controls"><button type="button" class="nmd-primary" id="nmd-generate">Generate 12 example variants</button><button type="button" class="nmd-secondary" id="nmd-download" disabled>Export peptide/DNA CSV</button></div>',
  '<div class="nmd-output"><h3>Illustrative coding variants</h3><pre id="nmd-examples">Choose settings and generate examples. The sequences are computational samples, not experimentally selected binders.</pre></div>',
  '<p class="nmd-disclaimer">This is a computational library-planning utility, not a physical mRNA-display system. Practical genotype–phenotype linkage, puromycin fusion, cell-free translation, macrocyclization and target selection require laboratory development and appropriate IP review.</p>',
  '</section>',
  '<section class="nmd-section" data-nmd-pane="analysis" role="tabpanel" hidden>',
  '<div class="nmd-field"><label for="nmd-counts">Paste sequencing counts (CSV or tab-delimited)</label>',
  '<textarea id="nmd-counts" spellcheck="false" placeholder="peptide,round1_count,round2_count&#10;GWRYVL,120,960&#10;LNWRFV,240,180"></textarea></div>',
  '<p class="nmd-help">Required columns: peptide, baseline count, selected-round count. Duplicates are pooled. Enrichment uses per-round count normalization and a 0.5 pseudocount.</p>',
  '<div class="nmd-controls"><button type="button" class="nmd-primary" id="nmd-analyze">Analyze enrichment</button><button type="button" class="nmd-secondary" id="nmd-export-counts" disabled>Export ranked CSV</button></div>',
  '<p class="nmd-status" id="nmd-status" role="status" aria-live="polite"></p>',
  '<div class="nmd-table-wrap"><table><thead><tr><th>Peptide</th><th>Baseline</th><th>Selected</th><th>Normalized fold</th></tr></thead><tbody id="nmd-table"><tr><td colspan="4">No selection data analyzed.</td></tr></tbody></table></div>',
  '<p class="nmd-disclaimer">Sequencing enrichment is evidence of relative selection frequency, not evidence of a measured binding constant, potency, specificity, or target engagement. Compare experiments only when their controls and rounds are compatible.</p>',
  '</section></div>',
  '<footer class="nmd-footer">Research-stage analysis · Sequences and counts are processed in your browser. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8725378/" target="_blank" rel="noopener noreferrer">Scientific background</a></footer>'
  ].join("");
  document.body.appendChild(dialog);
  const el=id=>dialog.querySelector("#"+id);
  let examples=[],ranked=[],customLibrary=null;
  function openDialog(){
    if(!dialog.open){
      if(typeof dialog.showModal==="function")dialog.showModal();
      else dialog.setAttribute("open","");
    }
    el("nmd-close").focus();
  }
  function closeDialog(){
    if(typeof dialog.close==="function"&&dialog.open)dialog.close();
    else dialog.removeAttribute("open");
  }
  function selectTab(name){
    dialog.querySelectorAll("[data-nmd-tab]").forEach(b=>{
      const chosen=b.dataset.nmdTab===name;b.setAttribute("aria-selected",String(chosen));
    });
    dialog.querySelectorAll("[data-nmd-pane]").forEach(p=>{p.hidden=p.dataset.nmdPane!==name;});
  }
  function resetCustomResults(message=""){
    customLibrary=null;
    for(const id of ["nmd-custom-csv","nmd-custom-aa-fasta","nmd-custom-dna-fasta"])el(id).disabled=true;
    for(const id of ["nmd-custom-seeds","nmd-custom-variants","nmd-custom-total"])el(id).textContent="—";
    const table=el("nmd-custom-table");
    table.replaceChildren();
    const tr=table.insertRow();tr.insertCell().colSpan=4;tr.cells[0].textContent="Build a library to view its sequences.";
    el("nmd-custom-status").textContent=message;
  }
  function renderCustomLibrary(library){
    const t=el("nmd-custom-table");t.replaceChildren();
    for(const record of library.entries.slice(0,40)){
      const tr=t.insertRow();
      for(const value of [record.name,record.peptide,record.dna,record.mutation||"Original"]){
        const td=tr.insertCell();td.textContent=value;
      }
    }
    el("nmd-custom-seeds").textContent=library.seeds.toLocaleString();
    el("nmd-custom-variants").textContent=library.variants.toLocaleString();
    el("nmd-custom-total").textContent=library.total.toLocaleString();
    for(const id of ["nmd-custom-csv","nmd-custom-aa-fasta","nmd-custom-dna-fasta"])el(id).disabled=false;
    el("nmd-custom-status").textContent="Library ready: "+library.seeds+" input sequence(s), "+
      library.variants+" generated variant(s), "+library.total+" unique entry/entries. "+
      "Showing the first "+Math.min(40,library.total)+"; export for the complete library.";
  }
  function buildCustom(variants){
    try{
      if(!CUSTOM)throw Error("The sequence library engine is unavailable. Reload the site.");
      const library=CUSTOM.build({raw:el("nmd-custom-input").value,
        type:el("nmd-custom-type").value,positions:el("nmd-custom-positions").value,variants});
      customLibrary=library;
      renderCustomLibrary(library);
    }catch(error){resetCustomResults(error.message||String(error));}
  }
  async function importCustomFile(file){
    if(!file)return;
    try{
      if(file.size>250000)throw Error("Select a sequence file below 250 KB.");
      const raw=await file.text();
      if(!raw.trim())throw Error("The selected sequence file is empty.");
      el("nmd-custom-input").value=raw;
      resetCustomResults("Loaded "+file.name+". Choose the sequence type and click Build library from my sequences.");
    }catch(error){el("nmd-custom-status").textContent=error.message||String(error);}
  }
  function saveText(name,content,type="text/plain;charset=utf-8"){
    const blob=new Blob([content],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function settings(){
    const s=el("nmd-pattern").value;
    const n=Math.max(4,Math.min(18,Math.round(Number(el("nmd-positions").value)||10)));
    el("nmd-positions").value=n;
    return {s,n,cys:el("nmd-scaffold").value==="cys"};
  }
  function renderDesign(){
    const p=settings(),dna=codons(p.s),aa=[...new Set(dna.map(c=>GENETIC_CODE[c]).filter(x=>x!=="*"))];
    el("nmd-aa-diversity").textContent=fmtPower(aa.length,p.n);
    el("nmd-dna-diversity").textContent=fmtPower(dna.length,p.n);
    const stops=dna.filter(c=>GENETIC_CODE[c]==="*").length;
    const risk=100*(1-Math.pow(1-stops/dna.length,p.n));
    el("nmd-stop").textContent=risk.toFixed(1)+"%";
    examples=[];el("nmd-download").disabled=true;
    el("nmd-examples").textContent="Generate illustrative variants to inspect peptide sequences and matching DNA codons.";
  }
  function generate(){
    const p=settings(),pool=codons(p.s).filter(c=>GENETIC_CODE[c]!=="*");
    const seen=new Set();examples=[];let tries=0;
    while(examples.length<12&&tries++<500){
      const chosen=Array.from({length:p.n},()=>pool[randomIndex(pool.length)]);
      const randomPep=chosen.map(c=>GENETIC_CODE[c]).join("");
      const peptide=(p.cys?"C":"")+randomPep+(p.cys?"C":"");
      if(seen.has(peptide))continue;
      seen.add(peptide);
      const dna=(p.cys?"TGT":"")+chosen.join("")+(p.cys?"TGT":"");
      examples.push({peptide,dna});
    }
    el("nmd-examples").textContent=examples.map((r,i)=>
      String(i+1).padStart(2,"0")+"  "+r.peptide+"   |   DNA: "+r.dna
    ).join("\n");
    el("nmd-download").disabled=examples.length===0;
  }
  function csvCell(value){const s=String(value);return '"'+s.replace(/"/g,'""')+'"';}
  function saveCsv(name,rows){
    const blob=new Blob([rows.map(r=>r.map(csvCell).join(",")).join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function analyze(){
    const text=el("nmd-counts").value.trim(),status=el("nmd-status");
    ranked=[];el("nmd-export-counts").disabled=true;
    const rows=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const pooled=new Map();let invalid=0;
    for(const raw of rows){
      const fields=raw.split(/[\t,]/).map(x=>x.trim().replace(/^"|"$/g,""));
      if(fields.length<3){invalid++;continue;}
      if(/^peptide|sequence$/i.test(fields[0]))continue;
      const peptide=fields[0].toUpperCase(),a=Number(fields[1]),b=Number(fields[2]);
      if(!/^[ACDEFGHIKLMNPQRSTVWY]{2,60}$/.test(peptide)||!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b<0){invalid++;continue;}
      const current=pooled.get(peptide)||{peptide,a:0,b:0};
      current.a+=a;current.b+=b;pooled.set(peptide,current);
    }
    if(!pooled.size){status.textContent="Enter valid peptide and two nonnegative integer count columns.";renderTable([]);return;}
    const data=[...pooled.values()],k=data.length;
    const s1=data.reduce((n,r)=>n+r.a,0),s2=data.reduce((n,r)=>n+r.b,0);
    if(s1===0||s2===0){status.textContent="Each selection round needs at least one count above zero.";renderTable([]);return;}
    ranked=data.map(r=>{
      const f=((r.b+0.5)/(s2+0.5*k))/((r.a+0.5)/(s1+0.5*k));
      return {...r,fold:f};
    }).sort((a,b)=>b.fold-a.fold);
    renderTable(ranked.slice(0,40));
    status.textContent="Compared "+k+" unique peptide sequences; "+invalid+" ignored row(s). Showing up to 40 highest normalized enrichment values.";
    el("nmd-export-counts").disabled=false;
  }
  function renderTable(rows){
    const tb=el("nmd-table");tb.replaceChildren();
    if(!rows.length){const tr=tb.insertRow();tr.insertCell().colSpan=4;tr.cells[0].textContent="No valid results to display.";return;}
    for(const r of rows){
      const tr=tb.insertRow();
      for(const v of [r.peptide,r.a.toLocaleString(),r.b.toLocaleString(),r.fold.toFixed(2)+"×"]){
        tr.insertCell().textContent=v;
      }
    }
  }
  el("nmd-custom-build").addEventListener("click",()=>buildCustom(false));
  el("nmd-custom-mutate").addEventListener("click",()=>buildCustom(true));
  el("nmd-custom-example").addEventListener("click",()=>{
    el("nmd-custom-type").value="peptide";
    el("nmd-custom-input").value=">Example_Peptide_1\nGWRYVL\n>Example_Peptide_2\nLNWKFV";
    el("nmd-custom-positions").value="3";
    resetCustomResults("Illustrative example loaded. Click Build library or Generate single substitutions.");
  });
  el("nmd-custom-file").addEventListener("change",event=>{
    const file=event.target.files?.[0];event.target.value="";
    if(file)void importCustomFile(file);
  });
  for(const id of ["nmd-custom-input","nmd-custom-positions","nmd-custom-type"]){
    el(id).addEventListener(id==="nmd-custom-type"?"change":"input",()=>{
      resetCustomResults("Input changed. Rebuild the library to update results and exports.");
      if(id==="nmd-custom-type"){
        const dna=el(id).value==="dna";
        el("nmd-custom-hint").textContent=dna
          ?"Enter coding DNA/RNA (A/C/G/T/U), 5′→3′, in the reading frame: one sequence per line, FASTA, or name,sequence CSV. Codons are translated; a terminal stop is allowed. RNA U is converted to DNA T."
          :"Use one peptide per line, multi-record FASTA, or name,sequence CSV. Supports 2–60 standard amino acids per peptide and up to 1,000 sequences.";
      }
    });
  }
  el("nmd-custom-csv").addEventListener("click",()=>{
    if(!customLibrary)return;
    saveCsv("nexus-display-my-peptide-library.csv",
      [["source_name","peptide_aa","coding_DNA_5to3","entry_type","single_mutation","DNA_origin"],
       ...customLibrary.entries.map(r=>[r.name,r.peptide,r.dna,r.kind,r.mutation,r.dnaOrigin])]);
  });
  el("nmd-custom-aa-fasta").addEventListener("click",()=>{
    if(customLibrary&&CUSTOM)saveText("nexus-display-peptides.fasta",CUSTOM.fasta(customLibrary.entries,"peptide"));
  });
  el("nmd-custom-dna-fasta").addEventListener("click",()=>{
    if(customLibrary&&CUSTOM)saveText("nexus-display-coding-DNA.fasta",CUSTOM.fasta(customLibrary.entries,"dna"));
  });
  el("nmd-close").addEventListener("click",closeDialog);
  dialog.querySelectorAll("[data-nmd-tab]").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.nmdTab)));
  ["nmd-pattern","nmd-positions","nmd-scaffold"].forEach(id=>el(id).addEventListener("change",renderDesign));
  el("nmd-generate").addEventListener("click",generate);
  el("nmd-download").addEventListener("click",()=>{if(examples.length)saveCsv("nexus-display-library-variants.csv",[["peptide","coding_DNA"],...examples.map(r=>[r.peptide,r.dna])]);});
  el("nmd-analyze").addEventListener("click",analyze);
  el("nmd-export-counts").addEventListener("click",()=>{if(ranked.length)saveCsv("nexus-display-selection-enrichment.csv",[["peptide","baseline_count","selected_count","normalized_fold"],...ranked.map(r=>[r.peptide,r.a,r.b,r.fold.toFixed(4)])]);});
  document.addEventListener("click",event=>{
    const a=event.target.closest('a[href="#mrna-display-library"]');
    if(a){event.preventDefault();const menu=a.closest("details");if(menu)menu.open=false;openDialog();}
  });
  if(location.hash===TARGET){window.requestAnimationFrame(openDialog);}
  renderDesign();
})();
