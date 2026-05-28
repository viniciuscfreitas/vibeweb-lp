/*
 * Vibe Web — i18n (EN/DE). Detects locale from localStorage > navigator.language.
 * Persists choice. Reloads on toggle so reveal-text re-splits the new strings.
 */
(function () {
  'use strict';

  const DICT = {
    en: {
      'meta.title': 'Vibe Web — Custom websites in 7 days.',
      'meta.description': 'If your work deserves better, your site should match. Custom websites in 7 days, for European freelancers and small businesses.',

      'nav.work': 'Work',
      'nav.cta': 'Get in touch',
      'nav.theme.light': 'Light mode',
      'nav.theme.dark': 'Dark mode',
      'nav.locale.aria': 'Language',

      'hero.line1': 'If your work deserves better, your site should match.',
      'hero.line2': 'Custom websites in 7 days, for European freelancers and small businesses.',

      'agitate.headline': 'Every week without a site, <em>~3 prospects pick someone else.</em>',
      'agitate.sub': 'Most never tell you why. They just disappear.',

      'process.label': 'How it works',
      'process.title': 'Day 1 to Day 7. Real timeline. No asterisks.',
      'process.day1.label': 'Day 1',
      'process.day1.title': 'Brief',
      'process.day1.body': '30-min call. I leave with everything I need.',
      'process.day2.label': 'Day 2',
      'process.day2.title': 'Wireframes',
      'process.day2.body': 'Structure first. Voice and message before pixels.',
      'process.day3.label': 'Day 3',
      'process.day3.title': 'Design',
      'process.day3.body': 'Visual direction. Typography, color, layout — done.',
      'process.day4.label': 'Day 4',
      'process.day4.title': 'Build',
      'process.day4.body': "Hand-coded HTML/CSS. No framework you don't need.",
      'process.day5.label': 'Day 5',
      'process.day5.title': 'Polish',
      'process.day5.body': 'Micro-interactions, edge cases, mobile QA.',
      'process.day6.label': 'Day 6',
      'process.day6.title': 'Review',
      'process.day6.body': 'Two rounds of feedback. Fast turnaround.',
      'process.day7.label': 'Day 7',
      'process.day7.title': 'Ship',
      'process.day7.body': 'DNS propagated. Live on your domain. Owned by you.',

      'work.label': 'Selected work',
      'case.onearc.meta': 'Architecture',
      'case.onearc.desc': 'Single-page concept site for a residential architecture studio.',
      'case.onearc.tag': 'Brand & Web',
      'case.lunera.meta': 'FinTech',
      'case.lunera.desc': 'Mobile-first product page for a personal finance app.',
      'case.lunera.tag': 'Product',
      'case.dreelio.meta': 'SaaS',
      'case.dreelio.desc': 'Marketing site for a freelancer ops platform.',
      'case.dreelio.tag': 'Marketing',
      'case.messageai.meta': 'AI',
      'case.messageai.desc': 'Brand and landing for an AI messaging tool.',
      'case.messageai.tag': 'Brand',
      'case.alytics.meta': 'B2B SaaS',
      'case.alytics.desc': 'Product page with feature grid, integrations row and free-trial CTA.',
      'case.alytics.tag': 'Product',

      'offer.label': 'The €450 package',
      'offer.title': "What's actually included — and what isn't.",
      'offer.in.title': 'What you get',
      'offer.in.li1': '5 custom-designed pages (home, work, services, about, contact)',
      'offer.in.li2': 'Hand-written HTML/CSS — no Wix, Squarespace or Webflow lock-in',
      'offer.in.li3': 'Mobile-first, responsive on every screen size',
      'offer.in.li4': 'SEO foundations + analytics ready out of the box',
      'offer.in.li5': 'Two rounds of revisions during the build',
      'offer.in.li6': 'Full ownership — code, domain, hosting in your name',
      'offer.in.li7': 'Live on your domain by Day 7',
      'offer.out.title': "What you don't",
      'offer.out.li1': 'Generic templates dressed up as "custom"',
      'offer.out.li2': 'Stock photography or AI-generated illustrations',
      'offer.out.li3': 'Six-week timelines pretending to be "thorough"',
      'offer.out.li4': 'Endless upsells (CMS, blog, e-commerce — separate scope)',
      'offer.out.li5': "Monthly retainers you didn't ask for",
      'offer.out.li6': 'Surprise invoices after sign-off',

      'cta.title': 'Send "site" to my DMs.',
      'cta.body': "I'll record a 5-minute Loom showing exactly how I'd build yours. Free. No deck. No commitment. If you like the take, we book Day 1.",
      'cta.button': 'Send "site" to my DMs',
      'cta.button.aria': "Open Instagram DMs to @vibeweb.eu — type the word 'site' to start",

      'footer.meta': '© 2026 · Built in seven days',

      'cookie.text': 'We use cookies to measure traffic and improve this site. You can decline without impact.',
      'cookie.decline': 'Decline',
      'cookie.accept': 'Accept'
    },

    de: {
      'meta.title': 'Vibe Web — Maßgeschneiderte Websites in 7 Tagen.',
      'meta.description': 'Wenn deine Arbeit Besseres verdient, sollte deine Website das widerspiegeln. Maßgeschneiderte Websites in 7 Tagen, für europäische Freelancer und Kleinunternehmen.',

      'nav.work': 'Arbeiten',
      'nav.cta': 'Kontakt',
      'nav.theme.light': 'Heller Modus',
      'nav.theme.dark': 'Dunkler Modus',
      'nav.locale.aria': 'Sprache',

      'hero.line1': 'Wenn deine Arbeit Besseres verdient, sollte deine Website das widerspiegeln.',
      'hero.line2': 'Maßgeschneiderte Websites in 7 Tagen, für europäische Freelancer und Kleinunternehmen.',

      'agitate.headline': 'Jede Woche ohne Website, <em>~3 Interessenten wählen jemand anderen.</em>',
      'agitate.sub': 'Die meisten sagen nie warum. Sie verschwinden einfach.',

      'process.label': "So funktioniert's",
      'process.title': 'Tag 1 bis Tag 7. Echter Zeitplan. Keine Sternchen.',
      'process.day1.label': 'Tag 1',
      'process.day1.title': 'Briefing',
      'process.day1.body': '30-Minuten-Call. Ich gehe mit allem raus, was ich brauche.',
      'process.day2.label': 'Tag 2',
      'process.day2.title': 'Wireframes',
      'process.day2.body': 'Struktur zuerst. Botschaft und Stimme vor Pixeln.',
      'process.day3.label': 'Tag 3',
      'process.day3.title': 'Design',
      'process.day3.body': 'Visuelle Richtung. Typografie, Farbe, Layout — fertig.',
      'process.day4.label': 'Tag 4',
      'process.day4.title': 'Build',
      'process.day4.body': 'Handcodiertes HTML/CSS. Kein Framework, das du nicht brauchst.',
      'process.day5.label': 'Tag 5',
      'process.day5.title': 'Feinschliff',
      'process.day5.body': 'Mikro-Interaktionen, Edge Cases, Mobile QA.',
      'process.day6.label': 'Tag 6',
      'process.day6.title': 'Review',
      'process.day6.body': 'Zwei Feedback-Runden. Schnelle Wendezeit.',
      'process.day7.label': 'Tag 7',
      'process.day7.title': 'Launch',
      'process.day7.body': 'DNS propagiert. Live auf deiner Domain. Dir gehört alles.',

      'work.label': 'Ausgewählte Arbeiten',
      'case.onearc.meta': 'Architektur',
      'case.onearc.desc': 'Single-Page-Konzept-Website für ein Architekturstudio.',
      'case.onearc.tag': 'Brand & Web',
      'case.lunera.meta': 'FinTech',
      'case.lunera.desc': 'Mobile-First-Produktseite für eine Finanz-App.',
      'case.lunera.tag': 'Produkt',
      'case.dreelio.meta': 'SaaS',
      'case.dreelio.desc': 'Marketing-Website für eine Freelancer-Ops-Plattform.',
      'case.dreelio.tag': 'Marketing',
      'case.messageai.meta': 'KI',
      'case.messageai.desc': 'Brand und Landing für ein KI-Messaging-Tool.',
      'case.messageai.tag': 'Brand',
      'case.alytics.meta': 'B2B SaaS',
      'case.alytics.desc': 'Produktseite mit Feature-Grid, Integrationen und Free-Trial-CTA.',
      'case.alytics.tag': 'Produkt',

      'offer.label': 'Das €450-Paket',
      'offer.title': 'Was wirklich drin ist — und was nicht.',
      'offer.in.title': 'Was du bekommst',
      'offer.in.li1': '5 individuell gestaltete Seiten (Home, Arbeiten, Leistungen, Über mich, Kontakt)',
      'offer.in.li2': 'Handgeschriebenes HTML/CSS — kein Wix-, Squarespace- oder Webflow-Lock-in',
      'offer.in.li3': 'Mobile-First, responsiv auf jedem Bildschirm',
      'offer.in.li4': 'SEO-Grundlagen + Analytics out of the box',
      'offer.in.li5': 'Zwei Revisionsrunden während des Builds',
      'offer.in.li6': 'Volles Eigentum — Code, Domain, Hosting auf deinen Namen',
      'offer.in.li7': 'Live auf deiner Domain an Tag 7',
      'offer.out.title': 'Was du nicht bekommst',
      'offer.out.li1': 'Generische Templates verkleidet als „individuell"',
      'offer.out.li2': 'Stockfotos oder KI-generierte Illustrationen',
      'offer.out.li3': 'Sechs-Wochen-Zeitpläne, die „gründlich" nur vortäuschen',
      'offer.out.li4': 'Endlose Upsells (CMS, Blog, E-Commerce — separater Scope)',
      'offer.out.li5': 'Monatliche Retainer, die du nicht bestellt hast',
      'offer.out.li6': 'Überraschungsrechnungen nach Abnahme',

      'cta.title': 'Schreib „site" in meine DMs.',
      'cta.body': 'Ich nehme dir ein 5-Minuten-Loom auf, das genau zeigt, wie ich deine Seite bauen würde. Kostenlos. Kein Pitch-Deck. Keine Verpflichtung. Wenn dir der Take gefällt, buchen wir Tag 1.',
      'cta.button': 'Schreib „site" in meine DMs',
      'cta.button.aria': 'Instagram-DMs an @vibeweb.eu öffnen — schreib das Wort „site", um zu starten',

      'footer.meta': '© 2026 · Gebaut in sieben Tagen',

      'cookie.text': 'Wir nutzen Cookies, um Traffic zu messen und diese Seite zu verbessern. Du kannst ablehnen, ohne Einschränkungen.',
      'cookie.decline': 'Ablehnen',
      'cookie.accept': 'Akzeptieren'
    }
  };

  function detectLocale() {
    try {
      const stored = localStorage.getItem('vibeweb_locale');
      if (stored === 'en' || stored === 'de') return stored;
    } catch (_) {}
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.indexOf('de') === 0 ? 'de' : 'en';
  }

  function applyLocale(locale) {
    const strings = DICT[locale] || DICT.en;

    document.documentElement.lang = locale === 'de' ? 'de' : 'en';

    if (strings['meta.title']) document.title = strings['meta.title'];

    const setMeta = (selector, key) => {
      const el = document.querySelector(selector);
      if (el && strings[key]) el.setAttribute('content', strings[key]);
    };
    setMeta('meta[name="description"]', 'meta.description');
    setMeta('meta[property="og:title"]', 'meta.title');
    setMeta('meta[property="og:description"]', 'meta.description');
    setMeta('meta[name="twitter:title"]', 'meta.title');
    setMeta('meta[name="twitter:description"]', 'meta.description');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', locale === 'de' ? 'de_DE' : 'en_US');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const v = strings[key];
      if (v == null) return;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = v;
      else el.textContent = v;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const v = strings[el.getAttribute('data-i18n-aria')];
      if (v != null) el.setAttribute('aria-label', v);
    });

    document.querySelectorAll('[data-locale-only]').forEach(el => {
      const lo = el.getAttribute('data-locale-only');
      const match = lo === locale;
      el.hidden = !match;
      if (match) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('[data-locale-value]').forEach(btn => {
      const active = btn.getAttribute('data-locale-value') === locale;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  applyLocale(detectLocale());

  document.querySelectorAll('[data-locale-value]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-locale-value');
      if (next !== 'en' && next !== 'de') return;
      try { localStorage.setItem('vibeweb_locale', next); } catch (_) {}
      window.location.reload();
    });
  });

  window.VibeI18n = { applyLocale: applyLocale, detect: detectLocale };
})();
