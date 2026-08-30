/* ══════════════════════════════════════════════════════════
   Registry Terminal — the Abyrith admin panel.
   Auth and data go through Supabase; no password lives here.
   ══════════════════════════════════════════════════════════ */

const SB = {
  url: "https://raaffebeteodotpwyfgi.supabase.co",
  key: "sb_publishable_PaP7U71NhtqY980fd4RnWg_gvpf1gtA",
  // "Dejan" is the username; this is the identity it maps to.
  adminEmail: "dejan@abyrith.com",
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const TOKENS = "abyrith.admin.session";
let session = null;

const saveSession = (s) => {
  session = s;
  try { sessionStorage.setItem(TOKENS, JSON.stringify(s)); } catch (_) {}
};
const loadSession = () => {
  try { session = JSON.parse(sessionStorage.getItem(TOKENS) || "null"); } catch (_) { session = null; }
  return session;
};
const clearSession = () => {
  session = null;
  try { sessionStorage.removeItem(TOKENS); } catch (_) {}
};

function say(msg, isErr) {
  const el = $("#status");
  el.textContent = msg || "";
  el.classList.toggle("err", !!isErr);
  if (msg && !isErr) setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 3200);
}

/* ── HTTP ───────────────────────────────────────────────── */
async function api(path, opts = {}, retry = true) {
  const res = await fetch(`${SB.url}${path}`, {
    ...opts,
    headers: {
      "apikey": SB.key,
      "Authorization": `Bearer ${session ? session.access_token : SB.key}`,
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401 && retry && session && session.refresh_token) {
    if (await refresh()) return api(path, opts, false);
  }
  return res;
}

async function refresh() {
  try {
    const res = await fetch(`${SB.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SB.key, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) return false;
    saveSession(await res.json());
    return true;
  } catch (_) { return false; }
}

const rest = async (path, opts) => {
  const res = await api(`/rest/v1/${path}`, opts);
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 180)}`);
  return res.status === 204 ? null : res.json();
};

/* ── Auth ───────────────────────────────────────────────── */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = $("#lgUser").value.trim();
  const pass = $("#lgPass").value;
  const msg = $("#lgMsg"), btn = $("#lgBtn");
  msg.className = "form-msg";
  const email = user.includes("@") ? user : SB.adminEmail;

  btn.disabled = true; btn.textContent = "Checking…";
  try {
    const res = await fetch(`${SB.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SB.key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error_code === "email_not_confirmed"
        ? "The account still needs confirming in Supabase."
        : "Those details were not accepted.";
      msg.classList.add("err");
      return;
    }
    saveSession(data);
    enter();
  } catch (_) {
    msg.textContent = "Could not reach the Registry. Try again.";
    msg.classList.add("err");
  } finally { btn.disabled = false; btn.textContent = "Enter"; }
});

$("#logout").addEventListener("click", () => { clearSession(); location.reload(); });

function enter() {
  $("#gate").hidden = true;
  $("#shell").hidden = false;
  const email = session && session.user ? session.user.email : SB.adminEmail;
  $("#whoami").textContent = email;
  loadText(); loadItems(); loadPages(); loadMedia();
}

/* ── Tabs ───────────────────────────────────────────────── */
$("#tabs").addEventListener("click", (e) => {
  const t = e.target.closest(".adm-tab");
  if (!t) return;
  $$(".adm-tab").forEach((b) => b.classList.toggle("is-on", b === t));
  $$(".adm-pane").forEach((p) => p.classList.toggle("is-on", p.dataset.pane === t.dataset.tab));
});

/* ── Text blocks ────────────────────────────────────────── */
async function loadText() {
  try {
    const rows = await rest("abyrith_content?select=key,value&order=key");
    $("#textList").innerHTML = rows.length ? rows.map(textRow).join("")
      : `<p class="adm-note">Nothing imported yet. Press <strong>Import current site text</strong> to pull in every editable block from the live page.</p>`;
  } catch (err) { say("Could not load text: " + err.message, true); }
}

const textRow = (r) => `
  <div class="adm-row" data-key="${esc(r.key)}">
    <div class="adm-row__top">
      <div>
        <div class="adm-row__key">${esc(r.key)}</div>
        <div class="adm-row__sub">${esc(LABELS[r.key] || "")}</div>
      </div>
      <div class="adm-row__acts"><button class="linkish" data-save-text type="button">Save</button></div>
    </div>
    <div class="adm-fields"><div class="adm-full">
      <textarea data-val>${esc(r.value)}</textarea>
    </div></div>
  </div>`;

// Human labels for the keys, so the list is readable.
const LABELS = {
  "hero.eyebrow": "Hero — badge above the title",
  "hero.sub": "Hero — subtitle under ABYRITH",
  "hero.line": "Hero — the two-line hook (HTML allowed)",
  "hero.cta": "Hero — button label",
  "hero.ctaSub": "Hero — small line under the button",
  "hero.formLabel": "Hero — preorder note",
  "world.kicker": "World — small heading",
  "world.title": "World — big heading (HTML allowed)",
  "world.colA": "World — left column (HTML allowed)",
  "world.colB": "World — right column (HTML allowed)",
  "world.quote": "World — the Sun Guard saying",
  "world.close": "World — closing paragraph (HTML allowed)",
  "ring.kicker": "The Ring — small heading",
  "ring.title": "The Ring — big heading",
  "ring.intro": "The Ring — intro paragraph",
  "trailer.kicker": "Trailer — small heading",
  "trailer.title": "Trailer — big heading",
  "census.kicker": "Census — small heading",
  "census.title": "Census — big heading",
  "census.intro": "Census — intro paragraph",
  "archive.kicker": "Archive — small heading",
  "archive.title": "Archive — big heading",
  "archive.intro": "Archive — intro paragraph",
  "places.title": "Places — heading",
  "places.intro": "Places — intro paragraph",
  "artefacts.title": "Artefacts — heading",
  "artefacts.intro": "Artefacts — intro paragraph",
  "preorder.title": "Preorder — big heading",
  "preorder.copy": "Preorder — paragraph (HTML allowed)",
};

$("#textList").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-save-text]");
  if (!btn) return;
  const row = btn.closest(".adm-row");
  const key = row.dataset.key;
  const value = $("[data-val]", row).value;
  btn.disabled = true;
  try {
    await rest(`abyrith_content?on_conflict=key`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key, value }),
    });
    say(`Saved ${key}`);
    row.classList.remove("adm-dirty");
  } catch (err) { say("Save failed: " + err.message, true); }
  finally { btn.disabled = false; }
});

/* Reads the live front page and seeds every editable block. */
$("#importBtn").addEventListener("click", async () => {
  say("Reading the live page…");
  try {
    const html = await (await fetch("/?cms-import=" + Date.now())).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = [];
    $$("[data-cms]", doc).forEach((el) => {
      rows.push({ key: el.dataset.cms, value: el.innerHTML.trim() });
    });
    if (!rows.length) { say("No editable blocks found on the page.", true); return; }
    await rest(`abyrith_content?on_conflict=key`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    say(`Imported ${rows.length} blocks.`);
    loadText();
  } catch (err) { say("Import failed: " + err.message, true); }
});

/* ── Items ──────────────────────────────────────────────── */
$("#kindFilter").addEventListener("change", loadItems);

async function loadItems() {
  const kind = $("#kindFilter").value;
  try {
    const rows = await rest(`abyrith_items?select=*&kind=eq.${kind}&order=sort,name`);
    $("#itemList").innerHTML = rows.length ? rows.map(itemRow).join("")
      : `<p class="adm-note">No ${kind}s stored yet. The site is still using its built-in set — press <strong>Add new</strong> to start overriding them, or add an extra one.</p>`;
  } catch (err) { say("Could not load items: " + err.message, true); }
}

const itemRow = (r) => `
  <div class="adm-row" data-id="${esc(r.id)}">
    <div class="adm-row__top">
      <div>
        <div class="adm-row__key">${esc(r.name || "(untitled)")}</div>
        <div class="adm-row__sub">${esc(r.kind)} · ${esc(r.slug)}${r.published ? "" : " · HIDDEN"}</div>
      </div>
      <div class="adm-row__acts">
        <button class="linkish" data-save-item type="button">Save</button>
        <button class="linkish adm-danger" data-del-item type="button">Delete</button>
      </div>
    </div>
    <div class="adm-fields">
      <label><span class="adm-mini">Name</span><input type="text" data-f="name" value="${esc(r.name)}"></label>
      <label><span class="adm-mini">Slug (no spaces)</span><input type="text" data-f="slug" value="${esc(r.slug)}"></label>
      <label><span class="adm-mini">Tag / small label</span><input type="text" data-f="tag" value="${esc(r.tag)}"></label>
      <label><span class="adm-mini">Image address</span><input type="text" data-f="image_url" value="${esc(r.image_url)}" placeholder="/assets/art/name.webp"></label>
      <label class="adm-full"><span class="adm-mini">Description</span><textarea data-f="body">${esc(r.body)}</textarea></label>
      <label><span class="adm-mini">Order</span><input type="number" data-f="sort" value="${Number(r.sort) || 100}"></label>
      <div class="adm-full">
        <label class="adm-check"><input type="checkbox" data-f="published" ${r.published ? "checked" : ""}> Visible</label>
        <label class="adm-check"><input type="checkbox" data-f="wide" ${r.wide ? "checked" : ""}> Wide</label>
        <label class="adm-check"><input type="checkbox" data-f="sealed" ${r.sealed ? "checked" : ""}> Sealed</label>
      </div>
    </div>
  </div>`;

const readItem = (row) => {
  const out = {};
  $$("[data-f]", row).forEach((el) => {
    out[el.dataset.f] = el.type === "checkbox" ? el.checked
      : el.type === "number" ? Number(el.value) || 100 : el.value.trim();
  });
  return out;
};

$("#itemList").addEventListener("click", async (e) => {
  const row = e.target.closest(".adm-row");
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.closest("[data-save-item]")) {
    const body = readItem(row);
    if (!body.name || !body.slug) { say("Name and slug are both needed.", true); return; }
    try {
      await rest(`abyrith_items?id=eq.${id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body),
      });
      say(`Saved ${body.name}`); loadItems();
    } catch (err) { say("Save failed: " + err.message, true); }
  }

  if (e.target.closest("[data-del-item]")) {
    if (!confirm("Delete this entry for good?")) return;
    try {
      await rest(`abyrith_items?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      say("Deleted."); loadItems();
    } catch (err) { say("Delete failed: " + err.message, true); }
  }
});

$("#addItem").addEventListener("click", async () => {
  const kind = $("#kindFilter").value;
  const slug = "new-" + Math.random().toString(36).slice(2, 7);
  try {
    await rest("abyrith_items", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ kind, slug, name: "New entry", tag: "", body: "", published: false, sort: 500 }),
    });
    say("Added — fill it in and save."); loadItems();
  } catch (err) { say("Could not add: " + err.message, true); }
});

/* ── Pages ──────────────────────────────────────────────── */
async function loadPages() {
  try {
    const rows = await rest("abyrith_pages?select=*&order=nav_order,title");
    $("#pageList").innerHTML = rows.length ? rows.map(pageRow).join("")
      : `<p class="adm-note">No extra pages yet.</p>`;
  } catch (err) { say("Could not load pages: " + err.message, true); }
}

const pageRow = (r) => `
  <div class="adm-row" data-id="${esc(r.id)}">
    <div class="adm-row__top">
      <div>
        <div class="adm-row__key">${esc(r.title)}</div>
        <div class="adm-row__sub">/p/${esc(r.slug)}${r.published ? "" : " · DRAFT"}</div>
      </div>
      <div class="adm-row__acts">
        <a class="linkish" href="/p/?s=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">Preview</a>
        <button class="linkish" data-save-page type="button">Save</button>
        <button class="linkish adm-danger" data-del-page type="button">Delete</button>
      </div>
    </div>
    <div class="adm-fields">
      <label><span class="adm-mini">Title</span><input type="text" data-f="title" value="${esc(r.title)}"></label>
      <label><span class="adm-mini">Address (lowercase, dashes)</span><input type="text" data-f="slug" value="${esc(r.slug)}"></label>
      <label><span class="adm-mini">Menu label (blank = not in menu)</span><input type="text" data-f="nav_label" value="${esc(r.nav_label)}"></label>
      <label><span class="adm-mini">Menu order</span><input type="number" data-f="nav_order" value="${Number(r.nav_order) || 100}"></label>
      <label class="adm-full"><span class="adm-mini">Body — plain paragraphs, or HTML if you prefer</span><textarea data-f="body" style="min-height:220px">${esc(r.body)}</textarea></label>
      <div class="adm-full">
        <label class="adm-check"><input type="checkbox" data-f="published" ${r.published ? "checked" : ""}> Published</label>
      </div>
    </div>
  </div>`;

$("#pageList").addEventListener("click", async (e) => {
  const row = e.target.closest(".adm-row");
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.closest("[data-save-page]")) {
    const body = readItem(row);
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(body.slug)) {
      say("The address may only use lowercase letters, numbers and dashes.", true); return;
    }
    try {
      await rest(`abyrith_pages?id=eq.${id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body),
      });
      say(`Saved ${body.title}`); loadPages();
    } catch (err) { say("Save failed: " + err.message, true); }
  }

  if (e.target.closest("[data-del-page]")) {
    if (!confirm("Delete this page for good?")) return;
    try {
      await rest(`abyrith_pages?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      say("Deleted."); loadPages();
    } catch (err) { say("Delete failed: " + err.message, true); }
  }
});

$("#addPage").addEventListener("click", async () => {
  const slug = "page-" + Math.random().toString(36).slice(2, 7);
  try {
    await rest("abyrith_pages", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ slug, title: "New page", body: "", published: false, nav_order: 500 }),
    });
    say("Page created as a draft."); loadPages();
  } catch (err) { say("Could not create: " + err.message, true); }
});

/* ── Media ──────────────────────────────────────────────── */
const BUCKET = "abyrith-art";
const publicUrl = (name) => `${SB.url}/storage/v1/object/public/${BUCKET}/${name}`;

async function loadMedia() {
  try {
    const rows = await rest(`../storage/v1/object/list/${BUCKET}`.replace("../", "") , {
      method: "POST",
      body: JSON.stringify({ prefix: "", limit: 100, sortBy: { column: "created_at", order: "desc" } }),
    }).catch(() => null) || [];
    render(rows);
  } catch (_) { render([]); }

  function render(rows) {
    const files = (rows || []).filter((r) => r && r.name && !r.name.endsWith("/"));
    $("#mediaList").innerHTML = files.length ? files.map((f) => `
      <figure class="adm-thumb">
        <img src="${esc(publicUrl(f.name))}" alt="${esc(f.name)}" loading="lazy">
        <figcaption><button type="button" data-copy="${esc(publicUrl(f.name))}">${esc(f.name)}<br>Copy address</button></figcaption>
      </figure>`).join("")
      : `<p class="adm-note">Nothing uploaded yet.</p>`;
  }
}

$("#mediaList").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-copy]");
  if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copy); say("Address copied."); }
  catch (_) { say("Copy failed — select the text manually.", true); }
});

$("#fileInput").addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const name = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
  say("Uploading…");
  try {
    const res = await api(`/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
      body: file,
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 160));
    say("Uploaded.");
    loadMedia();
  } catch (err) { say("Upload failed: " + err.message, true); }
  finally { e.target.value = ""; }
});

/* ── Password ───────────────────────────────────────────── */
$("#pwForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const a = $("#pw1").value, b = $("#pw2").value, msg = $("#pwMsg");
  msg.className = "form-msg";
  if (a.length < 10) { msg.textContent = "Use at least 10 characters."; msg.classList.add("err"); return; }
  if (a !== b) { msg.textContent = "The two do not match."; msg.classList.add("err"); return; }
  try {
    const res = await api("/auth/v1/user", { method: "PUT", body: JSON.stringify({ password: a }) });
    if (!res.ok) throw new Error((await res.text()).slice(0, 160));
    msg.textContent = "Password changed."; msg.classList.add("ok");
    $("#pwForm").reset();
  } catch (err) { msg.textContent = "Failed: " + err.message; msg.classList.add("err"); }
});

/* ── Boot ───────────────────────────────────────────────── */
if (loadSession()) { enter(); } else { $("#gate").hidden = false; }
