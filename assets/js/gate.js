/* Desktop-only gate.
   Loaded synchronously right after the notice markup so it can hide the site
   before anything paints. The site is not offered on phones or on viewports
   narrower than 900px; the notice replaces it and nothing else is laid out.

   Escape hatch for support and QA: append ?desktop=1 to the URL. */
(function () {
  "use strict";

  var MIN = 900;
  var root = document.documentElement;
  var gate = document.getElementById("mobile-gate");
  var brandSlot = document.getElementById("gate-brand");
  if (!gate) return;

  var ua = navigator.userAgent;
  var mobileUA = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Mobile/i.test(ua);
  /* crawlers must still see the real page: mobile-first indexing fetches with a
     smartphone user agent, and a notice-only document would deindex the site */
  var crawler = /Googlebot|Google-InspectionTool|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Applebot|facebookexternalhit|Twitterbot|LinkedInBot|AhrefsBot|SemrushBot|PetalBot/i.test(ua);
  var forced = /[?&]desktop=1(?:&|$)/.test(location.search);

  function apply() {
    var gated = !forced && !crawler && (window.innerWidth < MIN || mobileUA);
    root.classList.toggle("is-gated", gated);
    root.setAttribute("data-gated", gated ? "1" : "0");
    gate.hidden = !gated;
    if (gated) fillBrand();
  }

  /* the brand name lives in content.js only, so the notice borrows it rather
     than repeating a second copy of the string in markup */
  var brandFilled = false;
  function fillBrand() {
    if (brandFilled || !brandSlot) return;
    var C = window.SITE_CONTENT;
    if (!C || !C.brand || !C.brand.name) return;
    brandSlot.textContent = C.brand.name;
    brandFilled = true;
  }

  /* one real affordance: carry the link to the machine that can open it */
  var copyBtn = document.getElementById("gate-copy");
  var urlNote = document.getElementById("gate-url");
  var status = document.getElementById("gate-status");
  var resetTimer = null;

  function reset() {
    if (!copyBtn) return;
    copyBtn.setAttribute("data-state", "idle");
    if (urlNote) urlNote.hidden = true;
    if (status) status.textContent = "";
  }

  function settle(state, message, persist) {
    if (!copyBtn) return;
    copyBtn.setAttribute("data-state", state);
    if (status) status.textContent = message;
    if (resetTimer) window.clearTimeout(resetTimer);
    if (!persist) resetTimer = window.setTimeout(reset, 2600);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyLink() {
    var link = location.origin + location.pathname;
    function done() { settle("done", "Link copied"); }
    function failed() {
      settle("fail", "Copy unavailable, the link is shown below", true);
      if (urlNote) { urlNote.textContent = link.replace(/^https?:\/\//, ""); urlNote.hidden = false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done, function () {
        if (legacyCopy(link)) done(); else failed();
      });
    } else if (legacyCopy(link)) {
      done();
    } else {
      failed();
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", copyLink);
    /* keyboard parity: Enter/Space already click, nothing else to wire */
  }

  apply();
  window.addEventListener("resize", apply, { passive: true });
  document.addEventListener("DOMContentLoaded", function () {
    fillBrand();
    if (root.classList.contains("is-gated")) apply();
  });
})();
