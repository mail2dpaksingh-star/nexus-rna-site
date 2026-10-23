# NEXUS v1.8.14 — ThermoFold v0.5

This website bundle is based on NEXUS v1.8.13. The updated ThermoFold core introduces partial internal-loop parameter improvements and a more detailed internal-loop ΔG audit. It preserves the existing SeqFold, DOE, QC, account, oncology/hematology, Pro and circular-RNA workbenches.

## What to do
1. Back up the live NEXUS website and its existing deployment configuration.
2. Extract this ZIP and upload its contents (not the ZIP itself) to your repository or existing Cloudflare Pages direct-upload project.
3. Open `/tools/seqfold/thermofold.html` on the live site; check a short synthetic hairpin and a larger sequence showing internal loops. Confirm the **Inspect loop ΔG terms** section contains a breakdown.
4. Test `/tools/seqfold/thermofold-benchmark.html` and ensure no external benchmark success is claimed without a genuine external reference set.
5. Check the site on mobile and verify project and account features on the deployed host. Supabase sign-in requires separate owner configuration.

**Scope:** This update is not a verified ViennaRNA-equivalent folding engine and does not alter the 280-nt global computation limit. A 3,000-nt segmented explorer remains available as a distinct approximate feature.

## Checks
```sh
node --test tests/*.test.cjs
python tests/thermofold_internal_oracle_v05.py
python tests/thermofold_exhaustive_oracle_v04.py
node benchmark_tools/external_validation_gate_v05.cjs  # expected BLOCKED without external references
```

For scientific limitations and citations, read `THERMOFOLD_v0.5_METHODS_AND_BENCHMARK_STATUS.md`.
