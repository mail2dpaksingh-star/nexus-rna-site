const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const authJs=fs.readFileSync(path.join(__dirname,'../account/auth-client.js'),'utf8');
const projectJs=fs.readFileSync(path.join(__dirname,'../tools/project-link.js'),'utf8');
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
let user={id:'user-a',email:'a@lab.org'},dbrows=new Map(),sent=null;
function fakeClient(){return {auth:{
 getUser:async()=>({data:{user},error:null}),signInWithOtp:async d=>{sent=d;return {data:{user:null},error:null}},signOut:async()=>({data:{},error:null})
},from:()=>({
 select(){return this},eq(key,val){this.filters??={};this.filters[key]=val;return this},order(){return this},limit(){return this},single(){let row=dbrows.get(`${this.filters.user_id}:${this.filters.project_id}`);return Promise.resolve(row?{data:{document:row.document},error:null}:{data:null,error:{message:'Not found'}})},
 then(resolve){const result=Array.from(dbrows.values()).filter(x=>x.user_id===this.filters.user_id).map(x=>({project_id:x.project_id,name:x.name,updated_at:x.updated_at}));return Promise.resolve({data:result,error:null}).then(resolve)},
 upsert(record){assert.equal(record.user_id,user.id);dbrows.set(`${record.user_id}:${record.project_id}`,record);return {select(){return {single:async()=>({data:record,error:null})}}}},
 delete(){const query={eq(key,value){if(key==='user_id')this.deletingUser=value;else if(key==='project_id')dbrows.delete(`${this.deletingUser}:${value}`);return this;},then(cb){return Promise.resolve({error:null}).then(cb)}};return query}
})};}
const root={NEXUS_PUBLIC_CONFIG:{SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},location:{href:'https://nexus-rna-site.pages.dev/account/sign-in.html'},TextEncoder,localStorage,Date,JSON,Error,URL,Promise,supabase:{createClient:fakeClient}};root.globalThis=root;
const context=vm.createContext(root);vm.runInContext(projectJs,context);vm.runInContext(authJs,context);
const A=root.NexusAccounts,Bridge=root.NexusBridge;
function make(id){return {schema:'nexus-project-v1',id,name:'Test '+id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),modules:{construct:{savedAt:new Date().toISOString(),data:{seq:'AUG'}}},qc:[],instrumentImports:[]};}
(async()=>{
assert.equal(A.configured(),true);
let reg=make('LAB-001');assert.equal(A.validateProject(reg).id,'LAB-001');
for(let invalid of ['', 'a', 'wrong id!'])assert.throws(()=>A.cleanProjectId(invalid));
assert.throws(()=>A.validateProject({...reg,schema:'bad'}));
assert.throws(()=>A.validateProject({...reg,modules:{construct:{data:{seq:'A'.repeat(1500000)}}}}));
const saved=await A.saveProject(reg);assert.equal(saved.project_id,'LAB-001');assert.equal((await A.listProjects()).length,1);
let loaded=await A.loadProject('LAB-001');assert.equal(loaded.modules.construct.data.seq,'AUG');
await A.sendEmailLink('a@lab.org',true);assert.equal(sent.options.shouldCreateUser,true);assert.equal(sent.options.emailRedirectTo,'https://nexus-rna-site.pages.dev/account/workspace.html');
await A.sendEmailLink('a@lab.org',false);assert.equal(sent.options.shouldCreateUser,false);
user={id:'user-b',email:'b@lab.org'};assert.equal((await A.listProjects()).length,0);await assert.rejects(A.loadProject('LAB-001'));
user={id:'user-a',email:'a@lab.org'};assert.equal((await A.listProjects()).length,1);await A.deleteProject('LAB-001');assert.equal((await A.listProjects()).length,0);
root.NEXUS_PUBLIC_CONFIG={SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:''};assert.equal(A.configured(),false);
console.log('PASS: 15 account and project-storage integration assertions; fake database is NOT an RLS test.');
})().catch(e=>{console.error(e);process.exit(1)});
