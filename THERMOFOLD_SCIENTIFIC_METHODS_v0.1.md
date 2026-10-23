# NEXUS ThermoFold v0.1 — Scientific Method, Limits and Validation Gates

**Release:** 2026-10-22. Independent browser-oriented research prototype, not a ViennaRNA port or a validated folding predictor.

## Implemented

- Energy-based dynamic programming with traceback and external assembly of independent nested stems.
- Pair set: Watson–Crick AU, UA, CG, GC only. A,C,G,U unmodified RNA input.
- ΔG at **37°C**, in **kcal/mol**, using published canonical Watson–Crick nearest-neighbor stack values and published hairpin-initiation values.
- Simplified interior-loop and bulge energies; unpaired loop corrections are **not** the complete Turner 2004 model. The energy minimum is over **the restricted structure ensemble**, not global MFE over all biological RNA secondary structures.
- Dot-bracket, arc visualization, SVG/JSON/DBN exports. Runs entirely in a Web Worker with a 280-nt limit to protect current browser clients.

## Explicitly excluded and why the energy differs from ViennaRNA

- GU wobble stacking, special tandem GU, and noncanonical base pairs.
- Multibranch loops within paired closures; coaxial stacking; 3′/5′ dangling ends.
- First-mismatch energy tables, special tri/tetra/hexa hairpins, special cytosine bulges, helix end corrections beyond a simple AU penalty.
- Sequence-independent simplified bulge terms and coarse interior penalties are insufficient to claim Turner-2004 parity.
- Pseudoknots, modified nucleotides, experimental constraints, ions/salt model, arbitrary temperature (enthalpy/entropy tables), partition functions, ensemble diversity and base-pair probabilities.
- Full 3,000-nt global MFE. NEXUS's earlier 3,000-nt **segmented heuristic** remains a different, separately labeled tool.

## Parameters and sources

- Watson–Crick stacks at 37°C: RNA Nearest Neighbor Database, Turner 2004 values (Xia et al. 1998): https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_watson_crick_stack.htm
- Hairpin initiation values n=3–9: https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_hairpin_initiation.htm
- Interior loop approximations: https://pmc.ncbi.nlm.nih.gov/articles/PMC409911/
- Overall nearest-neighbor methodology: https://rna.urmc.rochester.edu/NNDB/
- ViennaRNA license/redistribution terms: https://viennarna.readthedocs.io/en/latest/license.html

**No ViennaRNA code or packaged parameter files have been copied.** Numerical reference values come from cited public scientific literature. A legal/license review remains necessary before commercial release, including any third-party parameter-table permissions and access terms.

## Example, manually auditable within this model

Input: `GGGAAACCC`; output dot-bracket `(((...)))`.

For three nested GC pairs with a three-base hairpin:
- 3-nt loop initiation = +5.40 kcal/mol
- Two identical GG/CC stacking interactions = 2 × −3.26 kcal/mol
- Computed restricted-model energy = **−1.12 kcal/mol**

This is not asserted to match RNAfold's output for the same RNA because RNAfold includes extra hairpin and terminal terms.

## Required scientific validation before premium scientific use

1. Obtain legal clearance for parameter tables and any third-party software before redistribution in a paid product.
2. Implement all GU stacks and exceptional context rules with parameter versioning; add complete special loop and multibranch terms.
3. Implement independent energy evaluation for a **given** dot-bracket structure and cross-check traceback energy (energy consistency).
4. Benchmark at least 100 curated unmodified RNAs against ViennaRNA/RNAstructure using matched conditions and parameters. Measure ΔG difference, base-pair precision/recall, fraction of exactly matching structures, and uncertainty distribution by sequence length/GC content/motif.
5. Include published experimental structure test cases (where available), not solely agreement with another predictor.
6. Add performance and memory benchmarks; compile to WebAssembly only after correctness tests pass.
7. Offer partition function and base-pair probabilities only after full energy model and numerical tests are validated.
8. Integrate explicit versioned model metadata into DBTL, QC and Pro product reports.

## Website deployment

Unzip this release into an existing Cloudflare Pages/GitHub deployment, replacing only the corresponding site files. The new page is `tools/seqfold/thermofold.html`. It does **not** need a server, API key, Supabase account or external inference access. Test on HTTPS before release, especially Web Worker loading.
