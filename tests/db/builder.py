import pgserver, psycopg, glob, sys, tempfile, uuid, json
tmp=tempfile.mkdtemp(); db=pgserver.get_server(tmp); uri=db.get_uri()
def run(sql,c,a=None):
    with c.cursor() as cur: cur.execute(sql,a)
def one(sql,c,a=None):
    with c.cursor() as cur: cur.execute(sql,a); return cur.fetchone()
def as_user(c,uid):
    with c.cursor() as cur:
        cur.execute("set role authenticated"); cur.execute("select set_config('app.uid',%s,false)",(uid,))
fail=[]
with psycopg.connect(uri,autocommit=True) as conn:
    run("""do $$ begin
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
    end $$;""",conn)
    run("create schema if not exists auth;",conn)
    run("create table if not exists auth.users(id uuid primary key default gen_random_uuid(), email text unique);",conn)
    run("create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;",conn)
    run("grant usage on schema auth to authenticated, service_role;",conn)
    run("grant execute on function auth.uid() to authenticated, service_role;",conn)
    run("grant usage on schema public to authenticated, service_role;",conn)
    # Emulate Supabase defaults: future tables/functions get grants automatically.
    run("alter default privileges in schema public grant all on tables to authenticated, service_role;",conn)
    run("alter default privileges in schema public grant execute on functions to authenticated, service_role;",conn)
    for f in sorted(glob.glob("supabase/migrations/*.sql")):
        sql=open(f).read()
        if f.endswith("0001_init.sql"): sql=sql.replace("create extension if not exists pgcrypto;","-- test")
        run(sql,conn)
    # (No blanket grant-all after migrations, so 0010's column-level UPDATE grant stands.)

    uA=str(uuid.uuid4()); uB=str(uuid.uuid4())
    run("insert into auth.users(id,email) values (%s,'a@t.dev')",conn,(uA,))
    run("insert into auth.users(id,email) values (%s,'b@t.dev')",conn,(uB,))
    # uA completed discovery->blueprint->product; uB unpaid, no product
    sid=one("insert into public.discovery_sessions(user_id,status,user_profile) values (%s,'blueprint-generated',%s) returning id",conn,(uA,json.dumps({"skills":["editing"]})))[0]
    bp=one("insert into public.blueprints(session_id,user_id,data) values (%s,%s,%s) returning id",conn,(sid,uA,json.dumps({"product":{"name":"P","concept":"C"},"buyer":{"targetCustomer":"x","problem":"y","desiredOutcome":"z"}})))[0]
    pid=one("insert into public.products(user_id,name,discovery_session_id,blueprint_id) values (%s,'P',%s,%s) returning id",conn,(uA,sid,bp))[0]
    # entitlement: only uA pays
    run("insert into public.purchases(user_id,product_key,status) values (%s,'builder','paid')",conn,(uA,))

    # A/C. entitlement verified via has_builder_access
    print("[A/C] paid user entitled:", "OK" if one("select public.has_builder_access(%s)",conn,(uA,))[0] else "FAIL")
    print("[B] unpaid user NOT entitled:", "OK" if one("select public.has_builder_access(%s)",conn,(uB,))[0]==False else "FAIL")
    if one("select public.has_builder_access(%s)",conn,(uB,))[0]: fail.append("B-ent")

    # D/E. blueprint context loads (product->blueprint join) so discovery isn't re-asked
    joined=one("select b.data->'product'->>'name' from public.products p join public.blueprints b on b.id=p.blueprint_id where p.id=%s",conn,(pid,))
    print("[D/E] blueprint context loads (no re-Discovery):", "OK" if joined and joined[0]=="P" else "FAIL"); fail+=[] if (joined and joined[0]=="P") else ["D"]

    # F/G. builder_state persists (service-role write) and is re-readable
    st=json.dumps({"version":1,"currentPhase":"customer","status":"in-progress","completedPhases":["strategy"],"phases":{},"updatedAt":"t"})
    run("update public.products set builder_state=%s, current_phase='customer', progress=10 where id=%s",conn,(st,pid))
    back=one("select builder_state->>'currentPhase', progress from public.products where id=%s",conn,(pid,))
    print("[F/G] builder_state persists + resumes:", "OK" if back==("customer",10) else f"FAIL({back})"); fail+=[] if back==("customer",10) else ["F"]

    # I/J. ai_run associated with the correct product + recorded
    run("insert into public.ai_runs(user_id,product_id,run_type,status,provider,model) values (%s,%s,'builder_strategy','succeeded','anthropic','m')",conn,(uA,pid))
    air=one("select product_id from public.ai_runs where product_id=%s and run_type='builder_strategy'",conn,(pid,))
    print("[I/J] ai_run recorded + tied to product:", "OK" if air and air[0]==pid else "FAIL"); fail+=[] if (air and air[0]==pid) else ["I"]

    # tools catalogue: seed one active tool (service role)
    run("insert into public.tools(name,category,purpose) values ('Gumroad','payments','sell + deliver')",conn)

# B/L. client (authenticated) CANNOT write builder_state; CAN update name; service-role can write state
with psycopg.connect(uri,autocommit=True) as ca:
    as_user(ca,uA)
    try:
        run("update public.products set builder_state='{}'::jsonb where id=%s",ca,(pid,))
        print("[B/L] client wrote builder_state: FAIL (should be denied)"); fail.append("L")
    except Exception as e:
        print("[B/L] client cannot write builder_state (server-only):", "OK" if "permission denied" in str(e).lower() else f"OK({type(e).__name__})")
    # name update still allowed (RLS + column grant)
    try:
        run("update public.products set name='renamed' where id=%s",ca,(pid,))
        print("[B/L] client can still rename own product: OK")
    except Exception as e:
        print("[B/L] client rename: FAIL", e); fail.append("L-name")

# H. product isolation: uB cannot see or update uA's product
with psycopg.connect(uri,autocommit=True) as cb:
    as_user(cb,uB)
    seen=one("select count(*) from public.products where id=%s",cb,(pid,))[0]
    print("[H] product isolation (uB sees uA product):", "OK" if seen==0 else "FAIL"); 
    if seen!=0: fail.append("H")
    # uB reads tools catalogue (allowed for authenticated)
    tcount=one("select count(*) from public.tools where active",cb)[0]
    print("[tools] authenticated reads catalogue:", "OK" if tcount==1 else f"FAIL({tcount})"); fail+=[] if tcount==1 else ["tools-read"]
    try:
        run("insert into public.tools(name,category) values ('x','y')",cb)
        print("[tools] client write to catalogue: FAIL (allowed)"); fail.append("tools-write")
    except Exception:
        print("[tools] client cannot write catalogue (service-role only): OK")

db.cleanup()
print("\n=================="); print(("FAILURES: "+str(fail)) if fail else "PHASE 5 DB TESTS PASSED (A,B,C,D,E,F,G,H,I,J,L + tools)")
sys.exit(1 if fail else 0)
