/* shared.js — DB Design shared utilities */

// ── Scroll Reveal ──────────────────────────────────────────
(function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();

// ── Counter Animation ──────────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const isInt = Number.isInteger(target);

  function step(now) {
    const elapsed = Math.min(now - start, duration);
    const progress = elapsed / duration;
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = isInt ? Math.round(value) : value.toFixed(1);
    if (elapsed < duration) requestAnimationFrame(step);
    else el.textContent = isInt ? target : target.toFixed(1);
  }

  requestAnimationFrame(step);
}

// Trigger counters when in view
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseFloat(entry.target.dataset.count);
          animateCounter(entry.target, target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => obs.observe(c));
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCounters();
});
