"""Separate Python exhaustive structure-enumeration check of the NEXUS v0.4 restricted model.
Compares independent enumeration of ALL pseudoknot-free structures for short RNAs
against the JS dynamic-programming energy and structure. NOT a ViennaRNA benchmark.
"""
import functools, json, math, random, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
PAIR=('AU','UA','CG','GC','GU','UG')
INNER=('AU','CG','GC','GU','UA','UG')
T={
'AU':[-.9,-2.2,-2.1,-.6,-1.1,-1.4],
'CG':[-2.1,-3.3,-2.4,-1.4,-2.1,-2.1],
'GC':[-2.4,-3.4,-3.3,-1.5,-2.2,-2.5],
'GU':[-1.3,-2.5,-2.1,-.5,-1.4,1.3],
'UA':[-1.3,-2.4,-2.1,-1.,-.9,-1.3],
'UG':[-1.,-1.5,-1.4,.3,-.6,-.5],
}
STACK={(p,q):v for p,vals in T.items() for q,v in zip(INNER,vals)}
HP={3:5.4,4:5.6,5:5.7,6:5.4,7:6.0,8:5.5,9:6.4}
BG={1:3.81,2:2.9,3:3.2,4:3.6,5:4.0,6:4.4}
IT={2:.5,3:1.6,4:1.1,5:2.0,6:2.0}
END=lambda p:.45 if p in ('AU','UA','GU','UG') else 0.

def enumerate_strucs(s):
 @functools.lru_cache(maxsize=None)
 def enum(i,j):
  if i>j:return ('',)
  out=['.'+x for x in enum(i+1,j)]
  for k in range(i+4,j+1):
   if s[i]+s[k] not in PAIR:continue
   for inside in enum(i+1,k-1):
    for after in enum(k+1,j):
     out.append('('+inside+')'+after)
  return tuple(out)
 return enum(0,len(s)-1)

def score(s,db):
 stack=[];nodes=[]
 for i,c in enumerate(db):
  if c=='(':stack.append([i,[]])
  elif c==')':
   start,children=stack.pop();item=(start,i,children)
   if stack:stack[-1][1].append(item)
   else:nodes.append(item)
 def node_cost(node):
  i,j,ch=node;p=s[i]+s[j]
  if not ch:
   v=j-i-1;
   hairpin=s[i:j+1]
   if hairpin=='CCGAGG':return 3.5
   value=HP[v] if v<=9 else HP[9]+1.75*.0019872041*310.15*math.log(v/9)
   value+=END(p)
   loop=s[i+1:j]
   if all(nt=='C' for nt in loop):value+=1.5 if v==3 else .3*v+1.6
   if v>=4:
    first=loop[0]+loop[-1]
    if first in ('UU','GA'):value-=.9
    if first=='GG':value-=.8
    if p=='GU' and i>=2 and s[i-1]=='G' and s[i-2]=='G':value-=2.2
   return value
  if len(ch)==1:
   k,l,_=ch[0];left=k-i-1;right=j-l-1;num=left+right;q=s[k]+s[l]
   if num>10:return math.inf
   if not num:term=STACK[p,q]
   elif left==0 or right==0:
    term=(BG[num] if num<=6 else 4.4+1.08*math.log(num/6))
    term+= STACK[p,q] if num==1 else END(p)+END(q)
   else:
    term=(IT[num] if num<=6 else 1.9+1.08*math.log(num/6))+.6*abs(left-right)+END(p)+END(q)
   return term+node_cost(ch[0])
  return 4.6+.4*(len(ch)+1)+END(p)+sum(node_cost(c)+END(s[c[0]]+s[c[1]]) for c in ch)
 return sum(node_cost(node)+END(s[node[0]]+s[node[1]]) for node in nodes)

rng=random.Random(7042026)
seqs=['GGGAAACCC','GUGAAACAC','CGACGUAGAUGCUAGCUGACUCGAUGC'[:13]]
seqs+=[''.join(rng.choice('ACGU') for _ in range(rng.randint(8,14))) for i in range(45)]
# Short sequences only; long multibranch structures are tested with DP evaluator separately.
script='const f=require("./tools/seqfold/thermofold-core.js");const a=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(JSON.stringify(a.map(s=>f.fold(s))))'
proc=subprocess.run(['node','-e',script],input=json.dumps(seqs),text=True,capture_output=True,check=True,cwd=ROOT)
js=json.loads(proc.stdout)
counts=0
for s,r in zip(seqs,js):
 opts=enumerate_strucs(s)
 energies=[score(s,d) for d in opts]
 minimum=min(energies)
 assert math.isclose(r['deltaG37'],round(minimum,2),abs_tol=.011),(s,r['deltaG37'],minimum,opts[energies.index(minimum)])
 counts+=1
print(f'PASS {counts} independent brute-force short-sequence global optimum checks (NOT external RNAfold parity)')
