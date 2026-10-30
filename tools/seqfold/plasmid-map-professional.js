/* NEXUS Plasmid Workbench — professional restriction-site labels v1.0
 * Presentation-only layer. Does not change DNA, restriction calls, feature
 * coordinates, click handlers, cloning algorithms or GenBank exports.
 * Uses the already sequence-mapped tick marks from NexusWorkbench.mapSVG.
 */
(function (root) {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const map = root.document.getElementById('plasmid-svg');
  if (!map || root.document.getElementById('nexus-map-label-toolbar')) return;
  const widget = root.document.createElement('div');
  widget.id = 'nexus-map-label-toolbar';
  widget.className = 'nexus-map-label-toolbar';
  const label = root.document.createElement('label');
  label.setAttribute('for', 'nexus-map-label-mode');
  label.textContent = 'Restriction enzyme labels';
  const select = root.document.createElement('select');
  select.id = 'nexus-map-label-mode';
  [
    ['mcs','MCS / unique sites (clean view)'],
    ['all','All mapped sites'],
    ['none','Hide restriction labels']
  ].forEach(([value, text]) => {
    const option = root.document.createElement('option');
    option.value = value; option.textContent = text; select.appendChild(option);
  });
  select.value = 'mcs';
  const status = root.document.createElement('span');
  status.className = 'nexus-map-label-status';
  status.setAttribute('aria-live', 'polite');
  widget.append(label, select, status);
  map.parentElement.insertBefore(widget, map);

  function svgEl(name, attributes, parent, content) {
    const element = root.document.createElementNS(SVG_NS, name);
    Object.entries(attributes || {}).forEach(([k,v]) => element.setAttribute(k, String(v)));
    if (content != null) element.textContent = String(content);
    parent.appendChild(element);
    return element;
  }
  function numberAttr(el, name) { return Number(el.getAttribute(name)); }
  function coordsMCS(svg) {
    const regions = [];
    svg.querySelectorAll('polygon title, path title, circle title').forEach(el => {
      const t = el.textContent || '';
      if (!/\bMCS\b|polylinker|multiple cloning/i.test(t)) return;
      const m = t.match(/(\d+)\s*[–-]\s*(\d+)/);
      if (m) regions.push([Number(m[1]), Number(m[2])]);
    });
    return regions;
  }
  function parseHits(svg) {
    const hits = [];
    // Existing tick marks originate from matching restriction motifs against
    // the selected DNA sequence; they are not constructed from catalog names.
    svg.querySelectorAll('line').forEach(line => {
      if ((line.getAttribute('stroke') || '').toLowerCase() !== '#b83f62') return;
      const raw = line.querySelector('title')?.textContent || '';
      const m = raw.match(/^(.+?) at (\d+)$/);
      if (!m) return;
      const x = numberAttr(line,'x2'), y = numberAttr(line,'y2');
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      hits.push({name:m[1],pos:Number(m[2]),x,y});
    });
    return hits;
  }
  function allocate(hits, top, bottom) {
    const list = hits.slice().sort((a,b) => a.y - b.y || a.pos - b.pos || a.name.localeCompare(b.name));
    if (!list.length) return list;
    const gap = Math.min(21, (bottom-top) / Math.max(1,list.length-1));
    list.forEach((item,i) => {
      let y = Math.max(top+i*gap, Math.min(bottom-(list.length-1-i)*gap,item.y));
      if (i) y = Math.max(y, list[i-1].labelY + gap);
      item.labelY = y;
    });
    const overflow = Math.max(0, list[list.length-1].labelY-bottom);
    list.forEach(item => {item.labelY-=overflow;});
    return list;
  }
  function render() {
    const svg = map.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('[data-nexus-re-outer="true"]').forEach(el => el.remove());
    // Legacy labels are identified by their dedicated text color. Remove
    // these only, never the backbone-feature labels or the centre text.
    svg.querySelectorAll('text').forEach(el => {
      if ((el.getAttribute('fill')||'').toLowerCase()==='#a13a56') el.remove();
    });
    const view = (svg.getAttribute('viewBox')||'').split(/\s+/).map(Number);
    const width = view[2] || 760;
    const height = view[3] || width;
    if (height < width*0.85) {
      status.textContent='Linear view retains its original restriction-site ruler.';
      return;
    }
    const cx = width/2, cy=width/2+12;
    const hits = parseHits(svg);
    if (!hits.length) {
      status.textContent='No mapped restriction-site tick marks in this plasmid.';
      return;
    }
    const counts = new Map();
    hits.forEach(s=>counts.set(s.name,(counts.get(s.name)||0)+1));
    const mcs = coordsMCS(svg);
    const mode = select.value;
    let chosen;
    if (mode==='none') chosen=[];
    else if(mode==='all') chosen=hits;
    else {
      const atMCS = hits.filter(s=>mcs.some(([start,end]) => s.pos>=start && s.pos<=end));
      const unique = hits.filter(s=>counts.get(s.name)===1);
      const selected = new Set([...atMCS,...unique]);
      chosen=hits.filter(s=>selected.has(s));
      if (!chosen.length) chosen=hits.slice(0,12);
    }
    const layer = svgEl('g',{'data-nexus-re-outer':'true','pointer-events':'none','aria-label':'Restriction enzyme labels outside the circular map'},svg);
    const withSide = chosen.map((s,i) => {
      const theta = Math.atan2(s.y-cy,s.x-cx);
      return {...s,theta,side:Math.cos(theta)<0?'left':'right',id:i};
    });
    // Never route a callout through the plasmid centre; each label stays on
    // the same side of the circle as its restriction tick.
    const left = allocate(withSide.filter(s=>s.side==='left'),116,height-100);
    const right = allocate(withSide.filter(s=>s.side==='right'),116,height-100);
    [...left,...right].forEach(s => {
      const leftSide=s.side==='left';
      const elbowR=width*.27 + 47;
      const ex=cx + elbowR*Math.cos(s.theta), ey=cy + elbowR*Math.sin(s.theta);
      const bendX=leftSide?148:width-148;
      const labelX=leftSide?126:width-126;
      const lineEndX=leftSide?136:width-136;
      const lineY=s.labelY-3;
      svgEl('polyline', {
        points:`${s.x.toFixed(1)},${s.y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} ${bendX},${lineY.toFixed(1)} ${lineEndX},${lineY.toFixed(1)}`,
        fill:'none',stroke:'#b18590','stroke-width':'1.15','stroke-linecap':'round','stroke-linejoin':'round'
      },layer);
      const mark=svgEl('circle',{cx:s.x,cy:s.y,r:2.6,fill:'#b45168'},layer);
      svgEl('title',{},mark,`${s.name} recognition motif at nucleotide ${s.pos}`);
      svgEl('text',{
        x:labelX,y:s.labelY,'text-anchor':leftSide?'end':'start',
        'font-family':'system-ui,Arial,sans-serif','font-size':'11',
        'font-weight':'600',fill:'#8b3d52'
      },layer,`${s.name} · ${s.pos}`);
    });
    const labelTotal = chosen.length;
    status.textContent = mode==='none' ? `${hits.length} site(s) mapped; labels hidden.` :
      `${labelTotal} of ${hits.length} mapped site(s) labeled outside the circle${mode==='mcs'?' (MCS and unique sites)':''}.`;
    svg.setAttribute('data-nexus-map-professional','true');
  }
  // The existing page replaces the SVG whenever the selected plasmid,
  // orientation or annotations change. Observe only map direct children;
  // adding the callout <g> inside <svg> cannot retrigger the observer.
  const watcher = new MutationObserver(() => render());
  watcher.observe(map,{childList:true,subtree:false});
  select.addEventListener('change',render);
  render();
  root.NEXUS_PROFESSIONAL_MAP_STATUS = {version:'1.0',mode:()=>select.value,refresh:render};
})(window);
