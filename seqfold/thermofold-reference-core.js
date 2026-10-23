/* NEXUS reference-aware thermodynamics, v0.6.
 * Parses authentic external RNAfold plain-text results; performs no ViennaRNA
 * calculations and includes no ViennaRNA library or parameters. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexusRNAfoldReference=api;})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 function normalizeSequence(s){let q=String(s||'').replace(/\s/g,'').toUpperCase().replace(/T/g,'U');if(!q||!/^[ACGU]+$/.test(q))throw Error('Only canonical RNA bases A, C, G and U are supported.');if(q.length>3000)throw Error('Browser reference viewer supports up to 3000 nt.');return q;}
 function pairList(db){const st=[],p=[];for(let i=0;i<db.length;i++){const c=db[i];if(c==='(')st.push(i);else if(c===')'){if(!st.length)throw Error('Invalid dot-bracket: unmatched closing parenthesis.');const j=st.pop();p.push([j+1,i+1]);}else if(c!=='.')throw Error('Only unpseudoknotted dot-bracket structures are supported.');}if(st.length)throw Error('Invalid dot-bracket: unmatched opening parenthesis.');return p.sort((a,b)=>a[0]-b[0]);}
 function parseRNAfold(text,version,options){
  const lines=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);let q='',db='',dg=null;
  for(let i=0;i<lines.length;i++){
   const line=lines[i];if(line[0]==='>')continue;
   if(/^[ACGUTacgut]+$/.test(line)&&!q){q=normalizeSequence(line);continue;}
   // Exact output of `RNAfold --noPS --temp=37 -d2` (not RNAfold --MEA -p).
   if(q && !db){const m=line.match(/^([().]+)\s+\(\s*([-+]?\d+(?:\.\d+)?)\s*\)\s*$/);if(m){db=m[1];dg=Number(m[2]);break;}}
  }
  if(!q||!db||dg===null||!Number.isFinite(dg))throw Error('No unambiguous RNAfold MFE sequence/structure/energy record was found. Use standard RNAfold --noPS output.');
  if(db.length!==q.length)throw Error('The RNAfold structure length does not match the sequence length.');
  const ps=pairList(db);for(const [a,b] of ps){if(!['AU','UA','GC','CG','GU','UG'].includes(q[a-1]+q[b-1]))throw Error('RNAfold structure contains an unsupported or noncanonical pair.');}
  const v=String(version||'').trim(),opts=String(options||'').trim();
  if(!/^RNAfold\s+[\w.\-]+$/i.test(v))throw Error('Enter the exact RNAfold executable version (e.g. RNAfold 2.7.2).');
  if(!opts || opts.length>300 || !/temp|37/.test(opts))throw Error('Document temperature and folding options in the provenance field.');
  return {id:'ref-1',sequence:q,dotBracket:db,deltaG37:dg,unit:'kcal/mol',pairs:ps,pairCount:ps.length,source:'ViennaRNA RNAfold',sourceVersion:v,options:opts,method:'external RNAfold MFE; not calculated by NEXUS',verifiedExternally:false,provenance:'User-supplied; source and options recorded but not cryptographically authenticated.'};
 }
 function compare(reference,pred){if(!pred||reference.sequence!==pred.sequence)throw Error('NEXUS sequence must exactly match the reference.');const p=pairList(pred.dotBracket),r=reference.pairs,A=new Set(p.map(v=>v.join('-'))),B=new Set(r.map(v=>v.join('-')));const tp=[...A].filter(v=>B.has(v)).length;const precision=p.length?tp/p.length:r.length?0:1,sensitivity=r.length?tp/r.length:p.length?0:1;return {referenceDg:reference.deltaG37,nexusDg:pred.deltaG37,dgDifference:pred.deltaG37-reference.deltaG37,referencePairs:r.length,nexusPairs:p.length,truePositive:tp,precision,sensitivity,f1:(precision+sensitivity)?2*precision*sensitivity/(precision+sensitivity):0,exact:pred.dotBracket===reference.dotBracket,note:'Agreement with a computational predictor is not experimental validation. Models differ.'};}
 return {normalizeSequence,parseRNAfold,pairList,compare};
});
