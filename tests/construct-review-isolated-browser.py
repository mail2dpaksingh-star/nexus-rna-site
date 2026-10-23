from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
page_text=(root/'tools/construct-studio/review.html').read_text()
soup=BeautifulSoup(page_text,'html.parser')
for script in soup.select('script[src]'): script.decompose()
for link in soup.select('link[rel=stylesheet]'):link.decompose()
style=soup.new_tag('style');style.string=(root/'tools/lab-common.css').read_text();soup.head.append(style)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 errs=[]
 for width,out in [(1280,'/mnt/data/NEXUS_v1.8.20_Construct_QA_Desktop.png'),(390,'/mnt/data/NEXUS_v1.8.20_Construct_QA_Mobile.png')]:
  page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1,accept_downloads=True)
  page.on('pageerror',lambda exc: errs.append(str(exc)))
  page.set_content(str(soup))
  page.evaluate("""() => { const data = {}; Object.defineProperty(window, 'localStorage', {configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=String(v);},removeItem:k=>{delete data[k]}}}); }""")
  # local-browser emulation; app scripts provided in same order as deployed files
  for f in ['tools/construct-studio/utr-core.js','tools/construct-studio/review-core.js','tools/project-link.js','tools/construct-studio/review-ui.js']:
   page.add_script_tag(content=(root/f).read_text())
  page.locator('#qa-example').click()
  assert page.locator('#qa-result').is_visible()
  assert page.locator('#qa-length').inner_text()=='128',page.locator('#qa-length').inner_text()
  assert page.locator('.qa-segment').count()==4
  if width==1280:
   with page.expect_download() as d:page.locator('#qa-json').click()
   assert d.value.suggested_filename.endswith('.json')
   page.locator('#qa-save').click()
   assert 'Saved to' in page.locator('#qa-save-message').inner_text()
   page.locator('#qa-modality').select_option('mirna')
   page.locator('#qa-sequence').fill('AUGCUACGUACGUACGUACGU')
   page.locator('#qa-run').click()
   assert 'SEED_ANNOTATION' in page.locator('#qa-issues').inner_text()
   assert not page.locator('#qa-cap').is_visible()
  else:
   assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),page.evaluate('document.documentElement.scrollWidth')
  page.screenshot(path=out,full_page=True)
  page.close()
 assert not errs,errs
 browser.close()
print('PASS: isolated desktop/mobile browser render, example, output, JSON download, local save, miRNA audit, responsive width; direct navigation blocked in sandbox')
