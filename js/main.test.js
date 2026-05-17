/*
 * main.js — vanilla Node assertions for pure logic + structural contracts.
 * Run: node js/main.test.js
 *
 * The interactive parts (scroll reveal, theme switcher pill, mascot bezier
 * tracking) require a real browser and are verified visually via Playwright
 * MCP at deploy time. This file only covers the pure-function contracts
 * embedded in main.js so any refactor that breaks them surfaces immediately.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓', name); pass++; }
  catch (e) { console.log('  ✗', name); console.log('    ', e.message); fail++; }
}

// ═══ Pure function: quadratic bezier ════════════════════════════════
// Extract the bezier function from the source via string boundary, then eval.
// This keeps the function private inside the IIFE for prod, but testable here.
function extractFn(name) {
  const re = new RegExp('function ' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n  \\}', 'm');
  const match = SRC.match(re);
  if (!match) throw new Error(`function ${name} not found in main.js`);
  return new Function('return ' + match[0])();
}

console.log('\n[bezier]');
const bezier = extractFn('bezier');

test('bezier at t=0 returns p0', () => {
  assert.equal(bezier(0, 50, 100, 0), 0);
  assert.equal(bezier(10, 50, 90, 0), 10);
});
test('bezier at t=1 returns p2', () => {
  assert.equal(bezier(0, 50, 100, 1), 100);
  assert.equal(bezier(10, 50, 90, 1), 90);
});
test('bezier at t=0.5 averages p0 and p2 weighted by p1', () => {
  // Quadratic at t=0.5: 0.25*p0 + 0.5*p1 + 0.25*p2
  const v = bezier(0, 100, 0, 0.5);
  assert.equal(v, 50); // 0.25*0 + 0.5*100 + 0.25*0
});
test('bezier monotonic increase when control above endpoints', () => {
  const a = bezier(0, 100, 100, 0.25);
  const b = bezier(0, 100, 100, 0.75);
  assert.ok(a < b, `expected ${a} < ${b}`);
});

// ═══ Source-level contracts ═════════════════════════════════════════
console.log('\n[contracts]');

test('Theme switcher restored — light/dark with localStorage persist', () => {
  assert.match(SRC, /themes\s*=\s*\[\s*['"]light['"]\s*,\s*['"]dark['"]\s*\]/);
  assert.match(SRC, /\.theme-switcher/);
  assert.match(SRC, /localStorage\.setItem\(['"]vw-theme['"]/);
  assert.match(SRC, /localStorage\.getItem\(['"]vw-theme['"]/);
});

test('Theme switcher: auto-detects OS preference via prefers-color-scheme', () => {
  assert.match(SRC, /matchMedia\(['"]\(prefers-color-scheme:\s*dark\)['"]\)/);
});

test('Theme switcher: sliding pill data-pos updates on theme change', () => {
  assert.match(SRC, /pill\.setAttribute\(['"]data-pos['"]/);
});

test('Tokens: dark theme block exists with WCAG-compliant text alphas', () => {
  const tokensCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), 'utf8');
  assert.match(tokensCss, /\[data-theme="dark"\]/);
  // text-secondary in dark must be >= 0.65 alpha (mixes >=4.5:1 on #0a0a0a)
  const m = tokensCss.match(/\[data-theme="dark"\][\s\S]*?--text-secondary:\s*rgba\(245,\s*245,\s*245,\s*([\d.]+)\)/);
  assert.ok(m, 'dark --text-secondary not found');
  assert.ok(parseFloat(m[1]) >= 0.65, `dark --text-secondary opacity ${m[1]} < 0.65 (WCAG fail)`);
});

test('Theme markup: html has data-theme and switcher buttons have data-theme-value', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<html[^>]*data-theme="light"/);
  assert.match(html, /data-theme-value="light"/);
  assert.match(html, /data-theme-value="dark"/);
  assert.match(html, /role="radiogroup"\s+aria-label="Theme"/);
});

test('Plan B: glow CTA conic uses VW green tonal stops, not rainbow', () => {
  // Source-of-truth check: glow-cta.css must reference green tokens, not the
  // S&O rainbow colors (#0894FF / #C959DD / #FF2E54 / #FF9004).
  const glowCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'glow-cta.css'), 'utf8');
  assert.match(glowCss, /--color-vibeweb-green/);
  assert.doesNotMatch(glowCss, /#0894[Ff]{2}/);
  assert.doesNotMatch(glowCss, /#[Cc]959[Dd]{2}/);
});

test('Plan A2: tokens.css has light + dark themes (dim still removed)', () => {
  const tokensCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), 'utf8');
  assert.match(tokensCss, /\[data-theme="dark"\]/);
  assert.doesNotMatch(tokensCss, /\[data-theme="dim"\]/);
});

test('mascot tracking has mobile shortcut at <= 480px', () => {
  assert.match(SRC, /window\.innerWidth\s*<=\s*480/);
});

test('mascot SCROLL_END is 800 (sweet spot — walks through hero + agitate)', () => {
  assert.match(SRC, /SCROLL_END\s*=\s*800/);
});

test('reveal LINE_X is 50% of viewport (50vh trigger line)', () => {
  assert.match(SRC, /LINE_X\s*=\s*window\.innerHeight\s*\*\s*0\.5/);
});

test('reveal scroll gate is 80px (lets mascot animation start first)', () => {
  assert.match(SRC, /REVEAL_SCROLL_GATE\s*=\s*80/);
});

test('all event listeners use { passive: true } (perf contract — no scroll-jank)', () => {
  const passive = SRC.match(/passive:\s*true/g) || [];
  assert.ok(passive.length >= 3, `expected >=3 passive listeners, got ${passive.length}`);
});

test('reveal preserves <img> and <svg> as word units (mascot inline support)', () => {
  // The regex must match BOTH img and svg tokens
  assert.match(SRC, /<\(img\|svg\)/);
});

test('mobile word-reveal disabled (<= 768px) — sub paragraph visible on first paint', () => {
  assert.match(SRC, /REVEAL_DISABLED\s*=\s*window\.innerWidth\s*<=\s*768/);
  assert.match(SRC, /if\s*\(REVEAL_DISABLED\)\s*visibleCount\s*=\s*9999/);
});

test('Mascot character: JS adds .is-walking and .is-settled state classes', () => {
  // .is-walking is added on scroll bursts and removed 260ms after last scroll
  assert.match(SRC, /classList\.add\(['"]is-walking['"]\)/);
  assert.match(SRC, /classList\.remove\(['"]is-walking['"]\)/);
  // .is-settled is added when the mascot's bezier completes (ease >= 1)
  assert.match(SRC, /classList\.add\(['"]is-settled['"]\)/);
});

test('Mascot animations: idle bob, blink, walk, wave are all defined in CSS', () => {
  const heroCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'hero.css'), 'utf8');
  assert.match(heroCss, /@keyframes vibo-bob\b/);
  assert.match(heroCss, /@keyframes vibo-blink\b/);
  assert.match(heroCss, /@keyframes vibo-leg-l\b/);
  assert.match(heroCss, /@keyframes vibo-leg-r\b/);
  assert.match(heroCss, /@keyframes vibo-wave\b/);
});

test('Mascot SVG: index.html has .vibo class with face groups (eyes, smile, arms, legs, hat)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /class="site-icon vibo"/);
  // v3: spark removed, hat brim added (builder identity)
  for (const part of ['vibo__eyes', 'vibo__smile', 'vibo__arm--l', 'vibo__arm--r', 'vibo__leg--l', 'vibo__leg--r', 'vibo__hat']) {
    assert.match(html, new RegExp(part), `mascot part missing: ${part}`);
  }
});

test('Hero stays clean: h1 + h2 (both large-type) — no inner-tag .reveal-text bug', () => {
  // The reveal-text JS only preserves <img> and <svg> as word units — any
  // other inner tag (<span>, <strong>) gets split as plain text and renders
  // markup as words. Hero must stay simple: h1 + h2 with plain text.
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const heroMatch = html.match(/<section class="hero[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(heroMatch, 'hero section not found');
  const heroContent = heroMatch[1];
  // No <p> in hero — both lines are headlines (h1 + h2)
  assert.equal((heroContent.match(/<p\b/g) || []).length, 0, 'hero should not have <p> — both lines are headlines');
  assert.match(heroContent, /<h1[^>]*class="[^"]*large-type[^"]*reveal-text/);
  assert.match(heroContent, /<h2[^>]*class="[^"]*large-type[^"]*reveal-text/);
  // No inner spans/strongs inside reveal-text elements
  const revealBlocks = heroContent.match(/class="[^"]*reveal-text[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/g) || [];
  revealBlocks.forEach(b => {
    assert.doesNotMatch(b, /<span[\s>]/, 'inner <span> inside reveal-text breaks the JS word splitter');
    assert.doesNotMatch(b, /<strong[\s>]/, 'inner <strong> inside reveal-text breaks the JS word splitter');
  });
});

test('Hero copy: no "€450 fixed" or "X fixed" claims (we don\'t have fixed pricing)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const heroMatch = html.match(/<section class="hero[^>]*>([\s\S]*?)<\/section>/);
  const heroContent = heroMatch[1];
  assert.doesNotMatch(heroContent, /€?\d+\s*fixed/i, 'hero must not claim fixed pricing');
});

test('glow CTA visibility threshold matches scroll gate (80px)', () => {
  assert.match(SRC, /scrollY\s*>\s*80/);
});

test('IntersectionObserver fade-in has fallback for unsupported browsers', () => {
  assert.match(SRC, /'IntersectionObserver'\s+in\s+window/);
});

/* ─── WCAG / cognitive load contracts ─── */
console.log('\n[wcag + clarity]');

