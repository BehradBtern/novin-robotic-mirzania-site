/* Animated background gradient — vanilla WebGL2 port of the supplied
   "AnimatedGradient" component (Prism-style shader). The palette is retuned to
   the site tokens: ink stage #17191B, brand teal #56C1C9 banked to a low alpha
   so bright teal never competes with the logo mark or the small type.
   Behaviour: ~30 fps, 0.8x internal resolution, pauses on hidden tabs, draws a
   single static frame when the visitor prefers reduced motion, and quietly
   leaves the CSS stage colour in place when WebGL2 is unavailable. */
(function () {
  "use strict";

  var host = document.getElementById("page-bg");
  if (!host) return;
  /* support / diagnostics: ?bg=0 keeps the flat stage colour */
  try {
    if (new URLSearchParams(window.location.search).get("bg") === "0") return;
  } catch (e) {}

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  var gl = canvas.getContext("webgl2", {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power"
  });
  if (!gl) {
    canvas.remove();
    return;
  }

  var CFG = {
    color1: "#17191B",
    color2: "#56C1C966",
    color3: "#0E1214",
    rotation: -35,
    proportion: 0.58,
    scale: 0.014,
    speed: 14,
    distortion: 3,
    swirl: 52,
    swirlIterations: 6,
    softness: 100,
    offset: -299,
    shape: 0,        /* 0 checks, 1 stripes, 2 edge */
    shapeSize: 30
  };
  if (window.__BG_OVERRIDE) {
    for (var k in window.__BG_OVERRIDE) {
      if (Object.prototype.hasOwnProperty.call(window.__BG_OVERRIDE, k)) CFG[k] = window.__BG_OVERRIDE[k];
    }
  }

  var VERT = "#version 300 es\nin vec4 a_position;\nvoid main(){ gl_Position = a_position; }";

  var FRAG = "#version 300 es\n" +
    "precision highp float;\n" +
    "uniform float u_time;\n" +
    "uniform float u_pixelRatio;\n" +
    "uniform vec2 u_resolution;\n" +
    "uniform float u_scale;\n" +
    "uniform float u_rotation;\n" +
    "uniform vec4 u_color1;\n" +
    "uniform vec4 u_color2;\n" +
    "uniform vec4 u_color3;\n" +
    "uniform float u_proportion;\n" +
    "uniform float u_softness;\n" +
    "uniform float u_shape;\n" +
    "uniform float u_shapeScale;\n" +
    "uniform float u_distortion;\n" +
    "uniform float u_swirl;\n" +
    "uniform float u_swirlIterations;\n" +
    "out vec4 fragColor;\n" +
    "#define TWO_PI 6.28318530718\n" +
    "#define PI 3.14159265358979323846\n" +
    "vec2 rotate(vec2 uv, float th){ return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv; }\n" +
    "float random(vec2 st){ return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }\n" +
    "float noise(vec2 st){\n" +
    "  vec2 i = floor(st); vec2 f = fract(st);\n" +
    "  float a = random(i); float b = random(i + vec2(1.0, 0.0));\n" +
    "  float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));\n" +
    "  vec2 u = f * f * (3.0 - 2.0 * f);\n" +
    "  float x1 = mix(a, b, u.x); float x2 = mix(c, d, u.x);\n" +
    "  return mix(x1, x2, u.y);\n" +
    "}\n" +
    "vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur){\n" +
    "  vec3 color1 = c1.rgb * c1.a; vec3 color2 = c2.rgb * c2.a; vec3 color3 = c3.rgb * c3.a;\n" +
    "  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);\n" +
    "  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);\n" +
    "  vec3 blended_color_2 = mix(color1, color2, r1);\n" +
    "  float blended_opacity_2 = mix(c1.a, c2.a, r1);\n" +
    "  vec3 c = mix(blended_color_2, color3, r2);\n" +
    "  float o = mix(blended_opacity_2, c3.a, r2);\n" +
    "  return vec4(c, o);\n" +
    "}\n" +
    "void main(){\n" +
    "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;\n" +
    "  float t = .5 * u_time;\n" +
    "  float noise_scale = .0005 + .006 * u_scale;\n" +
    "  uv -= .5; uv *= (noise_scale * u_resolution);\n" +
    "  uv = rotate(uv, u_rotation * .5 * PI);\n" +
    "  uv /= u_pixelRatio; uv += .5;\n" +
    "  float n1 = noise(uv * 1. + t);\n" +
    "  float n2 = noise(uv * 2. - t);\n" +
    "  float angle = n1 * TWO_PI;\n" +
    "  uv.x += 4. * u_distortion * n2 * cos(angle);\n" +
    "  uv.y += 4. * u_distortion * n2 * sin(angle);\n" +
    "  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));\n" +
    "  for (float i = 1.; i <= iterations_number; i++) {\n" +
    "    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);\n" +
    "    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);\n" +
    "  }\n" +
    "  float proportion = clamp(u_proportion, 0., 1.);\n" +
    "  float shape = 0.; float mixer = 0.;\n" +
    "  if (u_shape < .5) {\n" +
    "    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);\n" +
    "    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);\n" +
    "    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);\n" +
    "  } else if (u_shape < 1.5) {\n" +
    "    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);\n" +
    "    float f = fract(stripes_shape_uv.y);\n" +
    "    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);\n" +
    "    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);\n" +
    "  } else {\n" +
    "    float sh = 1. - uv.y; sh -= .5; sh /= (noise_scale * u_resolution.y); sh += .5;\n" +
    "    float shape_scaling = .2 * (1. - u_shapeScale);\n" +
    "    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));\n" +
    "    mixer = shape;\n" +
    "  }\n" +
    "  vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);\n" +
    "  fragColor = vec4(color_mix.rgb, color_mix.a);\n" +
    "}\n";

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    canvas.remove();
    return;
  }
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.remove();
    return;
  }
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["u_time", "u_resolution", "u_pixelRatio", "u_scale", "u_rotation", "u_color1", "u_color2", "u_color3",
    "u_proportion", "u_softness", "u_shape", "u_shapeScale", "u_distortion", "u_swirl", "u_swirlIterations"
  ].forEach(function (n) { U[n] = gl.getUniformLocation(program, n); });

  function hexToRgba(hex) {
    var r = 0, g = 0, b = 0, a = 1, c;
    if (hex.charAt(0) === "#") {
      c = hex.slice(1);
      if (c.length === 3) {
        r = parseInt(c[0] + c[0], 16) / 255;
        g = parseInt(c[1] + c[1], 16) / 255;
        b = parseInt(c[2] + c[2], 16) / 255;
      } else if (c.length >= 6) {
        r = parseInt(c.slice(0, 2), 16) / 255;
        g = parseInt(c.slice(2, 4), 16) / 255;
        b = parseInt(c.slice(4, 6), 16) / 255;
        if (c.length === 8) a = parseInt(c.slice(6, 8), 16) / 255;
      }
    }
    return [r, g, b, a];
  }

  var c1 = hexToRgba(CFG.color1), c2 = hexToRgba(CFG.color2), c3 = hexToRgba(CFG.color3);

  var RES = 0.8;
  function dpr() {
    return Math.min(window.devicePixelRatio || 1, 1.5) * RES;
  }
  function resize() {
    var w = Math.max(1, Math.round((host.clientWidth || window.innerWidth) * dpr()));
    var h = Math.max(1, Math.round((host.clientHeight || window.innerHeight) * dpr()));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function uniforms() {
    gl.uniform2f(U.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(U.u_pixelRatio, dpr());
    gl.uniform1f(U.u_scale, CFG.scale);
    gl.uniform1f(U.u_rotation, (CFG.rotation * Math.PI) / 180);
    gl.uniform4f(U.u_color1, c1[0], c1[1], c1[2], c1[3]);
    gl.uniform4f(U.u_color2, c2[0], c2[1], c2[2], c2[3]);
    gl.uniform4f(U.u_color3, c3[0], c3[1], c3[2], c3[3]);
    gl.uniform1f(U.u_proportion, CFG.proportion);
    gl.uniform1f(U.u_softness, CFG.softness / 100);
    gl.uniform1f(U.u_shape, CFG.shape);
    gl.uniform1f(U.u_shapeScale, CFG.shapeSize / 100);
    gl.uniform1f(U.u_distortion, CFG.distortion / 50);
    gl.uniform1f(U.u_swirl, CFG.swirl / 100);
    gl.uniform1f(U.u_swirlIterations, CFG.swirl === 0 ? 0 : CFG.swirlIterations);
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var rafId = null, start = 0, lastDraw = 0;

  function draw(elapsed) {
    gl.uniform1f(U.u_time, elapsed * ((CFG.speed / 100) * 5) + CFG.offset * 0.01);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function tick(now) {
    rafId = window.requestAnimationFrame(tick);
    if (now - lastDraw < 32) return;
    lastDraw = now;
    draw((now - start) / 1000);
  }

  function stop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function run() {
    stop();
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    uniforms();
    if (reduced.matches) {
      draw(0.0);
      return;
    }
    start = performance.now();
    lastDraw = 0;
    rafId = window.requestAnimationFrame(tick);
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(run, 180);
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else run();
  });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    stop();
    canvas.style.display = "none";
  });

  if (reduced.addEventListener) {
    reduced.addEventListener("change", run);
  }

  host.dataset.ready = "true";
  run();
})();
