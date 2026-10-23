"""Test integrity checks and blocking behavior; no simulated results distributed."""
import unittest, tempfile, json, hashlib
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from turner2004_125_controlled import cases_check, fold_line, validate_parameter_file
from verify_turner2004_suite import validate

class BenchmarkGuards(unittest.TestCase):
  def setUp(self):
    self.p=Path(__file__).resolve().parents[1]/'tools/seqfold/benchmarks/challenge_cases.json'
  def test_challenge_set(self):
    cases,sha=cases_check(self.p)
    self.assertEqual(len(cases),125)
    self.assertEqual(len(sha),64)
  def test_mfe_format_and_balance(self):
    self.assertEqual(fold_line('GGGAAACCC','GGGAAACCC\n(((...))) (-1.20)\n'),('(((...)))',-1.2))
    for line in ('((((...)) (-2.0)', '... (5.0)', '(..]..... (-1.0)'):
      with self.assertRaises(ValueError):fold_line('GGGAAACCC','GGGAAACCC\n'+line+'\n')
  def test_rejects_missing_original(self):
    with self.assertRaises(FileNotFoundError):validate_parameter_file(Path('/__does_not_exist__/rna_turner2004.par'))
  def test_rejects_fabricated_small_file(self):
    with tempfile.TemporaryDirectory() as t:
      p=Path(t)/'rna_turner2004.par';p.write_text('# stack\n1 2 3\n')
      with self.assertRaises(ValueError):validate_parameter_file(p)
  def test_verifier_rejects_unversioned_synthetic_reference(self):
    with tempfile.TemporaryDirectory() as d:
      tmp=Path(d);cases=json.loads(self.p.read_text())
      refs=[{'id':c['id'],'sequence':c['sequence'],'reference_structure':'.'*len(c['sequence']),
        'reference_dg':0,'parameter_sha256':'0'*64,'source_version':'mock'} for c in cases]
      refs_file=tmp/'refs.json';refs_file.write_text(json.dumps(refs))
      manifest=tmp/'manifest.json';manifest.write_text(json.dumps({'cases_sha256':hashlib.sha256(self.p.read_bytes()).hexdigest(),
        'reference_count':125,'status':'COMPLETED_EXTERNAL_COMPUTATION_NOT_EXPERIMENTAL_VALIDATION',
        'software_version':'RNAfold 2.7.2','flags':['--paramFile=/x/rna_turner2004.par'],
        'temperature_C':37,'dangles':2,'parameter_file_verification':{'sha256':'0'*64}}))
      with self.assertRaisesRegex(ValueError,'Mixed version'):validate(self.p,refs_file,manifest)
if __name__=='__main__': unittest.main()
