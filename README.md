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

The two home pages link to each other via the ◐ / ◑ toggle in the header.

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
Because pages are self-contained, you can just open `index.html` in a browser.
For anything that fetches files (e.g. once `CONFIG.source` points to the JSON),
run a local server so `fetch` works:
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
- [ ] Download & re-host images (currently loaded from Wix CDN)
- [ ] White/mono logo for dark backgrounds
- [ ] Connect the milongas widget to the app API (+ Worker proxy if needed)
- [ ] Point "Points of Tango — London" to the real page/URL
- [ ] Migrate blog posts + set 301 redirects
- [ ] Extract shared CSS to `css/styles.css` once design is locked
- [ ] Full redirect map old Wix URLs → new URLs before go-live
