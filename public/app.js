/* ══════════════════════════════════════════════════════════
   ABYRITH — The Fracturing of Light
   Motion by Anime.js v4 (vendored at /vendor/anime.umd.min.js)
   ══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   CONFIG — the only block you ever need to edit
   ───────────────────────────────────────────────────────── */
const CONFIG = {
  // Paste the YouTube video ID here (the part after "v=").
  youtubeId: "XgEXQv3U66s",

  supabaseUrl: "https://raaffebeteodotpwyfgi.supabase.co",
  supabaseKey: "sb_publishable_PaP7U71NhtqY980fd4RnWg_gvpf1gtA",
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const { animate, createTimeline, createAnimatable, stagger, svg, utils,
        splitText, scrambleText, onScroll } = window.anime || {};
const HAS_ANIME = typeof animate === "function";
const MOTION = HAS_ANIME && !REDUCED;

// Headings split into characters, filled in once the fonts have settled.
const SPLITS = new Map();

/* Erythaic — the Ancient Tongue, in the Old Italic glyphs the Erythae
   Lamentations use. Declared up here because both the word-drop and the
   Archive's corrupted record need it. */
const ERYTHAIC = [..."𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙𐌚"];
const SCARS = [..."▚▞▓▒░█▙▟"];
function erythaic(words = 26) {
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const out = [];
  for (let i = 0; i < words; i++) {
    let w = "";
    for (let j = 0, len = 2 + ((Math.random() * 5) | 0); j < len; j++) {
      w += Math.random() < 0.08 ? pick(SCARS) : pick(ERYTHAIC);
    }
    out.push(w);
  }
  return out.join(" ");
}

function playChars(h) {
  const chars = SPLITS.get(h);
  if (!chars || h.dataset.charsPlayed) return;
  h.dataset.charsPlayed = "1";
  utils.set(h, { opacity: 1 });
  animate(chars, {
    y: ["115%", "0%"], opacity: [0, 1],
    duration: 950, delay: stagger(17), ease: "out(3)",
  });
}

/* ═══════════ CMS ═══════════
   Anything edited in the Registry Terminal overrides the built-in copy.
   If the fetch fails the page simply keeps the wording baked into the HTML,
   so the site can never end up blank because the database is unreachable. */
const CMS = (async () => {
  const empty = { content: {}, items: [], pages: [] };
  const headers = { apikey: CONFIG.supabaseKey, Authorization: `Bearer ${CONFIG.supabaseKey}` };
  const get = (q) =>
    fetch(`${CONFIG.supabaseUrl}/rest/v1/${q}`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  try {
    const [content, items, pages] = await Promise.all([
      get("abyrith_content?select=key,value"),
      get("abyrith_items?select=*&published=is.true&order=sort"),
      get("abyrith_pages?select=slug,title,nav_label,nav_order&published=is.true&order=nav_order"),
    ]);
    const map = {};
    (content || []).forEach((r) => { if (r && r.key) map[r.key] = r.value; });
    return { content: map, items: items || [], pages: pages || [] };
  } catch (_) { return empty; }
})();

// Text first, so headings are final before they are split into characters.
const CMS_TEXT = CMS.then((cms) => {
  $$("[data-cms]").forEach((el) => {
    const v = cms.content[el.dataset.cms];
    if (typeof v === "string" && v.trim()) el.innerHTML = v;
  });
  // Extra pages join the menu.
  const links = $(".nav__links");
  if (links && cms.pages.length) {
    cms.pages.filter((p) => p.nav_label).forEach((p) => {
      const a = document.createElement("a");
      a.href = `/p/?s=${encodeURIComponent(p.slug)}`;
      a.textContent = p.nav_label;
      links.appendChild(a);
    });
  }
  return cms;
}).catch(() => ({ content: {}, items: [], pages: [] }));

/* Collections the admin has taken over replace the built-in set entirely. */
function cmsItems(cms, kind) {
  const rows = (cms.items || []).filter((r) => r.kind === kind);
  return rows.length ? rows : null;
}

/* ═══════════ Consent + storage ═══════════
   The consent flag itself is always stored — without it the notice could
   not remember it was answered. The visitor's record is only stored when
   they have actually allowed it. */
const STORE = "abyrith.record.v1";
const CONSENT = "abyrith.consent.v1";

const consent = () => { try { return localStorage.getItem(CONSENT); } catch (_) { return null; } };
const mayStore = () => consent() === "all";

const remember = (rec) => {
  if (!mayStore()) return;
  try { localStorage.setItem(STORE, JSON.stringify({ ...rec, at: Date.now() })); } catch (_) {}
};
const recalled = () => {
  if (!mayStore()) return null;
  try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (_) { return null; }
};

(function dataNotice() {
  const el = $("#gdpr");
  if (!el) return;
  const decide = (choice) => {
    try {
      localStorage.setItem(CONSENT, choice);
      if (choice !== "all") localStorage.removeItem(STORE);
    } catch (_) {}
    if (HAS_ANIME && !REDUCED) {
      animate(el, { opacity: 0, y: 16, duration: 420, ease: "in(2)", onComplete: () => (el.hidden = true) });
    } else { el.hidden = true; }
    if (choice !== "all") { const c = $("#welcome"); if (c) c.hidden = true; }
  };
  $("#gdprAll").addEventListener("click", () => decide("all"));
  $("#gdprMin").addEventListener("click", () => decide("essential"));

  if (consent()) return;
  setTimeout(() => {
    el.hidden = false;
    if (HAS_ANIME && !REDUCED) animate(el, { opacity: [0, 1], y: [24, 0], duration: 700, ease: "out(3)" });
  }, 1400);
})();

/* ═══════════ Supabase RPC ═══════════ */
async function rpc(fn, body) {
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "apikey": CONFIG.supabaseKey,
      "Authorization": `Bearer ${CONFIG.supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ═══════════ 1. Drifting ash ═══════════ */
(function ash() {
  const c = $("#ash");
  if (!c || REDUCED) return;
  const ctx = c.getContext("2d");
  let motes = [];

  const spawn = (anywhere) => ({
    x: Math.random() * innerWidth,
    y: anywhere ? Math.random() * innerHeight : innerHeight + 12,
    r: Math.random() * 1.5 + 0.35,
    vy: -(Math.random() * 0.28 + 0.06),
    vx: (Math.random() - 0.5) * 0.22,
    a: Math.random() * 0.5 + 0.12,
    t: Math.random() * 6.28,
    ember: Math.random() < 0.22,
  });
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    motes = Array.from({ length: innerWidth < 700 ? 26 : 60 }, () => spawn(true));
  };
  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.t += 0.014; m.y += m.vy; m.x += m.vx + Math.sin(m.t) * 0.16;
      if (m.y < -12) motes[i] = spawn(false);
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283);
      ctx.fillStyle = m.ember
        ? `rgba(224,169,79,${m.a * (0.6 + Math.sin(m.t * 2) * 0.4)})`
        : `rgba(233,229,220,${m.a * 0.5})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  size();
  addEventListener("resize", size, { passive: true });
  frame();
})();

/* ═══════════ 2. Reveals — observer triggers, Anime.js performs ═══════════ */
const revealNow = (el) => {
  if (el.dataset.shown) return;
  el.dataset.shown = "1";
  if (!MOTION) { el.classList.add("in"); return; }
  el.classList.add("in");

  // Headings resolve letter by letter out of a clipped baseline.
  if (SPLITS.has(el)) { playChars(el); return; }

  // Archive records swing in from a tilted plane.
  if (el.classList.contains("card")) {
    animate(el, {
      opacity: [0, 1], y: [40, 0], rotateX: [-22, 0], scale: [0.94, 1],
      duration: 1000, delay: (+el.dataset.d || 0) * 90, ease: "out(3)",
    });
    return;
  }

  animate(el, {
    opacity: [0, 1], y: [26, 0],
    duration: 900, delay: (+el.dataset.d || 0) * 90, ease: "out(3)",
  });
};

function watch(els) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      revealNow(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  els.forEach((el) => io.observe(el));
}

(function chrome() {
  const nav = $("#nav");
  const onScrollY = () => nav.classList.toggle("is-stuck", scrollY > 40);
  addEventListener("scroll", onScrollY, { passive: true });
  onScrollY();
  $("#yr").textContent = new Date().getFullYear();

  // Everything outside the hero waits for the scroll; the hero has its own
  // entrance timeline below.
  const later = $$(".reveal").filter((el) => !el.closest(".hero"));
  watch(later);
  later.forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.92) revealNow(el);
  });

  // If nothing has appeared a few seconds in, show everything rather than
  // leave the visitor staring at an empty page.
  setTimeout(() => {
    if (!document.querySelector(".reveal.in")) $$(".reveal").forEach((el) => el.classList.add("in"));
  }, 4000);
})();

