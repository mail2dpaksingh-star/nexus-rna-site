# Independent NEXUS ThermoFold v0.8 — methods, accuracy and validation

**Status: experimental, independent software. Not ViennaRNA-equivalent, not calibrated for clinical decisions.**

## What has changed

1. The original NEXUS v0.7 exact restricted-model partition-function calculations remain unchanged. We now calculate an **ensemble centroid secondary structure** (a noncrossing set of pairs minimizing expected base-pair symmetric-difference distance), using all base-pair probabilities rather than only the threshold-filtered plot points.
2. The Ensemble Lab draws the centroid as a conventional stem-loop diagram for simple structures or a topology-preserving arc diagram for branching.
3. The report now distinguishes the expected base-pair distance of **centroid-to-ensemble**, **MFE-to-ensemble**, and the expected symmetric-difference distance between **two independent ensemble draws**. The last measure is twice the sum of p(1-p); do not conflate it with every reference package's convention for “ensemble diversity.” These are *model uncertainty* quantities, not biological confidence levels.
4. The MFE model now includes an **application-specific coverage audit** flagging when a predicted structure uses hairpin parameters with missing special motifs, internal loops lacking specialized 1×1/1×2/2×2 tables, provisional multibranch energies, or exposed exterior dangle contexts. The audit is not an accuracy score.
5. CSV, SVG and JSON exports remain supported; JSON now includes the centroid and uncertainty fields and, for MFE results, the parameter-coverage audit.

## Model limits and scientific gaps

- Parameter set: rounded Turner 2004 nearest-neighbor stack entries plus incomplete hairpin, bulge, internal-loop and multibranch corrections. Fixed 37 °C; canonical A,C,G,U; GU included.
- MFE global folding: up to 280 nt. Exact restricted-model ensemble: up to 110 nt. A separate *segmented heuristic* accepts 3,000 nt; segmented folding is not global thermodynamic folding.
- Missing or incomplete: full 1×1/1×2/2×2 internal-loop tables, the full terminal mismatch tables, multiple special hairpins, dangle and coaxial stacking terms, all GU exceptions, full temperature dependence, experimental constraints and modified bases. No pseudoknots.
- No official ViennaRNA code or parameter files are bundled. No published parity claim is made.

## Numerical correctness verification

Run `node --test tests/*.test.cjs` at the ZIP's root. The new `thermofold-ensemble-centroid-v08.test.cjs` independently enumerates all model-admissible structures for five short RNAs. It compares centroid expected distance, MFE expected distance and pairwise structural diversity against direct Boltzmann-weighted enumeration. It also checks that changing the plot cutoff does not affect the centroid.

This tests the **mathematics of NEXUS's own model**, not accuracy of external biological structure predictions. Because the parameter model is incomplete, different calculations can be internally correct and externally inaccurate.

## Independent reference experiment: outstanding gate

The ZIP includes 125 synthetic challenge sequences under `tools/seqfold/benchmarks/challenge_cases.json` and the executable-driven workflow:

```bash
python3 benchmark_tools/run_vienna_batch.py --cases tools/seqfold/benchmarks/challenge_cases.json --output rnafold_external_references.json
node benchmark_tools/parity_gate_v06.cjs rnafold_external_references.json thermofold_parity_report.json
```

You must independently install an authentic RNAfold binary, preserve its exact version, temperature, dangling-end setting and parameter assumptions, and review whether the settings are truly comparable. The existing runner uses **RNAfold -d2** while NEXUS omits dangles; parity under different energy models is therefore *not* a like-for-like full-model test. Include a separately controlled RNAfold `-d0` sensitivity cohort before interpreting mismatches; neither setting eliminates all other parameter differences.

**Gate status: BLOCKED.** No authentic RNAfold executable was available in the development environment. Do not substitute a mock, pre-filled invented energy table or NEXUS output and label it as reference data. Thresholds in the parity gate are provisional development goals, not product certification criteria.

Independent RNAstructure comparisons, curated experimental structures, performance tests and parameter-license review remain necessary before any claims of parity, biomedical predictiveness or GMP compliance.

## Public scientific references

- [Nearest Neighbor Database — Turner 2004](https://rna.urmc.rochester.edu/NNDB/)
- [ViennaRNA centroid mathematical definition](https://www.tbi.univie.ac.at/RNA/ViennaRNA/refman/subopt/centroid.html)
- [ViennaRNA folding tutorial and ensemble principles](https://github.com/ViennaRNA/ViennaRNA/blob/master/doc/source/tutorial/RNAfold.rst)
- [Internal loop reference tables](https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_internal_loops.html)

## Independence and IP

NEXUS v0.8 implementation is independently written. Published mathematical principles are not by themselves proprietary. Third-party parameter-data rights, license requirements, use of existing patent claims and commercial freedom-to-operate require further review. Do not assert freedom-to-operate based solely on independent code.
