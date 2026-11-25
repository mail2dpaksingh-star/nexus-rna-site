const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const guide=fs.readFileSync(path.join(base,'tools/construct-studio/full-construct-guide.js'),'utf8');
const css=fs.readFileSync(path.join(base,'tools/construct-studio/full-construct-guide.css'),'utf8');
const page=fs.readFileSync(path.join(base,'tools/construct-studio/review.html'),'utf8');

test('DNA guided annotation has valid JS syntax and DNA-only alphabet',()=>{
  assert.doesNotThrow(()=>new Function(guide));
  assert.match(guide,/Complete DNA construct requires A\/C\/G\/T only/);
  assert.match(guide,/if\(!x\|\|!\/\^\[ACGT\]\+\$\/\.test\(x\)\)/);
  assert.match(guide,/sequenceType:'DNA',alphabet:'ACGT'/);
  assert.match(guide,/coding\/sense strand/);
});
test('DNA sequence is displayed unconverted at full length',()=>{
  assert.match(guide,/id="nexus-full-dna-sequence"/);
  assert.match(guide,/nexus-full-dna-sequence'\)\.value=record\.dna\.match/);
  assert.match(guide,/Complete DNA construct — 5′→3′ coding strand/);
  assert.match(guide,/DNA-encoded poly\(A\) candidate/);
});
test('RNA projection is separate and excludes promoter/vector flanks',()=>{
  assert.match(guide,/id="nexus-full-rna-sequence"/);
  assert.match(guide,/nexus-full-rna-sequence'\)\.value=rna\.match/);
  assert.match(guide,/rna=m\.dna\.slice\(m\.roles\.utr5\.start-1,m\.roles\.utr3\.end\)\.replace\(\/T\/g,'U'\)/);
  assert.match(guide,/RNA review/);
  assert.match(guide,/Original quality review|original RNA quality review|separate RNA quality review/);
});
test('mobile read-only DNA and RNA styles apply to existing review page',()=>{
  assert.match(css,/#nexus-full-dna-sequence/);
  assert.match(css,/#nexus-full-rna-sequence/);
  assert.match(page,/full-construct-guide\.css/);
  assert.match(page,/src="full-construct-guide\.js"/);
});
