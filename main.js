document.addEventListener("DOMContentLoaded", function () {

  /* ===============================
     Header scroll effect
  =============================== */

  const header = document.getElementById("header");

  function handleHeaderScroll() {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleHeaderScroll);
  handleHeaderScroll();

  /* ===============================
     Mobile menu
  =============================== */

  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", function () {
      menuToggle.classList.toggle("active");
      menu.classList.toggle("active");

      if (menu.classList.contains("active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    const menuLinks = menu.querySelectorAll("a");

    menuLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        menuToggle.classList.remove("active");
        menu.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  /* ===============================
     Reveal on scroll
  =============================== */

  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  revealElements.forEach(function (element) {
    revealObserver.observe(element);
  });

  /* ===============================
     Portfolio filter
  =============================== */

  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {

      filterButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      const filterValue = button.dataset.filter;

      galleryItems.forEach(function (item) {
        const itemCategory = item.dataset.category;

        if (filterValue === "all" || itemCategory === filterValue) {
          item.classList.remove("hide");
          item.classList.add("show");
        } else {
          item.classList.add("hide");
          item.classList.remove("show");
        }
      });

    });
  });

  /* ===============================
     Lightbox
  =============================== */

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxPrev = document.querySelector(".lightbox-prev");
  const lightboxNext = document.querySelector(".lightbox-next");

  let visibleItems = [];
  let currentIndex = 0;

  function getVisibleGalleryItems() {
    return Array.from(galleryItems).filter(function (item) {
      return !item.classList.contains("hide");
    });
  }

  function updateLightboxImage() {
    const currentItem = visibleItems[currentIndex];

    if (!currentItem) return;

    const image = currentItem.querySelector("img");
    const fullImage = currentItem.dataset.full || image.src;

    lightboxImg.src = fullImage;
    lightboxImg.alt = image.alt || "عکس یاسین فوتو";
  }

  function openLightbox(index) {
    visibleItems = getVisibleGalleryItems();

    if (!visibleItems.length) return;

    currentIndex = index;

    updateLightboxImage();

    if (lightbox) {
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.classList.remove("active");
    document.body.style.overflow = "";

    setTimeout(function () {
      lightboxImg.src = "";
    }, 250);
  }

  function showPrevImage() {
    if (!visibleItems.length) return;

    currentIndex =
      (currentIndex - 1 + visibleItems.length) % visibleItems.length;

    updateLightboxImage();
  }

  function showNextImage() {
    if (!visibleItems.length) return;

    currentIndex = (currentIndex + 1) % visibleItems.length;

    updateLightboxImage();
  }

  galleryItems.forEach(function (item) {
    item.addEventListener("click", function () {
      visibleItems = getVisibleGalleryItems();

      const index = visibleItems.indexOf(item);

      if (index !== -1) {
        openLightbox(index);
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", showPrevImage);
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", showNextImage);
  }
  /* ═══════════════════════════════════
     Swipe gesture برای Lightbox روی موبایل
  ═══════════════════════════════════ */
  if (lightbox) {
    var touchStartX = 0;
    var touchStartY = 0;
    var touchEndX = 0;
    var touchEndY = 0;

    lightbox.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    lightbox.addEventListener("touchend", function (e) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      var dx = touchEndX - touchStartX;
      var dy = touchEndY - touchStartY;
      /* فقط swipe افقی معتبر */
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) {
          showPrevImage();
        } else {
          showNextImage();
        }
      }
    }, { passive: true });
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!lightbox || !lightbox.classList.contains("active")) return;

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      showPrevImage();
    }

    if (event.key === "ArrowRight") {
      showNextImage();
    }
  });

  /* ===============================
Contact form — اتصال واقعی به سرور
=============================== */
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);
    const payload = {
      name: (formData.get("name") || "").trim(),
      phone: (formData.get("phone") || "").trim(),
      email: (formData.get("email") || "").trim(),
      service: formData.get("service") || "",
      message: (formData.get("message") || "").trim(),
      website: (formData.get("website") || "").trim() // honeypot anti-spam
    };

    // اعتبارسنجی سمت کلاینت
    if (!payload.name || !payload.phone) {
      showMessage("لطفاً نام و شماره تماس را وارد کنید.", "error");
      return;
    }
    if (!payload.service) {
      showMessage("لطفاً نوع خدمات را انتخاب کنید.", "error");
      return;
    }

    // غیرفعال کردن دکمه حین ارسال
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "در حال ارسال...";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(function () { return {}; });
        throw new Error(data.error || "خطا در ارسال درخواست.");
      }

      showMessage(
        payload.name + " عزیز، درخواست شما با موفقیت ثبت شد. به‌زودی برای هماهنگی با شما تماس می‌گیریم.",
        "success"
      );
      contactForm.reset();
    } catch (err) {
      showMessage("خطا در ارسال درخواست. لطفاً از طریق واتس‌اپ با ما در تماس باشید.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message show " + (type || "success");
    setTimeout(function () {
      formMessage.classList.remove("show");
    }, 7000);
  }
}

  /* ===============================
     Footer year
  =============================== */

  const yearElement = document.getElementById("year");
