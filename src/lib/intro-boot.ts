/**
 * The first script on every page. It runs before anything else loads, so the intro can start, be
 * skipped, and finish even when the rest of the page is slow or never runs at all.
 *
 * Plain ES5 on purpose: it must work in the oldest web view that can open the app.
 */
export const INTRO_BOOT_SCRIPT = `(function () {
  var h = document.documentElement;
  var path = location.pathname;

  /* Lite mode: the person's own choice, else a guess for older or data-saving phones. */
  var lite = null;
  try {
    var saved = localStorage.getItem("kp:lite:v1");
    if (saved === "true") lite = true;
    else if (saved === "false") lite = false;
  } catch (e) {}
  if (lite === null) {
    try {
      var net = navigator.connection;
      lite = !!(
        (net && net.saveData) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
        !(window.CSS && CSS.supports && CSS.supports("height", "1dvh"))
      );
    } catch (e) {
      lite = false;
    }
  }
  if (lite) h.setAttribute("data-lite", "");

  var app = false;
  try {
    var cap = window.Capacitor;
    app =
      /PhilatrailApp/.test(navigator.userAgent) ||
      !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  } catch (e) {}
  /* The page's own code reads this: it may not be able to ask Capacitor directly. */
  window.__kpApp = app;

  /* In the app, if the tour's own code never starts, open the map rather than leave someone waiting. */
  if (path === "/welcome") {
    if (app)
      setTimeout(function () {
        if (!window.__kpTourAlive) location.replace("/explore");
      }, 10000);
    return;
  }
  if (path !== "/") return;

  var onboarded = false;
  var tour = false;
  try {
    onboarded = localStorage.getItem("kp:onboarded:v1") === "true";
    tour = location.search.indexOf("tour") > -1;
  } catch (e) {}

  /* Someone who has already been through the tour goes straight to the map. */
  if (app && onboarded && !tour) {
    h.setAttribute("data-intro-seen", "");
    window.__kpIntroPlayed = true;
    location.replace("/explore");
    return;
  }

  var done = false;
  function finish() {
    if (done) return;
    done = true;
    window.__kpIntroPlayed = true;
    if (app) {
      location.replace("/welcome");
      return;
    }
    h.setAttribute("data-intro-seen", "");
  }
  window.__kpIntroFinish = finish;

  var quiet = false;
  try {
    quiet =
      !!window.matchMedia &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}
  var skipped = false;
  try {
    skipped = /(?:^|; )kp_skip_intro=1/.test(document.cookie);
  } catch (e) {}

  /* No intro in Lite mode, with reduced motion, or just after signing in. */
  if (lite || quiet || skipped) {
    finish();
    return;
  }

  /* Start the clock and the CSS timeline now, before the page's own code has loaded. */
  window.__kpIntroT0 = performance.now();
  h.setAttribute("data-intro-go", "");

  /* Skip works from the first moment, not only once the page's code is ready. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest(".kpl-skip")) finish();
  });

  /* The intro ends on its own: 3.5s of travel plus the 1.3s split, then a last resort. */
  setTimeout(finish, 4900);
  setTimeout(finish, 9000);
})()`;
