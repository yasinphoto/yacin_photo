(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);

  const loginScreen = byId("loginScreen");
  const adminApp = byId("adminApp");
  const loginForm = byId("loginForm");
  const passwordInput = byId("password");
  const loginError = byId("loginError");
  const logoutBtn = byId("logoutBtn");
  const logoutBtnMobile = byId("logoutBtnMobile");
  const saveBtn = byId("saveBtn");
  const exportBtn = byId("exportBtn");
  const importBtn = byId("importBtn");
  const importFile = byId("importFile");
  const sectionTitle = byId("sectionTitle");
  const sectionDesc = byId("sectionDesc");
  const toastEl = byId("toast");

  const worksList = byId("worksList");
  const worksListAlt = byId("worksListAlt");
  const categoriesList = byId("categoriesList");
  const locationsList = byId("locationsList");
  const servicesList = byId("servicesList");
  const statsList = byId("statsList");
  const instagramList = byId("instagramList");
  const contactInfoList = byId("contactInfoList");
  const inquiriesList = byId("inquiriesList");

  const mediaGrid = byId("mediaGrid");
  const mediaUpload = byId("mediaUpload");
  const heroPreview = byId("heroPreview");
  const aboutPreview = byId("aboutPreview");

  const countWorks = byId("countWorks");
  const countLocations = byId("countLocations");
  const countServices = byId("countServices");
  const countMedia = byId("countMedia");
  const countInquiries = byId("countInquiries");
  const countInquiriesAlt = byId("countInquiriesAlt");
  const weekInquiries = byId("weekInquiries");
  const todayInquiries = byId("todayInquiries");
  const latestInquiry = byId("latestInquiry");
  const recentInquiries = byId("recentInquiries");
  const weekChart = byId("weekChart");
  const refreshInquiries = byId("refreshInquiries");
  const refreshInquiriesAlt = byId("refreshInquiriesAlt");
  const lastChange = byId("lastChange");
  const storageInfo = byId("storageInfo");
  const mediaSize = byId("mediaSize");
  const inquiryBadge = byId("inquiryBadge");
  const bnBadge = byId("bnInquiryBadge");
  const bnMore = byId("bnMore");
  const moreSheet = byId("moreSheet");
  const bottomNav = byId("bottomNav");

 let content = null;
