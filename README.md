# abyrith.com

Launch site for **ABYRITH — The Fracturing of Light** by Dejan Davcevski.

Static site, no build step. Everything served from `public/`.

## Editing

- `public/index.html` — all page copy
- `public/styles.css` — design system (colours + type live in `:root`)
- `public/app.js` — the `CONFIG` block at the top holds the YouTube ID and
  the Supabase credentials. That is the only place those values appear.

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
