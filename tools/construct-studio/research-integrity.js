/* Research Integrity Planner: deterministic scientific planning, no third-party requests or novelty claims. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexusResearchIntegrity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const REFERENCES=Object.freeze([
 {id:'PMID:40248694',title:'Nucleofection-based screening of chimeric antigen receptor candidates in human natural killer cells',who:'Wang et al. · A*STAR Bioprocessing Technology Institute / Singapore Immunology Network',year:2025,url:'https://pubmed.ncbi.nlm.nih.gov/40248694/',focus:'car',tags:['CAR','NK','MRNA','NUCLEOFECTION','ELECTROPORATION','SCREENING'],contribution:'Transient CAR-mRNA delivery and functional screening in expanded human primary NK cells.'},
 {id:'PMCID:PMC11705447',title:'Enhancement of anti-sarcoma immunity by NK cells engineered with mRNA for expression of an EphA2-targeted CAR',who:'Published multi-author EphA2 CAR-NK research',year:2025,url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11705447/',focus:'car',tags:['EPHA2','SARCOMA','CAR','NK','MRNA'],contribution:'EphA2-targeted CAR-mRNA expression and functional assessment across NK models.'},
 {id:'PMID:41845478',title:'Engineering CLL-1 CAR-NK cells via mRNA–LNP for antitumor activity and HLA-E-mediated resistance in acute myeloid leukemia',who:'Zhu et al. · Shanghai Institute of Hematology / Ruijin Hospital',year:2026,url:'https://pubmed.ncbi.nlm.nih.gov/41845478/',focus:'car',tags:['CLL-1','CLEC12A','AML','MRNA','LNP','CAR','NK','HLA-E','NKG2A'],contribution:'Primary CLL-1 CAR-NK mRNA-LNP research, AML cytotoxicity, and adaptive resistance mechanisms.'},
 {id:'DOI:10.1038/s41587-026-03310-1',title:'In vivo engineering of CAR natural killer cells for immunotherapy using ligand-directed lipid nanoparticles',who:'2026 Nature Biotechnology research team (see linked article for author affiliations)',year:2026,url:'https://www.nature.com/articles/s41587-026-03310-1',focus:'car',tags:['IN VIVO','MRNA','LNP','CAR','NK','NKG2A'],contribution:'Ligand-directed nanoparticle research for in vivo mRNA-based CAR-NK engineering.'}
]);
const common=[
 {area:'RNA identity and physicochemical quality',assay:'Sequence/identity checks plus integrity, concentration, cap/poly(A) and residual process impurities when applicable',controls:'Qualified reference material, blank and assay controls; document method suitability',readout:'Identity/integrity and impurity results traceable to a construct and lot',acceptance:'Predefine RNA-specific acceptance criteria and validated assay ranges before experiments'},
 {area:'Expression and cell health',assay:'Orthogonal expression measurements and time-course with viability/phenotype readouts',controls:'Unmodified, mock-treated and expression-negative cells where relevant',readout:'Viable expression-positive fraction, expression duration and cell identity',acceptance:'Predefine study-specific minimal viability, expression and comparability criteria'},
 {area:'Functional specificity',assay:'Mechanism-appropriate activity assay with independent orthogonal confirmation where feasible',controls:'Relevant negative and positive controls, including target-negative comparators for receptor studies',readout:'Effect sizes, assay background, specificity and uncertainty',acceptance:'Pre-register effect-size decision criteria and exclusion/confounder rules'},
 {area:'Replication and evidence integrity',assay:'Study design, biological versus technical replicate tracking, blinded scoring where feasible',controls:'Independent lots, donors or biological replicates as appropriate',readout:'Replicate-level data, uncertainty, QC exceptions and source document IDs',acceptance:'Specify replicate counts/statistical analysis before study; do not invent universal cutoffs'}
];
const nkExtra=[
 {area:'NK identity and process suitability',assay:'Phenotype, viability, purity and donor/model comparability',controls:'Matched unmodified NK cells and relevant reference populations',readout:'CD3/CD56 identity, viability and key phenotypic markers',acceptance:'Predetermine model-specific inclusion/exclusion and lot-to-lot comparability rules'},
 {area:'NK function and target selectivity',assay:'Cytotoxicity plus CD107a degranulation and, where warranted, orthogonal target-cell response',controls:'Antigen-positive and antigen-negative tumor cells and relevant nonmalignant cells',readout:'Target-dependent killing/degranulation relative to controls',acceptance:'Define specificity and minimum functional difference criteria in advance'},
 {area:'Inflammatory and off-target safety',assay:'Cytokine/innate-activation panels, bystander effects, unintended target recognition',controls:'Mock/unmodified NK, antigen-negative and appropriate healthy-cell comparisons',readout:'Inflammatory signal and off-target effects with uncertainty',acceptance:'Predefine acceptable safety signals and escalation/stop rules'}
];
const nkFocusExtras={
 car:[{area:'CAR-specific surface display',assay:'Surface CAR quantification and functional persistence over time',controls:'Unmodified, mock and antigen-negative controls',readout:'Surface-positive fraction and receptor expression kinetics',acceptance:'Predefine CAR identity, specificity and expression-window criteria'}],
 receptor:[{area:'Receptor localization and trafficking',assay:'Receptor surface localization and ligand response; migration/homing readouts when relevant',controls:'Ligand-negative and receptor-negative comparators',readout:'Receptor activity versus background and unintended tissue interactions',acceptance:'Set target-response and off-target evaluation criteria before study'}],
 support:[{area:'Immune-support response',assay:'Intended payload expression, survival/function and bystander response',controls:'Unmodified/mock NK and relevant cytokine-exposure comparators',readout:'Desired support effect balanced against inflammatory and bystander signals',acceptance:'Define benefit-versus-toxicity decision criteria before study'}]
};
const STOP=new Set(['MRNA','CAR','NK','NATURAL','KILLER','CELL','CELLS','THE','AND','WITH','USING','BASED','ENGINEERING','TRANSIENT','RESEARCH','STUDY','TARGET','THERAPY']);
function clean(x,max=180){return String(x||'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function tokens(s){return [...new Set((clean(s,180).toUpperCase().match(/[A-Z0-9]+(?:-[A-Z0-9]+)*/g)||[]).filter(t=>t.length>=3&&!STOP.has(t)))];}
function evaluation(result, publicKeywords=''){
 if(!result||typeof result!=='object')throw Error('A strategy design is required');
 const isNK=result.strategy==='nkmrna', focus=isNK?result.nkFocus:null,words=tokens(publicKeywords),matches=REFERENCES.map(ref=>{
  const specific=ref.tags.filter(t=>!STOP.has(t)&&words.some(w=>w===t||((w.length>4&&t.length>4)&&(w.includes(t)||t.includes(w)))));
  return {...ref,matchedTerms:specific,overlapHint: words.length && specific.length>=2?'substantial topical overlap':specific.length?'possible topical overlap':'background reference'};
 }).sort((a,b)=>b.matchedTerms.length-a.matchedTerms.length);
 const query=[isNK?'mRNA natural killer CAR NK':'RNA construct therapeutics',clean(publicKeywords,100)].filter(Boolean).join(' ');
 const protocols=common.concat(isNK?nkExtra.concat(nkFocusExtras[focus]||[]):[]);
 const status=words.length?matches.some(x=>x.matchedTerms.length>=2)?'Related published work found for multiple supplied keywords; investigate before claiming distinctness.':'No close keyword overlap in the selected examples. This does NOT mean the research is unique.':'No public keywords supplied. The references shown are examples, not an exhaustive review.';
 return {schema:'nexus-research-integrity-v1',generatedAt:new Date().toISOString(),strategy:result.strategy,publicKeywords:clean(publicKeywords),validationProtocol:protocols,landscape:isNK?matches:[],researchOverlap:{status,classification:'Preliminary topic screening only — not an identical-study detector',reviewRequired:['Compare intervention/payload and target','Compare NK source/model and disease indication','Compare delivery method and measurement endpoints','Check publications, preprints, registries, patent claims and unpublished work when accessible','Document differences, research gaps and independent novelty/FTO assessment']},searches:[
  {name:'Search PubMed',url:'https://pubmed.ncbi.nlm.nih.gov/?term='+encodeURIComponent(query)},
  {name:'Search ClinicalTrials.gov',url:'https://clinicaltrials.gov/search?term='+encodeURIComponent(query)},
  {name:'Search Google Patents',url:'https://patents.google.com/?q='+encodeURIComponent(query)}
 ],disclaimer:'Only the example references above are curated; external links run a fresh search only if the user opens them. No live search, exhaustive duplication detection, FTO opinion or scientific validation is performed by this planner.'};
}
return {REFERENCES,evaluation};
});