let dirty = false;
let lastInquiries = [];
let worksFilter = "all";
const uiState = { editLocations: {}, editWorks: {}, editIg: {} };
let mediaCache = [];
let mediaPage = 1;
let mediaQuery = "";
const MEDIA_PER_PAGE = 24;
let currentLocationIndex = null;

  const DEVICES = [
    { key: "desktop", label: "دسکتاپ" },
    { key: "tablet", label: "تبلت" },
    { key: "mobile", label: "موبایل" }
  ];

  const DEFAULT_IMG = { rotate: 0, flipH: false, flipV: false, posX: 50, posY: 50, zoom: 1 };

  const imgEditor = { open: false, imagePath: "", objectPath: "", device: "desktop" };

  const PANEL_META = {
    dashboard: ["داشبورد", "نمای کلی فعالیت‌ها و آمار"],
    hero: ["هیرو", "بنر و معرفی صفحه اصلی"],
    works: ["نمونه‌کارها", "گالری کارهای منتخب"],
    categories: ["دسته‌بندی‌ها", "مدیریت دسته‌های نمونه‌کارها"],
    locations: ["لوکیشن‌ها", "لوکیشن‌های عکاسی"],
    services: ["خدمات", "کارت‌های خدمات"],
    about: ["درباره ما", "معرفی و آمار"],
    instagram: ["اینستاگرام", "پست‌های شبکه اجتماعی"],
    contact: ["تماس", "اطلاعات تماس"],
    inquiries: ["درخواست‌ها", "درخواست‌های رزرو"],
    media: ["مدیا", "کتابخانه تصاویر"],
    settings: ["تنظیمات", "اطلاعات سایت و SEO"]
  };

  function setText(el, v) { if (el) el.textContent = v == null ? "" : v; }
  function setHtml(el, h) { if (el) el.innerHTML = h; }
  function setPreview(el, src) {
    if (!el) return;
    const value = src || "";
    if (el.tagName === "IMG") { el.src = value; return; }
    const img = el.querySelector("img");
    if (img) img.src = value;
  }
  function toast(msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = "toast show " + (type || "");
    setTimeout(() => { toastEl.className = "toast " + (type || ""); }, 2400);
  }
  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function attrEscape(v) { return String(v).replace(/[\\"]/g, "\\$&"); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function formatBytes(b) {
    const n = Number(b || 0);
    if (!n) return "0 KB";
    const kb = n / 1024;
    return kb < 1024 ? Math.round(kb) + " KB" : (kb / 1024).toFixed(1) + " MB";
  }
  function setDirty() { dirty = true; const dot = saveBtn && saveBtn.querySelector(".save-dot"); if (dot) dot.hidden = false; }
  function clearDirty() { dirty = false; const dot = saveBtn && saveBtn.querySelector(".save-dot"); if (dot) dot.hidden = true; }
  function normalizePath(p) { return String(p).replace(/\[(\d+)\]/g, ".$1").split("."); }
  function getByPath(o, p) { return normalizePath(p).reduce((a, k) => (a == null ? undefined : a[k]), o); }
  function setByPath(o, p, v) {
    const keys = normalizePath(p);
    let c = o;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i], n = keys[i + 1];
      if (c[k] == null || typeof c[k] !== "object") c[k] = /^\d+$/.test(n) ? [] : {};
      c = c[k];
    }
    c[keys[keys.length - 1]] = v;
  }

  async function api(url, opts) {
    opts = opts || {};
    const res = await fetch(url, { method: opts.method || "GET", headers: opts.headers || { "Content-Type": "application/json" }, body: opts.body });
    if (res.status === 429) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "تلاش بیش از حد."); }
    if (res.status === 401 && !opts.noAuthRedirect) { showLogin(); throw new Error("جلسه منقضی شده."); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "خطا در ارتباط.");
    return data;
  }

  function showLogin() { closeImageEditor(); closeMore(); if (loginScreen) loginScreen.removeAttribute("hidden"); if (adminApp) adminApp.setAttribute("hidden", ""); if (bottomNav) bottomNav.setAttribute("hidden", ""); }
  function showApp() { if (loginScreen) loginScreen.setAttribute("hidden", ""); if (adminApp) adminApp.removeAttribute("hidden"); if (bottomNav) bottomNav.removeAttribute("hidden"); }

  function ensureImageSettings(obj) {
    if (!obj || typeof obj !== "object") return null;
    if (!obj.imageSettings) obj.imageSettings = {};
    DEVICES.forEach(d => {
      if (!obj.imageSettings[d.key]) obj.imageSettings[d.key] = Object.assign({}, DEFAULT_IMG);
      else {
        const s = obj.imageSettings[d.key];
        if (typeof s.rotate !== "number") s.rotate = 0;
        if (typeof s.flipH !== "boolean") s.flipH = false;
        if (typeof s.flipV !== "boolean") s.flipV = false;
        if (typeof s.posX !== "number") s.posX = 50;
        if (typeof s.posY !== "number") s.posY = 50;
        if (typeof s.zoom !== "number") s.zoom = 1;
      }
    });
    return obj.imageSettings;
  }

  function imageObjectPath(p) { if (p.endsWith(".image") || p.endsWith(".cover")) return p.slice(0, -6); return p; }
  function hasCustomSettings(op) {
    if (!content) return false;
    const obj = getByPath(content, op);
    const set = obj && obj.imageSettings;
    if (!set) return false;
    return DEVICES.some(d => {
      const s = set[d.key];
      if (!s) return false;
      return s.rotate !== 0 || s.flipH || s.flipV || s.posX !== 50 || s.posY !== 50 || Math.abs((s.zoom || 1) - 1) > 0.01;
    });
  }

  function migrateImageSettings(c) {
    const ensure = o => { if (o && typeof o === "object") ensureImageSettings(o); };
    ensure(c.hero); ensure(c.about);
    (c.works || []).forEach(ensure);
    (c.locations || []).forEach(l => { ensure(l); (l.works || []).forEach(ensure); });
    (c.instagram || []).forEach(ensure);
  }

  function imageTransform(s) {
    if (!s) return "";
    const p = [];
    if (s.rotate) p.push("rotate(" + s.rotate + "deg)");
    if (s.flipH) p.push("scaleX(-1)");
    if (s.flipV) p.push("scaleY(-1)");
    let e = 1;
    if (s.rotate === 90 || s.rotate === 270) e = 1.4;
    if (s.zoom > 1) e *= s.zoom;
    if (e > 1) p.push("scale(" + e + ")");
    return p.join(" ");
  }

  function applyImageStyle(img, s) {
    if (!img || !s) return;
    img.style.transform = imageTransform(s);
    img.style.objectPosition = (s.posX || 50) + "% " + (s.posY || 50) + "%";
  }

  function friendlyPath(p) {
    if (p === "hero.image") return "تصویر هیرو";
    if (p === "about.image") return "تصویر درباره";
    const w = p.match(/^works\[(\d+)\]\.image$/); if (w) return "تصویر نمونه‌کار " + (Number(w[1]) + 1);
    const lc = p.match(/^locations\[(\d+)\]\.cover$/); if (lc) return "کاور لوکیشن " + (Number(lc[1]) + 1);
    const lw = p.match(/^locations\[(\d+)\]\.works\[(\d+)\]\.image$/); if (lw) return "تصویر لوکیشن " + (Number(lw[1]) + 1) + " / کار " + (Number(lw[2]) + 1);
    const i = p.match(/^instagram\[(\d+)\]\.image$/); if (i) return "تصویر پست اینستاگرام " + (Number(i[1]) + 1);
    return p;
  }

  function currentSettings() {
    if (!content || !imgEditor.objectPath) return null;
    const obj = getByPath(content, imgEditor.objectPath);
    if (!obj) return null;
    const set = ensureImageSettings(obj);
    return set ? set[imgEditor.device] : null;
  }

  function refreshFieldPreview(path) {
    const src = String(getByPath(content, path) || "");
    $$('[data-image-preview="' + attrEscape(path) + '"]').forEach(img => { img.src = src; });
    if (path === "hero.image") setPreview(heroPreview, src);
    if (path === "about.image") setPreview(aboutPreview, src);
    if (imgEditor.open && imgEditor.imagePath === path) { const mi = byId("yacImgPreview"); if (mi) mi.src = src; }
  }

  function syncFieldInputs(f, v) {
    const sel = '[data-field="' + attrEscape(f) + '"], [data-bind="' + attrEscape(f) + '"]';
    $$(sel).forEach(el => { if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = v == null ? "" : v; });
  }

  function refreshEditButtons() {
    $$("[data-image-edit]").forEach(btn => {
      const path = btn.dataset.imageEdit;
      const op = imageObjectPath(path);
      const c = hasCustomSettings(op);
      let dot = btn.querySelector(".image-field__dot");
      if (c && !dot) btn.insertAdjacentHTML("beforeend", '<i class="image-field__dot"></i>');
      if (!c && dot) dot.remove();
    });
  }

  function ensureStaticEditButton(path, pid) {
    const img = byId(pid);
    if (!img) return;
    const cont = img.closest(".preview") || (img.closest(".img-block__view") ? null : img.parentElement);
    if (!cont) return;
    let btn = cont.querySelector('[data-image-edit="' + attrEscape(path) + '"]');
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost image-field__edit static-edit";
      btn.dataset.imageEdit = path;
      cont.appendChild(btn);
    }
    const c = hasCustomSettings(imageObjectPath(path));
    btn.innerHTML = "ویرایش تصویر" + (c ? '<i class="image-field__dot"></i>' : "");
  }

  function refreshStaticEditButtons() {
    ensureStaticEditButton("hero.image", "heroPreview");
    ensureStaticEditButton("about.image", "aboutPreview");
    bindImageMeta("heroPreview", "heroImageMeta");
    bindImageMeta("aboutPreview", "aboutImageMeta");
  }

  function ensureImageModal() {
    if (byId("yacImgModal")) return;
    const m = document.createElement("div");
    m.id = "yacImgModal";
    m.className = "yac-img-modal";
    m.setAttribute("hidden", "");
    m.innerHTML = '<div class="yac-img-modal__backdrop" data-img-close></div><div class="yac-img-modal__card" role="dialog"><div class="yac-img-modal__handle" data-img-close></div><header class="yac-img-modal__head"><div><strong>ویرایش تصویر</strong><small id="yacImgPathLabel"></small></div><button type="button" class="icon-btn" data-img-close>✕</button></header><div class="yac-img-tabs" id="yacImgTabs"></div><div class="yac-img-body"><div class="yac-img-preview"><img id="yacImgPreview" /></div><div class="yac-img-controls"><div class="yac-img-row"><span>چرخش و آینه</span><div class="yac-img-btns"><button type="button" class="icon-btn" data-img-act="rotccw">⟲</button><button type="button" class="icon-btn" data-img-act="rotcw">⟳</button><button type="button" class="icon-btn" data-img-act="fliph">↔</button><button type="button" class="icon-btn" data-img-act="flipv">↕</button></div></div><label class="yac-img-slider"><span>افقی</span><input type="range" min="0" max="100" data-img-prop="posX" id="yacImgPosX" /><b id="yacImgPosXVal"></b></label><label class="yac-img-slider"><span>عمودی</span><input type="range" min="0" max="100" data-img-prop="posY" id="yacImgPosY" /><b id="yacImgPosYVal"></b></label><label class="yac-img-slider"><span>زوم</span><input type="range" min="100" max="200" data-img-prop="zoom" id="yacImgZoom" /><b id="yacImgZoomVal"></b></label><div class="yac-img-actions"><button type="button" class="btn ghost" data-img-act="reset">بازنشانی</button><button type="button" class="btn secondary" data-img-act="copyTablet">کپی به تبلت</button><button type="button" class="btn secondary" data-img-act="copyMobile">کپی به موبایل</button></div></div></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      if (e.target.closest("[data-img-close]")) { closeImageEditor(); return; }
      const tab = e.target.closest("[data-img-device]");
      if (tab) { imgEditor.device = tab.dataset.imgDevice; renderImgTabs(); updateImgEditorUI(); return; }
      const act = e.target.closest("[data-img-act]");
      if (act) handleImgAction(act.dataset.imgAct);
    });
    m.addEventListener("input", e => {
      const prop = e.target.dataset.imgProp;
      if (!prop) return;
      const s = currentSettings();
      if (!s) return;
      if (prop === "zoom") s.zoom = Number(e.target.value) / 100;
      else s[prop] = Number(e.target.value);
      setDirty(); updateImgEditorUI(); refreshFieldPreview(imgEditor.imagePath); refreshEditButtons();
    });
  }

  function renderImgTabs() {
    const t = byId("yacImgTabs");
    if (!t) return;
    t.innerHTML = DEVICES.map(d => '<button type="button" class="yac-img-tab' + (d.key === imgEditor.device ? " active" : "") + '" data-img-device="' + d.key + '">' + escapeHtml(d.label) + '</button>').join("");
  }

  function updateImgEditorUI() {
    const m = byId("yacImgModal");
    if (!m || m.hasAttribute("hidden")) return;
    const s = currentSettings();
    if (!s) return;
    const img = byId("yacImgPreview");
    if (img) applyImageStyle(img, s);
    const px = byId("yacImgPosX"), py = byId("yacImgPosY"), z = byId("yacImgZoom");
    if (px) px.value = s.posX;
    if (py) py.value = s.posY;
    if (z) z.value = Math.round((s.zoom || 1) * 100);
    setText(byId("yacImgPosXVal"), Math.round(s.posX) + "٪");
    setText(byId("yacImgPosYVal"), Math.round(s.posY) + "٪");
    setText(byId("yacImgZoomVal"), (s.zoom || 1).toFixed(1) + "×");
    $$(".yac-img-tab").forEach(b => b.classList.toggle("active", b.dataset.imgDevice === imgEditor.device));
    m.querySelectorAll('[data-img-act="fliph"]').forEach(b => b.classList.toggle("active", !!s.flipH));
    m.querySelectorAll('[data-img-act="flipv"]').forEach(b => b.classList.toggle("active", !!s.flipV));
  }

  function handleImgAction(a) {
    const s = currentSettings();
    if (!s) return;
    if (a === "rotcw") s.rotate = (s.rotate + 90) % 360;
    else if (a === "rotccw") s.rotate = ((s.rotate - 90) % 360 + 360) % 360;
    else if (a === "fliph") s.flipH = !s.flipH;
    else if (a === "flipv") s.flipV = !s.flipV;
    else if (a === "reset") Object.assign(s, DEFAULT_IMG);
    else if (a === "copyTablet" || a === "copyMobile") {
      const obj = getByPath(content, imgEditor.objectPath);
      if (!obj) return;
      const set = ensureImageSettings(obj);
      if (!set || !set[imgEditor.device]) return;
      set[a === "copyTablet" ? "tablet" : "mobile"] = Object.assign({}, set[imgEditor.device]);
      setDirty(); refreshEditButtons();
      toast("تنظیمات کپی شد", "success");
      return;
    }
    setDirty(); updateImgEditorUI(); refreshFieldPreview(imgEditor.imagePath); refreshEditButtons();
  }

  function openImageEditor(p) {
    if (!content) return;
    const op = imageObjectPath(p);
    const obj = getByPath(content, op);
    if (!obj) return;
    ensureImageSettings(obj);
    imgEditor.open = true; imgEditor.imagePath = p; imgEditor.objectPath = op; imgEditor.device = "desktop";
    ensureImageModal();
    const m = byId("yacImgModal"), pr = byId("yacImgPreview"), lb = byId("yacImgPathLabel");
    if (pr) pr.src = String(getByPath(content, p) || "");
    if (lb) lb.textContent = friendlyPath(p);
    renderImgTabs(); updateImgEditorUI();
    if (m) { m.removeAttribute("hidden"); document.body.style.overflow = "hidden"; }
  }

  function closeImageEditor() {
    imgEditor.open = false;
    const m = byId("yacImgModal");
    if (m) m.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  function normalizeContent(input) {
    const c = input || {};
    c.site = c.site || {};
    c.hero = c.hero || {};
    c.works = Array.isArray(c.works) ? c.works : [];
    c.categories = Array.isArray(c.categories) ? c.categories : [];
    c.locations = Array.isArray(c.locations) ? c.locations : [];
    c.locations.forEach(l => { l.works = Array.isArray(l.works) ? l.works : []; });
    c.services = Array.isArray(c.services) ? c.services : [];
    c.about = c.about || {};
    c.about.stats = Array.isArray(c.about.stats) ? c.about.stats : [];
    c.instagram = Array.isArray(c.instagram) ? c.instagram : [];
    c.contact = c.contact || {};
    c.contact.info = Array.isArray(c.contact.info) ? c.contact.info : [];
    migrateImageSettings(c);
    return c;
  }

  function renderBoundFields() {
    if (!content) return;
    $$("[data-bind]").forEach(el => {
      const v = getByPath(content, el.dataset.bind);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = v == null ? "" : v;
    });
    setPreview(heroPreview, content.hero && content.hero.image);
    setPreview(aboutPreview, content.about && content.about.image);
    refreshStaticEditButtons();
    refreshEditButtons();
  }

  function textField(l, p, v) {
    return '<label>' + escapeHtml(l) + '<input type="text" data-field="' + escapeHtml(p) + '" value="' + escapeHtml(v) + '" /></label>';
  }
  function textareaField(l, p, v) {
    return '<label class="full">' + escapeHtml(l) + '<textarea data-field="' + escapeHtml(p) + '">' + escapeHtml(v) + '</textarea></label>';
  }
  function imageField(l, p, v) {
    const op = imageObjectPath(p);
    const c = hasCustomSettings(op);
    return '<div class="image-field full">'
      + '<span class="image-field__thumb"><img src="' + escapeHtml(v) + '" alt="" loading="lazy" data-image-preview="' + escapeHtml(p) + '" /></span>'
      + '<div class="image-field__main">'
        + '<span class="image-field__label">' + escapeHtml(l) + '</span>'
        + '<div class="image-field__urlrow"><input type="text" data-field="' + escapeHtml(p) + '" value="' + escapeHtml(v) + '" placeholder="آدرس تصویر" /></div>'
        + '<div class="image-field__tools">'
          + '<label class="btn secondary upload-btn">⇪ آپلود<input type="file" accept="image/*" hidden data-upload-field="' + escapeHtml(p) + '" /></label>'
          + '<button type="button" class="btn ghost image-field__edit" data-image-edit="' + escapeHtml(p) + '">ویرایش و برش' + (c ? '<i class="image-field__dot"></i>' : "") + '</button>'
        + '</div>'
      + '</div></div>';
  }
  function itemActions(ap, i) {
    return '<div class="item-actions"><button type="button" class="icon-btn" data-action="move" data-array="' + escapeHtml(ap) + '" data-index="' + i + '" data-dir="-1">↑</button><button type="button" class="icon-btn" data-action="move" data-array="' + escapeHtml(ap) + '" data-index="' + i + '" data-dir="1">↓</button><button type="button" class="icon-btn danger" data-action="delete" data-array="' + escapeHtml(ap) + '" data-index="' + i + '">✕</button></div>';
  }
  function itemShell(ap, i, t, inner) {
    return '<article class="item-card"><header><span>' + escapeHtml(t) + '</span>' + itemActions(ap, i) + '</header><div class="fields">' + inner + '</div></article>';
  }

  function categorySelectHtml(i, cur) {
    if (!content.categories || !content.categories.length) return '<label>دسته‌بندی<input type="text" value="ابتدا یک دسته بسازید" disabled /></label>';
    const opts = content.categories.map(c => '<option value="' + escapeHtml(c.id) + '"' + (c.id === cur ? " selected" : "") + '>' + escapeHtml((c.icon || "") + " " + (c.name || "")) + '</option>').join("");
    return '<label>دسته‌بندی<select data-field="works[' + i + '].category"><option value="">بدون دسته</option>' + opts + '</select></label>';
  }

 function photoCardHtml(w, i, basePath, withCategory) {
  const fieldBase = basePath + "[" + i + "]";
  const key = fieldBase;
  const editing = !!uiState.editWorks[key];

  let catHtml;
  if (withCategory) {
    const cat = (content.categories || []).find(c => c.id === w.category);
    catHtml = '<span class="work-card__cat">' + escapeHtml(cat ? (cat.icon || "") + " " + (cat.name || "") : "بدون دسته") + '</span>';
  } else {
    catHtml = '<span class="work-card__cat">عکس ' + (i + 1) + '</span>';
  }

  return (
    '<article class="work-card' + (editing ? " editing" : "") + '" data-work-key="' + escapeHtml(key) + '">' +
      '<div class="work-card__media">' +
        '<img src="' + escapeHtml(w.image) + '" alt="" loading="lazy" data-image-preview="' + escapeHtml(fieldBase + ".image") + '" />' +
        catHtml +
        '<div class="work-card__overlay">' +
          '<button type="button" class="icon-btn" data-action="work-edit" data-key="' + escapeHtml(key) + '" title="ویرایش">✎</button>' +
          '<button type="button" class="icon-btn" data-action="move" data-array="' + escapeHtml(basePath) + '" data-index="' + i + '" data-dir="-1" title="بالا">↑</button>' +
          '<button type="button" class="icon-btn" data-action="move" data-array="' + escapeHtml(basePath) + '" data-index="' + i + '" data-dir="1" title="پایین">↓</button>' +
          '<button type="button" class="icon-btn danger" data-action="delete" data-array="' + escapeHtml(basePath) + '" data-index="' + i + '" title="حذف">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="work-card__body"><strong>' + escapeHtml(w.title || "عکس " + (i + 1)) + '</strong><small>' + escapeHtml(String(w.image || "").split("/").pop().split("?")[0]) + '</small></div>' +
      '<div class="work-card__editor"' + (editing ? "" : " hidden") + '>' +
        textField("عنوان", fieldBase + ".title", w.title) +
        (withCategory ? categorySelectHtml(i, w.category) : "") +
        imageField("تصویر", fieldBase + ".image", w.image) +
        '<div><button type="button" class="btn ghost" data-action="work-close" data-key="' + escapeHtml(key) + '">بستن ویرایش</button></div>' +
      '</div>' +
    '</article>'
  );
}

function renderWorks() {
  const target = worksListAlt || worksList;
  if (!target || !content) return;

  const cats = content.categories || [];
  const noneCount = content.works.filter(w => !w.category).length;

  const filterBar =
    '<div class="works-filter">' +
      '<button type="button" class="works-filter__btn' + (worksFilter === "all" ? " active" : "") + '" data-work-filter="all">همه (' + content.works.length + ')</button>' +
      cats.map(c => {
        const n = content.works.filter(w => w.category === c.id).length;
        return '<button type="button" class="works-filter__btn' + (worksFilter === c.id ? " active" : "") + '" data-work-filter="' + escapeHtml(c.id) + '">' + escapeHtml((c.icon || "") + " " + (c.name || "")) + ' (' + n + ')</button>';
      }).join("") +
      '<button type="button" class="works-filter__btn' + (worksFilter === "none" ? " active" : "") + '" data-work-filter="none">بدون دسته (' + noneCount + ')</button>' +
    '</div>';

  const filtered = content.works
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => {
      if (worksFilter === "all") return true;
      if (worksFilter === "none") return !w.category;
      return w.category === worksFilter;
    });

  const grid = filtered.length
          ? '<div class="works-grid">' + filtered.map(({ w, i }) => photoCardHtml(w, i, "works", true)).join("") + '</div>'
    : '<div class="activity-empty">هیچ نمونه‌کاری در این دسته نیست</div>';

  target.innerHTML = filterBar + grid;
}

  function renderCategories() {
    if (!content) return;
    if (!content.categories) content.categories = [];
    if (!categoriesList) return;
    setHtml(categoriesList, content.categories.map((c, i) => itemShell("categories", i, (c.icon || "") + " " + (c.name || "دسته " + (i + 1)), textField("نام دسته", "categories[" + i + "].name", c.name) + textField("آیکون", "categories[" + i + "].icon", c.icon))).join("") || '<div class="activity-empty">هنوز دسته‌بندی اضافه نشده</div>');
  }

