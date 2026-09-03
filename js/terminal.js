/* ==========================================================================
   Terminal — interactive fake terminal overlay
   Commands: help, whoami, ls, cat, contact, skills, blog, projects,
             disclosures, about, resume, socials, matrix, sudo, clear, exit...
   ========================================================================== */
(function () {
  'use strict';

  var overlay = document.getElementById('terminal-overlay');
  var fab = document.getElementById('terminal-fab');
  var navBtn = document.getElementById('terminal-open');
  var closeBtn = document.getElementById('terminal-close');
  var body = document.getElementById('terminal-body');
  var input = document.getElementById('terminal-input');
  if (!overlay || !input) return;

  var history = [];
  var histIdx = -1;
  var booted = false;

  var LINKS = {
    github: 'https://github.com/Priyansh5',
    linkedin: 'https://linkedin.com/in/priyansh-bhadoria',
    medium: 'https://medium.com/@priyanshbhadoria5',
    tryhackme: 'https://tryhackme.com/p/DEKU.',
    email: 'priyanshbhadoria5@gmail.com'
  };

  /* ---------------- output helpers ---------------- */
  function line(text, cls) {
    var div = document.createElement('div');
    div.className = 't-line ' + (cls || 't-out');
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
  function echo(cmd) {
    var div = document.createElement('div');
    div.className = 't-line';
    var span = document.createElement('span');
    span.className = 't-ok';
    span.textContent = 'priyansh@portfolio:~$ ';
    div.appendChild(span);
    div.appendChild(document.createTextNode(cmd));
    body.appendChild(div);
  }
  function lines(arr, cls) { arr.forEach(function (l) { line(l, cls); }); }
  function clearTerm() { body.innerHTML = ''; }
  function goto(page) {
    if (window.hackGo) window.hackGo(page);
    else window.location.href = page;
  }

  function boot() {
    if (booted) return;
    booted = true;
    lines([
      '┌─ Priyansh Bhadoria · portfolio shell v2.0 ─────────────────┐',
      '│  connection established · tls verified · 256-bit aes      │',
      '│  type \'help\' to list available commands                   │',
      '└────────────────────────────────────────────────────────────┘'
    ], 't-dim');
    line('');
  }

  /* ---------------- command table ---------------- */
  var COMMANDS = {
    help: function () {
      lines([
        'AVAILABLE COMMANDS',
        '  help          → this menu',
        '  whoami        → identity of the target',
        '  about         → jump to the about page',
        '  ls            → list site sections',
        '  disclosures   → security research & hall of fame',
        '  projects      → open-source tooling',
        '  skills        → technical arsenal',
        '  blog          → latest writeups',
        '  medium        → live sync of my Medium feed',
        '  contact       → reach the operator',
        '  socials       → social profiles',
        '  resume        → download the resume (pdf)',
        '  date          → current system date',
        '  matrix        → wake up, Neo...',
        '  history       → command history',
        '  clear         → clear the screen',
        '  exit          → close the terminal',
        '',
        '  hint: try \'sudo hire-me\' — recruiters only ;)'
      ]);
    },

    whoami: function () {
      lines([
        'priyansh_bhadoria',
        '  ├─ role      : Security Analyst · Junior Penetration Tester',
        '  ├─ focus     : web app sec, cloud identity (Azure), IAM/SSO attack surfaces',
        '  ├─ badges    : 2× Hall of Fame (Bose · Airship) · TryHackMe Top 9%',
        '  ├─ bounty    : awarded (NewCold, via Zerocopter)',
        '  └─ status    : ' + 'OPEN TO WORK — open to relocation',
        '',
        '9 vulnerabilities disclosed across Air France-KLM, IHK München,',
        'Bose, NewCold & Gummicube (Airship) via HackerOne / Zerocopter / direct VDP.'
      ]);
    },

    ls: function (args) {
      if (args[0] === 'disclosures' || args[0] === '-la') {
        lines([
          'air-france-klm/   3 findings · critical verified · zerocopter cvd',
          'ihk-muenchen/     1 finding  · auth bypass poc · vdp',
          'bose/             2 findings  · hall of fame    · hackerone vdp',
          'newcold/          2 findings  · bounty awarded  · zerocopter',
          'gummicube/        1 finding  · reflected xss   · airship vdp hof',
          'total: 9 disclosures, 5 enterprises, 0 regrets'
        ]);
        return;
      }
      lines([
        'about.md        blog.md         contact.txt',
        'disclosures/    projects/       skills.json',
        'resume.pdf',
        '',
        'tip: \'ls disclosures\' for the good stuff'
      ]);
    },

    cat: function (args) {
      switch (args[0]) {
        case 'about.md':
          COMMANDS.whoami();
          break;
        case 'contact.txt':
          lines([
            'email    : ' + LINKS.email,
            'phone    : +91-8077260407',
            'location : Moradabad, UP, India (open to relocation)',
            'linkedin : linkedin.com/in/priyansh-bhadoria',
            'github   : github.com/Priyansh5'
          ]);
          break;
        case 'skills.json':
          COMMANDS.skills();
          break;
        default:
          line('cat: ' + (args[0] || '') + ': no such file', 't-err');
      }
    },

    about: function () { line('navigating → about page...', 't-info'); setTimeout(function () { goto('about.html'); }, 600); },
    disclosures: function () { line('navigating → security research...', 't-info'); setTimeout(function () { goto('disclosures.html'); }, 600); },
    projects: function () { line('navigating → projects...', 't-info'); setTimeout(function () { goto('projects.html'); }, 600); },
    blog: function () { line('navigating → writeups...', 't-info'); setTimeout(function () { goto('blog.html'); }, 600); },

    medium: function () {
      if (window.MediumFeed) {
        var items = window.MediumFeed.items();
        if (items.length) {
          var out = ['LIVE MEDIUM FEED · auto-syncs weekly', ''];
          items.forEach(function (it, i) {
            out.push('  [' + (i + 1) + '] ' + it.t +
                     '  — ' + it.s.toLowerCase() +
                     (it.d ? ' · ' + new Date(it.d).toISOString().slice(0, 10) : ''));
          });
          out.push('', 'full list: blog.html · profile: ' + LINKS.medium);
          lines(out);
          return;
        }
        line('syncing medium feed… opening writeups', 't-info');
      } else {
        line('feed module lives on the blog page — opening writeups', 't-info');
      }
      setTimeout(function () { goto('blog.html'); }, 600);
    },
    contact: function () { line('navigating → contact...', 't-info'); setTimeout(function () { goto('contact.html'); }, 600); },

    skills: function () {
      lines([
        '{',
        '  "languages":    ["Python", "JavaScript", "HTML", "Bash"],',
        '  "security_ops": ["Burp Suite", "Nmap", "Wireshark", "Metasploit", "OWASP ZAP", "Scapy"],',
        '  "platforms":    ["Linux", "Kali Linux", "Windows"],',
        '  "domains":      ["Web App Sec", "VAPT", "Fuzzing", "Network Security", "OSINT", "Log Analysis"],',
        '  "cloud_identity": ["Azure", "AWS", "IAM/SSO", "Keycloak", "PingFederate"]',
        '}'
      ]);
    },

    socials: function () {
      lines([
        'github    → ' + LINKS.github,
        'linkedin  → ' + LINKS.linkedin,
        'medium    → ' + LINKS.medium,
        'tryhackme → ' + LINKS.tryhackme + '  (Top 9%)'
      ]);
    },

    github: function () { line('opening github...', 't-info'); window.open(LINKS.github, '_blank'); },
    linkedin: function () { line('opening linkedin...', 't-info'); window.open(LINKS.linkedin, '_blank'); },
    tryhackme: function () { line('opening tryhackme...', 't-info'); window.open(LINKS.tryhackme, '_blank'); },

    resume: function () {
      line('downloading resume.pdf ...', 't-ok');
      var a = document.createElement('a');
      a.href = 'assets/Priyansh_Bhadoria_Resume.pdf';
      a.download = 'Priyansh_Bhadoria_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    date: function () { line(new Date().toString(), 't-info'); },

    history: function () {
      if (!history.length) { line('no history yet', 't-dim'); return; }
      history.forEach(function (cmd, i) { line('  ' + (i + 1) + '  ' + cmd, 't-dim'); });
    },

    matrix: function () {
      document.body.classList.toggle('matrix-boost');
      line(document.body.classList.contains('matrix-boost')
        ? 'wake up, neo... the matrix has you.'
        : 'matrix suppressed. reality restored.', 't-ok');
    },

    banner: function () { boot(); },

    sudo: function (args) {
      if (args.join(' ') === 'hire-me') {
        lines([
          '[sudo] password for recruiter: ********',
          'access granted. exceptional candidate detected.',
          'routing to secure contact channel...'
        ], 't-ok');
        setTimeout(function () { goto('contact.html'); }, 900);
      } else {
        line('priyansh is not in the sudoers file. this incident has been reported.', 't-err');
        line('(psst: try \'sudo hire-me\')', 't-dim');
      }
    },

    echo: function (args) { line(args.join(' ')); },

    ping: function () {
      lines([
        'PING target: 56 data bytes',
        '64 bytes from priyansh: icmp_seq=0 ttl=64 time=0.042 ms',
        '--- target ping statistics ---',
        '1 packet transmitted, 1 received, 0% packet loss'
      ], 't-dim');
    },

    nmap: function () {
      lines([
        'starting nmap 7.94 ( https://nmap.org )',
        'nmap scan report for priyansh-bhadoria.dev',
        'PORT      STATE  SERVICE',
        '22/tcp    open   open-to-work',
        '80/tcp    open   portfolio',
        '443/tcp   open   encrypted-hire-channel',
        'nmap done: 1 host up — all ports welcome recruiters.'
      ], 't-dim');
    },

    clear: function () { clearTerm(); booted = false; },

    exit: function () { close(); },

    'rm': function (args) {
      if (args[0] === '-rf' && args[1] === '/') {
        line('nice try. this portfolio is read-only. 🛡️', 't-warn');
      } else {
        line('rm: permission denied', 't-err');
      }
    }
  };

  /* ---------------- exec ---------------- */
  function exec(raw) {
    var cmd = raw.trim();
    echo(cmd);
    if (!cmd) return;
    history.push(cmd);
    histIdx = history.length;

    var parts = cmd.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1);

    var fn = COMMANDS[name];
    if (fn) fn(args);
    else line('command not found: ' + name + ' — type \'help\'', 't-err');
    line('');
  }

  /* ---------------- open / close ---------------- */
  function open() {
    overlay.classList.add('open');
    boot();
    input.focus();
  }
  function close() { overlay.classList.remove('open'); }

  if (fab) fab.addEventListener('click', open);
  if (navBtn) navBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      exec(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      if (histIdx > 0) input.value = history[--histIdx] || '';
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (histIdx < history.length - 1) input.value = history[++histIdx] || '';
      else { histIdx = history.length; input.value = ''; }
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      var val = input.value.trim().toLowerCase();
      if (val) {
        var match = Object.keys(COMMANDS).filter(function (c) { return c.indexOf(val) === 0; })[0];
        if (match) input.value = match + ' ';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerm();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    // global hotkey: Ctrl+` opens terminal
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      overlay.classList.contains('open') ? close() : open();
    }
  });

  // konami-style easter egg: type "neo" anywhere on the page
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) {
      buf += (e.key || '').toLowerCase();
      if (buf.length > 8) buf = buf.slice(-8);
      if (buf.slice(-3) === 'neo') {
        document.body.classList.add('matrix-boost');
        open();
        line('wake up, neo...', 't-ok');
        line('the matrix has you. follow the white rabbit. 🐇', 't-ok');
      }
    }
  });
})();
