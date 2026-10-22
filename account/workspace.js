(function(){'use strict';const $=s=>document.querySelector(s);
let signedIn=false;
const msg=(s,err=false)=>{const el=$('#status');el.textContent=s;el.classList.toggle('error',err);};
function element(tag,text,attrs){const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);for(const [k,v] of Object.entries(attrs||{})){if(k==='class')el.className=v;else el.setAttribute(k,v);}return el;}
async function refresh(){
  if(!signedIn)return;msg('Loading your private projects…');
  try{const items=await NexusAccounts.listProjects(),parent=$('#projects');parent.replaceChildren();
  if(!items.length){parent.append(element('div','No cloud projects yet. Start in the guest Project Hub, then use “Save active project to cloud.”',{class:'empty'}));}
  for(const p of items){
    const box=element('article',undefined,{class:'project'}),left=element('div');left.append(element('strong',p.name||p.project_id),element('small','Project ID: '+p.project_id),element('small','Last saved: '+(p.updated_at?new Date(p.updated_at).toLocaleString():'—')));
    const buttons=element('div',undefined,{class:'actions'}),restore=element('button','Restore to browser',{class:'btn alt',type:'button'}),download=element('button','Download JSON',{class:'btn alt',type:'button'}),remove=element('button','Delete cloud copy',{class:'btn danger',type:'button'});
    restore.addEventListener('click',async()=>{try{const project=await NexusAccounts.loadProject(p.project_id);let exists=false;try{exists=localStorage.getItem('nexus:project:v1:'+project.id)!==null;}catch{}if(exists&&!confirm('A browser-local project with this ID already exists. Replace that local copy?'))return;
      NexusBridge.putProject(project);NexusBridge.setActive(project.id);msg('Restored '+project.id+' to this browser. Open the local Project Hub to continue.');}catch(e){msg(e.message,true);}});
    download.addEventListener('click',async()=>{try{const project=await NexusAccounts.loadProject(p.project_id);NexusBridge.download(project);msg('Downloaded a local copy of '+project.id);}catch(e){msg(e.message,true);}});
    remove.addEventListener('click',async()=>{if(!confirm('Permanently delete the CLOUD copy of '+p.project_id+'? The browser-local copy is not affected.'))return;try{await NexusAccounts.deleteProject(p.project_id);msg('Cloud copy deleted.');await refresh();}catch(e){msg(e.message,true);}});
    buttons.append(restore,download,remove);box.append(left,buttons);parent.append(box);
  }msg(items.length+' cloud project(s) loaded.');}catch(e){msg('Unable to load projects: '+e.message,true);}
}
async function saveToCloud(project,fromFile=false){const p=NexusAccounts.validateProject(project);let exists=false;try{exists=(await NexusAccounts.listProjects()).some(x=>x.project_id===p.id);}catch(e){throw Error('Could not verify existing cloud projects: '+e.message);}
if(exists&&!confirm('Cloud project '+p.id+' already exists. Replace it with this '+(fromFile?'imported':'browser-local')+' version?'))return;
const result=await NexusAccounts.saveProject(p);msg('Saved '+result.project_id+' to your private cloud workspace.');await refresh();}
async function start(){if(!NexusAccounts.configured()){$('#setup-notice').hidden=false;msg('Account service setup is required.');return;}
try{const user=await NexusAccounts.currentUser();if(!user){msg('Please sign in to access your cloud workspace.');$('#who').replaceChildren(element('a','Sign in to continue',{href:'sign-in.html'}));return;}
signedIn=true;$('#who').textContent=user.email||'Authenticated research account';$('#protected').hidden=false;$('#refresh').disabled=false;$('#sign-out').disabled=false;
$('#refresh').addEventListener('click',refresh);
$('#sign-out').addEventListener('click',async()=>{try{await NexusAccounts.signOut();window.location.assign('sign-in.html');}catch(e){msg(e.message,true);}});
$('#backup-current').addEventListener('click',async()=>{try{const p=NexusBridge.get();await saveToCloud(p);}catch(e){msg(e.message,true);}});
$('#upload-file').addEventListener('click',async()=>{try{const f=$('#file-upload').files?.[0];if(!f)throw Error('Choose a JSON file first.');if(f.size>1_000_000)throw Error('File exceeds the 1 MB cloud pilot limit.');const parsed=JSON.parse(await f.text());await saveToCloud(parsed,true);$('#file-upload').value='';}catch(e){msg('Upload not completed: '+e.message,true);}});
await refresh();}catch(e){msg('Unable to verify account: '+e.message,true);}}
start();
})();
