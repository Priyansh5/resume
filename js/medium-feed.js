/* ==========================================================================
   Medium live feed — auto-syncs latest articles from Medium RSS.
   - Fetches via rss2json, falls back to raw XML proxies (allorigins, codetabs)
   - Caches in localStorage with a 7-DAY TTL → auto re-fetches weekly
   - Final fallback: the static writeup cards already in the HTML
   - All feed data rendered through DOM APIs (never innerHTML) — XSS-safe
   Exposes window.MediumFeed { items(), lastSync(), refresh() } for the terminal.
   ========================================================================== */
(function () {
  'use strict';

  var RSS = 'https://medium.com/feed/@priyanshbhadoria5';
  var PROFILE = 'https://medium.com/@priyanshbhadoria5';
  var TTL = 7 * 24 * 60 * 60 * 1000;           /* one week */
  var CACHE_KEY = 'pb_medium_feed_v1';
  var MAX_ITEMS = 10;
  var EXCERPT_LEN = 220;

  var grid = document.getElementById('blog-grid');
  var statusEl = document.getElementById('feed-status');
  var refreshBtn = document.getElementById('feed-refresh');

  /* ---------- storage (fails silently in private mode / file://) ---------- */
  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.items) || !data.items.length) return null;
      return data;
    } catch (e) { return null; }
  }
  function saveCache(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items })); }
    catch (e) { /* non-fatal */ }
  }

  /* ---------- helpers ---------- */
  function normLink(u) {
    try {
      var a = document.createElement('a');
      a.href = u;
      var clean = a.protocol + '//' + a.host + a.pathname;
      return clean.replace(/\/$/, '').toLowerCase();
    } catch (e) { return String(u || '').toLowerCase(); }
  }
  function safeHref(u) {
    /* only allow https links to medium / infosecwriteups */
    if (!u) return null;
    var s = String(u).trim();
    if (!/^https:\/\//i.test(s)) return null;
    var host = normLink(s).split('/')[2] || '';
    if (!/(^|\.)medium\.com$/.test(host) && !/(^|\.)infosecwriteups\.com$/.test(host)) return null;
    return s.split('#')[0].split('?')[0]; /* strip tracking (?source=rss…) */
  }
  function stripRss(u) { return String(u || '').split('#')[0].split('?')[0]; }
  function parseDate(s) {
    var m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s || '');
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    var t = Date.parse(s || '');
    return isNaN(t) ? 0 : t;
  }
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
  }
  function relTime(ts) {
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
  function stripHtml(html) {
    try {
      var doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
      var txt = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch (e) { var txt = ''; }
    if (txt.length <= EXCERPT_LEN) return txt;
    var cut = txt.slice(0, EXCERPT_LEN);
    var sp = cut.lastIndexOf(' ');
    if (sp > EXCERPT_LEN * 0.6) cut = cut.slice(0, sp);
    return cut.replace(/[,;:.\s]+$/, '') + '…';
  }
  function esc(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

  function normalize(item) {
    var link = safeHref(stripRss(item.link));
    if (!link) return null;
    var title = esc(item.title);
    if (!title) return null;
    return {
      t: title,
      l: link,
      d: parseDate(item.pubDate),
      e: stripHtml(item.description || item.content || ''),
      c: (item.categories || []).map(function (c) { return esc(c).toLowerCase(); }).filter(Boolean).slice(0, 3),
      s: /infosecwriteups\.com/.test(link) ? 'INFOSEC WRITEUPS' : 'MEDIUM'
    };
  }

  /* ---------- fetch chain ---------- */
  function fetchTimeout(url, ms) {
    return new Promise(function (resolve, reject) {
      var ctl = ('AbortController' in window) ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); reject(new Error('timeout')); }, ms);
      fetch(url, ctl ? { signal: ctl.signal } : undefined)
        .then(function (r) { clearTimeout(timer); r.ok ? resolve(r) : reject(new Error('http ' + r.status)); })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function viaRss2Json() {
    return fetchTimeout('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(RSS), 9000)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || j.status !== 'ok' || !j.items) throw new Error('rss2json bad payload');
        return j.items.map(normalize).filter(Boolean);
      });
  }
  function viaXml(proxy) {
    return fetchTimeout(proxy + encodeURIComponent(RSS), 9000)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var xml = null;
        try {
          var j = JSON.parse(text);
          if (j && typeof j.contents === 'string') xml = j.contents;
        } catch (e) { xml = text; }
        var doc = new DOMParser().parseFromString(xml || '', 'text/xml');
        var nodes = doc.querySelectorAll('item');
        if (!nodes.length) throw new Error('xml parse failed');
        var out = [];
        for (var i = 0; i < nodes.length && out.length < MAX_ITEMS; i++) {
          var n = nodes[i];
          out.push(normalize({
            title: (n.querySelector('title') || {}).textContent,
            link: (n.querySelector('link') || {}).textContent,
            pubDate: (n.querySelector('pubDate') || {}).textContent,
            description: (n.querySelector('description') || {}).textContent,
            categories: Array.prototype.map.call(n.querySelectorAll('category'), function (c) { return c.textContent; })
          }));
        }
        var ok = out.filter(Boolean);
        if (!ok.length) throw new Error('no items');
        return ok;
      });
  }

  function fetchLive() {
    return viaRss2Json()
      .catch(function () { return viaXml('https://api.allorigins.win/get?url='); })
      .catch(function () { return viaXml('https://api.codetabs.com/v1/proxy?quest='); });
  }

  /* ---------- rendering (DOM-only, XSS-safe) ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function card(item, idx) {
    var a = el('article', 'glass-card blog-card reveal');
    var meta = el('div', 'blog-meta');
    var badge = el('span', 'badge ' + (item.s === 'MEDIUM' ? 'badge-muted' : 'badge-info'), item.s);
    var date = el('span', 'blog-date', fmtDate(item.d));
    meta.appendChild(badge); meta.appendChild(date);

    var h = el('h2', 'blog-title');
    var link = el('a', null, item.t);
    link.href = item.l; link.target = '_blank'; link.rel = 'noopener';
    h.appendChild(link);

    var ex = el('p', 'blog-excerpt', item.e);

    var cats = el('div', 'blog-cats');
    item.c.forEach(function (c) { cats.appendChild(el('span', 'tech-chip', c)); });

    var rl = el('a', 'blog-link', 'read writeup');
    rl.href = item.l; rl.target = '_blank'; rl.rel = 'noopener';

    a.appendChild(meta); a.appendChild(h); a.appendChild(ex);
    if (item.c.length) a.appendChild(cats);
    a.appendChild(rl);

    /* staggered reveal (main.js IO already ran — animate manually) */
    (function (node, i) {
      setTimeout(function () { node.classList.add('visible'); }, 80 + i * 70);
    })(a, idx);
    return a;
  }

  function render(items, mode) {
    if (!grid) return;
    /* snapshot static fallback cards (for merge + offline restore) */
    var statics = window.__pbStaticCards || (window.__pbStaticCards = Array.prototype.slice.call(grid.children));

    var liveSet = {};
    items.forEach(function (it) { liveSet[normLink(it.l)] = true; });

    while (grid.firstChild) grid.removeChild(grid.firstChild);
    items.slice(0, MAX_ITEMS).forEach(function (it, i) { grid.appendChild(card(it, i)); });

    /* merge: keep static writeups the live feed doesn't know about (e.g. InfoSec
       Writeups cross-posts) so no published story ever disappears */
    statics.forEach(function (node) {
      var a = node.querySelector('.blog-title a');
      if (!a) return;
      if (liveSet[normLink(a.href)]) return;
      node.classList.add('visible');
      grid.appendChild(node);
    });

    if (mode === 'live' && statusEl) setStatus('live');
  }

  function restoreStatic() {
    if (!grid) return;
    var statics = window.__pbStaticCards || (window.__pbStaticCards = Array.prototype.slice.call(grid.children));
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    statics.forEach(function (n) { n.classList.add('visible'); grid.appendChild(n); });
  }

  /* ---------- status chip ---------- */
  function setStatus(mode) {
    if (!statusEl) return;
    statusEl.className = 'feed-status ' + mode;
    statusEl.innerHTML = '';
    var dot = el('span', 'fs-dot');
    var txt = el('span', 'fs-text');
    if (mode === 'syncing') txt.textContent = 'syncing medium feed…';
    else if (mode === 'live') {
      var c = loadCache();
      txt.textContent = 'live · synced ' + (c ? relTime(c.ts) : 'just now') + ' · auto-refreshes weekly';
    } else if (mode === 'cached') {
      txt.textContent = 'cache · auto-syncs weekly (network offline — showing last synced list)';
    } else if (mode === 'offline') {
      txt.textContent = 'offline · showing the last synced writeup list';
    }
    statusEl.appendChild(dot); statusEl.appendChild(txt);
  }

  /* ---------- main flow ---------- */
  var cache = loadCache();
  var fresh = cache && (Date.now() - cache.ts) < TTL;

  if (grid) {
    if (cache) { render(cache.items, 'cached'); }
    else setStatus('syncing');
  }

  function syncNow(force) {
    if (grid && !cache) setStatus('syncing');
    return fetchLive().then(function (items) {
      saveCache(items);
      cache = { ts: Date.now(), items: items };
      render(items, 'live');
      return items;
    }).catch(function () {
      if (grid && !cache) { setStatus('offline'); restoreStatic(); }
      else if (grid) setStatus('offline');
      return null;
    });
  }

  /* weekly auto-fetch: fresh cache renders instantly; stale/missing syncs now.
     while the tab stays open, re-check every 30 min so a page left open
     crosses the 7-day boundary and refreshes on its own. */
  if (fresh && grid) setStatus('live');
  else syncNow();

  setInterval(function () {
    var c = loadCache();
    if (!c || (Date.now() - c.ts) >= TTL) syncNow();
  }, 30 * 60 * 1000);

  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      setStatus('syncing');
      refreshBtn.disabled = true;
      syncNow(true).then(function () { refreshBtn.disabled = false; });
    });
  }

  /* public API (terminal + tests) */
  window.MediumFeed = {
    items: function () { var c = loadCache(); return c ? c.items.slice(0, 5) : []; },
    lastSync: function () { var c = loadCache(); return c ? c.ts : null; },
    refresh: function () { setStatus('syncing'); return syncNow(true); }
  };
})();
