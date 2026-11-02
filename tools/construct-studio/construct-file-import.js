/* NEXUS shared, browser-local construct sequence importer. No network calls.
   Sequence-only formats contain no verified feature coordinates. */
(function(root){
  'use strict';
  const EXT=/\.(json|fa|fasta|fna|ffn|faa|gb|gbk|genbank|txt|seq|csv|tsv)$/i;
  function cleanSequence(s,label='Sequence'){
    if(typeof s!=='string')throw Error(label+' is missing.');
    const out=s.replace(/\s+/g,'').toUpperCase();
    if(!out||!/^[ACGTU]+$/.test(out))throw Error(label+' must contain only A/C/G/T/U; ambiguous, protein, and gap characters are not accepted in nucleotide mode.');
    if(out.includes('T')&&out.includes('U'))throw Error(label+' mixes RNA U and DNA T; choose a consistent sequence alphabet.');
    return out;
  }
  function nucleic(s,type){const seq=cleanSequence(s);return type==='dna'?seq.replace(/U/g,'T'):seq.replace(/T/g,'U');}
  function readFasta(t){const records=t.trim().split(/(?=^>)/m).filter(s=>s.trim());if(records.length!==1||!records[0].startsWith('>'))throw Error('Upload one FASTA sequence per file, not a multi-record FASTA.');const lines=records[0].split(/\r?\n/);const name=lines.shift().slice(1).trim();if(!name)throw Error('FASTA header is empty.');const seq=lines.filter(x=>x.trim()&&!/^\s*[;#]/.test(x)).join('');return {sequence:cleanSequence(seq),name:name.slice(0,100)};}
  function readGB(t){if(!/^LOCUS\s/m.test(t)||!/^ORIGIN\s*$/m.test(t))throw Error('GenBank file must contain LOCUS and ORIGIN sections.');const origin=t.split(/^ORIGIN\s*$/m)[1];if(!origin)throw Error('GenBank ORIGIN block is missing.');const seq=origin.split(/^\/\/\s*$/m)[0].replace(/[0-9\s]/g,'');const line=t.match(/^LOCUS\s+(\S+)/m);return {sequence:cleanSequence(seq),name:line?line[1]:'GenBank insert'};}
  function tableRows(t,separator){
    const rows=[];let row=[],cell='',quotes=false;
    for(let i=0;i<t.length;i++){const ch=t[i];if(ch==='"'){if(quotes&&t[i+1]==='"'){cell+='"';i++;}else quotes=!quotes;}
      else if(ch===separator&&!quotes){row.push(cell);cell='';}
      else if((ch==='\n'||ch==='\r')&&!quotes){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(v=>v.trim()))rows.push(row);row=[];}
      else cell+=ch;
    }
    if(quotes)throw Error('Unclosed quote in tabular file.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
    if(rows.length<2)throw Error('CSV/TSV requires a header and exactly one construct data row.');
    if(rows.length!==2)throw Error('Upload one construct data row at a time; multi-row files are not silently combined.');
    if(rows[0].length!==rows[1].length)throw Error('CSV/TSV header and data field counts do not match.');
    const headers=rows[0].map(x=>x.toLowerCase().replace(/[\s_\-\u2032\u2019']/g,'').replace(/^5/, 'five').replace(/^3/, 'three'));
    const map={};headers.forEach((h,i)=>map[h]=rows[1][i].trim());
    const grab=(...names)=>{for(const n of names){if(map[n])return map[n];}return '';};
    const utr5=grab('utr5','fiveutr','5utr','fiveprimeutr');
    const cds=grab('cds','coding','codingsequence','orf');
    const utr3=grab('utr3','threeutr','3utr','threeprimeutr');
    const seq=grab('sequence','seq','insert','insertsequence','rna','dna');
    const parts={};if(utr5)parts.utr5=cleanSequence(utr5,'5 prime UTR');if(cds)parts.cds=cleanSequence(cds,'CDS');if(utr3)parts.utr3=cleanSequence(utr3,'3 prime UTR');
    if(!seq&&!Object.keys(parts).length)throw Error('CSV/TSV needs a sequence column or labeled utr5, cds, utr3 columns.');
    const composed=[parts.utr5,parts.cds,parts.utr3].filter(Boolean).join('');
    if(seq&&composed&&nucleic(seq,'dna')!==nucleic(composed,'dna'))throw Error('Sequence column does not match the ordered UTR/CDS component columns.');
    return {sequence:cleanSequence(seq||composed),components:parts,name:grab('name','id','constructid','sampleid').slice(0,100)};
  }
  function fromJSON(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Construct JSON must be an object.');
    const comps=data.componentSequences||data.components||{};
    const parts={};for(const [key,aliases] of Object.entries({utr5:['utr5','fivePrimeUTR'],cds:['cds','coding'],utr3:['utr3','threePrimeUTR']})){
      const value=aliases.map(k=>comps[k]).find(v=>typeof v==='string'&&v.trim());if(value)parts[key]=cleanSequence(value,key);
    }
    const possible=data.sequence||data.transcript||data.coreSequence||([parts.utr5,parts.cds,parts.utr3].filter(Boolean).join(''));
    return {record:data,sequence:typeof possible==='string'&&possible?cleanSequence(possible):null,components:parts,name:String(data.name||data.source||'NEXUS construct').slice(0,100)};
  }
  async function parseProtein(file,{maxBytes=150000}={}){
    if(file.size>maxBytes)throw Error('Protein file is too large.');
    const text=(await file.text()).replace(/^\uFEFF/,'').trim();
    let seq=text;if(text.startsWith('>')){const blocks=text.split(/(?=^>)/m).filter(Boolean);if(blocks.length!==1)throw Error('Choose one protein FASTA record.');seq=blocks[0].split(/\r?\n/).slice(1).join('');}
    seq=seq.replace(/\s/g,'').toUpperCase();
    if(!seq||!/^[ACDEFGHIKLMNPQRSTVWY*]+$/.test(seq))throw Error('Protein file contains invalid amino-acid symbols.');
    return seq;
  }
  async function parse(file,{maxBytes=2000000}={}){
    if(!file||!file.name)throw Error('Select a construct file.');
    if(file.size>maxBytes)throw Error('File exceeds '+Math.round(maxBytes/1000)+' KB import limit.');
    const ext=(file.name.match(EXT)||[])[1]?.toLowerCase();if(!ext)throw Error('Unsupported format. Choose JSON, FASTA, GenBank, TXT, CSV or TSV.');
    const t=(await file.text()).replace(/^\uFEFF/,'').trim();if(!t)throw Error('The selected file is empty.');
    let result,format;
    if(ext==='json'){format='json';result=fromJSON(JSON.parse(t));}
    else if(['csv','tsv'].includes(ext)){format=ext;result=tableRows(t,ext==='tsv'?'\t':',');}
    else if(/^LOCUS\s/m.test(t)||['gb','gbk','genbank'].includes(ext)){format='genbank';result=readGB(t);}
    else if(t.startsWith('>')||['fa','fasta','fna','ffn','faa'].includes(ext)){format='fasta';result=readFasta(t);}
    else {format='txt';result={sequence:cleanSequence(t),name:file.name};}
    return {...result,format,source:file.name};
  }
  root.NexusConstructFileImport=Object.freeze({parse,parseProtein,cleanSequence,nucleic,readFasta,readGB,tableRows});
})(window);
