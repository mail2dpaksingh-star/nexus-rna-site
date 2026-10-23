# NEXUS ThermoFold v0.5 — Scientific methods, reproducibility, and external validation gate

**Status: RESEARCH PROTOTYPE. NOT INDEPENDENTLY VALIDATED.**

ThermoFold v0.5 extends v0.4 without using ViennaRNA source code. It remains a 37°C pseudoknot-free, global minimum-energy calculation using a **restricted** published-parameter subset. Its calculated ΔG values are free energies *within that restricted model*; they are **not** full Turner/ViennaRNA-equivalent free energies, binding affinities, experimentally observed folding energies, or validated thermodynamic measurements.

## The specific v0.5 changes

* Internal loop initiation: values used for loop sizes 4, 5, 6 are 1.1, 2.0, 2.0 kcal/mol, respectively. The restricted model retains provisional small-loop 1×1 and 1×2 values rather than authoritative lookup tables.
* Extrapolation for total internal-loop size > 6 follows `2.0 + 1.08 × ln(n/6)` kcal/mol.
* Internal-loop asymmetry penalty: `0.6 × abs(n1−n2)` kcal/mol.
* Each AU/GU-closing pair at an internal loop contributes +0.7 kcal/mol (instead of the previous generic 0.45 end penalty).
* For 1×(n−1) internal loops, first-mismatch contributions are zero. This does **not** replace the published special 1×1 and 1×2 tables.
* For other generic internal loops, the included first-mismatch contributions are AG: −0.8, GA: −1.0, GG: −1.2, UU: −0.7 kcal/mol. The partial 2×3 implementation includes GG: −0.8 and UU: −0.4, but **does not implement orientation-dependent 2×3 rules**.
* 2×2 uses a generic fallback—not the published 2×2 lookup table.
* ΔG reports now carry an audit list of matched internal-loop corrections, closing pairs, and hairpin contributions, with indices for each recognized structural element.

Energy terms are derived from published numerical rules, **not from RNAfold/ViennaRNA source files**. The preceding categories and simplifications are documented in output metadata.

Sources: University of Rochester [Turner 2004 internal-loop rules](https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_internal_loops.html) and [energy-parameter table](https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_internal_loop.htm).

## Still missing

Complete 1×1, 1×2, and 2×2 small-loop tables; full 2×3 terminal-mismatch orientation rules; complete terminal-mismatch and special hairpin tables; corrected bulge/multibranch strand context; dangling ends, coaxial stacking, GU special stacking contexts, ensemble partition functions, temperature dependence, chemical modifications, experimental constraints, pseudoknots, and biologically trained accuracy estimates.

**Global folding limit remains 280 nt.** The separate 3,000-nt segmented structure explorer is not a global MFE engine.

## Current validation evidence

* JavaScript regression suite: see `node --test tests/*.test.cjs` for the executable result.
* An independently coded Python numerical oracle checks 320 randomly generated internal-loop contexts against the stated partial model: `python tests/thermofold_internal_oracle_v05.py`.
* Another independently coded Python enumerator checks 48 short pseudoknot-free RNA structures against the restricted energy function: `python tests/thermofold_exhaustive_oracle_v04.py`. The historical filename reflects where that oracle originated, not its current external validation status.
* A **frozen 125-sequence** benchmark challenge set is supplied in `tools/seqfold/benchmarks/challenge_cases.json`, including short and larger cases. It is not an independent reference set.
* `NEXUS_ThermoFold_v05_Reference_Readiness.json` says **BLOCKED** until a complete genuine external reference set has been supplied and audited.

These numerical tests confirm model implementation and dynamic-programming correctness on tested cases. They do **not** establish agreement with RNAfold, RNAstructure, or experiments.

## How to run a real external predictor comparison

From the package root, on a separate machine with an independently installed RNAfold CLI:

```sh
python benchmark_tools/generate_rnafold_references.py \
  --cases tools/seqfold/benchmarks/challenge_cases.json \
  --out RNAfold_external_references.json
node benchmark_tools/external_validation_gate_v05.cjs \
  RNAfold_external_references.json external_comparison_gate.json
```

The gate requires all 125 frozen input IDs, matching RNA sequences, reproducibility settings and versions, and both structure and ΔG. It refuses to present completion when references are absent, duplicated, or not declared as independently executed. **A provenance label cannot prove that a reference run was genuinely independent.** Re-run and inspect the underlying raw outputs to establish that fact. The resulting scores quantify **agreement between predictors**, not experimental accuracy.

The RNAfold command generator uses `--noPS -d0 -T 37`, which differs from the defaults for some dangle settings. Independent reports must state their exact options. Evaluate model assumption differences before interpreting any difference as a numerical implementation defect.

## Follow-on validation gates

1. Add the complete published small-loop and mismatch tables with exact test fixtures.
2. Execute externally versioned RNAfold and RNAstructure computations, with at least 100 diverse cases and a pre-registered analysis plan.
3. Characterize systematic energy error and structural precision/recall across sequence length, GC content and loop families. Include false negatives and unpaired controls.
4. Compare with experimental reference structures where available; separately report predictor agreement and experimental accuracy.
5. Independently evaluate commercial rights, distribution licenses and source ownership before billing for an embedded prediction engine.

Until those gates pass, label ThermoFold **experimental; not suitable for clinical, manufacturing, or GMP release decisions**.
