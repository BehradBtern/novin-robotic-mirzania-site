/* =========================================================================
   content.js — THE single content source for this website.
   -------------------------------------------------------------------------
   Edit footer copy, theme colors, or animation tuning here. No other file
   needs to be touched for content changes; save and refresh.
   See README.md → "Edit copy" / "Replace the logo" / "Animation tuning".
   ========================================================================= */
window.SITE_CONTENT = {
  meta: {
    title: "Novin Robotic Mirzania — Institute for Applied Robotics",
    description: "Applied robotics institute for research, training, and education across automation, field robotics, collaboration, mobility, manipulation, and outreach."
  },

  brand: {
    name: "Novin Robotic Mirzania",
    short: "Novin Robotic",
    tagline: "Robotics research, teaching, and outreach."
  },

  /* Theme colors — `stage` is the single background token for the whole
     site; change it (and re-check contrast) to retheme the stage. */
  theme: {
    stage: "#17191B",
    surface: "#1F2225",
    hairline: "#2E3338",
    borderStrong: "#3E464B",
    ink1: "#F2F5F5",
    ink2: "#B8C4C6",
    ink3: "#8A979A",
    accent: "#56C1C9",
    accentHover: "#7AD3D9",
    accentActive: "#3FA6AE",
    focus: "#7AD3D9"
  },

  logos: {
    wordmark: "assets/logo/logo-wordmark.svg",
    mark: "assets/logo/logo-mark.svg"
  },

  /* Geometric constants of the wordmark artwork, used by the spin so the
     diamond stays continuous through the wordmark→mark swap. Measured from
     the supplied logo; update ONLY if you replace the logo artwork. */
  constants: {
    wordmarkDiamondWidthFrac: 0.5095,   // diamond width ÷ lockup width
    wordmarkDiamondCenterYFrac: 0.3230  // diamond center-y ÷ lockup height
  },

  /* Animation tuning (all optional to edit):
     spinTurns      — full clockwise turns across the whole sequence (1 = 360°)
     heroWidthVw/Vh — the first (hero) logo's max share of viewport width/height
     heroWidthMaxPx — absolute cap for the hero logo
     bigDiameterVh  — diameter of the enlarged state (share of viewport height;
                      exactly half of it hangs past the left edge)
     footerScale    — landing size inside the footer (share of footer height)
     footerMaxPx    — absolute cap for the landing size
     edgeMarginPx   — minimum gap kept between the logo and screen edges       */
  animation: {
    spinTurns: 1,
    heroWidthVw: 92,
    heroWidthVh: 86,
    heroWidthMaxPx: 1250,
    bigDiameterVh: 0.96,
    footerScale: 0.42,
    footerMaxPx: 330,
    edgeMarginPx: 12
  },

  footer: {
    blurb: "Novin Robotic Mirzania is an applied robotics institute. We research, teach, and partner with people who want machines to be useful, understandable, and well made.",
    explore: [
      { label: "Our story", anchor: "#story" },
      { label: "Programmes", anchor: "#story" },
      { label: "Get in touch", anchor: "#contact" },
      { label: "Back to top", anchor: "#top" }
    ],
    contact: {
      email: "hello@example.com",
      phone: "+00 000 000 0000",
      address: "00 Example Street, Example City 00000"
    },
    legal: "© 2026 Novin Robotic Mirzania. All rights reserved.",
    creditNote: "Draft placeholder copy; all text and contact details are editable before launch."
  }
};
