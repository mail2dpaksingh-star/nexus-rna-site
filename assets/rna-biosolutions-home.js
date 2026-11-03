/* RNA BioSolutions - compatible homepage artwork adapter.
   Reuses the existing header and its research-tools dropdown.
   No tool pages, scientific engines or internal menus are changed. */
(() => {
  'use strict';
  const HTML = `<section class="hero rna-hero" id="home" aria-labelledby="hero-title">
  <div class="rna-hero-inner"><div class="rna-hero-copy">
    <div class="rna-eyebrow">RNA &nbsp; × &nbsp; Molecular Design &nbsp; × &nbsp; Drug Development</div>
    <h1 id="hero-title">Integrated <em>RNA</em> and<br>Molecular Solutions</h1>
    <p class="rna-subtitle">Design &nbsp; · &nbsp; Develop &nbsp; · &nbsp; Validate &nbsp; · &nbsp; Translate</p>
    <p class="rna-description">Research tools and scientific services for RNA therapeutics, vaccine development, molecular engineering, and translational research.</p>
    <div class="rna-actions">
      <a class="rna-action rna-action-primary" href="/tools/index.html">Explore Research Tools <span aria-hidden="true">→</span></a>
      <a class="rna-action rna-action-secondary" href="#services">Our Services</a>
    </div>
  </div></div>
</section>
<section class="rna-service-highlights" id="rna-service-highlights" aria-labelledby="rna-highlights-title">
  <div class="rna-services-inner">
    <div class="rna-services-header"><h2 id="rna-highlights-title">Our Services</h2>
      <p>Scientific capabilities spanning molecular analysis, RNA design, and translational development.</p></div>
    <div class="rna-services-grid">
      <a class="rna-service-card" href="services.html" aria-label="Learn about molecular and genomic analysis services">
        <img src="assets/rna-biosolutions/service-molecular-genomic.webp" alt="Illustration of DNA sequencing and genomic analysis data" width="418" height="221" loading="lazy">
        <div class="rna-service-body"><div class="rna-service-title"><span>Molecular &amp; Genomic Analysis</span><span class="rna-service-arrow" aria-hidden="true">→</span></div>
        <p>NGS, gene expression, mutation profiling, and biomarker research.</p></div></a>
      <a class="rna-service-card" href="services.html" aria-label="Learn about RNA design and engineering services">
        <img src="assets/rna-biosolutions/service-rna-design.webp" alt="Scientific illustration of linear and circular RNA modalities" width="399" height="221" loading="lazy">
        <div class="rna-service-body"><div class="rna-service-title"><span>RNA Design &amp; Engineering</span><span class="rna-service-arrow" aria-hidden="true">→</span></div>
        <p>mRNA, saRNA, siRNA, miRNA and circRNA research with UTR, codon and poly(A) design.</p></div></a>
      <a class="rna-service-card" href="services.html" aria-label="Learn about computational drug development services">
        <img src="assets/rna-biosolutions/service-ai-drug-development.webp" alt="Illustration of AI-assisted molecular modeling and drug discovery" width="401" height="221" loading="lazy">
        <div class="rna-service-body"><div class="rna-service-title"><span>AI-Driven Drug Development</span><span class="rna-service-arrow" aria-hidden="true">→</span></div>
        <p>Computational target research, molecular analysis and lead-assessment planning.</p></div></a>
      <a class="rna-service-card" href="services.html" aria-label="Learn about RNA delivery and therapeutic development services">
        <img src="assets/rna-biosolutions/service-delivery.webp" alt="Scientific illustration of an RNA lipid nanoparticle and therapeutic vial" width="413" height="221" loading="lazy">
        <div class="rna-service-body"><div class="rna-service-title"><span>Delivery &amp; Therapeutic Development</span><span class="rna-service-arrow" aria-hidden="true">→</span></div>
        <p>LNP formulation planning, research evaluation and translational support.</p></div></a>
    </div>
    <p class="rna-service-note">Illustrative AI-generated scientific imagery; not experimental results or validated therapeutic claims.</p>
  </div>
</section>`;
  function boot(){
    if (document.getElementById('rna-service-highlights')) return;
    const page = document.querySelector('main, [role="main"]');
    if (!page) { console.warn('RNA BioSolutions: no main element found; page unchanged.'); return; }
    const template = document.createElement('template');
    template.innerHTML = HTML.trim();
    const incomingHero = template.content.querySelector('section.rna-hero');
    const services = template.content.querySelector('section.rna-service-highlights');
    if (!incomingHero || !services) return;

    // Match the existing anchor first; then the first obvious hero section.
    // Unlike the former installer, this is tolerant of tag names and attribute order.
    let hero = page.querySelector('#home') || document.querySelector('section#home') ||
       page.querySelector('section.hero, .homepage-hero, .hero') ||
       page.querySelector('section:has(h1)');
    if (hero && hero.contains(page)) hero = null;
    if (hero) {
      // Keep the original section node so any navigation refs to #home continue working.
      // Only its marketing content is replaced; unrelated homepage sections remain.
      hero.replaceChildren(...Array.from(incomingHero.childNodes));
      hero.classList.add('rna-hero');
      hero.id = 'home';
      hero.setAttribute('aria-labelledby', 'hero-title');
      hero.insertAdjacentElement('afterend', services);
    } else {
      // Safe fallback for pages without a recognizable hero: create one rather
      // than deleting or replacing any preexisting content.
      page.insertBefore(incomingHero, page.firstChild);
      incomingHero.insertAdjacentElement('afterend', services);
      hero = incomingHero;
    }

    const brand = document.querySelector('header .brand, header a[aria-label*="NEXUS"], [role="banner"] .brand');
    if (brand) {
      const strong = brand.querySelector('strong');
      const small = brand.querySelector('small');
      if (strong) strong.textContent='RNA BioSolutions';
      if (small) small.textContent='From RNA Design to Therapeutics';
      brand.setAttribute('aria-label','RNA BioSolutions home');
    }
    document.title='RNA BioSolutions | RNA & Molecular Design Services';

    // Launch the existing Research Tools dropdown without creating another tool menu.
    const launch=hero.querySelector('.rna-action-primary');
    if (launch) launch.addEventListener('click', (event) => {
      const select=document.querySelector('header .nexus-unified-select, [role="banner"] .nexus-unified-select');
      if(!select) return; // href remains a working directory fallback
      event.preventDefault();
      select.scrollIntoView({block:'nearest',behavior:'smooth'});
      select.focus();
      if(typeof select.showPicker==='function') try { select.showPicker(); } catch (_) { /* focus fallback */ }
    });
    document.documentElement.classList.add('rna-biosolutions-enhanced');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
