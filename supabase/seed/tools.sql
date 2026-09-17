-- 369 Degrees — tools catalogue seed (structure + real, no-affiliate entries).
--
-- RULES honoured here:
--   * NO affiliate URLs are invented. Every row below has affiliate_url = NULL
--     and is_affiliate = false. Add a real URL + disclosure ONLY when an actual
--     affiliate relationship is verified (UPDATE the row then).
--   * These are real, widely-used tools used purely as neutral reference
--     recommendations by the Builder's tool-recommendation boundary.
--
-- Apply with:  supabase db execute --file supabase/seed/tools.sql
--          or: psql "$SUPABASE_DB_URL" -f supabase/seed/tools.sql
-- Idempotent: safe to re-run (skips names already present).

insert into public.tools (name, category, purpose, recommended_use, alternative, affiliate_url, is_affiliate, disclosure)
select v.name, v.category, v.purpose, v.recommended_use, v.alternative, null, false, null
from (values
  -- product-creation
  ('Google Docs',   'product-creation', 'Write and structure written products (ebooks, guides).', 'Draft the product, then export to PDF.', 'Notion', null),
  ('Canva',         'product-creation', 'Design ebooks, templates, workbooks and covers.',      'Turn an outline into a designed PDF product.', 'Google Slides', null),
  ('Notion',        'product-creation', 'Build Notion-template and system products.',            'Create and duplicate a template product.', 'Google Docs', null),
  -- landing-page
  ('Carrd',         'landing-page',     'Simple one-page landing pages.',                        'Ship a fast single-product landing page.', 'Framer', null),
  ('Framer',        'landing-page',     'Design-led landing pages with more control.',           'Build a richer landing page without code.', 'Carrd', null),
  -- payments
  ('Gumroad',       'payments',         'Sell and deliver digital products with checkout built in.', 'Fastest path to a buyable product + delivery.', 'Lemon Squeezy', null),
  ('Lemon Squeezy', 'payments',         'Digital product checkout with merchant-of-record tax handling.', 'Sell globally with tax handled.', 'Gumroad', null),
  ('Stripe',        'payments',         'Payments infrastructure / checkout.',                    'Take card payments on your own site.', 'Gumroad', null),
  -- email
  ('MailerLite',    'email',            'Email list + automations for creators.',                'Collect leads and send launch emails.', 'ConvertKit', null),
  ('ConvertKit',    'email',            'Creator-focused email marketing.',                       'Nurture an audience and sell via email.', 'MailerLite', null),
  -- content
  ('CapCut',        'content',          'Short-form video editing.',                              'Edit short-form promo/education videos.', 'Descript', null),
  ('Descript',      'content',          'Edit video/audio by editing text.',                      'Faster video editing for content.', 'CapCut', null)
) as v(name, category, purpose, recommended_use, alternative, affiliate_url)
where not exists (select 1 from public.tools t where t.name = v.name);
