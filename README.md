# Tango Integral — website

Lightweight, static rebuild of tangointegral.com. No Wix, no build step,
no plugins — just HTML, CSS and a little vanilla JavaScript. Fast, cheap to
host, and easy to keep in version control.

## Pages
| File                    | What it is                                             |
|-------------------------|--------------------------------------------------------|
| `index.html`            | Home — light theme (white, black text, brand accents)  |
| `tango-in-london.html`  | "Tango in London" — live milonga listings (Points of Tango) |
| `classes.html`          | Classes — schedule, prices, teachers, venue (live dates)|
| `private-classes.html`  | Private lessons — with Daniel and Eleonora, own form    |
| `method.html`           | Method — the four aspects we teach through              |
| `team.html`             | Team — Daniel, Eleonora, Dana                           |
| `testimonials.html`     | Testimonials — student reviews, quoted verbatim         |
| `contact.html`          | Contact — form and venue                                |
| `buenos-aires-trip.html`| Buenos Aires tango holidays — details + enquiry form    |
| `js/form.js`            | Shared AJAX handling for the three Formspree forms      |
| `js/nav.js`             | Nav dropdowns, mobile menu, theme toggle                |
| newsletter              | EmailOctopus embed, on `/contact#newsletter` only       |
| `data/milongas.json`    | **Orphaned** — the old hand-kept sample data, superseded by the live API. Safe to delete. |
| `blog.html`             | Blog index                                              |
| `post/*.html`           | Blog posts — the path is load-bearing, see below        |
| `404.html`              | Not found — also what makes Cloudflare stop soft-404ing  |
| `robots.txt`            | Allow all, points at the sitemap                        |
| `img/icon-*.png`        | Favicons, padded square from the brand symbol           |
| `sitemap.xml`           | The nine real pages                                     |
| `img/`                  | Every image the site uses — self-hosted, no CDN         |

One home page. The sun/moon button in the header switches theme.

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
would be five days of events that already happened.

`tango-in-london.html` already sends **`&offset=0`**, which the API ignores today
and will read as "this week" once the weekly endpoint is live. Nothing needs
changing here when that happens; the client-side filter simply becomes a no-op.

**`classes.html` deliberately does not send `offset`.** It reads the same API for
the next Paciencia dates, and those are often more than a week out — as of
writing, the 5th and the 19th. Paginating a week at a time would hide the second
one. Its contract is the other half of the same statement: without pagination the
API returns everything. If that ever stops being true, the next-dates block on
`classes.html` falls back to "two Saturdays a month" and a link out, so it
degrades rather than breaking — but the dates would quietly disappear.

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
  **£75 teacher's fee, plus a studio fee** of ~£20 near Shepherd's Bush, ~£30
  near Barbican, £20 off-peak / £30 peak near Camden Town. The page presents them
  as two fees, not two payments, and deliberately does not say who is paid: the
  teacher usually books the studio and the student settles once. A student's own
  space or a studio they suggest can be arranged instead. A deposit covering the
  studio fee is taken at booking, because studios often cannot be cancelled at
  short notice and that cost would otherwise fall on the teacher. Discounts exist
  for blocks of more than three lessons.

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

## The Buenos Aires trip
**20–27 March 2027.** The price is settled but deliberately **not published** —
the page asks people to write instead, and the enquiry form's subject line says
`Buenos Aires trip enquiry (Mar 2027)`. If that changes, the number belongs in
the "How much" card on `buenos-aires-trip.html`.

## Not yet decided
- **Beginners.** Under discussion — a 17:00–18:00 beginners slot with improvers
  after, or a short taster folded into the milonga evening. Nothing is on the
  site until the format is settled. Note that a *free* taster would sit oddly
  next to the site-wide removal of the free-taster offer.
- **Dana's six-week barre cycle** — coming, not yet scheduled or written up.
- **More Tango experiences.** The nav group exists for exactly this; Buenos Aires
  is the only one in it so far.

## Dark mode
One set of pages, two palettes. **The theme is not in the URL** — no `/d/classes`
or `indexDark.html`. That would have meant twenty pages to keep in step,
duplicate content for Google, a full reload on every toggle, and a preference
that every internal link had to carry by hand.

Instead every rule is written against CSS custom properties, and only the tokens
change. Three blocks per page:

```
:root{ … }                                     light, and the default
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){ … }         follows the operating system
}
:root[data-theme="dark"]{ … }                  an explicit choice wins
```

