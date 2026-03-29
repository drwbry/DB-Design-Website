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

  // ── Contact Modal ────────────────────────────────────────────
  const modal = document.getElementById('contact-modal');
  const modalCard = modal?.querySelector('.modal-card');
  const modalBody = document.getElementById('modal-body');
  const modalSuccess = document.getElementById('modal-success');

  function openModal() {
    modal.removeAttribute('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close')?.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    modal.addEventListener('transitionend', () => {
      modal.setAttribute('hidden', '');
      if (modalBody) modalBody.hidden = false;
      if (modalSuccess) modalSuccess.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message <span class="btn-arrow">→</span>';
      }
      if (form) form.reset();
      if (urlField) urlField.hidden = true;
      if (urlInput) urlInput.value = '';
      if (formError) formError.hidden = true;
    }, { once: true });
  }

  document.querySelectorAll('.js-open-modal').forEach(btn =>
    btn.addEventListener('click', (e) => { e.preventDefault(); openModal(); })
  );
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-success-close')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (!modalCard?.contains(e.target)) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  // Phone auto-format
  const phoneInput = document.getElementById('f-phone');
  phoneInput?.addEventListener('input', (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = '';
    if (digits.length >= 1) formatted = '(' + digits.slice(0, 3);
    if (digits.length >= 4) formatted += ') ' + digits.slice(3, 6);
    if (digits.length >= 7) formatted += '-' + digits.slice(6, 10);
    e.target.value = formatted;
  });

  // Conditional URL field
  const urlField = document.getElementById('url-field');
  const urlInput = document.getElementById('f-url');
  document.querySelectorAll('input[name="has_website"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const show = radio.value === 'yes' && radio.checked;
      urlField.hidden = !show;
      if (!show) urlInput.value = '';
    });
  });

  // Form submission → Cloudflare Worker
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const formError = document.getElementById('form-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    formError.hidden = true;

    const payload = Object.fromEntries(new FormData(form));
    payload.subject = 'New Website Inquiry — The Web Foundry';

    try {
      const res = await fetch('https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        modalBody.hidden = true;
        modalSuccess.hidden = false;
        form.reset();
      } else {
        throw new Error(result.message || 'Something went wrong.');
      }
    } catch (err) {
      formError.textContent = err.message || 'Could not send message. Please email hello@cincinnatiwebfoundry.com directly.';
      formError.hidden = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <span class="btn-arrow">→</span>';
    }
  });

});
