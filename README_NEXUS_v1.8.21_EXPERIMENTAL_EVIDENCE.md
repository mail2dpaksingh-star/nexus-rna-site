# NEXUS RNA BioSolutions v1.8.21 — Experimental Evidence Integration

## New workbench

Open `tools/construct-studio/evidence.html` (Program 04: Construct-to-Evidence).

1. Select an existing research project ID in the Project Hub, or use the default guest project.
2. Register RNA construct versions manually or import exact version IDs from the same project's DBTL module.
3. Register experimental sample IDs with explicit construct-version ID, cell model, experimental condition, biological replicate, study/experiment and optional batch and sampling time. Construct assignments cannot be silently reassigned.
4. Add quantitative A549/HEK293 or other-cell-model expression and RNA abundance measurements, plus protein-identity findings. For batch entry, download the CSV template and import up to 1,000 measurement rows per file. Invalid rows prevent the **entire** batch import.
5. Link existing Analytical QC or Instrument Import summaries by exact sample IDs after reviewing each match. QC records are references, **not** automatically transformed into expression observations.
6. Save the evidence ledger manually in the browser-local Project Hub. Export the full evidence dossier in JSON and candidate summary in CSV. Optional configured Supabase account backups remain opt-in and bounded by the original storage limits.

## Scientific behavior

- Experimental measurements are linked to an exact versioned construct and registered sample.
- Technical measurements within each biological replicate are averaged **first**. Across-biological means/SD require distinct biological replicate IDs. A single biological replicate has no estimated SD.
- Results are separated by construct, cell model, condition, experiment, formulation batch, time, assay, analyte, unit and normalization method.
- An apparent RNA abundance signal half-life is calculated descriptively from at least 3 positive values at distinct time points within a biological replicate. It is **not** an experimentally validated RNA molecular half-life without a documented decay/chase/pulse protocol.
- Western blot, targeted proteomics and related identity evidence is recorded with a linked source, not automatically authenticated.
- Missing or unregistered samples, duplicate measurement well identifiers, conflicting DBTL sequences, malformed CSV and unsupported values are rejected.
- No clinical efficacy, GMP release, statistical significance, RNA expression superiority, instrument qualification or data-integrity certification is inferred.

## Source provenance and confidentiality

This browser-first pilot stores source **references** (filenames/records), not original machine files. Retain raw data, methods, controls, software versions, calibration evidence, and original file hashes in a controlled laboratory system. Browser-local storage is not a secure audited LIMS. Never input confidential, regulated or patient-level sequences/data before the NEXUS security and privacy controls have been independently assessed.

## Key new files

- `tools/construct-studio/evidence.html`
- `tools/construct-studio/evidence-core.js`
- `tools/construct-studio/evidence-ui.js`
- `tests/construct-evidence-v21.test.cjs`
- `tests/construct-evidence-batch-v21.test.cjs`
- `tests/construct-evidence-browser-v21.py`

The shared project allowlist and the existing homepage, Construct Studio, Pro landing page and Project Hub were updated to link the new workbench. Original ThermoFold engine files were not edited.

## Testing and deployment

```bash
node tests/construct-evidence-v21.test.cjs
node tests/construct-evidence-batch-v21.test.cjs
node tests/construct-review-v20.test.cjs
node tests/auth-workspace.test.cjs
python tests/construct-evidence-browser-v21.py
```

For Cloudflare Pages: extract the **complete** v1.8.21 ZIP and upload the extracted contents to the existing GitHub repository or Cloudflare deployment source. Ensure `index.html` is at the web root. Test on the published site with synthetic data using a new project ID before inviting real users. Cloud backup requires a configured Supabase project and further testing.

The deployment is not performed from the development environment.
