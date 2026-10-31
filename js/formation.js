(function () {
"use strict";

/* =========================================
Configuration
========================================= */
const WORKS = window.YACIN_SITE && Array.isArray(window.YACIN_SITE.works)
  ? window.YACIN_SITE.works
  : [];

const HOVER_EASE = 0.14;
const SPRING = 0.08;
const MORPH_DUR = 900;
const MORPH_STAGGER = 80;
const SWAP_BAND = 180;
const SWAP_FLOOR = 0.25;
const SWAP_SPEED_REF = 14;
const IS_RTL = (document.documentElement.getAttribute("dir") || "").toLowerCase() === "rtl";

function mx(v) {
  return IS_RTL ? -v : v;
}

function ma(v) {
  return IS_RTL ? -v : v;
}

/* =========================================
Utilities
========================================= */
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function pad(n) { return String(n).padStart(2, "0"); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function zeroPose() { return { o: 0, rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0, z: 0 }; }
function copyPose(dst, src) {
  dst.o = src.o; dst.rx = src.rx; dst.ry = src.ry; dst.rz = src.rz;
  dst.s = src.s; dst.x = src.x; dst.y = src.y; dst.z = src.z;
}
function lerpPose(dst, a, b, t) {
  dst.o = lerp(a.o, b.o, t); dst.rx = lerp(a.rx, b.rx, t);
  dst.ry = lerp(a.ry, b.ry, t); dst.rz = lerp(a.rz, b.rz, t);
  dst.s = lerp(a.s, b.s, t); dst.x = lerp(a.x, b.x, t);
  dst.y = lerp(a.y, b.y, t); dst.z = lerp(a.z, b.z, t);
}
function poseTransform(p) {
  return (
    "translate3d(" + p.x + "px, " + p.y + "px, " + p.z + "px) " +
    "rotateX(" + p.rx + "deg) rotateY(" + p.ry + "deg) rotateZ(" + p.rz + "deg) " +
    "scale(" + p.s + ")"
  );
}
function focusScore(p) {
  return Math.abs(p.x) + Math.abs(p.y) * 0.5 - p.z * 0.3 + (1 - p.o) * 1000;
}

/* =========================================
Layout
========================================= */
function getLayout(W, H, n) {
  var isMobile = W < 640;
  var isTablet = W >= 640 && W < 1024;
  var cardW, cardH, cols;
  if (isMobile) {
    cardW = Math.min(W * 0.52, 200);
    cardH = cardW * 1.4;
    cols = 2;
  } else if (isTablet) {
    cardW = Math.min(W * 0.27, 270);
    cardH = cardW * 1.4;
    cols = 3;
  } else {
    cardW = Math.min(W * 0.2, 320);
    cardH = cardW * 1.4;
    cols = 3;
  }
  return {
    W: W, H: H, cardW: cardW, cardH: cardH, cols: cols, n: n,
    isMobile: isMobile, isTablet: isTablet, isDesktop: !isMobile && !isTablet
  };
}

/* =========================================
Poses — 3 Modes
========================================= */
function poseFor(mode, index, L, browse) {
  var W = L.W, H = L.H, cardW = L.cardW, cardH = L.cardH, n = L.n;
  var isMobile = L.isMobile, isTablet = L.isTablet;
  var pose = zeroPose();
  pose.o = 1;

  if (mode === "cascade") {
    var cascCols = isMobile ? 2 : 3;
    var cascCol = index % cascCols;
    var cascRow = Math.floor(index / cascCols);
    var cascGapX = cardW * (isMobile ? 0.18 : 0.25);
    var cascGapY = cardH * (isMobile ? 0.28 : 0.32);
    var cascTotalW = cascCols * cardW + (cascCols - 1) * cascGapX;
    var cascStartX = -cascTotalW / 2 + cardW / 2;
    if (isMobile) {
  var cascMaxW = W - 16;
  var cascScale = Math.max(Math.min(1, cascMaxW / cascTotalW), 0.88);
  pose.x = mx((cascStartX + cascCol * (cardW + cascGapX)) * cascScale);
  pose.y = (-H * 0.32 + cascRow * (cardH + cascGapY) + browse * 0.8) * cascScale;
  pose.z = -cascRow * 15;
  pose.s = cascScale;
  pose.ry = ma(cascCol === 0 ? 2 : -2);
  if (cascRow > 4) pose.o = Math.max(0.4, 1 - (cascRow - 4) * 0.12);
} else if (isTablet) {
  pose.x = mx(cascStartX + cascCol * (cardW + cascGapX));
  pose.y = -H * 0.3 + cascRow * (cardH + cascGapY) + browse * 0.8;
  pose.z = -cascRow * 35 + cascCol * 12;
  pose.s = Math.max(0.8, 1 - cascRow * 0.04);
  pose.rx = -3;
  pose.ry = ma((cascCol - 1) * 4);
  if (cascRow > 3) pose.o = Math.max(0.4, 1 - (cascRow - 3) * 0.1);
} else {
  pose.x = mx(cascStartX + cascCol * (cardW + cascGapX));
  pose.y = -H * 0.28 + cascRow * (cardH + cascGapY) + browse * 0.8;
  pose.z = -cascRow * 55 + cascCol * 20;
  pose.s = Math.max(0.82, 1 - cascRow * 0.035);
  pose.rx = -4;
  pose.ry = ma((cascCol - 1) * 5);
  if (cascRow > 4) pose.o = Math.max(0.45, 1 - (cascRow - 4) * 0.08);
}
  }
  else if (mode === "ring") {
  var angle = (index / n) * Math.PI * 2 + browse * 0.012;
  if (IS_RTL) angle = -((index / n) * Math.PI * 2) + browse * 0.012;
    var spacing = isMobile ? 1.5 : (isTablet ? 1.4 : 1.35);
    var idealRadius = (n * cardW * spacing) / (2 * Math.PI);
    var maxRadius = Math.min(W, H) * 0.48;
    var ringScale = idealRadius > maxRadius ? maxRadius / idealRadius : 1;
    ringScale = Math.max(ringScale, 0.8);
    var radius = idealRadius * ringScale;
    pose.x = Math.cos(angle) * radius;
    pose.z = Math.sin(angle) * radius;
    pose.ry = -angle * (180 / Math.PI) + 90;
    var depthFactor = (Math.sin(angle) + 1) / 2;
    pose.s = ringScale * (0.75 + depthFactor * 0.25);
    pose.o = 0.45 + depthFactor * 0.55;
  }
  else if (mode === "tilt") {
    var snakeSpacing = cardW * (isMobile ? 0.85 : (isTablet ? 0.8 : 0.82));
    var totalSnakeWidth = n * snakeSpacing;
    var rawPosition = index * snakeSpacing + browse * 3;
    var wrappedPosition = ((rawPosition % totalSnakeWidth) + totalSnakeWidth) % totalSnakeWidth;
    var centeredX = wrappedPosition - totalSnakeWidth / 2 + snakeSpacing / 2;
    var waveFreq = isMobile ? 0.012 : (isTablet ? 0.009 : 0.007);
    var waveAmpY = H * (isMobile ? 0.08 : (isTablet ? 0.12 : 0.14));
    var waveAmpZ = isMobile ? 40 : (isTablet ? 70 : 90);
    var wavePhase = centeredX * waveFreq;
    pose.x = centeredX;
    pose.y = Math.sin(wavePhase) * waveAmpY;
    pose.z = Math.cos(wavePhase) * waveAmpZ;
    pose.ry = Math.sin(wavePhase) * (isMobile ? 14 : (isTablet ? 13 : 12));
    pose.rx = Math.cos(wavePhase) * 4;
    var centerDistance = Math.min(Math.abs(centeredX) / (W * 0.55), 1);
    pose.s = 1 - centerDistance * 0.25;
    pose.o = 1 - centerDistance * 0.45;
    if (Math.abs(centeredX) > W * 0.5) {
      pose.o = Math.max(0, 1 - (Math.abs(centeredX) - W * 0.5) / (W * 0.18));
    }
  }
  return pose;
}

/* =========================================
Formation
========================================= */
function Formation(root) {
  this.root = root;
  this.parallax = root.querySelector("#fmParallax");
  this.counter = root.querySelector("#fmCounter");
  this.tabs = root.querySelectorAll(".fm-tab");
  this.cards = [];
  this.mode = "tilt";
  this.layout = null;
  this.state = {
    browse: 0, vel: 0,
    morphing: false, morphMs: 0,
    hoverCard: null, lastFocused: null,
    cursor: { x: 0, y: 0, inside: false },
    press: null, lastX: 0, curTX: 0, curTY: 0,
    reduced: false, seeded: false,
    raf: 0, lastTime: 0,
    onScreen: true, visible: true,
    hasInteracted: false,   // ① آزادسازی اسکرول صفحه
    triggerCard: null       // ② بازگشت فوکوس بعد از لایت‌باکس
  };
  this.init();
}

Formation.prototype.init = function () {
  this.state.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  this.rebuild();
  this.bindEvents();
};

/* بازسازی کامل کارت‌ها از روی داده‌های زنده site.works */
Formation.prototype.rebuild = function () {
  // خواندن لیست زنده (ممکن است توسط فیلتر تغییر کرده باشد)
  var site = window.YACIN_SITE || {};
  var liveWorks = Array.isArray(site.works) ? site.works : [];

  // پاک کردن کارت‌های قبلی
  if (this.parallax) this.parallax.innerHTML = "";
  this.cards = [];

  if (!liveWorks.length) {
    if (this.counter) this.counter.textContent = "00 — 00";
    return;
  }

  // کپی به WORKS محلی (برای سازگاری با کد قدیمی)
  for (var i = 0; i < liveWorks.length; i++) {
    WORKS[i] = liveWorks[i];
  }
  WORKS.length = liveWorks.length;

  this.createCards();
  this.syncTabs();
  this.measure();
  this.bloomEntrance();

  if (!this.state.reduced) {
    if (!this.state.raf) this.startLoop();
  } else {
    this.renderStatic();
  }
};

/* ② همگام‌سازی ARIA تب‌ها */
Formation.prototype.syncTabs = function () {
  var self = this;
  this.tabs.forEach(function (tab) {
    var isActive = tab.dataset.mode === self.mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
};

/* ③ کارت‌ها کیبورد-پذیر (role=button + tabindex) */
Formation.prototype.createCards = function () {
  var self = this;
  var currentWorks = WORKS.slice(0, this.parallax ? undefined : WORKS.length);
  currentWorks.forEach(function (work, i) {
    var outer = document.createElement("div");
    outer.className = "fm-card";
    outer.setAttribute("role", "button");
    outer.setAttribute("tabindex", "0");
    outer.setAttribute("aria-label", "مشاهده نمونه‌کار: " + work.title);
    outer.dataset.index = i;

    var inner = document.createElement("div");
    inner.className = "fm-card-inner bloom";
    var img = document.createElement("div");
    img.className = "fm-card-img";
    img.style.backgroundImage = "url(" + work.image + ")";
    var title = document.createElement("div");
    title.className = "fm-card-title";
    title.textContent = work.title;
    inner.appendChild(img);
    inner.appendChild(title);
    outer.appendChild(inner);
    self.parallax.appendChild(outer);

    outer.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        var card = self.cards[i];
        if (card && card.cur.o > 0.5) self.openLightbox(work, outer);
      }
    });

    self.cards.push({
      index: i, work: work,
      cur: zeroPose(), from: zeroPose(),
      hov: 0, swap: 0, prevZ: 0,
      outer: outer, inner: inner
    });
  });
};

Formation.prototype.measure = function () {
  var r = this.root.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return;
  this.box = { left: r.left, top: r.top, w: Math.round(r.width), h: Math.round(r.height) };
  this.layout = getLayout(this.box.w, this.box.h, this.cards.length);
  this.applyCardSizes();
  if (!this.state.cursor.inside) {
    this.state.cursor.x = this.box.w / 2;
    this.state.cursor.y = this.box.h / 2;
  }
};

Formation.prototype.applyCardSizes = function () {
  if (!this.layout) return;
  var cardW = this.layout.cardW, cardH = this.layout.cardH;
  for (var i = 0; i < this.cards.length; i++) {
    var card = this.cards[i];
    card.outer.style.width = cardW + "px";
    card.outer.style.height = cardH + "px";
    card.outer.style.marginLeft = (-cardW / 2) + "px";
    card.outer.style.marginTop = (-cardH / 2) + "px";
  }
};

Formation.prototype.bloomEntrance = function () {
  var self = this;
  if (this.state.reduced) {
    this.cards.forEach(function (c) { c.inner.classList.remove("bloom"); });
    return;
  }
  var midIndex = Math.floor(this.cards.length / 2);
  this.cards.forEach(function (card, i) {
    var delay = 100 + Math.abs(i - midIndex) * 40;
    setTimeout(function () {
      card.inner.style.transition =
        "opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1), " +
        "transform 1s cubic-bezier(0.2, 0.8, 0.2, 1), " +
        "filter 1s cubic-bezier(0.2, 0.8, 0.2, 1)";
      card.inner.classList.remove("bloom");
    }, delay);
  });
};

Formation.prototype.hoverHit = function (px, py) {
  var sticky = this.state.hoverCard;
  if (sticky && sticky.cur.o >= 0.5) {
    var sr = sticky.outer.getBoundingClientRect();
    var slx = px + this.box.left, sly = py + this.box.top;
    if (slx >= sr.left && slx <= sr.right && sly >= sr.top && sly <= sr.bottom) return sticky;
  }
  var best = null, bestZ = -Infinity;
  for (var i = 0; i < this.cards.length; i++) {
    var card = this.cards[i];
    if (card.cur.o < 0.5) continue;
    var r = card.outer.getBoundingClientRect();
    var lx = px + this.box.left, ly = py + this.box.top;
    if (lx >= r.left && lx <= r.right && ly >= r.top && ly <= r.bottom) {
      if (card.cur.z > bestZ) { bestZ = card.cur.z; best = card; }
    }
  }
  return best;
};

Formation.prototype.renderStatic = function () {
  if (!this.layout) return;
  var focused = null, best = Infinity;
  for (var i = 0; i < this.cards.length; i++) {
    var card = this.cards[i];
    var p = poseFor(this.mode, card.index, this.layout, 0);
    copyPose(card.cur, p);
    card.outer.style.transform = poseTransform(p);
    card.outer.style.opacity = String(p.o);
    card.inner.style.setProperty("--hv", "0");
    var score = focusScore(p);
    if (score < best) { best = score; focused = card; }
  }
  this.parallax.style.transform = "";
  if (this.counter && focused) {
    this.counter.textContent = pad(focused.index + 1) + " — " + pad(this.cards.length);
  }
};

Formation.prototype.startLoop = function () {
  var self = this;
  var staggerDenom = Math.max(1, this.cards.length - 1);

  function advancePoses(dt) {
    if (self.state.morphing) {
      self.state.morphMs += dt;
      var allDone = true;
      for (var i = 0; i < self.cards.length; i++) {
        var card = self.cards[i];
        var p = clamp((self.state.morphMs - (MORPH_STAGGER * card.index) / staggerDenom) / MORPH_DUR, 0, 1);
        if (p < 1) allDone = false;
        lerpPose(card.cur, card.from, poseFor(self.mode, card.index, self.layout, 0), easeInOut(p));
      }
      if (allDone) self.state.morphing = false;
      return;
    }
    for (var j = 0; j < self.cards.length; j++) {
      var c = self.cards[j];
      var t = poseFor(self.mode, c.index, self.layout, self.state.browse);
      if (!self.state.seeded) copyPose(c.cur, t);
      else lerpPose(c.cur, c.cur, t, SPRING);
    }
    self.state.seeded = true;
  }

  function swapTarget(card) {
    var tgt = 0, a = card.cur;
    for (var i = 0; i < self.cards.length; i++) {
      var other = self.cards[i];
      if (other === card) continue;
      var b = other.cur;
      if (
        Math.abs(a.x - b.x) < (self.layout.cardW * a.s + self.layout.cardW * b.s) / 2 &&
        Math.abs(a.y - b.y) < (self.layout.cardH * a.s + self.layout.cardH * b.s) / 2
      ) {
        var gapNow = a.z - b.z;
        var prox = Math.max(0, 1 - Math.abs(gapNow) / SWAP_BAND);
        var gapPrev = card.prevZ - other.prevZ;
        var cross = Math.min(1, Math.abs(gapNow - gapPrev) / SWAP_SPEED_REF);
        var v = prox * cross;
        if (v > tgt) tgt = v;
      }
    }
    return tgt;
  }

  function frame(now) {
    /* ④ اصلاح کلیدی: خارج از دید / تب پنهان = بدون محاسبه */
    if (!self.state.onScreen || !self.state.visible || document.hidden) {
      self.state.lastTime = 0;
      self.state.raf = requestAnimationFrame(frame);
      return;
    }
    if (!self.layout) {
      self.state.raf = requestAnimationFrame(frame);
      return;
    }
    var dt = Math.min(50, now - (self.state.lastTime || now));
    self.state.lastTime = now;

    var dragging = self.state.press && self.state.press.committed === true;
    var rr = self.root.getBoundingClientRect();
    self.box.left = rr.left;
    self.box.top = rr.top;

    if (dragging || self.state.morphing) self.state.hoverCard = null;
    else if (self.state.cursor.inside) self.state.hoverCard = self.hoverHit(self.state.cursor.x, self.state.cursor.y);

    self.root.style.cursor = dragging ? "grabbing" : "grab";

    if (!dragging && !self.state.morphing) {
      self.state.browse += self.state.vel;
      self.state.vel *= 0.92;
      if (Math.abs(self.state.vel) < 0.02) self.state.vel = 0;
    }

    var parallaxMax = self.layout.isMobile ? 1.5 : (self.layout.isTablet ? 3 : 6);
    var ty = (self.state.cursor.x / self.layout.W - 0.5) * parallaxMax;
    var tx = (0.5 - self.state.cursor.y / self.layout.H) * parallaxMax;
    self.state.curTX += (tx - self.state.curTX) * 0.06;
    self.state.curTY += (ty - self.state.curTY) * 0.06;
    self.parallax.style.transform = "rotateX(" + self.state.curTX + "deg) rotateY(" + self.state.curTY + "deg)";

    advancePoses(dt);

    for (var i = 0; i < self.cards.length; i++) {
      var card = self.cards[i];
      var target = card === self.state.hoverCard ? 1 : 0;
      card.hov += (target - card.hov) * HOVER_EASE;
      card.outer.classList.toggle("hovered", card.hov > 0.5);
    }
    for (var j = 0; j < self.cards.length; j++) {
      self.cards[j].swap += (swapTarget(self.cards[j]) - self.cards[j].swap) * 0.3;
    }

    var sortedCards = self.cards.slice().sort(function (a, b) { return a.cur.z - b.cur.z; });
    for (var k = 0; k < sortedCards.length; k++) {
      var sc = sortedCards[k];
      sc.outer.style.transform = poseTransform(sc.cur);
      sc.outer.style.opacity = String(sc.cur.o * (1 - sc.swap * (1 - SWAP_FLOOR)));
      var zIndex;
      if (self.mode === "ring") zIndex = Math.round(1000 + ((sc.cur.z + 1000) / 2000) * 3000);
      else if (self.mode === "tilt") zIndex = Math.round(1000 + ((sc.cur.z + 500) / 1000) * 2000);
      else zIndex = Math.round(1000 + sc.cur.z);
      sc.outer.style.zIndex = String(zIndex);
      sc.inner.style.setProperty("--hv", String(sc.hov));
      sc.prevZ = sc.cur.z;
    }

    var focused = self.state.hoverCard;
    if (!focused) {
      var bestScore = Infinity;
      for (var m = 0; m < self.cards.length; m++) {
        var score = focusScore(self.cards[m].cur);
        if (score < bestScore) { bestScore = score; focused = self.cards[m]; }
      }
    }
    if (focused && focused !== self.state.lastFocused) {
      self.state.lastFocused = focused;
      if (self.counter) {
        self.counter.textContent = pad(focused.index + 1) + " — " + pad(self.cards.length);
      }
    }

    self.state.raf = requestAnimationFrame(frame);
  }
  this.state.raf = requestAnimationFrame(frame);
};

Formation.prototype.setMode = function (newMode) {
  if (newMode === this.mode) return;
  this.mode = newMode;
  this.root.setAttribute("data-mode", newMode);
  this.syncTabs();
  if (this.state.reduced) { this.renderStatic(); return; }
  for (var i = 0; i < this.cards.length; i++) copyPose(this.cards[i].from, this.cards[i].cur);
  this.state.browse = 0;
  this.state.vel = 0;
  this.state.morphing = true;
  this.state.morphMs = 0;
  this.state.seeded = false;
};

/* ⑤ ثبت کارت مبدأ + ARIA + فوکوس روی دکمه بستن */
Formation.prototype.openLightbox = function (work, triggerEl) {
  var lightbox = document.getElementById("fmLightbox");
  var img = document.getElementById("fmLightboxImg");
  var title = document.getElementById("fmLightboxTitle");
  var closeBtn = document.getElementById("fmLightboxClose");
  if (!lightbox || !img || !title) return;
  this.state.triggerCard = triggerEl || null;
  img.src = work.image;
  img.alt = work.title;
  title.textContent = work.title;
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 60);
};

/* ⑥ بازگشت فوکوس به کارت مبدأ */
Formation.prototype.closeLightbox = function () {
  var lightbox = document.getElementById("fmLightbox");
  if (!lightbox) return;
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (this.state.triggerCard) {
    this.state.triggerCard.focus();
    this.state.triggerCard = null;
  }
};

Formation.prototype.bindEvents = function () {
  var self = this;
  new ResizeObserver(function () { self.measure(); }).observe(this.root);
  window.addEventListener("resize", function () { self.measure(); });

  new IntersectionObserver(function (entries) {
    var entry = entries[0];
    if (!entry) return;
    self.state.onScreen = entry.isIntersecting;
    /* ⑦ وقتی گالری از دید خارج شد، قفل اسکرول آزاد شود */
    if (!entry.isIntersecting) self.state.hasInteracted = false;
  }, { threshold: 0 }).observe(this.root);

  document.addEventListener("visibilitychange", function () {
    self.state.visible = document.visibilityState === "visible";
  });

  this.tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { self.setMode(tab.dataset.mode); });
  });

  var tapStartTime = 0;
  var tapStartPos = { x: 0, y: 0 };
  this.root.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".fm-tab")) return;
    if (self.state.press) return;
    tapStartTime = Date.now();
    tapStartPos = { x: e.clientX, y: e.clientY };
    var r = self.root.getBoundingClientRect();
    var lx = e.clientX - r.left, ly = e.clientY - r.top;
    self.state.cursor.x = lx;
    self.state.cursor.y = ly;
    self.state.cursor.inside = true;
    self.state.lastX = lx;
    self.state.press = { committed: false, id: e.pointerId, x: lx, y: ly };
  });

  this.root.addEventListener("pointermove", function (e) {
    var press = self.state.press;
    if (press && press.id !== e.pointerId) return;
    var r = self.root.getBoundingClientRect();
    var lx = e.clientX - r.left, ly = e.clientY - r.top;
    self.state.cursor.x = lx;
    self.state.cursor.y = ly;
    self.state.cursor.inside = true;
    if (press && !self.state.morphing) {
      if (!press.committed) {
        var dist = Math.hypot(lx - press.x, ly - press.y);
        var threshold = self.layout.isMobile ? 10 : 8;
        if (dist > threshold) {
          press.committed = true;
          self.state.hasInteracted = true;   /* ⑧ کاربر درگیر گالری شد */
          try { self.root.setPointerCapture(press.id); } catch (err) { /* noop */ }
        }
      }
      if (press.committed) {
        var gain;
        if (self.layout.isMobile) gain = 3;
        else if (self.mode === "tilt") gain = 2;
        else if (self.mode === "ring") gain = 1.4;
        else gain = 1;
        var d = (lx - self.state.lastX) * gain;
if (IS_RTL) d = -d;
self.state.browse += d;
self.state.vel = d;
      }
    }
    self.state.lastX = lx;
  });

  function endPress(e) {
    var press = self.state.press;
    if (!press || press.id !== e.pointerId) return;
    if (self.root.hasPointerCapture(press.id)) self.root.releasePointerCapture(press.id);
    var tapDuration = Date.now() - tapStartTime;
    var tapDistance = Math.hypot(e.clientX - tapStartPos.x, e.clientY - tapStartPos.y);
    if (tapDuration < 300 && tapDistance < 15 && !press.committed) {
      var card = null;
      for (var i = 0; i < self.cards.length; i++) {
        var c = self.cards[i];
        var rect = c.outer.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          card = c; break;
        }
      }
      if (card && card.cur.o > 0.5) self.openLightbox(card.work, card.outer);
    }
    self.state.press = null;
  }
  this.root.addEventListener("pointerup", endPress);
  this.root.addEventListener("pointercancel", endPress);
  this.root.addEventListener("pointerleave", function () {
    if (self.state.press && self.state.press.committed) return;
    self.state.press = null;
    self.state.cursor.inside = false;
    self.state.hoverCard = null;
  });

  /* ⑨ اصلاح کلیدی: wheel دیگر اسکرول صفحه را نمی‌قاپد.
     اسکرول عمودی فقط بعد از drag گرفته می‌شود؛ اسکرول افقی همیشه. */
  /* ⑨ اصلاح کلیدی موبایل:
   در موبایل اصلاً به wheel دست نزن چون اسکرول صفحه را خراب می‌کند.
   فقط در دسکتاپ/تبلت با ترک‌پد کار کند. */
