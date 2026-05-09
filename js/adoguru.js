/**
 * アドグル — サイト内ページのみを検索（外部インターネット検索は行わない）
 * public に置き、Vite のビルドで dist にそのままコピーされる。
 */
var INDEX_URL = "../data/search-index.json";

function resolveResultHref(rawUrl) {
  var s = String(rawUrl || "");
  if (!s) return "";
  if (/^(https?:|mailto:|tel:|#)/i.test(s)) return s;
  if (s.startsWith("./") || s.startsWith("../")) return s;
  if (s.startsWith("/")) return ".." + s;
  if (s.startsWith("story/")) return "./" + s.slice("story/".length);
  return "./" + s;
}

function normalizeQuery(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(q) {
  var n = normalizeQuery(q);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

function pageMatches(page, queryNormalized, tokenList) {
  var hay = (page.title + " " + page.searchText).toLowerCase();
  var qLower = queryNormalized.toLowerCase();
  if (tokenList.length <= 1) {
    return hay.indexOf(qLower) !== -1;
  }
  for (var i = 0; i < tokenList.length; i++) {
    if (hay.indexOf(tokenList[i].toLowerCase()) === -1) return false;
  }
  return true;
}

function searchPages(pages, queryRaw) {
  var q = normalizeQuery(queryRaw);
  if (!q) return [];
  var toks = tokens(queryRaw);
  var out = [];
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (pageMatches(p, q, toks)) out.push(p);
  }
  return out;
}

function getState() {
  var params = new URLSearchParams(window.location.search);
  return params.get("q") || "";
}

function setResultsVisible(visible) {
  var home = document.getElementById("adoguru-home");
  var header = document.getElementById("adoguru-header-results");
  var results = document.getElementById("adoguru-results");
  if (home) home.classList.toggle("adoguru-hidden", visible);
  if (header) {
    header.classList.toggle("adoguru-hidden", !visible);
    header.setAttribute("aria-hidden", visible ? "false" : "true");
  }
  if (results) results.classList.toggle("adoguru-hidden", !visible);
}

function renderResults(container, pages, queryDisplay) {
  if (!container) return;
  container.innerHTML = "";
  var countEl = document.getElementById("adoguru-count");
  if (countEl) {
    countEl.textContent =
      pages.length === 0
        ? "該当するページはありません（サイト内のみ検索）"
        : "約 " + pages.length + " 件（サイト内）";
  }
  if (pages.length === 0) {
    var empty = document.createElement("p");
    empty.className = "adoguru-empty";
    empty.textContent =
      "「" +
      queryDisplay +
      "」に一致する記事が見つかりませんでした。別のキーワードを試してください。";
    container.appendChild(empty);
    return;
  }
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    var article = document.createElement("article");
    article.className = "adoguru-result";
    var pathSpan = document.createElement("div");
    pathSpan.className = "adoguru-result-url";
    pathSpan.textContent = String(p.url).replace(/^\//, "");
    var h3 = document.createElement("h3");
    h3.className = "adoguru-result-title";
    var a = document.createElement("a");
    a.href = resolveResultHref(p.url);
    a.textContent = p.title;
    h3.appendChild(a);
    var sn = document.createElement("p");
    sn.className = "adoguru-result-snippet";
    sn.textContent = p.snippet || "";
    article.appendChild(pathSpan);
    article.appendChild(h3);
    article.appendChild(sn);
    container.appendChild(article);
  }
}

function runSearch(allPages, queryRaw, pushUrl) {
  var q = normalizeQuery(queryRaw);
  var inputHome = document.getElementById("adoguru-q-home");
  var inputBar = document.getElementById("adoguru-q-bar");
  if (inputHome) inputHome.value = queryRaw;
  if (inputBar) inputBar.value = queryRaw;

  var hits = searchPages(allPages, queryRaw);
  var hasQuery = q.length > 0;

  setResultsVisible(hasQuery);
  var box = document.getElementById("adoguru-results-inner");
  if (hasQuery) renderResults(box, hits, q);

  if (pushUrl && hasQuery) {
    var url = new URL(window.location.href);
    url.searchParams.set("q", queryRaw);
    window.history.pushState({}, "", url.toString());
  } else if (pushUrl && !hasQuery) {
    var u = new URL(window.location.href);
    u.searchParams.delete("q");
    window.history.pushState({}, "", u.toString());
  }
}

function init() {
  var allPages = [];

  fetch(INDEX_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("index load failed");
      return r.json();
    })
    .then(function (data) {
      allPages = data.pages || [];

      var formHome = document.getElementById("adoguru-form-home");
      var formBar = document.getElementById("adoguru-form-bar");
      var inputHome = document.getElementById("adoguru-q-home");
      var inputBar = document.getElementById("adoguru-q-bar");

      function submit(raw, push) {
        runSearch(allPages, raw, push !== false);
      }

      if (formHome) {
        formHome.addEventListener("submit", function (e) {
          e.preventDefault();
          submit(inputHome ? inputHome.value : "", true);
        });
      }
      if (formBar) {
        formBar.addEventListener("submit", function (e) {
          e.preventDefault();
          submit(inputBar ? inputBar.value : "", true);
        });
      }

      var q0 = getState();
      if (q0) {
        runSearch(allPages, q0, false);
        if (inputHome) inputHome.value = q0;
        if (inputBar) inputBar.value = q0;
      } else {
        setResultsVisible(false);
      }

      window.addEventListener("popstate", function () {
        var q = getState();
        runSearch(allPages, q, false);
      });
    })
    .catch(function (err) {
      console.error(err);
      var box = document.getElementById("adoguru-results-inner");
      if (box) {
        box.innerHTML =
          '<p class="adoguru-empty">検索インデックスを読み込めませんでした。開発サーバーで開いているか確認してください。</p>';
      }
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
