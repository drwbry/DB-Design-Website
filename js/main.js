/* main.js — DB Design hub page interactivity */

document.addEventListener('DOMContentLoaded', () => {

  // ── Nav scroll effect ──────────────────────────────────────
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Hamburger menu ─────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav__links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.style.display === 'flex';
      navLinks.style.display = open ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '72px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'rgba(10,10,10,0.97)';
      navLinks.style.padding = '1.5rem 2rem 2rem';
      navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.07)';
      navLinks.style.backdropFilter = 'blur(20px)';
    });
  }

  // ── Magnetic card effect ────────────────────────────────────
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `
        translateY(-8px)
        scale(1.01)
        rotateX(${-y * 4}deg)
        rotateY(${x * 4}deg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1), border-color 0.35s ease, box-shadow 0.4s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.35s ease, box-shadow 0.4s ease';
    });
  });

  // ── Smooth scroll for nav links ────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72; // nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        if (navLinks && navLinks.style.display === 'flex' && window.innerWidth < 768) {
          navLinks.style.display = 'none';
        }
      }
    });
  });

  // ── Parallax hero glow ─────────────────────────────────────
  const heroGlow = document.querySelector('.hero__glow');
  if (heroGlow) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroGlow.style.transform = `translateX(-50%) translateY(${y * 0.3}px)`;
    }, { passive: true });
  }

});
