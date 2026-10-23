# ThermoFold v0.6 — Reference-backed full-energy workflow

This is an **interoperability step**, not a claim that NEXUS independently implements full ViennaRNA energetics.

## How to use

1. Obtain and install ViennaRNA separately subject to its license.
2. Run `RNAfold --noPS --temp=37 -d2` with canonical unmodified RNA.
3. Open `tools/seqfold/thermofold-reference.html` in the deployed NEXUS site.
4. Paste the exact stdout, record the RNAfold version and folding flags; inspect the conventional structure drawing (up to 280 nt) and download the provenance-tagged JSON.
5. For controlled quantitative benchmarking, generate a complete versioned dataset with `benchmark_tools/run_vienna_batch.py`.

## Boundaries

* Imported reference ΔG is calculated **by RNAfold**; NEXUS merely visualizes and compares it.
* Browser does not verify cryptographic provenance of pasted reference text.
* No ViennaRNA source/binary/parameter file is redistributed. Contact the authors before commercial inclusion: https://viennarna.readthedocs.io/en/latest/license.html
* Browser-side NEXUS independent model remains v0.5 and is NOT ViennaRNA equivalent.
* Global 3,000-nt energy prediction will require approved native/WASM ViennaRNA integration or major independent model work and performance validation.
* Partition functions, base-pair probabilities, modified nucleotides, pseudoknots and temperature interpolation remain beyond NEXUS independent v0.5.

## Scientific gates for independent-model parity

1. Complete published 1×1, 1×2, 2×2, and special internal-loop tables.
2. Implement complete dangling-end/multiloop/exterior terms, coaxial stacking as applicable, special hairpins and relevant terminal mismatches.
3. Compare version-matched results on minimum 125 stratified challenge RNAs against *real* ViennaRNA reference files.
4. Document MAE/RMSE ΔG, base-pair precision/recall/F1, exact-structure fraction, system, model settings and coverage.
5. Validate against independent experimental secondary-structure datasets, with well-specified structural uncertainty and method limitations.

## Release validation status

Reference parser: tested on synthetic output fixtures. No reference executable ran in this environment. Official RNAfold output remains an independently produced prerequisite.