Getting there meant tokenising the colours that had been hardcoded across the
pages — `#fff` card backgrounds, the form's success and error colours, input
borders, shadows — into `--card`, `--ok-*`, `--err-*`, `--line-strong` and
`--shadow`. Anything still hardcoded sits on a permanently dark surface (the
hero photo, the violet closing band, the Buenos Aires band) and is meant to stay
white in both themes.

Two details worth keeping:

- **The inline script in each `<head>`** applies the stored theme *before first
  paint*. Without it the page flashes the wrong palette. It is the one script
  that cannot be deferred or external. It also sets the `js` class the nav CSS
  keys off.
- **The first click flips away from the operating system**, not from a default:
  with nothing stored, "currently dark" means the OS says dark, so the toggle has
  to read `prefers-color-scheme` rather than assume light.

`color-scheme` is declared in both themes so scrollbars and native form control
internals follow. The logo is a violet/turquoise PNG, so dark mode filters it to
solid white.

The home page now uses the full-bleed cinematic hero that used to live on
`indexDark.html`; that file is gone (it is in git history). The hero sits on a
dark photo in *both* themes, so its heading and outline button are explicitly
white — otherwise the global heading colour would render dark on dark.

**The hero scrim is tokenised too** (`--hero-1/2/3`, on the home and the Buenos
Aires page). It has to be, because a fixed scrim is wrong in one theme or the
other: the violet-tinted one read as a leftover slab between a white header and a
white page, and a neutral one looks detached above a violet one. Light gets a
neutral near-black and shows more of the photo; dark keeps the violet tint so the
hero joins the page below it.

## The blog
One post, and its URL is the most valuable thing on the site: **~4,375 views**
on Wix, and it is what brings search traffic in.

> `/post/art-of-cabeceo-part-1-by-the-leader`

That path is reproduced exactly — the file lives at
`post/art-of-cabeceo-part-1-by-the-leader.html`, which Cloudflare Pages serves at
the extensionless path. **Do not rename it.** A redirect would work but bleeds a
little authority and costs a round trip; keeping the URL identical costs nothing.

This is also where the root-relative image and script paths pay off: the post
sits a directory deeper than everything else, and `/img/…` and `/js/…` resolve
from there without a single change.

The Wix post had no images of its own — its social image was a YouTube thumbnail
— so it now uses `img/in-class-6.jpg`, a social dance floor, which is where the
cabeceo actually happens. Published and updated dates are preserved in the
`BlogPosting` schema (22 March 2018, updated 8 July 2020).

## Findability
Measured against the deployed site, not assumed.

**Every page already had** a unique title, a meta description, exactly one `h1`,
a canonical, `og:image`, and alt text on every image.

**What was missing, and is now there:**

- **`404.html`.** Cloudflare was answering *every* unknown path — `/robots.txt`,
  `/sitemap.xml`, typos, old Wix URLs — with **the home page at status 200**.
  That is a soft 404, which Google treats as a fault: it can index unlimited junk
  URLs all serving the same content. A real `404.html` makes Pages return a 404.
  **Re-check this after the next deploy** — if unknown paths still return 200, the
  project's not-found handling is set to single-page-application in the Cloudflare
  dashboard and has to be changed there.
- **`robots.txt` and `sitemap.xml`.** Neither existed.
- **Structured data on six more pages.** Only the home and contact had any. Now:
  `Course` with the real £15 price and venue on `/classes`, `Service` on
  `/private-classes`, three `Person` entries on `/team`, `Review` entries on
  `/testimonials`, and a dated `Event` (20–27 March 2027) on
  `/buenos-aires-trip`. They all reference one `@id`,
  `https://www.tangointegral.com/#school`, so search engines and language models
  read them as one organisation rather than seven unrelated pages.

**Still open:**

- Canonicals point at `www.tangointegral.com`, which today serves Wix. That is
  protective while the site lives on `pages.dev` — it keeps the preview domain
  out of the index — but it is only correct once the domain is switched.
- Nothing links to the new site yet. For both search engines and AI assistants,
  being cited elsewhere matters more than anything on the page: the Points of
  Tango listing, Instagram, Facebook and Google Business Profile should point at
  the real domain once it is live.
- No Google Business Profile connection is claimed in the markup. For "tango
  classes near me" that profile matters more than the site.

## The menu
Modelled on the old Wix menu. There is no Home link — the logo does that job,
as it does almost everywhere:

