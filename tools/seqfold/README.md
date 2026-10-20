# NEXUS SeqFold Studio v0.1

Free original browser-based nucleotide-analysis tool. Runs entirely locally; no external APIs.

## Functions
FASTA multi-record parsing, IUPAC validation, reverse complement, composition, 3-mers, IUPAC motif search, six-frame translation, complete ATG-to-stop ORFs, common palindromic restriction sites and linear digest, pairwise NW global and SW local alignments (match=+2 mismatch=-1 gap=-2), Nussinov maximum-pair RNA secondary structure with dot-bracket and downloadable SVG arcs. Exports FASTA, CSV, alignment TXT, and fold dot-bracket.

## Explicit limitations
* Not ViennaRNA RNAfold: **no minimum free energy (MFE)**, nearest-neighbor free energy, partition function, pair probabilities, constrained folding, cotranscriptional folding, pseudoknots, or chemical modification modeling.
* Not DNASTAR Lasergene: no chromatogram assembly/NGS, plasmid annotation, primer/oligo thermodynamics, automated multiple alignment, structure prediction.
* RNA fold limited to **350 unambiguous nucleotides** per region (O(n³) DP), no clinical or design-validation use.
* Alignment up to 700 nt each; restriction analysis assumes linear, unmethylated sequence, standard cut offsets; ORFs use standard nuclear genetic code and only complete ATG-to-stop sites.
* Educational research outputs require independent verification for experimental or regulatory decisions.

## Tests
Run `node --test tests/core.test.cjs` with Node.js 20+; 16 unit tests are supplied. The test runner imports `core.js` directly.

## Privacy
All computation executes in the user's browser; sequence contents are not sent to NEXUS servers by this page. Local browser/host/network security and applicable institutional controls remain the user's responsibility.

## Intellectual property
Original implementation developed for NEXUS. MIT license for SeqFold tool; independent of DNASTAR and University of Vienna/ViennaRNA. ViennaRNA documentation: https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/man/RNAfold.html