test('WCAG: --text-muted opacity >= 0.45 (mixes to >=4.5:1 on #f0f0f0)', () => {
  const tokensCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), 'utf8');
  const m = tokensCss.match(/--text-muted:\s*rgba\(\s*10,\s*10,\s*10,\s*([0-9.]+)\s*\)/);
  assert.ok(m, '--text-muted not found');
  assert.ok(parseFloat(m[1]) >= 0.45, `--text-muted opacity ${m[1]} < 0.45 (WCAG fail)`);
});

test('WCAG: section-label is >= 13px AND weight >= 500', () => {
  const baseCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'base.css'), 'utf8');
  const block = baseCss.match(/\.section-label\s*\{([^}]+)\}/);
  assert.ok(block, '.section-label rule not found');
  const sizeMatch = block[1].match(/font-size:\s*(\d+)px/);
  const weightMatch = block[1].match(/font-weight:\s*(\d+)/);
  assert.ok(sizeMatch && parseInt(sizeMatch[1]) >= 13, 'section-label font-size < 13px');
  assert.ok(weightMatch && parseInt(weightMatch[1]) >= 500, 'section-label weight < 500');
});

test('Animations: section fade-in is wired up via IntersectionObserver', () => {
  // Sections fade in as they enter viewport (was added to nav between sections feel smoother)
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const fadeInSections = (html.match(/<section[^>]*class="[^"]*fade-in/g) || []).length;
  assert.ok(fadeInSections >= 4, `expected >=4 sections with fade-in, got ${fadeInSections}`);
});

