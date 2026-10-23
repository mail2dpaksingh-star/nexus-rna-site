# NEXUS ThermoFold v0.1.1 — Conventional hairpin display

## What changed
The main ThermoFold result is now a conventional two-dimensional RNA stem–loop drawing rather than an arc chart followed by visible dot-bracket notation. The structure viewer labels every nucleotide within each predicted stem–loop, draws backbone connections and base-pair hydrogen-bond guides, and illustrates terminal hairpin loops and unpaired bulges. Colors distinguish GC pairs (teal), AU pairs (blue), and unpaired residues (gold). Strand direction and sequence coordinates are displayed where appropriate. More than one exterior stem–loop is shown as separate connected-region drawings. For clarity, unpaired bases outside all stem–loop regions are summarized by count rather than falsely placed in stems.

The underlying ThermoFold thermodynamic calculation, base-pair selection and ΔG values **have not changed**. This is a visual update only.

## Scientific files and exports
- **SVG** downloads the actual hairpin/stem–loop drawing.
- **Dot-bracket (.dbn)** remains available as a standardized machine-readable structure export; it is simply not shown as the primary visualization.
- **JSON** still contains the original complete RNA sequence, dot-bracket structure, base-pair list, ΔG and method warnings.

## Limitations
ThermoFold v0.1.1 remains a **partial nearest-neighbor model at 37°C**, supporting up to 280 nt for its model-based ΔG. It excludes GU wobble, multibranch loops, full terminal mismatch/dangle contributions, structural ensembles and modified RNA bases. It is not interchangeable with ViennaRNA. A separate 3,000-nt segmented structure preview remains available elsewhere in SeqFold; that preview does not compute a global thermodynamic minimum. The new drawing is a schematic of the *model-selected* secondary structure, not an experimental structure or a three-dimensional geometry.

## Deployment
Unzip the complete site package into your deployment directory, preserving `tools/seqfold/thermofold-layout.js` next to `thermofold.html` and `thermofold-ui.js`. Upload the extracted contents to the existing GitHub/Cloudflare deployment. The page path is `tools/seqfold/thermofold.html`.

## Validation
- Pure rendering regression tests verify nucleotide and pairing counts, bulges and loop coordinates, unpaired sequences, multi-component diagrams and invalid bracket rejection.
- Browser interaction checks test the 9-nt reference hairpin on desktop and mobile, SVG generation, unchanged ΔG, and absence of the visible dot-bracket panel.
- Data files remain local to the browser unless users independently choose to export/share them.
