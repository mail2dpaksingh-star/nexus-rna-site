#!/usr/bin/env python3
"""Never reports completed external validation without actual executables and inputs."""
import argparse,shutil,json,csv
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--cases',default='tools/seqfold/benchmarks/challenge_cases.json');ap.add_argument('--rnafold',default='RNAfold');ap.add_argument('--rnastructure',default='Fold');ap.add_argument('--experimental-manifest',default='benchmark_tools/experimental_ct_manifest.csv');ap.add_argument('--out',default='THERMOFOLD_v09_BENCHMARK_READINESS.json');a=ap.parse_args()
cases=json.loads(Path(a.cases).read_text());ids=[v['id'] for v in cases]
if len(cases)!=125 or len(ids)!=len(set(ids)):raise SystemExit('125 unique challenge cases required')
man=Path(a.experimental_manifest);exp=[]
if man.exists():exp=list(csv.DictReader(man.open()))
report={'status':'BLOCKED: independent reference results unavailable unless executable/reference files are supplied',
    'challenge_cases_prepared':len(cases),'RNAfold_executable_found':bool(shutil.which(a.rnafold)),
    'RNAstructure_Fold_executable_found':bool(shutil.which(a.rnastructure)),
    'experimental_CT_manifest_rows':len(exp),'rnafold_benchmark_completed':False,
    'rnastructure_benchmark_completed':False,'experimental_comparison_completed':False,
    'rule':'A source-matched comparison may be marked COMPLETE only after 125 genuine records with explicit software versions, calculation options, sample identifiers and verified base-pair structures.'}
if man.exists() and exp:
    report['experimental_manifest_has_sources']=all(all(row.get(k) for k in ('source_accession','source_url','evidence_type','ct_path')) for row in exp)
Path(a.out).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