test('Clarity: case cards have at most 1 tag each (no badge spam)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  // No "Shipped Day X" badges (was repeated 5x in the previous build)
  assert.doesNotMatch(html, /Shipped Day/i, 'Repetitive "Shipped Day X" badges should be removed');
  // Each case-card-tags block contains exactly 1 <span class="tag">
  const tagBlocks = html.match(/<div class="case-card-tags">[\s\S]*?<\/div>/g) || [];
  assert.ok(tagBlocks.length === 5, `expected 5 case-card-tags blocks, got ${tagBlocks.length}`);
  tagBlocks.forEach((b, i) => {
    const tags = (b.match(/<span class="tag">/g) || []).length;
    assert.ok(tags === 1, `case card #${i} has ${tags} tags, expected 1`);
  });
});

test('Clarity: glow CTA docks into final-cta via IntersectionObserver', () => {
  assert.match(SRC, /getElementById\(['"]ctaDock['"]\)/);
  assert.match(SRC, /classList\.add\(['"]docked['"]\)/);
});

test('A11y: mascot wrapper is aria-hidden (decorative)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /id="siteIconWrap"[^>]*aria-hidden="true"/);
});

test('A11y: floating CTA aria-label tells user to type "site" once DM opens', () => {
  // Instagram blocks message prefill via URL — the aria-label must explain
  // that the user needs to type "site" themselves once the DM opens.
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /aria-label="Open Instagram DMs to @vibeweb\.eu — type the word ['']?site['']? to start"/);
});

/* ─── Schwartz selling structure (implicit 5-levels-of-awareness funnel) ─── */
console.log('\n[schwartz funnel]');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Schwartz 1/6: hero opens with problem-aware HOOK (not product-aware claim)', () => {
  // The hero h1 must read "If your work deserves better, your site should match."
  // NOT "Custom websites in seven days." (which is product-aware = colder lead).
  assert.match(HTML, /id="hero-title"[^>]*>\s*If your work deserves better, your site should match\./);
});

test('Schwartz 2/6: agitate section exists (cost-of-inaction reveal)', () => {
  assert.match(HTML, /<section class="agitate[^"]*"/);
  assert.match(HTML, /Every week without a site/);
  assert.match(HTML, /pick someone else/);
});

test('Schwartz 3/6: mechanism section (process) shows Day 1 -> Day 7 path', () => {
  assert.match(HTML, /<section class="process[^"]*"/);
  for (let i = 1; i <= 7; i++) {
    assert.match(HTML, new RegExp(`<span class="day">Day ${i}</span>`), `Day ${i} step missing`);
  }
});

test('Schwartz 4/6: proof section (selected work) has 5 case cards', () => {
  const cards = HTML.match(/<article class="case-card"/g) || [];
  assert.equal(cards.length, 5, `expected 5 case-card articles, got ${cards.length}`);
});

test('Schwartz 5/6: offer section spells out included AND excluded items', () => {
  assert.match(HTML, /<section class="offer[^"]*"/);
  assert.match(HTML, /class="offer__card"[\s\S]+?What you get/);
  assert.match(HTML, /class="offer__card offer__card--out"[\s\S]+?What you don't/);
  // At least 5 included items + 5 excluded items
  const included = HTML.match(/<article class="offer__card">[\s\S]+?<\/article>/);
  const excluded = HTML.match(/<article class="offer__card offer__card--out">[\s\S]+?<\/article>/);
  const inLis = (included?.[0].match(/<li>/g) || []).length;
  const exLis = (excluded?.[0].match(/<li>/g) || []).length;
  assert.ok(inLis >= 5, `included items: ${inLis} (need >=5)`);
  assert.ok(exLis >= 5, `excluded items: ${exLis} (need >=5)`);
});

test('Schwartz 6/6: close has risk-reversal language (Free / No deck / No commitment)', () => {
  assert.match(HTML, /Free\.\s*No deck\.\s*No commitment\./);
});

test('Schwartz: CTA appears 3+ times across the funnel (nav, floating, dock)', () => {
  // Nav "Get in touch" + floating glow CTA + dock anchor.
  const igLinks = (HTML.match(/href="https:\/\/ig\.me\/m\/vibeweb\.eu"/g) || []).length;
  const igInstagramLinks = (HTML.match(/href="https:\/\/www\.instagram\.com\/vibeweb\.eu"/g) || []).length;
  const navContact = (HTML.match(/href="#contact"/g) || []).length;
  const total = igLinks + navContact + igInstagramLinks;
  assert.ok(total >= 3, `expected >=3 conversion links across the funnel, got ${total}`);
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
