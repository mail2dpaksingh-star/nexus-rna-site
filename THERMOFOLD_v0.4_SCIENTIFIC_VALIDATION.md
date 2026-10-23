# NEXUS ThermoFold v0.4 — Accuracy development and reproducibility

**Status:** experimental, incomplete thermodynamic model. Not a verified equivalent of ViennaRNA or RNAstructure and not validated for therapeutic RNA decisions.

## Changed since v0.3

The same independently implemented non-pseudoknotted dynamic-programming solver now applies additional, sequence-dependent **Turner 2004 NNDB 37°C hairpin corrections**:

| Term | Parameter or rule | Source / interpretation |
|---|---:|---|
| 3-nt all-C loop | +1.5 kcal/mol | Published `C3` hairpin penalty |
| n-nt all-C loop, n > 3 | +0.3 × n + 1.6 kcal/mol | Published all-C loop penalty |
| UU or GA first mismatch in hairpins of n ≥ 4 | −0.9 kcal/mol | Published first-mismatch bonus (not full mismatch table) |
| GG first mismatch in hairpins of n ≥ 4 | −0.8 kcal/mol | Published first-mismatch bonus (not full mismatch table) |
| GU closure preceded by GG in correct sequence context | −2.2 kcal/mol | Published specialized closing context |
| Six-nt `CCGAGG` (closing C–G, loop CGAG) | **3.5 kcal/mol** | Published special-loop energy replaces general loop terms |
| 5- and 6-nt internal-loop initiation | +2.0 kcal/mol each | Published generic initiation values; surrounding asymmetry/mismatch model remains incomplete |

The full RNA terminal-mismatch parameter table has **not** been implemented. Applying these selected bonuses is **not** equivalent to having completed all sequence-dependent hairpin energies. Results can be nonmonotonically different from v0.3 and should not be interpreted as generally more accurate without external benchmarks.

## Verification completed

- `node --test tests/*.test.cjs`: **51 tests passed**, 0 failed.
- `python tests/thermofold_exhaustive_oracle_v04.py`: **48 exhaustive brute-force short-sequence minimum-energy checks** passed against an independently written Python evaluator of **the same restricted objective**.
- Turner term-level tests cover `CCGAGG` = 3.5 kcal/mol, C3 penalty +1.5 kcal/mol, all-C six-nt penalty +3.4 kcal/mol, and first-mismatch bonus cases. These tests **only validate those documented terms**, not total full-model free energies.
- Tests also verify structure/energy reconciliation and unchanged 280-nt solver input boundary.
- Deterministic synthetic challenge dataset now contains **125** cases (10 pre-existing + five motif challenges + 110 generated). They are not experimentally validated structures or independently generated RNAfold outputs.
- **External ViennaRNA / RNAstructure run: NOT PERFORMED.** A genuine executable was not available; an attempted independent ViennaRNA installation failed due to network resolution. No performance metrics versus those predictors are claimed.

## How to run a real independent reference benchmark

Run this **outside the NEXUS browser**, with a separately installed licensed RNAfold executable, capture software version and operating system, then:

```bash
python benchmark_tools/generate_rnafold_references.py \
  --cases tools/seqfold/benchmarks/challenge_cases.json \
  --out rnafold_external_v04.json
node benchmark_tools/run_benchmark.cjs \
  rnafold_external_v04.json thermofold_v04_comparison.json
```

The generator runs RNAfold at 37°C, dangles disabled (`-d0`), with GU allowed and special loops enabled. Its output is **not parameter-matched** to NEXUS because NEXUS lacks many energy terms. The browser benchmark page accepts up to 50 cases per import, so use the **command-line benchmark** for all 125 cases. Require version-matched, recorded settings and explicit data provenance.

Before product validation, benchmark at least 100 independent reference cases and a separate held-out set of experimentally supported RNA structures. Report ΔG bias, MAE, RMSE, base-pair precision/sensitivity/F1, full-structure match, fold/runtime failures and lengths. Pre-register success criteria rather than retrofitting them after viewing results.

## Remaining thermodynamic gaps

- Full nearest-neighbor first-mismatch tables for hairpins, internal loops and terminal mismatches.
- Complete special tri-, tetra- and hexaloop tables, sequence-specific 1×1/1×2/2×2 internal loops, bulge special cases.
- Multibranch asymmetry, strain and optimal coaxial/terminal mismatch/dangle configurations.
- GU sequence-dependent tandem exceptions, complete 37°C energy parameter provenance, salt and modified-base calibration.
- Ensemble/partition function, base-pair probabilities, partition constraints, real full-length 1–3 kb folding and benchmarked browser performance.

## References

- Turner 2004 hairpins: https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_hairpin_loops.html
- Published hairpin corrections: https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_hairpin_mismatch.htm
- Published internal loops: https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_internal_loop.htm
- ViennaRNA license: https://viennarna.readthedocs.io/en/latest/license.html

**Commercial/legal:** This release does not distribute ViennaRNA source, binaries or parameter files. Commercial use, open-source dependencies and FTO require separate review. Structure predictions are research-stage hypotheses and must not be presented as experimental measurements or validated clinical outputs.
