# NEXUS RNA BioSolutions v1.8.7 — 3,000-nt RNA folding

**Release type:** Browser-only folding capacity update on top of the v1.8.6 website. Accounts, scientific workbenches, search and scientific calculation modules unrelated to folding are retained.

## Updated tools

- `tools/seqfold/index.html` — Nussinov maximum-pair heuristic accepts selected regions of 1–3,000 nt. The original dynamic programming is used up to 350 nt; longer regions are analyzed independently in 250-nt, nonoverlapping segments.
- `tools/seqfold/precision.html` — simplified relative-energy folding accepts 1–3,000 nt. The original short folding algorithm is used up to 220 nt; longer sequences are analyzed independently in 200-nt nonoverlapping segments. The combined relative score is NOT thermodynamic free energy.
- `tools/seqfold/validation.html` — comparisons with external RNAfold dot-bracket outputs can use up to 3,000 nt, but are not a valid global thermodynamic benchmark for locally segmented NEXUS output.
- `tools/construct-studio/dbtl.html` — local structure review accepts selected windows up to 3,000 nt and saves window-based provenance to Project Hub records.

## Interpret correctly

**This does not compute a global 3,000-nt MFE structure.** An output dot-bracket may span all 3,000 nucleotides, but consists of independent per-segment hypotheses concatenated in sequence order; long-range base-pair interactions between segments are not evaluated. Segment boundaries are algorithmic artifacts. No thermodynamic Delta-G (kcal/mol), ensemble or base-pairing probabilities are inferred. Scientific design and vaccine-development decisions require separate validated folding and experimental measurements.

For global energy-based folding, run the official ViennaRNA RNAfold or RNAstructure independently (subject to licensing and dataset confidentiality review), import their dot-bracket output to DBTL if relevant, and record the model, software version, experimental parameters, and source file.

## Deployment

1. Download the ZIP and extract it; don't upload the ZIP file itself into a GitHub repository.
2. Upload the entire extracted website tree, preserving `tools/seqfold/` and `tools/construct-studio/`, to the `nexus-rna-site` GitHub repository, or deploy the ZIP through Cloudflare Pages Direct Upload if that is the site's existing configuration.
3. Open the SeqFold main RNA Folding tab, the Precision Folding tab, and the DBTL RNA Structure section. Test a synthetic 3,000-nt sequence; results should mention independent windows.
4. Refresh the live site or use a private browser window if cached assets display the previous 220-/350-nt limit.

**No user passwords, subscription gating or Supabase configuration were changed in this release.**
