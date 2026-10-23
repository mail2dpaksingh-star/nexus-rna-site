#!/usr/bin/env python3
"""Scientifically scoped 125-case NEXUS v0.9 vs versioned ViennaRNA RNAfold MFE comparison.
Requires genuine externally executed RNAfold records and their source-file manifest.
Not a biological ground truth experiment. Does not rerun ViennaRNA.
"""
import argparse, json, math, statistics, sys
from pathlib import Path
from verify_turner2004_suite import validate

def pairs(s):
    stack=[]; ans=set()
    for i,c in enumerate(s):
        if c=='(':stack.append(i)
        elif c==')':
            if not stack:raise ValueError('Unbalanced structure')
            ans.add((stack.pop(),i))
        elif c!='.':raise ValueError('Unexpected character')
    if stack:raise ValueError('Unbalanced structure')
    return ans

def summary(rows):
    n=len(rows)
    return {'n':n,'mean_absolute_dg_error_kcal_mol':round(sum(abs(r['delta_dg_kcal_mol']) for r in rows)/n,5),
      'root_mean_square_dg_error_kcal_mol':round(math.sqrt(sum(r['delta_dg_kcal_mol']**2 for r in rows)/n),5),
      'dg_signed_bias_NEXUS_minus_RNAfold_kcal_mol':round(sum(r['delta_dg_kcal_mol'] for r in rows)/n,5),
      'mean_pair_precision':round(statistics.mean(r['precision'] for r in rows),5),
      'mean_pair_recall':round(statistics.mean(r['recall'] for r in rows),5),
      'mean_pair_F1':round(statistics.mean(r['F1'] for r in rows),5),
      'exact_structure_fraction':round(sum(r['exact_structure'] for r in rows)/n,5)}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--cases',type=Path,default=Path('tools/seqfold/benchmarks/challenge_cases.json'))
    ap.add_argument('--references',type=Path,required=True);ap.add_argument('--manifest',type=Path,required=True)
    ap.add_argument('--nexus',type=Path,default=Path('validation_results/nexus_125_internal_baseline.json'))
    ap.add_argument('--output',type=Path,default=Path('validation_results/controlled_125_comparison.json'));a=ap.parse_args()
    try:
        verified=validate(a.cases,a.references,a.manifest)
        base=json.loads(a.nexus.read_text()); refs=json.loads(a.references.read_text())
        if base.get('n_success')!=125 or base.get('n_cases')!=125:raise ValueError('NEXUS internal baseline incomplete')
        import hashlib
        if base.get('cases_sha256')!=hashlib.sha256(a.cases.read_bytes()).hexdigest():raise ValueError('Mismatched NEXUS challenge SHA')
        mapping={r['id']:r for r in refs};rows=[]
        for row in base['rows']:
            r=mapping[row['id']];a1=pairs(row['structure']);b=pairs(r['reference_structure'])
            inter=len(a1&b)
            if not a1 and not b:p=rec=f1=1.0
            else:
                p=inter/len(a1) if a1 else 0.0;rec=inter/len(b) if b else 0.0
                f1=2*p*rec/(p+rec) if p+rec else 0.0
            rows.append({'id':row['id'],'length_nt':row['length'],'nexus_dg_kcal_mol':row['dg'],
                        'rnafold_dg_kcal_mol':r['reference_dg'],'delta_dg_kcal_mol':row['dg']-r['reference_dg'],
                        'nexus_pairs':len(a1),'rnafold_pairs':len(b),'true_positive_pairs':inter,
                        'precision':p,'recall':rec,'F1':f1,'exact_structure':row['structure']==r['reference_structure']})
        report={'status':'COMPUTATIONAL_REFERENCE_COMPARISON_COMPLETE_NOT_EXPERIMENTAL_ACCURACY',
                'reference_verification':verified,'nexus_engine':base['engine_version'],
                'overall':summary(rows), 'by_length':{},'rows':rows,
                'scientific_limitations':['NEXUS is not parameter-complete; computational agreement is not empirical structure prediction accuracy',
                  'Energy comparisons are valid as numeric differences but different models can disagree systematically']}
        bins={'1-40 nt':[r for r in rows if r['length_nt']<=40],
              '41-100 nt':[r for r in rows if 40<r['length_nt']<=100],
              '101-280 nt':[r for r in rows if r['length_nt']>100]}
        report['by_length']={k:summary(v) for k,v in bins.items() if v}
        a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report['overall'],indent=2))
    except Exception as e:
        print('BLOCKED/FAILED: '+str(e),file=sys.stderr);return 2
    return 0
if __name__=='__main__':raise SystemExit(main())
