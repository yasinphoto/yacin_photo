/* ═══ فیلتر دسته‌بندی نمونه‌کارها — نرم و بدون رفرش ═══ */
(function () {
  var site = window.YACIN_SITE;
  if (!site || !Array.isArray(site.categories) || !site.categories.length) return;

  var ALL_WORKS = Array.isArray(site.works) ? site.works.slice() : [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // خواندن فیلتر از URL (اگر کسی لینک فیلترشده را به اشتراک بگذارد)
  // فیلتر پیش‌فرض همیشه روی «همه» است
var current = "all";

  // بازسازی گالری با استفاده از rebuild اختصاصی Formation
  function rebuildGallery(cat) {
    // اعمال فیلتر روی داده زنده
    if (cat === "all") {
      site.works = ALL_WORKS.slice();
    } else {
      site.works = ALL_WORKS.filter(function (w) { return w.category === cat; });
    }

    // صدا زدن rebuild
    if (typeof window.rebuildFormation === "function") {
      window.rebuildFormation();
    } else if (window.fmInstance && typeof window.fmInstance.rebuild === "function") {
      window.fmInstance.rebuild();
    }

    // اسکرول نرم به بخش نمونه‌کارها
    var sec = document.getElementById("portfolio");
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildBar() {
    var wrapper = document.querySelector(".fm-wrapper");
    if (!wrapper || document.getElementById("portfolioFilters")) return;

    var counts = { all: ALL_WORKS.length };
    site.categories.forEach(function (c) {
      counts[c.id] = ALL_WORKS.filter(function (w) { return w.category === c.id; }).length;
    });

    var bar = document.createElement("div");
    bar.className = "portfolio-filters";
    bar.id = "portfolioFilters";

    bar.innerHTML =
      '<button type="button" class="filter-btn' + (current === "all" ? " active" : "") + '" data-cat="all">همه (' + counts.all + ')</button>' +
      site.categories.map(function (c) {
        return '<button type="button" class="filter-btn' + (current === c.id ? " active" : "") + '" data-cat="' + esc(c.id) + '">' +
          (c.icon ? esc(c.icon) + " " : "") + esc(c.name) + " (" + (counts[c.id] || 0) + ")</button>";
      }).join("");

    wrapper.parentNode.insertBefore(bar, wrapper);

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      var cat = btn.dataset.cat;
      if (cat === current) return;
      current = cat;

      bar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.cat === cat);
      });

      rebuildGallery(cat);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBar);
  } else {
    buildBar();
  }

  // اگر با فیلتر URL باز شد، یک بار rebuild کن
  if (current !== "all") {
    window.addEventListener("load", function () {
      setTimeout(function () { rebuildGallery(current); }, 100);
    });
  }
})();