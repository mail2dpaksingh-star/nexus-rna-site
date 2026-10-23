"""Independent Python scoring of NEXUS-selected structures (not an independent RNAfold benchmark).
Duplicates explicitly cited restricted-model numeric constants in a different implementation
so that traceback/dynamic-programming indexing bugs become visible.
"""
import json, math, random, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
PARAM=[('AA','UU',-.93),('AU','UA',-1.10),('UA','AU',-1.33),('CU','GA',-2.08),('CA','GU',-2.11),('GU','CA',-2.24),('GA','CU',-2.35),('CG','GC',-2.36),('GG','CC',-3.26),('GC','CG',-3.42)]
STACK={}
for x,y,v in PARAM:
    STACK[(x,y)]=v
    STACK[(y[::-1],x[::-1])]=v
HP={3:5.4,4:5.6,5:5.7,6:5.4,7:6.0,8:5.5,9:6.4}
BL={1:3.81,2:2.9,3:3.2,4:3.6,5:4.0,6:4.4}
IT={2:.5,3:1.6,4:1.1,5:2.1,6:1.9}
END=lambda x:.45 if x in ('AU','UA') else 0.0

def score(seq,db):
    pairs=[];opens=[]
    for i,c in enumerate(db):
        if c=='(':opens.append(i)
        elif c==')':pairs.append((opens.pop(),i))
    pairs.sort()
    child={x:[] for x in pairs};roots=[]
    for i,j in pairs:
        parent=min((x for x in pairs if x[0]<i<j<x[1]),key=lambda x:x[1]-x[0],default=None)
        if parent is None:roots.append((i,j))
        else:child[parent].append((i,j))
    def energy(pair):
        i,j=pair;children=child[pair];outer=seq[i]+seq[j]
        if not children:
            n=j-i-1
            return (HP[n] if n<=9 else 6.4+1.08*math.log(n/9))+END(outer)
        assert len(children)==1,'restricted model excludes multibranch loops'
        p,q=children[0];l=p-i-1;r=j-q-1;inner=seq[p]+seq[q]
        stack=STACK.get((seq[i]+seq[p],seq[j]+seq[q]),0)
        if l+r==0: loop=stack
        elif l*r==0:
            n=l+r;loop=BL[n] if n<=6 else 4.4+1.08*math.log(n/6)
            loop+=(stack if n==1 else END(outer)+END(inner))
        else:
            n=l+r;loop=(IT[n] if n<=6 else 1.9+1.08*math.log(n/6))+.6*abs(l-r)+END(outer)+END(inner)
        return loop+energy(children[0])
    return round(sum(energy(x) for x in roots),2)

rng=random.Random(20261022)
sequences=['GGGAAACCC','AAAAAAAAAAAA','GGGAAACCCUUUGGG']+[''.join(rng.choices('ACGU',k=rng.randint(10,42))) for _ in range(80)]
script='const f=require("./tools/seqfold/thermofold-core-v01.js"); let a=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(JSON.stringify(a.map(s=>f.fold(s))))'
res=subprocess.run(['node','-e',script],input=json.dumps(sequences),cwd=ROOT,text=True,capture_output=True,check=True)
for item in json.loads(res.stdout):
    oracle=score(item['sequence'],item['dotBracket'])
    assert abs(oracle-item['deltaG37'])<=0.01,(item['sequence'],oracle,item['deltaG37'])
print(f'PASS: {len(sequences)} independent Python structure-energy checks agree with NEXUS restricted-model traceback (not external thermodynamic parity).')