/* ═══════════ 3. Hero entrance ═══════════ */
(function heroIntro() {
  const items = $$(".hero .reveal");
  if (!HAS_ANIME || REDUCED) { items.forEach((el) => el.classList.add("in")); return; }

  items.forEach((el) => (el.dataset.shown = "1"));
  utils.set(items, { opacity: 0 });
  utils.set(".hero__seam", { scaleY: 0, opacity: 0 });

  const tl = createTimeline({ defaults: { ease: "out(3)" } });

  tl.add(".eyebrow", { opacity: [0, 1], y: [16, 0], duration: 700 }, 150)
    .add(".hero__title", {
      opacity: [0, 1],
      clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
      duration: 1100, ease: "out(4)",
      // Drop the clip once it lands: a lingering clip-path also crops the
      // title's drop-shadow to its box, which shows up as a dark rectangle.
      onComplete: () => { const t = $(".hero__title"); if (t) t.style.clipPath = "none"; },
    }, "-=450")
    .add(".hero__seam", {
      scaleY: [0, 1], opacity: [0, 1],
      duration: 700, delay: stagger(140), ease: "out(4)",
    }, "-=520")
    .add(".hero__sub", {
      opacity: [0, 1], letterSpacing: ["0.9em", "0.44em"], duration: 1100,
    }, "-=760")
    .add(".hero__line", { opacity: [0, 1], y: [18, 0], duration: 800 }, "-=700")
    .add(".hero__form", { opacity: [0, 1], y: [22, 0], scale: [0.97, 1], duration: 800 }, "-=560")
    .add(".hero__cta", { opacity: [0, 1], y: [16, 0], duration: 700 }, "-=560")
    .add(".hero__author", { opacity: [0, 1], duration: 700 }, "-=520")
    // The wrapper, not .cover — .cover carries a CSS perspective transform
    // that an animated transform here would overwrite.
    .add(".hero__cover", {
      opacity: [0, 1], y: [46, 0], scale: [0.94, 1], duration: 1400,
    }, 260);

  items.forEach((el) => el.classList.add("in"));
})();

