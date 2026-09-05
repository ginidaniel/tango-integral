/* Dropdown menus in the primary nav.
 *
 * Markup (see any page's <nav>):
 *   <div class="has-menu">
 *     <button class="menu-trigger" aria-expanded="false" aria-controls="x-menu">…</button>
 *     <ul class="menu" id="x-menu"> … </ul>
 *   </div>
 *
 * Without JavaScript the CSS opens a menu on hover and on keyboard focus, so
 * the nav still works. This file adds the `js` class to <html>, which switches
 * those CSS fallbacks off and makes `aria-expanded` the single source of truth —
 * otherwise a click to close would be undone by the button still being hovered
 * or focused, and the caret would point the wrong way.
 *
 * Closing on mouseleave is delayed by CLOSE_DELAY. The panel sits a little below
 * the trigger, and even with the CSS bridge covering that gap, people leave the
 * button diagonally and clip a corner on the way down. Closing instantly makes
 * the menu impossible to click.
 */
(function () {
  document.documentElement.classList.add("js");

  var CLOSE_DELAY = 280; // ms

  var groups = Array.prototype.slice
    .call(document.querySelectorAll(".has-menu"))
    .map(function (root) {
      return {
        root: root,
        trigger: root.querySelector(".menu-trigger"),
        menu: root.querySelector(".menu"),
        timer: null
      };
    })
    .filter(function (g) { return g.trigger && g.menu; });

  if (!groups.length) return;

  var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;

  function isOpen(g) { return g.trigger.getAttribute("aria-expanded") === "true"; }
  function cancelClose(g) {
    if (g.timer) { clearTimeout(g.timer); g.timer = null; }
  }
  function open(g) { cancelClose(g); g.trigger.setAttribute("aria-expanded", "true"); }
  function close(g) { cancelClose(g); g.trigger.setAttribute("aria-expanded", "false"); }
  function closeSoon(g) {
    cancelClose(g);
    g.timer = setTimeout(function () { close(g); }, CLOSE_DELAY);
  }
  function closeAll(except) {
    groups.forEach(function (g) { if (g !== except) close(g); });
  }

  groups.forEach(function (g) {
    g.trigger.addEventListener("click", function (e) {
      e.preventDefault();
      var wasOpen = isOpen(g);
      closeAll(g);
      if (wasOpen) { close(g); } else { open(g); }
    });

    // Pointer: open on the way in, close shortly after leaving. Skipped on
    // touch, where a tap would otherwise both open (enter) and toggle (click).
    if (canHover) {
      g.root.addEventListener("mouseenter", function () { closeAll(g); open(g); });
      g.root.addEventListener("mouseleave", function () { closeSoon(g); });
    }

    // Keyboard: tabbing in opens, tabbing out closes, Escape closes.
    g.root.addEventListener("focusin", function () { closeAll(g); open(g); });
    g.root.addEventListener("focusout", function (e) {
      if (!g.root.contains(e.relatedTarget)) close(g);
    });
    g.root.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen(g)) {
        close(g);
        g.trigger.focus();
      }
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".has-menu")) closeAll();
  });
})();

/* Mobile menu.
 *
 * The panel is BUILT FROM the desktop nav rather than duplicated in the markup.
 * Ten pages each carry their own copy of the header, so a hand-written mobile
 * menu would be a tenth chance to drift every time a nav item changes — which
 * has already happened once per nav edit. Reading `.nav` means the two can't
 * disagree, and adding a link anywhere updates both.
 *
 * The dropdown groups are flattened into labelled sections instead of nested
 * accordions: there are only nine destinations, and hiding them behind a second
 * tap buys nothing.
 */
(function () {
  var BREAKPOINT = 1000;   // must match the media query in each page's CSS

  var head = document.querySelector(".site-head");
  var nav = head && head.querySelector(".nav");
  if (!head || !nav) return;
  if (head.querySelector(".site-menu")) return;   // already built

  function copyLink(a) {
    var c = document.createElement("a");
    c.href = a.getAttribute("href");
    c.textContent = a.textContent.trim();
    if (a.hasAttribute("aria-current")) c.setAttribute("aria-current", a.getAttribute("aria-current"));
    if (a.hasAttribute("target")) { c.target = a.getAttribute("target"); c.rel = "noopener"; }
    return c;
  }

  var panel = document.createElement("nav");
  panel.className = "site-menu";
  panel.id = "site-menu";
  panel.setAttribute("aria-label", "Menu");

  Array.prototype.forEach.call(nav.children, function (item) {
    if (item.classList.contains("has-menu")) {
      var trigger = item.querySelector(".menu-trigger");
      var group = document.createElement("div");
      group.className = "sm-group";
      var label = document.createElement("p");
      label.className = "sm-label";
      label.textContent = trigger ? trigger.textContent.trim() : "";
      group.appendChild(label);
      Array.prototype.forEach.call(item.querySelectorAll(".menu a"), function (a) {
        group.appendChild(copyLink(a));
      });
      panel.appendChild(group);
    } else if (item.classList.contains("nav-link")) {
      var link = copyLink(item);
      link.className = "sm-top";
      panel.appendChild(link);
    }
    // The CTA and the theme toggle are left out on purpose: both stay visible
    // in the header, where they are small enough to sit beside the hamburger.
  });

  if (!panel.children.length) return;
  head.appendChild(panel);

  var toggle = document.createElement("button");
  toggle.className = "menu-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "site-menu");
  toggle.setAttribute("aria-label", "Menu");
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path class="ic-open" d="M3 6h18M3 12h18M3 18h18"/>' +
    '<path class="ic-close" d="M5 5l14 14M19 5L5 19"/></svg>';
  nav.appendChild(toggle);

  function openMenu()  { panel.classList.add("is-open");  toggle.setAttribute("aria-expanded", "true"); }
  function closeMenu() { panel.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }

  toggle.addEventListener("click", function () {
    if (toggle.getAttribute("aria-expanded") === "true") closeMenu(); else openMenu();
  });

  panel.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  });

  document.addEventListener("click", function (e) {
    if (!head.contains(e.target)) closeMenu();
  });

  // Leaving the panel open while the layout switches back to the desktop nav
  // would strand it on screen, since it is only styled below the breakpoint.
  window.addEventListener("resize", function () {
    if (window.innerWidth > BREAKPOINT) closeMenu();
  });
})();

/* Theme toggle.
 *
 * The stored choice is applied by the inline script in each page's <head>, which
 * has to run before first paint. This only handles the click.
 *
 * "Currently dark" is not simply the presence of data-theme: with no stored
 * choice the page follows the operating system, so the first click has to flip
 * away from whatever the OS is showing, not from a default.
 */
(function () {
  var btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var root = document.documentElement;
    var set = root.getAttribute("data-theme");
    var dark = set === "dark" || (!set &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var next = dark ? "light" : "dark";

    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
})();
