#!/usr/bin/env python3
"""Refresh a public NK/mRNA research landscape snapshot. Standard library only.
Covers a few seeded topics, not an exhaustive, novelty or FTO review.
Never accepts or transmits user-contributed study ideas or sequences.
"""
import argparse
import datetime as dt
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

TOPICS = (
    "CAR NK mRNA",
    "NK cells mRNA lipid nanoparticles",
    "EphA2 CAR NK mRNA",
    "CLL-1 CAR NK mRNA",
)
PUBMED = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
CTG = "https://clinicaltrials.gov/api/v2/studies"
MAX_RECORDS = 8


def short(x, length=350):
    return re.sub(r"\s+", " ", str(x or "")).strip()[:length]


def fetch(base, params):
    url = base + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "NEXUS-RNA-BioSolutions/1.0 (scientific public bibliographic index)"})
    with urllib.request.urlopen(req, timeout=18) as rsp:
        if rsp.status != 200:
            raise ValueError(f"HTTP {rsp.status}")
        data = rsp.read(350001)
    if len(data) > 350000:
        raise ValueError("Public source response exceeds limit")
    return json.loads(data.decode("utf-8"))


def pubmed(term):
    es = fetch(PUBMED + "esearch.fcgi", {"db": "pubmed", "term": term, "retmode": "json", "retmax": MAX_RECORDS, "sort": "pub date"})
    ids = [str(i) for i in es.get("esearchresult", {}).get("idlist", []) if re.fullmatch(r"\d{1,10}", str(i))][:MAX_RECORDS]
    if not ids:
        return []
    time.sleep(0.5)  # NCBI E-utilities has unauthenticated rate limits.
    r = fetch(PUBMED + "esummary.fcgi", {"db": "pubmed", "id": ",".join(ids), "retmode": "json"}).get("result", {})
    records = []
    for i in ids:
        x = r.get(i) or {}
        if not x.get("title"):
            continue
        records.append({
            "id": "PMID:" + i,
            "type": "publication",
            "title": short(x.get("title")),
            "authors": [short(y.get("name"), 100) for y in x.get("authors", [])[:5]],
            "organization": "",
            "date": short(x.get("pubdate"), 60),
            "journal": short(x.get("fulljournalname") or x.get("source"), 130),
            "url": "https://pubmed.ncbi.nlm.nih.gov/" + i + "/",
            "source": "PubMed",
        })
    return records


def trials(term):
    r = fetch(CTG, {"query.term": term, "format": "json", "pageSize": MAX_RECORDS})
    records = []
    for x in r.get("studies", [])[:MAX_RECORDS]:
        p = x.get("protocolSection") or {}
        key = (p.get("identificationModule") or {}).get("nctId", "")
        if not re.fullmatch(r"NCT\d{8}", str(key)):
            continue
        ident = p.get("identificationModule") or {}
        status = p.get("statusModule") or {}
        lead = (p.get("sponsorCollaboratorsModule") or {}).get("leadSponsor") or {}
        records.append({
            "id": key, "type": "trial", "title": short(ident.get("briefTitle")),
            "organization": short(lead.get("name"), 150), "status": short(status.get("overallStatus"), 65),
            "date": short((status.get("studyFirstPostDateStruct") or {}).get("date") or (status.get("lastUpdatePostDateStruct") or {}).get("date"), 30),
            "conditions": [short(v, 80) for v in (p.get("conditionsModule") or {}).get("conditions", [])[:6]],
            "interventions": [short(v.get("name"), 80) for v in (p.get("armsInterventionsModule") or {}).get("interventions", [])[:6]],
            "url": "https://clinicaltrials.gov/study/" + key, "source": "ClinicalTrials.gov",
        })
    return [x for x in records if x["title"]]


def collect():
    by_id = {}
    failures = []
    successes = set()
    for term in TOPICS:
        for label, source in (("PubMed", pubmed), ("ClinicalTrials.gov", trials)):
            try:
                items = source(term)
                successes.add(label)
                for x in items:
                    if x["id"] not in by_id:
                        by_id[x["id"]] = dict(x, topics=[term])
                    elif term not in by_id[x["id"]]["topics"]:
                        by_id[x["id"]]["topics"].append(term)
            except (ValueError, TimeoutError, urllib.error.URLError, OSError) as exc:
                failures.append({"source": label, "topic": term, "reason": short(exc, 120)})
        time.sleep(0.6)
    if "PubMed" not in successes or len(by_id) < 2:
        raise RuntimeError("Insufficient verified public research records; prior snapshot preserved")
    return {
        "schema": "nexus-research-landscape-snapshot-v1",
        "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "topics": list(TOPICS),
        "records": list(by_id.values())[:100],
        "sourcesAvailable": sorted(successes),
        "sourceErrors": [f"{e['source']} query unavailable: {e['topic']}" for e in failures],
        "scope": "Seeded NK/mRNA keywords; public NCBI and ClinicalTrials.gov records. No private research input, exhaustive novelty review, exact-study duplication or FTO conclusions.",
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--output", default="assets/nexus-research-landscape.json")
    args = p.parse_args()
    report = collect()
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_name(out.name + ".tmp")
    tmp.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(out)
    print(f"Verified {len(report['records'])} public records; {len(report['sourceErrors'])} source query warnings.")


if __name__ == "__main__":
    main()
