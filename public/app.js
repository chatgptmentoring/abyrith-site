/* ══════════════════════════════════════════════════════════
   ABYRITH — The Fracturing of Light
   ══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   CONFIG — the only block you ever need to edit
   ───────────────────────────────────────────────────────── */
const CONFIG = {
  // Paste the YouTube video ID here (the part after "v=") and the
  // trailer goes live instantly. e.g. "dQw4w9WgXcQ"
  youtubeId: "XgEXQv3U66s",

  supabaseUrl: "https://raaffebeteodotpwyfgi.supabase.co",
  supabaseKey: "sb_publishable_PaP7U71NhtqY980fd4RnWg_gvpf1gtA",
  table: "abyrith_subscribers",
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ═══════════ 1. Drifting ash ═══════════ */
(function ash() {
  const c = $("#ash");
  if (!c || REDUCED) return;
  const ctx = c.getContext("2d");
  let w, h, motes = [];

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = c.width = innerWidth * dpr;
    h = c.height = innerHeight * dpr;
    c.style.width = innerWidth + "px";
    c.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = innerWidth < 700 ? 26 : 60;
    motes = Array.from({ length: n }, () => spawn(true));
  };
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

  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.t += 0.014;
      m.y += m.vy;
      m.x += m.vx + Math.sin(m.t) * 0.16;
      if (m.y < -12) motes[i] = spawn(false);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.283);
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

/* ═══════════ 2. Nav + scroll reveals ═══════════ */
(function chrome() {
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-stuck", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const items = $$(".reveal");

  // Anything already on screen at load reveals without waiting on the observer,
  // which can stay silent while the tab is backgrounded.
  items.forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.92) {
      setTimeout(() => el.classList.add("in"), (+el.dataset.d || 0) * 110);
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.d || "0", 10);
        setTimeout(() => e.target.classList.add("in"), d * 110);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));

  // Last resort: if nothing has revealed a few seconds in, show everything
  // rather than leave the visitor staring at an empty page.
  setTimeout(() => {
    if (!document.querySelector(".reveal.in")) {
      $$(".reveal").forEach((el) => el.classList.add("in"));
    }
  }, 4000);

  $("#yr").textContent = new Date().getFullYear();
})();

