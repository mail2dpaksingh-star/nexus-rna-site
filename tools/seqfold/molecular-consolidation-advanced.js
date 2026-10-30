/* NEXUS molecular consolidation: user-facing integration, NOT a new cloning engine. */
(function(){
  'use strict';
  document.body.classList.add('nexus-molecular-consolidated');
  const newTab=document.querySelector('.tabs button[data-pane="plasmids"]');
  const pane=document.getElementById('pane-plasmids');
  if(!newTab||!pane)return;
  const legacyTabs=document.querySelectorAll('.tabs button[data-pane="library"], .tabs button[data-pane="clone"]');
  legacyTabs.forEach(b=>{b.hidden=true;b.setAttribute('aria-hidden','true');b.tabIndex=-1;});
  const links=document.querySelectorAll('[aria-label="Quick open molecular biology tools"] a');
  links.forEach(a=>{
    if(a.getAttribute('href')==='#library'){
      a.setAttribute('href','#plasmids');a.textContent='Plasmid maps & cloning';
    }else if(a.getAttribute('href')==='#clone'){
      a.remove();
    }
  });
  const pills=document.querySelectorAll('.hero .pills .pill');
  if(pills.length>=4){pills[0].textContent='01 Plasmid maps & cloning';pills[1].textContent='02 Codon optimization';pills[2].remove();pills[3].textContent='03 Primer design';}
  const hero=document.querySelector('.hero p');
  if(hero)hero.textContent='One workspace for annotated plasmid maps, MCS and restriction-site cloning, virtual digests, codon optimization and primer design. Plasmid tools share the latest NEXUS sequence and annotation engine; calculations run in your browser.';
  function selectPlasmids(){
    // advanced-ui.js attaches its normal tab handler to this static button.
    newTab.click();
    document.querySelectorAll('.tabs button[data-pane]').forEach(b=>{
      const selected=b===newTab;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));
    });
    document.querySelectorAll('section.pane').forEach(p=>p.hidden=p!==pane);
  }
  function legacyHash(){
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash==='library'||hash==='clone'||hash==='plasmid'||hash==='plasmids'||!hash){
      selectPlasmids();
      if(hash==='library'||hash==='clone'||hash==='plasmid')history.replaceState(null,'','#plasmids');
    }
  }
  window.addEventListener('hashchange',legacyHash);
  legacyHash();
  const frame=document.getElementById('nexus-plasmid-workspace-frame');
  if(!frame)return;
  let transferPending=false;
  try{transferPending=!!sessionStorage.getItem('nexus-dna-plasmid-transfer-v1');}catch(_){/* privacy mode: file import remains available */}
  const frameURL='workbench.html?nexusMolecular=1&view=annotation'+(transferPending?'#nexus-plasmid-assembly':'');
  frame.addEventListener('load',()=>{
    try{
      const child=frame.contentDocument;
      if(!child || child.location.href==='about:blank')return;
      const resize=()=>{
        const h=Math.max(900,Math.min(12000,Math.ceil(Math.max(child.body.scrollHeight,child.documentElement.scrollHeight))+40));
        if(frame.style.height!==h+'px')frame.style.height=h+'px';
      };
      resize();
      if(transferPending)frame.scrollIntoView({block:'start'});
      if(window.ResizeObserver){new ResizeObserver(resize).observe(child.body);}
      // Some content initially hidden by tabs changes layout only after click.
      child.querySelectorAll('button[data-pane]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(resize)));
    }catch(_){/* same-origin iframe normally permits measurement; fallback min-height remains */}
  });
  frame.src=frameURL;
  // Keep the existing "Use as cloning insert" button useful after hiding the
  // duplicate legacy cloning planner. Route a generated CDS into the shared editor.
  const codonToClone=document.getElementById('codon-to-clone');
  if(codonToClone){
    codonToClone.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const out=(document.getElementById('codon-output')?.textContent||'').replace(/\s/g,'').toUpperCase();
      const total=Number((document.getElementById('codon-length')?.textContent||'').replace(/,/g,''));
      const status=document.getElementById('codon-status');
      if(!out || /[^ACGT]/.test(out) || (Number.isFinite(total)&&total!==out.length)){
        if(status)status.textContent='Generate a complete coding sequence first. For constructs above 3,000 nt, download FASTA and import the file into Plasmid maps & cloning.';
        return;
      }
      try{
        sessionStorage.setItem('nexus-dna-plasmid-transfer-v1',JSON.stringify({
          format:'nexus-dna-cloning-insert-v1',sequence:out,length:out.length,
          features:[{label:'Synonymous coding sequence',type:'CDS',start:1,end:out.length,strand:'+'}],
          source:'Molecular Design Studio codon optimization'
        }));
        selectPlasmids();
        frame.src='workbench.html?nexusMolecular=1&view=annotation&source=codon#nexus-plasmid-assembly';
      }catch(_){
        if(status)status.textContent='Browser storage is unavailable. Download the coding FASTA, then import it into Plasmid maps & cloning.';
      }
    },true);
  }
})();
