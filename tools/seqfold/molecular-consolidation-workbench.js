/* NEXUS workbench visibility bridge: keeps old engines and direct DNA handoffs working. */
(function(){
  'use strict';
  const qs=new URLSearchParams(location.search);
  const embedded=qs.get('nexusMolecular')==='1';
  // DNA Cloning Export historically navigates directly to this URL. Send it
  // to Molecular Design Studio BEFORE the old transfer receiver clears storage.
  if(!embedded && location.hash==='#nexus-plasmid-assembly'){
    location.replace('advanced.html#plasmids');
    return;
  }
  function setup(){
    if(embedded){
      document.body.classList.add('nexus-plasmid-embedded');
      const mode=(qs.get('view')==='digest'?'digest':'annotation');
      const tab=document.querySelector('.tabs button[data-pane="'+mode+'"]');
      if(tab)tab.click();
      const all=document.querySelectorAll('.tabs button[data-pane]');
      all.forEach(b=>{if(b.dataset.pane!=='annotation'&&b.dataset.pane!=='digest'){b.hidden=true;b.tabIndex=-1;b.setAttribute('aria-hidden','true');}});
      // Other workbench modules still exist in source, for shared JS dependencies.
    }else{
      document.body.classList.add('nexus-sequence-only');
      const top=document.querySelector('main.work');
      if(top && !document.getElementById('nexus-design-moved')){
        const note=document.createElement('div');note.id='nexus-design-moved';
        note.innerHTML='<strong>Plasmid tools have moved.</strong> Plasmid maps, vector selection, MCS cloning and restriction digest are now together in <a href="advanced.html#plasmids">Molecular Design Studio</a>. Sequence comparison and read-analysis tools remain here.';
        top.insertBefore(note,top.firstChild);
      }
      const hero=document.querySelector('.hero p');
      if(hero)hero.textContent='Compare and align DNA sequences, inspect Sanger traces, assemble reads, and analyze GenBank features. For plasmid maps and restriction digests, open Molecular Design Studio.';
      ['Annotated plasmid maps','Multi-enzyme digest','Virtual gel'].forEach(label=>{
        document.querySelectorAll('.hero .pill').forEach(p=>{if(p.textContent.trim()===label)p.remove();});
      });
      const hidden=['annotation','digest'];
      document.querySelectorAll('.tabs button[data-pane]').forEach(b=>{
        if(hidden.includes(b.dataset.pane)){b.hidden=true;b.tabIndex=-1;b.setAttribute('aria-hidden','true');}
      });
      const msa=document.querySelector('.tabs button[data-pane="msa"]');
      if(msa)msa.click();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();
