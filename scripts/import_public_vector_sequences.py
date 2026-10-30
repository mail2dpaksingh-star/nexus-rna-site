#!/usr/bin/env python3
"""NEXUS public vector importer. Python 3 standard library only.
Fetch pinned NCBI GenBank records, check sequence and provenance, save a static JS database
for Cloudflare Pages and optional SQL seeds for a separately configured Supabase project.
No Supabase credentials or cloud writes are performed.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys
import time
import urllib.parse
import urllib.request

PUBLIC = {
    'M77789.2': {'name': 'pUC19', 'bp': 2686, 'category': 'General cloning'},
    'J01749.1': {'name': 'pBR322', 'bp': 4361, 'category': 'General cloning'},
}
# NEXUS already bundles pUC19; do not duplicate the record at runtime.
FEATURE_TYPES = {'promoter', 'CDS', 'gene', 'rep_origin', 'terminator', 'misc_feature', 'regulatory', 'RBS', 'misc_RNA', 'polyA_signal'}


def fetch(accession: str) -> str:
    query=urllib.parse.urlencode(dict(db='nuccore', id=accession, rettype='gbwithparts', retmode='text'))
    uri='https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?'+query
    req=urllib.request.Request(uri, headers={'User-Agent':'NEXUSVectorImporter/1.0 (research database; version-pinned)'})
    with urllib.request.urlopen(req, timeout=35) as resp:
        data=resp.read(2_000_000+1)
    if len(data)>2_000_000:raise ValueError('GenBank response exceeds 2 MB')
    return data.decode('utf-8')


def parse_genbank(txt: str, accession: str | None = None, *, name: str | None = None, category: str='General cloning') -> dict:
    if not isinstance(txt,str) or not txt.startswith('LOCUS'):
        raise ValueError('Not a complete GenBank flatfile (missing LOCUS)')
    def header(tag):
        m=re.search(r'^'+re.escape(tag)+r'\s+(.+)$',txt,re.M)
        return m.group(1).strip() if m else ''
    locus=header('LOCUS'); version=header('VERSION').split()[0]; definition=header('DEFINITION')
    if not version:raise ValueError('Missing GenBank VERSION / accession')
    if accession and version != accession:raise ValueError(f'Accession mismatch: requested {accession}, received {version}')
    bp_match=re.search(r'\b(\d+)\s+bp\b',locus,re.I)
    if not bp_match:raise ValueError('GenBank LOCUS has no base-pair length')
    declared=int(bp_match.group(1))
    topology='circular' if re.search(r'\bcircular\b',locus,re.I) else 'linear'
    origin=re.search(r'^ORIGIN\s*\n(.*?)^//',txt,flags=re.M|re.S)
    if not origin:raise ValueError('GenBank ORIGIN is absent or incomplete')
    seq=re.sub(r'[^A-Za-z]','',origin.group(1)).upper()
    if len(seq)!=declared:raise ValueError(f'Length mismatch: GenBank LOCUS={declared}, parsed={len(seq)}')
    if not re.fullmatch('[ACGT]+',seq):raise ValueError('Sequence contains ambiguous or invalid bases; not included in automatic assembly')
    if declared>200000:raise ValueError('Sequence too long for this NEXUS browser library')
    if accession in PUBLIC and declared!=PUBLIC[accession]['bp']:
        raise ValueError(f'Unexpected length for curated {accession}')
    part=re.search(r'^FEATURES\s+Location/Qualifiers\s*\n(.*?)^ORIGIN',txt,flags=re.M|re.S)
    features=[]; skipped=0
    if part:
        current=None
        def flush():
            nonlocal skipped
            if not current:return
            loc=current['location'].replace(' ','')
            m=re.fullmatch(r'(complement\()?([0-9]+)\.\.([0-9]+)\)?',loc)
            if not m or current['type'] not in FEATURE_TYPES:
                if current['type'] in FEATURE_TYPES:skipped+=1
                return
            s,e=int(m.group(2)),int(m.group(3));strand=-1 if m.group(1) else 1
            if not (1<=s<=e<=declared):skipped+=1;return
            quals=current['quals'];label=quals.get('label') or quals.get('gene') or quals.get('product') or quals.get('note') or current['type']
            label=str(label).replace('"','').strip()[:130]
            ftype=quals.get('regulatory_class') if current['type']=='regulatory' else current['type']
            if ftype not in FEATURE_TYPES:ftype='misc_feature'
            features.append({'start':s,'end':e,'strand':strand,'type':ftype,'label':label})
        for line in part.group(1).splitlines():
            m=re.match(r'^     (\S+)\s+(.+)$',line)
            if m and not m.group(1).startswith('/'):
                flush();current={'type':m.group(1),'location':m.group(2).strip(),'quals':{}};continue
            if current:
                q=re.match(r'^\s+/([A-Za-z_]+)=(.*)$',line)
                if q:
                    current['quals'][q.group(1)]=q.group(2).strip().strip('"')
        flush()
    title=name or PUBLIC.get(version,{}).get('name') or definition or version
    return {
        'id':'genbank-'+version.lower().replace('.','-'),
        'name':title+' (GenBank '+version+')',
        'accession':version, 'category':category,
        'source':'NCBI GenBank '+version+' · source sequence, not an independently verified physical clone',
        'sourceUrl':'https://www.ncbi.nlm.nih.gov/nuccore/'+urllib.parse.quote(version),
        'circular':topology=='circular','sequence':seq,'features':features,
        'sha256':hashlib.sha256(seq.encode()).hexdigest(),
        'annotationNote': f'{skipped} complex/unsupported locations omitted; retain full source GenBank file.'
    }


def write_database(rows:list[dict],dst:Path):
    dst.parent.mkdir(parents=True,exist_ok=True)
    data=json.dumps(rows,ensure_ascii=True,separators=(',',':'))
    content='''/* Version-pinned, sequence-backed NEXUS public vector records.\n * Generated by scripts/import_public_vector_sequences.py.\n * Source annotations are partial: retain original GenBank files for full provenance. */\n(function(root){'use strict';\n const records='''+data+''';\n const dest=root.NEXUS_STARTER_PLASMIDS||[];\n const seen=new Set(dest.map(r=>String(r.accession||'')).filter(Boolean));\n for(const r of records){\n  if(!r || !/^[ACGT]+$/.test(r.sequence) || r.sequence.length>200000 || seen.has(r.accession))continue;\n  dest.push(r);seen.add(r.accession);\n }\n})(window);\n'''
    dst.write_text(content,encoding='utf-8')


def sql_text(rows):
    def esc(s):return "'"+str(s).replace("'","''")+"'"
    lines=['-- NEXUS manual Supabase seed: execute ONLY AFTER the accompanying schema migration.','-- The importer does not connect to Supabase or upload data.','BEGIN;']
    for r in rows:
        cols=['accession','name','category','sequence','sha256','is_circular','source_url','features','annotation_status']
        vals=[esc(r['accession']),esc(r['name']),esc(r['category']),esc(r['sequence']),esc(r['sha256']), 'TRUE' if r['circular'] else 'FALSE',esc(r['sourceUrl']), esc(json.dumps(r['features'],separators=(',',':')))+'::jsonb',esc('source_partial')]
        lines.append('INSERT INTO public.nexus_vector_sequences ('+', '.join(cols)+') VALUES ('+', '.join(vals)+') ON CONFLICT (accession) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sequence=EXCLUDED.sequence, sha256=EXCLUDED.sha256, is_circular=EXCLUDED.is_circular, source_url=EXCLUDED.source_url, features=EXCLUDED.features, annotation_status=EXCLUDED.annotation_status;')
    lines.append('COMMIT;')
    return '\n'.join(lines)+'\n'


def main():
    ap=argparse.ArgumentParser(description='Import accession-pinned complete GenBank vector records into NEXUS static database; generate optional Supabase SQL')
    ap.add_argument('--repo',required=True, type=Path,help='Path to nexus-rna-site repository')
    ap.add_argument('--accessions',default='M77789.2,J01749.1',help='Comma-separated accession.version values, curated set only')
    ap.add_argument('--file',type=Path, action='append',help='Additional user-verified local GenBank file (not automatically licensed for redistribution)')
    ap.add_argument('--offline',action='store_true',help='Skip NCBI retrieval, use --file only')
    ap.add_argument('--confirm-public-distribution-rights',action='store_true',help='Explicitly authorize inclusion of local user-supplied GenBank records in publicly deployed site files')
    args=ap.parse_args()
    repo=args.repo.resolve()
    if not (repo/'tools'/'seqfold'/'plasmids.js').exists() or not (repo/'tools'/'seqfold'/'public-vector-sequences.js').exists():
        ap.error('Repository not installed with NEXUS public-sequence patch')
    rows=[];seen=set();source_dir=repo/'tools'/'seqfold'/'data'/'genbank_source'
    if not args.offline:
        for accession in [x.strip() for x in args.accessions.split(',') if x.strip()]:
            if accession not in PUBLIC:ap.error('Auto-download is restricted to curated accession versions: '+', '.join(PUBLIC))
            print('Fetching',accession,'from NCBI GenBank...')
            raw=fetch(accession)
            obj=parse_genbank(raw,accession)
            if accession=='M77789.2' and obj['sha256']!='7c1183b16368b1435452d99152d7c95aa04fc4a5412e563a5ef1d0fbf0cf873b':
                raise ValueError('Public pUC19 sequence differs from the bundled pUC19 record; manual reconciliation required before continuing')
            if obj['accession'] not in seen:rows.append(obj);seen.add(obj['accession'])
            source_dir.mkdir(parents=True,exist_ok=True)
            (source_dir/(accession+'.gb')).write_text(raw,encoding='utf-8')
            print('  verified',len(obj['sequence']),'bp, SHA256',obj['sha256'][:16],', mapped features',len(obj['features']))
            time.sleep(0.45)
    if args.file and not args.confirm_public_distribution_rights:
        ap.error('Local GenBank records require --confirm-public-distribution-rights before copying them into public site files.')
    for path in args.file or []:
        raw=path.read_text(encoding='utf-8')
        obj=parse_genbank(raw)
        obj['source']='User-supplied GenBank sequence · provenance, rights and biological accuracy require independent review'
        if obj['accession'] in seen:raise ValueError('Duplicate accession '+obj['accession'])
        rows.append(obj);seen.add(obj['accession'])
        source_dir.mkdir(parents=True,exist_ok=True)
        (source_dir/(obj['accession']+'.gb')).write_text(raw,encoding='utf-8')
    if not rows:raise ValueError('No records selected')
    # pUC19 is already bundled in plasmids.js; only the other vectors need separate JS storage.
    jsrows=[x for x in rows if x['accession']!='M77789.2']
    out=repo/'tools'/'seqfold'/'public-vector-sequences.js'
    write_database(jsrows,out)
    seed=repo/'supabase'/'seeds'/'nexus_public_vector_sequences.sql'
    seed.parent.mkdir(parents=True,exist_ok=True)
    seed.write_text(sql_text(rows),encoding='utf-8')
    print('Wrote website database:',out)
    print('Wrote OPTIONAL (not executed) Supabase SQL seed:',seed)
    print('NOTE: No remote database was modified. Review sequence rights, annotations, and version before public release.')

if __name__=='__main__':
    try:main()
    except Exception as ex:print('IMPORT FAILED:',ex,file=sys.stderr);sys.exit(1)
