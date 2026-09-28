/* =========================================================================
   content.js — THE single content source for this website.
   -------------------------------------------------------------------------
   Edit ANY text, image path, or theme color HERE. No other file needs to be
   touched for content changes; just save and refresh the site.
   See README.md → "Edit copy" / "Replace the logo" for details.
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

  /* Geometric constants of the wordmark artwork, used by the flip
     animation to keep the diamond continuous. Measured from the supplied
     logo; update ONLY if you replace the logo artwork. */
  constants: {
    wordmarkDiamondWidthFrac: 0.5061,   // diamond width ÷ lockup width
    wordmarkDiamondCenterYFrac: 0.3203  // diamond center-y ÷ lockup height
  },

  hero: {
    scrollHint: "Scroll to explore",
    chapters: ["Identity", "Capability", "Focus", "Direction"],
    left: {
      kicker: "The institute",
      headline: "An institute where robotics research meets practical training",
      body: "We study real problems, build working systems, and share what we learn with students, industry, and the public. Our work stays close to labs, fields, and classrooms."
    },
    right: {
      kicker: "Who we serve",
      headline: "Research habits that hold up outside the lab",
      body: "Our projects serve learners, researchers, and partners. We test ideas with real materials and machines, compare results, and welcome collaboration on problems worth solving together."
    }
  },

  gallery: {
    sectionLabel: "Focus areas",
    title: "Six areas of study and practice",
    intro: "Work in our institute moves through six areas, from factory floors to farm fields, from classrooms to city streets. Each area has its own questions, tools, and the people who care about them.",
    items: [
      {
        title: "Automation on the factory floor",
        text: "Cells, conveyors, and inspection stations are classic robotics problems. We study sensing, control, and integration questions that arise when factories bring machines onto the floor.",
        alt: "Robotic arm working on an automated production line inside a factory",
        image: "assets/img/gallery-01.svg"
      },
      {
        title: "Machines for farm and field",
        text: "Farm work runs on weather, soil, and timing. We look at how wheeled and tracked machines can support planting, monitoring, and harvest tasks while farmers keep the judgement calls.",
        alt: "Small field robot moving between rows of crops at sunrise",
        image: "assets/img/gallery-02.svg"
      },
      {
        title: "People working beside robots",
        text: "Shared workspaces change what a task feels like. We ask how people and robots divide work, signal intentions clearly, and stay comfortable with each other through the day.",
        alt: "Technician and a collaborative robot arm sharing a workbench",
        image: "assets/img/gallery-03.svg"
      },
      {
        title: "Navigation for mobile autonomy",
        text: "Moving reliably through messy spaces is hard. Our mobility work covers mapping, localisation, and path planning in corridors, warehouses, and streets, down to the edge cases that decide success.",
        alt: "Autonomous mobile robot navigating a busy indoor corridor",
        image: "assets/img/gallery-04.svg"
      },
      {
        title: "Hands that learn to grasp",
        text: "Picking up an unfamiliar object is still an open problem. We study grippers, tactile sensing, and motion planning so robot hands can handle everyday items with care and repeatability.",
        alt: "Close view of a gripper holding a small household object",
        image: "assets/img/gallery-05.svg"
      },
      {
        title: "Classrooms, visits, and outreach",
        text: "We teach courses, run lab visits, and welcome school groups. Every project produces something we can explain in plain language, because robotics belongs to everyone who wants to understand it.",
        alt: "Students gathered around a table with small robots",
        image: "assets/img/gallery-06.svg"
      }
    ]
  },

  footer: {
    blurb: "Novin Robotic Mirzania is an applied robotics institute. We research, teach, and partner with people who want machines to be useful, understandable, and well made.",
    explore: [
      { label: "Our story", anchor: "#story" },
      { label: "Programmes", anchor: "#programmes" },
      { label: "Get in touch", anchor: "#contact" },
      { label: "Back to top", anchor: "#top" }
    ],
    contact: {
      email: "hello@example.com",
      phone: "+00 000 000 0000",
      address: "00 Example Street, Example City 00000"
    },
    legal: "© 2026 Novin Robotic Mirzania. All rights reserved.",
    creditNote: "Draft placeholder copy for layout review; all text and contact details are editable before launch."
  }
};
