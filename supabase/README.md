# Lilyum Design backend setup

This directory contains the production data model for customer accounts, private favorites, price tracking and owner-only catalog management.

1. Create a Supabase project.
2. Run `schema.sql` in the SQL editor.
3. Run `seed.sql` to load the current catalog.
4. Register the owner's account through the site, then promote only that account:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'OWNER_EMAIL_HERE');
```

5. Copy the Project URL and publishable key into `lilyum-config.js`.
6. Add `https://lilyumdesigns.com/` as an allowed Auth redirect URL.

Never place a `service_role` key in browser code. Authorization is enforced by the RLS policies in `schema.sql`; hiding the admin button is only a user-interface convenience.
