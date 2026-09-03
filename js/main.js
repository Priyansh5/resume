/* ==========================================================================
   Main — nav, typing effect, scroll reveals, counters, copy email, footer year
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- Nav: scrolled state + mobile toggle + active link ---------------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // active nav link from data-page
  var page = document.body.getAttribute('data-page');
  if (page) {
    var link = document.querySelector('.nav-links a[data-nav="' + page + '"]');
    if (link) link.classList.add('active');
  }

  /* ---------------- Typing effect (hero) ---------------- */
  var typeTarget = document.getElementById('typing-text');
  if (typeTarget) {
    var roles = [
      'Security Analyst',
      'Penetration Tester',
      'Bug Bounty Hunter',
      'Vulnerability Researcher',
      'OWASP Top 10 Specialist'
    ];
    var roleIdx = 0, charIdx = 0, deleting = false;

    function type() {
      var current = roles[roleIdx];
      var speed = deleting ? 38 : 78;

      if (!deleting && charIdx < current.length) {
        typeTarget.textContent = current.slice(0, ++charIdx);
        setTimeout(type, speed);
      } else if (deleting && charIdx > 0) {
        typeTarget.textContent = current.slice(0, --charIdx);
        setTimeout(type, speed);
      } else if (!deleting) {
        deleting = true;
        setTimeout(type, 2100); // hold at full word
      } else {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        setTimeout(type, 420);
      }
    }
    /* sync with boot overlay (created by transition.js before this script):
       start typing right as the overlay finishes lifting */
    setTimeout(type, document.getElementById('hack-overlay') ? 1750 : 700);
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------------- Animated counters ---------------- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1800;
    var start = null;

    function frame(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var val = Math.round(target * eased);
      el.textContent = prefix + val.toLocaleString('en-US') + suffix;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target.toLocaleString('en-US') + suffix;
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------------- Copy email buttons ---------------- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var original = btn.textContent;
      function done() {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
      } else fallback();

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
