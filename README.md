# Tango Integral — website

Lightweight, static rebuild of tangointegral.com. No Wix, no build step,
no plugins — just HTML, CSS and a little vanilla JavaScript. Fast, cheap to
host, and easy to keep in version control.

## Pages
| File                    | What it is                                             |
|-------------------------|--------------------------------------------------------|
| `index.html`            | Home — light theme (white, black text, brand accents)  |
| `indexDark.html`        | Home — dark theme variant (violet base). Alternate idea / dark mode |
| `tango-in-london.html`  | "Tango in London" — live milonga listings (Points of Tango) |
| `classes.html`          | Classes — schedule, prices, teachers, venue (live dates)|
| `private-classes.html`  | Private lessons — with Daniel and Eleonora, own form    |
| `method.html`           | Method — the four aspects we teach through              |
| `team.html`             | Team — Daniel, Eleonora, Dana                           |
| `testimonials.html`     | Testimonials — student reviews, quoted verbatim         |
| `contact.html`          | Contact — form and venue                                |
| `buenos-aires-trip.html`| Buenos Aires tango holidays — details + enquiry form    |
| `js/form.js`            | Shared AJAX handling for the three Formspree forms      |
| `js/nav.js`             | Dropdown behaviour for the primary nav                  |
| `data/milongas.json`    | **Orphaned** — the old hand-kept sample data, superseded by the live API. Safe to delete. |
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
gitignored — the versions in `img/` are resized and re-compressed (30 MB → 7 MB).
Regenerate from `.originals/` if you ever need a bigger crop. When you do, cap the
**long** edge and never above the source's own size: `sips -Z` will happily
upscale a small image, which costs bytes and gains nothing.

## Brand palette (from the logo)
- Violet  `#52498D`  — brand
- Turquoise `#66C9C4` — accent
- Coral `#EE7D61` — primary action (added, warm complement)
- Black `#1D1B2E` / White `#FFFFFF`

## The milongas widget (live data)
`tango-in-london.html` lists London milongas from the **Points of Tango API**:

```
https://api.pointsoftango.app/events?country=GBR&region=ENG_GLN
```

It sends CORS headers, so the browser calls it directly — **no Cloudflare Worker
proxy needed** after all. The page links out to Points of Tango in three places:
the button under the heading and the credit under the listings both go to
`pointsoftango.com/events/london`, and the closing band goes to
`pointsoftango.com/home`. Their logo is self-hosted at `img/points-of-tango.png`.

The endpoint returns *every* listed London event: 175 of them, about a year
ahead, in one 424 KB response. The widget filters to a **rolling seven days from
today** — deliberately not the Mon–Sun calendar week, because on a Saturday that
would be five days of events that already happened. When the weekly endpoint
exists, change `CONFIG.source` and nothing else: the filter becomes a no-op.

Four things the widget has to do because of how the data arrives:

- **Times are London wall-clock time encoded as UTC.** `from.seconds` looks like
  a UTC timestamp but already carries the local time, so it is read back with
  `timeZone: "UTC"` and printed as-is. Converting to `Europe/London` shifts every
  listing an hour forward during BST. Verified against the times
  `pointsoftango.com` shows for the same events — Paciencia is 17:30, not 18:30.
- **Some `link` values are bare domains** (`tango-amistoso.co.uk`). Used raw they
  would resolve as a path on this site. `safeUrl()` adds the scheme and accepts
  only http/https — which also throws out `javascript:` URLs, since these are
  third-party strings going into an `href`.
- **18 of 175 records end at `:59`** meaning "on the hour", so end times are
  rounded up for display.
- **17 addresses end in ", Reino Unido"** and a few have doubled spaces; `tidy()`
  strips the country and collapses the whitespace.

Cancelled events are skipped, all text is escaped, and if the API is unreachable
the page says so rather than showing stale or invented listings.

