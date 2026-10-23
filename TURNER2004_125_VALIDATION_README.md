# NEXUS Independent ThermoFold — Turner 2004 parameter verification and 125-case reference study

**Status as of October 22, 2026:** NEXUS internal baseline **125/125 COMPLETE**. Authentic Turner 2004 source library **NOT ACQUIRED / NOT VERIFIED**. Independent RNAfold benchmark **0/125 EXECUTED**. RNAstructure and experimental CT comparisons **NOT EXECUTED**. Do not advertise ViennaRNA equivalence, model accuracy, or validated energy-library completeness.

## Original primary sources

1. [University of Rochester Nearest Neighbor Database (NNDB)](https://rna.urmc.rochester.edu/NNDB/) and [Turner 2004 download page](https://rna.urmc.rochester.edu/NNDB/download.html), based on Mathews et al. (2004). The link to `turner_2004.zip` returned HTTP 404 when checked here on October 22, 2026. Therefore, the original NNDB numeric archive has **not** been retrieved and cannot be independently checked or redistributed.
2. [ViennaRNA's official Turner 2004-formatted parameter file](https://github.com/ViennaRNA/ViennaRNA/blob/master/misc/rna_turner2004.par), distributed with ViennaRNA. This is a packaged parameter implementation **rather than the original NNDB archive**. Use a separately installed copy as an external reference; licensing and redistribution terms require review.
3. [RNAfold manual](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/man/RNAfold.html), including `--paramFile`, `-T`, and dangle-model settings.

## Checkpoint 1: acquire reference files on a machine with internet

Do **not** upload research clients' confidential RNA sequences to a public online service.

```bash
# From the extracted NEXUS website root on your own computer
python benchmark_tools/fetch_turner2004_official.py
# This writes reference_parameters/rna_turner2004.par and SHA-256 provenance JSON.
```

This downloader is pinned to ViennaRNA `v2.7.2` and validates expected file sections. If it cannot retrieve or validate the file, the run **must remain blocked**. A SHA-256 is an integrity identifier, **not** an independent confirmation of all published numerical values or correct orientation. For the independent NEXUS numeric library, first obtain the original NNDB files, verify orientation and table conventions, audit values against the source, then populate `benchmark_tools/turner_parameter_template.csv` and run `build_parameter_pack_v09.py --require-complete`. Full authentic specialized tables were **not available in this release**.

## Checkpoint 2: install actual RNAfold, separately from NEXUS

Install ViennaRNA using the [official instructions](https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/install.html) or a trusted package manager, and record the executable version. On a Unix-like machine with conda/bioconda configured, a typical route is:

```bash
conda create -n nexus-rna-reference -c conda-forge -c bioconda viennarna
conda activate nexus-rna-reference
RNAfold --version
```

Keep the installation reproducible and record the exact version used. The script checks the source file and requires exactly 125 valid unique canonical RNA inputs, each ≤280 nt.

## Checkpoint 3: generate 125 **real** ViennaRNA references

```bash
python benchmark_tools/turner2004_125_controlled.py \
  --parameters reference_parameters/rna_turner2004.par \
  --cases tools/seqfold/benchmarks/challenge_cases.json \
  --output validation_results/rnafold_turner2004_125.json --progress
```

The runner invokes real `RNAfold --noPS --temp=37 -d2 --paramFile=<absolute path>` for each case and records executable version, source-file SHA-256, input-set SHA-256, all structures, energies (kcal/mol), timestamp and flags. Other settings, such as optional salt handling and dangle rules, need to be documented and harmonized before claiming numerical parity across programs.

## Checkpoint 4: verify 125 records and compare NEXUS

```bash
python benchmark_tools/verify_turner2004_suite.py \
  --references validation_results/rnafold_turner2004_125.json \
  --manifest validation_results/rnafold_turner2004_125.manifest.json
python benchmark_tools/compare_125_controlled.py \
  --references validation_results/rnafold_turner2004_125.json \
  --manifest validation_results/rnafold_turner2004_125.manifest.json \
  --nexus validation_results/nexus_125_internal_baseline.json
```

Compare ΔG MAE/RMSE/bias; exact base-pair precision/recall/F1; exact full-structure agreement; and stratified performance by sequence length. These are **computational agreement** statistics, not experimentally established structural accuracy. Do not use claims of ViennaRNA parity until parameter convention, version and temperature conditions are independently confirmed and appropriate acceptance criteria are met.

## Checkpoint 5: independent RNAstructure and experimental CT references

Use `benchmark_tools/run_rnastructure_references_v09.py` only after installing RNAstructure and confirming its CLI options match the installed version. A separate experimental CT comparison requires public accession IDs, documentation of experimental evidence and source records, not just predictions. **Both are pending.**

## Current outputs

- `validation_results/nexus_125_internal_baseline.json`: 125 genuine local **NEXUS restricted-model** predictions; no external reference values.
- `validation_results/turner2004_acquisition_manifest.json`: transparent acquisition and benchmark readiness.
- `benchmark_tools/turner2004_125_controlled.py`: runnable real RNAfold reference generator with `--paramFile`.
- `benchmark_tools/verify_turner2004_suite.py`: file hash, metadata, structure and sequence validation.
- `benchmark_tools/compare_125_controlled.py`: full computational agreement metrics, **blocked** when reference is unavailable.
- `benchmark_tools/test_controlled_125.py`: input-integrity and anti-fabrication tests. Synthetic records in this test are **never** included as benchmark data.

The code is intentionally separate from the browser software and does not redistribute ViennaRNA code or its parameter tables. Do not commit authentic client sequences or confidential laboratory data to a public repository.
