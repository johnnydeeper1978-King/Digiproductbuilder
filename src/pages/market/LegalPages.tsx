import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

/**
 * Legal page STRUCTURE. Company details are deliberately left as visible
 * placeholders until the owner supplies them — nothing here is invented.
 * Have these pages reviewed by a qualified legal adviser before relying on them.
 */
const TODO = ({ children }: { children: ReactNode }) => <mark className="mk-todo">[To be provided: {children}]</mark>;
const UPDATED = "1 October 2026";

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mk-section mk-pad">
      <Seo title={title} />
      <div className="container mk-legal">
        <div className="eyebrow">369 DEGREES</div>
        <h1>{title}</h1>
        <p className="mk-small">Last updated: {UPDATED}</p>
        {children}
      </div>
    </section>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Use & Purchase">
      <h2>1. Who we are</h2>
      <p>369 Degrees is operated by <TODO>registered company name and registration number</TODO>, <TODO>physical address</TODO>. Contact: <TODO>support email</TODO>.</p>
      <h2>2. Your account</h2>
      <p>You need a free account to save Discovery results, buy products and access what you've bought. Keep your login details private; you're responsible for activity on your account.</p>
      <h2>3. Free Product Discovery</h2>
      <p>Discovery uses AI to suggest digital product opportunities and a Product Guide based on your answers. Suggestions are starting points to test, not guarantees of demand, income or results.</p>
      <h2>4. Buying products</h2>
      <p>Payments are processed securely by our checkout provider, Whop. Prices are shown before you pay. After payment is confirmed, the product appears in your 369 Degrees library.</p>
      <h2>5. Access and licence</h2>
      <p>Products are licensed for your personal use and are accessed online in your account. You may not copy, resell, share your login or redistribute the content. Your own worksheet answers belong to you and can be downloaded.</p>
      <h2>6. Refunds</h2>
      <p>Because access to digital content is given immediately after payment, purchases are final and non-refundable, except where the law requires otherwise. If something isn't working, contact us and we'll help. <TODO>confirm refund wording with your legal adviser, including consumer-protection requirements</TODO></p>
      <h2>7. Payment disputes</h2>
      <p>If a payment is disputed or reversed, access to the related product is paused while the dispute is open.</p>
      <h2>8. Educational content only</h2>
      <p>Our products provide general education and organisation tools. They are not medical, psychological, financial, investment, tax or legal advice. Product-specific limits are shown on each product page.</p>
      <h2>9. Liability</h2>
      <p>We provide the platform as-is and are not liable for decisions you make using it, to the extent permitted by law. <TODO>liability clause reviewed by your legal adviser</TODO></p>
      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of the Republic of South Africa. <TODO>confirm</TODO></p>
      <p>See also our <Link to="/privacy">Privacy Policy</Link>.</p>
    </LegalShell>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy (POPIA)">
      <h2>1. Responsible party</h2>
      <p><TODO>registered company name</TODO>, <TODO>physical address</TODO>. Information Officer: <TODO>name and email of the Information Officer</TODO>.</p>
      <h2>2. What we collect</h2>
      <ul>
        <li>Account details: email address and password (stored securely by our authentication provider).</li>
        <li>Discovery answers and the opportunities and Product Guide generated from them.</li>
        <li>Purchase records from our checkout provider (product, amount, date, email). We never receive or store your card details.</li>
        <li>Your saved worksheet answers and lesson progress.</li>
        <li>Waitlist and contact details you choose to give us, and whether you agreed to receive marketing.</li>
      </ul>
      <h2>3. Why we use it</h2>
      <p>To provide your account and products, generate your Discovery results, confirm payments, support you, and — only if you opt in — send you marketing. You can opt out at any time.</p>
      <h2>4. Who processes it</h2>
      <p>Supabase (database and authentication), Whop (payments), Anthropic (AI analysis of Discovery answers) and Netlify (website hosting). Some processing happens outside South Africa under appropriate safeguards. <TODO>confirm cross-border transfer wording</TODO></p>
      <h2>5. Your rights</h2>
      <p>You can ask to access, correct or delete your personal information, and object to processing. Contact the Information Officer above. You may also complain to the Information Regulator of South Africa.</p>
      <h2>6. Security and retention</h2>
      <p>Paid content and your saved answers are protected by access controls tied to your account. We keep information only as long as needed for the purposes above or as required by law. <TODO>retention periods</TODO></p>
    </LegalShell>
  );
}

export function ContactPage() {
  return (
    <LegalShell title="Contact & support">
      <p>Questions about Discovery, a purchase or your access? We're here to help.</p>
      <div className="mk-contact">
        <div><b>Email</b><span><TODO>support email address</TODO></span></div>
        <div><b>WhatsApp</b><span><TODO>WhatsApp business number</TODO></span></div>
        <div><b>Business hours</b><span><TODO>hours and time zone</TODO></span></div>
      </div>
      <h2>Payment or access problems</h2>
      <p>Sign in with the same email address you used at checkout. Purchases link automatically once your email is confirmed. If your product still doesn't appear, send us your checkout email and the product name.</p>
      <p>Prefer to talk it through? <Link to="/book-a-call">Book a call</Link>.</p>
    </LegalShell>
  );
}
