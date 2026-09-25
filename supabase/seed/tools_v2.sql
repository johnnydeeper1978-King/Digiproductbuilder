-- 369 Degrees — tools catalogue v2. Extends tools.sql with AI assistants, spreadsheet
-- tools, Whop and PayFast, and adds per-tool phases/formats/how_to for the Builder.
-- Rules kept from tools.sql: no invented affiliate URLs (all NULL, is_affiliate=false).
-- last_verified stays NULL until a human checks each tool's current features.
-- Idempotent: upserts on name.
insert into public.tools (name, category, purpose, recommended_use, alternative, how_to, phases, formats, affiliate_url, is_affiliate)
values
 ('Claude','ai-assistant','AI assistant for planning, writing and structuring.','Outline products, draft content, write sales copy and marketing ideas.','ChatGPT',
  'Start a new chat per task. Paste your Blueprint first, then the prompt. Ask it to ask you questions before it answers. Edit its output in your own voice.',
  '{strategy,customer,offer,creation,brand,landing,content,launch,optimization}','{}',null,false),
 ('ChatGPT','ai-assistant','AI assistant for planning, writing and brainstorming.','Brainstorm angles, draft content and rework copy.','Claude',
  'Same method as Claude: context first (your Blueprint), then one clear task per prompt. Ask for 3 options, then pick and refine one.',
  '{strategy,customer,offer,creation,brand,landing,content,launch,optimization}','{}',null,false),
 ('Gemini','ai-assistant','Google''s AI assistant, useful alongside Google Docs and Sheets.','Draft and refine content inside Google tools.','ChatGPT',
  'Use it where you already work in Google Docs or Sheets; give it your Blueprint and one task at a time.',
  '{creation,content}','{}',null,false),
 ('Perplexity','research','AI search that answers with cited sources.','Research competitors, prices and what your buyers already buy.','Google Search',
  'Ask one research question at a time and open the cited sources to confirm anything you rely on.',
  '{strategy,customer,offer,optimization}','{}',null,false),
 ('NotebookLM','research','AI notebook that works only from sources you upload.','Turn your own notes, docs and transcripts into outlines and study guides.','Claude',
  'Upload your own material, then ask for an outline or FAQ. Its answers stay grounded in what you uploaded.',
  '{creation}','{guide,ebook,course,workshop}',null,false),
 ('Google Sheets','product-creation','Free spreadsheets you can share as a copy link.','Build spreadsheet, planner, tracker and calculator products.','Microsoft Excel',
  'Build one tab at a time; protect formula cells; deliver with a "make a copy" link so buyers get their own version.',
  '{creation}','{spreadsheet,planner,calculator,template,database}',null,false),
 ('Microsoft Excel','product-creation','Spreadsheet software many business buyers already use.','Deliver an .xlsx version of spreadsheet products.','Google Sheets',
  'Build and test in one tool first, then create the second version only if buyers ask for it.',
  '{creation}','{spreadsheet,planner,calculator,template}',null,false),
 ('Gamma','product-creation','AI tool that turns outlines into designed documents and slides.','Turn a guide outline into a designed, presentation-style product.','Canva',
  'Paste your finished outline, pick a theme, then edit every page — treat the AI draft as a first pass.',
  '{creation,landing}','{guide,ebook,workshop,course}',null,false),
 ('Whop','payments','Sell digital products globally with built-in affiliates.','Sell internationally in USD and let others resell for commission.','Gumroad',
  'Create a product and a price, connect how buyers get access, then share the product link. Set an affiliate rate if you want resellers.',
  '{payment,launch}','{}',null,false),
 ('PayFast','payments','South African payment gateway (ZAR).','Take local card and EFT payments from South African buyers.','Whop',
  'Register a merchant account, complete verification, then add a payment button or checkout link to your sales page.',
  '{payment}','{}',null,false)
on conflict (name) do update set
  category=excluded.category, purpose=excluded.purpose, recommended_use=excluded.recommended_use,
  alternative=excluded.alternative, how_to=excluded.how_to, phases=excluded.phases, formats=excluded.formats;

-- Give the original tools.sql rows their phases, formats and how-to.
update public.tools t set phases=v.phases::text[], formats=v.formats::text[], how_to=coalesce(t.how_to, v.how_to)
from (values
 ('Google Docs','{creation}','{guide,ebook,checklist,swipe-file}','Write the full draft here, use headings for structure, then export as PDF.'),
 ('Canva','{creation,brand,content}','{guide,ebook,template,planner,checklist,workshop}','Start from a template, apply your brand colours and fonts, export as PDF or images.'),
 ('Notion','{creation}','{notion-system,template,database,planner}','Build the template, then share it as a duplicable page for buyers.'),
 ('Carrd','{landing}','{}','Pick a one-page template, add headline, benefits, what''s inside, FAQ and a buy button.'),
 ('Framer','{landing}','{}','Use when you need more design control than a one-page builder.'),
 ('Gumroad','{payment}','{}','Upload the product file, set a price, and share the product link.'),
 ('Lemon Squeezy','{payment}','{}','Set up the store and product; it handles sales tax as merchant of record.'),
 ('Stripe','{payment}','{}','Use when you already have a website that can take card payments.'),
 ('MailerLite','{launch,content}','{}','Create a signup form for your lead magnet and a short welcome email sequence.'),
 ('ConvertKit','{launch,content}','{}','Create a signup form and a welcome sequence that ends with your offer.'),
 ('CapCut','{content,launch}','{}','Record short vertical clips, add captions, keep each video to one idea.'),
 ('Descript','{content}','{}','Edit video or audio by editing the transcript; remove filler words quickly.')
) as v(name, phases, formats, how_to)
where t.name = v.name;
