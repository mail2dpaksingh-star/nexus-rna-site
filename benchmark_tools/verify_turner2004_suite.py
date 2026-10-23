#!/usr/bin/env python3
"""Validate the Turner 2004 reference run against exact 125 challenge cases.
Input results MUST be accompanied by hash-bound manifest from the controlled runner.
Never reports an accuracy claim without authentic runtime provenance.
"""
import argparse,hashlib,json,math,re,sys
from pathlib import Path

def h(x):return hashlib.sha256(x).hexdigest()
def pairs(s):
    st=[]; p=set()
    for i,c in enumerate(s):
        if c=='(':st.append(i)
        elif c==')':
            if not st:raise ValueError('Invalid structure: unmatched close')
            p.add((st.pop(),i))
        elif c!='.':raise ValueError('Invalid dot-bracket character')
    if st:raise ValueError('Invalid structure: unmatched open')
    return p

def validate(cases_file,refs_file,manifest_file):
    cases=json.loads(cases_file.read_text());refs=json.loads(refs_file.read_text());m=json.loads(manifest_file.read_text())
    if not isinstance(cases,list) or len(cases)!=125 or len(refs)!=125:raise ValueError('Require exactly 125 cases and references')
    if m.get('cases_sha256')!=h(cases_file.read_bytes()):raise ValueError('Challenge-set SHA mismatch')
    if m.get('reference_count')!=125 or m.get('status')!='COMPLETED_EXTERNAL_COMPUTATION_NOT_EXPERIMENTAL_VALIDATION':raise ValueError('Incomplete external run')
    if not re.search(r'RNAfold\s+\d',m.get('software_version','')):raise ValueError('Unversioned RNAfold')
    if not any(str(flag).startswith('--paramFile=') for flag in m.get('flags',[])):raise ValueError('Missing explicit Turner parameter flag')
    if m.get('dangles')!=2 or m.get('temperature_C')!=37:raise ValueError('Different reference conditions')
    if not re.fullmatch('[0-9a-f]{64}',m.get('parameter_file_verification',{}).get('sha256','')):raise ValueError('Missing source checksum')
    rmap={r['id']:r for r in refs}
    if len(rmap)!=125:raise ValueError('Duplicate reference IDs')
    for case in cases:
        ref=rmap.get(case['id'])
        if ref is None:raise ValueError('Missing reference '+case['id'])
        if case['sequence'].upper().replace('T','U')!=ref['sequence']:raise ValueError('Sequence mismatch '+case['id'])
        if not math.isfinite(ref['reference_dg']):raise ValueError('Non-finite ΔG')
        if len(ref['reference_structure'])!=len(ref['sequence']):raise ValueError('Structure length mismatch')
        pairs(ref['reference_structure'])
        if ref.get('parameter_sha256')!=m['parameter_file_verification']['sha256']:raise ValueError('Different parameters within run')
        if ref.get('source_version')!=m['software_version']:raise ValueError('Mixed version')
        if ref.get('provenance_type')!='independently_executed_RNAfold':raise ValueError('Simulated or untracked reference')
    return {'status':'PASS: authentic versioned 125-record external reference set structurally validated; NOT experimental validation',
        'reference_count':125,'software_version':m['software_version'],'parameter_sha256':m['parameter_file_verification']['sha256'],
        'challenge_set_sha256':m['cases_sha256']}

def main():
    a=argparse.ArgumentParser();a.add_argument('--cases',type=Path,default=Path('tools/seqfold/benchmarks/challenge_cases.json'))
    a.add_argument('--references',type=Path,required=True);a.add_argument('--manifest',type=Path,required=True);a.add_argument('--report',type=Path,default=Path('validation_results/verified_reference.json'))
    args=a.parse_args()
    try:r=validate(args.cases,args.references,args.manifest)
    except Exception as e:print('BLOCKED/FAILED: '+str(e),file=sys.stderr);return 2
    args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2));return 0
if __name__=='__main__':raise SystemExit(main())
