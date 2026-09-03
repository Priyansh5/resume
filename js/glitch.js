/* ==========================================================================
   Glitch — character corruption engine
   1. Hero name: RGB-split layers + periodic scramble/corruption bursts
   2. Titles decode (scramble → resolve) as they scroll into view
   3. Scroll progress stream (thin data-stream bar at top)
   Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* corruption glyphs: solid blocks + half-shades + a few terminal chars —
     reads as "signal corruption", way better than random punctuation */
  var CHARS = '█▓▒░<>/\\#%01';

  /* ---------------- scroll progress stream ---------------- */
  var bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 0 ? (window.scrollY / max) : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
      ticking = false;
    });
  }, { passive: true });

  if (REDUCED) return; /* everything below is motion-only */

  /* ---------------- text scramble engine ---------------- */
  function scrambleTextNode(node, duration) {
    var original = node.nodeValue;
    if (!original.trim()) return;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var reveal = Math.floor(original.length * p);
      var out = '';
      for (var i = 0; i < original.length; i++) {
        var ch = original.charAt(i);
        if (i < reveal || ch === ' ') out += ch;
        else out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
      node.nodeValue = out;
      if (p < 1) requestAnimationFrame(frame);
      else node.nodeValue = original;
    }
    requestAnimationFrame(frame);
  }

  function scrambleElement(el, duration) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    }
    nodes.forEach(function (n) { scrambleTextNode(n, duration); });
  }

  /* ---------------- hero name: wrap + glitch layers ---------------- */
  var hero = document.querySelector('.hero-name');
  if (hero) {
    var spans = [];
    Array.prototype.slice.call(hero.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && n.nodeValue.trim()) {
        var hadTrailing = /\s$/.test(n.nodeValue);
        var span = document.createElement('span');
        span.className = 'glitch';
        span.setAttribute('data-text', n.nodeValue.trim());
        n.nodeValue = n.nodeValue.trim();
        hero.replaceChild(span, n);
        span.appendChild(n);
        if (hadTrailing && span.nextSibling) {
          hero.insertBefore(document.createTextNode(' '), span.nextSibling);
        }
        spans.push(span);
      } else if (n.nodeType === 1) {
        n.classList.add('glitch');
        n.setAttribute('data-text', (n.textContent || '').trim());
        spans.push(n);
      }
    });

    var bursting = false;
    function glitchBurst() {
      if (bursting || !spans.length) return;
      bursting = true;
      spans.forEach(function (s) {
        s.classList.add('glitching');
        scrambleElement(s, 900);
        setTimeout(function () { s.classList.remove('glitching'); }, 780);
      });
      setTimeout(function () { bursting = false; }, 950);
    }

    /* micro signal-tear: 0.28s light band shift between full bursts —
       gives the name a living "interference" quality without full corruption */
    var tearing = false;
    function microTear() {
      if (bursting || tearing || !spans.length) return;
      tearing = true;
      spans.forEach(function (s) {
        s.classList.add('tearing');
        setTimeout(function () { s.classList.remove('tearing'); }, 300);
      });
      setTimeout(function () { tearing = false; }, 480);
    }

    /* first corruption fires AFTER the boot overlay lifts (~1.35s),
       so it is the first thing you actually see */
    setTimeout(glitchBurst, 1600);
    (function burstLoop() {                   /* periodic full corruption */
      setTimeout(function () {
        glitchBurst();
        burstLoop();
      }, 3400 + Math.random() * 2600);
    })();
    (function tearLoop() {                    /* micro-tears between bursts */
      setTimeout(function () {
        microTear();
        tearLoop();
      }, 1700 + Math.random() * 1700);
    })();
    hero.addEventListener('mouseenter', glitchBurst); /* hover = extra burst */
  }

  /* ---------------- decode titles on scroll ---------------- */
  var DECODE_SEL = '.section-title, .page-title, .company-name, .blog-title, .project-name, .cert-name, .hof-title';
  var targets = document.querySelectorAll(DECODE_SEL);
  if ('IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          scrambleElement(entry.target, 650);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -30px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }
})();
