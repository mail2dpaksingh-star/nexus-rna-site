/* NEXUS SeqFold in Molecular Design Studio: reuses the existing SeqFold engine. */
(function(){
 'use strict';
 const tabs=document.querySelector('.tabs[role="tablist"]');
 const work=document.querySelector('main.work');
 if(!tabs || !work || !document.getElementById('pane-plasmids')) return;
 if(document.getElementById('pane-seqfold')) return;
 const btn=document.createElement('button');
 btn.type='button';btn.className='tab nexus-seqfold-tab';btn.dataset.pane='seqfold';
 btn.setAttribute('role','tab');btn.setAttribute('aria-selected','false');
 btn.innerHTML='SeqFold Studio <small>RNA folding &amp; ORF exploration</small>';
 const primer=tabs.querySelector('button[data-pane="primer"]');
 tabs.insertBefore(btn,primer||null);
 const pane=document.createElement('section');
 pane.className='pane nexus-seqfold-pane';pane.id='pane-seqfold';pane.hidden=true;
 pane.innerHTML='<div class="panel"><div class="head"><h2>SeqFold Studio</h2><span class="nexus-seqfold-tag">Integrated molecular analysis</span></div><p class="nexus-seqfold-intro">Explore RNA secondary structure and open reading frames alongside your molecular designs. Codon optimization, restriction mapping and sequence alignment remain in their existing dedicated modules rather than appearing twice here. Folding is heuristic, not a validated thermodynamic MFE estimate.</p><div class="nexus-seqfold-frame-wrap"><iframe id="nexus-seqfold-embedded-frame" class="nexus-seqfold-frame" title="SeqFold RNA secondary structure and ORF exploration" src="about:blank" loading="lazy"></iframe></div><p class="nexus-seqfold-fallback">If embedded tools are blocked, <a href="index.html?nexusEmbedded=1" target="_blank" rel="noopener">open SeqFold in a new tab</a>.</p></div>';
 const p=document.getElementById('pane-plasmids');
 p.insertAdjacentElement('afterend',pane);
 const frame=pane.querySelector('iframe');
 let loaded=false;
 const loadFrame=()=>{if(loaded)return;loaded=true;frame.src='index.html?nexusEmbedded=1';};
 const resize=()=>{try{const d=frame.contentDocument;if(!d||!d.body)return;const h=Math.max(840,Math.min(10500,Math.ceil(Math.max(d.body.scrollHeight,d.documentElement.scrollHeight))+36));frame.style.height=h+'px';}catch(_){/* fallback CSS size */}};
 frame.addEventListener('load',()=>{resize();try{const doc=frame.contentDocument;if(window.ResizeObserver && doc && doc.body)new ResizeObserver(resize).observe(doc.body);doc?.addEventListener('click',()=>requestAnimationFrame(resize));}catch(_){}});
 function activate(){
   loadFrame();
   // Respect the existing Molecular Design Studio pane management.
   tabs.querySelectorAll('button[data-pane]').forEach(b=>{const on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
   work.querySelectorAll('section.pane').forEach(s=>{s.hidden=s!==pane;});
 }
 btn.addEventListener('click',()=>{activate();history.replaceState(null,'','#seqfold');});
 window.addEventListener('hashchange',()=>{if(location.hash==='#seqfold')activate();});
 if(location.hash==='#seqfold')activate();
})();
