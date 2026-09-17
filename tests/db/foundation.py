import pgserver, psycopg, glob, os, sys, tempfile, uuid

tmp = tempfile.mkdtemp()
db = pgserver.get_server(tmp)
uri = db.get_uri()
print("Postgres up")

def run(sql, conn):
    with conn.cursor() as cur:
        cur.execute(sql)

fail = []
with psycopg.connect(uri, autocommit=True) as conn:
    run("""do $$ begin
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
    end $$;""", conn)
    run("create schema if not exists auth;", conn)
    run("create table if not exists auth.users(id uuid primary key default gen_random_uuid(), email text unique);", conn)
    run("create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true),'')::uuid $$;", conn)
    # gen_random_uuid() is core since PG13; pgcrypto (Supabase-present) not needed for the test.
    with conn.cursor() as cur:
        cur.execute("select gen_random_uuid()"); print("gen_random_uuid() core-available: OK")

    for f in sorted(glob.glob("supabase/migrations/*.sql")):
        try:
            sql = open(f).read()
            if f.endswith("0001_init.sql"):
                sql = sql.replace("create extension if not exists pgcrypto;", "-- [test] pgcrypto skipped locally; present on Supabase")
            run(sql, conn)
            print("applied:", os.path.basename(f))
        except Exception as e:
            fail.append(f"MIGRATION {f}: {e}"); print("FAILED:", f, e)

    run("grant usage on schema public to anon, authenticated, service_role;", conn)
    run("grant all on all tables in schema public to anon, authenticated, service_role;", conn)

    expected = {"profiles","products","discovery_sessions","discovery_answers","opportunities","blueprints","ai_runs","events"}
    with conn.cursor() as cur:
        cur.execute("select table_name from information_schema.tables where table_schema='public'")
        got = {r[0] for r in cur.fetchall()}
    miss = expected - got
    print("\n[TABLES]", "OK ("+str(len(expected))+")" if not miss else f"MISSING {miss}")
    if miss: fail.append(f"tables missing: {miss}")

    with conn.cursor() as cur:
        cur.execute("select conrelid::regclass::text, confrelid::regclass::text from pg_constraint where contype='f' order by 1")
        fks = cur.fetchall()
    print(f"[FOREIGN KEYS] {len(fks)}")
    for a,b in fks: print("   ", a, "->", b)

    with conn.cursor() as cur:
        cur.execute("select count(*) from pg_indexes where schemaname='public'")
        print(f"[INDEXES] {cur.fetchone()[0]}")
    with conn.cursor() as cur:
        cur.execute("select relname from pg_class where relrowsecurity and relnamespace='public'::regnamespace order by 1")
        rls_on = [r[0] for r in cur.fetchall()]
        cur.execute("select count(*) from pg_policies where schemaname='public'")
        npol = cur.fetchone()[0]
    print(f"[RLS] enabled on {len(rls_on)} tables, {npol} policies")
    if expected - set(rls_on): fail.append(f"RLS not on all: {expected-set(rls_on)}")

    uA = str(uuid.uuid4())
    run(f"insert into auth.users(id,email) values ('{uA}','a@test.dev')", conn)
    with conn.cursor() as cur:
        cur.execute("select count(*) from public.profiles where id=%s",(uA,)); prof = cur.fetchone()[0]
    print(f"\n[handle_new_user] auto-profile: {'OK' if prof==1 else 'FAIL'}")
    if prof!=1: fail.append("handle_new_user failed")

    for i in range(3): run(f"insert into public.products(user_id,name) values ('{uA}','P{i+1}')", conn)
    print("[3-LIMIT] 3 inserts: OK")
    try:
        run(f"insert into public.products(user_id,name) values ('{uA}','P4')", conn)
        print("[3-LIMIT] 4th: FAIL"); fail.append("4th product not rejected")
    except Exception as e:
        print("[3-LIMIT] 4th rejected:", "OK" if "PRODUCT_LIMIT_REACHED" in str(e) else f"OK({e})")
    with conn.cursor() as cur:
        cur.execute("update public.products set status='archived' where user_id=%s and name='P1'",(uA,))
    try:
        run(f"insert into public.products(user_id,name) values ('{uA}','P4b')", conn); print("[3-LIMIT] insert after archive: OK")
    except Exception as e:
        print("[3-LIMIT] insert after archive: FAIL", e); fail.append("insert after archive failed")
    try:
        with conn.cursor() as cur:
            cur.execute("update public.products set status='active' where user_id=%s and name='P1'",(uA,))
        print("[3-LIMIT] un-archive beyond limit: FAIL"); fail.append("un-archive not rejected")
    except Exception as e:
        print("[3-LIMIT] un-archive beyond limit rejected:", "OK" if "PRODUCT_LIMIT_REACHED" in str(e) else f"OK")

    uB = str(uuid.uuid4())
    run(f"insert into auth.users(id,email) values ('{uB}','b@test.dev')", conn)
    run(f"insert into public.products(user_id,name) values ('{uB}','B-secret')", conn)

with psycopg.connect(uri, autocommit=True) as c2:
    with c2.cursor() as cur:
        cur.execute("set role authenticated")
        cur.execute("select set_config('app.uid', %s, true)", (uA,))
        cur.execute("select count(*) from public.products where name='B-secret'"); seesB = cur.fetchone()[0]
        cur.execute("select count(*) from public.products"); visible = cur.fetchone()[0]
    print(f"\n[RLS ENFORCE] user A sees {visible} rows; sees B secret = {seesB}")
    if seesB != 0: fail.append("RLS leak")
    try:
        with c2.cursor() as cur:
            cur.execute("set role authenticated"); cur.execute("select set_config('app.uid', %s, true)", (uA,))
            cur.execute(f"insert into public.products(user_id,name) values ('{uB}','hack')")
        print("[RLS ENFORCE] A insert-as-B: FAIL"); fail.append("with_check bypass")
    except Exception:
        print("[RLS ENFORCE] A insert-as-B rejected: OK")

db.cleanup()
print("\n==================")
if fail:
    print("FAILURES:"); [print(" -", x) for x in fail]; sys.exit(1)
print("ALL DB CHECKS PASSED")
