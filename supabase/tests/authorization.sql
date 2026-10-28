-- Run only in an isolated local/staging Supabase database after migrations.
-- No real passwords/users are created. All fixtures roll back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-4000-8000-000000000001','owner@test.invalid',now()),
 ('00000000-0000-4000-8000-000000000002','staff@test.invalid',now()),
 ('00000000-0000-4000-8000-000000000003','outsider@test.invalid',now());
insert into auth.sessions(id,user_id,created_at,updated_at) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',now(),now()),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002',now(),now()),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000003',now(),now());
insert into auth.mfa_factors(id,user_id,friendly_name,factor_type,status,created_at,updated_at) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','test only','totp','verified',now(),now()),
 ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','test only','totp','verified',now(),now());
insert into public.admin_members(user_id,role,is_active) values('00000000-0000-4000-8000-000000000001','owner',true),('00000000-0000-4000-8000-000000000002','staff',true);
insert into public.categories(id,name,slug) values('test-category','Teste','test-category');
insert into public.products(id,name,description,category_id,price_cents,image_path,is_available,is_published) values
 ('test-public','Público','','test-category',1000,'https://images.unsplash.com/photo-test?w=700',true,true),
 ('test-hidden','Oculto','','test-category',1000,'https://images.unsplash.com/photo-test?w=700',true,false);

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 if exists(select 1 from public.products where id='test-hidden') then raise exception 'Anon can read unpublished';end if;
 begin update public.products set price_cents=1 where id='test-public';raise exception 'Anon write allowed';exception when insufficient_privilege then null;end;
 begin perform 1 from public.admin_members;raise exception 'Anon members read allowed';exception when insufficient_privilege then null;end;
 begin perform 1 from public.audit_logs;raise exception 'Anon audit read allowed';exception when insufficient_privilege then null;end;
 begin perform public.set_product_availability('test-public',false,now());raise exception 'Anon RPC allowed';exception when insufficient_privilege then null;end;
end$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000003","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000003","user_metadata":{"role":"owner"}}',true);
do $$begin
 if public.my_admin_access() is not null then raise exception 'Non-member metadata escalation';end if;
 begin perform public.set_product_availability('test-public',false,now());raise exception 'Non-member write allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002","aal":"aal1","session_id":"10000000-0000-4000-8000-000000000002"}',true);
do $$begin
 if public.my_admin_access() is distinct from 'staff' then raise exception 'MFA setup access missing';end if;
 if public.admin_context() is not null then raise exception 'MFA bypass';end if;
 if exists(select 1 from public.products where id='test-hidden') then raise exception 'AAL1 hidden read allowed';end if;
 begin perform public.set_product_availability('test-public',false,now());raise exception 'AAL1 write allowed';exception when insufficient_privilege then null;end;
end$$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000002"}',true);
do $$declare version timestamptz;rows integer;begin
 if public.admin_context() is distinct from 'staff' then raise exception 'Staff access missing';end if;
 select updated_at into version from public.products where id='test-public';
 perform public.set_product_availability('test-public',false,version);
 if (select is_available from public.products where id='test-public') then raise exception 'Staff availability failed';end if;
 update public.products set price_cents=1 where id='test-public';get diagnostics rows=row_count;if rows<>0 then raise exception 'Staff price update allowed';end if;
 update public.products set is_published=false where id='test-public';get diagnostics rows=row_count;if rows<>0 then raise exception 'Staff publish update allowed';end if;
 if exists(select 1 from public.audit_logs) then raise exception 'Staff audit access allowed';end if;
 begin update public.admin_members set role='owner' where user_id=auth.uid();raise exception 'Staff escalation allowed';exception when insufficient_privilege then null;end;
 begin insert into public.categories(id,name,slug) values('staff-created','No','staff-created');raise exception 'Staff insert allowed';exception when insufficient_privilege then null;end;
 begin insert into public.audit_logs(action,entity_type,entity_id) values('forged','products','test-public');raise exception 'Staff audit forgery allowed';exception when insufficient_privilege then null;end;
end$$;

select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000001"}',true);
do $$declare version timestamptz;begin
 if public.admin_context() is distinct from 'owner' then raise exception 'Owner access missing';end if;
 update public.products set price_cents=1250 where id='test-public';
 if (select price_cents from public.products where id='test-public') is distinct from 1250 then raise exception 'Owner price update failed';end if;
 if not exists(select 1 from public.audit_logs where entity_id='test-public' and actor_user_id='00000000-0000-4000-8000-000000000002') then raise exception 'Audit actor missing';end if;
 select updated_at into version from public.products where id='test-public';perform public.set_product_availability('test-public',true,version);
 begin perform public.set_product_availability('test-public',false,version);raise exception 'Stale update accepted';exception when serialization_failure then null;end;
 begin update public.audit_logs set action='tampered';raise exception 'Owner audit tampering allowed';exception when insufficient_privilege then null;end;
 begin delete from public.products where id='test-public';raise exception 'Hard delete allowed';exception when insufficient_privilege then null;end;
 begin update public.products set price_cents=-1 where id='test-public';raise exception 'Negative price accepted';exception when check_violation then null;end;
 begin update public.products set customization_options='[{"id":"bad","name":"Bad","choices":[]}]' where id='test-public';raise exception 'Invalid options accepted';exception when check_violation then null;end;
end$$;

reset role;
update public.admin_members set is_active=false where user_id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000002","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000002","user_metadata":{"role":"owner"}}',true);
do $$begin
 if public.my_admin_access() is not null then raise exception 'Disabled account retained access';end if;
 begin perform public.set_product_availability('test-public',false,now());raise exception 'Disabled account wrote';exception when insufficient_privilege then null;end;
end$$;
reset role;
delete from auth.sessions where user_id='00000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000001","aal":"aal2","session_id":"10000000-0000-4000-8000-000000000001"}',true);
do $$begin if public.admin_context() is not null then raise exception 'Revoked session retained access';end if;end$$;
reset role;
rollback;
\echo 'PASS: isolated authorization transaction completed and rolled back'
