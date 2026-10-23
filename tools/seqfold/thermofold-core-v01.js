/* NEXUS ThermoFold v0.1 — independently written research prototype.
   Partial Turner-style nearest-neighbor model; 37°C only. NOT ViennaRNA / full Turner 2004.
   Canonical Watson-Crick pairs only. Multibranch loops, coaxial/dangling energies, special
   sequence-dependent hairpin and internal-loop corrections are NOT incorporated.
   No copied ViennaRNA source or parameter file. Published numerical values are cited in guide.
*/
(function(root, factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  root.NexusThermoFold=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const VERSION='0.1.0', MAX=280, LOOP_MIN=3, MAX_INTERNAL=10;
  const pairSet=new Set(['AU','UA','CG','GC']);
  const stack={};
  function add(top,bottom,value){
    stack[top+'/'+bottom]=value;
    stack[bottom.split('').reverse().join('')+'/'+top.split('').reverse().join('')]=value;
  }
  // 37°C standard-state duplex nearest-neighbor ΔG entries, kcal/mol;
  // values cited from Turner 2004 Watson-Crick stacking table.
  add('AA','UU',-0.93); add('AU','UA',-1.10); add('UA','AU',-1.33);
  add('CU','GA',-2.08); add('CA','GU',-2.11); add('GU','CA',-2.24);
  add('GA','CU',-2.35); add('CG','GC',-2.36); add('GG','CC',-3.26);
  add('GC','CG',-3.42);
  const hairpinInitiation={3:5.4,4:5.6,5:5.7,6:5.4,7:6.0,8:5.5,9:6.4};
  const internalInit={2:0.5,3:1.6,4:1.1,5:2.1,6:1.9};
  // Simple bulge-initiation approximations; NOT exhaustive Turner tables.
  const bulgeInit={1:3.81,2:2.9,3:3.2,4:3.6,5:4.0,6:4.4};
  const endPenalty=(p)=> (p==='AU'||p==='UA')?0.45:0;
  function normalize(raw){
    const lines=String(raw||'').trim().split(/\r?\n/).filter(x=>!/^\s*>/.test(x));
    const clean=lines.join('').replace(/\s|\d/g,'').toUpperCase().replace(/T/g,'U');
    if(!clean)throw Error('Enter an RNA sequence or FASTA record.');
    if(/[^ACGU]/.test(clean))throw Error('Only unmodified A, C, G, U are supported in ThermoFold v0.1.');
    if(clean.length>MAX)throw Error(`ThermoFold v0.1 supports up to ${MAX} nt for global limited-model folding. Use SeqFold segmented preview for longer sequences.`);
    return clean;
  }
  const isPair=(a,b)=>pairSet.has(a+b);
  function hairpinPenalty(n, closing){
    if(n<3)return Infinity;
    const base=n<=9?hairpinInitiation[n]:6.4+1.08*Math.log(n/9);
    return base+endPenalty(closing);
  }
  function bulgePenalty(n, outer, inner, stackValue){
    let v=n<=6?bulgeInit[n]:4.4+1.08*Math.log(n/6);
    // A single-nucleotide bulge can preserve a stacking interaction.
    if(n===1)return v+stackValue;
    return v+endPenalty(outer)+endPenalty(inner);
  }
  function internalPenalty(l,r,outer,inner){
    const total=l+r;
    let e=total<=6?internalInit[total]:1.9+1.08*Math.log(total/6);
    // Approximation excludes sequence-dependent mismatch tables / tandem exceptional cases.
    return e+0.6*Math.abs(l-r)+endPenalty(outer)+endPenalty(inner);
  }
  function fold(raw){
    const s=normalize(raw), n=s.length;
    const v=new Float64Array(n*n);v.fill(Infinity);
    const choice=new Int32Array(n*n);choice.fill(-2);
    let candidatePairs=0;
    for(let span=LOOP_MIN+1; span<n; span++){
      for(let i=0; i+span<n; i++){
        const j=i+span, ij=i*n+j, outer=s[i]+s[j];
        if(!pairSet.has(outer))continue;
        candidatePairs++;
        let best=hairpinPenalty(j-i-1,outer), bestInner=-1;
        for(let l=0;l<=MAX_INTERNAL;l++){
          const p=i+l+1;
          if(p>=j-LOOP_MIN-1)break;
          for(let r=0;r<=MAX_INTERNAL-l;r++){
            const q=j-r-1;
            if(q-p<LOOP_MIN+1)continue;
            const inner=s[p]+s[q];
            if(!pairSet.has(inner))continue;
            const inside=v[p*n+q];
            if(!Number.isFinite(inside))continue;
            const top=s[i]+s[p], bottom=s[j]+s[q];
            const stackValue=stack[top+'/'+bottom];
            let loop;
            if(l===0&&r===0){
              if(stackValue===undefined)continue;
              loop=stackValue;
            } else if(l===0||r===0){
              // For 1 nt bulges, virtual helix stacking uses the nearest-pair bases.
              loop=bulgePenalty(l+r,outer,inner,stackValue===undefined?0:stackValue);
            } else {
              loop=internalPenalty(l,r,outer,inner);
            }
            const value=inside+loop;
            if(value<best-1e-9){best=value;bestInner=p*n+q;}
          }
        }
        v[ij]=best;choice[ij]=bestInner;
      }
    }
    // Exterior dynamic programming: multiple independent stems allowed, but NOT
    // multibranch loops enclosed by another pair.
    const f=new Float64Array(n+1), exterior=new Int32Array(n+1);exterior.fill(-1);
    for(let j=1;j<=n;j++){
      let best=f[j-1], start=-1;
      for(let i=0;i<j-LOOP_MIN-1;i++){
        const e=v[i*n+(j-1)];
        if(!Number.isFinite(e))continue;
        const trial=f[i]+e; // No external dangles in this partial model.
        if(trial<best-1e-9){best=trial;start=i;}
      }
      f[j]=best;exterior[j]=start;
    }
    const db=Array(n).fill('.'), pairList=[];
    function tracePair(i,j){
      db[i]='(';db[j]=')';pairList.push([i+1,j+1]);
      let k=choice[i*n+j];
      if(k>=0){ const p=Math.floor(k/n),q=k%n;tracePair(p,q); }
    }
    for(let j=n;j>0;){const i=exterior[j];if(i<0){j--;} else {tracePair(i,j-1);j=i;}}
    pairList.sort((a,b)=>a[0]-b[0]);
    const dotBracket=db.join(''), energy=Math.round(f[n]*100)/100;
    const warnings=[
      'ΔG37 is a minimum within the restricted NEXUS model, not a ViennaRNA-equivalent global MFE.',
      'GU wobble, multibranch loops, coaxial stacking, dangling ends, sequence-dependent loop corrections and modified bases are not modeled.',
      '37°C only; no enthalpy/entropy temperature extrapolation, no partition function or base-pair probabilities.'
    ];
    return {version:VERSION,sequence:s,length:n,dotBracket,deltaG37:energy,unit:'kcal/mol',
      model:'NEXUS partial nearest-neighbor MFE (canonical AU/GC; no multibranch loops)',
      modelCompleteness:'incomplete — research prototype',parameterTemperatureC:37,
      pairs:pairList,pairCount:pairList.length,candidatePairs,warnings};
  }
  return {fold,normalize,VERSION,MAX,stackEnergy:(top,bottom)=>stack[top+'/'+bottom]};
});
