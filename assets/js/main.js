/* =========================================================================
   main.js — renders content from content.js and drives the four-stage
   scroll-linked logo choreography.
   Internal QA API: window.__heroState() returns live values (used by the
   QA harness; harmless otherwise). URL hook: ?qa=<0..1> pins hero progress
   for deterministic screenshots.
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

  /* ---------------- text helpers ---------------- */
  function setText(id, value) {
    var el = doc.getElementById(id);
    if (el && typeof value === "string") el.textContent = value;
  }

  /* ---------------- render content ---------------- */
  if (C.hero) {
    setText("hero-left-kicker", C.hero.left.kicker);
    setText("hero-left-headline", C.hero.left.headline);
    setText("hero-left-body", C.hero.left.body);
    setText("hero-right-kicker", C.hero.right.kicker);
    setText("hero-right-headline", C.hero.right.headline);
    setText("hero-right-body", C.hero.right.body);
    var hintSpan = doc.querySelector('[data-field="hero.scrollHint"]');
    if (hintSpan) hintSpan.textContent = C.hero.scrollHint || "";
  }

  var logoWordmark = C.logos ? C.logos.wordmark : "";
  var logoMark = C.logos ? C.logos.mark : "";
  ["hero-wordmark", "footer-logo"].forEach(function (id) {
    var el = doc.getElementById(id);
    if (el && logoWordmark) el.src = logoWordmark;
  });
  ["hero-mark", "rm-mark"].forEach(function (id) {
    var el = doc.getElementById(id);
    if (el && logoMark) el.src = logoMark;
  });

  if (C.gallery) {
    setText("gallery-label", C.gallery.sectionLabel);
    setText("gallery-title", C.gallery.title);
    setText("gallery-intro", C.gallery.intro);

    var rows = doc.getElementById("gallery-rows");
    if (rows && Array.isArray(C.gallery.items)) {
      rows.innerHTML = "";
      C.gallery.items.forEach(function (item, i) {
        var art = doc.createElement("article");
        art.className = "gallery__row reveal";

        var fig = doc.createElement("figure");
        fig.className = "gallery__media";
        var img = doc.createElement("img");
        img.src = item.image;
        img.alt = item.alt || "";
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 1200;
        img.height = 800;
        fig.appendChild(img);

        var tx = doc.createElement("div");
        tx.className = "gallery__text";
        var idx = doc.createElement("p");
        idx.className = "gallery__index";
        idx.textContent = String(i + 1).padStart(2, "0");
        var h = doc.createElement("h3");
        h.className = "gallery__card-title";
        h.textContent = item.title || "";
        var p = doc.createElement("p");
        p.className = "gallery__card-text";
        p.textContent = item.text || "";
        tx.appendChild(idx);
        tx.appendChild(h);
        tx.appendChild(p);

        art.appendChild(fig);
        art.appendChild(tx);
        rows.appendChild(art);
      });
    }
  }

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

  /* ---------------- gallery reveal ---------------- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll(".gallery__row.reveal"));
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------- reduced motion ---------------- */
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = mqReduce.matches;
  if (reduced) root.classList.add("reduced-motion");
  if (mqReduce.addEventListener) {
    mqReduce.addEventListener("change", function () { window.location.reload(); });
  }

  /* ---------------- QA hook + state ---------------- */
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
  var copyLeftEl = doc.getElementById("hero-copy-left");
  var copyRightEl = doc.getElementById("hero-copy-right");
  var indicatorEl = doc.getElementById("hero-indicator");
  var hintEl = doc.getElementById("hero-hint");

  /* ---------------- math helpers ---------------- */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
  function cubic(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(p, a, b) { return smooth((p - a) / (b - a)); }
  function cub(p, a, b) { return cubic((p - a) / (b - a)); }

  var K = {
    diamW: (C.constants && C.constants.wordmarkDiamondWidthFrac) || 0.5061,
    diamCY: (C.constants && C.constants.wordmarkDiamondCenterYFrac) || 0.3203
  };

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
    geo.markBaseW = markboxEl.offsetWidth || 1;
    var mobile = vw <= 640;
    var tablet = vw > 640 && vw <= 1023;
    geo.sEnd = mobile ? 0.64 : 0.60;
    geo.k0 = mobile ? 0.64 : 0.60;              /* seeded at fold = settled C scale */
    geo.rzEnd = mobile ? -12 : -14;
    var D = vh * (mobile ? 1.30 : tablet ? 1.40 : 1.50);
    D = Math.min(1920, Math.max(560, D));
    geo.kEnd = D / geo.markBaseW;
    /* keep roughly half of the mark on screen: cap the scale so the rotated
       bounding-box half-width does not exceed the viewport width (narrow
       screens would otherwise hide more than half of the giant). */
    var rzAbs = Math.abs(geo.rzEnd) * Math.PI / 180;
    var rotFactor = Math.cos(rzAbs) + Math.sin(rzAbs);
    geo.kEnd = Math.min(geo.kEnd, (2 * vw) / (geo.markBaseW * rotFactor));
    geo.deltaEnd = (0.5 - K.diamCY) * geo.frameH * geo.sEnd;
    geo.foldTy = (0.5 - K.diamCY) * geo.frameH;
    geo.txEnd = -0.5 * vw;
  }

  /* ---------------- render ---------------- */
  var lastShowMark = null;
  var lastStage = -1;
  var chapters = (C.hero && Array.isArray(C.hero.chapters)) ? C.hero.chapters : ["", "", "", ""];

  function stageIndex(p) {
    return p < 0.20 ? 0 : p < 0.45 ? 1 : p < 0.78 ? 2 : 3;
  }

  function setStageLabel(i) {
    if (i === lastStage || !indicatorEl) return;
    lastStage = i;
    var label = String(i + 1).padStart(2, "0") + " / " + (chapters[i] || "");
    if (qaMode || reduced) {
      indicatorEl.textContent = label;
      return;
    }
    indicatorEl.style.opacity = "0.2";
    window.setTimeout(function () {
      indicatorEl.textContent = label;
      indicatorEl.style.opacity = "1";
    }, 160);
  }

  function render(p) {
    p = clamp01(p);
    setStageLabel(stageIndex(p));

    var showMark, frameTf, markboxTf, markTf;

    if (p < 0.82) {
      var sF = 1 - 0.42 * cub(p, 0.20, 0.45) + 0.02 * seg(p, 0.45, 0.60);
      var delta = geo.deltaEnd * cub(p, 0.20, 0.45);
      var wRotY = 90 * cub(p, 0.20, 0.325);
      var mRotY = -90 + 90 * cub(p, 0.325, 0.45);
      var rzC = -5 * seg(p, 0.60, 0.78);
      showMark = p >= 0.325;
      frameTf = "translate(-50%, -50%) translateY(" + delta.toFixed(2) + "px) scale(" + sF.toFixed(4) + ")";
      markboxTf = "translateY(-50%) rotateY(" + mRotY.toFixed(2) + "deg)";
      markTf = "rotate(" + rzC.toFixed(2) + "deg)";
      if (wordmarkEl) wordmarkEl.style.transform = "rotateY(" + wRotY.toFixed(2) + "deg)";
    } else {
      var u = cub(p, 0.82, 0.97);
      var k = geo.k0 + (geo.kEnd - geo.k0) * u;
      var tx = geo.txEnd * u;
      var ty = geo.foldTy;
      var rz = -5 + (geo.rzEnd + 5) * u;
      showMark = true;
      frameTf = "translate(-50%, -50%)";
      markboxTf = "translateY(-50%)";
      markTf = "translate(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px) rotate(" + rz.toFixed(2) + "deg) scale(" + k.toFixed(4) + ")";
      if (wordmarkEl) wordmarkEl.style.transform = "rotateY(90deg)";
    }

    frameEl.style.transform = frameTf;
    markboxEl.style.transform = markboxTf;
    markEl.style.transform = markTf;
    if (showMark !== lastShowMark) {
      lastShowMark = showMark;
      wordmarkEl.style.visibility = showMark ? "hidden" : "visible";
      markboxEl.style.visibility = showMark ? "visible" : "hidden";
    }

    /* copy columns */
    if (copyLeftEl) {
      var inL = seg(p, 0.47, 0.57);
      var outL = seg(p, 0.78, 0.83);
      copyLeftEl.style.opacity = (inL * (1 - outL)).toFixed(3);
      copyLeftEl.style.transform = "translateX(" + (-40 * (1 - inL) - 16 * outL).toFixed(2) + "px)";
    }
    if (copyRightEl) {
      var inR = seg(p, 0.52, 0.62);
      var outR = seg(p, 0.80, 0.84);
      copyRightEl.style.opacity = (inR * (1 - outR)).toFixed(3);
      copyRightEl.style.transform = "translateX(" + (40 * (1 - inR) + 16 * outR).toFixed(2) + "px)";
    }

    /* scroll hint */
    if (hintEl && !hintFaded && p > 0.02) {
      hintFaded = true;
      hintEl.style.opacity = "0";
    }
  }

  /* ---------------- loop ---------------- */
  var pSmooth = 0;
  var pTarget = 0;
  var running = false;
  var rafId = null;
  var lastTime = 0;
  var hintFaded = false;
  var heroOnscreen = true;

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
    [frameEl, markboxEl, markEl, wordmarkEl, copyLeftEl, copyRightEl].forEach(function (el) {
      if (el) el.style.willChange = on ? "transform" : "";
    });
  }

  /* ---------------- scroll / resize / visibility ---------------- */
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
      } else {
        pTarget = currentP();
        if (reduced) return;
        render(pSmooth);
        wake();
      }
    });
  }

  if ("IntersectionObserver" in window && heroEl) {
    var hio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        heroOnscreen = en.isIntersecting;
        if (heroOnscreen) {
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
    if (hintEl) hintEl.style.opacity = "0";
  } else if (reduced) {
    /* CSS handles the static layout */
  } else {
    pSmooth = pTarget = currentP();
    render(pSmooth);
    if (hintEl) hintEl.style.opacity = pSmooth > 0.02 ? "0" : "1";
    setWillChange(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    wake();
  }

  /* ---------------- internal QA API ---------------- */
  window.__heroState = function () {
    var fr = frameEl.getBoundingClientRect();
    var mr = markboxEl.getBoundingClientRect();
    var mk = markEl.getBoundingClientRect();
    var wm = wordmarkEl.getBoundingClientRect();
    return {
      scrollY: (window.scrollY || window.pageYOffset || 0),
      p: pSmooth,
      pTarget: pTarget,
      stage: stageIndex(pSmooth),
      qa: qaMode ? qaPinned : null,
      reduced: reduced,
      heroTop: geo.heroTop,
      travel: geo.travel,
      frame: { x: fr.x, y: fr.y, w: fr.width, h: fr.height },
      markbox: { x: mr.x, y: mr.y, w: mr.width, h: mr.height },
      markImg: { x: mk.x, y: mk.y, w: mk.width, h: mk.height },
      wordmarkImg: { x: wm.x, y: wm.y, w: wm.width, h: wm.height },
      transform: frameEl.style.transform,
      markTransform: markEl.style.transform,
      markboxTransform: markboxEl.style.transform,
      wordmarkTransform: wordmarkEl.style.transform,
      copyLeftOpacity: copyLeftEl ? parseFloat(copyLeftEl.style.opacity || "0") : null,
      copyRightOpacity: copyRightEl ? parseFloat(copyRightEl.style.opacity || "0") : null
    };
  };

  root.dataset.ready = "true";
})();
