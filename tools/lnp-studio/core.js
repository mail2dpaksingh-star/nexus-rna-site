/* NEXUS LNP formulation planning v1.0, dimensional calculations not performance prediction. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexusLNP=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const round=(x,n=3)=>Number(x.toFixed(n));
function finite(x,label,lo=0,hi=Infinity){if(x===''||x===null||x===undefined||!Number.isFinite(Number(x)))throw Error(label+' requires a finite number');let v=Number(x);if(v<lo||v>hi)throw Error(label+' must be between '+lo+' and '+hi);return v;}
function calculate(x){const names=['ionizable','phospholipid','cholesterol','peg'];const ratios=Object.fromEntries(names.map(k=>[k,finite(x[k],k,0,100)]));const sum=names.reduce((a,k)=>a+ratios[k],0);if(Math.abs(sum-100)>.001)throw Error('Lipid molar fractions must total exactly 100%; current sum '+round(sum,3)+'%.');
const mws=Object.fromEntries(names.map(k=>[k,finite(x['mw_'+k],'Molecular weight for '+k,1,100000)]));const total=finite(x.totalLipidNmol,'Total lipid nmol',0.000001,1e12);const groups=finite(x.groupsPerLipid,'Ionizable groups per ionizable lipid',0,10);const rnaUg=finite(x.rnaUg,'RNA mass (µg)',0.000001,1e12);const ntMw=finite(x.ntMW,'RNA mean nucleotide mass g/mol',200,500);
const fr=finite(x.frr,'Aqueous:organic flow-rate ratio',.0001,100000);const tfr=finite(x.tfr,'Combined flow rate',.0001,1e9);
const ligandPercent=finite(x.ligandPercent,'Targeting ligand-lipid mol%',0,100);if(ligandPercent>ratios.peg+1e-8)throw Error('Ligand–lipid mol% cannot exceed the PEG-lipid pool in this simplified model.');
const mass={};let massTotal=0;for(const n of names){const nmol=total*ratios[n]/100;const mg=nmol*mws[n]*1e-6;mass[n]={nmol:round(nmol,5),mg:round(mg,5)};massTotal+=mg;}
const phosphateNmol=rnaUg*1000/ntMw;const nominalNP=(total*ratios.ionizable/100*groups)/phosphateNmol;
const out={ratios,lipidNmol:total,mass,massTotalMg:round(massTotal,6),nominalNP:round(nominalNP,4),phosphateNmol:round(phosphateNmol,5),aqueousFlow:round(tfr*fr/(1+fr),3),organicFlow:round(tfr/(1+fr),3),initialOrganicVolumePercent:round(100/(1+fr),2),ligandLipidNmol:round(total*ligandPercent/100,5),target:String(x.target||'Unspecified research target').slice(0,120),receptor:String(x.receptor||'Not documented').slice(0,120),ligandClass:String(x.ligandClass||'none'),payloadClass:String(x.payloadClass||'mrna'),offTarget:String(x.offTarget||'unknown'),internalization:String(x.internalization||'unknown'),flags:[],version:'1.0'};
if(ligandPercent>0)out.flags.push('Ligand mol% is a formulation bookkeeping value; active surface ligand density and tissue specificity cannot be inferred.');
if(ligandPercent>0&&(out.receptor==='Not documented'||!out.receptor.trim()))out.flags.push('Specify an evidence-supported receptor or targeting biology for the proposed ligand.');
if(ligandPercent>0&&out.ligandClass==='none')out.flags.push('Nonzero ligand-lipid entered but no targeting-ligand class chosen.');
if(ligandPercent===0&&out.ligandClass!=='none')out.flags.push('A targeting ligand is selected but zero ligand-lipid input is specified.');
if(out.offTarget==='high')out.flags.push('Documented normal-tissue/off-target expression is high; receptor engagement may have substantial off-target risk.');
if(out.offTarget==='unknown')out.flags.push('Normal-tissue expression is unassessed; do not infer tissue selectivity.');
if(out.internalization==='unknown'&&ligandPercent>0)out.flags.push('Receptor internalization and functional cytosolic delivery evidence are unassessed.');
if(out.payloadClass==='selfamp')out.flags.push('Self-amplifying RNA may impose additional size, integrity and formulation-quality constraints; validate independently.');
if(out.payloadClass==='smallrna')out.flags.push('Small regulatory RNAs have different intracellular trafficking and pharmacodynamic endpoints from translated mRNA.');
if(ratios.peg===0&&ligandPercent===0)out.flags.push('No PEG-lipid entered; colloidal-stability and exposure requirements need experimental assessment.');
if(fr<1)out.flags.push('Aqueous:organic FRR below 1; evaluate mixing and solvent-exposure assumptions.');
if(x.pdi!==''&&x.pdi!==undefined){const p=finite(x.pdi,'PDI',0,1);out.pdi=p;if(p>.3)out.flags.push('Entered PDI > 0.30: investigate particle heterogeneity; this is an illustrative screening flag, not a release specification.');}
if(x.encapsulation!==''&&x.encapsulation!==undefined){const e=finite(x.encapsulation,'Encapsulation percentage',0,100);out.encapsulation=e;if(e<80)out.flags.push('Entered encapsulation < 80%: review free-RNA quantification and formulation; threshold is illustrative, not universal.');}
if(x.diameter!==''&&x.diameter!==undefined){out.diameter=finite(x.diameter,'Diameter nm',1,1000000);}
out.flags.push('Nominal N:P counts all supplied ionizable groups as protonatable sites; it is NOT a measured effective charge ratio.');
out.flags.push('Flow calculations assume two inlet streams and ignore contraction, solvent exchange, mixing efficiency and final dilution.');
out.scope='Feasibility arithmetic only; cannot predict size, potency, biodistribution, targeting, or clinical delivery.';
return out;}
return {calculate};
});
