/*
 * Vibe Web — Landing JS (vanilla, zero dependencies).
 * Modeled on someoneandothers.com main.js — adapted to our markup.
 *
 * Modules:
 *   1. Theme switcher (light/dark/dim) with sliding pill + localStorage persist
 *   2. Word-by-word scroll reveal for .reveal-text elements
 *   3. Mascot tracking — bezier curve from H1-end to bottom-right corner
 *   4. Glow CTA visibility — fade in after first scroll
 */

/* ════════════════════════════════════════════════════════════════════
   1. Theme switcher (light/dark) — auto-detects OS preference, persists
   to localStorage as 'vw-theme', updates sliding pill position.
   ════════════════════════════════════════════════════════════════════ */
(function initThemeSwitcher() {
  const switcher = document.querySelector('.theme-switcher');
  if (!switcher) return;
  const options = switcher.querySelectorAll('.theme-switcher-option');
  const pill = switcher.querySelector('.theme-switcher-pill');
  const themes = ['light', 'dark'];

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('vw-theme', theme); } catch (_) {}
    const idx = themes.indexOf(theme);
    if (idx >= 0 && pill) pill.setAttribute('data-pos', String(idx));
    options.forEach((opt, i) => {
      const isActive = themes[i] === theme;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  // Restore: localStorage > OS preference > default light
  let initial = 'light';
  try {
    const stored = localStorage.getItem('vw-theme');
    if (stored && themes.includes(stored)) initial = stored;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) initial = 'dark';
  } catch (_) {}
  applyTheme(initial);

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const next = opt.getAttribute('data-theme-value');
      if (next && themes.includes(next)) applyTheme(next);
    });
  });
})();

/* ════════════════════════════════════════════════════════════════════
   2. Word-by-word scroll reveal
   Splits .reveal-text inner HTML into <span class="word"> spans.
   First N words start visible (data-visible-words attr).
   On scroll, words become .visible when their top crosses LINE_X (50vh).
   ════════════════════════════════════════════════════════════════════ */
// On mobile (<= 768) skip the scroll-reveal — show everything from start.
// Mobile users have less attention budget; the reveal animation works on
// desktop where there's room to scroll past 80px before crossing the LINE_X.
const REVEAL_DISABLED = window.innerWidth <= 768;
document.querySelectorAll('.reveal-text').forEach(el => {
  let visibleCount = parseInt(el.getAttribute('data-visible-words') || '0', 10);
  if (REVEAL_DISABLED) visibleCount = 9999;
  const html = el.innerHTML.trim();
  // Tokens: <img> tags preserved as word units, plus text chunks split on whitespace.
  const tokens = html.split(/(<img[^>]+>|<svg[\s\S]+?<\/svg>)/);
  let wordIndex = 0;
  const parts = [];
  tokens.forEach(token => {
    if (!token) return;
    if (/^<(img|svg)/i.test(token)) {
      const cls = wordIndex < visibleCount ? 'word visible' : 'word';
      parts.push('<span class="' + cls + '">' + token + '</span>');
      wordIndex++;
    } else {
      const words = token.trim().split(/\s+/).filter(w => w.length > 0);
      words.forEach(w => {
        const cls = wordIndex < visibleCount ? 'word visible' : 'word';
        parts.push('<span class="' + cls + '">' + w + '</span>');
        wordIndex++;
      });
    }
  });
  el.innerHTML = parts.join(' ');
});

const LINE_X = window.innerHeight * 0.5;
const REVEAL_SCROLL_GATE = 80;
let revealTicking = false;
function revealOnScroll() {
  if (window.scrollY < REVEAL_SCROLL_GATE) {
    revealTicking = false;
    return;
  }
  document.querySelectorAll('.word:not(.visible)').forEach(word => {
    if (word.getBoundingClientRect().top <= LINE_X) {
      word.classList.add('visible');
    }
  });
  revealTicking = false;
}
function scheduleReveal() {
  if (!revealTicking) {
    requestAnimationFrame(revealOnScroll);
    revealTicking = true;
  }
}
window.addEventListener('scroll', scheduleReveal, { passive: true });
window.addEventListener('resize', scheduleReveal, { passive: true });

/* ════════════════════════════════════════════════════════════════════
   3. Mascot tracking — bezier curve from H1-end → bottom-right corner
   ════════════════════════════════════════════════════════════════════ */
