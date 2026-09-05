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