if (yearElement) {
  try {
    yearElement.textContent = new Date().toLocaleDateString("fa-IR-u-ca-persian", { year: "numeric" });
  } catch (e) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/* ═══ Notch Bottom Nav (sliding dome) ═══ */
(function () {
  var nav = document.getElementById("ynav");
  if (!nav) return;

  var dome = document.getElementById("ynavDome");
  var items = nav.querySelectorAll(".ynav__item[data-target]");
  var moreBtn = document.getElementById("ynavMore");
  var sheet = document.getElementById("ymore");
  var DW = 84;

  function placeDome(el) {
    if (!el || !dome) return;
    var nr = nav.getBoundingClientRect();
    var ir = el.getBoundingClientRect();
    if (!nr.width) return;                       // دسکتاپ / مخفی → کاری نداریم
    var cx = ir.left - nr.left + ir.width / 2;   // فیزیکی، مستقل از RTL
    dome.style.transform = "translateX(" + (cx - DW / 2) + "px)";
    dome.classList.add("ready");
  }

  function activate(id) {
    var hit = null;
    items.forEach(function (it) {
      var on = it.dataset.target === id;
      it.classList.toggle("is-active", on);
      if (on) { hit = it; it.setAttribute("aria-current", "page"); }
      else it.removeAttribute("aria-current");
    });
    if (hit) placeDome(hit);
    if (moreBtn) moreBtn.classList.remove("is-active");
  }

  function ripple(el, ev) {
    var r = el.getBoundingClientRect();
    var s = Math.max(r.width, r.height) * 1.3;
    var d = document.createElement("span");
    d.className = "ynav__rip";
    d.style.width = d.style.height = s + "px";
    d.style.left = ((ev.clientX || r.left + r.width / 2) - r.left - s / 2) + "px";
    d.style.top = ((ev.clientY || r.top + r.height / 2) - r.top - s / 2) + "px";
    el.appendChild(d);
    setTimeout(function () { d.remove(); }, 650);
  }

  items.forEach(function (it) {
    it.addEventListener("click", function (e) {
      e.preventDefault(); ripple(it, e);
      var t = document.querySelector(it.getAttribute("href"));
      if (t) { t.scrollIntoView({ behavior: "smooth", block: "start" }); activate(it.dataset.target); history.replaceState(null, "", it.getAttribute("href")); }
    });
  });

  function openSheet() { if (!sheet) return; sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); if (moreBtn) moreBtn.classList.add("is-active"); document.body.style.overflow = "hidden"; }
  function closeSheet() { if (!sheet) return; sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); if (moreBtn) moreBtn.classList.remove("is-active"); document.body.style.overflow = ""; }
  if (moreBtn) moreBtn.addEventListener("click", function (e) { ripple(moreBtn, e); openSheet(); });
  if (sheet) {
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    sheet.querySelectorAll(".ymore__link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var h = a.getAttribute("href");
        if (h && h.charAt(0) === "#") { e.preventDefault(); closeSheet(); var t = document.querySelector(h); if (t) setTimeout(function () { t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 380); }
      });
    });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet && sheet.classList.contains("open")) closeSheet(); });

  var ids = ["home", "portfolio", "locations", "services", "contact"];
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting && en.intersectionRatio > 0.3) activate(en.target.id); });
  }, { threshold: [0.3, 0.6], rootMargin: "-70px 0px -45% 0px" });
  ids.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });

  function boot() { activate(location.hash.replace("#", "") || "home"); }
  window.addEventListener("load", boot);
  if (document.readyState === "complete") boot();
  window.addEventListener("resize", function () { var a = nav.querySelector(".ynav__item.is-active"); if (a) placeDome(a); });
  requestAnimationFrame(boot);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
});
/* ═══════════════════════════════════════════════════════
   SCROLL FX ENGINE — dust, parallax, masks, tilt, spotlight
═══════════════════════════════════════════════════════ */
(function initScrollFx() {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var mobile = window.matchMedia("(max-width: 768px)").matches;

  /* ۱) تأخیر پلکانی + جهت ورود کارت‌ها */
  document.querySelectorAll(".services-grid, .instagram-grid, .about-stats, .gallery, .locations-grid").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--rd", ((i % 6) * 0.09).toFixed(2) + "s");
      child.classList.add(i % 2 === 0 ? "from-left" : "from-right");
    });
  });

  /* ۲) اهداف ماسک‌ریویل */
  document.querySelectorAll(".section-head h2, .about-content h2").forEach(function (el) {
    el.classList.add("mask-reveal");
  });

  /* ۳) آبزرور: reveal + mask + section-head */
  var fxTargets = document.querySelectorAll(".reveal, .mask-reveal, .section-head");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    fxTargets.forEach(function (el) { io.observe(el); });
  } else {
    fxTargets.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ۴) پارالاکس تصویر «درباره من» */
  var aboutBox = document.querySelector(".about-media");
  var aboutImg = aboutBox ? aboutBox.querySelector("img") : null;
  if (aboutBox && aboutImg) aboutBox.classList.add("parallax-clip");

  var heroContent = document.querySelector(".hero-content");
  var heroBox = document.querySelector(".hero-media");
  var fill = document.querySelector(".scroll-progress i");
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset || 0;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;

    if (fill) fill.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + "%";
    if (reduce) return;

    if (y < vh) {
      if (heroContent) {
        heroContent.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
        heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.72)).toFixed(3);
      }
      if (heroBox) heroBox.style.transform = "translate3d(0," + (y * -0.06).toFixed(1) + "px,0)";
    }

    if (aboutBox && aboutImg && !mobile) {
      var r = aboutBox.getBoundingClientRect();
      if (r.bottom > -80 && r.top < vh + 80) {
        var center = r.top + r.height / 2 - vh / 2;
        aboutImg.style.transform = "translate3d(0," + (center * -0.06).toFixed(1) + "px,0) scale(1.12)";
      }
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  frame();

  /* ۵) غبار طلایی (Canvas) */
  var canvas = document.getElementById("dustCanvas");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0;
    var COUNT = mobile ? 24 : 58;
    var parts = [];

    function resize() {
      W = canvas.width = canvas.offsetWidth * dpr;
      H = canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    for (var i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random(), y: Math.random(),
        r: (Math.random() * 1.5 + 0.4) * dpr,
        s: Math.random() * 0.00055 + 0.00018,
        dx: (Math.random() - 0.5) * 0.0004,
        o: Math.random() * 0.45 + 0.12,
        tw: Math.random() * Math.PI * 2
      });
    }

    var scrollY = 0;
    window.addEventListener("scroll", function () { scrollY = window.scrollY || 0; }, { passive: true });

    (function loop() {
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.y -= p.s; p.x += p.dx; p.tw += 0.02;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        var py = (p.y * H - scrollY * 0.06 * dpr) % H;
        if (py < 0) py += H;
        var alpha = p.o * (0.6 + 0.4 * Math.sin(p.tw));

        ctx.beginPath();
        ctx.arc(p.x * W, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(232, 201, 138," + alpha.toFixed(3) + ")";
        ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ۶) اسپات‌لایت دنبال‌کننده ماوس (فقط دسکتاپ) */
  var spot = document.getElementById("bgSpotlight");
  if (spot && finePointer && !reduce) {
    var sx = 50, sy = 50, tx = 50, ty = 50;
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
      spot.classList.add("on");
    }, { passive: true });
    (function follow() {
      sx += (tx - sx) * 0.08;
      sy += (ty - sy) * 0.08;
      spot.style.setProperty("--mx", sx.toFixed(2) + "%");
      spot.style.setProperty("--my", sy.toFixed(2) + "%");
      requestAnimationFrame(follow);
    })();
  }

  /* ۷) تیلت سه‌بعدی کارت‌ها (فقط دسکتاپ) */
  if (finePointer && !reduce) {
    document.querySelectorAll(".service-card, .stat-box").forEach(function (card) {
      card.classList.add("tilt");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateY(" + (px * 6).toFixed(2) + "deg) rotateX(" + (-py * 6).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }
})();
/* ═══════════════════════════════════════════════════════
   SCROLL ANIMATIONS ENGINE
═══════════════════════════════════════════════════════ */
(function initScrollAnimations() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // ۱) Intersection Observer برای انیمیشن‌های پایه
  const animElements = document.querySelectorAll('.anim');
  
  if ('IntersectionObserver' in window) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animElements.forEach(el => animObserver.observe(el));
  } else {
    animElements.forEach(el => el.classList.add('visible'));
  }

  // ۲) Parallax برای تصاویر بزرگ
  const parallaxElements = document.querySelectorAll('.parallax');
  let ticking = false;

  function updateParallax() {
    parallaxElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.speed) || 0.3;
      const offset = (rect.top - window.innerHeight / 2) * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  if (parallaxElements.length) {
    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();
  }

  // ۳) Counter Animation برای آمار
  const counters = document.querySelectorAll('.counter');
  
  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target) || 0;
          const duration = 2000;
          const step = target / (duration / 16);
          let current = 0;

          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(current);
            }
          }, 16);

          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  // ۴) Smooth Reveal برای هیرو
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    setTimeout(() => {
      heroContent.classList.add('visible');
    }, 300);
  }
})();
/* ═══════════════════════════════════════════════════════
   فوتر — سال خودکار + انیمیشن ورود
═══════════════════════════════════════════════════════ */
(function initFooter() {
  // سال خودکار
  const yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // انیمیشن ورود فوتر
  const footer = document.getElementById("siteFooter");
  if (!footer) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  footer.style.opacity = "0";
  footer.style.transform = "translateY(30px)";
  footer.style.transition = "opacity 1s ease, transform 1s ease";

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        footer.style.opacity = "1";
        footer.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(footer);
})();
/* ═══════════════════════════════════════════════════════
   SPLASH SCREEN — کنترل لودینگ
═══════════════════════════════════════════════════════ */
(function initSplashScreen() {
  const splash = document.getElementById("splashScreen");
  if (!splash) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minDisplayTime = reduce ? 400 : 1800; // حداقل زمان نمایش

  function hideSplash() {
    splash.classList.add("hidden");
    // بعد از پایان انیمیشن، از DOM حذف شود تا حافظه آزاد شود
    setTimeout(() => {
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 900);
  }

  // صبر کن تا همه چیز (عکس‌ها، فونت‌ها، ...) لود شود
  if (document.readyState === "complete") {
    setTimeout(hideSplash, minDisplayTime);
  } else {
    window.addEventListener("load", () => {
      setTimeout(hideSplash, minDisplayTime);
    });
  }
})();
/* ═══════════════════════════════════════════════════════
   SPLASH SCREEN — نسخه اضطراری
═══════════════════════════════════════════════════════ */
window.addEventListener("load", function() {
  const splash = document.getElementById("splashScreen");
  if (splash) {
    setTimeout(() => {
      splash.style.display = "none";
    }, 1500);
  }
});
/* ═══════════════════════════════════════════════════════
   COUNTER ANIMATION — شمارنده متحرک آمار درباره من
═══════════════════════════════════════════════════════ */
(function initStatCounters() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const stats = document.querySelectorAll(".stat-box strong");
  if (!stats.length) return;

  function parseNumber(str) {
    const cleaned = String(str).replace(/[^0-9]/g, "");
    return parseInt(cleaned, 10) || 0;
  }

  function hasPrefix(str) {
    return String(str).startsWith("+") || String(str).startsWith("＋");
  }

  function animateCounter(el) {
    const text = el.textContent.trim();
    const target = parseNumber(text);
    const prefix = hasPrefix(text) ? "+" : "";

    if (target === 0) return;

    const duration = 1800;
    const startTime = performance.now();
    el.classList.add("counting");

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(eased * target);
      el.textContent = prefix + current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + target;
        setTimeout(() => el.classList.remove("counting"), 400);
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════════
   PARALLAX ABOUT — حرکت ملایم عکس درباره من با اسکرول
═══════════════════════════════════════════════════════ */
(function initAboutParallax() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  if (reduce || mobile) return;

  const aboutMedia = document.querySelector(".about-media");
  const img = aboutMedia ? aboutMedia.querySelector("img") : null;
  if (!aboutMedia || !img) return;

  let ticking = false;

  function update() {
    ticking = false;
    const rect = aboutMedia.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) return;
    const center = rect.top + rect.height / 2 - vh / 2;
    const offset = center * -0.08;
    img.style.transform = `translateY(${offset}px) scale(1.05)`;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
})();
/* ═══════════════════════════════════════════════════════
   SKILL BARS ANIMATION — انیمیشن نوار مهارت‌ها
═══════════════════════════════════════════════════════ */
(function initSkillBars() {
  const bars = document.querySelectorAll(".skill-bar");
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const fill = bar.querySelector(".skill-bar__fill");
        if (fill) {
          const width = fill.dataset.width || 0;
          // برای تأخیر طبیعی بین نوارها
          setTimeout(() => {
            fill.style.setProperty("--target-width", width + "%");
            bar.classList.add("visible");
          }, 100);
        }
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.4 });

  bars.forEach(bar => observer.observe(bar));
})();
/* ═══════════════════════════════════════════════════════
   RTL — شروع ریل افقی خدمات/لوکیشن از راست
═══════════════════════════════════════════════════════ */
(function initRtlHorizontalRails() {
  const rails = document.querySelectorAll(".services-grid, .locations-grid");
  if (!rails.length) return;

  function setRtlScrollStart() {
    rails.forEach((rail) => {
      const style = getComputedStyle(rail);
      if (style.direction !== "rtl") return;

      // در RTL مدرن، برای رفتن به ابتدای راست معمولاً scrollLeft = 0 کافی است،
      // ولی بعضی مرورگرها نیاز دارند به آخر برود.
      rail.scrollLeft = rail.scrollWidth;
    });
  }

  window.addEventListener("load", () => setTimeout(setRtlScrollStart, 120));
  window.addEventListener("resize", setRtlScrollStart);

  // اگر بعد از رندر JS، کارت‌ها دیر ساخته شدند
  const observer = new MutationObserver(() => {
    clearTimeout(window.__rtlRailTimer);
    window.__rtlRailTimer = setTimeout(setRtlScrollStart, 120);
  });

  rails.forEach((rail) => {
    observer.observe(rail, { childList: true, subtree: true });
  });
})();