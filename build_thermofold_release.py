from pathlib import Path
from bs4 import BeautifulSoup
import re
root=Path('/mnt/data/nexus_thermofold_v01')
home=root/'index.html'
s=home.read_text()
needle='<article class="tool-card" data-category="design" data-keywords="rna folding pairing structure precision">'
card='''<article class="tool-card" data-category="design" data-keywords="thermofold nearest neighbor 37C kcal mol thermodynamics MFE minimum free energy RNA secondary structure"><div class="tool-meta"><span class="tool-tag">Thermodynamics research</span><span class="tool-status">v0.1 · Limited model</span></div><h3>ThermoFold — ΔG Model</h3><p>Compute a model-based RNA ΔG₃₇ and dot-bracket pairing under a restricted nearest-neighbor energy model. Not ViennaRNA-equivalent.</p><a href="tools/seqfold/thermofold.html">Launch ThermoFold Prototype ↗</a></article>\n'''
assert needle in s
s=s.replace(needle,card+needle,1)
home.write_text(s)
for name in ['tools/seqfold/precision.html','tools/seqfold/index.html']:
 p=root/name; text=p.read_text();
 # Only append one visible pointer to thermodynamic prototype in a fitting UI location.
 ref='''<div style="margin:14px auto;padding:13px 16px;border-radius:12px;border:1px solid #b8d9cc;background:#eaf7f1;color:#17434b;font:13px/1.55 system-ui,sans-serif;max-width:1150px"><strong>New: ThermoFold v0.1.</strong> Separate, restricted nearest-neighbor ΔG₃₇ folding prototype. Unlike this approximate pairing view, it computes an energy-model minimum, but does not yet implement the complete Turner model. <a style="color:#007768;text-decoration:underline;font-weight:700" href="thermofold.html">Open ThermoFold →</a></div>'''
 assert '</header>' in text
 text=text.replace('</header>','</header>'+ref,1)
 p.write_text(text)
# Add to keyword search index if literal entries present. No breaking modifications to site-search.js required.
search=root/'assets/site-search.js'
src=search.read_text()
if 'thermofold.html' not in src:
  # Insert only when there is a clear search entry marker / fixed object array, else existing live tool-card search catches card.
  pass
print('Homepage & SeqFold links updated')
