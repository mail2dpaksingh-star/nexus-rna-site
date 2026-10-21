# NEXUS RNA BioSolutions — QC Analytical Method Framework, v1.1

**Scope:** Research and method-development planning for synthetic RNA and RNA–lipid nanoparticle (LNP) constructs. This is NOT an executable instrument-specific SOP, a validated GMP release specification or a substitute for training, lab safety review, and method qualification. No patient-level data belong in the browser-based tools. Select platform-specific steps, settings, concentration ranges and acceptance limits through laboratory validation, approved methods, or vendor instructions.

## How programs connect

1. **Construct Strategy Studio** establishes sequence/modality, expected translated target, model and molecule-specific analytical questions. Export architecture and risk flags.
2. **Targeted LNP Studio** tracks lipid composition, nominal N:P, mixing feasibility and targeting biology. Save calculated composition, not a prediction of delivery or potency.
3. **Analytical QC Studio** attaches individual samples, instrument method IDs, interpreted measurements, QC control review and user-supplied acceptance criteria to the same project ID.
4. **Immune Assay Studio** records assay-group statistics separately, after analytical sample identity and interpretability have been reviewed.
5. **Project Hub** shows linked stages and exports the nonvalidated research dossier as a JSON file. Keep primary source files in a controlled repository/LIMS.

## Required method header (every assay)

- SOP ID, version, author/reviewer/approval, intended use, analyst and instrument/equipment ID, calibration status and software version.
- Construct/sample ID, sequence/reference material, input lot/batch, storage condition, freeze-thaw history, and traceable extraction/preparation notes.
- Specificity, calibration/linearity, detection/quantitation range, precision (within-run and between-run), interference, stability and matrix qualification as appropriate.
- Control acceptance, blanks, positive references, replicate design and invalid-run criteria defined *before* observing results.
- Raw record / audit trail location, predefined analysis algorithm, formula/unit checks, deviations, OOS/OOT investigation and independent review.

## Purified RNA analytical method index

| Method | Analytical question | Core readout & calculation | Control / qualification priorities |
|---|---|---|---|
| RT-ddPCR | How many target RNA copies are detectable? | Partition-positive fraction; Poisson estimate × partition volume conversion and dilution correction | RT conversion, threshold/rain, positive and negative partitions, reference standards, NTC/no-RT, inhibition and LOD/LOQ; follow dMIQE 2020 |
| RT-qPCR | How do target RNA levels compare? | ΔΔCq relative quantity with empirically established target/reference efficiency | RNA quality, primers/probes, stable references, calibrator, standard curve, RT and negative controls, MIQE 2.0; Cq is not a linear concentration |
| LC–MS cap profiling | What cap-related chemical species are observed? | Corrected relative peak areas for independently identified capped and uncapped species | Digestion suitability, cap species separation, cap 0/1/2, peak assignment, response factors, matrix interference, recovery, calibration, controls; equal peak areas need not mean equal molar amounts |
| Poly(A) characterization | What is the tail-length distribution? | Weighted mean, median, P10/P90 of imported length:abundance bins | Tail-specific reference, sizing bias, distribution recovery, truncation, heterogeneity, range/accuracy; this tool does not parse instrument traces |
| Agarose RNA gel | Is the expected-length material detectable? | Background-corrected selected band divided by lane area | RNA size ladder, denaturing condition appropriateness, nonsaturated stain response, smearing, low-MW fragments, contamination; semi-quantitative |
| Bioanalyzer/Fragment Analyzer | What fraction lies in the chosen size region? | Expected-size integrated area / total integrated area | Size marker, platform/calibration, trace integration, fragments, carryover, chip/reagent lot; rRNA RIN is not universally meaningful for synthetic mRNA |
| Cell-free protein translation | Does supplied RNA support protein production in a test system? | (sample − blank)/(reference − blank) | Cell-free system compatibility, linearity, input normalization, reporter/antigen specificity and defined timepoint; not cellular potency |
| A549 or HEK293 expression (purified RNA) | Is the expected antigen expressed in a selected cell model? | Background-corrected fold versus matched benchmark | Authenticated cell line, cell count, viability, dose, delivery route, kinetic timepoints, independent replicate lots, orthogonal expression validation |

## RNA–LNP analytical method index

| Method | Analytical question | Core readout & calculation | Control / qualification priorities |
|---|---|---|---|
| Encapsulation efficiency | What fraction of dye-accessible RNA appears protected? | 100 × (1 − adjusted free RNA / adjusted total RNA) | Matched standards/blanks, validated lysis and complete release, fluorescent dye matrix effects, dilution and calibration matching, RNA loading by orthogonal quantitation |
| A549 / HEK293 expression (RNA–LNP) | Does formulated cargo yield protein in a cell model? | Fold vs matched LNP comparator with background subtraction | Same RNA dose, viable cell normalization, empty LNP, free RNA comparator, dose/time response, uptake and endosomal escape distinguished |
| Western blot antigen | Is a specific antigen band detectable, at expected molecular weight? | (sample antigen/sample loading band)/(reference antigen/reference loading band) | Antibody specificity, appropriate controls, nonsaturation, background-corrected densitometry, stable loading standard, biological replicates and orthogonal antigen assessment |
| LNP size / PDI / zeta | What physical attributes are measured? | Submit measured hydrodynamic diameter, PDI and zeta potential | Instrument/measurement condition, replicate and weighting basis, buffer, temperature, viscosity and orthogonal particle sizing if needed |

## Analytical interpretation and escalation

- Each assay output should report the **raw measurement provenance**, formula, units, required controls, and any limitations. Keep measured RNA quantity, integrity, identity, capping, poly(A), expression and LNP encapsulation as **separate critical quality attributes** unless equivalence is validated.
- For qPCR/ddPCR, RNA measurements may depend on reverse transcription and extraction efficiencies, and differential conditions should be qualified against matrix effects.
- Apparent capping area fraction is not automatically absolute capping efficiency without peak identification and calibrated relative response.
- Encapsulation efficiency is neither mRNA content nor functionally available cytosolic RNA. A high encapsulation result does not prove transfection or endosomal escape.
- Expression results in A549 and HEK293 are model-specific. They are not direct evidence of in vivo organ targeting, CAR function, neutralization potency or immunogenicity.
- For out-of-trend data, review controls, calibration, raw curves/traces, lot effects, assay qualification and repeatability before attributing biology. For a GMP-controlled method, route through approved deviation/OOS workflows.
- Acceptance bands displayed in the studio are **user-set** and not NEXUS recommended specifications. The output is research interpretation and not approval for clinical or commercial lot disposition.

## Selected primary reference sources

- MIQE 2.0 (2025): https://pubmed.ncbi.nlm.nih.gov/40272429/
- dMIQE 2020: https://pubmed.ncbi.nlm.nih.gov/32746458/
- Review of quantitative RNA-LNP in vitro assay challenges (2025): https://pmc.ncbi.nlm.nih.gov/articles/PMC12427680/

## Next engineering and qualification gates

1. Add controlled CSV schema/importers per instrument type, including raw amplification/droplet tables, oligonucleotide mass-spec reports, electropherogram peak tables, fluorescence plate reader data and Western densitometry exports.
2. Separate technical repeats from independent biological and formulation batches; add statistical model selection, uncertainty, calibration and traceable units.
3. Introduce configurable, versioned SOP templates and approved acceptance criteria signed off by qualified method owners; implement roles, logs and controlled record persistence in a future audited backend.
4. Add reproducible audit-grade validation sets (known standards and diverse edge cases), performance/regression checks, independent review and documentation of intended-use boundaries.
