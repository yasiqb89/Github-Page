// ── Contact — slide-in drawer + form submission ──────────────
// Opened by the "Get in touch" buttons ([data-contact-open]); closed by the
// scrim, the ✕, Esc, or the success state's button. The panel is a real modal
// dialog: focus is trapped inside it while open, Esc closes, and focus returns
// to whatever opened it. Background scroll is frozen via Lenis (or native
// overflow when Lenis isn't running).
//
// Submission is server-less. The site is static (GitHub Pages), so the form
// POSTs to FormSubmit.co — a no-account relay that forwards submissions to the
// address baked into ENDPOINT. The FIRST submission to a new address triggers a
// one-time confirmation email FormSubmit sends to that inbox; once its link is
// clicked, every later submission is delivered silently.
//
// Privacy note: the target address is visible in this file (and the public
// repo). After activating, FormSubmit issues a random alias endpoint
// (formsubmit.co/ajax/<hash>) that hides the real address from harvesters —
// swap it into ENDPOINT below and the email is no longer exposed.
const ENDPOINT = 'https://formsubmit.co/ajax/focusdevacc@gmail.com';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initContact(lenis) {
  const root = document.getElementById('contact');
  if (!root) return;

  const panel   = root.querySelector('.contact__panel');
  const form    = root.querySelector('.contact__form');
  const doneView = root.querySelector('.contact__done');
  const sendBtn = root.querySelector('.contact__send');
  const errEl   = root.querySelector('.contact__error');
  const openers = document.querySelectorAll('[data-contact-open]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lastFocused = null;
  let isOpen = false;

  // ── open / close ───────────────────────────────────────────
  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocused = document.activeElement;
    root.hidden = false;
    // force a reflow so the panel starts at translateX(100%) before .is-open
    // flips it to 0 — otherwise the browser collapses both into one frame and
    // the slide never animates.
    void root.offsetWidth;
    root.classList.add('is-open');

    if (lenis && lenis.stop) lenis.stop();
    else document.documentElement.style.overflowY = 'hidden';

    // focus the first real field a beat in (after the slide settles)
    const firstField = form.querySelector('input, textarea');
    setTimeout(() => firstField && firstField.focus({ preventScroll: true }), reduced ? 0 : 260);

    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('is-open');
    document.removeEventListener('keydown', onKeydown);

    if (lenis && lenis.start) lenis.start();
    else document.documentElement.style.overflowY = '';

    // hide from layout/AT after the slide-out finishes; reset the view so a
    // reopen always shows a fresh form (not a lingering success/error state).
    const finish = () => { root.hidden = true; resetView(); };
    if (reduced) finish();
    else setTimeout(finish, 500);

    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    // focus trap
    const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  openers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();      // these are real links to GitHub as a no-JS fallback
      open();
    });
  });
  root.querySelectorAll('[data-contact-close]').forEach((btn) =>
    btn.addEventListener('click', close));

  // ── view state ─────────────────────────────────────────────
  function resetView() {
    form.hidden = false;
    doneView.hidden = true;
    form.reset();
    clearErrors();
    sendBtn.classList.remove('is-sending');
    sendBtn.disabled = false;
  }
  function showDone() {
    form.hidden = true;
    doneView.hidden = false;
    // move focus to the success view's close button
    const doneClose = doneView.querySelector('.contact__done-close');
    doneClose && doneClose.focus({ preventScroll: true });
  }
  function clearErrors() {
    errEl.hidden = true; errEl.textContent = '';
    form.querySelectorAll('.contact__field.is-invalid').forEach((f) => f.classList.remove('is-invalid'));
  }
  function fieldError(name) {
    const input = form.elements[name];
    if (input) input.closest('.contact__field')?.classList.add('is-invalid');
  }

  // ── submit ─────────────────────────────────────────────────
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    // honeypot — a real user never fills a field they can't see
    if (form.elements._honey && form.elements._honey.value) { showDone(); return; }

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    const bad = [];
    if (!name) bad.push('name');
    if (!validEmail(email)) bad.push('email');
    if (!message) bad.push('message');
    if (bad.length) {
      bad.forEach(fieldError);
      errEl.textContent = bad.includes('email') && name && message
        ? 'Please enter a valid email address.'
        : 'Please fill in your name, a valid email, and a message.';
      errEl.hidden = false;
      form.elements[bad[0]].focus({ preventScroll: true });
      return;
    }

    sendBtn.classList.add('is-sending');
    sendBtn.disabled = true;

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name, email, message,
          _subject: `New Focus contact — ${name}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showDone();
    } catch (err) {
      sendBtn.classList.remove('is-sending');
      sendBtn.disabled = false;
      errEl.innerHTML =
        'Something went wrong sending that. Please email ' +
        '<a href="mailto:focusdevacc@gmail.com">focusdevacc@gmail.com</a> directly.';
      errEl.hidden = false;
    }
  });
}
