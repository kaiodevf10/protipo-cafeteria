begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.admin_members(
 user_id uuid primary key references auth.users(id),
 role text not null check(role in ('owner','staff')),
 is_active boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories(
 id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,80}$'),
 name text not null check(length(trim(name)) between 1 and 100),
 slug text not null unique check(length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 display_order integer not null default 0 check(display_order between 0 and 100000),
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function private.valid_options(value jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare g jsonb; c jsonb; groups text[]='{}'; choices text[];
begin
 if jsonb_typeof(value)<>'array' or jsonb_array_length(value)>12 then return false; end if;
 for g in select * from jsonb_array_elements(value) loop
  if jsonb_typeof(g)<>'object' or g-array['id','name','required','multiple','choices']<>'{}'::jsonb
   or jsonb_typeof(g->'id')<>'string' or jsonb_typeof(g->'name')<>'string'
   or coalesce(g->>'id','')!~'^[a-zA-Z0-9_-]{1,64}$' or length(trim(coalesce(g->>'name',''))) not between 1 and 100
   or coalesce(jsonb_typeof(g->'required'),'boolean')<>'boolean' or coalesce(jsonb_typeof(g->'multiple'),'boolean')<>'boolean'
   or coalesce(jsonb_typeof(g->'choices'),'null')<>'array' then return false; end if;
  if (g->>'id')=any(groups) or (g->>'id') in ('__proto__','constructor','prototype') or jsonb_array_length(g->'choices') not between 1 and 30 then return false; end if;
  groups=array_append(groups,g->>'id'); choices='{}';
  for c in select * from jsonb_array_elements(g->'choices') loop
   if jsonb_typeof(c)<>'object' or c-array['id','label','price_cents']<>'{}'::jsonb
    or jsonb_typeof(c->'id')<>'string' or jsonb_typeof(c->'label')<>'string'
    or coalesce(c->>'id','')!~'^[a-zA-Z0-9_-]{1,64}$' or length(trim(coalesce(c->>'label',''))) not between 1 and 100
    or coalesce(jsonb_typeof(c->'price_cents'),'null')<>'number' or coalesce(c->>'price_cents','')!~'^[0-9]{1,9}$' then return false; end if;
   if (c->>'price_cents')::bigint>100000000 or (c->>'id')=any(choices) then return false; end if;
   choices=array_append(choices,c->>'id');
  end loop;
 end loop;
 return true;
exception when others then return false;
end $$;
create table public.products(
 id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,80}$'),
 name text not null check(length(trim(name)) between 1 and 120),
 description text not null check(length(description)<=1000),
 category_id text not null references public.categories(id) on delete restrict,
 price_cents integer not null check(price_cents between 0 and 100000000),
 image_path text not null check(image_path ~ '^photos/[a-f0-9-]{36}[.](jpg|png|webp)$' or image_path ~ '^https://images[.]unsplash[.]com/photo-[a-zA-Z0-9-]+[?][a-zA-Z0-9=&._%-]+$'),
 is_available boolean not null default false, is_published boolean not null default false,
 display_order integer not null default 0 check(display_order between 0 and 100000),
 customization_options jsonb not null default '[]'::jsonb check(private.valid_options(customization_options)),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index categories_unique_name on public.categories(lower(trim(name)));
create index products_category_id on public.products(category_id);
create table public.audit_logs(
 id bigint generated always as identity primary key,
 actor_user_id uuid, action text not null, entity_type text not null, entity_id text not null,
 previous_values jsonb,new_values jsonb,created_at timestamptz not null default now()
);
create index audit_logs_created_at on public.audit_logs(created_at desc);

create function private.member_role(require_mfa boolean default true) returns text language sql stable security definer set search_path='' as $$
 select m.role from public.admin_members m join auth.users u on u.id=m.user_id
 where m.user_id=(select auth.uid()) and m.is_active and u.email_confirmed_at is not null
 and (u.banned_until is null or u.banned_until<now())
 and (not require_mfa or ((select auth.jwt()->>'aal')='aal2' and exists(select 1 from auth.mfa_factors f where f.user_id=u.id and f.status='verified')))
 and exists(select 1 from auth.sessions s where s.user_id=u.id and s.id::text=(select auth.jwt()->>'session_id') and (s.not_after is null or s.not_after>now()))
$$;
create function public.my_admin_access() returns text language sql security invoker set search_path='' as $$ select private.member_role(false) $$;
create function public.admin_context() returns text language sql security invoker set search_path='' as $$ select private.member_role(true) $$;

alter table public.admin_members enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.audit_logs enable row level security;
revoke all on public.admin_members,public.products,public.categories,public.audit_logs from public,anon,authenticated;
grant select on public.products,public.categories to anon,authenticated;
grant select on public.audit_logs to authenticated;
grant insert(id,name,description,category_id,price_cents,image_path,is_available,is_published,display_order,customization_options) on public.products to authenticated;
grant update(name,description,category_id,price_cents,image_path,is_available,is_published,display_order,customization_options) on public.products to authenticated;
grant insert(id,name,slug,display_order,is_active) on public.categories to authenticated;
grant update(name,slug,display_order,is_active) on public.categories to authenticated;
create policy categories_public_read on public.categories for select to anon,authenticated using(is_active);
create policy categories_admin_read on public.categories for select to authenticated using((select private.member_role(true)) in ('owner','staff'));
create policy categories_owner_insert on public.categories for insert to authenticated with check((select private.member_role(true))='owner');
create policy categories_owner_update on public.categories for update to authenticated using((select private.member_role(true))='owner') with check((select private.member_role(true))='owner');
create policy products_public_read on public.products for select to anon,authenticated using(is_published and exists(select 1 from public.categories c where c.id=category_id and c.is_active));
create policy products_admin_read on public.products for select to authenticated using((select private.member_role(true)) in ('owner','staff'));
create policy products_owner_insert on public.products for insert to authenticated with check((select private.member_role(true))='owner');
create policy products_owner_update on public.products for update to authenticated using((select private.member_role(true))='owner') with check((select private.member_role(true))='owner');
create policy audit_owner_read on public.audit_logs for select to authenticated using((select private.member_role(true))='owner');

create function private.set_availability(product_id text,available boolean,expected_updated_at timestamptz) returns public.products language plpgsql security definer set search_path='' as $$
declare result public.products;
begin
 if coalesce(private.member_role(true),'') not in ('owner','staff') then raise exception 'Not authorized' using errcode='42501'; end if;
 if available is null then raise exception 'Invalid availability' using errcode='22023'; end if;
 update public.products set is_available=available where id=product_id and updated_at=expected_updated_at returning * into result;
 if not found then raise exception 'Record changed; reload' using errcode='40001'; end if;
 return result;
end $$;
create function public.set_product_availability(product_id text,available boolean,expected_updated_at timestamptz) returns public.products language sql security invoker set search_path='' as $$select private.set_availability(product_id,available,expected_updated_at)$$;
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$begin new.created_at=old.created_at;new.updated_at=clock_timestamp();return new;end$$;
create trigger products_updated before update on public.products for each row execute function private.touch_updated_at();
create trigger categories_updated before update on public.categories for each row execute function private.touch_updated_at();
create trigger members_updated before update on public.admin_members for each row execute function private.touch_updated_at();
create function private.check_product_image() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.image_path like 'photos/%' and not exists(select 1 from storage.objects where bucket_id='menu-images' and name=new.image_path) then raise exception 'Image not found' using errcode='23514';end if;
 return new;
end $$;
create trigger product_image_exists before insert or update of image_path on public.products for each row execute function private.check_product_image();
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare before_data jsonb; after_data jsonb; record_id text;
begin
 if tg_op<>'INSERT' then before_data=to_jsonb(old)-array['created_at','updated_at']; end if;
 if tg_op<>'DELETE' then after_data=to_jsonb(new)-array['created_at','updated_at']; end if;
 record_id=coalesce(after_data->>'id',before_data->>'id',after_data->>'user_id',before_data->>'user_id');
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,previous_values,new_values) values(auth.uid(),tg_op,tg_table_name,record_id,before_data,after_data);
 return null;
end $$;
create trigger products_audit after insert or update or delete on public.products for each row execute function private.audit_change();
create trigger categories_audit after insert or update or delete on public.categories for each row execute function private.audit_change();
create trigger members_audit after insert or update or delete on public.admin_members for each row execute function private.audit_change();

revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.member_role(boolean),private.set_availability(text,boolean,timestamptz),private.valid_options(jsonb) to authenticated;
revoke execute on function public.my_admin_access(),public.admin_context(),public.set_product_availability(text,boolean,timestamptz) from public,anon;
grant execute on function public.my_admin_access(),public.admin_context(),public.set_product_availability(text,boolean,timestamptz) to authenticated;
-- No INSERT/UPDATE/DELETE policy is granted to browser users for storage.objects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('menu-images','menu-images',true,5242880,array['image/jpeg','image/png','image/webp']);
-- Restrictive policies also protect this bucket if another bucket has broad permissive policies.
create policy menu_images_no_browser_insert on storage.objects as restrictive for insert to anon,authenticated with check(bucket_id<>'menu-images');
create policy menu_images_no_browser_update on storage.objects as restrictive for update to anon,authenticated using(bucket_id<>'menu-images') with check(bucket_id<>'menu-images');
create policy menu_images_no_browser_delete on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'menu-images');
commit;
