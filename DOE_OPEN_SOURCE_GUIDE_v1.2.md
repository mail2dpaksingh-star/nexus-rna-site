# NEXUS RNA BioSolutions · DOE Worksheet and Open-Source Software Guide
Version 1.2 | Research-only, not validated for clinical or GMP disposition.

## Included DOE designs

| Study purpose | NEXUS worksheet design | Restrictions |
|---|---|---|
| Main-effect / interaction exploration | Complete 2-level factorial, 2–5 independent numeric factors | Main and pairwise interactions fit; higher-order terms are omitted |
| Efficient screening | One-half 2-level fraction, 3–5 factors | Last factor is product of preceding factor signs; defining relation I=ABCDE…; effects can be aliased |
| Three-level quadratic investigation | Box–Behnken, 3–5 factors | Not valid for 2 factors; requires at least one center point |
| Face-centered quadratic investigation | Face-centered central composite, 2–4 factors | α=1; not rotatable; requires at least one center point |

Every design has user-supplied numeric bounds, units, a randomization seed, optional center points and independent replicate blocks. The NEXUS analyzer uses QR least-squares estimation on coded factors; it reports model coefficients, R², adjusted R² (where identifiable), ANOVA sums of squares and residual degrees of freedom. It does **not** calculate inferential p-values, confidence intervals, robust standard errors, leverage, pure-error or lack-of-fit tests, constrained optimization, or validated process specifications. Saturation and confounding are explicitly flagged. Predictions must be confirmed by independent runs.

### How to use

1. Select a study worksheet template or enter factor names, feasible low/high numeric values and units. Templates are illustrative, **not proven operating ranges**.
2. Predefine one primary response, its units, controls, and independent experimental unit. If an LNP composition must sum to 100%, use a **mixture-design** method in external software; do not treat constrained lipid percentages as independent factorial factors.
3. Choose full factorial, half fraction, Box–Behnken or face-centered CCD; set center points, replicate blocks and a reproducible seed.
4. Download the randomized run-sheet CSV. Record responses by `Run ID` without changing the run identifiers or headers.
5. Reimport the CSV or enter results into the table and click **Analyze measured responses**. Review model warnings and design adequacy; independently verify with external statistics software.
6. Use **Save current result to project** in the project bar. Open **Project Hub** to see DOE alongside construct, LNP, RNA QC and immune analyses. Browser storage is not a regulated record system; download a project JSON backup.

### Open-source / publicly accessible analysis packages

- pyDOE3: https://pydoe3.readthedocs.io/en/latest/ (full/fractional factorial, Box–Behnken, CCD and other DOE families)
- R `rsm`: https://cran.r-project.org/package=rsm (response-surface design, fit and diagnostics)
- R `FrF2`: https://cran.r-project.org/package=FrF2 (fractional-factorial design and analysis)
- Python `statsmodels`: https://www.statsmodels.org/stable/regression.html (OLS, statistical diagnostics and ANOVA)
- NIST/SEMATECH Engineering Statistics Handbook: https://www.itl.nist.gov/div898/handbook/ (design and model validation guidance)

Software links go to third-party maintainers. NEXUS does not distribute their code or claim their validation status. Confirm version, software license, dependencies, design assumptions, confounding, replicates, and covariance structure before use. For independent calculations, a sample script is included as `tools/doe-studio/python_reanalysis.py` and can be run locally once Python, `pandas` and `statsmodels` are installed.

### Limits and quality requirements

- Randomizing all rows across days or equipment may be inappropriate when there are hard-to-change factors. The worksheet retains only replicate-block numbers, **not formal blocked or split-plot modeling**.
- Technical replicate wells are not independent biological/process replicates. Define the true experimental unit and analyze nested data in a separate appropriate statistical model.
- Factor levels are bounded; the workbook does not enforce inter-factor nonlinear constraints or variable transformation requirements.
- The design seed reproduces row order, not data or scientific conclusions.
- CSV import matches Run IDs and the exact response column; to preserve project traceability, keep a versioned worksheet, instrument raw exports, SOP reference, exclusions and deviations separately.
- NEXUS Project Hub saves a **single latest DOE study** per project (not version history). Export the JSON before overwriting studies.
- This worksheet is useful for RNA expression, LNP manufacturing-process **exploration**, analytical method optimization, and immune readouts, not for release decisions.

## v1.3 addendum — four-lipid constrained mixture–process design

Open `tools/doe-studio/mixture.html` to construct a four-component feasible composition region with each lipid bounded in **mole percent**. User-entered constraints are respected and the four fractions sum to 100%. The selected points use polytope vertices, midpoints, interior interpolations and deterministic rank-first/space-filling selection, not a certified D-optimal algorithm. Add up to two process variables, code them as -1, 0 and +1, and select either a linear or quadratic Scheffé composition model augmented by mixture-by-process interactions. The model has no independent intercept because the composition fractions sum to one. Enter measurements for encapsulation, particle size, PDI, and relative expression; analyze each response separately. Export raw run sheets as CSV and full study JSON; do not claim optimized outcomes without new experiments and diagnostics.

Mixture/process design background:
- https://www.itl.nist.gov/div898/handbook/pri/section5/pri54.htm
- https://www.itl.nist.gov/div898/handbook/pri/section5/pri565.htm
- https://www.itl.nist.gov/div898/handbook/pri/section5/pri554.htm
- https://cran.r-project.org/package=mixexp
- https://search.r-project.org/CRAN/refmans/mixexp/html/MixModel.html

QC handoff: When recording analytical data with `tools/qc-analytics/index.html`, set the QC **sample ID** equal to the randomized mixture DOE **Run ID** (MP001, etc.) under the same project. Explicit "Match QC records" imports mapped encapsulation (`encap`), DLS diameter and PDI (`size`), and comparative A549/HEK293 LNP expression (a549-lnp or hek293-lnp). Duplicate mappings or prepopulated response values cause the entire import to fail without overwriting data. QC readouts are still exploratory calculations, not GMP release data. Retain raw files, controls, record of batches and a separate statistical analysis plan.
