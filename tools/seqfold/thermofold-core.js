/* NEXUS ThermoFold v0.9 (research prototype).
 * Independent, non-pseudoknotted MFE dynamic programming. Six AU/UA, CG/GC,
 * GU/UG helix types and 37C tabulated nearest-neighbor stacking constants
 * based on the Turner 2004 NNDB (one-decimal table), not ViennaRNA code.
 * Hairpin initiation: published subset; internal/bulge and multiloop loop terms:
 * APPROXIMATIONS. No complete imported terminal mismatches/dangles by default, special loops,
 * coaxial stacking, modified bases or thermodynamic ensemble.
 * DO NOT present output as ViennaRNA-equivalent or fully parameterized MFE.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexusThermoFold=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const VERSION='0.9.0', MAX=280, LOOP_MIN=3, MAX_INTERNAL=10, INF=Infinity;
const allowed=['AU','UA','CG','GC','GU','UG'];
const pairs=new Set(allowed);
const innerByOrder=['AU','CG','GC','GU','UA','UG'];
// Exact transcriptions of rounded NNDB Turner 2004 Watson-Crick/GU stacking
// 37C text table (see README_THERMOFOLD_v0.3.md). Keys are outer pair (5',3')
// and immediately inside pair (5',3'). The GU/UG tandem context exception
// is not resolved with a sequence-dependent three-stack model in v0.3.
const rows={
 AU:[-0.9,-2.2,-2.1,-0.6,-1.1,-1.4],
 CG:[-2.1,-3.3,-2.4,-1.4,-2.1,-2.1],
 GC:[-2.4,-3.4,-3.3,-1.5,-2.2,-2.5],
 GU:[-1.3,-2.5,-2.1,-0.5,-1.4, 1.3],
 UA:[-1.3,-2.4,-2.1,-1.0,-0.9,-1.3],
 UG:[-1.0,-1.5,-1.4, 0.3,-0.6,-0.5]
};
const stacks={};
for(const outer of allowed){innerByOrder.forEach((inner,i)=>{stacks[outer+'|'+inner]=rows[outer][i];});}
const hairpinInit={3:5.4,4:5.6,5:5.7,6:5.4,7:6.0,8:5.5,9:6.4};
const internalInit={2:0.5,3:1.6,4:1.1,5:2.0,6:2.0}; // 2/3 used only as PROVISIONAL small-loop placeholders
const bulgeInit={1:3.81,2:2.9,3:3.2,4:3.6,5:4.0,6:4.4};
// Explicitly provisional affine multibranch approximation: this is NOT the
// Turner 2004 full asymmetry/strain/dangling/coaxial formulation.
const multi={init:4.6,branch:0.4,unpaired:0.0};
function terminalPenalty(p){return ['AU','UA','GU','UG'].includes(p)?0.45:0;}
function normalize(raw){
 const text=String(raw||'').trim(), lines=text.split(/\r?\n/),seq=lines.filter(x=>!/^\s*>/.test(x)).join('').replace(/[\s\d]/g,'').toUpperCase().replace(/T/g,'U');
 if(!seq)throw Error('Enter an RNA sequence or FASTA record.');
 if(/[^ACGU]/.test(seq))throw Error('Only unmodified A, C, G, U are supported.');
 if(seq.length>MAX)throw Error(`ThermoFold v0.5 supports up to ${MAX} nt for this global restricted-model calculation. Use the separately labeled segmented preview for longer sequences.`);
 return seq;
}
function stackEnergy(outer,inner){
 // Backward compatibility: accept top 5'-bases / bottom 3'-bases, e.g. GG/CC.
 const key=String(outer||''), b=String(inner||'');
 if(key.length===2&&b.length===2){return stacks[key[0]+b[0]+'|'+key[1]+b[1]];}
 return stacks[key+'|'+b];
}
// Authenticated, caller-loaded published parameter tables. No parameters are invented.
// A partial pack is allowed for research comparisons but is NEVER labeled complete.
let activePack=null;
const counts={int11:576,int21:4608,int22:9216,dangle5:24,dangle3:24,terminalMismatch:96,hairpinMismatch:96};
function validateParameterPack(pack){
 if(!pack||pack.schemaVersion!=='nexus-turner-pack-v1'||pack.temperatureC!==37||pack.units!=='kcal/mol')throw Error('Expected a NEXUS Turner parameter pack at 37°C in kcal/mol.');
 if(!pack.source||!pack.source.name||!pack.source.url||!pack.source.version)throw Error('Parameter source name, URL and version are required.');
 const tables=pack.tables||{},summary={};
 for(const [name,expected] of Object.entries(counts)){
  const obj=tables[name]||{};if(typeof obj!=='object'||Array.isArray(obj))throw Error('Invalid table '+name);
  for(const [key,v] of Object.entries(obj)){
   if(!Number.isFinite(v)||Math.abs(v)>60)throw Error('Nonfinite or out-of-range energy in '+name+': '+key);
   if(['int11','int21','int22'].includes(name)){
    const m=/^([ACGU]{2})\|([ACGU]{2})\|([ACGU]{1,2})\|([ACGU]{1,2})$/.exec(key);
    if(!m||!pairs.has(m[1])||!pairs.has(m[2]))throw Error('Invalid internal-loop key: '+key);
    const shape=[m[3].length,m[4].length].sort().join('x');
    const correct={int11:'1x1',int21:'1x2',int22:'2x2'}[name];if(shape!==correct)throw Error('Wrong loop shape '+key);
   }else { const pattern=name.startsWith('dangle')?/^(?:AU|UA|GC|CG|GU|UG)\|[ACGU]$/:/^(?:AU|UA|GC|CG|GU|UG)\|[ACGU]\|[ACGU]$/; if(!pattern.test(key))throw Error('Invalid dangling/mismatch key: '+key); }
  }
  if(Object.keys(obj).length>expected)throw Error('Too many entries in '+name);
  const allowedKeys=new Set();const bases=['A','C','G','U'];
  if(name.startsWith('int')){
    const dims=name==='int11'?[[1,1]]:name==='int22'?[[2,2]]:[[1,2],[2,1]];
    const enumerate=(len)=>{let a=[''];for(let n=0;n<len;n++)a=a.flatMap(s=>bases.map(b=>s+b));return a;};
    for(const [l,r] of dims)for(const outer of allowed)for(const inner of allowed)for(const x of enumerate(l))for(const y of enumerate(r))allowedKeys.add(`${outer}|${inner}|${x}|${y}`);
  }else if(name.startsWith('dangle'))for(const outer of allowed)for(const x of bases)allowedKeys.add(`${outer}|${x}`);
  else for(const outer of allowed)for(const x of bases)for(const y of bases)allowedKeys.add(`${outer}|${x}|${y}`);
  if(Object.keys(obj).some(k=>!allowedKeys.has(k)))throw Error('Unexpected directional key in '+name);
  summary[name]={loaded:Object.keys(obj).length,expected,complete:Object.keys(obj).length===expected};
 }
 return {schemaVersion:pack.schemaVersion,source:pack.source,summary,complete:['int11','int21','int22','dangle5','dangle3','terminalMismatch'].every(n=>summary[n].complete)};
}
function setParameterPack(input){if(input===null){activePack=null;return null;}const info=validateParameterPack(input);activePack=JSON.parse(JSON.stringify(input));return info;}
function packValue(table,key){return activePack?.tables?.[table]?.[key];}
function packSummary(){return activePack?validateParameterPack(activePack):null;}
// Sequence-aware hairpin corrections reported in the Turner 2004 NNDB.
// This is a DOCUMENTED SUBSET, NOT the complete hairpin terminal-mismatch table.
// Named loop: C(cgag)G (six RNA nucleotides total) has observed 37C loop energy 3.5.
const specialHairpins={'CCGAGG':3.5};
const RT37=0.0019872041*310.15;
function hairpinTerms(s,i,j){
 const n=j-i-1,p=s[i]+s[j];
 if(n<LOOP_MIN)return {energy:INF,terms:[]};
 const motif=s.slice(i,j+1);
 if(Object.prototype.hasOwnProperty.call(specialHairpins,motif))return {
  energy:specialHairpins[motif],terms:[{name:'published special hairpin energy',value:specialHairpins[motif]}],method:'experimental special-loop example'
 };
 const init=n<=9?hairpinInit[n]:hairpinInit[9]+1.75*RT37*Math.log(n/9);
 const terms=[{name:'hairpin initiation',value:init}];
 const closing=terminalPenalty(p);
 if(closing)terms.push({name:'AU/GU closing-pair penalty',value:closing});
 const loop=s.slice(i+1,j);
 if(/^C+$/.test(loop))terms.push({name:n===3?'C3 loop penalty':'all-C loop penalty',value:n===3?1.5:0.3*n+1.6});
 // These are published sequence bonuses. The complete stacking term from the
 // terminal-mismatch parameter table is NOT yet present; do not infer parity.
 if(n>=4){
  const first=loop[0]+loop[loop.length-1];
  const exact=packValue('hairpinMismatch',p+'|'+loop[0]+'|'+loop[loop.length-1]);
  if(exact!==undefined)terms.push({name:'imported 37°C hairpin terminal mismatch',value:exact});
  else if(first==='UU'||first==='GA')terms.push({name:'UU / GA first mismatch bonus',value:-0.9});
  if(exact===undefined&&first==='GG')terms.push({name:'GG first mismatch bonus',value:-0.8});
  if(p==='GU'&&i>=2&&s[i-1]==='G'&&s[i-2]==='G')terms.push({name:'special GG-before-GU closure',value:-2.2});
 }
 return {energy:terms.reduce((total,t)=>total+t.value,0),terms,method:'partial Turner 2004 corrections'};
}
function hairpin(s,i,j){return hairpinTerms(s,i,j).energy;}
function bulge(n,outer,inner,stack){
 let e=n<=6?bulgeInit[n]:4.4+1.08*Math.log(n/6);
 return n===1?e+stack:e+terminalPenalty(outer)+terminalPenalty(inner);
}
// Internal-loop energies: NNDB Turner 2004 published generic initiation,
// asymmetry, AU/GU closure, and selected terminal mismatch terms. The 1x1,
// 1x2, and 2x2 special lookup TABLES are NOT incorporated. 2x3 context is
// partially modeled; the orientation-dependent purine/pyrimidine rules are not.
// Thus small internal loops remain PROVISIONAL, not complete Turner 2004.
const genericMismatch={'AG':-0.8,'GA':-1.0,'GG':-1.2,'UU':-0.7};
const twoByThreeMismatch={'GG':-0.8,'UU':-0.4};
function internalLoopTerms(s,i,j,p,q){
 const l=p-i-1,r=j-q-1,total=l+r,outer=s[i]+s[j],inner=s[p]+s[q];
 if(l<1||r<1||total>MAX_INTERNAL)throw Error('Expected a supported internal loop');
 const specialized=total===2?'int11':total===3?'int21':(l===2&&r===2)?'int22':null;
 if(specialized){
  const key=outer+'|'+inner+'|'+s.slice(i+1,p)+'|'+s.slice(q+1,j);
  const val=packValue(specialized,key);
  if(val!==undefined)return {energy:val,terms:[{name:'published '+specialized+' loop lookup, including closing-pair corrections',value:val}],method:'imported '+specialized+' table ('+activePack.source.name+', '+activePack.source.version+')',left:l,right:r,outer,inner,sourceKey:key};
 }
 const initiation=total<=6?internalInit[total]:2.0+1.08*Math.log(total/6);
 const terms=[{name:'loop initiation',value:initiation},{name:'loop asymmetry',value:0.6*Math.abs(l-r)}];
 const closing=['AU','UA','GU','UG'];
 if(closing.includes(outer))terms.push({name:'outer AU/GU closure',value:0.7});
 if(closing.includes(inner))terms.push({name:'inner AU/GU closure',value:0.7});
 const mm1=s[i+1]+s[j-1],mm2=s[q+1]+s[p-1];
 let method='generic Turner 2004 rule with incomplete mismatch parameter coverage';
 if(l===1||r===1){
  // Published rule: both first-mismatch terms equal zero for 1×(n-1) loops.
  method='1×(n-1) zero-mismatch rule; 1×1/1×2 lookup tables remain omitted';
 }else if((l===2&&r===3)||(l===3&&r===2)){
  for(const mismatch of [mm1,mm2])if(twoByThreeMismatch[mismatch]!==undefined)
   terms.push({name:`2×3 ${mismatch} mismatch (partial)`,value:twoByThreeMismatch[mismatch]});
  method='2×3 partial motif rules; orientation-dependent entries omitted';
 }else if(l===2&&r===2){
  method='2×2 generic fallback; experimental 2×2 lookup table omitted';
 }else{
  for(const mismatch of [mm1,mm2])if(genericMismatch[mismatch]!==undefined)
   terms.push({name:`${mismatch} terminal mismatch`,value:genericMismatch[mismatch]});
 }
 return {energy:terms.reduce((a,t)=>a+t.value,0),terms,method,left:l,right:r,outer,inner};
}
function loopEnergy(s,i,j,p,q){
 const l=p-i-1,r=j-q-1,outer=s[i]+s[j],inner=s[p]+s[q];
 if(!pairs.has(outer)||!pairs.has(inner))return INF;
 if(l===0&&r===0)return stacks[outer+'|'+inner];
 if(l===0||r===0)return bulge(l+r,outer,inner,stacks[outer+'|'+inner]);
 return internalLoopTerms(s,i,j,p,q).energy;
}
// Model coverage is a qualitative inventory, NOT a statistical accuracy score.
function parameterAudit(seq,db,counts,hairpinDetails,internalDetails){
 const flags=[];
 const push=(level,part,reason)=>flags.push({level,part,reason});
 if(counts.hairpin && hairpinDetails.some(h=>h.method!=='experimental special-loop example'))
   push('partial','hairpin sequence energetics','Only selected special motifs and terminal mismatches are represented; complete special-loop and hairpin mismatch tables are missing.');
 if(counts.internal){
   const lookup=internalDetails.filter(d=>["1x1","1x2","2x1","2x2"].includes(`${d.left}x${d.right}`));
   const gaps=lookup.filter(d=>!d.method.startsWith('imported'));if(gaps.length)push('missing','specialized internal-loop lookup tables',`${gaps.length} loop(s) lack authenticated 1×1, 1×2 or 2×2 lookup values and use generic fallbacks.`);
   if(internalDetails.length>lookup.length)push('partial','generic internal loops','Some sequence-dependent mismatch cases and loop-orientation rules are incomplete.');
 }
 if(counts.bulge)push('partial','bulge energetics','Bulge initiation and closing terms are approximate; sequence-specific corrections are incomplete.');
 if(counts.multibranch)push('provisional','multibranch energies','Affine branch/unpaired terms omit dangle and coaxial stacking energies.');
 const pairStack=[],outerPairs=[];
 for(let i=0;i<db.length;i++){
  if(db[i]==='(')pairStack.push(i);
  else if(db[i]===')'){
   const k=pairStack.pop();if(pairStack.length===0)outerPairs.push([k,i]);
  }
 }
 if(outerPairs.some(([i,j])=>(i>0&&db[i-1]==='.')||(j+1<seq.length&&db[j+1]==='.')))
   push('missing','exterior dangling-end terms','At least one exterior helix has adjacent unpaired bases but no dangling-end correction is applied.');
 if(/[GU]/.test(seq)&&[...db].some((c,i)=>c==='('&&((()=>{let k=0;for(let j=i;j<db.length;j++){if(db[j]==='(')k++;if(db[j]===')'&&!--k)return ['GU','UG'].includes(seq[i]+seq[j]);}return false;})())))
   push('partial','GU context exceptions','Some sequence-dependent GU stacking exceptions are not included.');
 return {scope:'sequence-specific applicability of NEXUS model terms; not an accuracy or confidence score',
  summary:{missing:flags.filter(f=>f.level==='missing').length,partial:flags.filter(f=>f.level==='partial').length,provisional:flags.filter(f=>f.level==='provisional').length},flags,
  externalValidation:'NOT COMPLETED — no matched RNAfold/RNAstructure reference batch in this package'};
}
// Exterior end contributions: a single base cannot be used by two adjacent
// helices. 5'/3' single dangles and a two-sided terminal mismatch are exclusive.
function dangleOptions(s,i,j){
 const pair=s[i]+s[j],a=[{left:false,right:false,energy:0,label:'none'}];
 if(!activePack)return a;
 const left=i>0&&packValue('dangle5',pair+'|'+s[i-1]);
 const right=j+1<s.length&&packValue('dangle3',pair+'|'+s[j+1]);
 if(left!==undefined&&i>0)a.push({left:true,right:false,energy:left,label:'5-prime dangle'});
 if(right!==undefined&&j+1<s.length)a.push({left:false,right:true,energy:right,label:'3-prime dangle'});
 if(i>0&&j+1<s.length){
  const mismatch=packValue('terminalMismatch',pair+'|'+s[i-1]+'|'+s[j+1]);
  if(mismatch!==undefined)a.push({left:true,right:true,energy:mismatch,label:'two-sided terminal mismatch'});
 }
 return a;
}
function exteriorDangleEnergy(s,roots){
 let states=[{energy:0,lastRight:-1,details:[]}];
 for(const root of roots.sort((a,b)=>a.i-b.i)){
  const next=[];
  for(const state of states)for(const mode of dangleOptions(s,root.i,root.j)){
   const li=mode.left?root.i-1:-1,ri=mode.right?root.j+1:-1;
   if(li>=0&&li===state.lastRight)continue;
   // The adjacent sequence positions must be unpaired exterior positions.
   if(mode.left&&roots.some(x=>x!==root&&x.i<=li&&x.j>=li))continue;
   if(mode.right&&roots.some(x=>x!==root&&x.i<=ri&&x.j>=ri))continue;
   next.push({energy:state.energy+mode.energy,lastRight:ri,details:state.details.concat([{stem:[root.i+1,root.j+1],mode:mode.label,energy:mode.energy}])});
  }
  const best=new Map();for(const st of next){const key=st.lastRight;if(!best.has(key)||st.energy<best.get(key).energy)best.set(key,st);}states=[...best.values()];
 }
 return states.sort((a,b)=>a.energy-b.energy)[0]||{energy:0,details:[]};
}
function modelInfo(){return {
 version:VERSION,parameterPack:packSummary(),model:'NEXUS restricted nearest-neighbor model: GU stacks, partial hairpin and generic internal-loop corrections',
 modelCompleteness:'incomplete — investigational thermodynamic model',parameterTemperatureC:37,
 parameters:'Turner 2004 NNDB rounded 37C stacking; selected hairpin and generic interior-loop terms; partial bulge/multibranch',
 warnings:[
  'ΔG37 is a minimum of the NEXUS restricted energy model, not a ViennaRNA-equivalent MFE.',
  'Generic internal-loop closure (0.7), size/asymmetry and selected first-mismatch terms supported; authentic 1×1, 1×2 and 2×2 lookup terms may be imported, but unfilled entries and 2×3 orientation rules remain incomplete.',
  'Exterior dangle/terminal mismatch contributions require uploaded authentic data; multibranch dangles and coaxial terms remain unimplemented. Most special hairpins, pseudoknots, modified bases, or temperature adjustment. Partition-function estimates are available separately under this same restricted model.',
  'Do not use results for validated RNA design or release decisions without independent comparison.'
 ]};}
function fold(raw){
 const s=normalize(raw),n=s.length,size=n*n,idx=(i,j)=>i*n+j;
 const V=new Float64Array(size),M1=new Float64Array(size),M2=new Float64Array(size);V.fill(INF);M1.fill(INF);M2.fill(INF);
 const VC=new Int32Array(size);VC.fill(-4); // -1 hairpin, -3 multi, >=0 inner pair index
 const C1=new Int32Array(size);C1.fill(-4); // -1 leftskip -2 rightskip -3 branch
 const C2=new Int32Array(size);C2.fill(-4); // -1 leftskip -2 rightskip 1 split two M1, 2 split M1+M2
 const SP=new Int32Array(size);SP.fill(-1);
 let candidatePairs=0;
 for(let span=0;span<n;span++)for(let i=0;i+span<n;i++){
   const j=i+span,a=idx(i,j),outer=s[i]+s[j];
   if(span>=LOOP_MIN+1&&pairs.has(outer)){
     candidatePairs++;let best=hairpin(s,i,j),mode=-1;
     for(let l=0;l<=MAX_INTERNAL;l++){
       const p=i+l+1;if(p+LOOP_MIN+1>=j)break;
       for(let r=0;r<=MAX_INTERNAL-l;r++){
         const q=j-r-1;if(q-p<LOOP_MIN+1)continue;
         const inner=V[idx(p,q)];if(!Number.isFinite(inner))continue;
         const e=loopEnergy(s,i,j,p,q),v=inner+e;
         if(v<best-1e-9){best=v;mode=idx(p,q);}
       }
     }
     if(i+1<=j-1){
       const branches=M2[idx(i+1,j-1)];
       const multiE=multi.init+multi.branch+terminalPenalty(outer)+branches;
       if(multiE<best-1e-9){best=multiE;mode=-3;}
     }
     V[a]=best;VC[a]=mode;
   }
   // M1 exactly one enclosed helix. Unpaired left/right bases have zero cost.
   let best1=INF,mode1=-4;
   if(i+1<=j && M1[idx(i+1,j)]+multi.unpaired<best1){best1=M1[idx(i+1,j)]+multi.unpaired;mode1=-1;}
   if(i<=j-1 && M1[idx(i,j-1)]+multi.unpaired<best1){best1=M1[idx(i,j-1)]+multi.unpaired;mode1=-2;}
   if(Number.isFinite(V[a])&&V[a]+multi.branch+terminalPenalty(outer)<best1){best1=V[a]+multi.branch+terminalPenalty(outer);mode1=-3;}
   M1[a]=best1;C1[a]=mode1;
   // M2 at least two branches; split into (exactly 1)+(at least 1).
   let best2=INF,mode2=-4,split=-1;
   if(i+1<=j && M2[idx(i+1,j)]+multi.unpaired<best2){best2=M2[idx(i+1,j)]+multi.unpaired;mode2=-1;}
   if(i<=j-1 && M2[idx(i,j-1)]+multi.unpaired<best2){best2=M2[idx(i,j-1)]+multi.unpaired;mode2=-2;}
   for(let k=i;k<j;k++){
     const left=M1[idx(i,k)];if(!Number.isFinite(left))continue;
     const right1=M1[idx(k+1,j)],right2=M2[idx(k+1,j)];
     if(Number.isFinite(right1)&&left+right1<best2-1e-9){best2=left+right1;mode2=1;split=k;}
     if(Number.isFinite(right2)&&left+right2<best2-1e-9){best2=left+right2;mode2=2;split=k;}
   }
   M2[a]=best2;C2[a]=mode2;SP[a]=split;
 }
 // Exterior unrestricted unpaired positions, one or more independent helices.
 const F=new Float64Array(n+1),FC=new Array(n+1);F.fill(INF);F[0]=0;
 // All transitions consume the dangle base(s) explicitly, making exterior
 // double-use impossible. The no-dangle branch reproduces legacy behavior.
 for(let a=0;a<n;a++){
  if(!Number.isFinite(F[a]))continue;
  if(F[a]<F[a+1]-1e-9){F[a+1]=F[a];FC[a+1]={prev:a,skip:true};}
  for(let j=a+LOOP_MIN+1;j<n;j++){
   const val=V[idx(a,j)];if(!Number.isFinite(val))continue;
   for(const m of dangleOptions(s,a,j))if(!m.left){
    const to=j+1+(m.right?1:0);if(to>n)continue;
    const score=F[a]+val+terminalPenalty(s[a]+s[j])+m.energy;
    if(score<F[to]-1e-9){F[to]=score;FC[to]={prev:a,i:a,j,mode:m};}
   }
  }
  // A left dangling nucleotide is consumed by skipping from a to a+1,
  // followed by a helix starting at a+1. F[a] excludes that base.
  for(let i=a+1,j=i+LOOP_MIN+1;j<n;j++){
   const val=V[idx(i,j)];if(!Number.isFinite(val))continue;
   for(const m of dangleOptions(s,i,j))if(m.left){
    const to=j+1+(m.right?1:0);if(to>n)continue;
    const score=F[a]+val+terminalPenalty(s[i]+s[j])+m.energy;
    if(score<F[to]-1e-9){F[to]=score;FC[to]={prev:a,i,j,mode:m};}
   }
  }
 }
 const db=Array(n).fill('.'),pairList=[];
 let iterations=0;
 function traceV(i,j){
   if(++iterations>n*n*10)throw Error('Internal traceback consistency error.');
   db[i]='(';db[j]=')';pairList.push([i+1,j+1]);
   const ch=VC[idx(i,j)];
   if(ch>=0)traceV(Math.floor(ch/n),ch%n);
   else if(ch===-3)traceM(2,i+1,j-1);
 }
 function traceM(mode,i,j){if(i>j)throw Error('Invalid multibranch trace');
   const a=idx(i,j),ch=(mode===1?C1[a]:C2[a]);
   if(ch===-1)traceM(mode,i+1,j);
   else if(ch===-2)traceM(mode,i,j-1);
   else if(mode===1&&ch===-3)traceV(i,j);
   else if(mode===2&&(ch===1||ch===2)){
     const k=SP[a];traceM(1,i,k);traceM(ch===1?1:2,k+1,j);
   }else throw Error('Invalid multibranch traceback');
 }
 for(let j=n;j>0;){const st=FC[j];if(!st)throw Error('Invalid exterior traceback');if(!st.skip)traceV(st.i,st.j);j=st.prev;}
 pairList.sort((x,y)=>x[0]-y[0]);
 const deltaG37=Math.round(F[n]*100)/100, dotBracket=db.join('');
 const result={...modelInfo(),sequence:s,length:n,dotBracket,deltaG37,unit:'kcal/mol',pairs:pairList,pairCount:pairList.length,candidatePairs};
 // Energy reconciliation is an invariant of the implementation; independent
 // evaluation uses the supplied pair graph, NOT the DP traceback energies.
 const checked=evaluateStructure(s,dotBracket);
 if(Math.abs(checked.deltaG37Raw-F[n])>1e-7)throw Error('Energy reconciliation failed; calculation aborted.');
 result.energyCheckDelta=0;
 result.exteriorDetails=checked.exteriorDetails;result.externalEndEnergy=checked.externalEndEnergy;result.loopCounts=checked.loopCounts; result.hairpinDetails=checked.hairpinDetails;result.internalDetails=checked.internalDetails;
 result.parameterAudit=parameterAudit(s,dotBracket,checked.loopCounts,checked.hairpinDetails,checked.internalDetails);
 return result;
}
function evaluateStructure(raw,dotBracket){
 const seq=normalize(raw),db=String(dotBracket||'');
 if(db.length!==seq.length||/[^().]/.test(db))throw Error('Invalid dot-bracket notation.');
 const stack=[],maps=new Map(),children=new Map(),roots=[];
 for(let i=0;i<db.length;i++){
   if(db[i]==='(')stack.push({i,children:[]});
   else if(db[i]===')'){
     if(!stack.length)throw Error('Unbalanced dot bracket notation');
     const node=stack.pop(),p=seq[node.i]+seq[i];
     if(!pairs.has(p)||i-node.i-1<LOOP_MIN)throw Error('Invalid or unsupported paired bases.');
     node.j=i;maps.set(node.i,node);children.set(node.i,node.children);
     if(stack.length)stack[stack.length-1].children.push(node);else roots.push(node);
   }
 }
 if(stack.length)throw Error('Unbalanced dot bracket notation');
 const lc={hairpin:0,internal:0,bulge:0,stack:0,multibranch:0},hpDetails=[],internalDetails=[];
 function evaluate(node){
   const cs=node.children,p=seq[node.i]+seq[node.j];
   if(!cs.length){lc.hairpin++;const h=hairpinTerms(seq,node.i,node.j);hpDetails.push({start:node.i+1,end:node.j+1,length:node.j-node.i-1,energy:Math.round(h.energy*100)/100,terms:h.terms,method:h.method});return h.energy;}
   if(cs.length===1){
     const child=cs[0],l=child.i-node.i-1,r=node.j-child.j-1;
     if(l+r>MAX_INTERNAL)throw Error('Internal loop is outside supported model (max 10 unpaired nt).');
     if(!l&&!r)lc.stack++;else if(!l||!r)lc.bulge++;else{
       lc.internal++;
       const det=internalLoopTerms(seq,node.i,node.j,child.i,child.j);
       internalDetails.push({outerStart:node.i+1,outerEnd:node.j+1,innerStart:child.i+1,innerEnd:child.j+1,
        left:l,right:r,energy:Math.round(det.energy*100)/100,method:det.method,terms:det.terms});
     }
     return loopEnergy(seq,node.i,node.j,child.i,child.j)+evaluate(child);
   }
   lc.multibranch++;
   let used=0,prev=node.i;
   for(const child of cs){used+=child.i-prev-1;prev=child.j;}
   used+=node.j-prev-1;
   return multi.init+multi.branch*(cs.length+1)+multi.unpaired*used+terminalPenalty(p)+
     cs.reduce((sum,c)=>sum+terminalPenalty(seq[c.i]+seq[c.j])+evaluate(c),0);
 }
 let rawValue=roots.reduce((sum,c)=>sum+evaluate(c)+terminalPenalty(seq[c.i]+seq[c.j]),0);
 const ext=exteriorDangleEnergy(seq,roots);rawValue+=ext.energy;
 return {deltaG37:Math.round(rawValue*100)/100,deltaG37Raw:rawValue,externalEndEnergy:ext.energy,exteriorDetails:ext.details,loopCounts:lc,hairpinDetails:hpDetails.sort((a,b)=>a.start-b.start),internalDetails:internalDetails.sort((a,b)=>a.outerStart-b.outerStart)};
}
return {fold,normalize,evaluateStructure,setParameterPack,validateParameterPack,packSummary,dangleOptions,exteriorDangleEnergy,modelInfo,parameterAudit,stackEnergy,hairpinTerms,internalLoopTerms,loopEnergy,terminalPenalty,VERSION,MAX,parameters:{stackRows:rows,innerOrder:innerByOrder,multi}};
});
