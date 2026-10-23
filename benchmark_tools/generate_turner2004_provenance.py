#!/usr/bin/env python3
"""Create transparent acquisition manifest; never treats missing data as verified."""
from pathlib import Path
import json,hashlib,shutil,subprocess,datetime
ROOT=Path(__file__).resolve().parents[1]
case=ROOT/'tools/seqfold/benchmarks/challenge_cases.json'
rnafold=shutil.which('RNAfold');Fold=shutil.which('Fold')
src={'checked_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'source_research':'University of Rochester NNDB Turner 2004 and official ViennaRNA parameter distribution',
  'nndb_download_page':'https://rna.urmc.rochester.edu/NNDB/download.html',
  'nndb_archive_url':'https://rna.urmc.rochester.edu/NNDB/turner_2004.zip',
  'nndb_archive_observation':'HTTP 404 on 2026-10-22; original archive NOT acquired or hashed',
  'official_vienna_parameter_url':'https://github.com/ViennaRNA/ViennaRNA/blob/master/misc/rna_turner2004.par',
  'official_parameter_file_acquired':False,
  'official_parameter_file_sha256':None,
  'turner_2004_numerical_library_verified':False,
  'verified_specialized_tables_loaded':False,
  'RNAfold_executable_detected':bool(rnafold),
  'RNAstructure_Fold_detected':bool(Fold),
  'challenge_count':len(json.loads(case.read_text())),'challenge_sha256':hashlib.sha256(case.read_bytes()).hexdigest(),
  'nexus_baseline_completed':(ROOT/'validation_results/nexus_125_internal_baseline.json').exists(),
  'reference_runs_completed':0,
  'scientific_benchmark_status':'BLOCKED_MISSING_AUTHENTIC_SOURCE_AND_EXECUTABLE',
  'note':'No source content or reference output was invented; use controlled runner after acquiring official published parameter file and separately installed RNAfold.'}
path=ROOT/'validation_results/turner2004_acquisition_manifest.json';path.parent.mkdir(exist_ok=True);path.write_text(json.dumps(src,indent=2)+'\n');print(json.dumps(src,indent=2))
