# Publish NEXUS v1.8.4 to GitHub / Cloudflare Pages

1. Keep a backup of your current NEXUS site and any browser-local project exports.
2. Unzip `NEXUS_RNA_BioSolutions_v1.8.4_Advanced_RNA_Pro_and_Circular_RNA.zip` and upload its **contents**, not the archive itself, to the root of `mail2dpaksingh-star/nexus-rna-site` (or use Direct Upload for the existing Pages project).
3. Preserve the entire `tools` folder, especially `tools/construct-studio` and `tools/project-link.js`.
4. If the project is linked to GitHub, commit on its configured production branch and inspect the Cloudflare deployment status.
5. Verify the homepage, Pro and circular pages below after publishing:
   - `/index.html`
   - `/tools/construct-studio/pro.html` (first tab: Full Construct Architect)
   - `/tools/construct-studio/circular.html` (Program 04)
   - `/tools/construct-studio/index.html` (Circular RNA selection)
   - `/tools/project-hub/index.html` (new saved module entries)
6. On Pro, choose **Load synthetic example**, build and export a FASTA. Switch IVT to mammalian DNA, and check that poly(A) and capping inputs respond accordingly.
7. On Circular RNA, run synthetic example and export JSON; verify project save and Project Hub visibility under the same project ID.
8. Test browsers and mobile layouts using nonconfidential synthetic sequences only. Do **not** upload confidential sequences to unqualified third-party sites.

*Current state:* No secure user accounts, billing, server-backed cloud projects, qualified assay release or validated clinical use. Both Pro and Circular RNA remain accessible research pilots pending commercial qualification.
