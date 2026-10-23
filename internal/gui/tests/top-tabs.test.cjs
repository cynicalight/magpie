// No browser required: the preference must be restored before the UI paints,
// survive a reload, and remain usable when storage is unavailable.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const source = fs.readFileSync(path.join(__dirname, "../assets/layout.js"), "utf8");

function windowWith(store = new Map(), { blocked = false, side = false, panel = false } = {}) {
  const body = { dataset: {}, classList: { add() {} } };
  const calls = [];
  const nav = panel ? null : {};
  const context = vm.createContext({
    URLSearchParams, location: { search: panel ? "?mode=panel" : "" },
    navigator: { platform: "Linux", userAgent: "", maxTouchPoints: 0 },
    window: { bootPrefs: { web: true } },
    document: { body, documentElement: { classList: { add() {} } }, querySelector: () => nav },
    localStorage: {
      getItem(key) { if (blocked) throw new Error("storage blocked"); return store.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error("storage blocked"); store.set(key, value); },
    },
    fitTop() { calls.push("fit"); }, sideNav: () => side,
    slide(box, key) { assert.equal(box, nav); assert.equal(key, "nav"); calls.push("selection"); },
    navInSight() { calls.push("visible"); },
  });
  vm.runInContext(source, context);
  return { body, calls, pick: (value) => context.setTopTabs(value) };
}

test("top tabs default to icons and text before paint, including invalid stored values", () => {
  for (const value of [undefined, "", "unexpected"]) {
    const store = new Map(value === undefined ? [] : [["magpie.topTabs", value]]);
    assert.equal(windowWith(store).body.dataset.topTabs, "both");
    assert.equal(store.get("magpie.topTabs"), value, "a read must not overwrite storage");
  }
});

test("each display choice applies immediately and survives a new document", () => {
  const store = new Map();
  const page = windowWith(store);
  for (const value of ["icons", "text", "both"]) {
    page.pick(value);
    assert.equal(page.body.dataset.topTabs, value);
    assert.equal(windowWith(store).body.dataset.topTabs, value);
  }
  assert.deepEqual(page.calls, Array(3).fill(["fit", "selection", "visible"]).flat());
});

test("blocked storage still allows this document's display to change", () => {
  const page = windowWith(new Map(), { blocked: true });
  assert.equal(page.body.dataset.topTabs, "both");
  page.pick("icons");
  assert.equal(page.body.dataset.topTabs, "icons");
});

test("a sidebar or tray panel does not gain a top navigation selection indicator", () => {
  for (const options of [{ side: true }, { panel: true }]) {
    const page = windowWith(new Map(), options);
    page.pick("text");
    assert.deepEqual(page.calls, ["fit"]);
  }
});

test("an invalid choice preserves the current setting", () => {
  const store = new Map([["magpie.topTabs", "text"]]);
  const page = windowWith(store);
  page.pick("unknown");
  assert.equal(page.body.dataset.topTabs, "text");
  assert.equal(store.get("magpie.topTabs"), "text");
  assert.deepEqual(page.calls, []);
});
