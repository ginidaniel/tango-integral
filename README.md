# Tango Integral — website

Lightweight, static rebuild of tangointegral.com. No Wix, no build step,
no plugins — just HTML, CSS and a little vanilla JavaScript. Fast, cheap to
host, and easy to keep in version control.

## Pages
| File                    | What it is                                             |
|-------------------------|--------------------------------------------------------|
| `index.html`            | Home — light theme (white, black text, brand accents)  |
| `indexDark.html`        | Home — dark theme variant (violet base). Alternate idea / dark mode |
| `tango-in-london.html`  | "Tango in London" — this week's milongas (dynamic JS)  |
| `data/milongas.json`    | Template for the live milonga data source              |
| `img/`                  | Every image the site uses — self-hosted, no CDN         |

The two home pages link to each other via the ◐ / ◑ toggle in the header.

## Images

All images live in **one flat `img/` folder at the repo root**, and every page
references them with a **root-relative** path — `/img/daniel-eleonora-studio.jpg`,
with the leading slash. That path resolves identically on `localhost` and on
`tangointegral.com`, so the site deploys as-is: no rewriting, no rearranging.

Two rules keep it that way:

1. **Filenames are web-safe** — lowercase, hyphens, no spaces, no accents, no
   parentheses. macOS is forgiving about `In class 2.png`; the Linux box serving
   the site is case-sensitive and will 404 on it.
2. **Nothing points at `static.wixstatic.com` any more.** If Wix is ever turned
   off, the site is unaffected.

Because paths are root-relative, opening `index.html` by double-clicking no
longer works (`/img/` would resolve to the root of your disk) — use the local
server below. For the same reason, don't deploy to a **GitHub Pages project
site** (`user.github.io/repo/`), which serves under a sub-path. Cloudflare Pages
on the real domain is fine.

The pristine full-size files scraped from Wix are kept in `.originals/`, which is
gitignored — the versions in `img/` are resized and re-compressed (30 MB → 9 MB).
Regenerate from `.originals/` if you ever need a bigger crop.

## Brand palette (from the logo)
- Violet  `#52498D`  — brand
- Turquoise `#66C9C4` — accent
- Coral `#EE7D61` — primary action (added, warm complement)
- Black `#1D1B2E` / White `#FFFFFF`

## The milongas widget (dynamic content)
`tango-in-london.html` renders the week's milongas with vanilla JS. By default
it shows embedded sample data so the page always works. To go live, set
`CONFIG.source` in the page's script to a JSON URL:

- a file in this repo: `./data/milongas.json`, or
- the Tango Integral app's API endpoint, e.g. `https://api.tangointegral.com/milongas`

Each item is a weekly-recurring event:
```json
{ "name":"", "weekday":"Friday", "start":"20:30", "end":"01:00",
  "venue":"", "area":"", "url":"", "organiser":"" }
```
**CORS:** a browser can only read an API that allows cross-origin requests.
If the app's API doesn't, we put a tiny Cloudflare Worker in front of it as a proxy.

## Preview locally
Always through a server — root-relative image paths and `fetch` both need one:
```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Put it on GitHub
```
git remote add origin https://github.com/<your-username>/tango-integral.git
git branch -M main
git push -u origin main
```
(The repo is already initialised with a first commit.)

## Hosting (decide later)
Any static host works and most are free:
- **Cloudflare Pages** — connect the GitHub repo, auto-deploys on push (recommended)
- **Netlify** / **Vercel** / **GitHub Pages** — same idea

Keep the domain `tangointegral.com` and add **301 redirects** from the old Wix
URLs so SEO/rankings carry over.

## Roadmap / TODO
- [ ] Lock the design (light vs dark as primary)
- [ ] Build `classes.html` and `contact.html` (need real timetable + prices)
- [ ] Contact form via Formspree / Netlify Forms
- [x] Download & re-host images (now self-hosted in `img/`)
- [x] White/mono logo for dark backgrounds (CSS filter on `indexDark.html`)
- [ ] Connect the milongas widget to the app API (+ Worker proxy if needed)
- [ ] Point "Points of Tango — London" to the real page/URL
- [ ] Migrate blog posts + set 301 redirects
- [ ] Extract shared CSS to `css/styles.css` once design is locked
- [ ] Full redirect map old Wix URLs → new URLs before go-live
