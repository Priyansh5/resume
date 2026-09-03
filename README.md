# Priyansh Bhadoria — Portfolio

> Dark-glass personal portfolio for a cybersecurity professional. Pure **HTML / CSS / JS** — zero build step, zero dependencies, zero trackers. Ready to publish on GitHub Pages.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Hero (typing effect, matrix rain + particle network), animated stats, featured disclosures & projects |
| `disclosures.html` | All 9 security findings across Air France-KLM, IHK München, Bose, NewCold & Gummicube (Airship) + dual Hall of Fame banner (Bose & Airship) |
| `projects.html` | AI-Powered NIDS, Android Log Monitor, CyberShield Toolkit, Log Analyzer (real GitHub links) |
| `about.html` | `whoami` pitch, experience & education timeline, certifications, skills arsenal |
| `blog.html` | 8 real Medium / InfoSec Writeups articles |
| `contact.html` | Direct channels, one-click copy email, resume download, availability |
| `404.html` | Terminal-style "target not found" page (works on GitHub Pages) |

## Features

- Dark glassmorphism design + phosphor-green accent (`#00ff41`)
- **Glitch effects** — hero name has RGB-split ghost layers + character-corruption bursts (periodic, and on hover)
- **Hacking page transitions** — clicking any internal link plays a terminal "intrusion" sequence (`route.sh`, WAF bypass, progress bar) before navigating; every page boots with a quick "decrypting" overlay (click to skip)
- **Scroll animations** — section/company/project titles decode (scramble → resolve) as they scroll into view, plus a thin scroll-progress data stream at the top
- Interactive terminal overlay — click `>_` (bottom-right) or press **Ctrl + `**
  - Try: `help`, `whoami`, `ls disclosures`, `nmap`, `matrix`, `sudo hire-me`
  - Easter egg: type `neo` anywhere on the page 🐇
- Matrix rain background (all pages) + interactive particle network (hero)
- **Live Medium feed** — the writeups page auto-syncs your latest Medium articles via RSS (rss2json / allorigins / codetabs fallback chain), caches in `localStorage` with a **7-day TTL** and re-fetches weekly; falls back to the static card list if all networks fail; `medium` command in the terminal prints the live list
- Typewriter role cycling, animated stat counters, scroll-reveal animations
- Fully responsive (mobile hamburger nav), `prefers-reduced-motion` support (all glitch/transition effects gracefully disabled)
- SEO meta + Open Graph tags, SVG favicon
- Resume PDF bundled at `assets/Priyansh_Bhadoria_Resume.pdf`

## Deploy to GitHub Pages (5 minutes)

### Option A — username site (recommended: yoursite becomes `priyansh5.github.io`)

1. Create a new **public** repository named exactly `priyansh5.github.io`
   (github.com/new → Repository name: `priyansh5.github.io` → Create)
2. Upload every file & folder from this directory (index.html must be at the repo root).
   You can drag-and-drop in the GitHub web UI (Add file → Upload files), or use git:
   ```bash
   git init
   git add .
   git commit -m "portfolio v1"
   git branch -M main
   git remote add origin https://github.com/Priyansh5/priyansh5.github.io.git
   git push -u origin main
   ```
3. Your site goes live at **https://priyansh5.github.io** within ~1 minute.
   (Repo → Settings → Pages should show "Your site is live". Branch deploy from `main / (root)` is the default — already correct.)

### Option B — project site (URL becomes `priyansh5.github.io/portfolio`)

1. Create a repo named e.g. `portfolio`
2. Push these files to `main`
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main / (root)` → Save

> `.nojekyll` is included on purpose — it tells GitHub Pages to serve files as-is.

## Customize

- **Colors / fonts:** edit the CSS variables at the top of `css/style.css`
- **Terminal commands:** `js/terminal.js` (command table near the top)
- **Stats numbers:** `data-count` attributes in `index.html`
- **New blog post:** copy one `<article class="glass-card blog-card">` block in `blog.html`
- **New disclosure:** copy an `<article class="glass-card disclosure-card">` block in `disclosures.html`
- **Replace resume:** overwrite `assets/Priyansh_Bhadoria_Resume.pdf`

## Custom domain (optional)

Add a `CNAME` file containing your domain, then configure DNS per
GitHub's docs: Settings → Pages → Custom domain.

---

Built with vanilla HTML/CSS/JS · Google Fonts (Space Grotesk, Inter, JetBrains Mono) · No frameworks, no build, no trackers.
