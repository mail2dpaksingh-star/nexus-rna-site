# NEXUS ThermoFold v0.3 — Scientific Methods, Evidence and Limitations

**Status:** Research-stage, independently implemented restricted thermodynamic model. **Not** a replacement for RNAfold, RNAstructure, or experimental structure characterization. **No claim of biological accuracy or full Turner 2004 parameter parity is made.**

## Engineering changes

1. AU, UA, CG, GC, GU and UG are permissible paired nucleotides; the 37°C stacked-pair energy lookup uses the **rounded Turner 2004 NNDB Watson–Crick/GU 6×6 table**, entered independently from publicly accessible parameter documentation. The NNDB specially treats certain tandem GU contexts; v0.3 does **not** reproduce the exceptional context-dependent three-stack correction.
2. The dynamic program now handles nonpseudoknotted branching (an enclosing helix with two or more child helices), in addition to separate exterior hairpins.
3. Hairpin initiation is derived from a published subset; internal-loop and bulge energy functions remain the **same approximations from v0.1**. Multibranch initiation uses a **provisional affine penalty** (4.6 kcal/mol initiation, 0.4 kcal/mol per branch, zero per unpaired nucleotide) for internal consistency checks, **not a complete Turner multibranch model**. We do not label this term an experimental constant.
4. Terminal AU/GU ends receive a 0.45 kcal/mol penalty in specified contexts; dangle, mismatch, coaxial and special-loop corrections are absent.
5. A separate structure-energy evaluator reconstructs the energy of the selected dot-bracket structure and checks it against the dynamic-programming objective before returning a result.
6. Structures without multibranch loops retain the conventional nucleotide hairpin view. Branched folds are shown as sequence-ordered base-pair arcs, explicitly not a 3D shape or a single hairpin.

## Limitations

- No complete 1×1, 1×2, 2×2 internal-loop sequence tables, special triloop/tetraloop/hexaloop terms, terminal mismatch tables, GU tandem context correction, multibranch asymmetry or strain, coaxial stacking, dangling ends, pseudoknots, salt adjustments, temperature scaling or modified nucleotides.
- Results reflect a **restricted, internally self-consistent energy objective**, not a validated full free energy surface. Even a numerically displayed ΔG in kcal/mol is model dependent.
- No partition functions, base-pair probabilities, pseudoknots or confidence probabilities. The web worker is used for the browser user interface.
- Max **280 nt** for the v0.3 *global restricted-model* solver. The independent **3,000 nt segmented preview** remains available and does not calculate full-length global RNA thermodynamics.

## Validation activities completed and how to interpret them

- Code-level regression tests cover base-pair lookups, GU wobble, hairpins, multiple exterior helices, multibranch traceback, input boundaries and reproducible outputs.
- A separately written **Python exhaustive enumerator** generates every admissible pseudoknot-free secondary structure for 48 short synthetic sequences and compares the **minimum objective value** to the JavaScript dynamic program. This verifies optimality under the declared restricted model; it is NOT a benchmark against a second thermodynamic predictor.
- Direct energy reconciliation is checked for every generated RNA fold, and a documented branched fold test ensures every pair survives visualization.
- A published RNAfold historical manual example remains a **diagnostic disagreement**, not an RNAfold parity pass. It lacks a fully controlled parameter snapshot. An actual independently installed RNAfold CLI was not available in this environment; no external results were fabricated.
- 37°C, GU enabled, dangling ends 0, special tetraloop bonus disabled is a defensible *initial* external comparison configuration, but it is **still not parameter-matched** to this restricted engine.

## Independent benchmark protocol: what is still required

1. Install independently licensed ViennaRNA RNAfold (and separately RNAstructure) outside the NEXUS source tree, capture executable version, salt/temp and parameter file settings.
2. Generate external predictions with `python3 benchmark_tools/generate_rnafold_references.py --cases tools/seqfold/benchmarks/challenge_cases.json --out rnafold_reference_v03.json`.
3. Compare with `node benchmark_tools/run_benchmark.cjs rnafold_reference_v03.json nexus_reference_comparison_v03.json`.
4. Expand from the 10 synthetic challenge cases to **at least 100 diverse reference cases** including GU-rich, internal-loop, multibranch and short/long sequences, generated from authentic independent executables with parameter settings retained.
5. Quantify predicted-structure base-pair precision/recall/F1, exact structure fraction, ΔG signed bias/MAE/RMSE, runtime, memory, and failure rates. Keep a separate test collection of **experimentally established RNA structures** for biological predictive accuracy.
6. Define scientific acceptance gates *before* reviewing holdout results, revisit missing Turner parameters, and withhold production validation claims until achieved.

## Sources

- Turner NNDB: https://rna.urmc.rochester.edu/NNDB/
- GU and Watson-Crick 37°C stack table: https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_watson_crick_stack_dg.txt
- GU exceptional contexts: https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_gu_pairs.html
- Multibranch model: https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_multibranch_loops.html
- RNAfold model/CLI options: https://viennarna.readthedocs.io/en/latest/man/RNAfold.html

## License and production gates

NEXUS v0.3 comprises newly written calculations based on scientific literature; it does not contain ViennaRNA source or downloaded parameter files. This does not by itself establish freedom to operate, model ownership of published facts, or regulatory suitability. Review licensing, IP, data protection, external software use and commercial terms before paid distribution.