(function initMascot() {
  const iconWrap = document.getElementById('siteIconWrap');
  if (!iconWrap) return;

  // Mobile shortcut: pin to bottom-right, no animation
  if (window.innerWidth <= 480) {
    iconWrap.style.position = 'fixed';
    iconWrap.style.top = 'auto';
    iconWrap.style.left = 'auto';
    iconWrap.style.bottom = '30px';
    iconWrap.style.right = '24px';
    iconWrap.style.width = '32px';
    iconWrap.style.height = '32px';
    return;
  }

  const ICON_START_SIZE = 70;
  const ICON_END_SIZE = 40;
  const ICON_END_BOTTOM = 40;
  const ICON_END_RIGHT = 48;
  /* Bezier tracking range — sweet spot. 600 was too fast (mascot bailed
     before hero reveal), 1200 was too slow (felt stuck on the headline).
     800 = mascot walks alongside the reader through the hero + agitate
     and lands in the corner just as Selected work enters the viewport. */
  const SCROLL_END = 800;

  let startTop = null;
  let startLeft = null;
  let maxEase = 0;
  let settled = false;
  let ticking = false;

  function captureStartPosition() {
    const h1 = document.querySelector('.hero h1');
    if (!h1) return false;
    const visibleWords = h1.querySelectorAll('.word.visible');
    if (visibleWords.length > 0) {
      const last = visibleWords[visibleWords.length - 1].getBoundingClientRect();
      startLeft = last.right + 16;
      startTop = last.bottom - ICON_START_SIZE - (ICON_START_SIZE * 0.38);
    } else {
      const r = h1.getBoundingClientRect();
      startLeft = r.left + 200;
      startTop = r.top;
    }
    return true;
  }

  function bezier(p0, p1, p2, t) {
    const mt = 1 - t;
    return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
  }
  function getEndTop()  { return window.innerHeight - ICON_END_BOTTOM - ICON_END_SIZE; }
  function getEndLeft() { return window.innerWidth  - ICON_END_RIGHT  - ICON_END_SIZE; }

  function update() {
    if (settled) { ticking = false; return; }
    const scrollY = window.scrollY;
    const t = Math.min(1, Math.max(0, scrollY / SCROLL_END));
    const rawEase = t < 0.5
      ? (1 - Math.cos(Math.PI * t)) / 2
      : (1 + Math.sin(Math.PI * (t - 0.5))) / 2;
    maxEase = Math.max(maxEase, rawEase);
    const ease = maxEase;

    if (ease >= 1) {
      settled = true;
      iconWrap.style.position = 'fixed';
      iconWrap.style.top = 'auto';
      iconWrap.style.left = 'auto';
      iconWrap.style.bottom = ICON_END_BOTTOM + 'px';
      iconWrap.style.right = ICON_END_RIGHT + 'px';
      iconWrap.style.width = ICON_END_SIZE + 'px';
      iconWrap.style.height = ICON_END_SIZE + 'px';
      iconWrap.classList.remove('is-walking');
      iconWrap.classList.add('is-settled');
      ticking = false;
      return;
    }

    if (startTop === null) {
      if (!captureStartPosition()) { ticking = false; return; }
    }
    const size = ICON_START_SIZE + (ICON_END_SIZE - ICON_START_SIZE) * ease;
    const anchorTop = startTop - scrollY * (1 - ease);
    const anchorLeft = startLeft;
    const endTop = getEndTop();
    const endLeft = getEndLeft();
    const ctrlTop = Math.max(anchorTop, endTop) + window.innerHeight * 0.06;

    const x = bezier(anchorLeft, (anchorLeft + endLeft) / 2, endLeft, ease);
    const y = bezier(anchorTop, ctrlTop, endTop, ease);

    iconWrap.style.position = 'fixed';
    iconWrap.style.top = y + 'px';
    iconWrap.style.left = x + 'px';
    iconWrap.style.width = size + 'px';
    iconWrap.style.height = size + 'px';
    ticking = false;
  }
  function schedule() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }
  // Walk-cycle class: add .is-walking briefly during scroll bursts
  let walkTimer;
  function flagWalking() {
    if (settled) return;
    iconWrap.classList.add('is-walking');
    clearTimeout(walkTimer);
    walkTimer = setTimeout(() => iconWrap.classList.remove('is-walking'), 260);
  }

  // Capture initial position once words have rendered + first reveals run
  setTimeout(() => { captureStartPosition(); update(); }, 50);
  window.addEventListener('scroll', () => { schedule(); flagWalking(); }, { passive: true });
  window.addEventListener('resize', () => {
    captureStartPosition();
    schedule();
  }, { passive: true });
})();

/* ════════════════════════════════════════════════════════════════════
   4. Glow CTA — fade in after 80px scroll, dock into final CTA section
   when it enters viewport (less persistent visual noise; the floating
   CTA "lands" naturally at the conversion point).
   ════════════════════════════════════════════════════════════════════ */
(function initGlowCta() {
  const cta = document.getElementById('glowCta');
  const dock = document.getElementById('ctaDock');
  if (!cta) return;

  function updateVisibility() {
    cta.classList.toggle('visible', window.scrollY > 80);
  }
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });

  if (dock && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          dock.appendChild(cta);
          cta.classList.add('docked');
        } else if (cta.parentElement === dock) {
          document.body.appendChild(cta);
          cta.classList.remove('docked');
        }
      });
    }, { threshold: 0.4 });
    io.observe(dock);
  }
})();

/* ════════════════════════════════════════════════════════════════════
   5. Generic IntersectionObserver fade-in for [class~="fade-in"]
   ════════════════════════════════════════════════════════════════════ */
(function initFadeIn() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
})();
