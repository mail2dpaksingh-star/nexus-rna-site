/* NEXUS Plasmid Workbench: one catalog selector; preserve MCS cloning.
   This is a DOM presentation change. No sequence, annotation, restriction
   recognition, digest, assembly, or export algorithms are modified. */
(function(root){
  'use strict';
  const doc = root.document;
  function install(){
    const panel = doc.getElementById('nexus-vector-catalog-mcs');
    const choice = doc.getElementById('nexus-choice-summary');
    if(!panel || !choice || panel.dataset.nexusCleaned === 'yes') return false;
    const divider = panel.querySelector('.nexus-mcs-divider');
    const target = panel.querySelector('#mcs-target-kind');
    if(!divider || !target || !panel.querySelector('#mcs-build')) return false;

    // The legacy catalog code holds event listeners on these controls. Keep
    // them mounted but hidden, so catalog data and native APIs still work.
    const retained = doc.createElement('div');
    retained.id = 'nexus-catalog-legacy-controls';
    retained.hidden = true;
    retained.setAttribute('aria-hidden','true');
    retained.className = 'nexus-catalog-retained';
    const prior=[];
    for(let node=panel.firstChild; node && node!==divider; node=node.nextSibling){ prior.push(node); }
    const actions = panel.querySelector('.nexus-mcs-actions');
    prior.forEach(node=>retained.appendChild(node));
    // Keep retained selectors in the DOM to support installed catalog logic.
    panel.parentNode.insertBefore(retained,panel);
    divider.remove();

    const title = panel.querySelector('h3');
    if(title) title.textContent='Cloning site selection';
    panel.classList.add('nexus-mcs-unified');
    const intro=doc.createElement('p');
    intro.className='nexus-mcs-intro';
    intro.textContent='Use the plasmid selected above. Choose its annotated MCS or a mapped restriction site to place your DNA insert.';
    if(title) title.insertAdjacentElement('afterend',intro);
    else panel.prepend(intro);

    // Catalog CSV import remains available for owners, without re-creating
    // the redundant, always-visible search/filter/results panel.
    if(actions){
      const admin=doc.createElement('details');
      admin.id='nexus-choice-catalog-admin';
      admin.className='nexus-choice-catalog-admin';
      const summary=doc.createElement('summary');
      summary.textContent='Manage library references (advanced)';
      const detail=doc.createElement('p');
      detail.textContent='Import or clear catalog metadata. This does not import DNA sequences; use GenBank/FASTA for sequence-backed plasmids.';
      admin.append(summary,detail,actions);
      choice.insertAdjacentElement('afterend',admin);
    }
    // The plasmid-of-choice panel already has a single searchable dropdown.
    // Moving live target controls, rather than rebuilding them, preserves
    // their restriction-site and assembly event handlers.
    const oldHelp=doc.querySelector('#pane-annotation .nexus-choice-hint');
    if(oldHelp) oldHelp.textContent='Choose a plasmid above. Only sequence-backed records can be used for virtual cloning.';
    const metadata=doc.querySelector('#nexus-choice-summary .nexus-choice-note');
    if(metadata) metadata.classList.add('nexus-choice-note-compact');
    panel.dataset.nexusCleaned='yes';
    return true;
  }
  function start(){
    if(install()) return;
    // The workbench inserts its MCS controls from another script. Observe
    // delayed insertion without polling or reconstructing any controls.
    const observer = new MutationObserver(()=>{if(install()) observer.disconnect();});
    observer.observe(doc.documentElement,{childList:true,subtree:true});
  }
  if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})(window);
