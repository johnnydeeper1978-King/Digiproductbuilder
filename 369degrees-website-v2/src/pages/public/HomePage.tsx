import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

const START_CARDS: [string, string, string, boolean][] = [
  ["01", "What I Know", "Turn existing knowledge or experience into a product opportunity.", true],
  ["02", "What I'm Interested In", "Explore ideas around subjects you naturally want to learn and talk about.", false],
  ["03", "Skills I Already Have", "Identify practical skills that can solve a valuable customer problem.", false],
  ["04", "An Idea I Have", "Turn an early idea into a clearer product direction.", false],
  ["05", "A Market Opportunity", "Start with a customer problem or market demand you have noticed.", false],
  ["06", "I Have No Idea Yet", "Start from zero and explore possible directions with guided discovery.", false],
];

const STEPS: [string, string, string][] = [
  ["1", "Discover", "Find your opportunity"],
  ["2", "Blueprint", "Get your plan"],
  ["3", "Build", "Create the product"],
  ["4", "Launch", "Go to market"],
  ["5", "Sell", "Reach your audience"],
  ["6", "Scale", "Grow what works"],
  ["7", "Automate", "Save time"],
  ["8", "AI Workforce", "Delegate to AI"],
];

const FEATURES: [string, string, string, string][] = [
  ["❖", "AI Blueprint", "A step-by-step plan for your product, audience and pricing direction.", "/discover"],
  ["⚙", "$47 Builder", "Turn the blueprint into a real, sellable digital product.", "/builder"],
  ["◫", "Marketplace", "List and sell your product — or promote others and earn.", "/marketplace"],
  ["↗", "Affiliate", "Refer, promote and earn across the 369 ecosystem.", "/get-started"],
];

const JOURNEY: [string, string, string][] = [
  ["FREE", "Discover", "Answer guided questions about your interests, skills, experience, ideas and opportunities."],
  ["YOUR DIRECTION", "Blueprint", "See potential products, audiences, problems, formats and pricing directions."],
  ["$47 ONE-TIME", "Build", "Follow a structured journey to develop your product, offer, brand and launch system."],
  ["EXECUTE", "Launch & Sell", "Prepare your marketing, content and sales path and take the product to market."],
  ["PREMIUM", "AI Workforce", "Move toward a future where an AI CEO coordinates specialist AI employees."],
];

const FAQS: [string, string][] = [
  ["Do I need any technical skills?", "No. The platform guides you through each step and does the heavy lifting. If you can answer questions about yourself, you can use it."],
  ["How much does it cost?", "Discovery is completely free. The Digital Product Builder is a one-time $47 and lets you create up to 3 product projects. The AI Workforce is a separate future premium offer."],
  ["What kind of products can I create?", "Digital products — ebooks and guides, templates, toolkits, spreadsheets, checklists, Notion systems, courses and more — matched to your skills, interests and audience."],
  ["How long does it take to see results?", "Discovery takes a few minutes. Building depends on your product and the time you put in — the Builder always shows you one clear next action, so you're never stuck."],
  ["Is there a money-back guarantee?", "Discovery is free, so you can see the direction and value before you pay anything. Refunds on the $47 Builder follow our checkout provider's policy at the time of purchase."],
];

