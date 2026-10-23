#!/usr/bin/env python3
"""Assemble independently sourced and manually verified thermodynamic entries.
Does not download, invent, interpolate, or redistribute source tables.
Input CSV columns: table,outer,inner,left,right,value
For dangles: right is blank; inner is blank; left is adjacent base.
For two-sided terminal/hairpin mismatches: inner blank; left,right are adjacent bases.
For loops: outer and inner are canonical pair strings; left/right are unpaired 5'-to-3' sequence strings.
Use --require-complete to reject missing entries. Entries must be checked against the cited source's orientation convention.
"""
import csv, json, argparse, re
from pathlib import Path
PAIRS={'AU','UA','GC','CG','GU','UG'}
BASES='ACGU'
COUNTS={'int11':576,'int21':4608,'int22':9216,'dangle5':24,'dangle3':24,'terminalMismatch':96,'hairpinMismatch':96}

def expected_keys(table):
    if table.startswith('int'):
        dims={'int11':[(1,1)],'int21':[(1,2),(2,1)],'int22':[(2,2)]}[table]
        from itertools import product
        for a,b in dims:
            for outer in sorted(PAIRS):
                for inner in sorted(PAIRS):
                    for l in product(BASES, repeat=a):
                        for r in product(BASES,repeat=b):yield f'{outer}|{inner}|{"".join(l)}|{"".join(r)}'
    elif table.startswith('dangle'):
        for p in sorted(PAIRS):
            for base in BASES:yield f'{p}|{base}'
    else:
        for p in sorted(PAIRS):
            for l in BASES:
                for r in BASES:yield f'{p}|{l}|{r}'

def build(rows, name,url,version,require_complete=False):
    tables={k:{} for k in COUNTS}
    for row in rows:
        t=(row.get('table') or '').strip();assert t in tables, f'Unknown table {t}'
        out=row['outer'].strip().upper();inn=row.get('inner','').strip().upper()
        left=row.get('left','').strip().upper();right=row.get('right','').strip().upper()
        key='|'.join([out,inn,left,right] if t.startswith('int') else [out,left] if t.startswith('dangle') else [out,left,right])
        if not re.fullmatch(r'[-+]?(?:\d+(?:\.\d*)?|\.\d+)',row['value'].strip()):raise ValueError('Non-numeric value in '+key)
        x=float(row['value']);assert abs(x)<=60, 'Invalid range'
        if key in tables[t]:raise ValueError('Duplicate entry: '+t+' / '+key)
        tables[t][key]=x
    status={}
    for t,values in tables.items():
        expected=set(expected_keys(t));actual=set(values)
        unexpected=actual-expected
        if unexpected:raise ValueError(t+' has invalid keys: '+str(list(unexpected)[:3]))
        missing=expected-actual
        status[t]={'observed':len(values),'required':len(expected),'missing':len(missing),'complete':not missing}
        if require_complete and missing:raise ValueError(f'{t}: missing {len(missing)} published entries')
    return ({'schemaVersion':'nexus-turner-pack-v1','source':{'name':name,'url':url,'version':version},'temperatureC':37,'units':'kcal/mol','tables':tables},status)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--csv',required=True);ap.add_argument('--out',required=True)
    ap.add_argument('--source-name',required=True);ap.add_argument('--source-url',required=True);ap.add_argument('--source-version',required=True)
    ap.add_argument('--require-complete',action='store_true');a=ap.parse_args()
    with open(a.csv,newline='') as f: rows=list(csv.DictReader(f))
    pack,status=build(rows,a.source_name,a.source_url,a.source_version,a.require_complete)
    Path(a.out).write_text(json.dumps(pack,indent=2)+'\n');print(json.dumps(status,indent=2))
    print('SOURCE ATTESTATION REQUIRED: verify entries against original tables and confirm orientation, rounding and redistribution terms.')
if __name__=='__main__':main()
