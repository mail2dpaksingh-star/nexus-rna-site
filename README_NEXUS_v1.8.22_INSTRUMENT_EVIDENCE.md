# NEXUS v1.8.22 — Instrument Exports and Construct Evidence

Release: Research pilot, **not** GMP/QMS/Part-11 validated.

## Scope

The updated Program 04 Construct-to-Evidence Workbench at `tools/construct-studio/evidence.html` adds a delimited-export bridge for qPCR (QuantStudio), ddPCR (Bio-Rad QX software), Gen5 plate readers, FlowJo tabular statistics, and Agilent 2100 Bioanalyzer peak/region exports. It extends v1.8.21 without changing ThermoFold. The general Instrument Import QC Studio remains available.

**Supported today:** vendor-generated CSV, TSV and TXT result tables with user-reviewed field mappings. **Not yet supported:** raw FCS, .eds, .xad, device binary projects, gated-event reanalysis, amplification-curve reanalysis, direct COM/LIMS instrument connections, `.xlsx` in this lightweight browser import page. For XLS/XLSX outputs, use the official application's CSV/TXT export rather than editing values manually.

The `tools/construct-studio/examples/` fixtures are **synthetic vendor-style teaching examples**, *not* genuine instrument files; their headers are based on documented possible exports. Exact format compatibility varies by software version, selected export options and locale. No vendor or method qualification has been performed with actual de-identified exports yet.

## Five supported profiles and clinical/scientific cautions

| Profile | Documentation basis | Import interpretation |
|---|---|---|
| qPCR QuantStudio | Thermo Fisher QuantStudio Command-Line Application Guide, `MAN0019142`, primary results: Well Position, Sample, Target, Amp Status, Cq | Cq remains Cq; no direct gene-expression fold change without reference-target and efficiency-based validated normalization |
| ddPCR Bio-Rad QX | QX200 QuantaSoft instrument instructions describe exported per-well concentration / copies per µL | Imported units are **as exported**, no correction for dilution, RNA extraction, reverse transcription or positivity thresholds |
| Agilent/BioTek Gen5 | Agilent Gen5 File Export technical note, column and matrix TXT formats | Raw RFU/RLU/OD is not protein concentration without calibration, blank correction, dose/cell normalization |
| FlowJo statistics | FlowJo Table Editor CSV documentation | Imported MFI/median/frequency is post-gating software output; NEXUS does not gate raw FCS or verify compensation and transforms |
| Agilent Bioanalyzer 2100 | Agilent 2100 Expert Software User Guide, peak/region table export to CSV/XLS | Area, region percent, size or concentration remain their native quantities; no implied RIN or integrity interpretation |

Authoritative references:
- [QuantStudio results table definitions](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/MAN0019142_Command-LineApplication_UG.pdf)
- [QuantStudio well-table CSV export](https://documents.thermofisher.com/TFS-Assets/LSG/manuals/MAN0018200_QuantStDesgnAnalysisSW_v2_Desktop_UG.pdf)
- [FlowJo statistics CSV](https://flowjo.com/docs/flowjo10/tabular-reports/te-export)
- [FlowJo MFI and gate-statistic explanations](https://flowjo.com/docs/flowjo10/workspaces-and-samples/ws-statistics)
- [Agilent 2100 Expert peak and region table export](https://www.agilent.com/cs/library/usermanuals/public/2100_Bioanalyzer_Expert_USR.pdf)
- [Agilent Gen5 file export technical note](https://www.agilent.com/cs/library/technicaloverviews/public/Gen5-file-export-5994-3431EN-agilent.pdf)

## First-use workflow

1. On `tools/construct-studio/evidence.html`, create/restore the proper NEXUS research project.
2. Register the actual **versioned construct** and all experimental **sample IDs**, with biological-replicate ID, batch, experimental condition, time point, cell model and experiment ID.
3. Save the initial Construct Evidence state to the browser-local Project Hub. This step is essential; instrument import reads the saved state.
4. Choose an instrument profile and select an exported CSV/TSV/TXT file. The browser reads it **locally** and, where available, computes source-file SHA-256. It does not automatically upload the file to Supabase or any remote server.
5. Check sample, numeric value, target/analyte, well, optional QC flag, measurement units, normalization and method identifier. Use a separate import per distinct numeric measurement column.
6. Explicitly map each source sample to a registered NEXUS sample. Unmapped identifiers, duplicate technical repeats and invalid fields block the entire import; missing/undetermined values and recognized exclusion flags are counted and excluded, never rewritten as zero.
7. Preview, then import. NEXUS saves a source-provenance record with hash, filename, field map, excluded rows, and assay interpretation fields; raw exports must be archived separately.
8. Pick a baseline construct in *Matched Experimental Construct Comparisons*. Summaries require identical experimental and analytical strata. The result is descriptive, not a confidence interval or hypothesis test.
9. Download JSON evidence dossier or CSV construct comparisons. Back up the local project JSON.

### Benchmark status

- New import-core tests: see `tests/evidence-instrument-v22.test.cjs` (five fixture profiles, undetermined retention, sample mapping, duplicates, comparator limitations).
- Prior construct-evidence and account-storage regressions: unchanged source code; rerun when deploying.
- Browser smoke test: synthetic fixture import and comparison export completed using isolated Chromium HTML injection; **not** a live Cloudflare/Supabase test.
- Actual instrument files from the user's laboratory: **0** qualified/checked against v1.8.22.
- Real instrument-derived cross-platform reports: **not verified**.

## Minimum acceptance plan before charging for the module

Obtain at least one *nonconfidential, de-identified*, real result-table export per intended instrument/software version (include manufacturer, model, application/version, file format, export settings, target/assay columns, QC flags, blank/NTC records, accepted-droplet and gate settings as applicable). Develop golden-file tests for every header variation and known numeric record, plus negative cases such as Omit, No Amp, Undetermined, deleted wells and missing normalization. Have an independent scientist verify data lineage, units and interpretation. Never publish client raw data to a public GitHub repo. Store original raw source files securely outside NEXUS and retain appropriate privacy permissions.

This release includes **no medical device claim, clinical validation, GMP qualification, or regulatory audit trail**.
