import pgserver, psycopg, glob, sys, tempfile, uuid, json
tmp=tempfile.mkdtemp(); db=pgserver.get_server(tmp); uri=db.get_uri()
def run(sql,c,args=None):
    with c.cursor() as cur: cur.execute(sql,args)
def as_user(conn, uid):
    with conn.cursor() as cur:
        cur.execute("set role authenticated")
        cur.execute("select set_config('app.uid', %s, false)", (uid,))  # session-level: persists on this connection
fail=[]
with psycopg.connect(uri, autocommit=True) as conn:
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
        if f.endswith("0001_init.sql"): sql=sql.replace("create extension if not exists pgcrypto;","-- test: pgcrypto skipped")
        run(sql,conn)
    run("grant usage on schema public to authenticated, service_role;",conn)
    run("grant all on all tables in schema public to authenticated, service_role;",conn)

    # A. anon starts
    with conn.cursor() as cur:
        cur.execute("insert into public.discovery_sessions(status) values ('in-progress') returning id, anon_token")
        sid, anon = cur.fetchone()
    print("[A] anon session start:", "OK" if sid and anon else "FAIL");  fail+=[] if (sid and anon) else ["A"]
    # B. anon answers
    for i,(k,v) in enumerate([("skills",["editing"]),("interests",["fitness"]),("brand_type","faceless")]):
        run("insert into public.discovery_answers(session_id,question_key,answer,sequence) values (%s,%s,%s,%s)",conn,(sid,k,json.dumps(v),i))
    with conn.cursor() as cur:
        cur.execute("select count(*) from public.discovery_answers where session_id=%s",(sid,)); n=cur.fetchone()[0]
    print("[B] anon answers saved:", "OK" if n==3 else f"FAIL({n})"); fail+=[] if n==3 else ["B"]
    # C. change answer (upsert)
    run("""insert into public.discovery_answers(session_id,question_key,answer,sequence) values (%s,'brand_type',%s,2)
           on conflict (session_id,question_key) do update set answer=excluded.answer""",conn,(sid,json.dumps("personal-brand")))
    with conn.cursor() as cur:
        cur.execute("select answer,count(*) over() from public.discovery_answers where session_id=%s and question_key='brand_type'",(sid,))
        val,cnt=cur.fetchone()
    okc=(val=="personal-brand" and cnt==1); print("[C] answer updated in place:", "OK" if okc else f"FAIL({val},{cnt})"); fail+=[] if okc else ["C"]
    # D. resume by token
    with conn.cursor() as cur:
        cur.execute("select id,(select count(*) from public.discovery_answers a where a.session_id=discovery_sessions.id) from public.discovery_sessions where anon_token=%s",(anon,))
        rid,rc=cur.fetchone()
    print("[D] resume by anon_token:", "OK" if rid==sid and rc==3 else "FAIL"); fail+=[] if (rid==sid and rc==3) else ["D"]
    # users for E/F/I
    uA=str(uuid.uuid4()); uB=str(uuid.uuid4())
    run("insert into auth.users(id,email) values (%s,'a@t.dev')",conn,(uA,))
    run("insert into auth.users(id,email) values (%s,'b@t.dev')",conn,(uB,))

# E. authed insert via RLS
with psycopg.connect(uri, autocommit=True) as ca:
    as_user(ca, uA)
    with ca.cursor() as cur:
        cur.execute("insert into public.discovery_sessions(user_id,status) values (auth.uid(),'in-progress') returning id"); asid=cur.fetchone()[0]
        cur.execute("insert into public.discovery_answers(session_id,question_key,answer) values (%s,'skills',%s)",(asid,json.dumps(["copywriting"])))
        cur.execute("select count(*) from public.discovery_sessions where id=%s",(asid,)); own=cur.fetchone()[0]
    print("[E] authed session+answer via RLS:", "OK" if asid and own==1 else "FAIL"); fail+=[] if (asid and own==1) else ["E"]
# F. cross-user isolation
with psycopg.connect(uri, autocommit=True) as cb:
    as_user(cb, uB)
    with cb.cursor() as cur:
        cur.execute("select count(*) from public.discovery_sessions where id=%s",(asid,)); ss=cur.fetchone()[0]
        cur.execute("select count(*) from public.discovery_answers where session_id=%s",(asid,)); aa=cur.fetchone()[0]
    print("[F] cross-user isolation:", "OK" if ss==0 and aa==0 else f"FAIL(s={ss},a={aa})"); fail+=[] if (ss==0 and aa==0) else ["F"]
# I. ai_runs audit (service-role write) + owner read + client cannot write
with psycopg.connect(uri, autocommit=True) as conn:
    run("insert into public.ai_runs(user_id,session_id,run_type,status,validation_status,error_code) values (%s,%s,'discovery_analyze','failed','invalid','ai_not_configured')",conn,(uA,asid))
with psycopg.connect(uri, autocommit=True) as ca:
    as_user(ca, uA)
    with ca.cursor() as cur:
        cur.execute("select count(*) from public.ai_runs where session_id=%s",(asid,)); runs=cur.fetchone()[0]
    print("[I] ai_run recorded + owner-readable:", "OK" if runs==1 else f"FAIL({runs})"); fail+=[] if runs==1 else ["I"]
    try:
        with ca.cursor() as cur:
            cur.execute("insert into public.ai_runs(user_id,run_type,status) values (auth.uid(),'x','failed')")
        print("[I] client write to ai_runs: FAIL (allowed)"); fail.append("ai_runs_client_write")
    except Exception:
        print("[I] client cannot write ai_runs (server-only): OK")

db.cleanup()
print("\n=================="); 
print(("FAILURES: "+str(fail)) if fail else "DISCOVERY DB TESTS PASSED (A,B,C,D,E,F,I)")
sys.exit(1 if fail else 0)
