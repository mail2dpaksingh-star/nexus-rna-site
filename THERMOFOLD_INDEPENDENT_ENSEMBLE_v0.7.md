# NEXUS ThermoFold v0.7 — Independent Ensemble Methods and Validation

Status: **Research prototype — not validated and not ViennaRNA-equivalent**. Release: 2026-10-22. Software lineage: NEXUS v1.8.15 plus new independently developed ensemble code.

## What has been added

- An original inside/outside dynamic-programming partition-function implementation, supporting nested secondary structures, canonical Watson–Crick and GU pairs, hairpins, stacks, bulges, internal loops and the model's provisional affine multibranch loops.
- Ensemble free energy (kcal/mol), the expected number of pairs, probability for each possible base pair and the unpaired probability of each nucleotide. Probability dot-plot and exportable JSON, CSV and SVG reports.
- Model version and important caveats embedded in output; computation stays local to the browser. The algorithm does not include or redistribute ViennaRNA source code, libraries or parameter files.

## Thermodynamic relationship

For allowed structures `s`, each with a **NEXUS-model** energy `E(s)` (kcal/mol, fixed 37°C), `Z = Σ_s exp[-E(s)/(RT)]`, `F_ensemble = -RT ln(Z)`, and `P(i,j) = (1/Z) Σ_{s:(i,j)∈s} exp[-E(s)/(RT)]`. At 310.15 K, R=0.0019872041 kcal mol⁻¹ K⁻¹. The inside recurrence sums nonredundant helix decompositions (the leftmost enclosed helix and remaining region); outside derivatives yield base-pair marginals. Stochastic sampling and ML approximations are not used in the new calculation. Base-pair probabilities are computed before applying a display threshold; the threshold only limits the dots and report rows, **not** the partition sum.

The ensemble is exact under the **declared restricted NEXUS model** only. This does not imply accurate experimental folding energetics or equivalence to Turner 2004/ViennaRNA.

## Included energy model

NEXUS v0.5 independent model: 37°C rounded canonical/GU nearest-neighbor stacks; selected hairpin initiation and corrections; approximate bulge, internal loop and multibranch energies. The ensemble reuses the published-model terms already implemented in `thermofold-core.js`, including the same terminal penalties and provisional multibranch affine formulation. It excludes complete specialized loop tables, dangling ends, coaxial stacking, full GU-context exceptions, modified bases, ionic-condition adjustment, pseudoknots, multi-strand hybridization and temperature-dependent parameters.

## Tests executed

1. **Exact independent enumeration**: ten fixed sequences and forty seeded random short RNAs. A separate enumeration of every pseudoknot-free structure calculates its energy using `evaluateStructure` (not the new partition recursion) and directly sums Boltzmann weights. Partition sums, expected base pairs and pair marginals agree with the independent sums within numerical tolerance.
2. An additional fixed negative-input/boundary test, and a numerical 110-nt test for finite values and properly bounded probabilities.
3. Browser interaction checks at desktop (1366 px) and mobile (390 px) with inline-document execution. Tested sample analysis, probability dot plot, CSV download and no horizontal overflow. This environment blocks direct local-file URL navigation; live Cloudflare hosting has not been tested.
4. Earlier NEXUS scientific modules are preserved; only exports were added to `thermofold-core.js` so the new calculation can reuse the exact existing energy functions.

## Explicit scientific gates before premium use

- Independent quantitative benchmarks with real versioned RNAfold and RNAstructure outputs, matched temperature/energy options; report strict base-pair F1 and ΔG MAE and investigate large disagreements.
- Add independently implemented, audited full-loop/special-hairpin/dangle/coaxial terms and independently reference their energy tables. Re-run all benchmark cases after each parameter change.
- Validate structural predictions against experimentally characterized RNAs of diverse lengths and sequence contexts, including both single stem–loops and multibranch folds.
- Add uncertainty warnings for modified nucleotides and sequence conditions not covered by parameters.
- Confirm open-parameter redistribution terms, licensing, third-party notices and freedom-to-operate before paid commercialization. Independent source code does not itself guarantee patent freedom-to-operate.
- Mobile and long-RNA performance: this ensemble intentionally supports up to 110 nt. Existing restricted-model global MFE supports up to 280 nt; the separate 3,000-nt segmented explorer is **not** a full-length global thermodynamic prediction.

### Sources

- Turner nearest-neighbor database, University of Rochester: https://rna.urmc.rochester.edu/NNDB/
- McCaskill (1990), *Biopolymers*, doi:10.1002/bip.360290621 (partition-function framework)

**Do not describe v0.7 as validated, clinical-ready, GMP-qualified, full Turner, ViennaRNA-equivalent or suitable for released therapeutic design.**
