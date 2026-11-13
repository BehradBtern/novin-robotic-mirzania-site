/* 3D photo cylinder — vanilla port of the supplied React/framer-motion carousel.
   Nine faces arranged on a cylinder, drag to spin with inertia, click to expand.
   No libraries: one rAF loop that only runs while the wheel is moving, images are
   fetched when the section first approaches, and reduced motion disables inertia. */
(function () {
  "use strict";

  var host = document.getElementById("gallery");
  if (!host) return;
  var C = window.SITE_CONTENT;
  var items = (C && C.gallery) || [];
  if (!items.length) return;

  var stage = host.querySelector(".gallery__stage");
  var cylinder = host.querySelector(".gallery__cylinder");
  var count = items.length;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  function css(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }

  var faces = [];
  var imgs = [];

  items.forEach(function (item, i) {
    var fig = document.createElement("figure");
    fig.className = "gallery__face";
    fig.setAttribute("data-index", String(i));

    var img = document.createElement("img");
    img.alt = item.caption || "Award photograph";
    img.decoding = "async";
    img.loading = "lazy";
    img.setAttribute("data-src", item.src);

    var cap = document.createElement("figcaption");
    cap.textContent = item.credit || "";

    fig.appendChild(img);
    fig.appendChild(cap);
    cylinder.appendChild(fig);
    faces.push(fig);
    imgs.push(img);
  });

  /* ---- geometry: a real cylinder, so the faces wrap evenly ---- */
  var radius = 0;
  var faceW = 0;

  function layout() {
    var vw = window.innerWidth;
    var cyW = Math.max(1700, Math.min(2900, Math.round(vw * 1.85)));
    faceW = Math.round(cyW / count);
    radius = Math.round(cyW / (2 * Math.PI));
    cylinder.style.width = cyW + "px";
    cylinder.style.left = "50%";
    cylinder.style.marginLeft = Math.round(-cyW / 2) + "px";
    cylinder.style.setProperty("--face-w", faceW + "px");
    for (var i = 0; i < count; i++) {
      var a = (i * 360) / count;
      faces[i].style.transform = "rotateY(" + a + "deg) translateZ(" + radius + "px)";
    }
    spin = -12;                 /* open on the curve, not on a flat face */
    apply(spin);
  }

  /* ---- drag + inertia ---- */
  var spin = 0;
  var velocity = 0;
  var dragging = false;
  var lastX = 0;
  var lastT = 0;
  var moved = 0;
  var raf = 0;
  var activeNow = false;

  function apply(deg) {
    cylinder.style.transform = "translateZ(-" + radius + "px) rotateY(" + deg.toFixed(2) + "deg)";
  }

  function tick() {
    raf = 0;
    if (!activeNow) return;
    if (Math.abs(velocity) < 0.02) {
      velocity = 0;
      return;                      /* idle: no loop, no work */
    }
    spin += velocity;
    velocity *= 0.945;             /* friction */
    apply(spin);
    raf = window.requestAnimationFrame(tick);
  }

  function kick(v) {
    if (reduced.matches) return;   /* no inertia for reduced motion */
    velocity = v;
    if (!raf) raf = window.requestAnimationFrame(tick);
  }

  var downFace = null;

  stage.addEventListener("pointerdown", function (e) {
    dragging = true;
    moved = 0;
    /* remember the face under the press: setPointerCapture retargets the later
       pointerup to the stage, so the target cannot be trusted at the end */
    downFace = e.target && e.target.closest ? e.target.closest(".gallery__face") : null;
    lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX;
    var now = performance.now();
    var dt = Math.max(8, now - lastT);
    lastX = e.clientX;
    lastT = now;
    moved += Math.abs(dx);
    spin += dx * 0.18;
    apply(spin);
    velocity = (dx * 0.18) * (16 / dt);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (Math.abs(moved) < 6) {
      if (downFace) open(Number(downFace.getAttribute("data-index")));
      downFace = null;
      return;
    }
    kick(velocity * 3.2);
  }

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("keydown", function (e) {
    var step = 360 / count;
    if (e.key === "ArrowLeft") { spin -= step; apply(spin); e.preventDefault(); }
    if (e.key === "ArrowRight") { spin += step; apply(spin); e.preventDefault(); }
    if (e.key === "Enter" || e.key === " ") {
      var face = document.activeElement && document.activeElement.closest ? document.activeElement.closest(".gallery__face") : null;
      if (face) { open(Number(face.getAttribute("data-index"))); e.preventDefault(); }
    }
  });

  /* ---- lightbox ---- */
  var box = host.querySelector(".gallery__lightbox");
  /* the stage clips its children, so the dialog lives on the body instead */
  if (box && box.parentNode !== document.body) document.body.appendChild(box);
  var boxImg = box.querySelector("img");
  var boxCap = box.querySelector(".gallery__lbcap");
  var lastFocus = null;

  function open(index) {
    var item = items[index];
    if (!item) return;
    lastFocus = document.activeElement;
    boxImg.src = item.src;
    boxImg.alt = item.caption || "Award photograph";
    boxCap.textContent = (item.caption ? item.caption + " — " : "") + (item.credit || "");
    box.hidden = false;
    window.requestAnimationFrame(function () { box.classList.add("is-open"); });
    document.documentElement.classList.add("gallery-open");
    box.focus();
  }

  function close() {
    box.classList.remove("is-open");
    document.documentElement.classList.remove("gallery-open");
    window.setTimeout(function () { box.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  box.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) close();
  });

  /* ---- deferred image loading: fetch when the section first approaches ---- */
  var armed = false;
  function arm() {
    if (armed) return;
    armed = true;
    imgs.forEach(function (img) {
      var s = img.getAttribute("data-src");
      if (s) { img.src = s; img.removeAttribute("data-src"); }
    });
  }

  /* main.js owns the phase timing: it arms the images and toggles .is-live */
  window.__galleryArm = arm;
  activeNow = true;

  var rt = 0;
  window.addEventListener("resize", function () {
    if (rt) window.clearTimeout(rt);
    rt = window.setTimeout(layout, 160);
  }, { passive: true });

  layout();
  faces.forEach(function (f) { f.setAttribute("tabindex", "0"); });
})();