function locationCardHtml(loc, i) {
  const works = loc.works || [];
  return (
    '<article class="work-card loc-card" data-loc-index="' + i + '">' +
      '<div class="work-card__media" data-action="loc-enter" data-index="' + i + '" style="cursor:pointer">' +
        '<img src="' + escapeHtml(loc.cover) + '" alt="" loading="lazy" />' +
        '<span class="work-card__cat">' + works.length + ' عکس</span>' +
        '<div class="work-card__overlay">' +
          '<button type="button" class="icon-btn" data-action="loc-enter" data-index="' + i + '" title="مشاهده و مدیریت عکس‌ها">▤</button>' +
          '<button type="button" class="icon-btn" data-action="loc-edit" data-index="' + i + '" title="ویرایش اطلاعات لوکیشن">✎</button>' +
          '<button type="button" class="icon-btn" data-action="move" data-array="locations" data-index="' + i + '" data-dir="-1" title="بالا">↑</button>' +
          '<button type="button" class="icon-btn" data-action="move" data-array="locations" data-index="' + i + '" data-dir="1" title="پایین">↓</button>' +
          '<button type="button" class="icon-btn danger" data-action="delete" data-array="locations" data-index="' + i + '" title="حذف">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="work-card__body" data-action="loc-enter" data-index="' + i + '" style="cursor:pointer">' +
        '<strong>' + escapeHtml(loc.title || "لوکیشن " + (i + 1)) + '</strong>' +
        '<small>' + escapeHtml(loc.subtitle || "") + '</small>' +
      '</div>' +
    '</article>'
  );
}

