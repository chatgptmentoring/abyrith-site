# abyrith.com

Launch site for **ABYRITH — The Fracturing of Light** by Dejan Davcevski.

Static site, no build step. Everything served from `public/`.

## Editing

- `public/index.html` — all page copy
- `public/styles.css` — design system (colours + type live in `:root`)
- `public/app.js` — the `CONFIG` block at the top holds the YouTube ID and
  the Supabase credentials. That is the only place those values appear.

## Interactive atlas

`public/atlas/` is the self-contained Aethergard atlas, linked from the homepage.
It uses the existing map and place artwork, without a build step or database.

- `data.js` holds 48 public Book One records and two guided journeys.
- `atlas.js` handles pointer/pinch zoom, keyboard navigation, search, layers,
  sunlight illustration, location links, and explicit spoiler opt-in.
- `atlas.css` and `index.html` define the responsive map interface.

Coordinates refer to the original 1122 × 1402 chart. A record with `anchor`
only identifies a broader region; never treat it as an exact location. Records
without coordinates or anchors remain unplaced. Preserve the uncertainty of
“Wydin?” and keep author-only series revelations out of all public assets.

Author clarification (9 September 2026): the Thunder Plains form the border
between Solkar and the Wild Kingdom. Eastward order is Solkar → Thunder Plains
→ Wild Kingdom. The atlas and homepage pins follow that order, superseding the
original artwork's printed label placement. The storm-belt geometry is schematic.

The author also specifies a clockwise world beneath a fixed 40-degree light
beam. Sunrise proceeds Aurelion → Solkar → Thunder Plains → Wild Kingdom →
Wydin → Sapphire Basin → Aurelion. The living atlas rotates once per six real
minutes (illustrative speed), keeps interactive labels upright, and supports
pause and phase scrubbing. Reduced-motion preferences disable automatic motion.
The original-chart view remains still. Zoom uses eased camera transitions with
a subtle light effect. Neither the beam nor the sun rotates with the world.

Serve `public/` with any static HTTP server, then open `/atlas/`. Publishing
continues through the existing GitHub Pages workflow when changes reach `main`.

## Email signups

Signups land in the `abyrith_subscribers` table in Supabase.
Anonymous visitors can insert a row and nothing else — they cannot read,
update, or delete. Export the list from the Supabase table editor.

## Assets

`tools/optimize2.js` regenerates the optimised images from the source art.
`tools/shots.js` renders screenshots of the built page.

## Hosting

Live via GitHub Pages. `.github/workflows/pages.yml` publishes `public/` on
every push to `main`. `public/CNAME` binds the custom domain.

### DNS (GoDaddy)

abyrith.com is registered at GoDaddy on GoDaddy nameservers. In
**Domains -> abyrith.com -> DNS -> Manage Zones**, the apex needs four A
records pointing at GitHub Pages:

    A   @   185.199.108.153
    A   @   185.199.109.153
    A   @   185.199.110.153
    A   @   185.199.111.153
    CNAME   www   chatgptmentoring.github.io

Delete the parking A record GoDaddy adds by default, or the domain keeps
resolving to the parked page.

Once DNS resolves, tick **Enforce HTTPS** in the repo's Pages settings.
GitHub issues the certificate automatically; it is not available until DNS
points at GitHub.

### Moving to Vercel later

Import the repo at vercel.com/new, set **Root Directory** to `public`, and
deploy. Then repoint the apex A record to `76.76.21.21` and the `www` CNAME
to `cname.vercel-dns.com`, and delete `public/CNAME`. Use one host at a
time — the domain can only point to one of them.