## The forms
Two **Formspree** forms, chosen because they work on any static host (Netlify
Forms would tie us to Netlify). Both deliver to info@tangointegral.com, and each
sets its own `_subject` so trip enquiries don't get lost among general ones:

| Page                     | Form id    | Subject line                          |
|--------------------------|------------|---------------------------------------|
| `contact.html`           | `xkjnzyjv` | New message from tangointegral.com    |
| `buenos-aires-trip.html` | `xrpgljpr` | Buenos Aires trip enquiry             |
| `private-classes.html`   | `mbgjkwgw` | Private lesson request                |

Both share `js/form.js` rather than each carrying its own copy — one behaviour,
one place to fix it. To wire up a new form: point its `action` at the Formspree
endpoint and add `data-ajax`. The script picks it up from there.

We do the AJAX by hand rather than loading `@formspree/ajax` from a CDN: the
whole point of this rebuild is no build step and no third-party scripts, and
`js/form.js` already covers everything the SDK does. It:

- posts with `fetch`, so the visitor never leaves the page (no JS → plain POST to
  Formspree's own thank-you page, which still works);
- puts Formspree's per-field errors under the field they belong to and marks the
  input `aria-invalid`, clearing that error as soon as the visitor edits it;
- falls back to a summary line for errors Formspree sends without a field name,
  so nothing is ever swallowed;
- disables the submit button while in flight and re-enables it on any outcome.

Markup each form needs: a `.form-msg` element for the summary line, one
`<span class="field-err" data-err-for="FIELDNAME">` per field, and a `_gotcha`
honeypot input. `data-success="..."` on the form overrides the thank-you text.

Spam is handled by Formspree's own filter plus the honeypot. The free plan
allows **50 submissions a month across all forms** — worth watching now that
two pages feed it.

## No more free taster
The free-taster offer is gone from the whole site. Every button that used to say
"Book a free taster" now says **"Come to a class"** and still points at
`/contact`, and the home pages lost the "New to tango? Three ways to begin"
section (its three steps opened with the taster). The closing band on the home
pages is now "We dance on Saturdays" instead of "Your first class is on us".

If the offer ever comes back, it needs re-adding in five places per home page:
the nav CTA, the hero CTA, the closing band's heading, its paragraph, and the
meta/OG descriptions.

## What the school actually runs
Small, and worth stating plainly because the whole site is written around it:

- **Group class — two Saturdays a month**, 17:30–19:00, taught by **Dana and Daniel**.
- **The Paciencia milonga**, 19:00–23:00, same room, straight after the class.
- **Private lessons**, 60 minutes, by arrangement, taught by **Daniel and Eleonora**.

Who teaches what matters and is easy to get wrong: Dana teaches the Saturday
class, Eleonora teaches privates, Daniel does both. Pablo and Anna have left the
studio — part of why the timetable shrank — and appear nowhere on the new site.
The old Wix `/private-classes` page still lists all four.

> **Thistle London Bloomsbury Park**, 126 Southampton Row, London WC1B 5AD
> One minute from Russell Square station.

Prices: class £15 · milonga £17 (£15 cash) · both £25. Booking goes through
`pointsoftango.com/event/paciencia/booking`.

**Careful with the venue.** An earlier draft of this site had the class at *The
Bloomsbury Hotel, 16–22 Great Russell Street, WC1B 3NN*. That is a different
hotel and it was wrong — corrected across `contact.html` (card, JSON-LD, footer)
and the other footers. Two of Tango Integral's own sources agree on Southampton
Row: the Wix Paciencia page and the Points of Tango listing.

`classes.html` reads the **next class dates from the Points of Tango API** rather
than hard-coding them — the class and milonga are one listing there
(`domain: "paciencia"`, 17:30–23:00), so the milonga's dates are the class's
dates. This is why: the old Wix timetable still says "July: 4th & 18th". If the
API is unreachable the page still states "two Saturdays a month, 5.30–7pm" and
links out; if no future dates are listed it says they are being confirmed.

A twice-monthly class can't be expressed as `openingHoursSpecification`, so that
claim was removed from the contact page's JSON-LD rather than left saying
"every Saturday".

## Not yet decided
- **Beginners.** Under discussion — a 17:00–18:00 beginners slot with improvers
  after, or a short taster folded into the milonga evening. Nothing is on the
  site until the format is settled. Note that a *free* taster would sit oddly
  next to the site-wide removal of the free-taster offer.
- **Dana's six-week barre cycle** — coming, not yet scheduled or written up.

## The menu
Modelled on the old Wix menu. There is no Home link — the logo does that job,
as it does almost everywhere:

```
About us ▾   Classes ▾   Tango in London   Contact Us   Blog   [ CTA ]
  Team         Group Classes
  Method       Private Classes
  Testimonials
```

The CTA on the right varies by page (Come to a class / Message us / Save my
place), and the home pages also carry the light/dark toggle.

`js/nav.js` handles click, Escape, click-away and mutual exclusion, and adds a
`js` class to `<html>`. **With JavaScript off, CSS still opens the menus on
hover and on keyboard focus** — the `js` class exists to switch those fallbacks
off once the script is in charge, otherwise a click to close would immediately
be undone by the button still being hovered or focused.

Two things it deliberately does not solve:

- **Blog still points at Wix** (`tangointegral.com/blog`) until the blog is
  migrated.
- **There is no mobile menu.** Below the breakpoint the nav links and the
  dropdowns are all hidden and only the CTA remains, so on a phone every page
  except the CTA target is reachable only through the footer. This predates the
  dropdowns; it now matters more.

## A CSS trap worth knowing
Three separate layout bugs on this site had the same cause: **`width` and
`height` attributes on an `<img>` become presentational hints, and those beat
`aspect-ratio` from a stylesheet.** An image sized with `aspect-ratio` therefore
renders at its full attribute height and spills out of its box.

Whenever a rule uses `aspect-ratio` on an image, pair it with `height:auto`
(see the galleries in `buenos-aires-trip.html` and `team.html`). Where the goal
is letterboxing rather than cropping, give the box a fixed height and let the
image fill it with `object-fit:contain` — a percentage `max-height` does not
reliably resolve inside a grid item and will not hold the image in
(`method.html`).

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
- [x] Build `contact.html` (Formspree live)
- [x] Build `buenos-aires-trip.html` (Formspree live)
- [x] Remove the free-taster offer site-wide — the CTA is now "Come to a class"
- [x] Build `classes.html` — real timetable, prices, teachers, live dates
- [x] Build `method.html`, `team.html`, `testimonials.html`, `private-classes.html`
- [ ] Decide the beginners format, then add it to `classes.html`
- [x] Redistribute the main nav — About us and Classes dropdowns
- [ ] Build a mobile menu (nothing but the CTA shows below the breakpoint)
- [ ] `buenos-aires-trip.html` is not in the nav — footer only
- [ ] `tango-in-london.html` has no CTA button in its nav (removed back when
      every "free taster" button went; the CTA now says "Come to a class",
      so it could come back)
- [ ] Bios for Eleonora and Dana (the old Wix team page had none either)
- [ ] Add Dana's barre cycle once dates exist
- [ ] Consider a dedicated Paciencia page (the Wix one has DJ, transport and commuter detail this page only summarises)
- [x] Download & re-host images (now self-hosted in `img/`)
- [x] White/mono logo for dark backgrounds (CSS filter on `indexDark.html`)
- [x] Connect the milongas widget to the Points of Tango API (no proxy needed)
- [ ] Swap `CONFIG.source` for the weekly endpoint once it exists (drops a 424 KB payload)
- [ ] Migrate blog posts + set 301 redirects
- [ ] Extract shared CSS to `css/styles.css` once design is locked
- [ ] Full redirect map old Wix URLs → new URLs before go-live