export function HomePage() {
  return (
    <>
      <Seo title="369 Degrees — the AI-powered platform to discover, build & sell your digital product"
        description="Discover your best digital product opportunity, build it step by step, launch it, sell it and scale it with an AI workforce." />

      {/* 1. Dark AI-platform hero */}
      <section className="hero-dark">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">THE AI-POWERED DIGITAL PRODUCT PLATFORM</div>
            <h1>Discover, build and sell your <em>digital product</em> — end to end.</h1>
            <p className="lead">369 Degrees helps you find your best digital product opportunity, build it step by step, launch it, sell it and eventually scale it with an AI workforce.</p>
            <div className="hero-ctas">
              <Link className="btn primary" to="/discover">Start Free Discovery →</Link>
              <Link className="btn outline" style={{ color: "#fff", borderColor: "#33486a" }} to="/how-it-works">See How It Works</Link>
            </div>
            <div className="checks">
              <span>AI-guided</span><span>No technical skills needed</span><span>Complete step-by-step system</span>
            </div>
          </div>
          <div className="hv">
            <div className="hv-top"><span>YOUR PRODUCT JOURNEY</span><span className="hv-tag">EXAMPLE</span></div>
            <h4>AI Content Toolkit</h4>
            <p className="hv-sub">A product direction generated from Discovery</p>
            <div className="hv-bar"><i style={{ width: "42%" }} /></div>
            <div className="hv-step done"><span className="d" />Opportunity found</div>
            <div className="hv-step done"><span className="d" />Market research</div>
            <div className="hv-step done"><span className="d" />Audience defined</div>
            <div className="hv-step cur"><span className="d" />Offer creation</div>
            <div className="hv-step"><span className="d" />Product creation</div>
            <div className="hv-focus"><small>CURRENT FOCUS</small><strong>Create your core offer</strong></div>
          </div>
        </div>
      </section>

      {/* 2. 8-step journey rail */}
      <section className="steps">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">HOW IT WORKS</div>
            <h2>Your journey to a digital product business.</h2>
            <p>One clear path — from your first idea to a product you can sell and scale.</p>
          </div>
          <div className="steps-rail">
            {STEPS.map(([n, title, sub]) => (
              <div key={n} className="stepc"><div className="circle">{n}</div><b>{title}</b><small>{sub}</small></div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link className="btn primary" to="/discover">Start Free Discovery →</Link>
          </div>
        </div>
      </section>

      {/* 3. Feature cards */}
      <section className="quick">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">THE COMPLETE SYSTEM</div>
            <h2>Everything you need — from idea to income.</h2>
            <p>A connected platform to create, launch, sell and grow digital products, with AI guidance at every step.</p>
          </div>
          <div className="fcards">
            {FEATURES.map(([ico, title, body, to]) => (
              <Link key={title} className="fcard" to={to}>
                <div className="fico">{ico}</div><h3>{title}</h3><p>{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Start with what you have */}
      <section className="quick" id="discover" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">START WITH WHAT YOU HAVE</div>
            <h2>You may already have something worth selling.</h2>
            <p>Your knowledge, interests, skills, experiences and market opportunities can become digital products. Choose a starting point and discover where it could lead.</p>
          </div>
          <div className="start-grid">
            {START_CARDS.map(([num, title, body, active]) => (
              <div key={num} className={active ? "start-card active" : "start-card"}>
                <div className="num">{num}</div><h3>{title}</h3><p>{body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 34 }}>
            <Link className="btn primary" to="/discover">Start Free Discovery →</Link>
          </div>
        </div>
      </section>

      {/* 5. The real problem */}
      <section className="dark-section">
        <div className="container problem-grid">
          <div>
            <div className="eyebrow">THE REAL PROBLEM</div>
            <h2>The hardest part isn't creating a digital product.<br /><em>It's knowing what to do first.</em></h2>
          </div>
          <div className="problem-list">
            <div className="problem"><b>01</b><strong>“What should I sell?”</strong></div>
            <div className="problem"><b>02</b><strong>“Who would actually buy it?”</strong></div>
            <div className="problem"><b>03</b><strong>“How do I create it?”</strong></div>
            <div className="problem"><b>04</b><strong>“What do I do after it's finished?”</strong></div>
            <p style={{ color: "#91a0b4", lineHeight: 1.6, marginTop: 25 }}>Most people don't fail because they lack tools. They stop because the path is unclear.</p>
          </div>
        </div>
      </section>

      {/* 6. Before / After */}
      <section className="ba">
        <div className="container">
          <div className="section-head"><div className="eyebrow">BEFORE → AFTER</div><h2>From overwhelmed to a clear path.</h2></div>
          <div className="ba-grid">
            <div className="ba-card ba-before">
              <div className="eyebrow">BEFORE</div>
              <h3>Stuck and guessing.</h3>
              <div className="ba-list">
                <div>Not knowing what to sell</div>
                <div>Guessing who would actually buy</div>
                <div>No plan once the idea exists</div>
                <div>Tools everywhere, no direction</div>
              </div>
            </div>
            <div className="ba-card ba-after">
              <div className="eyebrow">AFTER</div>
              <h3>A clear path to income.</h3>
              <div className="ba-list">
                <div>A product direction that fits you</div>
                <div>A blueprint you can actually act on</div>
                <div>A step-by-step build, one stage at a time</div>
                <div>One clear next action, always</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How it works — detail */}
      <section className="workflow" id="how">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">THE JOURNEY IN DETAIL</div>
            <h2>From “I don't know” to “I know exactly what to do next.”</h2>
          </div>
          <div className="journey">
            {JOURNEY.map(([tag, title, body]) => (
              <div key={title} className="journey-card"><div className="tag">{tag}</div><h3>{title}</h3><p>{body}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Free Discovery split */}
      <section className="discovery-section">
        <div className="container split">
          <div>
            <div className="eyebrow">FREE DIGITAL PRODUCT DISCOVERY</div>
            <h2>Discover your digital product opportunity before you build anything.</h2>
            <p className="lead">Answer interactive questions and receive a structured Digital Product Blueprint designed to give you direction.</p>
            <div className="checklist">
              {["What you could sell", "Product opportunities", "Best audience", "Customer problems", "Potential pricing", "Product format", "Personal vs faceless", "Strengths & interests", "Market opportunities"].map((c) => <div key={c} className="check">{c}</div>)}
            </div>
            <Link className="btn primary" to="/discover">Start My Free Discovery →</Link>
          </div>
          <div className="blueprint">
            <div className="blueprint-head"><span>DIGITAL PRODUCT BLUEPRINT</span><span>EXAMPLE PREVIEW</span></div>
            <h3>AI Content Toolkit for Independent Businesses</h3>
            <div className="insights">
              <div className="insight"><span>AUDIENCE</span><b>Independent service businesses</b></div>
              <div className="insight"><span>CORE PROBLEM</span><b>Inconsistent content creation</b></div>
              <div className="insight"><span>PRODUCT FORMAT</span><b>Templates + guide</b></div>
              <div className="insight"><span>PRICE DIRECTION</span><b>$29–$79 starting range</b></div>
            </div>
            <div style={{ marginTop: 16, padding: 15, background: "#f4f7fb", borderRadius: 13, fontSize: 12, lineHeight: 1.5 }}>
              <b>Next validation steps</b><br />Investigate the problem, audience and willingness to pay before building the full product.
            </div>
          </div>
        </div>
      </section>

      {/* 9. The $47 Builder */}
      <section className="builder-sec" id="builder">
        <div className="container builder-grid">
          <div>
            <div className="eyebrow">THE DIGITAL PRODUCT BUILDER</div>
            <h2 style={{ fontSize: "clamp(34px,5vw,62px)", lineHeight: 1, letterSpacing: "-.06em", margin: "0 0 18px" }}>Don't just get an idea. <span style={{ color: "#78a7ff" }}>Build the business around it.</span></h2>
            <p style={{ color: "#9dacc0", fontSize: 18, lineHeight: 1.65 }}>A step-by-step system for turning your direction into a digital product business.</p>
            <div className="price">$47 <small>ONE-TIME</small></div>
            <p style={{ color: "#9dacc0" }}>Create up to 3 digital product businesses.</p>
            <div className="feature-groups">
              <div className="feature"><b>Validate</b><p>Research the market, audience, customer pain and opportunity.</p></div>
              <div className="feature"><b>Create</b><p>Build your offer and product using guided prompts and templates.</p></div>
              <div className="feature"><b>Build</b><p>Develop brand, landing page and business infrastructure direction.</p></div>
              <div className="feature"><b>Market</b><p>Plan content, scripts, UGC, faceless content and marketing.</p></div>
            </div>
            <Link className="btn primary" to="/builder">Unlock the Digital Product Builder — $47 →</Link>
          </div>
          <div className="builder-window">
            <div className="barrow"><span>PRODUCT JOURNEY</span><span style={{ color: "var(--blue)" }}>42% COMPLETE</span></div>
            <div className="progressline"><i style={{ width: "42%" }} /></div>
            <h3>AI Content Toolkit</h3>
            <div className="task done"><i />Opportunity</div>
            <div className="task done"><i />Market Research</div>
            <div className="task done"><i />Audience</div>
            <div className="task done"><i />Customer Problems</div>
            <div className="task current"><i />Offer Creation</div>
            <div className="task"><i />Product Creation</div>
            <div className="task"><i />Branding</div>
            <div className="task"><i />Landing Page</div>
            <div className="next"><small>CURRENT FOCUS</small><strong>Create Your Core Offer</strong>
              <Link className="btn primary" style={{ padding: "10px 13px", fontSize: 11 }} to="/builder">Open Step →</Link></div>
          </div>
        </div>
      </section>

      {/* 10. Marketplace */}
      <section className="market" id="marketplace">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">THE 369 MARKETPLACE</div>
            <h2>Build your own product. Or earn by selling someone else's.</h2>
            <p>Discover products, sell your own products and participate in the marketplace ecosystem.</p>
          </div>
          <div className="market-tabs"><button className="tab active">Explore Products</button><button className="tab">Sell Your Product</button><button className="tab">Promote &amp; Earn</button></div>
          <div className="products">
            <div className="product"><div className="cover">AI CONTENT<br />TOOLKIT</div><div className="product-body"><span className="badge">EXAMPLE LISTING</span><h3>AI Content Toolkit</h3><div className="meta"><span>Templates + Guide</span><b>$49</b></div></div></div>
            <div className="product"><div className="cover">CREATOR<br />LAUNCH SYSTEM</div><div className="product-body"><span className="badge">EXAMPLE LISTING</span><h3>Creator Launch System</h3><div className="meta"><span>Course + Workbook</span><b>$79</b></div></div></div>
            <div className="product"><div className="cover">DIGITAL PRODUCT<br />STARTER KIT</div><div className="product-body"><span className="badge">AFFILIATE AVAILABLE · EXAMPLE</span><h3>Digital Product Starter Kit</h3><div className="meta"><span>Templates</span><b>$29</b></div></div></div>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}><Link className="btn dark" to="/marketplace">Explore the Marketplace →</Link></div>
        </div>
      </section>

      {/* 11. Two ways to earn */}
      <section className="earn">
        <div className="container">
          <div className="section-head"><div className="eyebrow">TWO WAYS TO MAKE MONEY</div><h2>Choose how you want to earn.</h2></div>
          <div className="earn-grid">
            <div className="earn-card"><div className="eyebrow">PATH 01</div><h3>Create &amp; Sell</h3><div className="path">CREATE → LIST → SELL</div><p>Create your own digital product and sell it through the Marketplace, your website or your social channels.</p><Link className="btn primary" to="/builder">Build My Own Product →</Link></div>
            <div className="earn-card dark-card"><div className="eyebrow">PATH 02</div><h3>Discover &amp; Promote</h3><div className="path">DISCOVER → PROMOTE → EARN COMMISSION</div><p>Find eligible products you want to promote and earn commissions when eligible sales are generated.</p><Link className="btn primary" to="/marketplace">Explore Products to Promote →</Link></div>
          </div>
        </div>
      </section>

      {/* 12. Learn program */}
      <section className="program" id="learn">
        <div className="container">
          <div className="section-head"><div className="eyebrow">LEARN HOW TO SELL</div><h2>Building the product is only half the job.</h2><p>Learn the skills behind getting attention, creating demand and selling digital products.</p></div>
          <div className="topic-grid">
            {["Content Strategy", "UGC", "Faceless Content", "Personal Brand", "Viral Research", "Hooks", "Scripts", "Posting Strategy", "Content Psychology", "Buyer Psychology", "Offers", "Landing Pages", "Affiliate Marketing"].map((t) => <div key={t} className="topic">{t}</div>)}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}><Link className="btn primary" to="/how-it-works">Explore the Digital Marketing Program →</Link></div>
        </div>
      </section>

      {/* 13. Affiliate */}
      <section className="affiliate-sec">
        <div className="container">
          <div className="eyebrow">AFFILIATE PROGRAM</div>
          <h2>Learn. Build. Sell. Refer. Earn.</h2>
          <div className="learn-path">LEARN <span>→</span> BUILD <span>→</span> SELL <span>→</span> REFER <span>→</span> EARN</div>
          <div className="affiliate-cards">
            <div className="affiliate-card"><b>Sell 369 Degrees Products</b><p>Promote eligible 369 Degrees offers through the affiliate ecosystem.</p></div>
            <div className="affiliate-card"><b>Promote Marketplace Products</b><p>Promote eligible products created by Marketplace sellers.</p></div>
            <div className="affiliate-card"><b>Refer Recommended Tools</b><p>Potentially earn from selected recommended tools and platforms.</p></div>
          </div>
          <Link className="btn primary" style={{ marginTop: 35 }} to="/get-started">Explore the Affiliate Program →</Link>
        </div>
      </section>

      {/* 14. AI Workforce */}
      <section className="ai-sec" id="ai">
        <div className="container ai-grid">
          <div>
            <div className="eyebrow">THE AI WORKFORCE · PREMIUM</div>
            <h2>Don't just use AI. <em>Hire your AI workforce.</em></h2>
            <p>A future premium layer where you communicate with one AI CEO, who can coordinate specialist AI employees around your digital product business.</p>
            <Link className="btn primary" to="/workforce">Explore the AI Workforce →</Link>
            <div style={{ fontSize: 11, color: "#66758b", marginTop: 14 }}>Future experience concept — capabilities shown are illustrative.</div>
          </div>
          <div className="ceo">
            <div className="ceo-head"><b>YOUR AI CEO</b><span className="status">FUTURE EXPERIENCE</span></div>
            <h3>What would you like the business to focus on?</h3>
            <div className="prompt">Research a new product opportunity for my audience…</div>
            <div className="workers">
              {["Market Researcher", "Customer Analyst", "Product Strategist", "Content Strategist", "Script Specialist", "Performance Analyst"].map((w) => <div key={w} className="worker"><span />{w}</div>)}
            </div>
            <div style={{ marginTop: 20, padding: 16, border: "1px solid #26384f", borderRadius: 14, color: "#93a2b6", fontSize: 12 }}>YOU → AI CEO → SPECIALIST AI EMPLOYEES</div>
          </div>
        </div>
      </section>

      {/* 15. Product experience previews */}
      <section className="experience">
        <div className="container">
          <div className="section-head"><div className="eyebrow">PRODUCT EXPERIENCE</div><h2>One place to see your business moving forward.</h2><p>Product previews are visual demonstrations of the intended experience — not live data or connected functionality.</p></div>
          <div className="mockup-row">
            <div className="mini-window"><h4>Discovery</h4><div style={{ fontSize: 12, color: "#788496", marginBottom: 12 }}>4 / 6 completed</div><div className="mini-chart" /></div>
            <div className="mini-window"><h4>Digital Product Blueprint</h4><div style={{ fontSize: 12, color: "#788496", marginBottom: 12 }}>Your opportunity, audience and product direction</div><div style={{ height: 90, background: "#f2f5f9", borderRadius: 12, padding: 15, fontSize: 12, fontWeight: 800 }}>RECOMMENDED OPPORTUNITY<br /><span style={{ fontWeight: 500, color: "#718096" }}>AI Content Toolkit</span></div></div>
            <div className="mini-window"><h4>Product Journey</h4><div style={{ fontSize: 12, color: "#788496", marginBottom: 12 }}>42% complete · Next action visible</div><div className="mini-chart" /></div>
            <div className="mini-window"><h4>Marketplace</h4><div style={{ fontSize: 12, color: "#788496", marginBottom: 12 }}>Discover, list, sell or promote</div><div style={{ height: 90, background: "#eef4ff", borderRadius: 12, padding: 15, fontSize: 12, fontWeight: 800 }}>EXAMPLE MARKETPLACE<br /><span style={{ fontWeight: 500, color: "#718096" }}>Digital products + creator offers</span></div></div>
          </div>
        </div>
      </section>

      {/* 16. Strategy call */}
      <section className="call">
        <div className="container">
          <div className="call-card">
            <div>
              <div className="eyebrow">NEED A CLEARER NEXT STEP?</div>
              <h2>Need help deciding your next move?</h2>
              <p className="lead">Book a conversation to explore where you are, what you're trying to build and which part of the 369 Degrees ecosystem may fit your next step.</p>
              <Link className="btn primary" to="/book-a-call">Book Your Call →</Link>
            </div>
            <div className="calendar">
              <b>Book a Call</b>
              <p style={{ fontSize: 12, color: "#7b8798" }}>Choose a time that works for you.</p>
              <Link className="slot" to="/book-a-call">Select a time →</Link>
              <span className="slot">Discuss your direction</span>
              <span className="slot">Understand your options</span>
            </div>
          </div>
        </div>
      </section>

      {/* 17. FAQ */}
      <section className="faq">
        <div className="container">
          <div className="section-head"><div className="eyebrow">FAQ</div><h2>Frequently asked questions.</h2></div>
          <div className="faq-list">
            {FAQS.map(([q, a]) => (
              <details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      {/* 18. Final CTA banner */}
      <section className="final-banner">
        <div className="container">
          <div className="inner">
            <div className="crown">♛</div>
            <h2>Your digital product journey starts here.</h2>
            <p>Start with the right direction — discover what you could sell, who it could help and where to begin. Free, and no idea required.</p>
            <Link className="btn primary" to="/discover">Start Free Discovery →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