function locationDetailHtml(loc, i) {
  const lp = "locations[" + i + "]";
  const wp = lp + ".works";
  const works = loc.works || [];
  const isEdit = !!uiState.editLocations[i];

  const photosGrid = works.length
    ? '<div class="works-grid works-grid--nested">' + works.map((w, j) => photoCardHtml(w, j, wp, false)).join("") + '</div>'
    : '<div class="activity-empty">هنوز عکسی برای این لوکیشن ثبت نشده. از دکمه «+ افزودن عکس» استفاده کن.</div>';

  return (
    '<div class="loc-detail">' +
      '<div class="loc-detail__head">' +
        '<button type="button" class="btn ghost" data-action="loc-back">→ بازگشت به لوکیشن‌ها</button>' +
        '<div class="loc-detail__title">' +
          '<h3>' + escapeHtml(loc.title || "لوکیشن " + (i + 1)) + '</h3>' +
          '<small>' + works.length + ' عکس ثبت شده</small>' +
        '</div>' +
        '<div class="loc-detail__actions">' +
          '<button type="button" class="btn secondary" data-action="loc-edit" data-index="' + i + '">✎ ویرایش اطلاعات</button>' +
          '<button type="button" class="btn secondary" data-action="add" data-array="' + escapeHtml(wp) + '">+ افزودن عکس</button>' +
        '</div>' +
      '</div>' +
      (isEdit
        ? '<div class="loc-detail__editor">' +
            textField("عنوان لوکیشن", lp + ".title", loc.title) +
            textField("زیرعنوان", lp + ".subtitle", loc.subtitle) +
            imageField("تصویر کاور", lp + ".cover", loc.cover) +
            '<div><button type="button" class="btn ghost" data-action="loc-close" data-index="' + i + '">بستن ویرایش</button></div>' +
          '</div>'
        : "") +
      '<div class="loc-detail__cover"><img src="' + escapeHtml(loc.cover) + '" alt="" data-image-preview="' + escapeHtml(lp + ".cover") + '" /></div>' +
      photosGrid +
    '</div>'
  );
}

