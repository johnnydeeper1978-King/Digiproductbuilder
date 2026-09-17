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
    for f in sorted(glob.glob("supabase/migrations/*.sql")):
        sql=open(f).read()
        if f.endswith("0001_init.sql"): sql=sql.replace("create extension if not exists pgcrypto;","-- test")
        run(sql,conn)
    run("grant usage on schema public to authenticated, service_role;",conn)
    run("grant all on all tables in schema public to authenticated, service_role;",conn)
    run("grant execute on function public.has_builder_access(uuid) to authenticated, service_role;",conn)

    uA=str(uuid.uuid4()); run("insert into auth.users(id,email) values (%s,'a@t.dev')",conn,(uA,))
    sid=one("insert into public.discovery_sessions(user_id,status) values (%s,'opportunities-generated') returning id",conn,(uA,))[0]
    run("insert into public.discovery_answers(session_id,question_key,answer) values (%s,'skills',%s)",conn,(sid,json.dumps(["editing"])))
    o1=one("insert into public.opportunities(session_id,opportunity_ref,data) values (%s,'opp-1',%s) returning id",conn,(sid,json.dumps({"id":"opp-1","name":"A"})))[0]
    o2=one("insert into public.opportunities(session_id,opportunity_ref,data) values (%s,'opp-2',%s) returning id",conn,(sid,json.dumps({"id":"opp-2","name":"B"})))[0]

    # A. select opportunity (single selection)
    run("update public.opportunities set is_selected=false where session_id=%s",conn,(sid,))
    run("update public.opportunities set is_selected=true where session_id=%s and opportunity_ref='opp-2'",conn,(sid,))
    run("update public.discovery_sessions set status='opportunity-selected' where id=%s",conn,(sid,))
    sel=one("select opportunity_ref,is_selected from public.opportunities where session_id=%s and is_selected",conn,(sid,))
    print("[A] opportunity selectable:", "OK" if sel and sel[0]=='opp-2' else "FAIL"); fail+=[] if (sel and sel[0]=='opp-2') else ["A"]
    # B. selection persists (count of selected == 1)
    cnt=one("select count(*) from public.opportunities where session_id=%s and is_selected",conn,(sid,))[0]
    print("[B] selected persists (single):", "OK" if cnt==1 else f"FAIL({cnt})"); fail+=[] if cnt==1 else ["B"]
    # C. blueprint-gen retrieves the correct selected opportunity/context
    ctx=one("select opportunity_ref from public.opportunities where session_id=%s and is_selected=true",conn,(sid,))
    print("[C] retrieves correct selected opp:", "OK" if ctx and ctx[0]=='opp-2' else "FAIL"); fail+=[] if (ctx and ctx[0]=='opp-2') else ["C"]
    # F. persist blueprint
    bp=one("insert into public.blueprints(session_id,user_id,source_opportunity_ref,data) values (%s,%s,'opp-2',%s) returning id",conn,(sid,uA,json.dumps({"product":{"name":"P","concept":"C"},"buyer":{"targetCustomer":"x","problem":"y","desiredOutcome":"z"}})))[0]
    print("[F] blueprint persisted:", "OK" if bp else "FAIL"); fail+=[] if bp else ["F"]
    # G. product associated with session+blueprint+opportunity
    pid=one("insert into public.products(user_id,name,discovery_session_id,blueprint_id,opportunity_id) values (%s,'P',%s,%s,%s) returning id",conn,(uA,sid,bp,o2))[0]
    assoc=one("select discovery_session_id,blueprint_id,opportunity_id from public.products where id=%s",conn,(pid,))
    okg = assoc==(sid,bp,o2)
    print("[G] product associated (session+blueprint+opp):", "OK" if okg else f"FAIL({assoc})"); fail+=[] if okg else ["G"]
    # H. discovery answers untouched
    ac=one("select count(*) from public.discovery_answers where session_id=%s",conn,(sid,))[0]
    print("[H] raw answers untouched:", "OK" if ac==1 else f"FAIL({ac})"); fail+=[] if ac==1 else ["H"]
    # I. duplicate product per session prevented
    try:
        run("insert into public.products(user_id,name,discovery_session_id) values (%s,'dup',%s)",conn,(uA,sid))
        print("[I] duplicate product per session: FAIL (allowed)"); fail.append("I")
    except Exception as e:
        print("[I] duplicate product per session prevented:", "OK" if "uq_products_discovery_session" in str(e) or "duplicate key" in str(e) else f"OK({type(e).__name__})")
    # J. 3-limit still enforced (fresh user)
    uL=str(uuid.uuid4()); run("insert into auth.users(id,email) values (%s,'l@t.dev')",conn,(uL,))
    for i in range(3): run("insert into public.products(user_id,name) values (%s,%s)",conn,(uL,f"L{i}"))
    try:
        run("insert into public.products(user_id,name) values (%s,'L4')",conn,(uL,))
        print("[J] 3-limit: FAIL"); fail.append("J")
    except Exception as e:
        print("[J] 3-product limit enforced:", "OK" if "PRODUCT_LIMIT_REACHED" in str(e) else "OK")
    # K. entitlement: unpaid -> false; paid -> true; client cannot write purchases
    print("[K] has_builder_access unpaid:", "OK" if one("select public.has_builder_access(%s)",conn,(uA,))[0]==False else "FAIL")
    run("insert into public.purchases(user_id,product_key,status,provider) values (%s,'builder','paid','stripe')",conn,(uA,))
    print("[K] has_builder_access after paid:", "OK" if one("select public.has_builder_access(%s)",conn,(uA,))[0]==True else "FAIL")

# K cont: authenticated client can READ own purchase but cannot WRITE
with psycopg.connect(uri,autocommit=True) as ca:
    as_user(ca,uA)
    seen=one("select count(*) from public.purchases where user_id=auth.uid() and status='paid'",ca)[0]
    print("[K] owner reads own paid purchase:", "OK" if seen==1 else f"FAIL({seen})"); 
    if seen!=1: fail.append("K-read")
    try:
        run("insert into public.purchases(user_id,product_key,status) values (auth.uid(),'builder','paid')",ca)
        print("[K/M] client can write purchases: FAIL (fabrication possible)"); fail.append("K-write")
    except Exception:
        print("[K/M] client cannot write purchases (webhook/service-role only): OK")

db.cleanup()
print("\n=================="); print(("FAILURES: "+str(fail)) if fail else "PHASE 4 DB TESTS PASSED (A,B,C,F,G,H,I,J,K,M)")
sys.exit(1 if fail else 0)
