/* ==========================================================================
   Transition — hacking-style page transitions
   - EXIT: clicking an internal link plays a terminal "intrusion" overlay,
     then navigates.
   - ENTER: every page load boots with a quick "decrypting" overlay that
     fades away.
   - window.hackGo(href) exposed for the interactive terminal.
   Respects prefers-reduced-motion (instant navigation, no overlays).
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- overlay factory ---------------- */
  function makeOverlay(kind) {
    var ov = document.createElement('div');
    ov.id = 'hack-overlay';
    ov.className = kind; /* 'enter' | 'exit' */
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
      '<div class="hack-scanlines"></div>' +
      '<div class="hack-inner">' +
        '<pre class="hack-log"></pre>' +
        '<div class="hack-bar"><i></i></div>' +
        '<div class="hack-foot"><span class="hack-dot"></span>encrypted channel &middot; tls 1.3 &middot; aes-256-gcm</div>' +
      '</div>';
    document.body.appendChild(ov);
    return ov;
  }

  function log(ov, text) {
    var pre = ov.querySelector('.hack-log');
    if (!pre) return;
    var div = document.createElement('div');
    div.textContent = text;
    pre.appendChild(div);
  }

  function pageName(href) {
    var p = (href || location.pathname).split('#')[0].split('?')[0].split('/').pop();
    return decodeURIComponent(p || 'index.html');
  }

  /* ---------------- ENTER: decrypt animation on load ---------------- */
  if (!REDUCED) {
    var enter = makeOverlay('enter');
    var seq = [
      '> decrypting ' + pageName(),
      '> integrity: sha-256 ... OK',
      '> rendering secure shell'
    ];
    seq.forEach(function (l, i) {
      setTimeout(function () { log(enter, l); }, 80 + i * 140);
    });
    setTimeout(function () { enter.querySelector('.hack-bar i').style.width = '100%'; }, 140);
    setTimeout(function () {
      log(enter, '> ACCESS GRANTED');
      enter.classList.add('leave');
      setTimeout(function () { enter.remove(); }, 470);
    }, 870);
    /* click anywhere to skip */
    enter.addEventListener('click', function () { enter.remove(); });
    /* bfcache restore: kill instantly */
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) enter.remove();
    });
  }

  /* ---------------- EXIT: intrusion sequence on link click ---------------- */
  var busy = false;

  function shouldHijack(a) {
    if (busy) return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false;               /* pure anchors */
    if (!/\.html?(\?|#|$)/i.test(href)) return false;                /* internal pages only */
    if (a.target && a.target !== '_self') return false;              /* new tab/window */
    if (a.hasAttribute('download')) return false;                    /* downloads */
    var proto = a.protocol || '';
    if (proto && proto !== 'http:' && proto !== 'https:' && proto !== 'file:') return false; /* mailto/tel/etc */
    if (/^https?:/i.test(href) && href.indexOf(location.origin) !== 0) return false; /* external */
    return true;
  }

  function hackGo(href) {
    if (REDUCED || !href) { window.location.href = href; return; }
    if (busy) { window.location.href = href; return; }
    busy = true;

    /* close the mobile menu + terminal if open */
    var menu = document.getElementById('nav-links');
    if (menu) menu.classList.remove('open');

    var ov = makeOverlay('exit');
    var steps = [
      '> ./route.sh --target ' + pageName(href),
      '> handshake: tls 1.3 aes-256-gcm ... OK',
      '> spoofing ttl [64] ... OK',
      '> bypassing waf ... OK',
      '> payload injected. transferring:'
    ];
    steps.forEach(function (l, i) {
      setTimeout(function () { log(ov, l); }, 60 + i * 110);
    });
    setTimeout(function () { ov.querySelector('.hack-bar i').style.width = '100%'; }, 260);
    setTimeout(function () { log(ov, '> ACCESS GRANTED'); }, 640);
    setTimeout(function () { window.location.href = href; }, 820);
  }

  window.hackGo = hackGo;

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;    /* modified clicks pass through */
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !shouldHijack(a)) return;
    e.preventDefault();
    hackGo(a.getAttribute('href'));
  });
})();
