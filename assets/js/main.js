/* =========================================================================
   main.js — renders content from content.js and drives the logo sequence:
   hold → clockwise spin (+ shrink, wordmark→mark swap) → travel left (+ grow)
   → descend → docked half-hidden at the footer (rides with it on release).
   Internal QA API: window.__heroState() returns live values (used by the QA
   harness; harmless otherwise). URL hook: ?qa=<0..1> pins progress.
   ========================================================================= */
(function () {
  "use strict";

  var C = window.SITE_CONTENT;
  if (!C) return;

  var doc = document;
  var root = doc.documentElement;

  /* ---------------- theme ---------------- */
  var themeMap = {
    stage: "--stage",
    surface: "--surface",
    hairline: "--hairline",
    borderStrong: "--border-strong",
    ink1: "--ink-1",
    ink2: "--ink-2",
    ink3: "--ink-3",
    accent: "--accent",
    accentHover: "--accent-hover",
    accentActive: "--accent-active",
    focus: "--focus"
  };
  Object.keys(themeMap).forEach(function (k) {
    if (C.theme && C.theme[k]) root.style.setProperty(themeMap[k], C.theme[k]);
  });

  /* ---------------- meta ---------------- */
  if (C.meta) {
    if (C.meta.title) doc.title = C.meta.title;
    var md = doc.getElementById("meta-description");
    if (md && C.meta.description) md.setAttribute("content", C.meta.description);
    var tc = doc.querySelector('meta[name="theme-color"]');
    if (tc && C.theme && C.theme.stage) tc.setAttribute("content", C.theme.stage);
  }

  function setText(id, value) {
    var el = doc.getElementById(id);
    if (el && typeof value === "string") el.textContent = value;
  }

  /* ---------------- images ---------------- */
  var logoWordmark = C.logos ? C.logos.wordmark : "";
  var logoMark = C.logos ? C.logos.mark : "";
  ["hero-wordmark", "footer-logo"].forEach(function (id) {
    var el = doc.getElementById(id);
    if (el && logoWordmark) el.src = logoWordmark;
  });
  ["hero-mark", "footer-endmark"].forEach(function (id) {
    var el = doc.getElementById(id);
    if (el && logoMark) el.src = logoMark;
  });
  /* re-measure once late resources (e.g. the footer logo) change the footer height */
  var flogo = doc.getElementById("footer-logo");
  if (flogo) {
    flogo.addEventListener("load", function () { onResize(); });
    flogo.addEventListener("error", function () { onResize(); });
  }

  /* ---------------- footer content ---------------- */
  if (C.footer) {
    setText("footer-blurb", C.footer.blurb);
    setText("footer-legal", C.footer.legal);
    setText("footer-credit", C.footer.creditNote);

    var em = doc.getElementById("footer-email");
    if (em && C.footer.contact) {
      em.href = "mailto:" + C.footer.contact.email;
      em.textContent = C.footer.contact.email;
    }
    var ph = doc.getElementById("footer-phone");
    if (ph && C.footer.contact) {
      ph.href = "tel:" + String(C.footer.contact.phone).replace(/[^+\d]/g, "");
      ph.textContent = C.footer.contact.phone;
    }
    setText("footer-address", C.footer.contact ? C.footer.contact.address : "");

    var explore = doc.getElementById("footer-explore");
    if (explore && Array.isArray(C.footer.explore)) {
      explore.innerHTML = "";
      C.footer.explore.forEach(function (l) {
        var li = doc.createElement("li");
        var a = doc.createElement("a");
        a.href = l.anchor;
        a.textContent = l.label;
        li.appendChild(a);
        explore.appendChild(li);
      });
    }
  }

  /* ---------------- reduced motion ---------------- */
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = mqReduce.matches;
  if (reduced) root.classList.add("reduced-motion");
  if (mqReduce.addEventListener) {
    mqReduce.addEventListener("change", function () { window.location.reload(); });
  }

  /* ---------------- QA hook ---------------- */
  var params = new URLSearchParams(window.location.search);
  var qaRaw = params.get("qa");
  var qaPinned = null;
  if (qaRaw !== null) {
    var qv = parseFloat(qaRaw);
    if (Number.isFinite(qv)) qaPinned = Math.min(1, Math.max(0, qv));
  }
  var qaMode = qaPinned !== null;
  if (qaMode) {
    root.classList.add("qa-active");
    root.dataset.qa = String(qaPinned);
  }

  /* ---------------- elements ---------------- */
  var heroEl = doc.getElementById("story");
  var frameEl = doc.getElementById("hero-frame");
  var wordmarkEl = doc.getElementById("hero-wordmark");
  var markboxEl = doc.getElementById("hero-markbox");
  var markEl = doc.getElementById("hero-mark");
  var footerEl = doc.getElementById("footer");
  var stickyEl = doc.querySelector(".hero__sticky");

  /* ---------------- math helpers ---------------- */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
  function cubic(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(p, a, b) { return smooth((p - a) / (b - a)); }
  function cub(p, a, b) { return cubic((p - a) / (b - a)); }

  var A = Object.assign(
    { spinTurns: 1, dockXFrac: 0.30, maxRadiusVh: 0.46, edgeMarginPx: 12 },
    C.animation || {}
  );

  /* ---------------- geometry ---------------- */
  var geo = {};
  function computeGeo() {
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var rect = heroEl.getBoundingClientRect();
    geo.heroTop = rect.top + window.scrollY;
    geo.travel = Math.max(1, heroEl.offsetHeight - vh);
    geo.vh = vh;
    geo.vw = vw;
    geo.frameW = frameEl.offsetWidth;
    geo.frameH = frameEl.offsetHeight;
    geo.markBoxW = markboxEl.offsetWidth || 1;
    geo.sC = 0.60;

    var footerH = footerEl.offsetHeight;
    var mobile = vw <= 640;
    /* final radius: fits above the footer edge with breathing room, and
       always fully visible horizontally */
    var r = Math.min(A.maxRadiusVh * vh, vh - footerH - 20, vw / 2 - A.edgeMarginPx);
    r = Math.max(110, r);
    geo.rFinal = r;

    /* vertical offset of the mark's centre from the frame centre inside the
       wordmark lockup (it must be cancelled while the logo grows/descends so
       the mark — not the lockup — lands exactly on the dock line) */
    geo.offY = (0.5 - ((C.constants && C.constants.wordmarkDiamondCenterYFrac) || 0.3203)) * geo.frameH;

    var minX = r + A.edgeMarginPx;
    var maxX = vw - r - A.edgeMarginPx;
    geo.dockX = Math.min(Math.max(A.dockXFrac * vw, minX), Math.max(minX, maxX));
    if (mobile) {
      /* keep the docked emblem clear of the footer's own small logo (left column) */
      var flogoEl = footerEl.querySelector('.footer__logo');
      var logoRight = flogoEl ? flogoEl.getBoundingClientRect().right : 180;
      geo.dockX = Math.min(Math.max(logoRight + 10 + r, minX), Math.max(minX, maxX));
    }
    geo.sEnd = (2 * r) / geo.markBoxW;
    geo.txEnd = geo.dockX - vw / 2;
    geo.tyEnd = vh / 2;

    root.style.setProperty("--dock-x", geo.dockX.toFixed(2) + "px");
    root.style.setProperty("--dock-r", r.toFixed(2) + "px");
    root.style.setProperty("--dock-drop", Math.max(0, footerH - vh).toFixed(2) + "px");
  }

  /* ---------------- render ---------------- */
  var st = { p: 0, spin: 0, tx: 0, ty: 0, sF: 1, fade: 0 };

  function render(p) {
    p = clamp01(p);
    var spin = A.spinTurns * 360 * cub(p, 0.18, 0.42);
    var sF, tx = 0, ty = 0;
    if (p <= 0.42) {
      sF = 1 - 0.40 * cub(p, 0.18, 0.42);
    } else if (p <= 0.70) {
      var u = cub(p, 0.42, 0.70);
      sF = geo.sC + (geo.sEnd - geo.sC) * u;
      tx = geo.txEnd * u;
    } else {
      sF = geo.sEnd;
      tx = geo.txEnd;
      ty = geo.tyEnd * cub(p, 0.70, 0.92);
    }
    var fade = seg(spin, 150, 210); /* wordmark→mark swap, hidden inside the spin */
    /* cancel the lockup-internal offset once the spin has settled, so the
       MARK's centre - not the lockup's - tracks the designed path and dock */
    var comp = geo.offY * sF * seg(p, 0.36, 0.42);

    /* phones: the footer is taller than the screen; near the end of the
       sequence the mark blends toward the footer-child layer (see CSS
       .docked-mobile) which rides the footer rigidly, so the docked half
       stays visible at the top of the viewport */
    var kc = seg(p, 0.99, 1);
    if (kc > 0 && geo.vw <= 640 && stickyEl) {
      var sTop = stickyEl.getBoundingClientRect().top;
      var fBottom = footerEl.getBoundingClientRect().bottom;
      var desired = fBottom - geo.vh;
      var corrected = desired - sTop - geo.vh / 2;
      ty = ty + (corrected - ty) * kc;
    }
    root.classList.toggle("docked-mobile", p >= 0.999 && geo.vw <= 640);

    st.p = p; st.spin = spin; st.tx = tx; st.ty = ty; st.sF = sF; st.fade = fade; st.comp = comp;

    frameEl.style.transform =
      "translate(-50%, -50%) translate(" + tx.toFixed(2) + "px, " + (ty + comp).toFixed(2) + "px) rotate(" +
      spin.toFixed(2) + "deg) scale(" + sF.toFixed(4) + ")";
    wordmarkEl.style.opacity = (1 - fade).toFixed(3);
    markboxEl.style.opacity = fade.toFixed(3);
  }

  /* ---------------- loop ---------------- */
  var pSmooth = 0;
  var pTarget = 0;
  var running = false;
  var rafId = null;
  var lastTime = 0;

  function wake() {
    if (qaMode || reduced) return;
    if (running) return;
    running = true;
    lastTime = performance.now();
    rafId = window.requestAnimationFrame(tick);
  }

  function tick(now) {
    rafId = null;
    var dt = Math.min(64, Math.max(1, now - lastTime));
    lastTime = now;
    var y = window.scrollY || window.pageYOffset || 0;
    pTarget = clamp01((y - geo.heroTop) / geo.travel);
    var a = 1 - Math.pow(1 - 0.12, dt / 16.667);
    pSmooth += (pTarget - pSmooth) * a;
    if (Math.abs(pTarget - pSmooth) < 0.0008) pSmooth = pTarget;
    if (pTarget >= 0.999) pSmooth = 1;
    render(pSmooth);
    if (pSmooth !== pTarget) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      running = false;
    }
  }

  function stopLoop() {
    running = false;
    if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
  }

  function setWillChange(on) {
    if (frameEl) frameEl.style.willChange = on ? "transform" : "";
  }

  function currentP() {
    var y = window.scrollY || window.pageYOffset || 0;
    return clamp01((y - geo.heroTop) / geo.travel);
  }

  function onScroll() { wake(); }

  var resizeScheduled = false;
  function onResize() {
    if (resizeScheduled) return;
    resizeScheduled = true;
    window.requestAnimationFrame(function () {
      resizeScheduled = false;
      computeGeo();
      if (qaMode) {
        render(qaPinned);
        return;
      }
      if (reduced) return;
      pTarget = currentP();
      render(pSmooth);
      wake();
    });
  }

  if ("IntersectionObserver" in window && heroEl) {
    var hio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setWillChange(true);
          wake();
        } else {
          setWillChange(false);
          stopLoop();
        }
      });
    }, { rootMargin: "10%" });
    hio.observe(heroEl);
  }

  /* ---------------- init ---------------- */
  computeGeo();

  if (qaMode) {
    pSmooth = pTarget = qaPinned;
    render(qaPinned);
  } else if (reduced) {
    /* static layout handled entirely by the .reduced-motion CSS */
  } else {
    pSmooth = pTarget = currentP();
    render(pSmooth);
    setWillChange(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("load", function () { onResize(); });
    wake();
  }

  /* ---------------- internal QA API ---------------- */
  window.__heroState = function () {
    var fr = frameEl.getBoundingClientRect();
    var mk = markboxEl.getBoundingClientRect();
    var ft = footerEl.getBoundingClientRect();
    return {
      scrollY: (window.scrollY || window.pageYOffset || 0),
      p: pSmooth,
      pTarget: pTarget,
      spin: st.spin,
      tx: st.tx,
      ty: st.ty,
      sF: st.sF,
      fade: st.fade,
      reduced: reduced,
      qa: qaMode ? qaPinned : null,
      heroTop: geo.heroTop,
      travel: geo.travel,
      dockX: geo.dockX,
      dockR: geo.rFinal,
      frame: { x: fr.x, y: fr.y, w: fr.width, h: fr.height },
      markbox: { x: mk.x, y: mk.y, w: mk.width, h: mk.height },
      footer: { top: ft.top, height: ft.height },
      frameTransform: frameEl.style.transform,
      wordmarkOpacity: wordmarkEl ? parseFloat(wordmarkEl.style.opacity || "1") : null,
      markboxOpacity: markboxEl ? parseFloat(markboxEl.style.opacity || "1") : null
    };
  };

  root.dataset.ready = "true";
})();
