# 369 Degrees — Go-live steps (your actions only)

Everything else is built, deployed to Supabase and tested. These 6 steps need you, in this order.

## 1. Put the website live (5 min)
1. Unzip `369-site-dist.zip` into a folder on your computer.
2. Open https://app.netlify.com/projects/369degrees-platform → **Deploys**.
3. Drag the unzipped folder onto the "Drag and drop your project output folder" box.
4. Live at **https://369degrees-platform.netlify.app**. (Custom domain later: Domain management → add e.g. `app.369degrees.co.za`.)

## 2. Supabase sign-in links (2 min)
Supabase → project unsdlslapjpzyjoghhen → Authentication → **URL Configuration**:
- Site URL: `https://369degrees-platform.netlify.app`
- Redirect URLs → add: `https://369degrees-platform.netlify.app/**`

## 3. Make sign-up emails reach customers (choose one)
Supabase's built-in email only sends to your own team's addresses, so real customers won't get the confirmation email.
- **Recommended:** Authentication → Emails → **SMTP Settings** → use Resend (host `smtp.resend.com`, port 465, user `resend`, password = a Resend API key) after verifying a domain such as `369degrees.co.za` in Resend (Resend → Domains → Add → copy the DNS records into your DNS host).
- **Fastest for a first sale:** Authentication → Sign In / Providers → Email → turn **off** "Confirm email". Sign-up then works instantly. Turn it back on once SMTP is set up.

## 4. Create the two Whop products (10 min)
In Whop (company biz_5LxzQhYQsk1Wbw) create:
- **369 ADHD Productivity System** — one-time, $19, buy-now plan, visible.
- **2026 Budgeting System** — one-time, $19, buy-now plan, visible.
Optional: enable affiliates on each (your 80% / 85% rates).
Send me both product IDs (`prod_…`). I link them (one SQL line each) and the "Get instant access" button switches on. Until then the product pages show "Checkout opens shortly" with an email list — nothing breaks.
Check the existing Whop webhook (pointing to `…/functions/v1/whop-webhook`) is company-wide and includes `payment.succeeded` and `dispute.created`.

## 5. Do one real purchase
Create a 100%-off Whop promo code (or pay $19 yourself), buy Product 4 on the live site while signed in, and confirm it appears in **My Library**. That proves payment → webhook → entitlement → access end to end.

## 6. Legal details
Fill the yellow placeholders on /terms, /privacy, /contact: registered company name + number, physical address, Information Officer (name + email), support email, WhatsApp number, business hours. Have the refund wording checked by your legal adviser.

## Code into GitHub (so Netlify can auto-deploy later)
Give Claude Code `369-launch.patch` with this prompt:
> In the Digiproductbuilder repo, check out branch `phase-a-ai-whop-discovery`, run `git am 369-launch.patch`, then `npm ci && npm run verify`. If verify passes, push the branch. Do not redeploy any Supabase functions or re-run migrations — they are already live. Then in Netlify, link project 369degrees-platform to this repo/branch (build command `npm run build`, publish `dist`; env vars are already set).
