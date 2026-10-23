"""Independent numerical check of 320 NEXUS internal-loop motif rules.
Tests the documented partial Turner-rule implementation, NOT ViennaRNA agreement.
"""
import json, math, random, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
random_gen=random.Random(190025)
P=['AU','UA','CG','GC','GU','UG']
M={'AG':-.8,'GA':-1.,'GG':-1.2,'UU':-.7}
S23={'GG':-.8,'UU':-.4}
INIT={2:.5,3:1.6,4:1.1,5:2.,6:2.}
records=[]
for k in range(320):
 l=random_gen.randint(1,6);r=random_gen.randint(1,10-l)
 o=random_gen.choice(P);q=random_gen.choice(P)
 left=''.join(random_gen.choices('ACGU',k=l));right=''.join(random_gen.choices('ACGU',k=r))
 seq=o[0]+left+q[0]+'AAA'+q[1]+right+o[1]
 p=1+l;u=p+4; j=len(seq)-1;total=l+r
 init=INIT[total] if total<=6 else 2.+1.08*math.log(total/6)
 val=init+.6*abs(l-r)+.7*(int(o in ('AU','UA','GU','UG'))+int(q in ('AU','UA','GU','UG')))
 mm1=seq[1]+seq[j-1];mm2=seq[u+1]+seq[p-1]
 if l==1 or r==1: pass
 elif (l,r) in ((2,3),(3,2)):val+=S23.get(mm1,0.)+S23.get(mm2,0.)
 elif (l,r)==(2,2):pass
 else:val+=M.get(mm1,0.)+M.get(mm2,0.)
 records.append((seq,0,j,p,u,round(val,9)))
script='''const m=require('./tools/seqfold/thermofold-core.js');
const a=JSON.parse(require('fs').readFileSync(0,'utf8'));
console.log(JSON.stringify(a.map(x=>m.internalLoopTerms(x[0],x[1],x[2],x[3],x[4]).energy)));'''
res=subprocess.run(['node','-e',script],input=json.dumps(records),cwd=ROOT,encoding='utf8',capture_output=True,check=True)
actual=json.loads(res.stdout)
for i,(record,value) in enumerate(zip(records,actual)):
 assert math.isclose(record[-1],value,abs_tol=1e-8),f'Case {i}: {record} vs {value}'
print(f'PASS {len(records)} independent partial internal-loop parameter checks (NOT ViennaRNA parity)')
