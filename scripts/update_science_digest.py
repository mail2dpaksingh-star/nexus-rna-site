#!/usr/bin/env python3
"""Monthly source-linked NEXUS RNA science digest. Standard-library only."""
import json, re, time, html, argparse
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

TOPICS=(
 ("RNA Design",'("messenger RNA" OR mRNA OR saRNA OR "circular RNA") AND (design OR therapy OR vaccine)'),
 ("RNA-LNP Delivery",'("lipid nanoparticle" OR LNP) AND (mRNA OR siRNA OR "RNA delivery")'),
 ("RNA Structure", '("RNA secondary structure" OR "RNA folding" OR "UTR design")'),
 ("Cancer Immunotherapy",'(mRNA OR "RNA vaccine") AND (cancer OR oncology OR tumor)'),
 ("CRISPR & RNA Editing",'("RNA editing" OR CRISPR) AND (mRNA OR RNA)'),
 ("RNA Silencing",'(siRNA OR miRNA OR "antisense oligonucleotide") AND (therapy OR therapeutics)'),
 ("Peptide Discovery",'("mRNA display" OR "peptide library") AND (screening OR selection OR affinity)'),
 ("Metabolic Diseases",'(mRNA OR siRNA) AND (diabetes OR metabolic)')
)
TRIAL_TERMS=("mRNA vaccine","RNA lipid particle","siRNA therapeutic")
DAYS=120
# Title-level relevance checks reduce broad full-text search false positives.
TITLE_RULES={
    "RNA Design":r"\b(mrna|saRNA|circRNA|messenger RNA|circular RNA|UTR|poly\(A\))\b",
    "RNA-LNP Delivery":r"\b(lnp|lipid nanoparticl\w*|rna[- ]lipid|mrna[- ]lnp)\b",
    "RNA Structure":r"(fold\w*|secondary structure|rna structure|rna comp|rnacomp|hairpin|thermofold)",
    "Cancer Immunotherapy":r"(mrna|rna[- ]lipid|rna vaccine|neoantigen|saRNA)",
    "CRISPR & RNA Editing":r"(crispr|rna editing|adenosine deaminase)",
    "RNA Silencing":r"(siRNA|miRNA|microRNA|rna interference|antisense|\brnai\b)",
    "Peptide Discovery":r"(mrna display|ribosome display|puromycin[- ]link|rna[- ]peptide display)",
    "Metabolic Diseases":r"(diabetes|metabolic|insulin|obesity|cholesterol)"
}

def get_json(url):
    last=None
    for attempt in range(3):
        try:
            req=Request(url,headers={"User-Agent":"NEXUS-Science-Digest/1.0","Accept":"application/json"})
            with urlopen(req,timeout=30) as res:
                if res.status!=200: raise RuntimeError(f"HTTP {res.status}")
                content=res.read(3_500_000).decode("utf-8")
            obj=json.loads(content)
            if not isinstance(obj,dict):raise ValueError("Invalid source response")
            return obj
        except (HTTPError,URLError,TimeoutError,ValueError,RuntimeError) as e:
            last=e
            if attempt<2:time.sleep(2**attempt)
    raise RuntimeError(f"Source unavailable: {url.split('?')[0]} ({last})")

def text(value,length=240):
    return re.sub(r"\s+"," ",re.sub(r"<[^>]*>","",html.unescape(str(value or "")))).strip()[:length]

def iso(value):
    value=str(value or "").strip()[:10]
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}",value):
        try:return date.fromisoformat(value).isoformat()
        except ValueError:return None
    if re.fullmatch(r"\d{4}-\d{2}",value):return value+"-01"
    return None