/* ═══════════ 3b. The wider motion pass ═══════════ */
(function motionPass() {
  if (!MOTION) return;

  /* — Headings split into characters once the fonts have settled, so the
       measurements are taken against the real typeface. — */
  const initSplits = () => {
    $$(".display, .places-title").forEach((h) => {
      try {
        const { chars } = splitText(h, { chars: { wrap: "clip" }, accessible: true });
        if (!chars || !chars.length) return;
        SPLITS.set(h, chars);
        utils.set(chars, { opacity: 0 });

        if (h.dataset.shown) { playChars(h); return; }   // already on screen

        // A heading that is not itself a .reveal (nothing would ever trigger
        // it) gets its own observer.
        if (!h.classList.contains("reveal")) {
          new IntersectionObserver((es, obs) => es.forEach((e) => {
            if (!e.isIntersecting) return;
            obs.disconnect();
            playChars(h);
          }), { threshold: 0.25 }).observe(h);
        }
      } catch (_) { /* leave the heading as plain text */ }
    });
  };
  // Wait for the fonts AND for any edited copy, so headings are final before
  // they are split into characters.
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    CMS_TEXT,
  ]).then(initSplits);

  /* — The cover leans with the pointer. — */
  const cover = $(".cover");
  if (cover && matchMedia("(pointer: fine)").matches) {
    const tilt = createAnimatable(cover, { rotateX: 700, rotateY: 700, ease: "out(4)" });
    addEventListener("pointermove", (e) => {
      if (scrollY > innerHeight) return;               // only while the hero is in view
      const nx = (e.clientX / innerWidth - 0.5) * 2;
      const ny = (e.clientY / innerHeight - 0.5) * 2;
      tilt.rotateY(-11 + nx * 10);
      tilt.rotateX(2.5 - ny * 8);
    }, { passive: true });
  }

  /* — A rift down the edge of the page, widening as you descend. — */
  const rift = $("#riftline");
  if (rift) {
    let ticking = false;
    const draw = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      utils.set(rift, { scaleY: max > 0 ? Math.min(scrollY / max, 1) : 0 });
      ticking = false;
    };
    addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(draw); }
    }, { passive: true });
    draw();
  }

  /* — The hero glow fades out as the hero leaves. — */
  if (typeof onScroll === "function") {
    animate(".rift__glow", {
      opacity: [1, 0.15],
      autoplay: onScroll({ target: ".hero", sync: true, enter: "bottom bottom", leave: "bottom top" }),
    });
  }

  /* — Letterbox bars retract like a cinema curtain. — */
  const player = $("#player");
  if (player) {
    new IntersectionObserver((es, obs) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      animate(".player__bars i", { scaleY: [1, 0], duration: 1400, delay: stagger(120), ease: "inOut(3)" });
    }), { threshold: 0.35 }).observe(player);
  }

  /* — ABYRITH decodes out of the Ancient Tongue as you scroll toward it.
       Scroll position drives how much of the word has resolved; the
       letters still in Erythaic keep shimmering until they land. — */
  const drop = $(".word-drop__text");
  if (drop && typeof onScroll === "function") {
    const WORD = "ABYRITH";
    const glyph = () => ERYTHAIC[(Math.random() * ERYTHAIC.length) | 0];
    let progress = 0, inView = false, shimmer = null;

    const paint = () => {
      const done = Math.round(utils.clamp(progress, 0, 1) * WORD.length);
      let html = "";
      for (let i = 0; i < WORD.length; i++) {
        html += i < done
          ? `<span class="wd-on">${WORD[i]}</span>`
          : `<span class="wd-off">${glyph()}</span>`;
      }
      drop.innerHTML = html;
    };

    drop.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "sr-only";
    label.textContent = WORD;
    drop.parentNode.insertBefore(label, drop);
    paint();

    // Progress is mapped straight from scroll position: 0 when the word
    // first rises into view, 1 by the time it reaches the upper third.
    const compute = () => {
      const top = drop.getBoundingClientRect().top;
      const from = innerHeight * 0.95;
      const to = innerHeight * 0.34;
      return utils.clamp((from - top) / (from - to), 0, 1);
    };

    let ticking = false;
    const onMove = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const next = compute();
        if (Math.abs(next - progress) < 0.001) return;
        progress = next;
        paint();
      });
    };
    addEventListener("scroll", onMove, { passive: true });
    addEventListener("resize", onMove, { passive: true });
    progress = compute();
    paint();

    // Keep the undecoded glyphs shimmering while the word is on screen.
    new IntersectionObserver((es) => es.forEach((e) => {
      inView = e.isIntersecting;
      if (inView && !shimmer) {
        shimmer = setInterval(() => { if (progress < 1) paint(); }, 130);
      } else if (!inView && shimmer) {
        clearInterval(shimmer); shimmer = null;
      }
    }), { threshold: 0.05 }).observe(drop);
  }

  /* — The Sun Guard saying arrives a word at a time. — */
  const quote = $(".quote blockquote");
  if (quote) {
    try {
      const { words } = splitText(quote, { words: { wrap: "clip" }, accessible: true });
      utils.set(words, { opacity: 0 });
      new IntersectionObserver((es, obs) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        animate(words, { y: ["100%", "0%"], opacity: [0, 1], duration: 900, delay: stagger(46), ease: "out(3)" });
      }), { threshold: 0.4 }).observe(quote);
    } catch (_) {}
  }
})();

/* ═══════════ 4. Magnetic buttons ═══════════ */
(function magnets() {
  $$(".magnet").forEach((btn) => {
    const glow = $(".magnet__glow", btn);
    const pull = $(".magnet__pull", btn);

    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      if (glow) { glow.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; }
      if (!HAS_ANIME || REDUCED) return;
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      utils.set(btn, { x: dx * 7, y: dy * 5 });
      if (pull) utils.set(pull, { x: dx * 4, y: dy * 3 });
    });

    btn.addEventListener("pointerleave", () => {
      if (!HAS_ANIME || REDUCED) return;
      animate(btn, { x: 0, y: 0, duration: 700, ease: "outElastic(1, .5)" });
      if (pull) animate(pull, { x: 0, y: 0, duration: 700, ease: "outElastic(1, .5)" });
    });
  });
})();

/* ═══════════ 5. Trailer ═══════════ */
(function trailer() {
  const player = $("#player"), btn = $("#playBtn");
  const id = CONFIG.youtubeId || player.dataset.yt || "";
  if (!id) {
    player.classList.add("is-empty");
    btn.disabled = true;
    btn.setAttribute("aria-label", "Trailer arriving shortly");
    return;
  }
  const soon = $("#playerSoon"); if (soon) soon.remove();
  const load = () => {
    if ($("iframe", player)) return;
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
    f.title = "Abyrith — official trailer";
    f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    player.appendChild(f);
  };
  btn.addEventListener("click", load);
  player.addEventListener("click", (e) => { if (e.target !== btn) load(); });
})();

/* ═══════════ 6. The Mark ═══════════ */
const DESIGNATIONS = [
  "Logistic Calculation", "Stone Binding", "Field Yield", "Beast Warding",
  "Glass Reading", "Ash Tending", "Chorus Keeping", "Salt Reckoning",
  "Gate Watching", "Ledger Keeping", "Bone Setting", "Thread Pulling",
  "Deep Digging", "Horse Gentling", "Flame Tending", "Rope and Rigging",
  "Grain Measure", "Wall Standing", "Water Finding", "Verdict Bearing",
  "Lumen Craft", "Road Marking", "Seed Sorting", "Bell Ringing",
];
const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth",
  "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"];
