"""Builds src/data/symbols.json from JerBouma/FinanceDatabase (MIT). Trimmed: US large and mega cap equities and US-listed ETFs, no descriptions, no prices."""
import csv, json, sys
D = "/tmp"
out = {}
def rows(p):
    with open(p, newline="", encoding="utf-8") as f: yield from csv.DictReader(f)
for f in ("fd_NMS_equities.csv", "fd_NYQ_equities.csv"):
    for r in rows(f"{D}/{f}"):
        if r["market_cap"] in ("Mega Cap", "Large Cap") and r["delisted"] != "True" and r["country"] == "United States" and "-" not in r["symbol"] and "." not in r["symbol"]:
            out[r["symbol"]] = ["E", r["name"], r["sector"], r["industry"], r["market_cap"]]
for f in ("fd_PCX_etfs.csv", "fd_NGM_etfs.csv"):
    for r in rows(f"{D}/{f}"):
        if "-" not in r["symbol"] and "." not in r["symbol"]:
            out.setdefault(r["symbol"], ["F", r["name"], r["category_group"], r["category"], r["family"]])
json.dump(out, open("src/data/symbols.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), sum(1 for v in out.values() if v[0] == "E"))
