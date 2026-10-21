# NEXUS RNA BioSolutions — instrument-data import & analytical validation plan, v1.4

**Status:** Research prototype; UNQUALIFIED for regulated QC / GMP / batch disposition. This plan is a starting specification for a future validated system. Native-text vendor exports are currently supported. Proprietary raw project or binary files are not.

## Supported import pathways

| Instrument family | Current supported input | Data fields retained | Explicit limitations |
|---|---|---|---|
| Thermo Fisher QuantStudio & other qPCR | CSV or TSV results table (including tabular results preceded by metadata) | Sample, target, well, Cq/Ct, instrument status | Does not reanalyze amplification curves, efficiencies, melting curves, RNA abundance, or raw `.eds` files. |
| Bio-Rad QX Manager / ddPCR | CSV/TSV concentration table | Sample, target, well, reported copies/µL, instrument flags | No droplet reclassification, thresholding or raw per-droplet analysis; does not infer dilution factors or sample concentration from imported reaction concentration. |
| LC–MS | CSV/TSV peak/compound result table | Sample/injection, peak/analyte, area, flags | Peak area is not capping efficiency. No peak-integration, mass identification, response-factor, tail-length or chromatographic validation. Proprietary `.raw` is not parsed. |
| Agilent Bioanalyzer / electrophoresis | CSV/TSV peak or region export | Sample, peak/region, source value, QC flag | No electropherogram trace reconstruction, peak assignment, assay-specific integrity/RIN computation, or `.xad` project-file parsing. |
| Plate reader | CSV/TSV well-result table | Sample, well, wavelength/channel, intensity/absorbance | No dose-response curve fit, standard-curve correction, background correction, encapsulation or potency claim without a controlled assay. |

**Original vendor export files must be retained outside NEXUS** in an established data-governance system with the underlying raw instrument records. Source filename, file byte length and browser SHA-256 support basic traceability, but do not establish authenticity or compliance.

## Acceptance/qualification framework

1. **Identity & provenance:** verify source file, instrument identifier, software/build number, acquisition run/injection batch ID, operator, methods and sample identifiers against an approved log.
2. **Method version control:** define SOP, intended-use statement, analytes, matrices, sample preparation, reference materials, system suitability and equipment qualifications. Preserve exact criteria revisions in each report.
3. **Analytical quality attributes:** for an applicable quantitative assay, assess accuracy/bias or spike recovery, repeatability and intermediate precision, selectivity/interference, calibration behavior, linearity, reportable range, LOD/LOQ or detection capability, dilution integrity, stability, carryover and robustness. Not every attribute applies to every method; document scientific rationale.
4. **Instrument-level review:** inspect original QC status, baseline/threshold/integration decisions, standard curve/NTC/positive controls, system suitability, and qualified software settings. This browser importer does not independently reproduce these decisions.
5. **Statistical checks:** this release reports per-sample/analyte mean, sample SD, and technical replicate %CV, alongside comparisons to **user-entered criteria**. Nominal controls can support a basic observed/nominal recovery calculation; suitability of this calculation must be justified. A blank criterion produces “Not assessed”; an uncomputable specified criterion produces “Insufficient data”. There are no universal pass/fail thresholds.
6. **Review and reporting:** reports include source fingerprint, provenance, mapping, nonquantifiable results retained in counts, instrument flags, configured thresholds, validation-evidence references and limitations. Release statuses are *never* authorized by the software. Verification requires review of independent original records.
7. **Software validation:** before regulated use, establish intended-use URS, functional requirements, software-risk assessment, design specifications, traceable test protocols with positive/negative/edge cases, IQ/OQ/PQ where applicable, change control, audit trails, role-based access, secure backups, record-retention controls, CSV/LIMS interfaces, electronic signature workflows, cybersecurity and supplier assessments. Browser localStorage is not sufficient.

## Next implementation gates

- **Gate A — current v1.4:** native vendor-generated CSV/TSV results table import, five instrument profiles, explicit column mapping, nonnumeric flags, provenance and printable/JSON/CSV reports, links to NEXUS QC and Project Hub. Browser-local, nonvalidated.
- **Gate B — real vendor fixtures:** test and version each schema using *nonconfidential, de-identified* real exports from specified instrument+software versions. Cover metadata/preambles, report variants, encoding, locale decimal syntax, QC flag conventions, and injected/corrupt files. Current example templates are synthetic.
- **Gate C — assay-specific processing:** calibrated ddPCR outputs and confidence limits, qPCR standard curves and efficiency-adjusted models, LC–MS capping species assignment/response corrections, Bioanalyzer assay-specific regions/normalization, and calibrated plate-reader assays. Only after verified sample datasets.
- **Gate D — regulated qualification:** governed backend, access controls, electronic audit trails, controlled methods/limits, documented computerized system validation and independent QA approval. Do not call the browser-only tool GMP-compliant.

## References

- FDA, *M10 Bioanalytical Method Validation and Study Sample Analysis*, final, November 2022: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/m10-bioanalytical-method-validation-and-study-sample-analysis
- FDA, *Bioanalytical Method Validation for Biomarkers*, April 2026: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/bioanalytical-method-validation-biomarkers
- FDA, *Part 11, Electronic Records; Electronic Signatures — Scope and Application*: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application
- QuantStudio Design & Analysis results format: https://documents.thermofisher.com/TFS-Assets/LSG/manuals/MAN0019142_Command-LineApplication_UG.pdf
- Bio-Rad QX Manager export guide: https://www.bio-rad.com/sites/default/files/webroot/web/pdf/lsr/literature/10000107224.pdf
- Agilent 2100 Expert export guide: https://www.agilent.com/cs/library/usermanuals/public/2100_Bioanalyzer_Expert_USR.pdf

*Scope note:* This document is scientific and software-development guidance, not an approved analytical SOP.
