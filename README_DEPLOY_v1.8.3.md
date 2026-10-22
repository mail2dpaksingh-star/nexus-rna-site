# NEXUS v1.8.3 — deployment guide

1. Download the v1.8.3 ZIP, extract it, and upload the entire **folder contents** to the root of your GitHub Pages-connected repository, preserving `tools/construct-studio/` and all other subdirectories. Do not put the ZIP itself in GitHub and expect a deployment.
2. Or use Cloudflare Pages direct upload if that is how the existing project was created. If Git-connected, push to the configured branch and allow Cloudflare to build/deploy it.
3. Verify `index.html` loads and **RNA Design Pro** appears in the top ribbon.
4. Test the new path: `tools/construct-studio/pro.html`.
5. Select **Load synthetic example**, generate the RNA matrix and export CSV / FASTA.
6. Select **Promoter Engineering**, load the T7 example, add a DNA substitution, and export JSON.
7. Go to **Design Dossier**, save it, then open `tools/project-hub/index.html` to verify the Pro module shows a saved record under the same project ID.
8. Confirm the previous free SeqFold, qPCR/ddPCR, QC and DOE programs still open.

### Limitations
- Browser-local research prototype only, no automatic cloud upload.
- Account sign-in and subscriptions are NOT active.
- Database and promoter predictions are hypotheses and should not be used as validated experimental performance predictions.
- Browser data can be lost when storage is cleared. Export JSON backups.
- There is no separate compute backend in this release.
