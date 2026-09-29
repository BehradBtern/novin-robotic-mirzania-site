/* =========================================================================
   main.js — renders content from content.js and drives the logo sequence:
   hold → clockwise spin (+ shrink, wordmark→mark swap) → side copy appears
   left/right of the small symbol → rotate left + grow (half clipped at the
   left edge) → travel down into the footer dock. Also renders the programmes
   grid (4–7 photo slots) and the footer.
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
    flogo.setAttribute("width", "1304");
    flogo.setAttribute("height", "1022");
    flogo.addEventListener("load", function () { onResize(); });
    flogo.addEventListener("error", function () { onResize(); });
    if (flogo.complete) window.requestAnimationFrame(function () { onResize(); });
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

  /* ---------------- hero side copy (appears beside the small symbol) ------ */
  var sideLeftEl = doc.getElementById("hero-side-left");
  var sideRightEl = doc.getElementById("hero-side-right");
  function fillSide(el, data) {
    if (!el || !data) return;
    var k = el.querySelector(".hero__side-kicker");
    var h = el.querySelector(".hero__side-title");
    var b = el.querySelector(".hero__side-body");
    if (k && data.kicker) k.textContent = data.kicker;
    if (h && data.title) h.textContent = data.title;
    if (b && data.body) b.textContent = data.body;
  }
  if (C.heroSide) {
    fillSide(sideLeftEl, C.heroSide.left);
    fillSide(sideRightEl, C.heroSide.right);
  }

  /* ---------------- programmes gallery (4–7 photo slots + text) ----------- */
  var galleryGrid = doc.getElementById("gallery-grid");
  if (galleryGrid && C.gallery && Array.isArray(C.gallery.items)) {
    setText("gallery-label", C.gallery.sectionLabel);
    setText("gallery-title", C.gallery.title);
    setText("gallery-intro", C.gallery.intro);
    C.gallery.items.forEach(function (item) {
      var fig = doc.createElement("figure");
      fig.className = "gallery__card";
      var img = doc.createElement("img");
      img.className = "gallery__photo";
      img.src = item.img;
      img.alt = item.alt || "";
      img.loading = "lazy";
      img.decoding = "async";
      var cap = doc.createElement("figcaption");
      var h = doc.createElement("h3");
      h.className = "gallery__card-title";
      h.textContent = item.title;
      var t = doc.createElement("p");
      t.className = "gallery__card-text";
      t.textContent = item.text;
      cap.appendChild(h);
      cap.appendChild(t);
      fig.appendChild(img);
      fig.appendChild(cap);
      galleryGrid.appendChild(fig);
    });
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
    {
      spinTurns: 1,
      heroWidthVw: 92,
      heroWidthVh: 96,
      heroWidthMaxPx: 1600,
      bigDiameterVh: 0.96,
      footerScale: 0.42,
      footerMaxPx: 330,
      edgeMarginPx: 12
    },
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

    /* hero logo size: as large as fits without being clipped at rest */
    var mobile = vw <= 640;
    var frameTargetW;
    if (mobile) {
      frameTargetW = Math.min(0.88 * vw, 0.62 * vh * 1.2757, 520);
    } else {
      frameTargetW = Math.min((A.heroWidthVw / 100) * vw, (A.heroWidthVh / 100) * vh * 1.2757, A.heroWidthMaxPx);
    }
    frameTargetW = Math.max(frameTargetW, 280);
    root.style.setProperty("--frame-w", frameTargetW.toFixed(2) + "px");
    geo.frameW = frameTargetW;
    geo.frameH = frameTargetW / 1.2757;
    geo.markBoxW = 0.5095 * frameTargetW;
    geo.sC = 0.58;

    var footerH = footerEl.offsetHeight;
    geo.footerH = footerH;

    /* enlarged state: exactly half hangs past the left edge (single-axis clip) */
    var rBig = Math.min((A.bigDiameterVh * vh) / 2, vw - A.edgeMarginPx);
    rBig = Math.max(rBig, 120);
    geo.rBig = rBig;

    /* landing state: centred in the footer band at a footer-appropriate size
       (also capped at half the viewport width so phones keep it modest) */
    var rFin = Math.max(Math.min(A.footerScale * footerH, A.footerMaxPx, 0.5 * vw) / 2, 70);
    geo.rFinal = rFin;

    /* vertical offset of the mark's centre from the frame centre inside the
       wordmark lockup (cancelled by the compensation term in render) */
    geo.offY = (0.5 - ((C.constants && C.constants.wordmarkDiamondCenterYFrac) || 0.3203)) * geo.frameH;

    geo.kBig = (2 * rBig) / geo.markBoxW;
    geo.kFin = (2 * rFin) / geo.markBoxW;
    geo.txBig = -vw / 2;                      /* centre-x at the left edge (half clipped) */
    geo.tyDock = vh - rFin - 20;              /* docked just above the viewport bottom edge */

    root.style.setProperty("--dock-r", rFin.toFixed(2) + "px");
  }

  /* ---------------- render ---------------- */
  var st = { p: 0, spin: 0, tx: 0, ty: 0, sF: 1, fade: 0, side: 0 };

  function render(p) {
    p = clamp01(p);

    /* one continuous clockwise turn: spin + shrink (0.10–0.36), hold while the
       side copy shows (0.36–0.66), rotate-left + grow, arriving at the
       enlarged half-clipped state exactly at spin 360 — the mark's exact
       45-degree diamond pose (0.66–0.86) — then travel down to the footer
       dock holding that upright pose (0.86–0.96) */
    var spin =
      A.spinTurns * (180 * cub(p, 0.10, 0.36) +
        180 * cub(p, 0.66, 0.86));

    var sF, targetX = geo.vw / 2, targetY = geo.vh / 2;
    if (p <= 0.36) {
      /* A/B: hold, then spin + shrink in place */
      sF = 1 - (1 - geo.sC) * cub(p, 0.10, 0.36);
    } else if (p <= 0.66) {
      /* C: small symbol holds in the centre; the side copy is visible */
      sF = geo.sC;
    } else if (p <= 0.86) {
      /* D: rotate left + grow — centre travels to the left edge, half ends
         up off-canvas (the visible half stays inside the viewport) */
      var u = cub(p, 0.66, 0.86);
      sF = geo.sC + (geo.kBig - geo.sC) * u;
      targetX = (geo.vw / 2) * (1 - u);
    } else {
      /* E: travel down into the footer dock while settling to landing size */
      var v = cub(p, 0.86, 0.96);
      sF = geo.kBig + (geo.kFin - geo.kBig) * v;
      targetX = (geo.vw / 2) * v;
      targetY = geo.vh / 2 + (geo.tyDock - geo.vh / 2) * v;
    }
    var fade = seg(spin, 90, 150); /* wordmark→mark swap, done inside the turn */

    /* keep the MARK's centre on the target path: cancel the lockup-internal
       offset, including how it rotates with the spin (blended in after the
       turn, so the spin itself stays a natural rigid rotation) */
    var rad = spin * Math.PI / 180;
    var off = geo.offY * sF;
    var cb = seg(p, 0.34, 0.44);
    var tx = (targetX - geo.vw / 2) - off * Math.sin(rad) * cb;
    var ty = (targetY - geo.vh / 2) + off * Math.cos(rad) * cb;

    /* side copy fades in beside the small symbol, out before the growth */
    var soIn = seg(p, 0.38, 0.48);
    var so = soIn * (1 - seg(p, 0.56, 0.64));
    var soShift = (1 - soIn) * 24;
    if (sideLeftEl) {
      sideLeftEl.style.opacity = so.toFixed(3);
      sideLeftEl.style.transform = "translateY(-50%) translateX(" + (-soShift).toFixed(1) + "px)";
    }
    if (sideRightEl) {
      sideRightEl.style.opacity = so.toFixed(3);
      sideRightEl.style.transform = "translateY(-50%) translateX(" + soShift.toFixed(1) + "px)";
    }

    /* docking: hand the mark over to the footer-child layer (CSS .docked-footer) */
    root.classList.toggle("docked-footer", p >= 0.999);

    st.p = p; st.spin = spin; st.tx = tx; st.ty = ty; st.sF = sF; st.fade = fade; st.comp = cb; st.side = so;

    frameEl.style.transform =
      "translate(-50%, -50%) translate(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px) rotate(" +
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

  /* programmes reveal: cards fade in as they enter; skipped under reduced
     motion so the cards simply stay fully visible */
  if (galleryGrid && "IntersectionObserver" in window && !reduced) {
    root.classList.add("gallery-reveal");
    var gio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          gio.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(galleryGrid.children, function (card) { gio.observe(card); });
  }

  /* ---------------- init ---------------- */
  computeGeo();
  window.addEventListener("load", function () { onResize(); });

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
      side: st.side || 0,
      reduced: reduced,
      qa: qaMode ? qaPinned : null,
      heroTop: geo.heroTop,
      travel: geo.travel,
      dockX: geo.vw / 2,
      dockR: geo.rFinal,
      dockY: geo.tyDock,
      rBig: geo.rBig,
      footerH: geo.footerH,
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
