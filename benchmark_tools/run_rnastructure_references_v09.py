#!/usr/bin/env python3
"""Independent RNAstructure MFE reference. Requires separately installed RNAstructure Fold.
Usage: python benchmark_tools/run_rnastructure_references_v09.py --cases tools/seqfold/benchmarks/challenge_cases.json --out rnastructure_refs.json --exe Fold
"""
import argparse,json,subprocess,shutil,tempfile,re
from pathlib import Path

def parse_ct(text,expected):
    lines=[line.strip() for line in text.splitlines() if line.strip()]
    if not lines:raise ValueError('Empty RNAstructure CT')
    head=lines[0].split(maxsplit=1);n=int(head[0]);assert n==len(expected),'Wrong CT length'
    energy_match=re.search(r'ENERGY\s*=\s*([-+]?\d+(?:\.\d+)?)',lines[0],re.I)
    bases=[];pairs=[]
    for i,line in enumerate(lines[1:n+1],start=1):
        fields=line.split();assert len(fields)>=6 and int(fields[0])==i, 'Invalid CT nucleotide row'
        bases.append(fields[1].upper().replace('T','U'));pairs.append(int(fields[4]))
    assert ''.join(bases)==expected, 'Sequence mismatch'
    result=['.']*n
    for i,j in enumerate(pairs,start=1):
        if j>i:
            assert 1<=j<=n and pairs[j-1]==i, 'Nonreciprocal pair'
            result[i-1]='(';result[j-1]=')'
    return ''.join(result),float(energy_match[1]) if energy_match else None

def run(cases,exe='Fold'):
    full=shutil.which(exe)
    if full is None:raise RuntimeError('RNAstructure Fold executable unavailable: genuine comparisons BLOCKED (no mock substituted).')
    v=subprocess.run([full,'--version'],text=True,capture_output=True,timeout=10)
    version=(v.stdout+' '+v.stderr).strip().splitlines()[0]
    out=[]
    with tempfile.TemporaryDirectory() as d:
        for case in cases:
            seq=case['sequence'].upper().replace('T','U');ident=case['id']
            infile=Path(d)/'input.fa';ct=Path(d)/'output.ct'
            infile.write_text('>sample\n'+seq+'\n')
            proc=subprocess.run([full,str(infile),str(ct),'--mfe','-t','310.15'],capture_output=True,text=True,timeout=120)
            if proc.returncode or not ct.exists():raise RuntimeError(f'{ident}: Fold failed: {proc.stderr[-250:]}')
            structure,dg=parse_ct(ct.read_text(),seq)
            out.append({'id':ident,'sequence':seq,'reference_structure':structure,'reference_dg':dg,
                        'source':'RNAstructure Fold','source_version':version,'options':'--mfe -t 310.15',
                        'provenance_type':'independently_executed_RNAstructure'})
    return out
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--cases',default='tools/seqfold/benchmarks/challenge_cases.json');p.add_argument('--out',required=True);p.add_argument('--exe',default='Fold');args=p.parse_args()
    records=run(json.loads(Path(args.cases).read_text()),args.exe)
    Path(args.out).write_text(json.dumps(records,indent=2)+'\n');print('Generated',len(records),'real RNAstructure reference cases')
