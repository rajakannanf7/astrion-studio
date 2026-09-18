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

  /* ---------- Parallax (hero photo + room tiles) ---------- */

  function initParallax() {
    if (reduceMotion.matches) return;

    var hero = document.getElementById('hero-bg');
    var heroSection = hero ? hero.closest('section') : null;
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.work-bg'));
    var visible = new Set();
    var ticking = false;

    // Only drive tiles that are on screen
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
        });
        request();
      }, { rootMargin: '10% 0px' });
      tiles.forEach(function (t) { io.observe(t.parentElement); });
    }

    function frame() {
      ticking = false;
      var y = window.scrollY;
      var vh = window.innerHeight;

      // Hero: photo moves at ~35% of scroll speed and eases in slightly
      if (hero && heroSection && y < heroSection.offsetHeight) {
        var p = y / heroSection.offsetHeight;
        hero.style.transform =
          'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0) scale(' + (1.06 + p * 0.06).toFixed(4) + ')';
      }

      // Tiles: drift up to ~7% of their height against the scroll
      visible.forEach(function (card) {
        var bg = card.querySelector('.work-bg');
        var r = card.getBoundingClientRect();
        var t = (r.top + r.height / 2 - vh / 2) / vh;          // -1 .. 1 across the screen
        bg.style.setProperty('--py', (t * r.height * -0.14).toFixed(1) + 'px');
      });
    }

    function request() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(frame);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    request();
  }

  /* ---------- Custom cursor (mouse / trackpad only) ---------- */

  function initCursor() {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches || reduceMotion.matches) return;

    var root = document.documentElement;
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var label = document.querySelector('.cursor-label');
    if (!dot || !ring) return;

    var mx = -100, my = -100;   // pointer
    var rx = -100, ry = -100;   // ring (trails behind)
    var started = false;

    var HOVER = 'a, button, [role="button"], label, .filter-btn';
    var FIELDS = 'input, textarea, select';

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      window.requestAnimationFrame(loop);
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!started) {
        started = true;
        rx = mx; ry = my;
        root.classList.add('has-cursor');   // hide native cursor only once ours is visible
        window.requestAnimationFrame(loop);
      }
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      var el = e.target;
      var labelled = el.closest('[data-cursor]');
      var field = el.closest(FIELDS);

      root.classList.toggle('cursor-hidden', !!field);   // native I-beam takes over in fields
      root.classList.toggle('cursor-label-on', !!labelled);
      root.classList.toggle('cursor-hover', !labelled && !field && !!el.closest(HOVER));
      if (labelled) label.textContent = labelled.getAttribute('data-cursor');
    });

    document.addEventListener('mousedown', function () { root.classList.add('cursor-down'); });
    document.addEventListener('mouseup', function () { root.classList.remove('cursor-down'); });
    document.documentElement.addEventListener('mouseleave', function () { root.classList.add('cursor-hidden'); });
    document.documentElement.addEventListener('mouseenter', function () { root.classList.remove('cursor-hidden'); });

    // If the user switches to touch mid-session, give the native cursor back
    fine.addEventListener('change', function (e) {
      if (!e.matches) root.classList.remove('has-cursor');
    });
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
    initParallax();
    initCursor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
