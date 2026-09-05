/* Shared AJAX handling for the site's Formspree forms.
 *
 * Add data-ajax to a <form> that posts to Formspree and this wires it up:
 * it submits with fetch so the visitor never leaves the page, shows Formspree's
 * per-field errors next to the field they belong to, and disables the submit
 * button while the request is in flight.
 *
 * Expected markup inside the form:
 *   <span class="field-err" data-err-for="NAME"></span>   one per field, optional
 *   <p class="form-msg" role="status" hidden></p>         the summary line
 *   <button type="submit">                                 the submit button
 *
 * Optional attribute:
 *   data-success="..."   overrides the thank-you text
 *
 * With JavaScript off none of this runs and the form posts to Formspree the
 * ordinary way, landing on Formspree's own thank-you page. That still works.
 */
(function () {
  var FALLBACK = "info@tangointegral.com";
  var DEFAULT_SUCCESS = "Thanks — your message is on its way. We'll reply within a day.";

  function setup(form) {
    var msg = form.querySelector(".form-msg");
    var slots = form.querySelectorAll(".field-err");
    if (!msg) return;

    function say(text, ok) {
      msg.textContent = text;
      msg.className = "form-msg " + (ok ? "ok" : "bad");
      msg.hidden = false;
    }

    function clearErrors() {
      msg.hidden = true;
      Array.prototype.forEach.call(slots, function (slot) {
        slot.textContent = "";
        var input = form.elements[slot.dataset.errFor];
        if (input) input.removeAttribute("aria-invalid");
      });
    }

    /* Formspree answers a rejected submission with
       { errors: [ { field: "email", message: "…" }, … ] }.
       Errors carrying a field name go next to that input; the rest go to the
       summary line, so nothing is ever swallowed. True if any were shown. */
    function showErrors(errors) {
      var placed = false;
      var leftovers = [];
      errors.forEach(function (err) {
        var slot = err.field && form.querySelector('[data-err-for="' + err.field + '"]');
        if (!slot) { leftovers.push(err.message); return; }
        slot.textContent = err.message;
        var input = form.elements[err.field];
        if (input) input.setAttribute("aria-invalid", "true");
        placed = true;
      });
      if (leftovers.length) {
        say(leftovers.join(" ") + " — please email " + FALLBACK + " if this keeps happening.", false);
      } else if (placed) {
        say("Please check the highlighted fields and try again.", false);
      }
      return placed || leftovers.length > 0;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      clearErrors();

      try {
        var res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          form.reset();
          say(form.dataset.success || DEFAULT_SUCCESS, true);
        } else {
          var data = await res.json().catch(function () { return null; });
          var errors = data && Array.isArray(data.errors) ? data.errors : [];
          if (!errors.length || !showErrors(errors)) {
            say("Something went wrong. Please email " + FALLBACK + " instead.", false);
          }
        }
      } catch (err) {
        say("We couldn't send that — check your connection, or email " + FALLBACK + ".", false);
      } finally {
        if (button) button.disabled = false;
      }
    });

    // Clear a field's error as soon as the visitor starts fixing it.
    form.addEventListener("input", function (e) {
      var slot = form.querySelector('[data-err-for="' + e.target.name + '"]');
      if (slot && slot.textContent) {
        slot.textContent = "";
        e.target.removeAttribute("aria-invalid");
      }
    });
  }

  document.querySelectorAll("form[data-ajax]").forEach(setup);
})();
