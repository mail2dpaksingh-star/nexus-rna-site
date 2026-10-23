from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
soup=BeautifulSoup((root/'tools/construct-studio/evidence.html').read_text(),'html.parser')
for element in soup.select('script[src],link[rel=stylesheet]'):element.decompose()
style=soup.new_tag('style');style.string=(root/'tools/lab-common.css').read_text();soup.head.append(style)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[]
 for width,out in [(1280,'/mnt/data/NEXUS_v1.8.21_Evidence_Desktop.png'),(390,'/mnt/data/NEXUS_v1.8.21_Evidence_Mobile.png')]:
  page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1,accept_downloads=True)
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(str(soup))
  page.evaluate("""()=>{const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}})}""")
  for f in ['tools/project-link.js','tools/construct-studio/evidence-core.js','tools/construct-studio/evidence-ui.js']:
   page.add_script_tag(content=(root/f).read_text())
  page.locator('#add-construct').click()
  assert page.locator('#count-constructs').inner_text()=='1'
  page.locator('#add-sample').click()
  assert page.locator('#count-samples').inner_text()=='1'
  page.locator('#m-value').fill('125')
  page.locator('#m-unit').fill('RFU')
  page.locator('#m-source').fill('Synthetic plate-reader data for UI smoke test')
  page.locator('#add-measurement').click()
  assert page.locator('#count-results').inner_text()=='1'
  assert '125' in page.locator('#summary-rows').inner_text()
  page.locator('#save').click()
  assert 'Saved evidence' in page.locator('#notice').inner_text()
  if width==1280:
   with page.expect_download() as d:page.locator('#export-json').click()
   assert d.value.suggested_filename.endswith('Construct_Evidence.json')
   with page.expect_download() as d:page.locator('#csv-template').click()
   assert d.value.suggested_filename.endswith('.csv')
   page.locator('#i-source').fill('Synthetic blot record')
   page.locator('#add-identity').click()
   assert 'Recorded antigen' in page.locator('#notice').inner_text()
  else:
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),str(page.evaluate('document.documentElement.scrollWidth'))
  page.screenshot(path=out,full_page=True)
  page.close()
 assert not errors, errors
 browser.close()
print('PASS isolated browser: desktop and mobile rendering, construct registration, sample mapping, measurement, save, dossier/template exports, identity note')
