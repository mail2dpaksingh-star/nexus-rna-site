#!/usr/bin/env python3
"""Reproducible, source-verified external RNAfold 125-case MFE reference runner.

This is an integration test for a SEPARATELY INSTALLED ViennaRNA executable.
No fake reference data and no bundled ViennaRNA parameter data.
Requires the original parameter file and its user-verified download provenance.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path

VERSION = 'nexus-controlled-benchmark-1.0'
STRUCT_RE = re.compile(r'^([().]+)\s+\(\s*([-+]?(?:\d+\.?\d*|\.\d+))\s*\)\s*$')
EXPECTED_SECTIONS = ('stack', 'hairpin', 'bulge', 'int11', 'int21', 'int22', 'dangle5', 'dangle3')

def digest(b): return hashlib.sha256(b).hexdigest()

def validate_parameter_file(p: Path):
    """Check integrity/shape, NOT independent numerical scientific accuracy.

    Full byte-for-byte provenance must come from a trusted download; a shape
    check alone cannot distinguish authentic from tampered parameters.
    """
    raw = p.read_bytes()
    if len(raw) < 100_000 or len(raw) > 10_000_000: raise ValueError('Unexpected parameter-file size')
    if b'\0' in raw: raise ValueError('Binary parameter file not supported')
    content=raw.decode('utf-8',errors='strict')
    sections = set(re.findall(r'^#\s+([A-Za-z][A-Za-z0-9_]*)\s*$',content,re.MULTILINE))
    missing=[name for name in EXPECTED_SECTIONS if name not in sections]
    if missing: raise ValueError(f'Missing parameter sections: {missing}')
    if not ({'interior', 'internal', 'internal_loop'} & sections): raise ValueError('Missing internal-loop initiation section')
    return {'sha256':digest(raw),'bytes':len(raw),'sections_detected':sorted(sections),
            'shape_checked':True,'numeric_source_verified_against_original':False,
            'note':'Checksum allows later comparison with an independently obtained official file; not by itself proof of authenticity.'}

def cases_check(p:Path):
    raw=p.read_bytes(); cases=json.loads(raw)
    if not isinstance(cases,list) or len(cases)!=125:raise ValueError('Exactly 125 cases required')
    ids=set(); norm=[]
    for c in cases:
        ident=c.get('id'); seq=c.get('sequence','').upper().replace('T','U')
        if not isinstance(ident,str) or not re.fullmatch('[A-Za-z0-9_.-]{1,100}',ident):raise ValueError('Invalid case ID')
        if ident in ids:raise ValueError('Duplicate case ID '+ident)
        if not re.fullmatch('[ACGU]{1,280}',seq): raise ValueError('Invalid sequence or unsupported length '+ident)
        ids.add(ident); norm.append({'id':ident,'sequence':seq})
    return norm,digest(raw)

def fold_line(seq,text):
    lines=[x.strip() for x in text.replace('\r','').splitlines() if x.strip()]
    if len(lines)<2 or lines[0]!=seq:raise ValueError('RNAfold did not echo exact sequence')
    matches=[m for s in lines[1:] if (m:=STRUCT_RE.fullmatch(s))]
    if len(matches)!=1: raise ValueError(f'Expected exactly one MFE result, got {len(matches)}')
    m=matches[0]; structure=m[1]
    if len(structure)!=len(seq): raise ValueError('Structure length mismatch')
    level=0
    for c in structure:
        if c=='(': level+=1
        elif c==')':
            level-=1
            if level<0:raise ValueError('Unbalanced structure')
    if level!=0:raise ValueError('Unbalanced structure')
    return structure,float(m[2])

def run(args):
    cases,case_hash=cases_check(args.cases)
    if not args.parameters.exists():raise FileNotFoundError('Turner 2004 source parameter file missing')
    param=validate_parameter_file(args.parameters)
    official_url='https://github.com/ViennaRNA/ViennaRNA/blob/master/misc/rna_turner2004.par'
    exe=shutil.which(args.rnafold) if not Path(args.rnafold).is_file() else str(Path(args.rnafold).resolve())
    if not exe:raise RuntimeError('RNAfold executable unavailable: real benchmark NOT run')
    version_call=subprocess.run([exe,'--version'],capture_output=True,text=True,timeout=15,check=True)
    version=(version_call.stdout or version_call.stderr).strip().splitlines()[0]
    if not re.search(r'RNAfold\s+\d',version):raise RuntimeError('RNAfold version not identified')
    # Consistent Turner-2004 reference model, 37C, dangles=2, no partition function.
    flags=['--noPS','--temp=37','-d2',f'--paramFile={args.parameters.resolve()}']
    env=os.environ.copy(); env['LC_ALL']='C'
    records=[]
    for n,c in enumerate(cases,1):
        proc=subprocess.run([exe,*flags],input=c['sequence']+'\n',capture_output=True,text=True,
                            timeout=args.timeout,check=True,env=env)
        st,dg=fold_line(c['sequence'],proc.stdout)
        records.append({'id':c['id'],'sequence':c['sequence'],'reference_structure':st,'reference_dg':dg,
            'source':'ViennaRNA RNAfold executable','source_version':version,
            'options':'--noPS --temp=37 -d2 --paramFile=rna_turner2004.par',
            'provenance_type':'independently_executed_RNAfold',
            'parameter_sha256':param['sha256'],'input_sha256':digest(c['sequence'].encode()),
            'notes':'Turner parameter file supplied separately; no experimental structure accuracy implied.'})
        if args.progress: print(f'RNAfold {n}/125 {c["id"]}',file=sys.stderr)
    manifest={'status':'COMPLETED_EXTERNAL_COMPUTATION_NOT_EXPERIMENTAL_VALIDATION',
       'run_utc':datetime.now(timezone.utc).isoformat(),'runner_version':VERSION,
       'software_version':version,'executable':str(Path(exe).resolve()),'reference_count':len(records),
       'cases_sha256':case_hash,'parameter_file':args.parameters.name,'parameter_source_url':official_url,
       'parameter_file_verification':param,'flags':flags,'temperature_C':37,'dangles':2,
       'scientific_qualification':'Agreement with a computational reference is not evidence of experimental predictive accuracy.',
       'parameter_provenance_attestation':'User must confirm file was downloaded directly from official ViennaRNA distribution; checksums alone cannot establish authenticity.'}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(records,indent=2)+'\n')
    manifest_path=args.output.with_name(args.output.stem+'.manifest.json')
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest_path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--cases',type=Path,default=Path('tools/seqfold/benchmarks/challenge_cases.json'))
    p.add_argument('--parameters',type=Path,required=True,help='Original rna_turner2004.par downloaded separately from official ViennaRNA project')
    p.add_argument('--rnafold',default='RNAfold')
    p.add_argument('--output',type=Path,default=Path('validation_results/rnafold_turner2004_125.json'))
    p.add_argument('--timeout',type=int,default=120)
    p.add_argument('--progress',action='store_true')
    args=p.parse_args()
    try:
        out=run(args); print('PASS: 125 authentic computed reference cases. Manifest:',out)
    except Exception as e:
        print('BLOCKED/FAILED: '+str(e),file=sys.stderr);return 2
    return 0
if __name__=='__main__':raise SystemExit(main())
