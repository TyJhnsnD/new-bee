const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    }
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".hero, .section-panel").forEach((element) => {
  element.classList.add("reveal");
  observer.observe(element);
});

const nav = document.querySelector(".main-nav");
const navIndicator = document.querySelector(".main-nav-indicator");
const navLinks = Array.from(document.querySelectorAll(".main-nav a"));

function moveNavIndicator(activeLink) {
  if (!nav || !navIndicator || !activeLink) {
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const offsetX = linkRect.left - navRect.left;

  navIndicator.style.width = `${linkRect.width}px`;
  navIndicator.style.transform = `translateX(${offsetX}px)`;

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link === activeLink);
  });

  nav.classList.add("is-ready");
}

function getSectionFromLink(link) {
  const href = link.getAttribute("href") || "";
  const hashIndex = href.indexOf("#");
  if (hashIndex < 0) {
    return null;
  }
  const sectionId = href.slice(hashIndex + 1);
  return document.getElementById(sectionId);
}

const trackedSections = navLinks
  .map((link) => ({ link, section: getSectionFromLink(link) }))
  .filter((item) => Boolean(item.section));

if (trackedSections.length > 0) {
  let activeEntry = trackedSections[0];

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length === 0) {
        return;
      }

      const nextSection = visibleEntries[0].target;
      const nextEntry = trackedSections.find((item) => item.section === nextSection);

      if (nextEntry) {
        activeEntry = nextEntry;
        moveNavIndicator(activeEntry.link);
      }
    },
    {
      threshold: [0.35, 0.5, 0.7],
      rootMargin: "-18% 0px -40% 0px",
    }
  );

  trackedSections.forEach((item) => {
    sectionObserver.observe(item.section);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      moveNavIndicator(link);
    });
  });

  moveNavIndicator(activeEntry.link);
  window.addEventListener("resize", () => moveNavIndicator(activeEntry.link));
}
