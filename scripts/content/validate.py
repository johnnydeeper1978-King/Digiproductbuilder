#!/usr/bin/env python3
"""Validate a 369 product content part file. Usage: validate.py file.json [--allow-ref key,...]"""
import json, re, sys

ORDER = ["overview", "learn", "see_it", "try_it", "use_it", "quiz", "complete"]
FIELD_INPUTS = {"text", "textarea", "number", "currency", "date", "select", "rating", "list"}
COL_INPUTS = {"text", "number", "currency", "date", "select", "checkbox", "percent"}
KINDS = {"worksheet", "template", "tracker", "checklist", "tool"}
KEY = re.compile(r"^p[45]-[a-z0-9-]{2,50}$")
ID = re.compile(r"^[a-z][a-z0-9_]{0,40}$")
FORMULA = re.compile(r"^[a-z0-9_+\-*/(). ]+$")

def words(s): return len(re.findall(r"\w+", s or ""))

def main():
    path = sys.argv[1]
    allow = set()
    if "--allow-ref" in sys.argv:
        allow = set(sys.argv[sys.argv.index("--allow-ref") + 1].split(","))
    errs = []
    try:
        d = json.load(open(path))
    except Exception as e:
        print("ERROR invalid JSON:", e); sys.exit(1)
    mods = d.get("modules") or []
    res = d.get("resources") or []
    keys = set()
    total_words = 0
    for r in res:
        k = r.get("key", "")
        if not KEY.match(k): errs.append(f"resource key invalid: {k}")
        if k in keys: errs.append(f"duplicate resource {k}")
        keys.add(k)
        if r.get("kind") not in KINDS: errs.append(f"{k}: bad kind {r.get('kind')}")
        if not r.get("title"): errs.append(f"{k}: no title")
        if not isinstance(r.get("module"), int): errs.append(f"{k}: module must be int")
        c = r.get("content") or {}
        t = c.get("type")
        if t in ("form", "builder"):
            fs = c.get("fields") or []
            if not fs: errs.append(f"{k}: no fields")
            ids = set()
            for f in fs:
                if not ID.match(f.get("id", "")): errs.append(f"{k}: bad field id {f.get('id')}")
                if f.get("id") in ids: errs.append(f"{k}: dup field {f.get('id')}")
                ids.add(f.get("id"))
                if f.get("input") not in FIELD_INPUTS: errs.append(f"{k}.{f.get('id')}: bad input {f.get('input')}")
                if f.get("input") == "select" and not f.get("options"): errs.append(f"{k}.{f.get('id')}: select needs options")
                if not f.get("label"): errs.append(f"{k}.{f.get('id')}: no label")
            if t == "builder" and not c.get("pulls"): errs.append(f"{k}: builder needs pulls")
        elif t == "table":
            cols = c.get("columns") or []
            if not cols: errs.append(f"{k}: no columns")
            cids = [x.get("id") for x in cols]
            numeric = {x.get("id") for x in cols if x.get("input") in ("number", "currency", "percent")}
            has_formula = False
            for col in cols:
                if not ID.match(col.get("id", "")): errs.append(f"{k}: bad col id {col.get('id')}")
                if col.get("input") not in COL_INPUTS: errs.append(f"{k}.{col.get('id')}: bad input {col.get('input')}")
                if col.get("input") == "select" and not col.get("options"): errs.append(f"{k}.{col.get('id')}: select needs options")
                fm = col.get("formula")
                if fm:
                    has_formula = True
                    if not FORMULA.match(fm): errs.append(f"{k}.{col['id']}: formula has illegal chars")
                    for tok in re.findall(r"[a-z_][a-z0-9_]*", fm):
                        if tok not in numeric or tok == col["id"]:
                            errs.append(f"{k}.{col['id']}: formula ref '{tok}' not another numeric column")
                    if col.get("input") not in ("number", "currency", "percent"):
                        errs.append(f"{k}.{col['id']}: formula column must be numeric")
            if len(set(cids)) != len(cids): errs.append(f"{k}: duplicate column ids")
            for tcol in c.get("totals") or []:
                if tcol not in numeric: errs.append(f"{k}: total on non-numeric {tcol}")
            if has_formula and not c.get("formula_notes"): errs.append(f"{k}: formula_notes required")
        elif t == "checklist":
            if not c.get("items"): errs.append(f"{k}: checklist needs items")
        else:
            errs.append(f"{k}: bad content type {t}")
        total_words += words(json.dumps(c))
    refs = set()
    lessons = 0
    for m in mods:
        mp = m.get("position")
        if not isinstance(mp, int): errs.append("module position must be int")
        for f in ("title", "summary", "outcome"):
            if not m.get(f): errs.append(f"module {mp}: missing {f}")
        ls = m.get("lessons") or []
        if not ls: errs.append(f"module {mp}: no lessons")
        for i, l in enumerate(ls, 1):
            lessons += 1
            tag = f"M{mp}.L{l.get('position')}"
            if l.get("position") != i: errs.append(f"{tag}: positions must be 1..n")
            if not l.get("title") or not l.get("summary"): errs.append(f"{tag}: title/summary")
            if not isinstance(l.get("est_minutes"), int) or not 1 <= l["est_minutes"] <= 60: errs.append(f"{tag}: est_minutes 1-60")
            secs = l.get("sections") or []
            kinds = [s.get("kind") for s in secs]
            if kinds != ORDER: errs.append(f"{tag}: section order must be {ORDER}, got {kinds}")
            lw = 0
            for s in secs:
                k = s.get("kind")
                if k == "overview":
                    for f in ("what", "why", "do", "output"):
                        if not s.get(f): errs.append(f"{tag}: overview.{f} missing")
                    lw += words(" ".join(str(s.get(f, "")) for f in ("what", "why", "do", "output")))
                elif k == "quiz":
                    qs = s.get("questions") or []
                    if not 1 <= len(qs) <= 3: errs.append(f"{tag}: 1-3 quiz questions")
                    for q in qs:
                        o = q.get("options") or []
                        if not 3 <= len(o) <= 4: errs.append(f"{tag}: 3-4 options")
                        if not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < len(o): errs.append(f"{tag}: bad answer index")
                        if not q.get("q") or not q.get("explain"): errs.append(f"{tag}: q/explain missing")
                        lw += words(q.get("q", "") + " " + " ".join(o) + " " + q.get("explain", ""))
                else:
                    if not s.get("markdown"): errs.append(f"{tag}: {k}.markdown missing")
                    if re.search(r"^#{1,2} ", s.get("markdown", ""), re.M): errs.append(f"{tag}: no # or ## headings")
                    if "|" in s.get("markdown", "") and re.search(r"\|.*\|", s.get("markdown", "")): errs.append(f"{tag}: no markdown tables")
                    lw += words(s.get("markdown"))
                    if s.get("resource"): refs.add(s["resource"])
            if lw < 250: errs.append(f"{tag}: too short ({lw} words)")
            total_words += lw
    for r in refs:
        if r not in keys and r not in allow: errs.append(f"lesson references unknown resource {r}")
    for k in keys:
        if k not in refs: errs.append(f"resource {k} not referenced by any lesson")
    if errs:
        print("\n".join("ERROR " + e for e in errs)); sys.exit(1)
    print(f"OK modules={len(mods)} lessons={lessons} resources={len(keys)} words={total_words}")
    print("keys:", ",".join(sorted(keys)))

main()
