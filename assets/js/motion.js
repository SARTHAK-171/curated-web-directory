// motion.js — scroll-reveal animation.
//
// Things below the fold fade in and rise a little, once, as the visitor
// scrolls to them. Mark them in the HTML like this:
//   <div data-reveal>               -> that element is revealed
//   <ul data-reveal-stagger>        -> each child is revealed, one after another
//
// Anything already on screen is left alone. Nothing is hidden at all when the
// visitor has asked their device for reduced motion.
//
// It is safe to call setupScrollReveal() more than once. Elements that were
// already set up are skipped, so pages that add cards later (after loading
// data) can simply call it again.

export function setupScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = [];
  for (const element of document.querySelectorAll("[data-reveal]")) {
    targets.push({ element, order: 0 });
  }
  for (const group of document.querySelectorAll("[data-reveal-stagger]")) {
    [...group.children].forEach((element, index) => {
      targets.push({ element, order: Math.min(index, 5) }); // at most 5 steps of delay
    });
  }

  // Skip anything we have already handled on an earlier call
  const fresh = targets.filter(({ element }) => !element.hasAttribute("data-reveal-ready"));
  if (fresh.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("reveal-hidden");
        entry.target.classList.add("reveal-in");
        observer.unobserve(entry.target); // only animate once
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  for (const { element, order } of fresh) {
    element.setAttribute("data-reveal-ready", "");
    if (element.getBoundingClientRect().top < window.innerHeight) continue; // already visible
    element.style.setProperty("--i", order);
    element.classList.add("reveal-hidden");
    observer.observe(element);
  }
}
