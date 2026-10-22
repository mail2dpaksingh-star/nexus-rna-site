from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
authjs=(root/'account/auth-client.js').read_text()
projectjs=(root/'tools/project-link.js').read_text()
loginjs=(root/'account/sign-in.js').read_text()
spacejs=(root/'account/workspace.js').read_text()
css=(root/'account/account.css').read_text()
login=(root/'account/sign-in.html').read_text()
space=(root/'account/workspace.html').read_text()
# Browser sandbox denies HTTP navigation. Render DOM and run scripts inline with a mocked auth provider.
mock=r'''window.__testUser={id:'mock-user',email:'scientist@research.org'};
window.__cloudRows=[];window.__sent=null;
window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:window.__testUser},error:null}),signInWithOtp:async d=>{window.__sent=d;return {data:{},error:null}},signOut:async()=>({data:{},error:null})},from:()=>{
const query={filters:{},select(){return this},eq(k,v){this.filters[k]=v;return this},order(){return this},limit(){return this},then(f){return Promise.resolve({data:window.__cloudRows.filter(x=>x.user_id===window.__testUser.id).map(({document,...rest})=>rest),error:null}).then(f)},single(){const r=window.__cloudRows.find(x=>x.user_id===this.filters.user_id&&x.project_id===this.filters.project_id);return Promise.resolve(r?{data:{document:r.document},error:null}:{data:null,error:{message:'Not found'}})},upsert(row){window.__cloudRows=[...window.__cloudRows.filter(x=>x.project_id!==row.project_id),row];return {select(){return {single:async()=>({data:row,error:null})}}}},delete(){return {filters:{},eq(k,v){this.filters[k]=v;if(this.filters.user_id&&this.filters.project_id)window.__cloudRows=window.__cloudRows.filter(x=>x.project_id!==this.filters.project_id);return this},then(f){return Promise.resolve({error:null}).then(f)}}}};return query;
}})};'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1180,'height':800})
 # Replace external stylesheet/scripts with direct evaluation to verify intrinsic page behavior.
 def render(page,source):
  import re
  stripped=re.sub(r'<script\b[^>]*src="[^"]+"[^>]*></script>','',source)
  stripped=stripped.replace('<link rel="stylesheet" href="account.css">',f'<style>{css}</style>')
  page.set_content(stripped)
 page.add_init_script('''window.__data={}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__data[k]||null,setItem:(k,v)=>window.__data[k]=String(v),removeItem:k=>delete window.__data[k]}});''')
 render(page,login)
 page.evaluate('window.NEXUS_PUBLIC_CONFIG={SUPABASE_URL:"",SUPABASE_PUBLISHABLE_KEY:""}')
 page.add_script_tag(content=authjs)
 page.add_script_tag(content=loginjs)
 assert page.locator('#setup-warning').is_visible()
 assert page.locator('#email-form').is_hidden()
 page.screenshot(path='/mnt/data/NEXUS_v1.8.5_SignIn_Setup_Desktop.png',full_page=True)
 # Sign-in with mocked provider via separate browser page.
 loginpage=browser.new_page(viewport={'width':390,'height':844})
 render(loginpage,login)
 loginpage.evaluate('window.NEXUS_PUBLIC_CONFIG={SUPABASE_URL:"https://sample.supabase.co",SUPABASE_PUBLISHABLE_KEY:"sb_publishable_mock"}')
 loginpage.add_script_tag(content=mock)
 loginpage.add_script_tag(content=authjs.replace("new URL('workspace.html',root.location.href)","new URL('workspace.html','https://nexus-rna-site.pages.dev/account/sign-in.html')"))
 loginpage.add_script_tag(content=loginjs)
 assert loginpage.locator('#email-form').is_visible()
 loginpage.locator('input[value="register"]').check()
 loginpage.locator('#email').fill('scientist@research.org')
 loginpage.locator('#send').click()
 loginpage.wait_for_timeout(150)
 assert 'Check your inbox' in loginpage.locator('#status').inner_text()
 assert loginpage.evaluate('window.__sent.options.shouldCreateUser') is True
 assert loginpage.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
 loginpage.screenshot(path='/mnt/data/NEXUS_v1.8.5_SignIn_Mobile.png',full_page=True)
 # Offline workspace with fake Supabase and project store.
 work=browser.new_page(viewport={'width':1280,'height':900})
 render(work,space)
 work.evaluate('window.NEXUS_PUBLIC_CONFIG={SUPABASE_URL:"https://sample.supabase.co",SUPABASE_PUBLISHABLE_KEY:"sb_publishable_mock"}')
 work.add_script_tag(content=mock)
 work.evaluate("window.__data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__data[k]||null,setItem:(k,v)=>window.__data[k]=String(v),removeItem:k=>delete window.__data[k]}});")
 work.add_script_tag(content=projectjs)
 work.add_script_tag(content=authjs)
 work.add_script_tag(content=spacejs)
 work.wait_for_timeout(150)
 assert work.locator('#protected').is_visible()
 work.locator('#backup-current').click()
 work.wait_for_timeout(150)
 assert work.locator('.project').count()==1
 work.locator('.project .btn').first.click()
 work.wait_for_timeout(150)
 assert 'Restored' in work.locator('#status').inner_text()
 work.screenshot(path='/mnt/data/NEXUS_v1.8.5_Workspace_Desktop.png',full_page=True)
 browser.close()
 print('PASS: isolated browser checks for disabled account mode, email-link form, mobile width, cloud save and restore with mock provider.')
