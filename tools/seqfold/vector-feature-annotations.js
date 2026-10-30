/* NEXUS curated vector feature overlay v1.0
 * Loaded after plasmids.js and public-vector-sequences.js, before workbench-ui.js.
 * Never modifies the DNA sequence. Applies only to accession-matched built-in
 * reference sequences with expected sequence fingerprint.
 * Coordinates are 1-based inclusive, on the current record's sequence orientation.
 * Sources: NCBI M77789.2; https://plasmidmap.com/ (M77789.2 coordinate mapping).
 */
(function(root){
  'use strict';
  const library = root.NEXUS_STARTER_PLASMIDS;
  if (!Array.isArray(library)) return;
  function fingerprint(text){
    let h=2166136261;
    for(let i=0;i<text.length;i++){h=Math.imul(h ^ text.charCodeAt(i),16777619)>>>0;}
    return h.toString(16).padStart(8,'0');
  }
  function isValid(f,n){
    return Number.isInteger(f.start)&&Number.isInteger(f.end)&&f.start>=1&&f.end>=f.start&&f.end<=n&&[1,-1].includes(f.strand);
  }
  const curated={
    'M77789.2':{
      bp:2686,
      /* Supplied during build from the bundled NEXUS pUC19 M77789.2 sequence. */
      fp:'140f1304',
      features:[
        {type:'misc_feature',label:'lac-operon / lacZalpha region',start:1,end:447,strand:1},
        {type:'misc_feature',label:'MCS / polylinker',start:233,end:289,strand:1},
        {type:'CDS',label:'AmpR (bla beta-lactamase)',start:885,end:1745,strand:1},
        {type:'rep_origin',label:'pMB1 / ColE1 origin (ori)',start:1905,end:2519,strand:-1}
      ],
      source:'M77789.2 source region coordinates; sequence-matched AmpR and pMB1 matches reported in https://plasmidmap.com/'
    }
  };
  let updated=0;
  for(const item of library){
    if(!item || item.builtin!==true || item.accession!=='M77789.2')continue;
    const seq=String(item.sequence||'').toUpperCase();
    const ref=curated[item.accession];
    if(seq.length!==ref.bp || fingerprint(seq)!==ref.fp){
      console.warn('NEXUS: pUC19 annotation overlay skipped; sequence fingerprint does not match accession-specific reference.');
      continue;
    }
    if(!ref.features.every(f=>isValid(f,seq.length)))continue;
    // This library entry originally shipped with just an MCS. Preserve the
    // original user/source record separately and enrich only the built-in data.
    const previous=Array.isArray(item.features)?item.features:[];
    if(previous.length>1){
      // Respect a more completely annotated future dataset.
      const labels=previous.map(f=>String(f.label||'').toLowerCase());
      if(labels.some(s=>s.includes('ampr')||s.includes('beta-lactamase')) &&
         labels.some(s=>s.includes('ori')||s.includes('origin')))continue;
    }
    const kept=previous.filter(f=>!ref.features.some(g=>g.start===f.start&&g.end===f.end));
    item.features=[...ref.features.map(f=>({...f})),...kept];
    item.annotationSource='NEXUS curated major-feature display for M77789.2; original GenBank remains the sequence authority';
    updated++;
  }
  root.NEXUS_VECTOR_FEATURE_OVERLAY_STATUS={enriched:updated,curatedAccessions:Object.keys(curated)};
})(window);
