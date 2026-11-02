/* Embedded-only SeqFold user interface. Original scientific calculations are unchanged. */
(function(){
 'use strict';
 if(new URLSearchParams(location.search).get('nexusEmbedded')!=='1')return;
 document.body.classList.add('nexus-seqfold-embedded');
 // Hide the old lower-page Molecular Design cards, which duplicate the parent studio.
 for(const section of document.querySelectorAll('body > section')){
   if(section.textContent.includes('Molecular Design & Cloning Tools')){section.hidden=true;section.setAttribute('aria-hidden','true');}
 }
 const bar=document.querySelector('.tab-bar');
 if(!bar)return;
 // The standalone SeqFold engine already has ORF and folding panes, but older
 // revisions do not include visible tabs for them. Reuse their existing buttons.
 for(const [id,label] of [['orf','ORF explorer'],['fold','RNA folding']]){
   if(bar.querySelector('[data-tab="'+id+'"]'))continue;
   const button=document.createElement('button');button.type='button';
   button.className='tab nexus-seqfold-module-tab';button.dataset.tab=id;
   button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-selected','false');
   bar.appendChild(button);
   button.addEventListener('click',()=>activate(id));
 }
 // Keep the sequence overview. Duplicated protein, restriction digest, and
 // alignment modules still exist for JS compatibility, but aren't displayed.
 const allowed=new Set(['overview','orf','fold']);
 const buttons=[...bar.querySelectorAll('button[data-tab]')];
 buttons.forEach(b=>{if(!allowed.has(b.dataset.tab)){b.hidden=true;b.setAttribute('aria-hidden','true');b.tabIndex=-1;}});
 for(const a of bar.querySelectorAll('a.tab')){a.hidden=true;a.setAttribute('aria-hidden','true');a.tabIndex=-1;}
 for(const el of document.querySelectorAll('button#sample-protein, input#protein-file-input')){el.hidden=true;el.setAttribute('aria-hidden','true');}
 function activate(tab){
   if(!allowed.has(tab))return;
   buttons.forEach(b=>{const yes=b.dataset.tab===tab;b.classList.toggle('selected',yes);b.setAttribute('aria-selected',String(yes));});
   document.querySelectorAll('.tool-pane').forEach(p=>{
      const yes=p.id==='pane-'+tab;p.hidden=!yes;
      if(yes)p.style.removeProperty('display');
   });
 }
 // The original JavaScript registers its own overview tab handlers; this
 // additional listener consistently restores fold/ORF visibility afterwards.
 bar.querySelector('button[data-tab="overview"]')?.addEventListener('click',()=>activate('overview'));
 activate('fold');
})();