function renderLocations() {
  if (!content) return;

  if (currentLocationIndex != null && content.locations[currentLocationIndex]) {
    setHtml(locationsList, locationDetailHtml(content.locations[currentLocationIndex], currentLocationIndex));
    return;
  }

  currentLocationIndex = null;
  const html = content.locations.length
    ? '<div class="works-grid works-grid--locs">' + content.locations.map((loc, i) => locationCardHtml(loc, i)).join("") + '</div>'
    : '<div class="activity-empty">هنوز لوکیشنی اضافه نشده</div>';
  setHtml(locationsList, html);
}

  function renderServices() {
    if (!content) return;
    setHtml(servicesList, content.services.map((s, i) => itemShell("services", i, "خدمت " + (i + 1), textField("آیکون", "services[" + i + "].icon", s.icon) + textField("عنوان", "services[" + i + "].title", s.title) + textareaField("متن", "services[" + i + "].text", s.text))).join("") || '<div class="activity-empty">هنوز خدمتی اضافه نشده</div>');
  }

  function renderStats() {
    if (!content) return;
    const items = content.about.stats.map((s, i) =>
      '<div class="stat-item"><div class="stat-item__vals">'
      + '<input type="text" data-field="about.stats[' + i + '].value" value="' + escapeHtml(s.value) + '" placeholder="عدد" />'
      + '<input type="text" data-field="about.stats[' + i + '].label" value="' + escapeHtml(s.label) + '" placeholder="برچسب" />'
      + '</div><div class="stat-item__acts">' + itemActions("about.stats", i) + '</div></div>'
    ).join("");
    setHtml(statsList, items ? '<div class="stats-row">' + items + '</div>' : '<div class="activity-empty">هنوز آماری اضافه نشده</div>');
  }

  function renderInstagram() {
    if (!content) return;
    const tiles = content.instagram.map((p, i) => {
      const editing = !!uiState.editIg[i];
      return '<figure class="ig-tile' + (editing ? " editing" : "") + '">'
        + '<img src="' + escapeHtml(p.image) + '" alt="" loading="lazy" decoding="async" data-image-preview="instagram[' + i + '].image" />'
        + (editing
          ? '<figcaption class="ig-tile__edit">'
            + '<span class="ig-tile__lbl">لینک پست</span>'
            + '<input type="text" data-field="instagram[' + i + '].href" value="' + escapeHtml(p.href || "") + '" placeholder="https://instagram.com/p/…" />'
            + '<div class="image-field__tools">'
              + '<label class="btn secondary upload-btn">⇪ آپلود<input type="file" accept="image/*" hidden data-upload-field="instagram[' + i + '].image" /></label>'
              + '<button type="button" class="btn ghost" data-action="ig-close" data-index="' + i + '">بستن ✕</button>'
            + '</div>'
          + '</figcaption>'
          : '<figcaption class="ig-tile__ov">'
            + '<button type="button" class="icon-btn" data-action="ig-edit" data-index="' + i + '" title="ویرایش">✎</button>'
            + itemActions("instagram", i)
          + '</figcaption>')
        + '</figure>';
    }).join("");
    const add = '<figure class="ig-tile ig-tile--add"><button type="button" class="ig-tile__add" data-action="add" data-array="instagram"><span>+</span>افزودن پست</button></figure>';
    setHtml(instagramList, '<div class="ig-grid">' + tiles + add + '</div>');
  }

  function renderContactInfo() {
    if (!content) return;
    setHtml(contactInfoList, content.contact.info.map((c, i) => itemShell("contact.info", i, "اطلاعات " + (i + 1), textField("برچسب", "contact.info[" + i + "].label", c.label) + textField("مقدار", "contact.info[" + i + "].value", c.value) + textField("لینک", "contact.info[" + i + "].href", c.href))).join("") || '<div class="activity-empty">هنوز اطلاعاتی اضافه نشده</div>');
  }

  function faDigits(n) { return String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]); }

  function bindImageMeta(imgId, chipId) {
    const img = byId(imgId), chip = byId(chipId);
    if (!img || !chip) return;
    const upd = () => { chip.textContent = img.naturalWidth ? faDigits(img.naturalWidth) + " × " + faDigits(img.naturalHeight) : ""; };
    img.addEventListener("load", upd);
    if (img.complete && img.naturalWidth) upd();
  }

  async function loadMedia() {
    try {
      const media = await api("/api/media");
      mediaCache = Array.isArray(media) ? media : [];
      renderMedia();
      const ts = mediaCache.reduce((s, m) => s + Number(m.size || 0), 0);
      setText(countMedia, mediaCache.length);
      setText(mediaSize, formatBytes(ts));
    } catch (e) {
      setText(countMedia, "0"); setText(mediaSize, "0 KB");
      setHtml(mediaGrid, '<div class="activity-empty">خطا در بارگذاری مدیا</div>');
    }
  }

  function renderMedia() {
    if (!mediaGrid) return;
    const total = mediaCache.length;
    const ts = mediaCache.reduce((s, m) => s + Number(m.size || 0), 0);
    const chip = byId("mediaCount");
    if (chip) chip.textContent = faDigits(total) + " تصویر · " + formatBytes(ts);
    const q = mediaQuery.trim().toLowerCase();
    const filtered = q ? mediaCache.filter(m => String(m.filename || "").toLowerCase().indexOf(q) !== -1) : mediaCache;
    const pages = Math.max(1, Math.ceil(filtered.length / MEDIA_PER_PAGE));
    if (mediaPage > pages) mediaPage = pages;
    const start = (mediaPage - 1) * MEDIA_PER_PAGE;
    const slice = filtered.slice(start, start + MEDIA_PER_PAGE);
    const cards = slice.map(m => {
      const name = String(m.filename || "");
      return '<figure class="mcell">'
        + '<div class="mcell__img"><img src="' + escapeHtml(m.url) + '" alt="" loading="lazy" decoding="async" />'
        + '<div class="mcell__ov">'
        + '<button type="button" class="btn ghost" data-action="copy-media" data-url="' + escapeHtml(m.url) + '">کپی لینک</button>'
        + '<button type="button" class="btn danger" data-action="delete-media" data-filename="' + escapeHtml(m.filename) + '">حذف</button>'
        + '</div></div>'
        + '<figcaption class="mcell__meta"><span class="mcell__name" title="' + escapeHtml(name) + '">' + escapeHtml(name) + '</span>'
        + '<span class="mcell__size">' + formatBytes(Number(m.size || 0)) + '</span></figcaption>'
        + '</figure>';
    }).join("");
    let pagerHtml = "";
    if (pages > 1) {
      let btns = "";
      for (let pg = 1; pg <= pages; pg++) btns += '<button type="button" class="pager__btn' + (pg === mediaPage ? " active" : "") + '" data-action="media-page" data-page="' + pg + '">' + faDigits(pg) + '</button>';
      pagerHtml = '<div class="pager"><span class="pager__info">' + faDigits(filtered.length) + ' تصویر — صفحه ' + faDigits(mediaPage) + ' از ' + faDigits(pages) + '</span>' + btns + '</div>';
    }
    setHtml(mediaGrid, cards || '<div class="activity-empty">' + (q ? "چیزی پیدا نشد" : "هنوز تصویری آپلود نشده") + '</div>');
    const pager = byId("mediaPager");
    if (pager) pager.innerHTML = pagerHtml;
  }

  function buildWeekData(inqs) {
    const days = [], today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = d.toDateString();
      days.push({ label: d.toLocaleDateString("fa-IR", { weekday: "short" }), count: inqs.filter(q => new Date(q.date).toDateString() === k).length });
    }
    return days;
  }

  function drawWeekChart(wd) {
    if (!weekChart || !Array.isArray(wd) || !wd.length) return;
    const W = 600, H = 180, pX = 30, pY = 20;
    const max = Math.max(3, ...wd.map(d => Number(d.count || 0)));
    const sX = (W - pX * 2) / Math.max(1, wd.length - 1);
    const pts = wd.map((d, i) => [pX + i * sX, H - pY - (Number(d.count || 0) / max) * (H - pY * 2)]);
    const lp = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + " " + p[1]).join(" ");
    const ap = lp + " L" + pts[pts.length - 1][0] + " " + (H - pY) + " L" + pts[0][0] + " " + (H - pY) + " Z";
    let g = "";
    for (let i = 0; i < 4; i++) { const y = pY + i * ((H - pY * 2) / 3); g += '<line x1="' + pX + '" y1="' + y + '" x2="' + (W - pX) + '" y2="' + y + '" stroke="rgba(255,255,255,0.05)" stroke-dasharray="4 4"/>'; }
    const lb = pts.map((p, i) => '<text x="' + p[0] + '" y="' + (H - 4) + '" text-anchor="middle" fill="#8a837a" font-size="11">' + escapeHtml(wd[i].label) + '</text>').join("");
    const dt = pts.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#d4a853" stroke="#050505" stroke-width="2"/>').join("");
    weekChart.innerHTML = '<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d4a853" stop-opacity="0.35"/><stop offset="100%" stop-color="#d4a853" stop-opacity="0"/></linearGradient><linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#e8c98a"/><stop offset="100%" stop-color="#d4a853"/></linearGradient></defs>' + g + '<path d="' + ap + '" fill="url(#areaG)"/><path d="' + lp + '" fill="none" stroke="url(#lineG)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + dt + lb;
  }

  function renderRecentInquiries(inqs) {
    if (!recentInquiries) return;
    if (!inqs.length) { setHtml(recentInquiries, '<div class="activity-empty">هنوز درخواستی نیست</div>'); return; }
    setHtml(recentInquiries, inqs.slice(0, 6).map(q => {
      const d = new Date(q.date), days = Math.floor((Date.now() - d.getTime()) / 86400000);
      const w = days === 0 ? "امروز" : days === 1 ? "دیروز" : days + " روز پیش";
      return '<div class="activity-item"><div class="activity-av">' + escapeHtml((q.name || "?")[0]) + '</div><div class="activity-body"><strong>' + escapeHtml(q.name || "") + '</strong><small>' + escapeHtml(q.phone || "") + ' • ' + escapeHtml(q.service || "-") + '</small></div><span class="activity-meta">' + w + '</span></div>';
    }).join(""));
  }

  function renderInquiries(inqs) {
    if (!inquiriesList) return;
    if (!inqs.length) { setHtml(inquiriesList, '<div class="activity-empty">هنوز درخواستی ثبت نشده</div>'); return; }
    const labels = { modeling: "مدلینگ", outdoor: "فضای باز", commercial: "تبلیغاتی", branding: "برندینگ", other: "سایر" };
    setHtml(inquiriesList, inqs.map(q => {
      const d = new Date(q.date), ds = d.toLocaleDateString("fa-IR") + " — " + d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      const st = labels[q.service] || q.service || "-";
      return '<article class="item-card"><header><span>' + escapeHtml(q.name || "") + '</span><div class="item-actions"><a href="tel:' + escapeHtml(q.phone || "") + '" class="btn ghost">تماس</a><button type="button" class="btn ghost" data-action="copy-phone" data-phone="' + escapeHtml(q.phone || "") + '">کپی شماره</button><button type="button" class="btn danger" data-action="delete-inquiry" data-id="' + escapeHtml(q.id || "") + '">حذف</button></div></header><div class="fields"><label>شماره تماس<input type="text" value="' + escapeHtml(q.phone || "") + '" readonly /></label><label>خدمت درخواستی<input type="text" value="' + escapeHtml(st) + '" readonly /></label>' + (q.email ? '<label>ایمیل<input type="text" value="' + escapeHtml(q.email) + '" readonly /></label>' : "") + '<label class="full">توضیحات<textarea readonly>' + escapeHtml(q.message || "") + '</textarea></label><label class="full">تاریخ<input type="text" value="' + escapeHtml(ds) + '" readonly /></label></div></article>';
    }).join(""));
  }

  async function loadInquiries() {
    try {
      const inqs = await api("/api/inquiries");
      lastInquiries = Array.isArray(inqs) ? inqs : [];
      const c = lastInquiries.length;
      setText(countInquiries, c); setText(countInquiriesAlt, c);
      if (inquiryBadge) { inquiryBadge.textContent = c; inquiryBadge.hidden = c === 0; }
      if (bnBadge) { bnBadge.textContent = c; bnBadge.hidden = c === 0; }
      if (latestInquiry) latestInquiry.textContent = c ? lastInquiries[0].name + " — " + new Date(lastInquiries[0].date).toLocaleDateString("fa-IR") : "-";
      const now = new Date(), tk = now.toDateString();
      setText(todayInquiries, lastInquiries.filter(q => new Date(q.date).toDateString() === tk).length);
      setText(weekInquiries, lastInquiries.filter(q => (now - new Date(q.date)) < 7 * 86400000).length);
      renderRecentInquiries(lastInquiries); renderInquiries(lastInquiries); drawWeekChart(buildWeekData(lastInquiries));
    } catch (e) {
      setText(countInquiries, "0"); setText(countInquiriesAlt, "0"); setText(todayInquiries, "0"); setText(weekInquiries, "0");
      if (inquiryBadge) inquiryBadge.hidden = true;
      if (bnBadge) bnBadge.hidden = true;
      setHtml(inquiriesList, '<div class="activity-empty">خطا در بارگذاری درخواست‌ها</div>');
      setHtml(recentInquiries, '<div class="activity-empty">خطا در بارگذاری</div>');
    }
  }

  async function loadDashboardStats() {
    try {
      const s = await api("/api/stats");
      setText(countWorks, s.counts.works); setText(countLocations, s.counts.locations); setText(countServices, s.counts.services); setText(countMedia, s.counts.media); setText(countInquiries, s.counts.inquiries);
      setText(todayInquiries, s.inquiries.today); setText(weekInquiries, s.inquiries.week);
      setText(storageInfo, formatBytes(s.storage.totalBytes)); setText(mediaSize, formatBytes(s.storage.mediaBytes));
      if (lastChange && s.lastModified) lastChange.textContent = new Date(s.lastModified).toLocaleString("fa-IR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      drawWeekChart(s.inquiries.weekData);
      const sb = (sel, pct) => { const el = $(sel + " .stat-bar i"); if (el) el.style.width = Math.max(0, Math.min(100, pct)) + "%"; };
      sb(".stat-works", (s.counts.works / 20) * 100); sb(".stat-locations", (s.counts.locations / 10) * 100); sb(".stat-services", (s.counts.services / 6) * 100); sb(".stat-media", (s.counts.media / 50) * 100);
    } catch (e) {
      if (content) { setText(countWorks, content.works.length); setText(countLocations, content.locations.length); setText(countServices, content.services.length); }
      drawWeekChart(buildWeekData(lastInquiries));
    }
  }

  function renderDashboard() {
    if (!content) return;
    setText(countWorks, content.works.length); setText(countLocations, content.locations.length); setText(countServices, content.services.length);
  }

  function renderAll() {
    renderBoundFields(); renderDashboard(); renderCategories(); renderWorks(); renderLocations(); renderServices(); renderStats(); renderInstagram(); renderContactInfo();
    loadMedia(); loadInquiries(); loadDashboardStats();
  }

  async function loadContent() {
    const data = await api("/api/content");
    content = normalizeContent(data);
    renderAll(); clearDirty();
  }

  async function checkAuth() {
    try {
      const me = await api("/api/me");
      if (me.authenticated) { await loadContent(); showApp(); } else showLogin();
    } catch (e) { showLogin(); }
  }

  function createItem(ap) {
    if (ap === "works" || ap.endsWith(".works")) return { id: uid(), title: "عنوان جدید", image: "https://picsum.photos/seed/" + uid() + "/800/1060", category: (content.categories && content.categories.length > 0) ? content.categories[0].id : "" };
    if (ap === "categories") return { id: "cat" + Date.now(), name: "دسته جدید", icon: "" };
    if (ap === "locations") return { id: uid(), title: "لوکیشن جدید", subtitle: "توضیح", cover: "https://picsum.photos/seed/" + uid() + "/900/1200", works: [] };
    if (ap === "services") return { icon: "✦", title: "خدمت جدید", text: "توضیح" };
    if (ap === "about.stats") return { value: "+1", label: "آمار" };
    if (ap === "instagram") return { image: "https://picsum.photos/seed/" + uid() + "/600/600", href: "https://instagram.com/yacin_photo" };
    if (ap === "contact.info") return { label: "عنوان", value: "مقدار", href: "" };
    return {};
  }

  async function uploadFile(f) {
    const fd = new FormData(); fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    if (res.status === 401) { showLogin(); throw new Error("جلسه منقضی شده"); }
    if (!res.ok) throw new Error(d.error || "آپلود ناموفق");
    return d.url;
  }

  function updatePreviewForField(f, v) { syncFieldInputs(f, v); refreshFieldPreview(f); }

  function switchPanel(p, t, d) {
    const m = PANEL_META[p] || ["", ""];
    const ft = t || m[0], fd = d || m[1];
    $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.panel === p));
    $$(".bn-item").forEach(b => b.classList.toggle("active", b.dataset.panel === p));
    $$(".panel").forEach(x => x.classList.remove("active"));
    const tg = byId("panel-" + p);
    if (tg) tg.classList.add("active");
    setText(sectionTitle, ft); setText(sectionDesc, fd);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openMore() { if (!moreSheet) return; moreSheet.removeAttribute("hidden"); document.body.style.overflow = "hidden"; }
  function closeMore() { if (!moreSheet) return; moreSheet.setAttribute("hidden", ""); document.body.style.overflow = ""; }

  function bindEvents() {
    if (loginForm) {
      loginForm.addEventListener("submit", async e => {
        e.preventDefault();
        if (loginError) loginError.textContent = "";
        const sc = document.getElementById("loginScene"), sb = loginForm.querySelector('button[type="submit"]');
        try {
          await api("/api/login", { method: "POST", body: JSON.stringify({ password: passwordInput.value }) });
          if (sc) sc.classList.add("success");
          if (sb) { sb.disabled = true; sb.textContent = "✓ وارد شدی"; }
          await new Promise(r => setTimeout(r, 700));
          if (passwordInput) passwordInput.value = "";
          await checkAuth();
          toast("ورود موفق", "success");
        } catch (err) {
          if (sc) sc.classList.remove("success");
          if (sb) { sb.disabled = false; sb.textContent = "ورود"; }
          if (loginError) loginError.textContent = err.message || "رمز اشتباه";
        }
      });
    }

    [logoutBtn, logoutBtnMobile].forEach(b => {
      if (!b) return;
      b.addEventListener("click", async () => {
        try { await api("/api/logout", { method: "POST" }); } finally { closeMore(); showLogin(); toast("خروج انجام شد", "success"); }
      });
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (!content) return;
        try { await api("/api/content", { method: "POST", body: JSON.stringify(content) }); clearDirty(); loadDashboardStats(); toast("تغییرات ذخیره شد", "success"); } catch (e) { toast(e.message, "error"); }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        if (!content) return;
        const b = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
        const u = URL.createObjectURL(b), a = document.createElement("a");
        a.href = u; a.download = "yacin-backup-" + Date.now() + ".json"; a.click(); URL.revokeObjectURL(u);
        toast("بکاپ دانلود شد", "success");
      });
    }

    if (importBtn && importFile) {
      importBtn.addEventListener("click", () => importFile.click());
      importFile.addEventListener("change", async e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        try { content = normalizeContent(JSON.parse(await f.text())); renderAll(); setDirty(); toast("بکاپ بارگذاری شد", "success"); } catch (err) { toast("فایل معتبر نیست", "error"); }
        importFile.value = "";
      });
    }

    $$(".nav-btn").forEach(b => { if (!b.dataset.panel) return; b.addEventListener("click", () => switchPanel(b.dataset.panel, b.dataset.title, b.dataset.desc)); });

    // ═══════════════════════════════════════
    // EVENT DELEGATION برای Bottom Nav (به جای forEach)
    // این روش حتی اگر HTML دیرتر اضافه شود هم کار می‌کند
    // ═══════════════════════════════════════
    document.addEventListener("click", (e) => {
      const bnItem = e.target.closest(".bn-item");
      if (bnItem) {
        // دکمه بیشتر
        if (bnItem.id === "bnMore") {
          openMore();
          return;
        }
        // دکمه‌های عادی
        if (bnItem.dataset.panel) {
          switchPanel(bnItem.dataset.panel, bnItem.dataset.title, bnItem.dataset.desc);
        }
        return;
      }

      // کلیک روی backdrop More Sheet
      if (e.target === moreSheet) {
        closeMore();
        return;
      }

      // کلیک روی لینک‌های More Sheet
      const moreLink = e.target.closest(".more-sheet__link");
      if (moreLink && moreLink.dataset.panel) {
        switchPanel(moreLink.dataset.panel);
        closeMore();
        return;
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (imgEditor.open) { closeImageEditor(); return; }
        closeMore();
      }
    });

    $$("[data-qa]").forEach(b => {
      b.addEventListener("click", () => {
        const a = b.dataset.qa;
        if (a === "new-work") { switchPanel("works"); setTimeout(() => { const ab = document.querySelector('#panel-works [data-action="add"][data-array="works"]'); if (ab) ab.click(); }, 120); }
        if (a === "upload-media") switchPanel("media");
        if (a === "view-site") window.open("/", "_blank");
      });
    });

    document.addEventListener("input", e => {
      if (!content) return;
      if (e.target && e.target.id === "mediaSearch") { mediaQuery = e.target.value || ""; mediaPage = 1; renderMedia(); return; }
      const f = e.target.dataset.field, b = e.target.dataset.bind;
      if (f) { setByPath(content, f, e.target.value); setDirty(); if (/image|cover/i.test(f)) refreshFieldPreview(f); }
      if (b) { setByPath(content, b, e.target.value); setDirty(); if (b === "hero.image" || b === "about.image") refreshFieldPreview(b); }
    });

    document.addEventListener("change", async e => {
      if (!content) return;
      if (e.target.matches('input[type="file"][data-upload-field]')) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const field = e.target.dataset.uploadField;
        try { const url = await uploadFile(f); setByPath(content, field, url); updatePreviewForField(field, url); setDirty(); toast("تصویر آپلود شد", "success"); } catch (err) { toast(err.message, "error"); }
        e.target.value = "";
      }
      if (e.target === mediaUpload) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        try { for (let i = 0; i < files.length; i++) await uploadFile(files[i]); await loadMedia(); await loadDashboardStats(); toast(files.length + " تصویر آپلود شد", "success"); } catch (err) { toast(err.message, "error"); }
        e.target.value = "";
      }
    });

    $$(".upload-zone").forEach(z => {
      ["dragenter", "dragover"].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add("dragging"); }));
      ["dragleave", "drop"].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove("dragging"); }));
      z.addEventListener("drop", async e => {
        if (!content) return;
        const files = Array.from(e.dataTransfer.files || []).filter(f => f.type && f.type.startsWith("image/"));
        if (!files.length) return;
        const t = z.dataset.dropTarget;
        if (t === "media") { try { for (let i = 0; i < files.length; i++) await uploadFile(files[i]); await loadMedia(); await loadDashboardStats(); toast(files.length + " تصویر آپلود شد", "success"); } catch (err) { toast(err.message, "error"); } return; }
        if (!t) return;
        try { const url = await uploadFile(files[0]); setByPath(content, t, url); updatePreviewForField(t, url); setDirty(); toast("آپلود شد", "success"); } catch (err) { toast(err.message, "error"); }
      });
    });

    const mediaDropzone = document.querySelector("#panel-media .dropbar");
    if (mediaDropzone) mediaDropzone.addEventListener("click", () => { if (mediaUpload) mediaUpload.click(); });

    document.addEventListener("click", async e => {
      const eb = e.target.closest("[data-image-edit]");
      if (eb) { e.preventDefault(); openImageEditor(eb.dataset.imageEdit); return; }
            const filterBtn = e.target.closest("[data-work-filter]");
      if (filterBtn && content) {
        worksFilter = filterBtn.dataset.workFilter;
        renderWorks();
        return;
      }
      const btn = e.target.closest("[data-action]");
      if (!btn || !content) return;
      const a = btn.dataset.action, ap = btn.dataset.array, idx = Number(btn.dataset.index), dir = Number(btn.dataset.dir);
      if (a === "media-page") { mediaPage = Math.max(1, Number(btn.dataset.page) || 1); renderMedia(); const g = byId("mediaGrid"); if (g) g.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
      if (a === "ig-edit") { uiState.editIg[btn.dataset.index] = true; renderInstagram(); return; }
      if (a === "ig-close") { delete uiState.editIg[btn.dataset.index]; renderInstagram(); return; }
      if (a === "copy-field") { try { await navigator.clipboard.writeText(String(getByPath(content, btn.dataset.field) || "")); toast("آدرس کپی شد", "success"); } catch (err) { toast("کپی نشد", "error"); } return; }
                if (a === "work-edit") {
        const key = btn.dataset.key;
        uiState.editWorks[key] = true;
        const card = btn.closest(".work-card");
        if (card) { card.classList.add("editing"); const ed = card.querySelector(".work-card__editor"); if (ed) ed.hidden = false; }
        return;
      }
      if (a === "work-close") {
        const key = btn.dataset.key;
        delete uiState.editWorks[key];
        const card = btn.closest(".work-card");
        if (card) { card.classList.remove("editing"); const ed = card.querySelector(".work-card__editor"); if (ed) ed.hidden = true; }
        return;
      }
            if (a === "loc-enter") {
        currentLocationIndex = Number(btn.dataset.index);
        renderLocations();
        return;
      }
      if (a === "loc-back") {
        currentLocationIndex = null;
        renderLocations();
        return;
      }
      if (a === "loc-edit") {
        const idx = Number(btn.dataset.index);
        if (currentLocationIndex == null) {
          currentLocationIndex = idx;
          uiState.editLocations[idx] = true;
          renderLocations();
          return;
        }
        uiState.editLocations[idx] = !uiState.editLocations[idx];
        renderLocations();
        return;
      }
      if (a === "loc-close") {
        delete uiState.editLocations[Number(btn.dataset.index)];
        renderLocations();
        return;
      }
      if (a === "add-category") { if (!content.categories) content.categories = []; content.categories.push({ id: "cat" + Date.now(), name: "دسته جدید", icon: "" }); renderCategories(); setDirty(); toast("دسته جدید اضافه شد", "success"); return; }
      if (a === "delete-category") { if (!confirm("حذف این دسته؟")) return; content.categories.splice(idx, 1); renderCategories(); setDirty(); toast("دسته حذف شد", "success"); return; }
            if (a === "add") { const arr = getByPath(content, ap); if (Array.isArray(arr)) { arr.push(createItem(ap)); if (ap === "works") worksFilter = "all"; renderAll(); setDirty(); toast("آیتم جدید اضافه شد", "success"); } return; }
            if (a === "delete") {
        if (!confirm("آیا از حذف مطمئن هستید؟")) return;
        const arr = getByPath(content, ap);
        if (Array.isArray(arr)) {
          arr.splice(idx, 1);
          if (ap === "locations" && currentLocationIndex != null) {
            if (idx === currentLocationIndex) currentLocationIndex = null;
            else if (idx < currentLocationIndex) currentLocationIndex--;
          }
          renderAll(); setDirty(); toast("آیتم حذف شد", "success");
        }
        return;
      }
            if (a === "move") {
        const arr = getByPath(content, ap);
        if (!Array.isArray(arr)) return;
        const t = idx + dir;
        if (t < 0 || t >= arr.length) return;
        const currentLoc = (ap === "locations" && currentLocationIndex != null) ? arr[currentLocationIndex] : null;
        const tmp = arr[idx]; arr[idx] = arr[t]; arr[t] = tmp;
        if (currentLoc) currentLocationIndex = arr.indexOf(currentLoc);
        renderAll(); setDirty();
        return;
      }
      if (a === "pick-file") { const t = btn.dataset.target, inp = document.querySelector('input[type="file"][data-upload-field="' + attrEscape(t) + '"]'); if (inp) inp.click(); return; }
      if (a === "copy-media") { try { await navigator.clipboard.writeText(btn.dataset.url || ""); toast("لینک کپی شد", "success"); } catch (err) { toast("کپی ناموفق", "error"); } return; }
      if (a === "copy-phone") { try { await navigator.clipboard.writeText(btn.dataset.phone || ""); toast("شماره کپی شد", "success"); } catch (err) { toast("کپی ناموفق", "error"); } return; }
      if (a === "delete-inquiry") { if (!confirm("این درخواست حذف شود؟")) return; try { await api("/api/inquiries", { method: "DELETE", body: JSON.stringify({ id: btn.dataset.id }) }); await loadInquiries(); await loadDashboardStats(); toast("درخواست حذف شد", "success"); } catch (err) { toast(err.message, "error"); } return; }
      if (a === "delete-media") { if (!confirm("این تصویر حذف شود؟")) return; try { await api("/api/media", { method: "DELETE", body: JSON.stringify({ filename: btn.dataset.filename }) }); await loadMedia(); await loadDashboardStats(); toast("تصویر حذف شد", "success"); } catch (err) { toast(err.message, "error"); } }
    });

    [refreshInquiries, refreshInquiriesAlt].forEach(b => { if (!b) return; b.addEventListener("click", async () => { await loadInquiries(); await loadDashboardStats(); toast("به‌روزرسانی شد", "success"); }); });

    window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  }

  function initLoginLamp() {
    const sc = document.getElementById("loginScene"), cord = document.getElementById("loginLampCord"), pw = document.getElementById("password");
    if (!sc || !cord) return;
    sc.classList.add("prepared");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rm) { sc.classList.add("on"); return; }
    function turnOn() { if (sc.classList.contains("on")) return; cord.classList.add("pull"); setTimeout(() => cord.classList.remove("pull"), 220); sc.classList.add("on"); setTimeout(() => { if (pw) pw.focus({ preventScroll: true }); }, 420); }
    cord.addEventListener("click", turnOn);
    cord.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); turnOn(); } });
  }

  initLoginLamp();
  bindEvents();
  checkAuth();
})();

// ═══ sync خودکار badge درخواست‌ها روی نوبار موبایل (خارج از IIFE اصلی) ═══
(function syncInquiryBadge() {
  function update() {
    const src = document.getElementById("countInquiries");
    const badge = document.getElementById("bnInquiryBadge");
    if (!badge) return;
    const n = src ? (parseInt(src.textContent, 10) || 0) : 0;
    badge.textContent = n;
    badge.hidden = n === 0;
  }
  update();
  setInterval(update, 1500);
})();