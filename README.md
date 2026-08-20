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