def publications(topic,terms,start,today):
    """Search PubMed directly through NCBI E-utilities; no private credentials."""
    expression=f"({terms}) AND ({start.strftime('%Y/%m/%d')}[PDAT] : {today.strftime('%Y/%m/%d')}[PDAT])"
    base="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    search_url=base+"esearch.fcgi?"+urlencode({
        "db":"pubmed","term":expression,"retmode":"json",
        "retmax":18,"sort":"pub_date","tool":"NEXUS_RNA_BioSolutions"})
    search=get_json(search_url).get("esearchresult") or {}
    ids=[str(x) for x in (search.get("idlist") or []) if re.fullmatch(r"\d{6,10}",str(x))]
    if not ids:return []
    time.sleep(0.5)  # Keep NCBI usage below its unauthenticated 3 requests/sec rate limit.
    summary_url=base+"esummary.fcgi?"+urlencode({
        "db":"pubmed","id":",".join(ids),"retmode":"json","tool":"NEXUS_RNA_BioSolutions"})
    records=get_json(summary_url).get("result") or {}
    if not isinstance(records,dict):raise ValueError("Invalid PubMed summary response")
    out=[]
    for pmid in ids:
        row=records.get(pmid) or {}
        raw=str(row.get("sortpubdate") or "").split(" ")[0].replace("/","-")
        published=iso(raw)
        title=text(row.get("title"))
        if not published or not title:continue
        if not start<=date.fromisoformat(published)<=today:continue
        if not re.search(TITLE_RULES[topic],title,re.IGNORECASE):continue
        out.append({"id":"pmid:"+pmid,"type":"publication","topic":topic,
                    "title":title,"date":published,"source":"PubMed (NCBI)",
                    "url":"https://pubmed.ncbi.nlm.nih.gov/"+pmid+"/",
                    "journal":text(row.get("fulljournalname") or row.get("source"),95)})
        if len(out)>=4:break
    time.sleep(0.5)
    return out

def trials(term,start,today):
    url="https://clinicaltrials.gov/api/v2/studies?"+urlencode({"query.term":term,"pageSize":30,"format":"json","sort":"LastUpdatePostDate:desc"})
    rows=get_json(url).get("studies",[])
    if not isinstance(rows,list):raise ValueError("Invalid ClinicalTrials.gov response")
    out=[]
    for row in rows:
        meta=row.get("protocolSection") or {}
        ident=meta.get("identificationModule") or {}
        status=meta.get("statusModule") or {}
        nct=str(ident.get("nctId") or "")
        updated=iso((status.get("lastUpdatePostDateStruct") or {}).get("date"))
        title=text(ident.get("briefTitle") or ident.get("officialTitle"))
        if not re.fullmatch(r"NCT\d{8}",nct) or not updated or not title:continue
        if not start<=date.fromisoformat(updated)<=today:continue
        interventions=(meta.get("armsInterventionsModule") or {}).get("interventions") or []
        compound=title+" "+text((meta.get("descriptionModule") or {}).get("briefSummary"),1200)
        compound+=" "+" ".join(str(i.get("name") or "") for i in interventions if isinstance(i,dict))
        if not re.search(r"\b(mrna|messenger rna|rna[- ]lipid|rna[- ]lp|rna[- ]lnp|rna vaccine|sarna|sirna|antisense|rna editing|lipid nanoparticle)\b",compound,re.IGNORECASE):
            continue
        phases=(meta.get("designModule") or {}).get("phases") or []
        out.append({"id":"trial:"+nct,"type":"clinical_trial_registry","topic":"RNA Clinical Trials",
                    "title":title,"date":updated,"source":"ClinicalTrials.gov",
                    "url":"https://clinicaltrials.gov/study/"+nct,"trial_id":nct,
                    "trial_status":text(status.get("overallStatus"),80).replace("_"," ").title(),
                    "phase":text(", ".join(phases),80).replace("_"," ").title()})
        if len(out)>=7:break
    return out

def collect(today):
    start=today-timedelta(days=DAYS)
    pubs=[];cts=[];seen=set()
    for topic,expr in TOPICS:
        for entry in publications(topic,expr,start,today):
            if entry["id"] not in seen:
                pubs.append(entry);seen.add(entry["id"])
    if len(pubs)<5:raise RuntimeError("Too few verified recent publications: retaining previous feed")
    for term in TRIAL_TERMS:
        for entry in trials(term,start,today):
            if entry["id"] not in seen:
                cts.append(entry);seen.add(entry["id"])
    pubs.sort(key=lambda x:x["date"],reverse=True)
    cts.sort(key=lambda x:x["date"],reverse=True)
    return {"schema":"nexus-science-digest-v1",
            "updated_at":datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "lookback_days":DAYS,
            "sources":["PubMed (NCBI)","ClinicalTrials.gov"],
            "publications":pubs[:32],"trial_records":cts[:12],
            "method":"Search-based index of dated public records; not a systematic review or proof of clinical efficacy."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",default="assets/nexus-monthly-science.json")
    p.add_argument("--dry-run",action="store_true")
    args=p.parse_args()
    feed=collect(datetime.now(timezone.utc).date())
    print("Verified publications:",len(feed["publications"]),"clinical-trial updates:",len(feed["trial_records"]))
    if args.dry_run:return
    dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
    tmp=dest.with_suffix(dest.suffix+".tmp")
    tmp.write_text(json.dumps(feed,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    tmp.replace(dest)
    print("Published source-linked data:",dest)

if __name__=="__main__":main()
