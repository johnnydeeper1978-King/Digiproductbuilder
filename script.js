// Whop checkout links — replace placeholders with real Whop checkout URLs per tier.
const WHOP_LINKS = {
  starter: "https://whop.com/checkout/REPLACE_STARTER_PLAN_ID/",
  "full-roster": "https://whop.com/checkout/REPLACE_FULL_ROSTER_PLAN_ID/",
  managed: "https://whop.com/checkout/REPLACE_MANAGED_PLAN_ID/",
};

document.querySelectorAll("[data-whop]").forEach((el) => {
  const key = el.getAttribute("data-whop");
  const url = WHOP_LINKS[key];
  if (url) {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  }
});

// Smooth-scroll header nav (progressive — anchors already work without this)
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