if (!("ontouchstart" in window) || window.innerWidth >= 1024) {
  this.root.addEventListener("wheel", function (e) {
    if (e.target.closest(".fm-tab")) return;
    if (self.state.reduced) return;
    var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    /* فقط اسکرول افقی یا وقتی کاربر درگیر گالری شده */
    if (!horizontal && !self.state.hasInteracted) return;
    e.preventDefault();
    if (self.state.morphing) return;
    var gain = self.mode === "tilt" ? 0.8 : 0.6;
    var delta = horizontal ? e.deltaX : e.deltaY;
    var impulse = -delta * gain;
    self.state.browse += impulse;
    self.state.vel = impulse * 0.25;
  }, { passive: false });
}

  if ("ontouchstart" in window) {
    var touchStartY = 0, touchStartX = 0;
    this.root.addEventListener("touchstart", function (e) {
      if (e.target.closest(".fm-tab")) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    this.root.addEventListener("touchmove", function (e) {
      if (e.target.closest(".fm-tab")) return;
      if (!self.state.press || !self.state.press.committed) return;
      var deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      var deltaX = Math.abs(e.touches[0].clientX - touchStartX);
      if (deltaX > deltaY && deltaX > 10) e.preventDefault();
    }, { passive: false });
  }

  var lightbox = document.getElementById("fmLightbox");
  var lightboxClose = document.getElementById("fmLightboxClose");
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) self.closeLightbox();
    });
  }
  if (lightboxClose) {
    lightboxClose.addEventListener("click", function () { self.closeLightbox(); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") self.closeLightbox();
  });
};

document.addEventListener("DOMContentLoaded", function () {
  var root = document.getElementById("fmRoot");
  if (root) {
    var instance = new Formation(root);
    // در دسترس برای فیلتر و ابزارهای بیرونی
    window.fmInstance = instance;
    window.rebuildFormation = function () { instance.rebuild(); };
  }
});
})();