```
About us ▾   Classes ▾   Tango experiences ▾   Tango in London   Contact Us   Blog   [ CTA ]
  Team         Group Classes     Buenos Aires trip
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

Below **1000px** the whole nav is replaced by a hamburger and a drop-down panel.
1000 is measured, not guessed: the six items need about 997px to sit on one line
beside the logo, and below that they wrap into an ugly two-line header.

**`js/nav.js` builds that panel from the desktop nav rather than from markup in
the page.** Ten pages each carry their own header, so a hand-written mobile menu
would be a tenth chance to drift every time a nav item changes — and every nav
change so far has meant editing all ten files. Reading `.nav` means the two can
not disagree. The dropdown groups become labelled sections rather than nested
accordions: nine destinations do not deserve a second tap. The CTA stays in the
header; the light/dark toggle moves into the panel, where there is room for it.

Still open: **Blog points at Wix** (`tangointegral.com/blog`) until the blog is
migrated. With JavaScript off there is no mobile menu at all — the footer
carries the full sitemap, which is the fallback.

## The newsletter
Signups go straight into **EmailOctopus**, so consent and unsubscribe are handled
there rather than by hand. Copying addresses out of an inbox does not scale and
loses the consent record, which matters under UK GDPR/PECR.

EmailOctopus only offers a **JavaScript embed** — there is no plain-HTML option.
It posts to `https://eocampaign1.com/form/55e9988c-…` with `field_0` (email),
`field_1`, `field_2`, a `consent` checkbox and a honeypot.

**The captcha is turned off in the EmailOctopus form settings, and that is what
makes the footer placement acceptable.** With it on, the widget pulls in Google
reCAPTCHA — `recaptcha/api.js`, a gstatic script and two iframes — on every page
carrying the form, which is what would force a cookie banner. With it off:
verified no Google scripts, no iframes and **no cookies at all**. Spam is held
off by the honeypot plus EmailOctopus's double opt-in, so a bot signup never
becomes a confirmed subscriber. If spam ever does become a problem, turning the
captcha back on means moving the embed off the footer again.

**A trap when testing this:** the bundle *contains* the reCAPTCHA code either
way and only activates it from config, and the browser caches the script hard.
A stale copy will keep loading reCAPTCHA long after the setting changed. Test
with a cache-busting query string on the script URL, or you will be reading the
old behaviour.

A few `!important` overrides pull the widget's typography and controls into line.
The fields shown are whatever the EmailOctopus form is set to; trimming it to
email only is a change there, not here, and fewer fields means more signups.

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
- [x] Dark mode — one set of pages, tokens swapped by `data-theme`
- [x] Build `contact.html` (Formspree live)
- [x] Build `buenos-aires-trip.html` (Formspree live)
- [x] Remove the free-taster offer site-wide — the CTA is now "Come to a class"
- [x] Build `classes.html` — real timetable, prices, teachers, live dates
- [x] Build `method.html`, `team.html`, `testimonials.html`, `private-classes.html`
- [ ] Decide the beginners format, then add it to `classes.html`
- [x] Redistribute the main nav — About us / Classes / Tango experiences
- [x] Mobile menu — hamburger panel, generated from the desktop nav
- [x] Bio for Eleonora
- [ ] Bio for Dana — still the one-line placeholder, and now visibly shorter
      than Eleonora's on `/team`
- [ ] Add Dana's barre cycle — coming in a few days
- [ ] Consider a dedicated Paciencia page (the Wix one has DJ, transport and commuter detail this page only summarises)
- [x] Download & re-host images (now self-hosted in `img/`)
- [x] White/mono logo for dark backgrounds (CSS filter on `indexDark.html`)
- [x] Connect the milongas widget to the Points of Tango API (no proxy needed)
- [x] Prepare for the weekly endpoint (`&offset=0` on tango-in-london; classes
      stays unpaginated on purpose) — verify both pages the day it goes live
- [ ] Replace the EmailOctopus embed with our own form posting through a
      Cloudflare Pages Function, with the API key as an env var. That drops the
      third-party script and Google reCAPTCHA entirely and lets the form live in
      the footer again. Verify EmailOctopus's current API before starting.
- [ ] Migrate blog posts + set 301 redirects
- [ ] `_redirects` should include `/indexDark` and `/indexDark.html` -> `/`
      (Cloudflare currently answers those with the home page at 200)
- [ ] Extract shared CSS to `css/styles.css` once design is locked
- [ ] Full redirect map old Wix URLs → new URLs before go-live
