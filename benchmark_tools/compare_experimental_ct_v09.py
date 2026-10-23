#!/usr/bin/env python3
"""Compare independent NEXUS folds to deposited experimental/curated CT structures.
Inputs are user-supplied from source databases. No example structure is claimed experimental.
Manifest CSV columns: id,ct_path,source_accession,evidence_type,source_url
"""
import argparse,csv,json,subprocess,math
from pathlib import Path
from run_rnastructure_references_v09 import parse_ct

def read_ct(p):
    lines=[x for x in Path(p).read_text().splitlines() if x.strip()]
    if not lines:raise ValueError('Empty CT file')
    n=int(lines[0].split()[0]);seq=''.join(row.split()[1].upper().replace('T','U') for row in lines[1:n+1]);assert len(seq)==n
    structure,_=parse_ct('\n'.join(lines[:n+1]),seq)
    return seq,structure

def pairs(s):
    stack=[];out=set()
    for j,c in enumerate(s):
        if c=='(':stack.append(j)
        if c==')':
            if not stack:raise ValueError('Unbalanced structure')
            out.add((stack.pop(),j))
    if stack:raise ValueError('Unbalanced structure')
    return out

def metric(pred,ref):
    a,b=pairs(pred),pairs(ref);tp=len(a&b)
    p=tp/len(a) if a else (1. if not b else 0.)
    r=tp/len(b) if b else (1. if not a else 0.)
    return {'reference_pairs':len(b),'predicted_pairs':len(a),'true_positive':tp,
            'ppv':p,'sensitivity':r,'f1':2*p*r/(p+r) if p+r else 0.}

def evaluate(manifest,engine):
    rows=list(csv.DictReader(Path(manifest).open()))
    if not rows:raise ValueError('No experimentally supported structures provided; accuracy status remains BLOCKED.')
    results=[]
    for row in rows:
        for field in ['id','ct_path','source_accession','evidence_type','source_url']:
            if not row.get(field):raise ValueError('Missing source metadata: '+field)
        seq,reference=read_ct(row['ct_path'])
        script="const f=require(process.argv[1]); const r=f.fold(process.argv[2]); console.log(JSON.stringify({structure:r.dotBracket,energy:r.deltaG37,version:r.version}));"
        p=subprocess.run(['node','-e',script,str(engine),seq],capture_output=True,text=True,timeout=50)
        if p.returncode:raise RuntimeError(p.stderr[:300])
        pred=json.loads(p.stdout)
        m=metric(pred['structure'],reference)
        results.append({**row,'sequence_length':len(seq),'nexus_version':pred['version'],'prediction_dg37':pred['energy'],**m})
    return {'evidence':'user-supplied experimentally supported CT references; evidence_type/source records are not independently audited',
            'number_of_experimental_cases':len(results),'mean_f1':sum(r['f1'] for r in results)/len(results),
            'rows':results}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--engine',default='tools/seqfold/thermofold-core.js');p.add_argument('--out',required=True);a=p.parse_args()
    report=evaluate(a.manifest,Path(a.engine).resolve())
    Path(a.out).write_text(json.dumps(report,indent=2)+'\n');print('Evaluated',len(report['rows']),'real CT records with supplied provenance')
