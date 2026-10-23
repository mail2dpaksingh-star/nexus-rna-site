# NEXUS ThermoFold Benchmark Toolkit v0.2 — Installation and verification

**Parent site:** NEXUS RNA BioSolutions v1.8.10 (ThermoFold hairpin visualization). **Release package:** v1.8.11 with benchmark tooling added.

## What changed
- **New page:** `tools/seqfold/thermofold-benchmark.html` with reference CSV/JSON import, strict pair metrics, ΔG error summary, HTML table, and JSON/CSV export.
- Added a dedicated benchmark worker and a pure JavaScript comparison/scoring library, with local browser computation only.
- Added an offline Python script to invoke **a separately installed** ViennaRNA RNAfold and save provenance-rich reference JSON; no executable, third-party code or parameter file is bundled.
- Added a Node CLI to compare NEXUS against those reference files. A documented historical RNAfold example is included and labeled **not version matched**; do not treat it as an acceptance test.
- Added 83 independent Python evaluations of NEXUS-produced dot-bracket energies and 11 automated JS benchmark logic tests.
- The underlying NEXUS restricted thermodynamic core and stem–loop renderer **have not been modified**. All prior website tools remain in their established locations.

## Workflow
1. For website preview, open `tools/seqfold/thermofold-benchmark.html` under an HTTPS server such as Cloudflare Pages.
2. Select a reference CSV/JSON file produced by a **separate** RNAfold or RNAstructure installation. Confirm source/version/options in its metadata.
3. Click Run and review ΔG MAE/RMSE/bias and strict exact base-pair precision/recall/F1.
4. Download the full JSON dossier and CSV results; maintain the original reference file separately.
5. Do not claim experimental RNA folding accuracy from agreement with RNAfold output; independently measured structures are required.

## Offline independent RNAfold reference creation
From the extracted website root, in an environment with a legally obtained ViennaRNA RNAfold installed:

```
python3 benchmark_tools/generate_rnafold_references.py --cases tools/seqfold/benchmarks/challenge_cases.json --out rnafold_refs.json
node benchmark_tools/run_benchmark.cjs rnafold_refs.json results.json
```

Here, the 10 bundled challenges are synthetic test sequences without third-party computed answers. RNAfold executable version and options are recorded in each generated reference. The output represents **predictor disagreement**, not controlled equivalence of energy models.

## Current evidence
The official RNAfold manual's historical example `CGACGUAGAUGCUAGCUGACUCGAUGC` has a displayed energy of −1.90 kcal/mol and seven base pairs. The current NEXUS model returns 0.00 kcal/mol and zero pairs. The comparison's ΔG difference is +1.90 kcal/mol. Because the manual example does not disclose a fully reproducible parameter snapshot, **this one case is a diagnostic, not a version-matched validation**. It is nevertheless a concrete issue to resolve in later model updates.

The energy consistency oracle confirms 83 NEXUS structures score identically under an independently coded Python evaluation of *the same incomplete NEXUS model*. This does **not** benchmark the model against scientific ground truth.

## Testing and deployment
- `node --test tests/auth-workspace.test.cjs tests/folding-3000.test.cjs tests/thermofold-v01.test.cjs tests/thermofold-layout.test.cjs tests/thermofold-benchmark-v02.test.cjs`
- `python3 tests/thermofold_energy_oracle.py`
- For website release, unzip and upload contents (not the ZIP file itself) to the GitHub Pages/Cloudflare deployment root; preserve `tools/seqfold/` filenames.
- The account feature still needs its own Supabase configuration before real sign-in works. No client sequence uploads occur from the benchmark page.
- A live external RNAfold CLI benchmark **has not been executed in this environment**, because RNAfold was unavailable. Reference generation scripts are supplied for qualified independent execution.

## External references and licensing
- https://viennarna.readthedocs.io/en/latest/man/RNAfold.html
- https://rna.urmc.rochester.edu/RNAstructure.html
- https://rna.urmc.rochester.edu/RNAstructureWeb/Servers/scorer/scorer.html
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7202366/
- https://viennarna.readthedocs.io/en/latest/license.html

The project must resolve source software and parameter licensing and accuracy requirements before marketing a ViennaRNA-class or clinically validated service.
