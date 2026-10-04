/* =========================================================================
   main.js — renders content from content.js and drives the logo sequence:
   hold → clockwise spin (+ shrink, wordmark→mark swap) → side copy appears
   left/right of the small symbol → grow big at the left edge → spin right
   across the screen to the right edge (both big states half clipped, 45°) →
   travel down into the footer dock. Renders the footer.
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

    /* enlarged state: exactly half hangs past the left edge (single-axis clip) */
    var rBig = Math.min((A.bigDiameterVh * vh) / 2, vw - A.edgeMarginPx);
    rBig = Math.max(rBig, 120);
    geo.rBig = rBig;

    /* vertical offset of the mark's centre from the frame centre inside the
       wordmark lockup (cancelled by the compensation term in render) */
    geo.offY = (0.5 - ((C.constants && C.constants.wordmarkDiamondCenterYFrac) || 0.3203)) * geo.frameH;

    geo.kBig = (2 * rBig) / geo.markBoxW;
    geo.txBig = -vw / 2;                      /* centre-x at the left edge (half clipped) */
  }

  /* ---------------- render ---------------- */
  var st = { p: 0, spin: 0, tx: 0, ty: 0, sF: 1, fade: 0, side: 0 };

  function render(p) {
    p = clamp01(p);

    /* one continuous clockwise turn: spin + shrink (0.10–0.34), hold while the
       side copy shows (0.34–0.58), grow into the big half-clipped state at
       the LEFT edge (0.58–0.70, spin 270 — the 45-degree diamond pose), spin
       rightward across the screen to the big state at the RIGHT edge
       (0.70–0.84, spin 360 — the same exact 45-degree pose) */
    var spin =
      A.spinTurns * (180 * cub(p, 0.10, 0.34) +
        90 * cub(p, 0.58, 0.70) +
        90 * cub(p, 0.70, 0.84));

    var sF, targetX = geo.vw / 2, targetY = geo.vh / 2;
    if (p <= 0.34) {
      /* A/B: hold, then spin + shrink in place */
      sF = 1 - (1 - geo.sC) * cub(p, 0.10, 0.34);
    } else if (p <= 0.58) {
      /* C: small symbol holds in the centre; the side copy is visible */
      sF = geo.sC;
    } else if (p <= 0.70) {
      /* D1: grow into the big state at the LEFT edge — half hangs past it */
      var u1 = cub(p, 0.58, 0.70);
      sF = geo.sC + (geo.kBig - geo.sC) * u1;
      targetX = geo.vw / 2 - (geo.vw / 2) * u1;
    } else {
      /* D2: still big — spin to the right across the screen */
      var u2 = cub(p, 0.70, 0.84);
      sF = geo.kBig;
      targetX = geo.vw * u2;
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
    var soIn = seg(p, 0.36, 0.44);
    var so = soIn * (1 - seg(p, 0.50, 0.56));
    var soShift = (1 - soIn) * 24;
    if (sideLeftEl) {
      sideLeftEl.style.opacity = so.toFixed(3);
      sideLeftEl.style.transform = "translateY(-50%) translateX(" + (-soShift).toFixed(1) + "px)";
    }
    if (sideRightEl) {
      sideRightEl.style.opacity = so.toFixed(3);
      sideRightEl.style.transform = "translateY(-50%) translateX(" + soShift.toFixed(1) + "px)";
    }

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

  /* ---------------- footer signature: draw-in + cursor reveal -------------- */
  var sigWrap = doc.getElementById("footer-signature");
  var sigSvg = doc.getElementById("sig-svg");
  var revealMask = doc.getElementById("revealMask");
  if (sigWrap && sigSvg && revealMask) {
    var sigLabel = String(
      (C.footer && C.footer.signature && C.footer.signature.text) ||
      (C.brand && C.brand.name) || ""
    ).toUpperCase();
    Array.prototype.forEach.call(sigWrap.querySelectorAll("text"), function (t) {
      t.textContent = sigLabel;
    });

    var maskTarget = { cx: 50, cy: 50 };
    var maskNow = { cx: 50, cy: 50 };
    var maskRaf = null;
    var maskTick = function () {
      maskNow.cx += (maskTarget.cx - maskNow.cx) * 0.18;
      maskNow.cy += (maskTarget.cy - maskNow.cy) * 0.18;
      revealMask.setAttribute("cx", maskNow.cx.toFixed(2) + "%");
      revealMask.setAttribute("cy", maskNow.cy.toFixed(2) + "%");
      if (Math.abs(maskTarget.cx - maskNow.cx) > 0.05 || Math.abs(maskTarget.cy - maskNow.cy) > 0.05) {
        maskRaf = window.requestAnimationFrame(maskTick);
      } else {
        maskRaf = null;
      }
    };
    var applyMask = function () {
      revealMask.setAttribute("cx", maskTarget.cx.toFixed(2) + "%");
      revealMask.setAttribute("cy", maskTarget.cy.toFixed(2) + "%");
    };
    sigWrap.addEventListener("pointerenter", function () { sigWrap.classList.add("is-hover"); });
    sigWrap.addEventListener("pointerleave", function () { sigWrap.classList.remove("is-hover"); });
    sigWrap.addEventListener("pointermove", function (e) {
      var r = sigSvg.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      maskTarget.cx = ((e.clientX - r.left) / r.width) * 100;
      maskTarget.cy = ((e.clientY - r.top) / r.height) * 100;
      if (reduced) {
        applyMask();
      } else if (maskRaf === null) {
        maskRaf = window.requestAnimationFrame(maskTick);
      }
    });

    if (reduced) {
      sigWrap.classList.add("is-drawn");
    } else if ("IntersectionObserver" in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            sigWrap.classList.add("is-drawn");
            sio.unobserve(sigWrap);
          }
        });
      }, { threshold: 0.35 });
      sio.observe(sigWrap);
    } else {
      sigWrap.classList.add("is-drawn");
    }
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
