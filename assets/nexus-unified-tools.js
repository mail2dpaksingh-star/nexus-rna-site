/* NEXUS unified tool navigation, version 2: layout-tolerant, UI-only. */
(function(){
'use strict';
const catalog=window.NEXUS_TOOL_CATALOG;
if(!catalog || !Array.isArray(catalog.groups) || !catalog.groups.length)return;
const groups=catalog.groups.filter(g=>Array.isArray(g.items)&&g.items.length);
if(!groups.length)return;
const items=groups.flatMap(g=>g.items);
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const href=path=>new URL(path.replace(/^\//,''),location.origin+'/').href;
function launcher(mode){
 const nav=mode==='nav';
 const el=make('div','nexus-unified-launcher nexus-unified-picker-'+mode);
 const label=make('label','nexus-unified-label',nav?'Research Tools':'Research Tools');
 const sel=make('select','nexus-unified-select');
 sel.setAttribute('aria-label','Choose a NEXUS research tool');
 const ph=make('option','',nav?'Research Tools ▾':'Select a research tool…');ph.value='';ph.disabled=true;ph.selected=true;sel.appendChild(ph);
 for(const g of groups){const og=document.createElement('optgroup');og.label=g.label;for(const it of g.items){const op=make('option','',it.label);op.value=it.href;og.appendChild(op);}sel.appendChild(og);}
 const id='nexus-tools-'+mode+'-'+document.querySelectorAll('.nexus-unified-launcher').length;sel.id=id;label.htmlFor=id;
 el.append(label,sel);
 if(nav){sel.addEventListener('change',()=>{if(sel.value)location.assign(href(sel.value));});}
 else{const button=make('button','nexus-unified-open','Open selected tool');button.type='button';button.disabled=true;sel.addEventListener('change',()=>{button.disabled=!sel.value;});button.addEventListener('click',()=>{if(sel.value)location.assign(href(sel.value));});el.append(button);}
 return el;
}
function oldToolLink(a){
 const text=(a.textContent||'').replace(/[↗→▾]/g,'').trim().toLowerCase();
 const h=a.getAttribute('href')||'';
 return /^(all|research)\s+tools?$/.test(text) || /^(?:\.?\/?tools\/?(?:index\.html)?)$/i.test(h) || h==='#tools' && /tools?/i.test(text);
}
function fixHeader(){
 const header=document.querySelector('header, [role="banner"]');
 if(!header)return false;
 const candidates=[...header.querySelectorAll('a[href]')].filter(oldToolLink);
 const candidate=candidates[0];
 const nav=(candidate && candidate.parentElement) || header.querySelector('#primary-links, .top-links, .nav-links, .navigation, nav') || header;
 if(candidate){candidate.replaceWith(launcher('nav'));for(const duplicate of candidates.slice(1))duplicate.remove();}
 else if(nav)nav.appendChild(launcher('nav'));
 // Avoid a separate RNA Design Pro nav item when that program exists in this menu.
 for(const a of header.querySelectorAll('a[href]')){
  if(/^rna\s+design\s+pro$/i.test((a.textContent||'').trim()) && /construct-studio\/pro\.html/i.test(a.getAttribute('href')||''))a.remove();
 }
 return true;
}
function fixFooter(){
 for(const footer of document.querySelectorAll('footer')){
  const matching=[...footer.querySelectorAll('a[href]')].filter(oldToolLink);
  if(!matching.length)continue;
  matching[0].textContent='Research Tools';matching[0].href='/tools/index.html';
  for(const redundant of matching.slice(1))redundant.remove();
 }
}
function chooseToolSection(){
 let section=document.querySelector('#tools');
 if(section)return section;
 // Locate a recognizable tools-only section, but never hide unrelated scientific or services content.
 for(const candidate of document.querySelectorAll('main section,main [role="region"]')){
  const title=candidate.querySelector('h1,h2,h3');
  if(title && /^(all\s+)?(?:nexus\s+)?research\s+tools?$|^all\s+tools?$/i.test(title.textContent.trim()))return candidate;
 }
 return null;
}
function placeHomeSelector(){
 const section=chooseToolSection();
 const home=make('section','nexus-unified-home');home.id='nexus-research-tools';
 home.setAttribute('aria-label','NEXUS Research Tools');
 home.append(make('h2','nexus-unified-heading','Research Tools'),make('p','nexus-unified-help','Choose a research program from one organized dropdown.'));
 home.append(launcher('home'));
 if(section){
  const target=section.querySelector('.tool-controls,#tool-grid,.tool-grid,.grid,.tools-header')||section.firstElementChild;
  if(target && target.parentNode){target.parentNode.insertBefore(home,target);}else section.prepend(home);
  section.classList.add('nexus-unified-original-tools');
  // Suppress old duplicate cards only in this section, and only after our selector exists.
  for(const el of section.querySelectorAll('.tool-controls,.results-bar,#tool-grid,.tool-grid,.tools-header>a.button')){
   if(!home.contains(el))el.classList.add('nexus-unified-obsolete');
  }
 }else{
  const main=document.querySelector('main,[role="main"]');
  if(main){main.prepend(home);}else{document.body.insertBefore(home,document.body.firstChild);}
 }
 // Make older in-page Tools CTAs reach the new selector even if #tools was renamed.
 for(const a of document.querySelectorAll('a[href="#tools"]')){
  if(!home.contains(a))a.setAttribute('href','#nexus-research-tools');
 }
 // A separate starting-pathways card grid would compete with this one menu.
 const pathways=document.querySelector('#pathways');
 if(pathways && pathways.querySelectorAll('a[href="#tools"],a[data-jump-filter]').length>=2){
  pathways.classList.add('nexus-unified-obsolete');
 }
 document.documentElement.classList.add('nexus-unified-home-ready');
}
function directory(){
 const header=document.querySelector('body>header,header')||document.querySelector('main')||document.body;
 const h=header.querySelector('h1');if(h)h.textContent='NEXUS Research Tools';
 const container=make('div','nexus-unified-directory');container.id='nexus-research-tools';
 container.append(launcher('directory'),make('p','nexus-unified-help',items.length+' available tool links organized by research area.'));
 header.append(container);
 // Old search might be referenced by an inline script; hide, do not remove.
 document.documentElement.classList.add('nexus-unified-directory-ready');
}
function start(){
 if(document.querySelector('.nexus-unified-launcher'))return;
 if(/^\/tools\/(?:index\.html)?$/i.test(location.pathname)){directory();return;}
 fixHeader();placeHomeSelector();fixFooter();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
