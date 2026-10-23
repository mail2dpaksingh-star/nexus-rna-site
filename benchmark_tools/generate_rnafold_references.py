#!/usr/bin/env python3
"""Generate genuinely external reference results with a locally installed RNAfold CLI.
No ViennaRNA binary/parameter file included. No network access required.
Usage: python benchmark_tools/generate_rnafold_references.py --cases tools/seqfold/benchmarks/challenge_cases.json --out references.json
"""
import argparse
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

FLAGS = ['--noPS', '-d0', '-T', '37']

def generate(cases, exe='RNAfold'):
    if not shutil.which(exe):
        raise RuntimeError('RNAfold not found on PATH. Install ViennaRNA separately (license permitting); no results were fabricated.')
    proc = subprocess.run([exe,'--version'],capture_output=True,text=True,check=True,timeout=10)
    version=(proc.stdout or proc.stderr).strip().splitlines()[0]
    out=[]
    for item in cases:
        seq=str(item['sequence']).upper().replace('T','U')
        if not re.fullmatch('[ACGU]+',seq):raise ValueError(f"{item['id']}: noncanonical alphabet")
        job = subprocess.run([exe,*FLAGS], input=seq+'\n',text=True,capture_output=True,check=True,timeout=50)
        lines=[x.strip() for x in job.stdout.splitlines() if x.strip()]
        if not lines or lines[0]!=seq:raise RuntimeError(f"Unexpected RNAfold output for {item['id']}: {job.stdout[:240]}")
        matched=None
        for line in lines[1:]:
            m=re.fullmatch(r'([().]+)\s+\(\s*([-+]?\d+(?:\.\d+)?)\s*\)',line)
            if m and len(m[1])==len(seq):matched=m;break
        if not matched: raise RuntimeError(f"Cannot parse MFE for {item['id']}: {job.stdout[:240]}")
        out.append({'id':str(item['id']),'sequence':seq,'reference_structure':matched[1],
                    'reference_dg':float(matched[2]),'source':'ViennaRNA RNAfold executable',
                    'source_version':version,'options':' '.join(FLAGS),
                    'provenance_type':'independently_executed_RNAfold',
                    'notes':'GU-enabled external RNAfold reference, special loops enabled and dangles suppressed; NOT model matched for loop/dangle/parameter assumptions. Computed '+datetime.now(timezone.utc).isoformat()+'; reference model is NOT parameter-matched to the incomplete NEXUS model.'})
    return out

def main():
    p=argparse.ArgumentParser();p.add_argument('--cases',default='tools/seqfold/benchmarks/challenge_cases.json');p.add_argument('--out',default='rnafold_references.json');p.add_argument('--exe',default='RNAfold');args=p.parse_args()
    cases=json.loads(Path(args.cases).read_text())
    refs=generate(cases,args.exe)
    Path(args.out).write_text(json.dumps(refs,indent=2)+'\n')
    print(f'Wrote {len(refs)} independently generated reference predictions to {args.out}')
if __name__=='__main__':main()
