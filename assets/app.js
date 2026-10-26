(function () {
  "use strict";

  var P = window.PUBLICATIONS, TYPES = window.TYPES;
  var LABEL = { pre: "SocArXiv", pub: "Publisher", rep: "Replication materials", cov: "Coverage", lib: "Library", oth: "Link" };
  var state = { type: "all", q: "", data: "", m: "" };
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function url(t) { return /^10\./.test(t) ? "https://doi.org/" + t : t; }

  function pubHtml(p) {
    // Titles ending in "?" take no extra punctuation.
    var end = p.j ? "," : ".";
    // *Asterisks* in a title mark italics, e.g. a journal name.
    var ti = esc(p.ti).replace(/\*([^*]+)\*/g, "<i>$1</i>");
    var s = esc(p.a) + (p.y ? ", " + p.y : "") + ": “" + ti + (/\?$/.test(p.ti) ? "" : end) + "” ";
    if (p.pp) s += esc(p.pp) + " in <i>" + esc(p.j) + "</i>" + (p.d ? ", " + esc(p.d) : "") + ".";
    // Project reports and theses name a project or university, not a journal, so no italics.
    else if (p.j && (p.t === "pr" || p.t === "th")) s += esc(p.j) + (p.d ? " " + esc(p.d) : "") + ".";
    else if (p.j) s += "<i>" + esc(p.j) + "</i>" + (p.d ? " " + esc(p.d) : "") + ".";
    var links = p.l.map(function (l) {
      var label = l[2] || (l[0] === "pub" && p.oa ? "Publisher (open access)" : LABEL[l[0]]);
      return '<a href="' + esc(url(l[1])) + '">' + esc(label) + "</a>";
    }).join(" ");
    return '<p class="pub">' + s +
      (p.n ? ' <span class="note">' + esc(p.n) + "</span>" : "") +
      (links ? '<br><span class="links">' + links + "</span>" : "") + "</p>";
  }

  function matches(p) {
    if (state.type !== "all" && p.t !== state.type) return false;
    if (state.data && (p.data || []).indexOf(state.data) < 0) return false;
    if (state.m && (p.m || []).indexOf(state.m) < 0) return false;
    if (!state.q) return true;
    var hay = [p.a, p.ti.replace(/\*/g, ""),p.j || "", p.y || "", (p.data || []).join(" "), (p.m || []).join(" ")].join(" ").toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  function render() {
    var shown = P.filter(matches), out = "";
    Object.keys(TYPES).forEach(function (k) {
      var items = shown.filter(function (p) { return p.t === k; });
      if (items.length) out += "<h3>" + TYPES[k] + "</h3>" + items.map(pubHtml).join("");
    });
    $("list").innerHTML = out;
    $("empty").hidden = shown.length > 0;
    $("count").textContent = shown.length === P.length ? "" : shown.length + " of " + P.length + " publications";
  }

  // Fill the Data and Method dropdowns, most-used first, with counts.
  function fill(selectId, field) {
    var n = {};
    P.forEach(function (p) { (p[field] || []).forEach(function (t) { n[t] = (n[t] || 0) + 1; }); });
    Object.keys(n).sort(function (a, b) { return n[b] - n[a] || a.localeCompare(b); }).forEach(function (t) {
      var o = document.createElement("option");
      o.value = t; o.textContent = t + " (" + n[t] + ")";
      $(selectId).appendChild(o);
    });
  }
  fill("fdata", "data");
  fill("fmeth", "m");
  $("fdata").addEventListener("change", function (e) { state.data = e.target.value; render(); });
  $("fmeth").addEventListener("change", function (e) { state.m = e.target.value; render(); });

  var tabs = $("tabs");
  tabs.innerHTML = [["all", "All"]].concat(Object.keys(TYPES).map(function (k) { return [k, TYPES[k]]; }))
    .map(function (t) { return '<button type="button" data-type="' + t[0] + '" aria-pressed="' + (t[0] === "all") + '">' + t[1] + "</button>"; })
    .join(" <span>·</span> ");
  tabs.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    state.type = b.dataset.type;
    tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    render();
  });
  $("q").addEventListener("input", function (e) { state.q = e.target.value.trim(); render(); });

  render();
})();
