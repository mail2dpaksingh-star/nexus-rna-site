/* NEXUS ThermoFold Ensemble v0.8 — original implementation.
 * Exact Boltzmann ensemble for the SAME restricted 37°C energy model as
 * thermofold-core.js. Does not implement the full Turner model / ViennaRNA.
 * No pseudoknots, modified bases or temperature-dependent parameters.
 * The inside/outside algorithm handles hairpins, stacks, bulges, internal and
 * provisional affine multibranch loops. Max 110 bases by design.
 */
(function(root,factory){
  const base=typeof module==='object'&&module.exports?require('./thermofold-core.js'):root.NexusThermoFold;
  const api=factory(base);if(typeof module==='object'&&module.exports)module.exports=api;
  root.NexusThermoFoldEnsemble=api;
})(typeof self!=='undefined'?self:globalThis,function(core){
'use strict';
if(!core)throw Error('Load ThermoFold core before Ensemble.');
const VERSION='0.8.0', MAX=110, RT=0.0019872041*310.15, MIN=4, INTERNAL=10;
const complementary=new Set(['AU','UA','CG','GC','GU','UG']);
const ex=Math.exp;
function run(raw,{cutoff=0.01}={}){
 const seq=core.normalize(raw),n=seq.length;
 if(n>MAX)throw Error(`The full-ensemble calculation is limited to ${MAX} nt. The separate MFE and segmented modes support different lengths.`);
 if(!Number.isFinite(cutoff)||cutoff<0||cutoff>1)throw Error('Probability cutoff must be from 0 to 1.');
 const size=n*n, ix=(i,j)=>i*n+j;
 const B=new Float64Array(size),M1=new Float64Array(size),M2=new Float64Array(size),Q=new Float64Array(size);
 const wb=new Float64Array(size),wm1=new Float64Array(size),wm2=new Float64Array(size),wq=new Float64Array(size);
 const pen=core.terminalPenalty, E=core.loopEnergy, branch=core.parameters.multi.branch;
 const unpaired=core.parameters.multi.unpaired,init=core.parameters.multi.init;
 const g=(a,i,j)=>i>j?1:a[ix(i,j)];
 const wt=e=>ex(-e/RT);
 // Inside sums. A multibranch segment is represented uniquely by its
 // leftmost enclosed helix and remaining segment (avoids skip-L/skip-R double counts).
 for(let span=0;span<n;span++)for(let i=0;i+span<n;i++){
  const j=i+span,kij=ix(i,j),pair=seq[i]+seq[j];
  if(span>=MIN&&complementary.has(pair)){
   let value=wt(core.hairpinTerms(seq,i,j).energy);
   for(let left=0;left<=INTERNAL;left++){
    const p=i+left+1;if(p+MIN>j)break;
    for(let right=0;right<=INTERNAL-left;right++){
     const q=j-right-1;if(q-p<MIN)continue;
     const inner=B[ix(p,q)];if(inner) value+=inner*wt(E(seq,i,j,p,q));
    }
   }
   if(i+1<=j-1)value+=wt(init+branch+pen(pair))*M2[ix(i+1,j-1)];
   B[kij]=value;
  }
  // One enclosed branch with any number of flanking unpaired nucleotides.
  let v1=i<j?wt(unpaired)*M1[ix(i+1,j)]:0;
  for(let k=i+MIN;k<=j;k++)if(B[ix(i,k)])
    v1+=B[ix(i,k)]*wt(branch+pen(seq[i]+seq[k])+unpaired*(j-k));
  M1[kij]=v1;
  // Two or more branches with a unique, leftmost first helix.
  let v2=i<j?wt(unpaired)*M2[ix(i+1,j)]:0;
  for(let k=i+MIN;k<j;k++)if(B[ix(i,k)]){
    const rest=M1[ix(k+1,j)]+M2[ix(k+1,j)];
    if(rest)v2+=B[ix(i,k)]*wt(branch+pen(seq[i]+seq[k]))*rest;
  }
  M2[kij]=v2;
  // Exterior segment: unpaired left base or first helix plus right suffix.
  let v=i<j?Q[ix(i+1,j)]:1;
  for(let k=i+MIN;k<=j;k++)if(B[ix(i,k)])v+=B[ix(i,k)]*wt(pen(seq[i]+seq[k]))*g(Q,k+1,j);
  Q[kij]=v;
 }
 const Z=Q[ix(0,n-1)];
 if(!Number.isFinite(Z)||Z<=0)throw Error('Numerical overflow. Use a shorter sequence in the ensemble mode.');
 wq[ix(0,n-1)]=1;
 // Reverse-mode propagation through the same acyclic recurrences.
 // Every derivative dZ / dB(i,j), weighted by B(i,j)/Z, is the exact
 // marginal pairing probability in this restricted model.
 for(let span=n-1;span>=0;span--)for(let i=0;i+span<n;i++){
  const j=i+span,a=ix(i,j),p=seq[i]+seq[j];
  const qGrad=wq[a];
  if(qGrad){
    if(i<j)wq[ix(i+1,j)]+=qGrad;
    for(let k=i+MIN;k<=j;k++)if(B[ix(i,k)]){
      const coeff=wt(pen(seq[i]+seq[k])),r=g(Q,k+1,j);
      wb[ix(i,k)]+=qGrad*coeff*r;
      if(k+1<=j)wq[ix(k+1,j)]+=qGrad*coeff*B[ix(i,k)];
    }
  }
  const m2Grad=wm2[a];
  if(m2Grad){
   if(i<j)wm2[ix(i+1,j)]+=m2Grad*wt(unpaired);
   for(let k=i+MIN;k<j;k++)if(B[ix(i,k)]){
    const w=wt(branch+pen(seq[i]+seq[k])),r=ix(k+1,j),rest=M1[r]+M2[r];
    wb[ix(i,k)]+=m2Grad*w*rest;
    wm1[r]+=m2Grad*w*B[ix(i,k)];wm2[r]+=m2Grad*w*B[ix(i,k)];
   }
  }
  const m1Grad=wm1[a];
  if(m1Grad){
   if(i<j)wm1[ix(i+1,j)]+=m1Grad*wt(unpaired);
   for(let k=i+MIN;k<=j;k++)if(B[ix(i,k)])
      wb[ix(i,k)]+=m1Grad*wt(branch+pen(seq[i]+seq[k])+unpaired*(j-k));
  }
  const bGrad=wb[a];
  if(bGrad&&B[a]){
   for(let left=0;left<=INTERNAL;left++){
    const u=i+left+1;if(u+MIN>j)break;
    for(let right=0;right<=INTERNAL-left;right++){
     const v=j-right-1;if(v-u<MIN)continue;
     if(B[ix(u,v)])wb[ix(u,v)]+=bGrad*wt(E(seq,i,j,u,v));
    }
   }
   if(i+1<=j-1)wm2[ix(i+1,j-1)]+=bGrad*wt(init+branch+pen(p));
  }
 }
 const allPairProbabilities=new Float64Array(size);
 const probabilities=[],unpairedProbability=Array(n).fill(1),pairedByPosition=Array(n).fill(0);
 let expectedPairs=0;
 for(let i=0;i<n;i++)for(let j=i+MIN;j<n;j++){
   const a=ix(i,j);if(!B[a])continue;
   const probability=wb[a]*B[a]/Z;
   if(!Number.isFinite(probability)||probability < -1e-9||probability>1+1e-8)throw Error('Partition consistency failure: invalid pairing probability.');
   const value=Math.max(0,Math.min(1,probability));
   allPairProbabilities[a]=value;expectedPairs+=value;pairedByPosition[i]+=value;pairedByPosition[j]+=value;
   if(value>=cutoff)probabilities.push({i:i+1,j:j+1,p:value,pair:seq[i]+seq[j]});
 }
 for(let i=0;i<n;i++){
  if(pairedByPosition[i]>1+1e-7)throw Error('Partition consistency failure: nucleotide pairing probabilities exceed 1.');
  unpairedProbability[i]=Math.max(0,1-pairedByPosition[i]);
 }
 probabilities.sort((a,b)=>b.p-a.p||a.i-b.i);
 // Noncrossing consensus structure minimizing expected base-pair symmetric difference.
 // Pair (i,j) contributes 2*p(i,j)-1, because a paired prediction removes a
 // probability p omission penalty but introduces a (1-p) false-pair penalty.
 // The minimum hairpin span is enforced; pseudoknots are not considered.
 const centroidDP=new Float64Array(size),centroidChoice=new Int32Array(size);centroidChoice.fill(-1);
 for(let span=0;span<n;span++)for(let i=0;i+span<n;i++){
  const j=i+span,id=ix(i,j);
  let best=i<j?centroidDP[ix(i+1,j)]:0, chosen=-1;
  for(let k=i+MIN;k<=j;k++){
   const prob=allPairProbabilities[ix(i,k)];if(prob<=0.5)continue;
   const score=2*prob-1+(i+1<=k-1?centroidDP[ix(i+1,k-1)]:0)
     +(k+1<=j?centroidDP[ix(k+1,j)]:0);
   if(score>best+1e-12){best=score;chosen=k;}
  }
  centroidDP[id]=best;centroidChoice[id]=chosen;
 }
 const centroidChars=Array(n).fill('.'),centroidPairs=[];
 const stackCentroid=[[0,n-1]];
 while(stackCentroid.length){
  const [i,j]=stackCentroid.pop();if(i>j)continue;
  const k=centroidChoice[ix(i,j)];
  if(k<0){if(i<j)stackCentroid.push([i+1,j]);continue;}
  centroidChars[i]='(';centroidChars[k]=')';centroidPairs.push([i+1,k+1]);
  if(k+1<=j)stackCentroid.push([k+1,j]);if(i+1<=k-1)stackCentroid.push([i+1,k-1]);
 }
 centroidPairs.sort((a,b)=>a[0]-b[0]);
 const centroidStructure=centroidChars.join('');
 let ensembleDiversity=0,centroidExpectedDistance=expectedPairs,mfeExpectedDistance=expectedPairs;
 for(let i=0;i<n;i++)for(let j=i+MIN;j<n;j++){
  const prob=allPairProbabilities[ix(i,j)];
  if(!prob)continue;
  ensembleDiversity+=2*prob*(1-prob);
 }
 for(const [i,j] of centroidPairs)centroidExpectedDistance+=1-2*allPairProbabilities[ix(i-1,j-1)];
 const mfe=core.fold(seq), mfeEnergyRaw=core.evaluateStructure(seq,mfe.dotBracket).deltaG37Raw;
 const mfeProbability=Math.exp(-mfeEnergyRaw/RT)/Z;
 let mfePairedConfidence=0;
 for(const [i,j] of mfe.pairs){
  const prob=allPairProbabilities[ix(i-1,j-1)];
  mfePairedConfidence+=prob;
  mfeExpectedDistance+=1-2*prob;
 }
 if(mfe.pairs.length)mfePairedConfidence/=mfe.pairs.length;

 return {version:VERSION,sequence:seq,length:n,temperatureC:37,rtKcal:RT,partitionFunction:Z,
  ensembleFreeEnergy:-RT*Math.log(Z),expectedPairs,unpairedProbability,
  centroidStructure,centroidPairs,centroidPairCount:centroidPairs.length,
  centroidExpectedDistance, mfeExpectedDistance, expectedEnsemblePairDistance:ensembleDiversity,
  mfeMeanPairingProbability:mfe.pairs.length?mfePairedConfidence:null,
  centroidMethod:'minimum expected base-pair symmetric difference; noncrossing, hairpin span >= 3',

  cutoff,probabilities,mfeStructure:mfe.dotBracket,mfeDeltaG:mfe.deltaG37,
  mfeProbability:Math.min(1,Math.max(0,mfeProbability)),pairingProbabilityMethod:'inside/outside exact under NEXUS restricted energy model',
  limitations:[
   'Exact probabilities for the NEXUS v0.5 restricted thermodynamic model, NOT ViennaRNA parameter-equivalent probabilities.',
   'Specialized internal loop tables, sequence-complete mismatches, dangling ends, coaxial stacking and pseudoknots remain unavailable.',
   'Unmodified RNA, fixed 37 °C parameters; secondary structures are not experimentally validated.',
   'MFE structure probability is exact within the restricted model using unrounded energies.'
  ]};
}
return Object.freeze({run,MAX,VERSION});
});
