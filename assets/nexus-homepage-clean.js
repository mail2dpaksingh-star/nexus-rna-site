/* NEXUS homepage: one Research Tools launcher, no repeated tool-card navigation.
   Presentation-only and guarded: do not remove content unless the navigation dropdown loaded.
   No scientific engines, tools, data, or URLs are modified. */
(()=>{
  'use strict';
  const READY='nexus-homepage-clean-ready';
  function isToolLink(a){
    const href=(a.getAttribute('href')||'').trim();
    return /^(?:\.?\/?tools\/|\/tools\/)/i.test(href);
  }
  function boot(){
    if(document.documentElement.classList.contains(READY))return;
    const main=document.querySelector('main, [role="main"]');
    if(!main)return;
    const picker=document.querySelector('header .nexus-unified-picker-nav select.nexus-unified-select, [role="banner"] .nexus-unified-picker-nav select.nexus-unified-select');
    // Fail open: preserve older navigation if the unified dropdown has not initialized.
    if(!picker || picker.options.length<15)return;

    // v2 of the unified-menu patch also injects its own dropdown in main. Remove only
    // that duplicate in-page launcher: the header picker is the sole access point.
    main.querySelectorAll('.nexus-unified-home').forEach(n=>n.remove());
    main.querySelectorAll('.nexus-unified-picker-home').forEach(n=>{
      const box=n.closest('.nexus-unified-home');
      if(box)box.remove();else n.remove();
    });

    // Prior versions used section#tools; newer layouts may use div#tools, a renamed
    // section, or no tool section at all. A recognized collection is tool-only.
    const candidates=new Set([...main.querySelectorAll('#tools, .nexus-unified-original-tools, section, [role="region"]')]);
    for(const el of candidates){
      if(!el.isConnected || el===main)continue;
      const heading=el.querySelector('h2,h3');
      const title=(heading?.textContent||'').trim();
      const explicit=el.id==='tools' || el.classList.contains('nexus-unified-original-tools');
      const toolCollection=el.querySelector('#tool-grid,.tool-grid,.tool-controls,.tool-card');
      const titleMatches=/^(?:find the tool you need\.?|(?:all\s+)?research tools|all tools|open research tools)$/i.test(title);
      if((explicit && (toolCollection || titleMatches)) || (titleMatches && toolCollection)){
        el.remove();
      }
    }

    // Repeated linked pathway cards were alternate launchers. Keep platform's
    // design->formulate->analyze->learn overview, but not its redundant tool CTAs.
    const pathways=main.querySelector('#pathways');
    if(pathways && pathways.querySelector('.path-grid'))pathways.remove();
    main.querySelectorAll('#platform .step > a[href]').forEach(a=>a.remove());
    main.querySelectorAll('#platform .platform-note a[href*="tools/project-hub/"]').forEach(a=>a.remove());

    // Keep Oncology / Hematology application pages. Remove only the tool-focused
    // duplicate example/entry point, not application content.
    const example=main.querySelector('#applications .example-card');
    if(example && [...example.querySelectorAll('a[href]')].some(isToolLink))example.remove();
    main.querySelectorAll('#applications .application-focus').forEach(card=>{
      const a=card.querySelector('a[href]');
      if(a && /^(?:\/?tools\/construct-studio\/index\.html)$/i.test(a.getAttribute('href')||''))card.remove();
    });

    // Footer should not present another tools index or duplicate launcher.
    document.querySelectorAll('footer a[href]').forEach(a=>{
      const label=(a.textContent||'').replace(/[↗→▾]/g,'').trim().toLowerCase();
      const href=a.getAttribute('href')||'';
      if(/^(?:all|research) tools?$/.test(label) || /^\/?tools\/index\.html$/i.test(href))a.remove();
    });

    // Existing calls to action can focus the persistent header menu even if an
    // old #tools anchor no longer exists. Do not create a second dropdown.
    const focusPicker=e=>{
      e.preventDefault();
      const menu=document.querySelector('.menu-toggle');
      const nav=document.querySelector('.top-links');
      if(menu && nav && !nav.classList.contains('open') && getComputedStyle(menu).display!=='none')menu.click();
      picker.focus();
      if(typeof picker.showPicker==='function'){
        try{picker.showPicker();}catch(_){/* focus is safe fallback */}
      }
    };
    document.querySelectorAll('a[href="#tools"],a[href="#nexus-research-tools"],.hero a[href="tools/index.html"]').forEach(a=>{
      a.setAttribute('href','#'+picker.id);
      if(a.closest('.hero'))a.textContent='Explore Research Tools ▾';
      a.addEventListener('click',focusPicker);
    });
    document.documentElement.classList.add(READY);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