const GREEK = ["Δ", "Ω", "Φ", "Ψ", "Ξ", "Σ", "Θ", "Λ"];

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

function readName(raw) {
  const h = hash(String(raw).trim().toLowerCase());
  return {
    undefinedSoul: h % 100 < 18,
    ordinal: ORDINALS[h % ORDINALS.length],
    desig: DESIGNATIONS[(h >>> 5) % DESIGNATIONS.length],
    id: `${String.fromCharCode(65 + (h % 26))}${String.fromCharCode(65 + ((h >>> 3) % 26))}-${String(h % 9000 + 1000)}-${GREEK[(h >>> 7) % GREEK.length]}`,
    h,
  };
}

function sigilSVG(h, broken) {
  const spokes = 6 + (h % 7);
  const col = broken ? "#d8202c" : "#e0a94f";
  let p = "";
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * 6.283 + (h % 10) / 10;
    const inner = broken ? 16 : 22;
    const outer = 34 + ((h >>> i) % 14);
    p += `<line x1="${(50 + Math.cos(a) * inner).toFixed(1)}" y1="${(50 + Math.sin(a) * inner).toFixed(1)}"
             x2="${(50 + Math.cos(a) * outer).toFixed(1)}" y2="${(50 + Math.sin(a) * outer).toFixed(1)}"
             stroke="${col}" stroke-width="${broken ? 0.7 : 1.1}" opacity="${broken ? 0.4 : 0.85}"/>`;
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="none" stroke="${col}" stroke-width=".7"
            opacity="${broken ? .35 : .55}" ${broken ? 'stroke-dasharray="5 7"' : ""}/>
    <circle cx="50" cy="50" r="${broken ? 15 : 21}" fill="none" stroke="${col}" stroke-width=".9"
            opacity="${broken ? .3 : .7}"/>
    ${p}
    ${broken
      ? `<line x1="26" y1="26" x2="74" y2="74" stroke="${col}" stroke-width="1.4" opacity=".8"/>`
      : `<circle cx="50" cy="50" r="4.5" fill="none" stroke="${col}" stroke-width="2"/>`}
  </svg>`;
}

// Paints the sigil, then draws it on stroke by stroke.
function paintSigil(host, h, broken) {
  host.innerHTML = sigilSVG(h, broken);
  if (!HAS_ANIME || REDUCED) return;
  const strokes = $$("line, circle", host);
  animate(svg.createDrawable(strokes), {
    draw: ["0 0", "0 1"],
    duration: 900,
    delay: stagger(45),
    ease: "inOut(2)",
  });
  animate(host, { rotate: [-14, 0], scale: [0.86, 1], opacity: [0, 1], duration: 1100, ease: "out(3)" });
}

/* Scan log shared by the inline Census and the modal Screening. */
const SCAN_LINES = [
  ["BINDING BIO-SIGNATURE", "OK"],
  ["QUERYING LIGHT-INDEX", "…"],
  ["CROSS-REFERENCING MARK REGISTRY", "…"],
  ["RESOLVING DESIGNATION", ""],
];

function runScan(logEl, done) {
  logEl.innerHTML = "";
  const step = REDUCED ? 60 : 520;
  SCAN_LINES.forEach((l, i) => {
    setTimeout(() => {
      const li = document.createElement("li");
      li.innerHTML = `<b></b><span>${l[1]}</span>`;
      logEl.appendChild(li);
      const label = $("b", li);
      label.textContent = l[0];
      if (HAS_ANIME && !REDUCED) {
        animate(label, {
          innerHTML: scrambleText({ chars: "A-Z0-9·/", revealRate: 0.62 }),
          duration: 520, ease: "linear",
        });
        animate(li, { opacity: [0, 1], x: [-10, 0], duration: 400 });
      }
    }, i * step);
  });
  setTimeout(done, SCAN_LINES.length * step + (REDUCED ? 40 : 420));
}

/* ═══════════ 7. Places ═══════════ */
const PLACES = [
  { slug: "aurelion-kingdom", name: "Aurelion", tag: "Seat of the Crown",
    text: "White walls rising like teeth against the curve of the world. Every road on the Ring eventually points here, and every number the Archive keeps is measured from it." },
  { slug: "aurellion-region", name: "The Serpent Roads", tag: "Open country",
    text: "Fourteen rotations of wind and stone between the outposts. Uneventful, the patrol reports say. Exhausting, say the men who walk them." },
  { slug: "oakhaven", name: "Oakhaven", tag: "Trade hub",
    text: "A day and a half from the capital by the Serpent Road. Everything passes through Oakhaven eventually — goods, rumour, and people who would rather not be counted." },
  { slug: "oakhaven-lumentree", name: "The Lumentree", tag: "Oakhaven, outer ring", wide: true,
    text: "It held light long before anyone thought to build beneath it. The town grew around the tree for the oldest reason there is: nobody wants to meet the dark without something that remembers the day." },
  { slug: "caelmarch", name: "Caelmarch", tag: "Industrial engine",
    text: "Cast iron, basalt and agri-vines. Caelmarch forges what the lit cities live on and keeps their soot for them. Torian works here, and the Slag-Heap slum clings to the outside of the wall like something the city could not quite shake off." },
  { slug: "solkar-city", name: "Solkar", tag: "Desert glass",
    text: "Glass and silicon under a hard sun, holding the largest Astrafer reserve on the Ring. Solkar solved problems the other kingdoms are still arguing about. Nobody who has been there talks about how." },
];

/* Percentages are of the map image box, so the pins ride with it at any size. */
const REGIONS = [
  { x: 48.5, y: 58, name: "Aurelion", tag: "Kingdom",
    text: "Golden, faith-run, and the richest kingdom on the Ring in coin. White walls rising like teeth against the curve of the world. The Crown sits here, and so does the Sun Guard." },
  { x: 41.5, y: 67.5, name: "Oakhaven", tag: "Trade city · Aurelion",
    text: "Built around the LumenOak — an ancient tree of crystal and petrified amber carrying a thousand glass leaves. A day and a half from the capital by the Serpent Road." },
  { x: 66, y: 67, name: "Caelmarch", tag: "Industrial engine",
    text: "Cast iron, basalt and agri-vines. It forges what the lit cities live on and keeps their soot for them. The Slag-Heap slum clings to the outside of the wall like something the city could not quite shake off." },
  { x: 82, y: 60, name: "Solkar", tag: "Desert glass",
    text: "A desert of glass and silicon. Science, longevity, and the largest Astrafer reserve on the Ring. Solkar is hot, they say, and its people are not." },
  { x: 18, y: 48, name: "The Sapphire Basin", tag: "Outer kingdom",
    text: "Water, Astrafer and the Great Glass Dam. It hoards all three, and it is a long way from the Crown." },
  { x: 36, y: 25, name: "Wydin", tag: "Unsurveyed",
    text: "The map marks it with a question mark. So does the Archive." },
  { x: 84, y: 36.7, name: "Thunder Plains", tag: "Storm border",
    text: "The storm border separating Solkar from the Wild Kingdom. Heading east, the order is Solkar, then the Thunder Plains, then the Wild Kingdom." },
  { x: 74.4, y: 25.2, name: "Wild Kingdom", tag: "Beyond the Thunder Plains",
    text: "Across the Thunder Plains from Solkar, off-grid: no light towers, no roads, no census. The storms form the border between the two kingdoms." },
  { x: 57, y: 70, name: "Serpent Roads", tag: "Main roads",
    text: "Fourteen rotations of wind and stone between outposts, on a road that adjusts itself. One rule never bends: you do not travel them after the light has passed." },
];

const ARTEFACTS = [
  { slug: "astrafer", name: "Astrafer", tag: "The reserve",
    text: "The most valuable substance on the Ring, and every region hoards every gram it can hold. Inactive it lies pale, dormant and cold. Active it ignites from within — pure, luminous, alive. A kingdom's vault is what its money stands on: however much Astrafer sits in it, that is how many Light Credits the Crown can back." },
  { slug: "twilight-strider", name: "The Twilight-Strider", tag: "Fauna · hostile", wide: true,
    text: "Armoured, and perfectly at home in the ravines where the light turns grey. Hunters do not go north for the meat. They go for the horn." },
  { slug: "skyweaver", name: "The Skyweaver", tag: "Vessel · Aurelion",
    text: "Solar-silk airships that have been persuaded to forget gravity, carrying the Crown's business over the rooftops of the capital. They fly for exactly as long as the light keeps holding its end of the arrangement." },
  { slug: "currency", name: "Currency of the Ringworld", tag: "Two forms of value",
    text: "Light Credits are universal and digital — glass cast with energy glyphs, clean, weightless, and trackable to the last transaction. Large Ones are struck from regional gold: thick, heavy, imperfect, stamped with the profile of King Auron, and quite untraceable. Most citizens will only ever handle one of the two." },
  { slug: "viras-parents", name: "Vira's parents", tag: "Ashberry · subsistence",
    text: "Two farmers on a hillside outside Ashberry, working for whatever the season gave them and charged the same extortion rate as merchants who could afford it. Vira does not talk about them. She just keeps the file." },
];

(function ringMap() {
  const pins = $("#mapPins");
  if (!pins) return;
  pins.innerHTML = REGIONS.map((r, i) => `
    <button class="pin" type="button" data-i="${i}"
            style="left:${r.x}%;top:${r.y}%" aria-label="${r.name}">
      <span class="pin__dot" aria-hidden="true"></span>
      <span class="pin__name">${r.name}</span>
    </button>`).join("");

  const empty = $("#mapEmpty"), detail = $("#mapDetail");
  const select = (i) => {
    const r = REGIONS[i];
    $$(".pin", pins).forEach((p) => p.classList.toggle("is-on", +p.dataset.i === i));
    $("#mpTag").textContent = r.tag;
    $("#mpName").textContent = r.name;
    $("#mpText").textContent = r.text;
    empty.hidden = true; detail.hidden = false;
    if (MOTION) {
      animate("#mapDetail > *", { opacity: [0, 1], y: [12, 0], duration: 520, delay: stagger(60), ease: "out(3)" });
    }
  };
  pins.addEventListener("click", (e) => {
    const p = e.target.closest(".pin");
    if (p) select(+p.dataset.i);
  });
})();

/* Both plate grids share one renderer. `dir` is the folder the built-in
   art lives in; an item edited in the admin carries its own image_url. */
function renderPlates(gridSel, list, dir) {
  const grid = $(gridSel);
  if (!grid) return;
  grid.innerHTML = list.map((p, i) => {
    const src = p.image_url || `/assets/${dir}/${p.slug}.webp`;
    const body = p.text ?? p.body ?? "";
    return `
    <figure class="place${p.wide ? " place--wide" : ""} reveal" data-d="${i % 3}">
      <span class="place__frame">
        <img src="${src}" alt="${p.name}" loading="lazy" decoding="async">
      </span>
      <figcaption>
        <p class="place__tag">${p.tag || ""}</p>
        <h4 class="place__name">${p.name}</h4>
        <p class="place__text">${body}</p>
      </figcaption>
    </figure>`;
  }).join("");
  watch($$(".place", grid));
}

renderPlates("#artefacts", ARTEFACTS, "art");
renderPlates("#places", PLACES, "places");

CMS_TEXT.then((cms) => {
  const a = cmsItems(cms, "artefact");
  const p = cmsItems(cms, "place");
  if (a) renderPlates("#artefacts", a, "art");
  if (p) renderPlates("#places", p, "places");
});

/* ═══════════ 8. The Archive ═══════════ */
const RECORDS = [
  { file: "REC-0001", slug: "erik-swordstrong", name: "Erik Swordstrong", role: "Sun Guard, formerly",
    text: "Captain of the Third Squadron, Sun Guard of Aurelion. His Mark read: Command and Protection. Service Until Cessation. He wears a strip of his old captain's cape tied over his eyes and has never taken it off. They call him the hunter who does not see. The blade he carries is grey, ugly, and no smith will claim it." },
  { file: "REC-0002", slug: "vira", name: "Vira", role: "Archivist of the North Eye, Luxharrow",
    text: "She reads the Resonance Table for a living: rivers of gold light, every Defined citizen a spark. Beneath them she keeps her own file — the black dots nobody is supposed to count — because if you write a thing down, it becomes real. She taught herself dead Erythaic from old poetry as a child. Lately the numbers refuse to add up." },
  { file: "REC-0003", slug: "jem", name: "Jem", role: "Undefined · the Slag-Heap",
    text: "No Mark, no record, no designation the System will admit to. Fast hands, faster mouth, scrap-reinforced boots, and a coin she flips when it matters: heads we live, tails we don't. Officially, she is noise." },
  { file: "REC-0004", slug: "valerious", name: "Valerious", role: "Captain, Oakhaven Third Regiment",
    text: "Gold plate, spotless procedure, and a tiredness he has stopped bothering to hide. He enforces the ordinances to the letter, and he is a fair portrait of the man Erik used to be. His own Mark, for what it is worth, reads Courier." },
  { file: "REC-0005", slug: "king-auron", name: "King Auron", role: "Crown of Aurelion",
    text: "He peels out-of-season fruit while other people burn. A man who looks as though he has never lifted anything heavier than a ledger — which is precisely why he is dangerous." },
  { file: "REC-0006", slug: "torian-in-his-workshop", name: "Torian", role: "Engineer, Caelmarch",
    text: "Half his head is wire. Brass, glass, and a workshop that smells of scorched oil, out where the foundries run. He can fix almost anything that was built. His standing objection, delivered at volume: he cannot fix physics." },
  { file: "REC-0007", slug: "lucious", name: "Lucius", role: "The Awakened — do not approach",
    text: "A miner's uniform fused into a fortress of rock and rusted steel. He speaks for the Awakened, and their creed is two words long: I matter. Witnesses agree on very little else." },
  { file: "REC-0008", slug: "the-seer", name: "███ Seer", role: "Sealed by order of the Crown",
    sealed: true, branch: "This is Erik…",
    text: "This record is sealed, and it stays sealed." },
  { file: "REC-0009", slug: "axiom", name: "▚▚▚▚▚", role: "Record corrupted", sealed: true, corrupt: true, text: "" },
];

(function archive() {
  const grid = $("#cards");
  grid.innerHTML = RECORDS.map((r, i) => `
    <button class="card${r.sealed ? " card--sealed" : ""} reveal" data-i="${i}" data-d="${i % 4}" type="button">
      <img src="/assets/characters/${r.slug}.webp" alt="${r.corrupt ? "Corrupted archive record" : "Archive record: " + r.name}" loading="lazy" decoding="async" width="700" height="1050">
      <span class="card__veil"></span>
      ${r.sealed ? '<span class="card__seal">SEALED</span>' : ""}
      <span class="card__meta">
        <span class="card__file">${r.file}</span>
        <span class="card__name">${r.name}</span>
        <span class="card__role">${r.role}</span>
      </span>
    </button>`).join("");
  watch($$(".card", grid));

  const lb = $("#lb");
  let lastFocus = null, glitch = null;
  const stopGlitch = () => { if (glitch) { clearInterval(glitch); glitch = null; } };

  const open = (i) => {
    const r = RECORDS[i];
    stopGlitch();
    $("#lbImg").src = `/assets/characters/${r.slug}.webp`;
    $("#lbImg").alt = r.corrupt ? "Corrupted archive record" : `Archive record: ${r.name}`;
    $("#lbFile").textContent = `${r.file} · ${r.sealed ? "SEALED" : "RECOVERED"}`;
    $("#lbRole").textContent = r.role;
    lb.classList.toggle("is-corrupt", !!r.corrupt);

    if (r.corrupt) {
      const name = $("#lbName"), text = $("#lbText");
      const paint = () => { name.textContent = erythaic(1); text.textContent = erythaic(30); };
      paint();
      if (!REDUCED) glitch = setInterval(paint, 140);
    } else {
      $("#lbName").textContent = r.name;
      $("#lbText").textContent = r.text;
    }

    // A record whose subject is not quite one person: the line is drawn
    // several times over, slightly out of step with itself.
    const br = $("#lbBranch");
    if (r.branch) {
      br.innerHTML = `<span class="branchtext" data-t="${r.branch}">${r.branch}</span>`;
      br.hidden = false;
    } else {
      br.hidden = true;
      br.innerHTML = "";
    }

    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
    if (HAS_ANIME && !REDUCED) {
      animate(".lb__inner img", { opacity: [0, 1], scale: [0.94, 1], duration: 700, ease: "out(3)" });
      animate(".lb__meta > *", { opacity: [0, 1], y: [14, 0], duration: 600, delay: stagger(60), ease: "out(3)" });
    }
  };
  const close = () => {
    stopGlitch(); lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) open(+card.dataset.i);
  });
  $("#lbClose").addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) close(); });
})();

/* ═══════════ 9. Inline Census ═══════════ */
let censusResult = null;

(function census() {
  const form = $("#censusForm");
  const stages = [$("#stage1"), $("#stage2"), $("#stage3")];
  const show = (n) => stages.forEach((s, i) => (s.hidden = i !== n));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#nameInput");
    const name = input.value.trim();
    if (name.length < 2) { input.classList.add("is-bad"); input.focus(); return; }
    input.classList.remove("is-bad");
    show(1);
    runScan($("#scanLog"), () => render(readName(name), name));
  });

  function render(r, name) {
    censusResult = { ...r, name };
    const box = $("#result");
    box.classList.toggle("is-undefined", r.undefinedSoul);
    box.classList.toggle("is-defined", !r.undefinedSoul);
    paintSigil($("#sigil"), r.h, r.undefinedSoul);

    if (r.undefinedSoul) {
      $("#resultStat").textContent = "SIGNAL LOST";
      $("#verdict").textContent = "UNDEFINED";
      $("#desig").textContent = "No designation on record";
      $("#markId").textContent = "NULL-SIGNAL · NO INDEX ENTRY";
      $("#resultBody").innerHTML = "The Table finds human mass at your position and no Light-signature above it. To the System you are a cleaning error. <em>And the cleaning errors are going quiet.</em>";
      $("#signupPitch").textContent = "Nobody is keeping your record. Keep it yourself — leave your address and you get the preorder link before it goes public.";
    } else {
      $("#resultStat").textContent = "COMPLETE";
      $("#verdict").textContent = "DEFINED";
      $("#desig").textContent = `Mark of the ${r.ordinal} Ascension — ${r.desig}`;
      $("#markId").textContent = `INDEX ${r.id}`;
      $("#resultBody").textContent = "You are recorded, anchored and accounted for. The Light knows where you live. Hold on to that — it was true for Erik Swordstrong too.";
      $("#signupPitch").textContent = "Your record stands. Keep it current — leave your address and you get the preorder link before it goes public.";
    }
    show(2);
    if (HAS_ANIME && !REDUCED) {
      animate("#stage3 .result__verdict", { opacity: [0, 1], scale: [0.9, 1], duration: 800, ease: "out(3)" });
      animate("#stage3 .result__desig, #stage3 .result__id, #stage3 .result__body",
        { opacity: [0, 1], y: [12, 0], duration: 700, delay: stagger(90), ease: "out(3)" });
    }
    $("#table").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
  }

  $("#againBtn").addEventListener("click", () => {
    show(0);
    $("#signup").classList.remove("is-done");
    $("#formMsg").textContent = "";
    $("#nameInput").value = "";
    $("#nameInput").focus();
  });

  $("#shareBtn").addEventListener("click", () => share(censusResult, $("#shareBtn")));

  // Census signup enrols through the same RPC the modal uses, so the name
  // and Mark are stored together.
  $("#emailForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#emailInput"), msg = $("#formMsg"), btn = $("#emailBtn");
    const email = input.value.trim();
    msg.className = "form-msg";
    if (!EMAIL_RE.test(email)) {
      input.classList.add("is-bad");
      msg.textContent = "That address does not resolve. Try again.";
      msg.classList.add("err"); input.focus(); return;
    }
    input.classList.remove("is-bad");
    const label = btn.textContent; btn.disabled = true; btn.textContent = "Recording…";
    try {
      const r = censusResult || {};
      const out = await rpc("abyrith_enroll", {
        p_email: email, p_first: r.name || null, p_last: null,
        p_mark: r.undefinedSoul ? null : r.desig || null,
        p_status: r.undefinedSoul == null ? null : (r.undefinedSoul ? "UNDEFINED" : "DEFINED"),
      });
      if (!out || out.ok === false) throw new Error(out && out.error);
      remember({ first: r.name || "", last: "", email, mark: out.mark, status: out.status });
      paintWelcome();
      msg.textContent = out.returning
        ? "You are already on the list. Your copy is reserved."
        : "Reserved. You will get the preorder link before anyone else.";
      msg.classList.add("ok");
      $("#emailForm").reset();
      setTimeout(() => $("#signup").classList.add("is-done"), 2400);
    } catch (_) {
      msg.textContent = "The Table did not answer. Please try again in a moment.";
      msg.classList.add("err");
    } finally { btn.disabled = false; btn.textContent = label; }
  });
})();

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

async function share(r, btn) {
  if (!r) return;
  const text = r.undefinedSoul
    ? "The Census of the North Eye has no record of me. I came back UNDEFINED. What are you? — ABYRITH"
    : `The Census of the North Eye marked me: ${r.desig}. What are you? — ABYRITH`;
  const url = "https://abyrith.com";
  try {
    if (navigator.share) await navigator.share({ title: "ABYRITH", text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      const old = btn.textContent; btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = old), 2200);
    }
  } catch (_) {}
}

/* ═══════════ 10. The Screening (modal) ═══════════ */
let screenResult = null;

function paintWelcome() {
  const rec = recalled();
  const chip = $("#welcome");
  if (!rec || !rec.first) { chip.hidden = true; return; }
  $(".welcome__text", chip).textContent = `Welcome back, ${rec.first}`;
  chip.hidden = false;
  if (HAS_ANIME && !REDUCED) animate(chip, { opacity: [0, 1], x: [10, 0], duration: 700, ease: "out(3)" });
}

(function screening() {
  const modal = $("#screen"), panel = $("#scrPanel");
  const steps = { enrol: $("#scrEnrol"), scan: $("#scrScan"), result: $("#scrResult"), recall: $("#scrRecall") };
  let lastFocus = null;

  const step = (name) => {
    Object.entries(steps).forEach(([k, el]) => (el.hidden = k !== name));
    if (HAS_ANIME && !REDUCED) {
      animate(steps[name].children, { opacity: [0, 1], y: [14, 0], duration: 600, delay: stagger(55), ease: "out(3)" });
    }
  };

  const open = (which = "enrol") => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    step(which);
    $("#scrStat").textContent = "STANDBY";
    if (HAS_ANIME && !REDUCED) {
      animate(modal, { opacity: [0, 1], duration: 300, ease: "linear" });
      animate(panel, { opacity: [0, 1], scale: [0.94, 1], y: [24, 0], duration: 700, ease: "out(4)" });
    }
    setTimeout(() => { const f = $("input", steps[which]); if (f) f.focus(); }, 260);
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  $$("[data-open-screen]").forEach((b) => b.addEventListener("click", () => {
    const rec = recalled();
    if (rec && rec.mark !== undefined && rec.status) { showStored(rec); } else { open("enrol"); }
  }));
  $("#recallLink").addEventListener("click", () => open("recall"));
  $("#welcome").addEventListener("click", () => { const r = recalled(); if (r) showStored(r); });
  $("#scrClose").addEventListener("click", close);
  $("#scrDone").addEventListener("click", close);
  $("#toRecall").addEventListener("click", () => step("recall"));
  $("#toEnrol").addEventListener("click", () => step("enrol"));
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });

  function showStored(rec) {
    const r = readName([rec.first, rec.last].filter(Boolean).join(" ") || rec.first);
    screenResult = { ...r, name: rec.first };
    open("result");
    paintResult(r, rec.first, "stored");
  }

  function paintResult(r, first, mode) {
    const box = $("#scrResultBox");
    box.classList.toggle("is-undefined", r.undefinedSoul);
    box.classList.toggle("is-defined", !r.undefinedSoul);
    $("#scrStat").textContent = r.undefinedSoul ? "SIGNAL LOST" : "COMPLETE";
    paintSigil($("#scrSigil"), r.h, r.undefinedSoul);

    if (r.undefinedSoul) {
      $("#scrVerdict").textContent = "UNDEFINED";
      $("#scrDesig").textContent = "No designation on record";
      $("#scrId").textContent = "NULL-SIGNAL · NO INDEX ENTRY";
      $("#scrBody").innerHTML = `${first ? first + ", t" : "T"}he Table finds human mass at your position and no Light-signature above it. To the System you are a cleaning error. <em>And the cleaning errors are going quiet.</em>`;
    } else {
      $("#scrVerdict").textContent = "DEFINED";
      $("#scrDesig").textContent = `Mark of the ${r.ordinal} Ascension — ${r.desig}`;
      $("#scrId").textContent = `INDEX ${r.id}`;
      $("#scrBody").textContent = `${first ? first + ", y" : "Y"}ou are recorded, anchored and accounted for. The Light knows where you live.`;
    }
    $("#scrEnrolled").innerHTML =
      mode === "stored"
        ? "The Registry already has you.<br>You are on the preorder list."
        : mode === "returning"
          ? "Your record was already on file.<br>You are on the preorder list."
          : "Recorded. You are on the preorder list —<br>the link reaches you before it goes public.";

    if (HAS_ANIME && !REDUCED) {
      animate("#scrVerdict", { opacity: [0, 1], scale: [0.88, 1], duration: 800, ease: "out(3)" });
      animate("#scrDesig, #scrId, #scrBody, #scrEnrolled",
        { opacity: [0, 1], y: [12, 0], duration: 700, delay: stagger(90), ease: "out(3)" });
    }
  }

  /* — enrol — */
  $("#enrolForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const first = $("#enFirst").value.trim();
    const last  = $("#enLast").value.trim();
    const email = $("#enEmail").value.trim();
    const msg = $("#enMsg"), btn = $("#enBtn");
    msg.className = "form-msg";

    if (first.length < 2) { $("#enFirst").classList.add("is-bad"); $("#enFirst").focus();
      msg.textContent = "The Registry needs a name."; msg.classList.add("err"); return; }
    if (!EMAIL_RE.test(email)) { $("#enEmail").classList.add("is-bad"); $("#enEmail").focus();
      msg.textContent = "That address does not resolve."; msg.classList.add("err"); return; }
    $("#enFirst").classList.remove("is-bad"); $("#enEmail").classList.remove("is-bad");

    const label = btn.textContent; btn.disabled = true; btn.textContent = "Screening…";
    const r = readName([first, last].filter(Boolean).join(" ") || first);

    try {
      const out = await rpc("abyrith_enroll", {
        p_email: email, p_first: first, p_last: last || null,
        p_mark: r.undefinedSoul ? null : r.desig,
        p_status: r.undefinedSoul ? "UNDEFINED" : "DEFINED",
      });
      if (!out || out.ok === false) throw new Error(out && out.error);
      remember({ first, last, email, mark: out.mark, status: out.status });
      paintWelcome();
      screenResult = { ...r, name: first };
      step("scan");
      $("#scrStat").textContent = "SCANNING";
      runScan($("#scrLog"), () => { step("result"); paintResult(r, first, out.returning ? "returning" : "new"); });
    } catch (_) {
      msg.textContent = "The Registry did not answer. Please try again in a moment.";
      msg.classList.add("err");
    } finally { btn.disabled = false; btn.textContent = label; }
  });

  /* — recall — */
  $("#recallForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#rcEmail").value.trim();
    const first = $("#rcFirst").value.trim();
    const last  = $("#rcLast").value.trim();
    const msg = $("#rcMsg"), btn = $("#rcBtn");
    msg.className = "form-msg";

    if (!email && !first) {
      msg.textContent = "Give an address, or a name."; msg.classList.add("err"); return;
    }
    const label = btn.textContent; btn.disabled = true; btn.textContent = "Searching…";
    try {
      const out = await rpc("abyrith_recall", {
        p_email: email || null, p_first: first || null, p_last: last || null,
      });
      if (out.found) {
        const name = out.first_name || first;
        const r = readName([out.first_name, last || ""].filter(Boolean).join(" ") || name);
        remember({ first: name, last, email, mark: out.mark, status: out.status });
        paintWelcome();
        screenResult = { ...r, name };
        step("result");
        paintResult(r, name, "stored");
      } else if (out.ambiguous && out.need === "last_name") {
        msg.textContent = `${out.count} people are indexed under that name. Add the family name.`;
        msg.classList.add("err");
        $("#rcLast").focus();
      } else if (out.ambiguous) {
        msg.textContent = "More than one record matches. Use the email address instead.";
        msg.classList.add("err");
        $("#rcEmail").focus();
      } else {
        msg.textContent = "No record found. You may not have been screened yet.";
        msg.classList.add("err");
      }
    } catch (_) {
      msg.textContent = "The Registry did not answer. Please try again in a moment.";
      msg.classList.add("err");
    } finally { btn.disabled = false; btn.textContent = label; }
  });

  $("#scrShare").addEventListener("click", () => share(screenResult, $("#scrShare")));
})();

/* ═══════════ 11. Tally ═══════════ */
(async function tally() {
  try {
    const n = await rpc("abyrith_count");
    const total = typeof n === "number" ? n : 0;
    if (total < 1) return;
    const el = $("#tally"), num = $("#tallyN");
    el.hidden = false;
    if (!HAS_ANIME || REDUCED) { num.textContent = total; return; }
    let started = false;
    new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || started) return;
        started = true; obs.disconnect();
        animate(num, {
          innerHTML: [0, total], duration: 1600, ease: "out(3)",
          modifier: utils.round(0),
        });
      });
    }, { threshold: 0.4 }).observe(el);
  } catch (_) { /* the figure is decorative; stay quiet */ }
})();

paintWelcome();
