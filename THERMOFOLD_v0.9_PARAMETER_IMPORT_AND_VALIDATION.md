# Independent NEXUS ThermoFold v0.9 — parameter implementation and validation

**Release classification:** Research prototype. The 37 °C nearest-neighbor model and imported-parameter mechanisms are NOT ViennaRNA-equivalent or scientifically qualified. This package does NOT claim to contain all experimental parameters.

## Why a numerical pack is required

The full 1×1, 1×2 (and reversed 2×1), and 2×2 RNA internal-loop values are sequence-specific. Generic initiation/asymmetry/closure formulas are *not* equivalent to published lookup tables. Turner 2004 specialized tables already incorporate AU/GU closures: **do not add closure penalties again** when an exact lookup value is used.

Authoritative public sources:
- https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_internal_loops.html
- https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_int11_dg.txt
- https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_int21_dg.txt
- https://rna.urmc.rochester.edu/NNDB/parameter_tables/turner_2004_rnastructure/turner_2004_int22_dg.txt
- https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_dangling_ends.html
- https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_terminal_mismatches.html
- https://rna.urmc.rochester.edu/Overview/Parameters.html

Obtain the original text tables directly from the source. Conversion from their table orientation into the NEXUS normalized directional keys **must be reviewed and tested against individually worked source examples** before accepting values. The published source and license/redistribution permissions should be documented. We could not retrieve all source tables as files in this development session, so this ZIP **deliberately contains no fabricated full numerical tables**.

## JSON schema

The browser accepts a JSON document with:
```json
{
  "schemaVersion": "nexus-turner-pack-v1",
  "temperatureC": 37,
  "units": "kcal/mol",
  "source": {
    "name": "verified Turner 2004 NNDB transcription",
    "url": "https://rna.urmc.rochester.edu/NNDB/",
    "version": "Turner 2004; local audit reference X"
  },
  "tables": {
    "int11": {}, "int21": {}, "int22": {},
    "dangle5": {}, "dangle3": {}, "terminalMismatch": {}, "hairpinMismatch": {}
  }
}
```
Tables intentionally shown **empty** here. This example is a *schema*, not experimental values.

### Key conventions

- Internal loop key `outerPair|innerPair|leftUnpaired|rightUnpaired`. Pair order is left nucleotide (5′→3′) followed by right nucleotide on the same single-strand coordinate frame. Left and right unpaired strings are each listed in increasing sequence-coordinate order. Verify how the original NNDB table maps onto this convention before importing.
- `int11`: `1×1`, requires 576 normalized directional keys for complete coverage (6² × 4²).
- `int21`: `1×2` **and** `2×1` directional keys, requires 4,608 normalized directional keys (2 × 6² × 4³); the source table may contain symmetric/rotation-related entries that need carefully verified transformations. Do not infer missing entries by unverified symmetry.
- `int22`: `2×2`, requires 9,216 normalized keys (6² × 4⁴).
- `dangle5`, `dangle3`: `outerPair|adjacentBase` — 24 keys each. Both refer to the **exterior topology in the engine**; compare orientation against official NNDB examples to verify it is correct.
- `terminalMismatch`, `hairpinMismatch`: `outerPair|leftAdjacentBase|rightAdjacentBase`, 96 keys each. Mismatch contributions replace, rather than add to, two individual dangles at the same helix end.
- All values are finite signed kcal/mol at 37°C. A profile may be partial for exploratory testing; **partial values do not mean the energy model is complete**.

To assemble a normalized CSV profile, use `benchmark_tools/build_parameter_pack_v09.py`. The command accepts manually verified rows; `--require-complete` requires every expected entry. A completed key inventory does **not** prove correct parameter transcription, orientation, software-energy-model parity, or license clearance.

## Energy model changes

1. Specialized internal-loop lookup values replace generic terms where present, without duplicate AU/GU closure penalties.
2. Exterior 5′ and 3′ dangling bases are explicitly consumed by dynamic-programming transitions, preventing double-use. With two adjacent unpaired bases at the same helix end, a **source-provided two-sided terminal mismatch** is considered as an exclusive alternative.
3. A separate structure scorer reconstructs exterior end contributions and verifies the selected MFE numerically.
4. **Multibranch dangling ends/coaxial stacking, full sequence-context closure exceptions, internal-parameter provenance auditing, and other specialized terms remain incomplete.** Importing a full pack does not by itself complete ViennaRNA parity.

## 125-case RNAfold benchmark

The challenge set contains exactly 125 uniquely identified sequences (maximum length 240 nt). No reference executable was available in this environment.

Install the official ViennaRNA application separately and execute from the unzipped NEXUS package root:
```bash
python benchmark_tools/generate_rnafold_references.py --cases tools/seqfold/benchmarks/challenge_cases.json --out rnafold_refs.json
node benchmark_tools/run_benchmark.cjs rnafold_refs.json NEXUS_vs_RNAfold.json
```
Current reference workflow uses `RNAfold --noPS -d0 -T 37`: this suppresses dangles to simplify one aspect of comparison; it does **not** otherwise match the still-incomplete NEXUS parameterization. Record exact RNAfold version, command options and parameter set. A second, fully parameter-matched benchmark must follow, using the same dangle convention and temperature.

## RNAstructure comparison

Install RNAstructure `Fold` separately and ensure its thermodynamic `DATAPATH` is set as required by the distribution:
```bash
python benchmark_tools/run_rnastructure_references_v09.py --cases tools/seqfold/benchmarks/challenge_cases.json --out rnastructure_refs.json
node benchmark_tools/run_benchmark.cjs rnastructure_refs.json NEXUS_vs_RNAstructure.json
```
The runner uses `Fold --mfe -t 310.15`. RNAstructure and RNAfold may employ different defaults (e.g. coaxial stacking, isolated-pair and dangling-end treatment): scientific interpretation must explicitly document these differences.

## Comparison against experimentally supported RNA structures

Use CT files from a curated source such as RNA STRAND, with original accession, source URL, and evidence type. Create entries in `benchmark_tools/experimental_ct_manifest.csv`, then run:
```bash
python benchmark_tools/compare_experimental_ct_v09.py --manifest benchmark_tools/experimental_ct_manifest.csv --engine tools/seqfold/thermofold-core.js --out experimental_structure_validation.json
```
This script calculates exact base-pair PPV, sensitivity and F1. An empty manifest is rejected. Do not treat RNAfold or RNAstructure predictions as experimentally observed structures.

## Release gates

- **Internal model consistency:** tested in v0.9.
- **Authentic full 1×1/1×2/2×2 table transcription + orientation qualification:** BLOCKED until original parameter files are retrieved and audited.
- **Complete dangle and terminal mismatch parameterization including multibranch topology:** INCOMPLETE.
- **125 genuine RNAfold comparisons:** BLOCKED (binary unavailable).
- **125 genuine RNAstructure comparisons:** BLOCKED (binary unavailable).
- **Experimental structure accuracy:** BLOCKED (no authenticated experimental CT input supplied).
- **ViennaRNA-equivalent accuracy or GMP/clinical claims:** NOT SUPPORTED.

## Privacy and licensing

Parameters are parsed locally in the user's browser, and are not uploaded by the new importer. Sequence results are local unless separately saved through NEXUS account/cloud features. Published research measurements may have licensing or attribution restrictions; retain original source provenance and avoid redistributing third-party executable code without permission.
