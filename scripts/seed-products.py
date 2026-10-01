#!/usr/bin/env python3
"""Generate idempotent SQL that loads Product 4/5 content into the catalog.

Usage:
  python3 scripts/content/validate.py supabase/seed/products/adhd-system.json
  python3 scripts/seed-products.py > /tmp/seed.sql
  psql "$SUPABASE_DB_URL" -f /tmp/seed.sql      # or paste into the SQL editor

Requires migrations 0017 + 0019. Re-running updates content in place
(learner progress and saved answers are kept: ids don't change).
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "supabase" / "seed" / "products"
for path in sorted(ROOT.glob("*.json")):
    key = path.stem
    doc = json.loads(path.read_text())
    payload = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    assert "$J$" not in payload
    print(f"-- {key}: {len(doc['modules'])} modules, {sum(len(m['lessons']) for m in doc['modules'])} lessons, {len(doc['resources'])} resources")
    print(f"select public.seed_product_content('{key}', $J${payload}$J$::jsonb);")
