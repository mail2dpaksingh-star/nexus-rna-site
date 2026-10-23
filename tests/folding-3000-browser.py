from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
seq=('GCGCUUUAGCGCAUGGCUAACGUAAGCGCCUA'*100)[:3000]

def bundle(page, htmlfile):
    html=htmlfile.read_text()
    def script(m):
        src=m.group(1)
        target=(htmlfile.parent/src).resolve()
        if not target.is_relative_to(root.resolve()):
            return ''
        return '<script>'+target.read_text()+'</script>'
    html=re.sub(r'<script\s+src="([^\"]+)"\s*></script>',script,html)
    page.set_content(html,wait_until='domcontentloaded',timeout=25000)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    # Precision standalone, explicit >220 length
    page=browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    bundle(page,root/'tools/seqfold/precision.html')
    page.locator('[data-tab="fold"]').click()
    page.locator('#rn-seq').fill(seq)
    page.locator('#rn-run').click()
    assert '3,000' in page.locator('#rn-status').inner_text() or '3,000' in page.locator('.head span').all_inner_texts().__str__()
    lines=page.locator('#rn-dot').inner_text().splitlines()
    assert lines[0]==seq and len(lines[1])==3000
    assert 'WINDOWED' in page.locator('#rn-method').inner_text()
    with page.expect_download() as file:
       page.locator('#rn-export').click()
    assert file.value.suggested_filename.endswith('.txt')
    print('PASS precision browser 3000nt, export, window warning')
    if errors: raise Exception(str(errors))
    page.close()
    # Main SeqFold UI
    page=browser.new_page(viewport={'width':1200,'height':850},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
    bundle(page,root/'tools/seqfold/index.html')
    page.locator('#input-seq').fill('>sample\n'+seq)
    page.locator('#analyze').click()
    assert page.locator('#fold-end').input_value()=='3000'
    page.locator('[data-tab="fold"]').click()
    page.locator('#fold-run').click()
    assert '3,000 nt' in page.locator('#fold-info').inner_text()
    assert 'Independent 250-nt windows' in page.locator('#fold-info').inner_text()
    assert 'Window coordinates' in page.locator('#fold-text').inner_text()
    assert page.locator('#fold-chart svg').count()==1
    print('PASS SeqFold main browser 3000nt, 250nt window warnings')
    if errors: raise Exception(str(errors))
    page.close()
    browser.close()
