/* DroidGuard Quest — Codex (bonus knowledge library)
 *
 * The Codex is a companion-study layer: a curated set of articles,
 * grouped into themed areas, broken into short chapters that each
 * read in under two minutes inside a modal. Every chapter awards
 * XP; finishing a whole book pays a completion bonus on top.
 *
 * The .md files live under src/assets/library/<area>/<book>.md and
 * are copied verbatim into public/ at build time. Each file uses
 * H2 headings (## Chapter Title) to separate chapters.
 */
window.DG_LIBRARY = (function () {
  const POINTS_PER_CHAPTER = 25;
  const POINTS_PER_BOOK    = 100;

  const AREAS = [
    {
      id: "threat-surface",
      name: "Threat Surface",
      icon: "💥",
      color: "#FF5577",
      desc: "Attack vectors and how to defend against them.",
      books: [
        {
          id: "overlay-attacks",
          title: "Android Overlay Attacks",
          tagline: "How they work and how to stop them",
          file: "library/threat-surface/overlay-attacks.md",
          source: "https://medium.com/@jacksonfdam/android-overlay-attacks-how-they-work-and-how-to-stop-them-f3dbea3d215f",
          chapters: 3
        },
        {
          id: "ghosttouch",
          title: "GhostTouch",
          tagline: "Android Overlay Attack: Real Risk, Real Defense",
          file: "library/threat-surface/ghosttouch.md",
          source: "https://github.com/jacksonmafra-umain/GhostTouch",
          chapters: 3
        },
        {
          id: "common-bypasses",
          title: "Hackers Gonna Hack",
          tagline: "Common bypass techniques and how to fight back",
          file: "library/threat-surface/common-bypasses.md",
          source: "https://medium.com/@jacksonfdam/hackers-gonna-hack-common-bypass-techniques-and-how-to-fight-back-43eb21e1c8f0",
          chapters: 3
        },
        {
          id: "owasp-mobile-top-10",
          title: "Mobile Security Dumpster Fire",
          tagline: "OWASP Mobile Top 10 for normal humans",
          file: "library/threat-surface/owasp-mobile-top-10.md",
          source: "https://medium.com/@jacksonfdam/so-your-mobile-app-is-a-security-dumpster-fire-owasp-mobile-top-10-for-normal-humans-ddf1ae85f61d",
          chapters: 3
        }
      ]
    },
    {
      id: "identity-trust",
      name: "Identity & Trust",
      icon: "🔐",
      color: "#00D4FF",
      desc: "Knowing who's on the other end of your API.",
      books: [
        {
          id: "attestation-fingerprinting",
          title: "Bulletproof Security",
          tagline: "Combining attestation and fingerprinting",
          file: "library/identity-trust/attestation-fingerprinting.md",
          source: "https://medium.com/@jacksonfdam/building-a-bulletproof-security-system-combining-attestation-and-fingerprinting-2f4d65c02128",
          chapters: 3
        },
        {
          id: "fingerprinting-csi",
          title: "Fingerprinting Android Devices",
          tagline: "Like CSI, but for your app",
          file: "library/identity-trust/fingerprinting-csi.md",
          source: "https://medium.com/@jacksonfdam/fingerprinting-android-devices-like-csi-but-for-your-app-e99a1aeff248",
          chapters: 3
        },
        {
          id: "device-attestation-101",
          title: "Device Attestation 101",
          tagline: "Making sure your users aren't evil robots",
          file: "library/identity-trust/device-attestation-101.md",
          source: "https://medium.com/@jacksonfdam/device-attestation-101-making-sure-your-users-arent-evil-robots-75928cc1bd0c",
          chapters: 3
        },
        {
          id: "trust-no-one",
          title: "Trust No One",
          tagline: "Why your Android app needs to verify devices",
          file: "library/identity-trust/trust-no-one.md",
          source: "https://medium.com/@jacksonfdam/trust-no-one-why-your-android-app-needs-to-verify-devices-1228f186a941",
          chapters: 3
        },
        {
          id: "attestation-fingerprinting-series",
          title: "Attestation & Fingerprinting (Series)",
          tagline: "End-to-end Android device verification",
          file: "library/identity-trust/attestation-fingerprinting-series.md",
          source: "https://medium.com/@jacksonfdam/android-security-series-device-attestation-and-fingerprinting-887aafde3e60",
          chapters: 3
        }
      ]
    },
    {
      id: "privacy-compliance",
      name: "Privacy & Compliance",
      icon: "🕵️",
      color: "#5DE2A3",
      desc: "Where lawful collection meets effective security.",
      books: [
        {
          id: "privacy-vs-security",
          title: "Privacy vs. Security",
          tagline: "Walking the tightrope of user trust",
          file: "library/privacy-compliance/privacy-vs-security.md",
          source: "https://medium.com/@jacksonfdam/privacy-vs-security-walking-the-tightrope-of-user-trust-c29e69199191",
          chapters: 3
        },
        {
          id: "hackers-need-hobbies",
          title: "Mobile Security",
          tagline: "Because hackers need hobbies too",
          file: "library/privacy-compliance/hackers-need-hobbies.md",
          source: "https://medium.com/@jacksonfdam/mobile-security-because-hackers-need-hobbies-too-6b84b0ab52d8",
          chapters: 3
        }
      ]
    },
    {
      id: "underbelly",
      name: "The Underbelly",
      icon: "🌍",
      color: "#FFB347",
      desc: "Custom ROMs, OEM politics and the messy real world.",
      books: [
        {
          id: "custom-roms-rooted",
          title: "Custom ROMs & Rooted Devices",
          tagline: "The security wild west",
          file: "library/underbelly/custom-roms-rooted.md",
          source: "https://medium.com/@jacksonfdam/custom-roms-and-rooted-devices-the-security-wild-west-c5de72851582",
          chapters: 3
        },
        {
          id: "android-undercover",
          title: "Android Goes Undercover",
          tagline: "The not-so-open-source saga",
          file: "library/underbelly/android-undercover.md",
          source: "https://medium.com/@jacksonfdam/googles-android-goes-undercover-the-not-so-open-source-saga-626c30a7a507",
          chapters: 3
        },
        {
          id: "manufacturers-dilemma",
          title: "The Manufacturer's Dilemma",
          tagline: "How Samsung, Huawei and others handle security",
          file: "library/underbelly/manufacturers-dilemma.md",
          source: "https://medium.com/@jacksonfdam/the-manufacturers-dilemma-how-samsung-huawei-and-others-handle-security-c898bdc02775",
          chapters: 3
        }
      ]
    },
    {
      id: "tools-tactics",
      name: "Tools & Tactics",
      icon: "🛠️",
      color: "#B57BFF",
      desc: "The toolbelt of an Android security engineer.",
      books: [
        {
          id: "command-line-tools",
          title: "Android Command-Line Tools",
          tagline: "A guide for the terminally confused",
          file: "library/tools-tactics/command-line-tools.md",
          source: "https://medium.com/@jacksonfdam/android-command-line-tools-a-guide-for-the-terminally-confused-d5367df1b3c6",
          chapters: 3
        },
        {
          id: "cuttlefish",
          title: "Cuttlefish 🦑",
          tagline: "The Android emulator you didn't know you needed",
          file: "library/tools-tactics/cuttlefish.md",
          source: "https://medium.com/@jacksonfdam/cuttlefish-the-android-emulator-you-didnt-know-you-needed-94b86ccc23f3",
          chapters: 3
        },
        {
          id: "avd-deep-dive",
          title: "Exploring AVDs 🚀",
          tagline: "More than just emulators",
          file: "library/tools-tactics/avd-deep-dive.md",
          source: "https://medium.com/@jacksonfdam/exploring-android-virtual-devices-avds-more-than-just-emulators-d93a0450ce53",
          chapters: 3
        },
        {
          id: "automating-input",
          title: "Automating Input Events",
          tagline: "A comprehensive guide",
          file: "library/tools-tactics/automating-input.md",
          source: "https://medium.com/@jacksonfdam/automating-input-events-on-android-a-comprehensive-guide-c2a1927217ce",
          chapters: 3
        },
        {
          id: "installer-source",
          title: "Verifying Installer Source",
          tagline: "Stopping sideload-and-tamper attacks",
          file: "library/tools-tactics/installer-source.md",
          source: "https://medium.com/@jacksonfdam/enhancing-android-app-security-verifying-installer-source-and-more-466d9240a605",
          chapters: 3
        }
      ]
    },
    {
      id: "hands-on",
      name: "Hands-on Lab",
      icon: "🧪",
      color: "#00FF88",
      desc: "Vulnerable apps to practice everything you learned.",
      books: [
        {
          id: "hackdroid",
          title: "Hackdroid",
          tagline: "An intentionally vulnerable Android app for security presentations",
          file: "library/hands-on/hackdroid.md",
          source: "https://github.com/jacksonfdam/hackdroid",
          chapters: 3
        }
      ]
    }
  ];

  function totalChapters() {
    return AREAS.reduce((s, a) => s + a.books.reduce((bs, b) => bs + b.chapters, 0), 0);
  }
  function totalBooks() {
    return AREAS.reduce((s, a) => s + a.books.length, 0);
  }
  function getArea(id) { return AREAS.find(a => a.id === id) || null; }
  function getBook(id) {
    for (const a of AREAS) for (const b of a.books) if (b.id === id) return Object.assign({ area: a }, b);
    return null;
  }

  return {
    AREAS,
    POINTS_PER_CHAPTER, POINTS_PER_BOOK,
    totalChapters, totalBooks, getArea, getBook
  };
})();
