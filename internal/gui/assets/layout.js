// Run at the start of the body, before any UI can paint. app.js may still
// be downloading when the header appears, so its layout must already match
// the browser, desktop window or tray panel.
(function () {
  var mode = new URLSearchParams(location.search).get("mode") || "window";
  var web = !!(window.bootPrefs && window.bootPrefs.web);
  document.body.classList.add(mode);
  if (web) document.body.classList.add("web");
  var tabs = "both";
  try { tabs = localStorage.getItem("magpie.topTabs") || tabs; } catch { /* this window only */ }
  document.body.dataset.topTabs = ["icons", "text", "both"].includes(tabs) ? tabs : "both";
  // Preserve the existing iOS viewport policy before app.js runs.
  if (web && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))) {
    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover");
  }
  if (!web && /^Mac/.test(navigator.platform)) document.body.classList.add("mac");
  if (!web && /^Linux/.test(navigator.platform)) document.body.classList.add("linux");
  if (/^Win/.test(navigator.platform)) document.documentElement.classList.add("win");
})();

// Like the sidebar choice, this belongs to this browser or desktop webview.
function setTopTabs(value) {
  if (!["icons", "text", "both"].includes(value)) return;
  document.body.dataset.topTabs = value;
  try { localStorage.setItem("magpie.topTabs", value); } catch { /* this window only */ }
  fitTop();
  const nav = document.querySelector("#nav");
  if (nav && !sideNav()) { slide(nav, "nav"); navInSight(); }
}
