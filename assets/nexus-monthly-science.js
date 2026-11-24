/* NEXUS monthly research index. No visitor input is sent to third parties. */
(() => {
  'use strict';
  const hash='#monthly-science-updates',dlg=document.createElement('dialog');
  dlg.id='nexus-monthly-science-dialog';dlg.className='nms-dialog';
  dlg.setAttribute('aria-labelledby','nms-title');
  dlg.innerHTML=[
  '<header class="nms-header"><p class="nms-eyebrow">NEXUS RNA BioSolutions · Public Literature & Clinical Trials</p>',
  '<h2 id="nms-title">Monthly Scientific Updates</h2>',
  '<p>Recent RNA research publications and clinical trial registry changes with publication dates and direct source links.</p>',
  '<button class="nms-close" id="nms-close" type="button" aria-label="Close scientific updates">×</button></header>',
  '<div class="nms-body"><div class="nms-tabs" role="tablist" aria-label="Source type">',
  '<button type="button" class="nms-tab" data-nms-tab="publications" role="tab" aria-selected="true">Research publications</button>',
  '<button type="button" class="nms-tab" data-nms-tab="trial_records" role="tab" aria-selected="false">Clinical trial registry</button></div>',
  '<div class="nms-controls"><label for="nms-topic">Topic</label><select id="nms-topic"><option value="">All research areas</option></select>',
  '<label for="nms-search">Search</label><input type="search" id="nms-search" placeholder="Filter titles"></div>',
  '<p class="nms-meta" id="nms-meta" role="status" aria-live="polite">Loading research updates…</p>',
  '<div class="nms-list" id="nms-list"></div>',
  '<p class="nms-note">This is a source-linked index, not a systematic review. Publication does not establish therapeutic efficacy. Trial status or registry updates do not demonstrate safety, benefit or trial success.</p></div>',
  '<footer class="nms-footer">Primary sources: <a href="https://europepmc.org/" target="_blank" rel="noopener noreferrer">Europe PMC / PubMed</a> · ',
  '<a href="https://clinicaltrials.gov/" target="_blank" rel="noopener noreferrer">ClinicalTrials.gov</a>. Refreshes monthly via the NEXUS publication workflow.</footer>'
  ].join('');
  document.body.appendChild(dlg);
  const el=id=>dlg.querySelector('#'+id);
  const status=el('nms-meta'),list=el('nms-list');
  let feed=null,tab='publications',loaded=false;
  const dateFmt=raw=>{
    if(!raw||!/^\d{4}-\d{2}-\d{2}/.test(raw))return 'Date unavailable';
    const d=new Date(raw.slice(0,10)+'T12:00:00Z');
    return isNaN(d.getTime())?raw:d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
  };
  const data=()=>feed&&Array.isArray(feed[tab])?feed[tab]:[];
  function empty(message){list.replaceChildren();const p=document.createElement('div');p.className='nms-empty';p.textContent=message;list.append(p);}
  function topics(){
    const select=el('nms-topic'),old=select.value;
    const names=[...new Set(data().map(i=>String(i.topic||'').trim()).filter(Boolean))].sort();
    select.replaceChildren(new Option('All research areas',''));
    names.forEach(n=>select.add(new Option(n,n)));
    if(names.includes(old))select.value=old;
  }
  function render(){
    list.replaceChildren();
    if(!feed||!feed.updated_at){
      status.textContent='Awaiting first successful scheduled collection.';
      empty('Source-linked updates will appear here after the first successful monthly collection.');
      return;
    }
    const all=data(),term=el('nms-search').value.trim().toLowerCase(),topic=el('nms-topic').value;
    const filtered=all.filter(x=>(!topic||x.topic===topic)&&(!term||String(x.title||'').toLowerCase().includes(term)));
    const diff=(Date.now()-Date.parse(feed.updated_at))/86400000;
    status.textContent=filtered.length+' of '+all.length+' records · Last checked '+dateFmt(feed.updated_at)
      +(diff>45?' · Update overdue; check original sources':'');
    if(!filtered.length){empty('No matching records in this saved monthly digest.');return;}
    let count=0;
    for(const record of filtered){
      if(!/^https:\/\/(?:pubmed\.ncbi\.nlm\.nih\.gov|clinicaltrials\.gov)\//.test(String(record.url||'')))continue;
      const card=document.createElement('article'),topicTag=document.createElement('div');
      topicTag.className='nms-tag';topicTag.textContent=record.topic||'Research';
      const h=document.createElement('h3'),a=document.createElement('a');
      a.href=record.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=record.title||'Untitled record';
      h.append(a);
      const meta=document.createElement('p');meta.className='nms-record-meta';
      meta.textContent=[record.source||'',dateFmt(record.date),record.journal||'',record.trial_id||'',record.trial_status||'',record.phase||''].filter(Boolean).join(' · ');
      card.append(topicTag,h,meta);list.append(card);count++;
    }
    if(!count)empty('No valid source links in this digest.');
  }
  async function load(){
    if(loaded)return;loaded=true;
    try{
      const response=await fetch('assets/nexus-monthly-science.json',{cache:'no-store'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const next=await response.json();
      if(next.schema!=='nexus-science-digest-v1'||!Array.isArray(next.publications)||!Array.isArray(next.trial_records))throw new Error('Unexpected data format');
      feed=next;topics();render();
    }catch(err){
      loaded=false;status.textContent='Scientific updates are temporarily unavailable.';
      empty('Browse current research directly through PubMed and ClinicalTrials.gov using the links below.');
    }
  }
  function open(){
    if(!dlg.open){if(typeof dlg.showModal==='function')dlg.showModal();else dlg.setAttribute('open','');}
    el('nms-close').focus();void load();
  }
  el('nms-close').addEventListener('click',()=>{if(dlg.open&&typeof dlg.close==='function')dlg.close();else dlg.removeAttribute('open');});
  dlg.querySelectorAll('[data-nms-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    tab=btn.dataset.nmsTab;
    dlg.querySelectorAll('[data-nms-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===btn)));
    el('nms-search').value='';el('nms-topic').value='';topics();render();
  }));
  el('nms-topic').addEventListener('change',render);
  el('nms-search').addEventListener('input',render);
  document.addEventListener('click',ev=>{
    const a=ev.target.closest('a[href="#monthly-science-updates"]');
    if(!a)return;ev.preventDefault();
    const dropdown=a.closest('details');if(dropdown)dropdown.open=false;open();
  });
  if(location.hash===hash)requestAnimationFrame(open);
})();
