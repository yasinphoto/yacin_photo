(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function warn(message) {
    if (window.console && console.warn) {
      console.warn("[Yacin Renderer]", message);
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value, fallback) {
  var v = String(value == null ? "" : value).trim();
  if (!v) return fallback || "#";
  if (/^(https?:|mailto:|tel:|sms:)/i.test(v)) return v;
  if (v.charAt(0) === "#" || v.charAt(0) === "/") return v;
  return fallback || "#";
}

function applyHeroImageSettings(settings) {
  if (!settings) return;
  var css = "";
  var devices = [
    { key: "desktop", query: null },
    { key: "tablet", query: "@media (min-width: 640px) and (max-width: 1023px)" },
    { key: "mobile", query: "@media (max-width: 639px)" }
  ];

  devices.forEach(function (device) {
    var s = settings[device.key];
    if (!s) return;

    var transforms = [];
    if (s.rotate) transforms.push("rotate(" + s.rotate + "deg)");
    if (s.flipH) transforms.push("scaleX(-1)");
    if (s.flipV) transforms.push("scaleY(-1)");

    var extraScale = 1;
    if (s.rotate === 90 || s.rotate === 270) extraScale = 1.5;
    if (s.zoom && s.zoom > 1) extraScale *= s.zoom;
    if (extraScale > 1) transforms.push("scale(" + extraScale + ")");

    var rules = ".hero-media img {";
    rules += " object-position: " + (s.posX || 50) + "% " + (s.posY || 50) + "%;";
    if (transforms.length) rules += " transform: " + transforms.join(" ") + ";";
    rules += " }";

    if (device.query) {
      css += device.query + " { " + rules + " }";
    } else {
      css += rules;
    }
  });

  var styleEl = document.getElementById("hero-image-settings");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "hero-image-settings";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

  function setText(selector, value) {
    var el = $(selector);
    if (!el) {
      warn("Element not found: " + selector);
      return;
    }
    if (value != null) el.textContent = value;
  }

  function setHTML(selector, value) {
    var el = $(selector);
    if (!el) {
      warn("Element not found: " + selector);
      return;
    }
    if (value != null) el.innerHTML = value;
  }

  function setAttr(selector, attr, value) {
    var el = $(selector);
    if (!el) return;
    if (value != null) el.setAttribute(attr, value);
  }

  function setSrc(selector, value, eager) {
  var el = $(selector);
  if (!el) {
    warn("Image element not found: " + selector);
    return;
  }
  if (!value) return;
  if (eager) {
    el.setAttribute("loading", "eager");
    el.setAttribute("fetchpriority", "high");
  } else {
    el.setAttribute("loading", "lazy");
    el.setAttribute("decoding", "async");
  }
  el.src = value;
}

  function setHref(selector, value) {
    var el = $(selector);
    if (!el) return;
    if (value) el.href = value;
  }

  function applySite(data) {
    if (!data) {
      warn("No site data found. Is js/site-content.js loaded before renderer.js?");
      return;
    }

    /* =========================
       SITE SETTINGS
    ========================= */
    if (data.site) {
      if (data.site.title) document.title = data.site.title;

      var metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && data.site.description) {
        metaDescription.setAttribute("content", data.site.description);
      }

      setHref(".fab-whatsapp", "https://wa.me/" + encodeURIComponent(data.site.whatsapp || ""));
      setHref(".fab-instagram", "https://instagram.com/" + encodeURIComponent(data.site.instagram || ""));
      setHref(".fab-telegram", "https://t.me/" + encodeURIComponent(data.site.telegram || ""));
    }

    /* =========================
       HERO
    ========================= */
    if (data.hero) {
      setSrc(".hero-media img", data.hero.image, true);
         if (data.hero.imageSettings) {
     applyHeroImageSettings(data.hero.imageSettings);
   }
      setText(".hero-tag", data.hero.tag);

      var heroTitle = $(".hero h1");
      if (heroTitle) {
        heroTitle.innerHTML =
          escapeHtml(data.hero.titleLine1 || "") +
          "<br>" +
          escapeHtml(data.hero.titleLine2 || "");
      } else {
        warn("Hero title not found: .hero h1");
      }

      setText(".hero-text", data.hero.text);

      var primaryBtn = $(".hero-actions .btn-primary");
      if (primaryBtn) {
        if (data.hero.primaryText) primaryBtn.textContent = data.hero.primaryText;
             if (data.hero.primaryHref) primaryBtn.setAttribute("href", safeUrl(data.hero.primaryHref, "#portfolio"));
      }

      var secondaryBtn = $(".hero-actions .btn-outline");
      if (secondaryBtn) {
        if (data.hero.secondaryText) secondaryBtn.textContent = data.hero.secondaryText;
             if (data.hero.secondaryHref) secondaryBtn.setAttribute("href", safeUrl(data.hero.secondaryHref, "#instagram"));
      }
    }

    /* =========================
       SERVICES
    ========================= */
    if (Array.isArray(data.services)) {
      var servicesGrid = $("#servicesGrid");
      if (!servicesGrid) {
        warn("#servicesGrid not found. Add id=\"servicesGrid\" to .services-grid");
      } else {
        servicesGrid.innerHTML = data.services.map(function (service) {
          return (
            '<article class="service-card reveal visible">' +
              '<div class="service-icon">' + escapeHtml(service.icon) + "</div>" +
              "<h3>" + escapeHtml(service.title) + "</h3>" +
              "<p>" + escapeHtml(service.text) + "</p>" +
            "</article>"
          );
        }).join("");
      }
    }

    /* =========================
       ABOUT
    ========================= */
    if (data.about) {
      setSrc("#aboutImage", data.about.image);
      setText("#aboutTitle", data.about.title);
      setText("#aboutText1", data.about.text1);
      setText("#aboutText2", data.about.text2);

      var statsGrid = $("#aboutStats");
      if (!statsGrid) {
        warn("#aboutStats not found. Add id=\"aboutStats\" to .about-stats");
      } else if (Array.isArray(data.about.stats)) {
        statsGrid.innerHTML = data.about.stats.map(function (stat) {
          return (
            '<div class="stat-box">' +
              "<strong>" + escapeHtml(stat.value) + "</strong>" +
              "<span>" + escapeHtml(stat.label) + "</span>" +
            "</div>"
          );
        }).join("");
      }
    }

    /* =========================
       INSTAGRAM
    ========================= */
    if (Array.isArray(data.instagram)) {
      var instagramGrid = $("#instagramGrid");
      if (!instagramGrid) {
        warn("#instagramGrid not found. Add id=\"instagramGrid\" to .instagram-grid");
      } else {
        instagramGrid.innerHTML = data.instagram.map(function (item) {
          return (
                     '<a class="insta-item" href="' + escapeHtml(safeUrl(item.href, "https://instagram.com/yacin_photo")) + '" target="_blank" rel="noopener">' +
              '<img src="' + escapeHtml(item.image) + '" alt="پست اینستاگرام یاسین فوتو" loading="lazy" decoding="async" />' +
            "</a>"
          );
        }).join("");
      }
    }

    /* =========================
       CONTACT
    ========================= */
    if (data.contact) {
      setText("#contactTitle", data.contact.title);
      setText("#contactSubtitle", data.contact.subtitle);

      var contactInfo = $("#contactInfo");
      if (!contactInfo) {
        warn("#contactInfo not found. Add id=\"contactInfo\" to .contact-info");
      } else if (Array.isArray(data.contact.info)) {
        contactInfo.innerHTML = data.contact.info.map(function (item) {
                 var url = safeUrl(item.href, "");
       var isExternal = /^https?:/i.test(url);
       var valueHtml;
       if (url) {
         valueHtml =
           '<a href="' + escapeHtml(url) + '"' +
              (isExternal ? ' target="_blank" rel="noopener"' : "") +
              ">" + escapeHtml(item.value) + "</a>";
          } else {
            valueHtml = "<p>" + escapeHtml(item.value) + "</p>";
          }

          return (
            '<div class="contact-item">' +
              "<span>" + escapeHtml(item.label) + "</span>" +
              valueHtml +
            "</div>"
          );
        }).join("");
      }
    }
  }

  function refreshReveals() {
    var elements = document.querySelectorAll(".reveal:not(.visible)");

    if (!("IntersectionObserver" in window)) {
      elements.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  ready(function () {
    try {
      applySite(window.YACIN_SITE);
      refreshReveals();
    } catch (err) {
      console.error("[Yacin Renderer] Critical error:", err);
    }
  });
})();