/* ═══════════ 3. Trailer (click-to-load facade) ═══════════ */
(function trailer() {
  const player = $("#player");
  const btn = $("#playBtn");
  const id = CONFIG.youtubeId || player.dataset.yt || "";

  if (!id) {
    player.classList.add("is-empty");
    btn.disabled = true;
    btn.setAttribute("aria-label", "Trailer arriving shortly");
    return;
  }
  $("#playerSoon").remove();

  const load = () => {
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

/* ═══════════ 4. The Archive ═══════════ */
const RECORDS = [
  {
    file: "REC-0001",
    slug: "erik-swordstrong",
    name: "Erik Swordstrong",
    role: "Sun Guard, formerly",
    text: "Captain of the Third Squadron. Carried a Mark from his seventh cycle and believed, the way soldiers do, that it meant something. He hunts now — blindfolded, by sound and weight and the honest map of pressure — with a grey, ugly blade that no smith will claim.",
  },
  {
    file: "REC-0002",
    slug: "vira",
    name: "Vira",
    role: "Archivist, the North Eye",
    text: "She reads the Resonance Table for a living: rivers of gold light, every Defined citizen a spark. Beneath them she keeps her own file — the black dots nobody is supposed to count. She has been counting them since she was twelve, and lately the numbers refuse to add up.",
  },
  {
    file: "REC-0003",
    slug: "jem",
    name: "Jem",
    role: "Undefined",
    text: "No Mark, no record, no designation the System will admit to. Fast hands, faster mouth, and an unhelpful habit of being exactly where the trouble is. Officially, she is noise.",
  },
  {
    file: "REC-0004",
    slug: "valerious",
    name: "Valerious",
    role: "Captain of the Guard",
    text: "Gold plate, spotless procedure, and a tiredness he has stopped bothering to hide. He enforces the Pre-Alignment ordinances to the letter. Whether the letter still means anything is a question he does not ask out loud.",
  },
  {
    file: "REC-0005",
    slug: "king-auron",
    name: "King Auron",
    role: "Crown of Aurelion",
    text: "A man who looks as though he has never lifted anything heavier than a ledger, which is precisely why he is dangerous. He knows what the Archivists find before they finish finding it — and he has a word for it that he will not explain.",
  },
  {
    file: "REC-0006",
    slug: "torian-in-his-workshop",
    name: "Torian",
    role: "Artificer",
    text: "Brass, glass, and a workshop that smells of scorched oil. He can fix almost anything that was built. His standing objection, delivered at volume: he cannot fix physics.",
  },
  {
    file: "REC-0007",
    slug: "lucious",
    name: "Lucious",
    role: "Hostile — do not approach",
    text: "Masked, spiked, and entirely at ease with what he does. Witnesses agree on the laughter and very little else. The file was flagged for containment and then, curiously, unflagged.",
  },
  {
    file: "REC-0008",
    slug: "the-seer",
    name: "███ Seer",
    role: "Sealed by order of the Crown",
    sealed: true,
    text: "This record is sealed. What can be said: he offers people exactly what they have lost, in the voice they most want to hear it in — and the price is never named up front.",
  },
  {
    file: "REC-0009",
    slug: "axiom",
    name: "Axiom",
    role: "Classification refused",
    sealed: true,
    text: "The Table cannot index it. It registers no Mark, no signature, and no cessation event. It walks at the head of something enormous, and on at least one occasion it looked directly at a man holding an unremarkable grey sword — and chose to walk past him.",
  },
];

(function archive() {
  const grid = $("#cards");
  grid.innerHTML = RECORDS.map(
    (r, i) => `
    <button class="card${r.sealed ? " card--sealed" : ""} reveal" data-i="${i}" data-d="${i % 4}" type="button">
      <img src="/assets/characters/${r.slug}.webp" alt="Archive record: ${r.name}" loading="lazy" decoding="async" width="700" height="1050">
      <span class="card__veil"></span>
      ${r.sealed ? '<span class="card__seal">SEALED</span>' : ""}
      <span class="card__meta">
        <span class="card__file">${r.file}</span>
        <span class="card__name">${r.name}</span>
        <span class="card__role">${r.role}</span>
      </span>
    </button>`
  ).join("");

  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      setTimeout(() => e.target.classList.add("in"), (+e.target.dataset.d || 0) * 90);
      io.unobserve(e.target);
    }),
    { threshold: 0.1 }
  );
  $$(".card", grid).forEach((c) => io.observe(c));

  const lb = $("#lb");
  let lastFocus = null;

  const open = (i) => {
    const r = RECORDS[i];
    $("#lbImg").src = `/assets/characters/${r.slug}.webp`;
    $("#lbImg").alt = `Archive record: ${r.name}`;
    $("#lbFile").textContent = `${r.file} · ${r.sealed ? "SEALED" : "RECOVERED"}`;
    $("#lbName").textContent = r.name;
    $("#lbRole").textContent = r.role;
    $("#lbText").textContent = r.text;
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  };
  const close = () => {
    lb.hidden = true;
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

/* ═══════════ 5. The Census ═══════════ */
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
  const h = hash(raw.trim().toLowerCase());
  const undefinedSoul = h % 100 < 18;
  return {
    undefinedSoul,
    ordinal: ORDINALS[h % ORDINALS.length],
    desig: DESIGNATIONS[(h >>> 5) % DESIGNATIONS.length],
    id: `${String.fromCharCode(65 + (h % 26))}${String.fromCharCode(65 + ((h >>> 3) % 26))}-${String(h % 9000 + 1000)}-${GREEK[(h >>> 7) % GREEK.length]}`,
    h,
  };
}

function sigil(h, broken) {
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
    if (!broken && (h >>> (i + 2)) % 2) {
      p += `<circle cx="${(50 + Math.cos(a) * outer).toFixed(1)}" cy="${(50 + Math.sin(a) * outer).toFixed(1)}" r="1.9" fill="${col}"/>`;
    }
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="none" stroke="${col}" stroke-width=".7"
            opacity="${broken ? .35 : .55}" ${broken ? 'stroke-dasharray="5 7"' : ""}/>
    <circle cx="50" cy="50" r="${broken ? 15 : 21}" fill="none" stroke="${col}" stroke-width=".9"
            opacity="${broken ? .3 : .7}" ${broken ? 'stroke-dasharray="3 6"' : ""}/>
    ${p}
    ${broken
      ? `<line x1="26" y1="26" x2="74" y2="74" stroke="${col}" stroke-width="1.4" opacity=".8"/>`
      : `<circle cx="50" cy="50" r="4.5" fill="${col}"/>`}
  </svg>`;
}

(function census() {
  const form = $("#censusForm");
  const stages = [$("#stage1"), $("#stage2"), $("#stage3")];
  const show = (n) => stages.forEach((s, i) => (s.hidden = i !== n));
  let current = null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#nameInput");
    const name = input.value.trim();
    if (name.length < 2) { input.classList.add("is-bad"); input.focus(); return; }
    input.classList.remove("is-bad");

    show(1);
    const log = $("#scanLog");
    log.innerHTML = "";
    const lines = [
      ["BINDING BIO-SIGNATURE", "OK"],
      ["QUERYING LIGHT-INDEX", "…"],
      ["CROSS-REFERENCING MARK REGISTRY", "…"],
      ["RESOLVING DESIGNATION", ""],
    ];
    const step = REDUCED ? 60 : 520;
    lines.forEach((l, i) => {
      setTimeout(() => {
        const li = document.createElement("li");
        li.innerHTML = `${l[0]}<span>${l[1]}</span>`;
        log.appendChild(li);
      }, i * step);
    });

    setTimeout(() => render(readName(name), name), lines.length * step + (REDUCED ? 40 : 420));
  });

  function render(r, name) {
    current = { ...r, name };
    const res = $("#result");
    res.classList.toggle("is-undefined", r.undefinedSoul);
    res.classList.toggle("is-defined", !r.undefinedSoul);
    $("#sigil").innerHTML = sigil(r.h, r.undefinedSoul);

    if (r.undefinedSoul) {
      $("#resultStat").textContent = "SIGNAL LOST";
      $("#verdict").textContent = "UNDEFINED";
      $("#desig").textContent = "No designation on record";
      $("#markId").textContent = "NULL-SIGNAL · NO INDEX ENTRY";
      $("#resultBody").innerHTML =
        `The Table finds human mass at your position and no Light-signature above it. ` +
        `To the System you are a cleaning error. <em>And the cleaning errors are going quiet.</em>`;
      $("#signupPitch").textContent =
        "Nobody is keeping your record. So keep it yourself — and be first through the gate when Abyrith opens.";
    } else {
      $("#resultStat").textContent = "COMPLETE";
      $("#verdict").textContent = "DEFINED";
      $("#desig").textContent = `Mark of the ${r.ordinal} Ascension — ${r.desig}`;
      $("#markId").textContent = `INDEX ${r.id}`;
      $("#resultBody").textContent =
        `You are recorded, anchored and accounted for. The Light knows where you live. ` +
        `Hold on to that — it was true for Erik Swordstrong too.`;
      $("#signupPitch").textContent =
        "Your record stands. Keep it current — and be first through the gate when Abyrith opens.";
    }
    show(2);
    $("#table").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
  }

  $("#againBtn").addEventListener("click", () => {
    show(0);
    $("#signup").classList.remove("is-done");
    $("#formMsg").textContent = "";
    $("#nameInput").value = "";
    $("#nameInput").focus();
  });

  $("#shareBtn").addEventListener("click", async () => {
    if (!current) return;
    const text = current.undefinedSoul
      ? `The Census of the North Eye has no record of me. I came back UNDEFINED. What are you? — ABYRITH`
      : `The Census of the North Eye marked me: ${current.desig}. What are you? — ABYRITH`;
    const url = "https://abyrith.com";
    try {
      if (navigator.share) { await navigator.share({ title: "ABYRITH", text, url }); }
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        const b = $("#shareBtn"); const old = b.textContent;
        b.textContent = "Copied"; setTimeout(() => (b.textContent = old), 2200);
      }
    } catch (_) { /* user dismissed the share sheet */ }
  });

  wireEmail($("#emailForm"), $("#emailInput"), $("#emailBtn"), $("#formMsg"), () => current, true);
})();

/* ═══════════ 6. Email capture ═══════════ */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

async function subscribe(email, meta) {
  // Plain INSERT on purpose. An upsert would require UPDATE rights for
  // anonymous visitors, which would let anyone overwrite someone else's row.
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${CONFIG.table}`, {
    method: "POST",
    headers: {
      "apikey": CONFIG.supabaseKey,
      "Authorization": `Bearer ${CONFIG.supabaseKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      email,
      mark: meta?.undefinedSoul ? null : meta?.desig ?? null,
      status: meta ? (meta.undefinedSoul ? "UNDEFINED" : "DEFINED") : null,
      source: "abyrith.com",
    }),
  });

  if (res.ok) return "new";
  // 409 / 23505 = this address is already on the list. That is a success.
  if (res.status === 409) return "existing";
  let code = "";
  try { code = (await res.clone().json()).code || ""; } catch (_) {}
  if (code === "23505") return "existing";
  throw new Error(`HTTP ${res.status}`);
}

function wireEmail(form, input, btn, msg, getMeta, hideOnDone) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    msg.className = "form-msg";
    if (!EMAIL_RE.test(email)) {
      input.classList.add("is-bad");
      msg.textContent = "That address does not resolve. Try again.";
      msg.classList.add("err");
      input.focus();
      return;
    }
    input.classList.remove("is-bad");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Recording…";
    try {
      const outcome = await subscribe(email, getMeta ? getMeta() : null);
      msg.textContent = outcome === "existing"
        ? "You are already on the list. Your record stands."
        : "Recorded. Watch your inbox — the gate opens soon.";
      msg.classList.add("ok");
      form.reset();
      if (hideOnDone) setTimeout(() => $("#signup").classList.add("is-done"), 2400);
    } catch (err) {
      msg.textContent = "The Table did not answer. Please try again in a moment.";
      msg.classList.add("err");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
}

wireEmail($("#footerForm"), $("#footerEmail"), $("#footerBtn"), $("#footerMsg"), null, false);
