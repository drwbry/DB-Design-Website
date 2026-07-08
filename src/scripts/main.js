/* main.js — The Web Foundry hub page interactivity */
import { siteConfig } from '../config/site.js';

document.addEventListener('DOMContentLoaded', () => {

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
      navLinks.style.background = 'rgba(24,28,40,0.97)';
      navLinks.style.padding = '1.5rem 2rem 2rem';
      navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
      navLinks.style.backdropFilter = 'blur(20px)';
    });
  }

  // ── Smooth scroll for nav/anchor links ─────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
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

  document.getElementById('nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

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
    payload.subject = siteConfig.formSubjects.hub;

    try {
      const res = await fetch(siteConfig.formWorkerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        modalBody.hidden = true;
        modalSuccess.hidden = false;
        form.reset();
      } else {
        throw new Error(result.message || 'Something went wrong.');
      }
    } catch (err) {
      formError.textContent = err.message || `Could not send message. Please email ${siteConfig.contactEmail} directly.`;
      formError.hidden = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Message <span class="btn-arrow">→</span>';
      if (window.turnstile) window.turnstile.reset();
    }
  });

});
