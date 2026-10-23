#!/usr/bin/env python3
"""Acquire official ViennaRNA Turner 2004 formatted parameter file on a networked machine.

This is an independently distributed source file, not the original NNDB archive.
The downloader logs the exact URL, retrieval time and SHA-256. Hashing is
provenance documentation, not proof that the source is experimentally correct.
Do not redistribute the downloaded file without checking third-party terms.
"""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,json,urllib.request,sys
from turner2004_125_controlled import validate_parameter_file
URL='https://raw.githubusercontent.com/ViennaRNA/ViennaRNA/v2.7.2/misc/rna_turner2004.par'

def main():
 p=argparse.ArgumentParser();p.add_argument('--out',type=Path,default=Path('reference_parameters/rna_turner2004.par'))
 a=p.parse_args()
 try:
  request=urllib.request.Request(URL,headers={'User-Agent':'NEXUS-ThermoFold-research-validation/1.0'})
  with urllib.request.urlopen(request,timeout=35) as r:
   data=r.read(10_000_001)
   if len(data)>10_000_000:raise RuntimeError('Parameter response exceeded size limit')
  a.out.parent.mkdir(parents=True,exist_ok=True); a.out.write_bytes(data)
  result=validate_parameter_file(a.out)
  result.update({'retrieved_utc':datetime.now(timezone.utc).isoformat(), 'URL':URL,
   'source':'ViennaRNA official v2.7.2 distribution Turner 2004-formatted parameter file',
   'not_original_NNDB_archive':True,
   'source_numeric_validation':'NOT independently verified against original Turner NNDB published tables',
   'terms':'Do not include third-party parameter file in a paid NEXUS redistribution without review.'})
  manifest=a.out.with_suffix('.provenance.json');manifest.write_text(json.dumps(result,indent=2)+'\n')
  print('Retrieved',a.out,'SHA256',result['sha256'],'manifest',manifest)
 except Exception as e:
  # Never leave an incomplete or unverified destination as apparently authentic.
  if a.out.exists() and a.out.stat().st_size<100_000:a.out.unlink()
  print('BLOCKED/FAILED: official source unavailable or failed shape check: '+str(e),file=sys.stderr);return 2
 return 0
if __name__=='__main__':raise SystemExit(main())
