/* ============================================================
   Astrion Studio — interaction layer
   Pattern: Scroll-Triggered Storytelling
   Every effect degrades to a readable static page when
   prefers-reduced-motion is set or JS fails to load.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Scroll reveal ---------- */

  function initReveal() {
    var items = document.querySelectorAll('.reveal');

    // No IntersectionObserver, or the user opted out of motion:
    // show everything immediately rather than leaving it invisible.
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target); // reveal once, then stop watching
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Sticky nav background + scroll progress ---------- */

  function initScrollChrome() {
    var nav = document.getElementById('nav');
    var bar = document.getElementById('progress');
    var ticking = false;

    function paint() {
      var y = window.scrollY || document.documentElement.scrollTop;

      if (nav) {
        var solid = y > 24;
        nav.classList.toggle('bg-background/85', solid);
        nav.classList.toggle('backdrop-blur-xl', solid);
        nav.classList.toggle('border-b', solid);
        nav.classList.toggle('border-border/40', solid);
      }

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }, { passive: true });

    paint();
  }

  /* ---------- Mobile menu ---------- */

  function initMenu() {
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    function setOpen(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    btn.addEventListener('click', function () {
      setOpen(menu.hidden);
    });

    // Close after navigating to a section
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Never leave the menu open when we cross back to the desktop layout
    window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- Work filter ---------- */

  function initFilter() {
    var buttons = document.querySelectorAll('.filter-btn');
    var items = document.querySelectorAll('.work-item');
    var status = document.getElementById('filter-status');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.dataset.filter;
        var shown = 0;

        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });

        items.forEach(function (item) {
          var match = want === 'all' || item.dataset.category === want;
          item.hidden = !match;
          if (match) shown++;
        });

        if (status) {
          status.textContent = shown + (shown === 1 ? ' project' : ' projects') + ' shown.';
        }
      });
    });
  }

  /* ---------- Reel modal ---------- */

  function initReel() {
    var modal = document.getElementById('reel-modal');
    var open = document.getElementById('reel-btn');
    var close = document.getElementById('reel-close');
    var overlay = document.getElementById('reel-overlay');
    if (!modal || !open) return;

    var lastFocused = null;

    function show() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (close) close.focus();
    }

    function hide() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    open.addEventListener('click', show);
    if (close) close.addEventListener('click', hide);
    if (overlay) overlay.addEventListener('click', hide);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) hide();
    });
  }

  /* ---------- Contact form ---------- */

  function initForm() {
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var required = form.querySelectorAll('[required]');
      var firstBad = null;

      required.forEach(function (field) {
        var ok = field.checkValidity() && field.value.trim() !== '';
        field.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstBad) firstBad = field;
      });

      if (firstBad) {
        if (status) status.textContent = 'Please fill in the highlighted fields.';
        firstBad.focus();
        return;
      }

      // No backend wired up yet — swap this for a POST to your booking handler.
      if (status) {
        status.textContent = 'Thanks — we hold this slot for 24 hours. Connect a form endpoint to deliver the request.';
      }
      form.reset();
    });
  }

  /* ---------- Studio clock (IST) ---------- */

  function initClock() {
    var el = document.getElementById('clock');
    if (!el) return;

    function tick() {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Boot ---------- */

  function boot() {
    initReveal();
    initScrollChrome();
    initMenu();
    initFilter();
    initReel();
    initForm();
    initClock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
