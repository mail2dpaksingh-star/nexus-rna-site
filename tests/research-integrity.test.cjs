const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'..');
const core=require('../tools/construct-studio/core.js');
const intelligence=require('../tools/construct-studio/research-integrity.js');
const design=(focus='car',model='primary')=>core.design({strategy:'nkmrna',nkFocus:focus,nkModel:model,project:'NK planning test',cell:'Primary NK',payloadLength:1500,codon:false});
test('all mRNA-based NK engineering focus options produce traceable validation plans',()=>{
 for(const focus of ['car','receptor','support']){
   const report=intelligence.evaluation(design(focus),'CLL-1 AML mRNA LNP');
   assert.equal(report.strategy,'nkmrna');
   assert.equal(report.schema,'nexus-research-integrity-v1');
   assert.ok(report.validationProtocol.length>=7);
   for(const item of report.validationProtocol){
     for(const key of ['area','assay','controls','readout','acceptance'])assert.ok(item[key]&&typeof item[key]==='string',key);
   }
   assert.ok(report.researchOverlap.reviewRequired.includes('Check publications, preprints, registries, patent claims and unpublished work when accessible'));
 }
});
test('CLL-1 AML search identifies topical overlap but not an identical-study verdict',()=>{
 const report=intelligence.evaluation(design(),'CLL-1 AML mRNA LNP');
 assert.ok(report.landscape.some(x=>x.id==='PMID:41845478'&&x.overlapHint==='substantial topical overlap'));
 assert.match(report.researchOverlap.classification,/not an identical-study detector/);
 assert.match(report.disclaimer,/no live search/i);
});
test('outbound queries require user action and use HTTPS, encoded public terms',()=>{
 const report=intelligence.evaluation(design(),'<patent idea> & CLL-1');
 assert.equal(report.searches.length,3);
 assert.ok(report.searches.every(x=>new URL(x.url).protocol==='https:'));
 assert.ok(report.searches.every(x=>!x.url.includes('<patent idea>')));
 assert.ok(report.landscape.every(x=>new URL(x.url).protocol==='https:'));
});
test('non-NK strategy still works with general protocol matrix',()=>{
 const prior=core.design({strategy:'cyto',project:'Control',cell:'HEK293',payloadLength:800});
 const report=intelligence.evaluation(prior,'');
 assert.equal(prior.strategy,'cyto');
 assert.equal(report.validationProtocol.length,4);
 assert.equal(report.landscape.length,0);
});
test('canonical and legacy studio JS copies remain identical',()=>{
 for(const name of ['core.js','ui.js','research-integrity.js']){
  assert.equal(readFileSync(path.join(dir,'tools/construct-studio',name),'utf8'),readFileSync(path.join(dir,'construct-studio',name),'utf8'));
 }
});
test('all required interface controls and script dependencies are present',()=>{
 for(const folder of ['tools/construct-studio','construct-studio']){
  const html=readFileSync(path.join(dir,folder,'index.html'),'utf8');
  for(const item of ['id="research-keywords"','id="protocol-body"','id="research-refs"','id="research-search-links"','src="research-integrity.js"'])assert.ok(html.includes(item),item);
  assert.ok(html.indexOf('src="research-integrity.js"')<html.indexOf('src="ui.js"'));
 }
});
