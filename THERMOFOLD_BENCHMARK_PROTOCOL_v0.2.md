# NEXUS ThermoFold — Independent Benchmark Protocol v0.2

**Status: evaluation infrastructure, NOT validated scientific parity.**

Historical v0.2 benchmark infrastructure, retained for reproducibility. For current folding methods, **read `THERMOFOLD_v0.4_SCIENTIFIC_VALIDATION.md` first**. No update to ThermoFold establishes scientific parity with external RNAfold. The 3,000-nt segmented folding explorer is a different algorithm and must not be included in global-MFE parity comparisons.

## Scientific question

Separate three levels of evidence:

1. **Internal correctness:** compare hand-computable hairpins, dot-bracket validity, deterministic calculation, algorithmic invariants and tests against an independent energy evaluator.
2. **Predictor agreement:** compare NEXUS with independently computed ViennaRNA and RNAstructure output on identical unmodified input sequences, recording exact versions, options and parameters. Compare MFE energy errors, strict paired-base precision/sensitivity/F1, and exact structures. **This is not experimental correctness.**
3. **Experimental accuracy:** compare predictions against a curated, preferably independently determined structural dataset. Report sensitivity/PPV/F1 for observed base pairs, stratified by RNA family, GC fraction, sequence length, and pseudoknot annotations. Exclude experimentally unresolved regions as specified in advance. Do not use a reference predictor as ground truth.

## Reference generation

This package does **not** bundle ViennaRNA, RNAstructure code, or vendor parameter files. Obtain any software separately and review licensing before commercial distribution. A locally installed `RNAfold` executable is needed for genuine reference generation.

Command from the website package root:

```bash
python3 benchmark_tools/generate_rnafold_references.py \
  --cases tools/seqfold/benchmarks/challenge_cases.json \
  --out rnafold_references.json
node benchmark_tools/run_benchmark.cjs rnafold_references.json result.json
```

The Python script uses `RNAfold --noPS -d0 -T 37` and records the executable version. These settings retain GU and special-loop corrections and disable dangling ends, but do not yield full parameter parity with NEXUS. The incomplete NEXUS loop model and missing multibranch/dangles cannot be made equivalent to ViennaRNA through command flags.

The browser benchmark interface (`tools/seqfold/thermofold-benchmark.html`) imports the JSON or CSV reference file and generates auditable comparisons without uploading sequences to a remote server. It analyzes **no more than 50 records per browser batch** and only at lengths of **≤280 nt**, the current restricted engine's bound.

`tools/seqfold/benchmarks/challenge_cases.json` contains **synthetic challenges, not experimental ground truth**; their sequences intentionally cover short stems, AU-rich motifs, GU-sensitive motifs, alternative pairings and multibranch motifs. The deterministic challenge set now contains **125 synthetic sequences** with no invented RNAfold reference results. Browser batches remain limited to 50; use the command-line workflow for all 125.

## First independent-source diagnostic (published manual illustration)

The official RNAfold manual illustrates RNA `CGACGUAGAUGCUAGCUGACUCGAUGC` with structure `(((.((((.......)).)))))....` and ΔG −1.90 kcal/mol. That is an **externally published historical output example**, but the exact parameter snapshot cannot be recovered from the excerpt, so it is *not* a reproducible matched-model benchmark.

An earlier NEXUS v0.1 restricted-model run produced 0 predicted pairs and ΔG=0.00; this is an archived historical result, not the current v0.4 prediction. Its discrepancy from the published manual example is +1.90 kcal/mol, with strict pair F1=0.00. A one-case result cannot determine overall accuracy, and the options/models differ. It is nevertheless a concrete regression/evidence gap. See `NEXUS_ThermoFold_v0.2_Documented_Example_Comparison.json`.

Reference: https://viennarna.readthedocs.io/en/latest/man/RNAfold.html

## Per-case metrics and reporting

- MFE energy signed error = NEXUS ΔG − external ΔG, reported in kcal/mol.
- MAE, RMSE, signed mean bias; report n and parameter agreement caveats.
- Base-pair TP/FP/FN, exact pair precision (PPV), sensitivity, F1; exact dot-bracket match. Distinct from ±1-nt-relaxed scoring available in some RNAstructure software.
- Separate averages by sequence-length bins, GC content, motifs, and data provenance. Bootstrapped confidence intervals and experimental assessments belong in a later validated release.
- No threshold/acceptance or pass/fail is claimed yet; acceptance targets require predefined scientific use and power analysis.

## Roadmap for fixing scientific discrepancies

**Gate A:** Independent structure-energy evaluator: compute energy of an arbitrary given dot-bracket structure; compare to the folding traceback without reusing the same DP path. Add exact no-structure and known hairpin controls.

**Gate B:** Parameter parity: versioned complete Turner nearest-neighbor tables including GU wobble, special hairpin motifs, mismatch, terminal penalties, bulges, internal 1×1/1×2/2×2 loops, dangles and multibranch energies. Review rights to redistribute third-party tables.

**Gate C:** Thermodynamic recurrences and traceback: implement full pseudoknot-free global MFE; compare to RNAfold at identical parameter settings, including adversarial edge cases.

**Gate D:** At least 100 documented external reference comparisons (held-out and independently generated), then >100 experimentally characterized structures stratified by RNA family. Use named external dataset versions and documented exclusions. RNAstructure Scorer offers exact vs ±1 position metrics; use strict exact initially.

**Gate E:** Ensemble partition functions, base-pair probabilities, structure constraints, modified nucleotide support only after controlled parameter, numerical and software validation. Benchmark performance (RAM/time) before increasing the exact model toward 3,000 nt.

## Privacy, IP and reproducibility

- Browser comparison files remain local. Do not upload proprietary research sequences to public folding websites without authority.
- `RNAfold` comparisons are separately executable in the user's own environment; this package does not include its source/binaries.
- Preserve source program version, settings, temperature, parameter set, input FASTA checksums, and analysis timestamp in any formal report.
- ViennaRNA terms: https://viennarna.readthedocs.io/en/latest/license.html. Commercial inclusion requires separate author discussion; this is not an endorsement or permission decision.
- Results are **research-only**: not GMP release, clinical validation, or proof that any specific RNA will express well in cells.
