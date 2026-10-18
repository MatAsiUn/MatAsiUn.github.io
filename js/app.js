// Light/dark mode button in the top bar.
// The starting theme is picked by a small script in each page's <head>,
// so the page never flashes the wrong colours.
(function () {
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  function label() {
    const dark = document.documentElement.dataset.theme === "dark";
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }

  button.addEventListener("click", function () {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (error) {}
    label();
  });

  label();
})();

// Left and right arrow keys move to the previous or next page in the top bar,
// wrapping round from Contact back to Home (and the other way).
(function () {
  const links = Array.from(document.querySelectorAll(".nav a"));
  const current = links.findIndex(function (link) {
    return link.getAttribute("aria-current") === "page";
  });
  if (current === -1) return; // e.g. the 404 page, which isn't one of the four

  document.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    // Leave browser shortcuts (like Alt+Left for Back) and typing alone
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest("input, textarea, select, [contenteditable]")) return;

    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = (current + step + links.length) % links.length;
    window.location.href = links[next].href;
  });
})();

// CV page: once the section links in the intro card scroll out of view, the
// top bar grows a row of section links. The link for the section on screen
// lights up, and a bar along the bottom fills as you read down the CV.
(function () {
  const sectionNav = document.getElementById("section-nav");
  const jumpLinks = document.getElementById("jump-links");
  if (!sectionNav || !jumpLinks) return;

  const topbar = sectionNav.closest(".topbar");
  const fill = document.getElementById("section-progress-fill");
  const links = Array.from(sectionNav.querySelectorAll("a"));
  const sections = links.map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  });

  function update() {
    const barBottom = topbar.getBoundingClientRect().bottom;
    topbar.classList.toggle("expanded", jumpLinks.getBoundingClientRect().bottom < barBottom);

    // The current section is the last one whose top has passed just below the bar
    const line = barBottom + 40;
    let current = 0;
    sections.forEach(function (section, index) {
      if (section.getBoundingClientRect().top <= line) current = index;
    });
    // At the very bottom of the page, the last section counts as current
    // even if it is too short for its top to reach the line
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = sections.length - 1;

    links.forEach(function (link, index) {
      link.classList.toggle("active", index === current);
      if (index === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    // Progress through the CV: 0 at the top of the first section, 1 at the end of the page
    const start = sections[0].getBoundingClientRect().top + window.scrollY - line;
    const end = document.documentElement.scrollHeight - window.innerHeight;
    const progress = end > start ? (window.scrollY - start) / (end - start) : 1;
    fill.style.transform = "scaleX(" + Math.min(1, Math.max(0, progress)) + ")";
  }

  let queued = false;
  function queueUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      update();
    });
  }

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  update();
})();
