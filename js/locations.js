(function () {
"use strict";

/* =========================================
   کمک‌کننده امنیتی — جلوگیری از XSS
========================================= */
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================================
Locations Data
========================================= */
const LOCATIONS = window.YACIN_SITE && Array.isArray(window.YACIN_SITE.locations)
  ? window.YACIN_SITE.locations
  : [];

/* =========================================
DOM References
========================================= */
let grid;
let modal;
let modalTitle;
let modalSubtitle;
let gallery;
let closeButton;
let lightbox;
let lightboxObserver;

/* =========================================
Init
========================================= */
function init() {
  if (!LOCATIONS.length) return;

  grid = document.getElementById("locationsGrid");
  if (!grid) return;

  modal = document.getElementById("locModal");
  modalTitle = document.getElementById("locModalTitle");
  modalSubtitle = document.getElementById("locModalSubtitle");
  gallery = document.getElementById("locGallery");
  closeButton = document.getElementById("locModalClose");
  lightbox = document.getElementById("fmLightbox");

  renderLocations();
  bindEvents();
  observeReveals();
}

/* =========================================
Render Location Cards
========================================= */
function renderLocations() {
  grid.innerHTML = "";

  LOCATIONS.forEach(function (location, index) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "location-card reveal";
    card.setAttribute("aria-label", "مشاهده نمونه‌کارهای " + location.title);
    card.setAttribute("data-loc-id", location.id || ("loc-" + index));
    card.style.transitionDelay = (index * 0.06) + "s";

    card.innerHTML = `
      <img src="${escapeHtml(location.cover)}" alt="${escapeHtml(location.title)}" loading="lazy" decoding="async" />
      <div class="location-card__content">
        <span class="location-card__count">
          ${location.works.length} نمونه‌کار
        </span>
        <h3>${escapeHtml(location.title)}</h3>
        <p>${escapeHtml(location.subtitle)}</p>
        <span class="location-card__view">
          مشاهده نمونه‌کارها
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M7 17 17 7"></path>
            <path d="M8 7h9v9"></path>
          </svg>
        </span>
      </div>
    `;

    card.addEventListener("click", function () {
      openLocation(location);
    });

        grid.appendChild(card);
  });

  applyLocationImageSettings();
}

/* ═══ اعمال تنظیم تصویر کاور per-Device ═══ */
function applyLocationImageSettings() {
  var css = "";
  var devices = [
    { key: "desktop", query: "@media (min-width: 1024px)" },
    { key: "tablet", query: "@media (min-width: 640px) and (max-width: 1023px)" },
    { key: "mobile", query: "@media (max-width: 639px)" }
  ];
    LOCATIONS.forEach(function (loc, index) {
    var s = loc.imageSettings;
    if (!s) return;
    var locId = loc.id || ("loc-" + index);
    devices.forEach(function (dv) {
      var st = s[dv.key];
      if (!st) return;
      var transforms = [];
      if (st.rotate) transforms.push("rotate(" + st.rotate + "deg)");
      if (st.flipH) transforms.push("scaleX(-1)");
      if (st.flipV) transforms.push("scaleY(-1)");
      var extra = 1;
      if (st.rotate === 90 || st.rotate === 270) extra = 1.5;
      if (st.zoom && st.zoom > 1) extra *= st.zoom;
      if (extra > 1) transforms.push("scale(" + extra + ")");
            css += dv.query + '{ .location-card[data-loc-id="' + locId + '"] img {' +
        " object-position: " + (st.posX || 50) + "% " + (st.posY || 50) + "%;" +
        (transforms.length ? " transform: " + transforms.join(" ") + ";" : "") +
        " } }";
    });
  });
  var el = document.getElementById("loc-image-settings");
  if (!el) {
    el = document.createElement("style");
    el.id = "loc-image-settings";
    document.head.appendChild(el);
  }
  el.textContent = css;
}
/* =========================================
Open Location Modal
========================================= */
function openLocation(location) {
  if (!modal || !gallery) return;

  modalTitle.textContent = location.title;
  modalSubtitle.textContent = location.subtitle + " • " + location.works.length + " نمونه‌کار";

  gallery.innerHTML = "";

  if (!location.works.length) {
    gallery.innerHTML = `
      <div class="loc-empty">
        هنوز نمونه‌کاری برای این لوکیشن ثبت نشده.
      </div>
    `;
  } else {
    location.works.forEach(function (work) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "loc-work";
      item.setAttribute("aria-label", work.title);

      item.innerHTML = `
        <img src="${escapeHtml(work.image)}" alt="${escapeHtml(work.title)}" loading="lazy" decoding="async" />
        <span class="loc-work__title">${escapeHtml(work.title)}</span>
      `;

      item.addEventListener("click", function () {
        openWorkLightbox(work);
      });

      gallery.appendChild(item);
    });
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setTimeout(function () {
    if (closeButton) closeButton.focus();
  }, 60);
}

/* =========================================
Close Location Modal
========================================= */
function closeLocation() {
  if (!modal) return;
  if (!modal.classList.contains("active")) return;

  if (lightbox && lightbox.classList.contains("active")) {
    lightbox.classList.remove("active");
  }

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* =========================================
Open Lightbox for Work Image
========================================= */
function openWorkLightbox(work) {
  if (!lightbox) return;

  const lightboxImg = document.getElementById("fmLightboxImg");
  const lightboxTitle = document.getElementById("fmLightboxTitle");
  if (!lightboxImg || !lightboxTitle) return;

  lightboxImg.src = work.image;
  lightboxImg.alt = work.title;
  lightboxTitle.textContent = work.title;

  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

/* =========================================
Events
========================================= */
function bindEvents() {
  if (closeButton) {
    closeButton.addEventListener("click", closeLocation);
  }

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeLocation();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (lightbox && lightbox.classList.contains("active")) {
      return;
    }
    closeLocation();
  });

  if (lightbox && window.MutationObserver) {
    lightboxObserver = new MutationObserver(function () {
      const lightboxClosed = !lightbox.classList.contains("active");
      const locationModalOpen = modal && modal.classList.contains("active");
      if (lightboxClosed && locationModalOpen) {
        document.body.style.overflow = "hidden";
      }
    });
    lightboxObserver.observe(lightbox, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
}

/* =========================================
Reveal Observer
========================================= */
function observeReveals() {
  const elements = document.querySelectorAll(".locations .reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach(function (el) {
      el.classList.add("visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

/* =========================================
Start
========================================= */
document.addEventListener("DOMContentLoaded", init);
})();