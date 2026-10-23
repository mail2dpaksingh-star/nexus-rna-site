from pathlib import Path
from tempfile import TemporaryDirectory
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1] / 'benchmark_tools'))
from run_vienna_batch import parse_stdout, run
import json

def test():
    db, dg = parse_stdout('GGGAAACCC', 'GGGAAACCC\n(((...))) (-1.20)\n')
    assert db == '(((...)))' and dg == -1.2
    try:
        parse_stdout('GGGAAACCC','AAAAAAAAA\n(((...))) (-1.20)')
    except ValueError:
        pass
    else:
        raise AssertionError('Mismatched reference sequence must be rejected')
    with TemporaryDirectory() as tmp:
        root=Path(tmp)
        stub=root/'RNAfold'
        stub.write_text('#!/usr/bin/env python3\nimport sys\nif "--version" in sys.argv: print("RNAfold 2.7.2"); quit()\nseq=sys.stdin.readline().strip();print(seq);print("."*len(seq),"(0.00)")\n')
        stub.chmod(0o755)
        cases=root/'cases.json';cases.write_text(json.dumps([{'id':'case1','sequence':'AAAAAAAAA'}]))
        path=root/'references.json'
        assert run(cases,path,str(stub))==1
        result=json.loads(path.read_text())
        assert result[0]['source_version']=='RNAfold 2.7.2'
        assert result[0]['reference_structure']=='.........'
        assert path.with_suffix('.manifest.json').is_file()
    print('PASS 4 batch runner checks, using a mock executable only (NOT real thermodynamics).')
if __name__=='__main__':test()
