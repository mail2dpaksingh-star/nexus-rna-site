# NEXUS ThermoFold v0.4 — Site deployment

Release: **NEXUS RNA BioSolutions v1.8.13**, based on v1.8.12.

1. Extract the ZIP and upload its **entire contents**, preserving folder structure, into your GitHub repository connected to Cloudflare Pages. Use `index.html` at the repository root.
2. Verify `tools/seqfold/thermofold.html` loads and the primary RNA stem–loop drawing remains visible.
3. Check the user-facing panel **Inspect hairpin ΔG terms**, which now exposes sequence-specific hairpin contributions in model units. JSON exports contain `hairpinDetails` for auditability.
4. Open `tools/seqfold/thermofold-benchmark.html` for external reference comparison. No externally calculated accuracy numbers are bundled; the standalone 125-case synthetic suite needs genuine RNAfold results.
5. Verify other tools and Supabase authentication only after separately configuring your live account project. No secret credentials are included.
6. Roll back by redeploying your previous v1.8.12 archive if needed.

**Compatibility:** All previous NEXUS scientific tool files outside the updated ThermoFold pages and supporting benchmarks remain in the package. No new account migration or billing is required.

**Important:** This model remains globally restricted to 280 nt. The 3,000-nt segmented folding preview remains available but is not a full-length global thermodynamic calculation.
