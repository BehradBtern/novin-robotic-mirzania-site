/* =========================================================================
   content.js — THE single content source for this website.
   -------------------------------------------------------------------------
   Edit footer copy, hero side text, theme colors, or animation tuning here.
   No other file needs to be touched for content changes; save and refresh.
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

  /* Placeholder text that appears left and right of the small symbol
     mid-sequence. Replace freely — this is the first thing to swap. */
  heroSide: {
    left: {
      kicker: "The founder",
      title: "From Bijar to international robotics stages",
      body: "Hadis Mirzania is the founder and head coach of Iran’s National Student Robotics Team. Originally from Bijar, Kurdistan Province, and now based in Tehran, she has successfully brought students from both Kurdistan and Tehran to national and international stages. For seven consecutive years, she has helped school-aged students achieve podium finishes in international robotics competitions, while also serving as a referee in university-level competitions across Iran. She is also the founder of her own institute, Novin Robotic Mirzania, which provides robotics classes for students of all ages. More recently, the institute has expanded its reach around the globe through online classes powered by Google Meet. Her journey from Bijar to international robotics stages is a testament to the idea that where you come from does not have to determine where you can go—hard work, passion, and dedication can open doors anywhere."
    },
    right: {
      kicker: "Who we serve",
      title: "Research habits that hold up outside the lab",
      body: "Our projects serve learners, researchers, and partners. We test ideas with real materials and machines, compare results, and welcome collaboration on problems worth solving together."
    }
  },

  /* Animation tuning (all optional to edit):
     spinTurns      — full clockwise turns across the whole sequence (1 = 360°)
     heroWidthVw/Vh — the first (hero) logo's max share of viewport width/height
     heroWidthMaxPx — absolute cap for the hero logo
     bigDiameterVh  — diameter of the enlarged state (share of viewport height;
                      exactly half of it hangs past the left/right edge)
     footerScale    — landing size inside the footer (share of footer height)
     footerMaxPx    — absolute cap for the landing size (phones also cap it
                      at half the viewport width)
     edgeMarginPx   — minimum gap kept between the logo and screen edges       */
  animation: {
    spinTurns: 1,
    heroWidthVw: 92,
    heroWidthVh: 96,
    heroWidthMaxPx: 1600,
    bigDiameterVh: 0.96,
    footerScale: 0.42,
    footerMaxPx: 330,
    edgeMarginPx: 12
  },

  /* International places (flags live in assets/flags/). */
  /* The closing gallery: real competition photographs, each with its outlet.
     Same coverage that supplies the award frames above. */
  gallery: [
    { src: "assets/gallery/g1.jpg", credit: "Jamaran (IRNA)", caption: "Iran and Malaysia flags, IRC 2019" },
    { src: "assets/gallery/g2.jpg", credit: "Young Journalists Club", caption: "Team and robots, Beijing 2023" },
    { src: "assets/gallery/g3.jpg", credit: "Mehr News Agency", caption: "Certificates and trophy, Teknofest 2025" },
    { src: "assets/gallery/g4.jpg", credit: "Sinapress", caption: "Asia-Pacific squad with medals, 2025" },
    { src: "assets/gallery/g5.jpg", credit: "Mehr News Agency", caption: "ROBO OBSTACLE RACE podium, APRC 2026" },
    { src: "assets/gallery/g6.jpg", credit: "Mehr News Agency", caption: "APRC 2026, team presentation" },
    { src: "assets/gallery/g7.jpg", credit: "Mehr News Agency", caption: "APRC 2026, arena and judges" },
    { src: "assets/gallery/g8.jpg", credit: "Sinapress", caption: "Asian championship squad, 2025" },
    { src: "assets/gallery/g9.jpg", credit: "Jamejam", caption: "RobotChallenge stage, 2026" },
    { src: "assets/gallery/g10.jpg", credit: "Mehr News Agency", caption: "Soccer 180g podium, APRC 2026" },
    { src: "assets/gallery/g11.jpg", credit: "Mehr News Agency", caption: "Robo Obstacle Race delegation, APRC 2026" },
    { src: "assets/gallery/g12.jpg", credit: "Mehr News Agency", caption: "Team line-up with medals, Asian championship 2025" },
    { src: "assets/gallery/g13.jpg", credit: "Mehr News Agency", caption: "Soccer 180g winners with the flag, APRC 2026" },
    { src: "assets/gallery/g14.jpg", credit: "Mehr News Agency", caption: "Team salute on stage, Asian championship 2025" },
    { src: "assets/gallery/g15.jpg", credit: "Mehr News Agency", caption: "Team with the flag, Asian championship 2025" }
  ],
  places: {
    kicker: "International places",
    intro: "",
    items: [
      { country: "India", flag: "assets/flags/Flag_of_India.svg", year: "2019", text: "", rank: "3rd", photo: "assets/photos/event-1.jpg", credit: "Jamaran (IRNA)" },
      { country: "Malaysia", flag: "assets/flags/Flag_of_Malaysia.svg", year: "2022", text: "", rank: "2nd", photo: "assets/photos/event-2.jpg", credit: "Young Journalists Club" },
      { country: "Turkey", flag: "assets/flags/Flag_of_Turkey.svg", year: "2023", text: "", rank: "1st", photo: "assets/photos/event-3.jpg", credit: "Mehr News Agency" },
      { country: "United Kingdom", flag: "assets/flags/Flag_of_the_United_Kingdom_(3-5).svg", year: "2025", text: "", rank: "2nd", photo: "assets/photos/event-4.jpg", credit: "Sinapress" },
      { country: "United States", flag: "assets/flags/Flag_of_the_United_States.svg", year: "2026", text: "", rank: "2nd", photo: "assets/photos/event-5.jpg", credit: "Mehr News Agency" }
    ]
  },

  footer: {
    /* the giant animated footer text (uppercased automatically) */
    signature: { text: "Novin Robotic Mirzania" },
    blurb: "Novin Robotic Mirzania is an applied robotics institute. We research, teach, and partner with people who want machines to be useful, understandable, and well made.",
    explore: [
      { label: "Our story", anchor: "#story" },
      { label: "Get in touch", anchor: "#contact" },
      { label: "Back to top", anchor: "#top" }
    ],
    /* real details, taken from the institute's published listings
       (madyar.org/School/Roboticmirzania, its Instagram @robotic_mirzania and the
       Saadat Abad directory entry). No email address is published anywhere, so the
       field stays empty and the row hides itself instead of showing a placeholder. */
    contact: {
      phone: "+98 21 2238 4919",
      mobile: "+98 912 370 1230",
      address: "No. 74, Sro-e Sharghi St, Paydar Shopping Center, Saadat Abad, Tehran, Iran",
      instagram: "https://www.instagram.com/robotic_mirzania"
    },
    legal: "© 2026 Novin Robotic Mirzania. All rights reserved.",
    creditNote: "Founded and led by Hadis Mirzania, Tehran.",
    photoCredit: "Award photographs: Jamaran, Young Journalists Club, Mehr News Agency, Sinapress."
  }
};
