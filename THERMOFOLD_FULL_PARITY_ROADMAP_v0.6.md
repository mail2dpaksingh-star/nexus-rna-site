# NEXUS ThermoFold v0.6 — Full-energetics parity implementation plan

**Status (22 October 2026):** Reference-backed ViennaRNA interoperability implemented; *independent NEXUS energy-model parity NOT established.* No real RNAfold executable was available in the model's build environment. NEXUS ThermoFold v0.5 remains the independent restricted model.

## What has actually been implemented

- New `tools/seqfold/thermofold-reference.html`: accepts authentic user-supplied standard output from `RNAfold --noPS --temp=37 -d2`, checks sequence/base pairing/structural syntax and displays short sequences as a conventional 2D secondary-structure representation. External ΔG is always labeled *RNAfold reference ΔG*, not NEXUS predicted ΔG.
- Compares references up to 280 nt against the original NEXUS restricted model, reporting model ΔG difference and base-pair F1. Genuine RNAfold references up to 3,000 nt can be imported, stored, and exported without false claims of NEXUS global folding at 3,000 nt.
- `benchmark_tools/run_vienna_batch.py`: local CLI for separately installed RNAfold, stores version/flags, 125 challenge records, cases SHA-256 and a generation manifest. If RNAfold is not installed, it fails without writing invented outputs.
- `benchmark_tools/parity_gate_v06.cjs`: checks provenance and model/setting consistency, then produces metrics and tentative numerical gates. A good correlation with RNAfold is **not** scientific validation against experimental secondary structures.
- Twelve reference-adapter tests and independent mock-CLI tests check parsing, syntax, provenance, and pipeline behavior (not ViennaRNA agreement).

## Official implementation options

**A. Full reference computations now, without bundling ViennaRNA.** Researchers run the official `RNAfold` installed on their own machine and import the outputs into NEXUS. This shows full reference energies but is not NEXUS's own equivalent folding algorithm.

**B. Licensed official ViennaRNA in NEXUS browser, after written permission.** Contact the ViennaRNA authors about compiling and distributing the relevant RNAlib/RNAfold components as browser WebAssembly in a commercial subscription product. Scope the license expressly for use by NEXUS customers, browser redistribution, attribution, modifications, parameter tables, and updates. Keep computations client-side in a Web Worker with cancellation, input caps, controlled memory allocation, and UI reporting from the official library. Do **not** publish such a bundle until permissions and security reviews are complete.

**C. Independent NEXUS full parity.** Implement and validate the complete loop and dangling-end recurrence model, exact parameter tables, GU special motifs, salt/temperature interpolation, multi-loop coaxial terms, special loops, and ensemble algorithms as necessary. This is a substantial scientific software engineering project and must be benchmarked against official reference engines and experimental data.

## Validation gates before "ViennaRNA-equivalent" advertising

1. **Engineering**: all model terms and algorithmic options documented, full structure-to-energy reevaluation invariant, with 1×1, 1×2, 2×2, special loops, multibranch dangles and closing-end terms.
2. **Reference parity**: run an independently installed ViennaRNA executable on ≥125 diverse unmodified RNA challenge cases with recorded version, flags, Turner parameter set and conditions; report ΔG MAE/RMSE/bias, per-case structure agreement and pairing precision/sensitivity/F1. No fake/unverified reference data or historical text-only examples counted as a modern run.
3. **Cross software**: test against RNAstructure in a separate comparison with matched parameters where possible. Differences are expected if models/assumptions differ.
4. **Biological validity**: compare against appropriate experimentally supported secondary structures and assay constraints; quantify uncertainty and false-confidence behavior.
5. **Commercial readiness**: licensing, memory/time benchmarks for 280, 1,000 and 3,000 nt, privacy/security, versioned reproducibility, and transparent disclaimers. All claims reviewed before charging for analytical predictions.

## Researcher runbook (installed RNAfold separately)

```bash
# The reference package is external. These commands are not run by the NEXUS website.
RNAfold --version
printf 'GGGAAACCC\n' | RNAfold --noPS --temp=37 -d2
python benchmark_tools/run_vienna_batch.py --cases tools/seqfold/benchmarks/challenge_cases.json --output rnafold_external_references.json
node benchmark_tools/parity_gate_v06.cjs rnafold_external_references.json thermofold_v06_parity_report.json
```

## External dependencies and licenses

- [ViennaRNA package license](https://viennarna.readthedocs.io/en/latest/license.html) — commercial inclusion requires contacting the authors and respecting their terms.
- [Official RNAfold manual](https://viennarna.readthedocs.io/en/latest/man/RNAfold.html) — defines MFE, ensemble output, dangles, temperature and documented syntax.
- [Turner 2004 NNDB](https://rna.urmc.rochester.edu/NNDB/) — parameter reference; using publicly readable tabular data does not by itself grant a redistribution license to software implementing proprietary reference libraries.

### Suggested license inquiry

Subject: Commercial WebAssembly integration permission — ViennaRNA in NEXUS RNA BioSolutions

We are developing a browser-based research platform for RNA construct design and want to evaluate redistributing selected ViennaRNA/RNAlib components compiled to WebAssembly for client-side MFE and partition-function calculations. Could you provide the licensing terms and permission requirements for commercial SaaS use, redistribution of binaries/parameter tables, modifications, attribution, updates and paid subscriptions? We will preserve appropriate citations and would like to arrange formal scientific validation and support as applicable.

**Important:** The current NEXUS ZIP contains no ViennaRNA code, binaries, or thermodynamic parameter files.
