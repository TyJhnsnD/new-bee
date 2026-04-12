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

function initCommitmentBees() {
  const section = document.querySelector(".commitment-section");
  if (!section) {
    return;
  }

  const swarm = document.createElement("div");
  swarm.className = "bee-swarm";
  swarm.setAttribute("aria-hidden", "true");
  section.prepend(swarm);

  const beeImage = "/static/img/bee_fly.gif";
  const driftBees = [];
  const driftCount = 4;

  function createBee(className) {
    const bee = document.createElement("img");
    bee.className = className;
    bee.src = beeImage;
    bee.alt = "";
    bee.loading = "lazy";
    bee.decoding = "async";
    swarm.appendChild(bee);
    return bee;
  }

  function readBounds() {
    const rect = section.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  let bounds = readBounds();

  for (let i = 0; i < driftCount; i += 1) {
    const bee = createBee("bee-sprite bee--drifter");
    const anchorX = Math.random() * Math.max(1, bounds.width);
    const anchorY = Math.random() * Math.max(1, bounds.height);

    driftBees.push({
      bee,
      anchorX,
      anchorY,
      prevX: anchorX,
      ampX: 55 + Math.random() * 90,
      ampY: 30 + Math.random() * 85,
      freqX: 0.00035 + Math.random() * 0.00065,
      freqY: 0.0004 + Math.random() * 0.0007,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      drift: 14 + Math.random() * 26,
      direction: Math.random() > 0.5 ? 1 : -1,
    });
  }

  const followerBee = createBee("bee-sprite bee--cursor");
  let followerX = bounds.width * 0.5;
  let followerY = bounds.height * 0.48;
  let targetX = followerX;
  let targetY = followerY;
  let followerAngle = 0;

  section.addEventListener("mousemove", (event) => {
    const rect = section.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;
  });

  section.addEventListener("mouseleave", () => {
    targetX = bounds.width * 0.5;
    targetY = bounds.height * 0.5;
  });

  window.addEventListener("resize", () => {
    bounds = readBounds();
    targetX = Math.min(targetX, bounds.width);
    targetY = Math.min(targetY, bounds.height);
  });

  function keepInside(value, max) {
    const minPadding = 24;
    const maxPadding = Math.max(minPadding, max - minPadding);
    return Math.min(maxPadding, Math.max(minPadding, value));
  }

  function animate(time) {
    driftBees.forEach((state) => {
      state.anchorX += (state.drift * state.direction) / 60;
      if (state.anchorX > bounds.width + 80) {
        state.anchorX = -80;
      }
      if (state.anchorX < -80) {
        state.anchorX = bounds.width + 80;
      }

      const x = state.anchorX + Math.sin(time * state.freqX + state.phaseX) * state.ampX;
      const y = state.anchorY + Math.cos(time * state.freqY + state.phaseY) * state.ampY;
      const safeX = keepInside(x, bounds.width);
      const safeY = keepInside(y, bounds.height);
      const facing = safeX >= state.prevX ? 1 : -1;
      state.prevX = safeX;

      state.bee.style.transform = `translate(${safeX}px, ${safeY}px) scaleX(${facing})`;
    });

    const prevX = followerX;
    const prevY = followerY;
    followerX += (targetX - followerX) * 0.085;
    followerY += (targetY - followerY) * 0.085;

    const vx = followerX - prevX;
    const vy = followerY - prevY;
    if (Math.abs(vx) + Math.abs(vy) > 0.08) {
      followerAngle = Math.atan2(vy, vx);
    }

    const tilt = followerAngle * (180 / Math.PI);
    const facingX = vx >= 0 ? 1 : -1;
    const safeFollowerX = keepInside(followerX, bounds.width);
    const safeFollowerY = keepInside(followerY, bounds.height);
    followerBee.style.transform = `translate(${safeFollowerX}px, ${safeFollowerY}px) rotate(${tilt}deg) scaleX(${facingX})`;

    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
}

initCommitmentBees();
