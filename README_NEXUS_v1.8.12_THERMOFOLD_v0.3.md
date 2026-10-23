# NEXUS RNA BioSolutions v1.8.12 — ThermoFold v0.3

This **complete website package** builds on v1.8.11. Only ThermoFold's core, folding UI, structure viewer, reference generator, a benchmark notice and associated tests/docs have changed; other research programs retain their existing implementations.

## What's new
- GU/UG wobble allowed, using 37°C rounded NNDB stacks.
- Multibranch fold topologies supported with explicitly provisional energy penalties.
- Each calculated structure is independently re-evaluated inside the engine; output is blocked if scoring disagrees.
- Conventional hairpin drawing for single-stem folds; paired-base arc drawing for genuine branched folds.
- Transparent method statements and GU-enabled independent RNAfold benchmarking commands.

**Known limits:** not ViennaRNA-equivalent, no true parameter-complete Turner 2004 modeling, no controlled external RNAfold run performed here. 280 nt global restricted-model ceiling. 3,000 nt separately segmented preview unchanged.

## Quick tests

From the extracted root with Node.js and Python:

```
node --test tests/thermofold-v01.test.cjs tests/thermofold-v03.test.cjs tests/thermofold-benchmark-v02.test.cjs tests/thermofold-layout.test.cjs
python3 tests/thermofold_exhaustive_oracle_v03.py
```

The legacy v0.1 core is retained as `thermofold-core-v01.js` for comparisons and regression only. The default `thermofold.html` uses v0.3.

## Publish

Unzip the archive; upload the *contents*, not the zip file itself, preserving the `tools/seqfold/` hierarchy. For Cloudflare Pages direct uploads, follow the existing deployment configuration; for GitHub-connected projects commit changed files to its connected deployment branch.

After publishing, use `tools/seqfold/thermofold.html` and `tools/seqfold/thermofold-benchmark.html`.

## Security & accounts

Browser-local analysis does not automatically transmit sequences to an external server. Account storage remains optional and requires owner-provisioned Supabase; deployment here does not complete or verify any backend accounts. No GMP or clinical claims.
