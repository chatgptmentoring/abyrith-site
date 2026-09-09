# abyrith.com

Launch site for **ABYRITH — The Fracturing of Light** by Dejan Davcevski.

Static site, no build step. Everything served from `public/`.

## Editing

- `public/index.html` — all page copy
- `public/styles.css` — design system (colours + type live in `:root`)
- `public/app.js` — the `CONFIG` block at the top holds the YouTube ID and
  the Supabase credentials. That is the only place those values appear.

## Interactive 3D atlas

`public/atlas/` contains an original Three.js world, served as static ES modules.
The Three.js 0.186.0 runtime and OrbitControls are vendored with their MIT licence.
No database, CDN dependency, build step or secret is needed for the atlas.

- `world-data.js`: 27 public geography records; no plot outcomes or spoiler payload.
- `terrain.js`: continuous annular terrain, forests, cities, weather and the fixed Core.
- `details.js`: original architectural details inspired by the website Archive.
- `world.js`: eased orbit/zoom, automatic hover descent, terrain walking, collision,
  keyboard and touch input, accessible catalogue, reduced motion and WebGL fallback.
- `world.css` and `index.html`: responsive explorer and controls.

Latest author corrections (9 September 2026) override the original chart:
the light is a fixed 70-degree sector; the world rotates clockwise; sunrise follows
Aurelion → Solkar → Thunder Plains → Wild Kingdom → Wydin → Sapphire Basin.
The Thunder Plains divide Solkar and the Wild Kingdom. Twilight City replaces the
old Serpent Roads marker. Roads are infrastructure. East Tower is inward of Caelmarch
toward the sun. Titanfall lies beside the Wild Kingdom in the Scorched Ridge.

Coordinates and architectural layouts are artistic reconstructions, not a measured
survey. `anchor` records use a broader region. Eldwyn, Wydienor and the Darklands
remain unplaced. Keep author-only revelations and Book One plot content out of all
public assets; the old plot-bearing data module has been removed completely.

The world turns once per six minutes at ordinary frame rates. Exploring pauses its
rotation. Reduced-motion preferences disable automatic movement. Buildings and
terrain boundaries constrain walking; hover mode permits travel above them.
Mobile uses fewer trees, smaller shadow maps and a capped pixel density.

Serve `public/` with a static HTTP server and open `/atlas/`. GitHub Pages publishes
the existing website when changes reach `main`.

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
