# NEXUS RNA BioSolutions — ThermoFold v0.1 release

This release **adds**, not replaces, an independently implemented restricted energy-model RNA folding prototype to the complete v1.8.8 website.

## New files

- `tools/seqfold/thermofold.html`: scientific input/output interface
- `tools/seqfold/thermofold-core.js`: restricted nearest-neighbor dynamic programming and traceback
- `tools/seqfold/thermofold-worker.js`: browser Web Worker to keep the interface responsive
- `tools/seqfold/thermofold-ui.js`: visualization and exports
- `tests/thermofold-v01.test.cjs`: unit tests with an auditable hairpin reference
- `THERMOFOLD_SCIENTIFIC_METHODS_v0.1.md`: method, citations, licensing and validation gates

## Scope and safety

**Not** full ViennaRNA / RNAfold parity. **Not** clinically validated, GMP-qualified, or appropriate to claim optimal RNA expression/stability. Full 3,000-nt global folding is **not** supported in this first energy-model release. The prior 3,000-nt segmented heuristic remains available separately. The new thermodynamic model handles unmodified A/C/G/U at 37°C to 280 nt.

## Deployment

Upload all extracted site files, retaining folder structure. No new backend needed.
From the homepage go to **Research Tools → ThermoFold — ΔG Model**, or from **SeqFold → ThermoFold**.
