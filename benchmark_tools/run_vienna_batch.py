#!/usr/bin/env python3
"""Generate real ViennaRNA references on a machine where RNAfold is installed.

This is a *caller*, not a distribution of ViennaRNA. No model output is
synthesized if the reference executable is absent. Pure Python standard library.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone

FLAGS = ('--noPS', '--temp=37', '-d2')
STRUCT = re.compile(r'^([().]+)\s+\(\s*([-+]?\d+(?:\.\d+)?)\s*\)$')

def parse_stdout(seq: str, stdout: str):
    lines = [x.strip() for x in stdout.replace('\r', '').split('\n') if x.strip()]
    if lines and lines[0].startswith('>'):
        lines = lines[1:]
    if not lines or lines[0] != seq:
        raise ValueError('Reference output has a missing or mismatched sequence')
    for x in lines[1:]:
        m = STRUCT.fullmatch(x)
        if m:
            if len(m[1]) != len(seq):
                raise ValueError('Reference MFE structure length mismatch')
            st = []
            for c in m[1]:
                if c == '(':
                    st.append(c)
                if c == ')':
                    if not st:
                        raise ValueError('Unbalanced closing pair in reference output')
                    st.pop()
            if st:
                raise ValueError('Unbalanced opening pair in reference output')
            return m[1], float(m[2])
    raise ValueError('No standard RNAfold MFE structure and energy line found')

def run(cases_path: Path, outfile: Path, executable: str = 'RNAfold', seconds: int=60):
    resolved = shutil.which(executable)
    if not resolved:
        raise RuntimeError('RNAfold executable not installed. Benchmark NOT performed and no substitute data generated.')
    cases = json.loads(cases_path.read_text(encoding='utf-8'))
    if not isinstance(cases,list) or not cases: raise ValueError('Expected a nonempty JSON case list')
    version_run = subprocess.run([resolved,'--version'],capture_output=True,text=True,timeout=10,check=True)
    version=(version_run.stdout or version_run.stderr).strip().splitlines()[0]
    if not version.startswith('RNAfold'):
        raise ValueError('Unexpected reference executable version string')
    seen=set();records=[]
    for row in cases:
        rid = str(row['id'])
        if not re.fullmatch(r'[A-Za-z0-9_.-]{1,90}',rid) or rid in seen:
            raise ValueError('Invalid or duplicate case ID')
        seen.add(rid)
        seq = str(row['sequence']).upper().replace('T','U')
        if not re.fullmatch('[ACGU]{1,3000}',seq):
            raise ValueError(f'Noncanonical or overly long RNA in {rid}')
        proc=subprocess.run([resolved,*FLAGS],input=seq+'\n',capture_output=True,text=True,timeout=seconds,check=True)
        structure,energy = parse_stdout(seq,proc.stdout)
        records.append({'id':rid,'sequence':seq,'reference_structure':structure,'reference_dg':energy,
                        'source':'ViennaRNA RNAfold executable','source_version':version,
                        'options':' '.join(FLAGS)+'; unmodified RNA; default Turner 2004 parameters',
                        'provenance_type':'independently_executed_RNAfold',
                        'notes':'No claims of experimental structural accuracy; user-run independent reference.'})
    raw=cases_path.read_bytes()
    manifest={'generated_at_utc':datetime.now(timezone.utc).isoformat(),
              'executable_path':resolved,'executable_version':version,
              'command':[Path(resolved).name,*FLAGS], 'cases_sha256':hashlib.sha256(raw).hexdigest(),
              'record_count':len(records),'status':'independently_executed',
              'caveat':'Computational agreement is not experimental secondary-structure validation; this reference does not make NEXUS model thermodynamically equivalent.'}
    outfile.parent.mkdir(parents=True,exist_ok=True)
    outfile.write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
    outfile.with_suffix('.manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    return len(records)

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--cases',type=Path,default=Path('tools/seqfold/benchmarks/challenge_cases.json'))
    p.add_argument('--output',type=Path,default=Path('rnafold_external_references.json'))
    p.add_argument('--rnafold',default='RNAfold')
    p.add_argument('--timeout',type=int,default=60)
    a=p.parse_args()
    try:
        count=run(a.cases,a.output,a.rnafold,a.timeout)
        print(f'PASS: {count} independently computed RNAfold results saved to {a.output}.')
    except Exception as e:
        print(f'BLOCKED/FAILED: {e}',file=sys.stderr)
        return 2
    return 0
if __name__=='__main__': raise SystemExit(main())
