try { require("dotenv").config(); } catch (_) {}

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const ROOT = __dirname;

const DATA_DIR = path.join(ROOT, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");
const PASSWORD_FILE = path.join(DATA_DIR, "admin-password.json");
const SITE_FILE = path.join(ROOT, "js", "site-content.js");
const UPLOAD_DIR = path.join(ROOT, "assets", "uploads");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const sessions = new Map();

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(path.dirname(SITE_FILE), { recursive: true });

/* ═══════════════════════════════════════════════════════
   ۱) سیستم رمز هش‌شده (scrypt + salt)
═══════════════════════════════════════════════════════ */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return {
    version: 1, algorithm: "scrypt",
    salt: salt, hash: hash,
    updatedAt: new Date().toISOString()
  };
}

function verifyHashedPassword(password, store) {
  if (!store || !store.salt || !store.hash) return false;
  try {
    const candidate = crypto.scryptSync(String(password), store.salt, 64).toString("hex");
    const a = Buffer.from(candidate, "hex");
    const b = Buffer.from(store.hash, "hex");
    if (a.length !== b.length) { crypto.timingSafeEqual(a, a); return false; }
    return crypto.timingSafeEqual(a, b);
  } catch (_) { return false; }
}

function loadPasswordStore() {
  try {
    const data = JSON.parse(fs.readFileSync(PASSWORD_FILE, "utf8"));
    if (data && data.salt && data.hash) return data;
  } catch (_) {}
  return null;
}

function savePasswordStore(store) {
  writeFileAtomic(PASSWORD_FILE, JSON.stringify(store, null, 2));
}

let adminPasswordStore = loadPasswordStore();

if (!adminPasswordStore) {
  if (!ADMIN_PASSWORD || String(ADMIN_PASSWORD).length < 8 || ADMIN_PASSWORD === "yacin123") {
    console.error("❌ خطای امنیتی: ADMIN_PASSWORD تنظیم نشده یا ضعیف است.");
    console.error('   در فایل .env: ADMIN_PASSWORD="یک_رمز_قوی_حداقل_۸_کاراکتر"');
    process.exit(1);
  }
  adminPasswordStore = hashPassword(ADMIN_PASSWORD);
  savePasswordStore(adminPasswordStore);
  console.log("✅ رمز ادمین از env خوانده و هش شد: data/admin-password.json");
}

function checkAdminPassword(password) {
  return verifyHashedPassword(password, adminPasswordStore);
}

/* ═══════════════════════════════════════════════════════
   ۲) محتوای پیش‌فرض
═══════════════════════════════════════════════════════ */
const defaultContent = {
  site: {
    title: "Yacin Photo | عکاسی مدلینگ، فضای باز و تبلیغاتی",
    description: "Yacin Photo | عکاسی حرفه‌ای مدلینگ، فضای باز، تبلیغاتی و برندینگ",
    whatsapp: "989140407325", instagram: "yacin_photo",
    telegram: "yacin_photo", email: "contact@yacinphoto.com"
  },
  hero: {
    image: "/assets/hero.jpg",
    tag: "عکاسی مدلینگ | فضای باز | تبلیغاتی",
    titleLine1: "خلق تصویر حرفه‌ای،", titleLine2: "ثبت حس، لحظه و شخصیت",
    text: "یاسین فوتو با تمرکز بر عکاسی مدلینگ، پرتره فضای باز و پروژه‌های تبلیغاتی، برای برند شما و مدل‌های حرفه‌ای تصاویری ماندگار و سطح بالا خلق می‌کند.",
    primaryText: "مشاهده نمونه‌کارها", primaryHref: "#portfolio",
    secondaryText: "دنبال کردن در اینستاگرام", secondaryHref: "https://instagram.com/yacin_photo"
  },
  categories: [
  { id: "cat1", name: "مدلینگ", icon: "" },
  { id: "cat2", name: "فضای باز", icon: "☀" },
  { id: "cat3", name: "تبلیغاتی", icon: "◈" }
],
  works: [
    { id: "w1", title: "Vantage", image: "https://picsum.photos/seed/yasin-fm-1/800/1000" ,category: "cat1" },
    { id: "w2", title: "Mirror", image: "https://picsum.photos/seed/yasin-fm-2/800/1000" ,category: "cat1" },
    { id: "w3", title: "Cosmos", image: "https://picsum.photos/seed/yasin-fm-3/800/1000" ,category: "cat3" },
    { id: "w4", title: "Current", image: "https://picsum.photos/seed/yasin-fm-4/800/1000" ,category: "cat1" },
    { id: "w5", title: "Threshold", image: "https://picsum.photos/seed/yasin-fm-5/800/1000" ,category: "cat2" },
    { id: "w6", title: "Hollow", image: "https://picsum.photos/seed/yasin-fm-6/800/1000" ,category: "cat3" },
    { id: "w7", title: "Ascent", image: "https://picsum.photos/seed/yasin-fm-7/800/1000" ,category: "cat1" },
    { id: "w8", title: "Array", image: "https://picsum.photos/seed/yasin-fm-8/800/1000" ,category: "cat2" },
    
  ],
  locations: [
    { id: "l1", title: "استودیو نور", subtitle: "پرتره و مدلینگ با نورپردازی کنترل‌شده",
      cover: "https://picsum.photos/seed/yacin-location-studio/900/1200",
      works: [
        { id: "lw1", title: "پرتره استودیویی ۰۱", image: "https://picsum.photos/seed/yacin-studio-01/800/1060" },
        { id: "lw2", title: "پرتره استودیویی ۰۲", image: "https://picsum.photos/seed/yacin-studio-02/800/1060" },
        { id: "lw3", title: "مدلینگ با نور سخت", image: "https://picsum.photos/seed/yacin-studio-03/800/1060" }
      ] },
    { id: "l2", title: "بام شهری", subtitle: "عکاسی در ارتفاع با پس‌زمینه افق شهر",
      cover: "https://picsum.photos/seed/yacin-location-rooftop/900/1200",
      works: [
        { id: "lw4", title: "غروب روی بام", image: "https://picsum.photos/seed/yacin-rooftop-01/800/1060" },
        { id: "lw5", title: "پرتره شهری", image: "https://picsum.photos/seed/yacin-rooftop-02/800/1060" },
        { id: "lw6", title: "خطوط افق", image: "https://picsum.photos/seed/yacin-rooftop-03/800/1060" }
      ] },
    { id: "l3", title: "جنگل و طبیعت", subtitle: "فضای سبز، نور طبیعی و حس آرامش",
      cover: "https://picsum.photos/seed/yacin-location-forest/900/1200",
      works: [
        { id: "lw7", title: "مسیر جنگلی", image: "https://picsum.photos/seed/yacin-forest-01/800/1060" },
        { id: "lw8", title: "نور از میان درختان", image: "https://picsum.photos/seed/yacin-forest-02/800/1060" },
        { id: "lw9", title: "پرتره در طبیعت", image: "https://picsum.photos/seed/yacin-forest-03/800/1060" }
      ] }
  ],
  services: [
    { icon: "✦", title: "عکاسی مدلینگ", text: "عکاسی مدلینگ با ترکیب‌بندی حرفه‌ای، نورپردازی طبیعی یا مصنوعی، مناسب برای پورتفولیو، آژانس‌های مدلینگ و شبکه‌های اجتماعی." },
    { icon: "☀", title: "عکاسی فضای باز", text: "ثبت پرتره و مدلینگ در لوکیشن‌های طبیعی، شهری، ساحلی، جنگلی و صنعتی با استفاده از نور طبیعی و حس سینمایی." },
    { icon: "◈", title: "عکاسی تبلیغاتی", text: "تولید تصویر برای کمپین‌های تبلیغاتی، برندینگ، محصول، فشن، کافه، رستوران و کسب‌وکارهای نیازمند محتوای بصری حرفه‌ای." }
  ],
  about: {
    image: "https://picsum.photos/seed/yacin-about/900/1150",
    title: "ثبت لحظه‌ها با نگاه حرفه‌ای و هنری",
    text1: "یاسین فوتو با تمرکز بر عکاسی مدلینگ، پرتره فضای باز و پروژه‌های تبلیغاتی، تلاش می‌کند نه فقط یک عکس، بلکه یک حس، شخصیت و داستان را ثبت کند.",
    text2: "هدف ما ساخت تصاویری است که هم از نظر هنری قوی باشند و هم از نظر تبلیغاتی بتوانند برای برند، محصول یا مدل ارزش واقعی ایجاد کنند.",
    stats: [
      { value: "+120", label: "پروژه موفق" },
      { value: "+80", label: "همکاری با مدل" },
      { value: "+35", label: "پروژه تبلیغاتی" }
    ]
  },
  instagram: [
    { image: "https://picsum.photos/seed/yacin-insta-1/600/600", href: "https://instagram.com/yacin_photo" },
    { image: "https://picsum.photos/seed/yacin-insta-2/600/600", href: "https://instagram.com/yacin_photo" },
    { image: "https://picsum.photos/seed/yacin-insta-3/600/600", href: "https://instagram.com/yacin_photo" },
    { image: "https://picsum.photos/seed/yacin-insta-4/600/600", href: "https://instagram.com/yacin_photo" },
    { image: "https://picsum.photos/seed/yacin-insta-5/600/600", href: "https://instagram.com/yacin_photo" },
    { image: "https://picsum.photos/seed/yacin-insta-6/600/600", href: "https://instagram.com/yacin_photo" }
  ],
  contact: {
    title: "رزرو جلسه عکاسی",
    subtitle: "برای همکاری، رزرو جلسه عکاسی یا مشاوره پروژه، فرم زیر را تکمیل کنید.",
    info: [
      { label: "اینستاگرام", value: "@yacin_photo", href: "https://instagram.com/yacin_photo" },
      { label: "واتس‌اپ", value: "۰۹۱۴ ۰۴۰ ۷۳۲۵", href: "https://wa.me/989140407325" },
      { label: "ایمیل", value: "contact@yacinphoto.com", href: "mailto:contact@yacinphoto.com" },
      { label: "حوزه فعالیت", value: "عکاسی مدلینگ، فضای باز، تبلیغاتی و برندینگ", href: "" }
    ]
  }
};

function ensureJsonSafeStringify(obj) {
  return JSON.stringify(obj, null, 2).replace(/<\/script/gi, "<\\/script");
}

/* ❋ نوشتن اتمی: اول در فایل موقت، بعد rename — اگر وسط نوشتن سرور خاموش شود، فایل اصلی سالم می‌ماند */
function writeFileAtomic(filePath, data) {
  const tmp = filePath + ".tmp-" + process.pid;
  fs.writeFileSync(tmp, data, "utf8");
  fs.renameSync(tmp, filePath);
}

/* ═══════════════════════════════════════════════════════
   ۳) کش محتوا + بکاپ خودکار
═══════════════════════════════════════════════════════ */
let cachedContent = null;
let lastModifiedAt = null;

function writeContent(content) {
  if (fs.existsSync(CONTENT_FILE)) {
    try { fs.copyFileSync(CONTENT_FILE, CONTENT_FILE + ".bak"); }
    catch (err) { console.warn("⚠️ بکاپ گرفته نشد:", err.message); }
  }
  cachedContent = content;
  lastModifiedAt = new Date().toISOString();
  writeFileAtomic(CONTENT_FILE, JSON.stringify(content, null, 2));
  writeFileAtomic(SITE_FILE, "window.YACIN_SITE = " + ensureJsonSafeStringify(content) + ";\n");
}

function readContent() {
  if (cachedContent) return cachedContent;
  try {
    cachedContent = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
    return cachedContent;
  } catch (err) {
    console.error("⚠️ content.json ناخوانا است:", err.message);
    return defaultContent;
  }
}

function readInquiries() {
  try {
    const parsed = JSON.parse(fs.readFileSync(INQUIRIES_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
}

function writeInquiries(list) {
  const data = JSON.stringify(Array.isArray(list) ? list : [], null, 2);
  try {
    if (fs.existsSync(INQUIRIES_FILE)) fs.copyFileSync(INQUIRIES_FILE, INQUIRIES_FILE + ".bak");
  } catch (_) {}
  writeFileAtomic(INQUIRIES_FILE, data);
}

if (!fs.existsSync(CONTENT_FILE)) {
  writeContent(defaultContent);
} else {
  try {
    const stat = fs.statSync(CONTENT_FILE);
    lastModifiedAt = stat.mtime.toISOString();
  } catch (_) {}
}

/* ═══════════════════════════════════════════════════════
   ۴) راه‌اندازی Express
═══════════════════════════════════════════════════════ */
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// هدرهای امنیتی
app.use(function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self'; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
  if (IS_PROD) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
});

app.use(express.json({ limit: "5mb" }));

// ❋ فایل محتوای داینامیک: هیچ‌وقت کش نشود تا تغییرات پنل فوراً اعمال شود
app.get("/js/site-content.js", function (req, res) {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(ROOT, "js", "site-content.js"));
});

// پوشه‌های عمومی
app.use("/assets", express.static(path.join(ROOT, "assets"), { maxAge: IS_PROD ? "7d" : 0 }));
app.use("/js", express.static(path.join(ROOT, "js"), { maxAge: IS_PROD ? "1d" : 0 }));
app.use("/css", express.static(path.join(ROOT, "css"), { maxAge: IS_PROD ? "1d" : 0 }));

/* ═══════════════════════════════════════════════════════
   ۵) فایل‌های ریشه — حل ۴۰۴ favicon + MIME type صحیح
═══════════════════════════════════════════════════════ */
app.get("/", function (req, res) {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(ROOT, "index.html"));
});
app.get("/admin", function (req, res) {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(ROOT, "admin.html"));
});

// ✅ حل خطای ۴۰۴ favicon.ico — پاسخ ۲۰۴ (No Content) اگر فایل نیست
app.get("/favicon.ico", function (req, res) {
  const faviconPath = path.join(ROOT, "favicon.ico");
  if (fs.existsSync(faviconPath)) {
    res.type("image/x-icon").sendFile(faviconPath);
  } else {
    res.status(204).end();
  }
});

// admin.css و admin.js از پوشه css/ و js/ سرو می‌شوند (روت‌های داخلی تکراری بودند و حذف شدند)

app.get("/robots.txt", function (req, res) {
  res.type("text/plain").sendFile(path.join(ROOT, "robots.txt"), function (err) {
    if (err && !res.headersSent) res.sendStatus(404);
  });
});
app.get("/sitemap.xml", function (req, res) {
  res.type("application/xml").sendFile(path.join(ROOT, "sitemap.xml"), function (err) {
    if (err && !res.headersSent) res.sendStatus(404);
  });
});

/* ═══════════════════════════════════════════════════════
   ۶) آپلود تصاویر (Multer)
═══════════════════════════════════════════════════════ */
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
    const safeExt = allowedExt.indexOf(ext) !== -1 ? ext : "";
    cb(null, Date.now() + "-" + crypto.randomUUID() + safeExt);
  }
});
const fileFilter = function (req, file, cb) {
  const allowed = /^image\/(jpeg|png|webp|gif|avif)$/i;
  cb(null, allowed.test(file.mimetype));
};
const upload = multer({
  storage: storage, fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

/* ═══════════════════════════════════════════════════════
   ۷) سشن و توکن
═══════════════════════════════════════════════════════ */
function getToken(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)yacin_admin=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
function newToken() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return token;
}
function auth(req, res, next) {
  const token = getToken(req);
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) {
    return res.status(401).json({ error: "غیرمجاز" });
  }
  req.token = token;
  next();
}

/* ═══════════════════════════════════════════════════════
   ۸) محدودسازی تلاش ورود (ضد brute-force)
═══════════════════════════════════════════════════════ */
const attempts = new Map();
const LOGIN_MAX_TRIES = IS_PROD ? 5 : 20;
const LOGIN_LOCK_MS = IS_PROD ? 15 * 60 * 1000 : 30 * 1000;

function loginLimit(req, res, next) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.blocked) {
    if (now < rec.blockedUntil) {
      const remaining = Math.ceil((rec.blockedUntil - now) / 1000);
      const minutes = Math.ceil(remaining / 60);
      return res.status(429).json({
        error: "تلاش ناموفق بیش از حد. " +
          (minutes >= 2 ? minutes + " دقیقه" : remaining + " ثانیه") +
          " تا باز شدن قفل.",
        retryAfter: remaining
      });
    }
    attempts.delete(ip);
  }
  req.loginIp = ip;
  next();
}
function markLoginFailed(ip) {
  const now = Date.now();
  let rec = attempts.get(ip);
  if (!rec || rec.blocked || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + LOGIN_LOCK_MS, blocked: false, blockedUntil: 0 };
  }
  rec.count++;
  if (rec.count >= LOGIN_MAX_TRIES) {
    rec.blocked = true;
    rec.blockedUntil = now + LOGIN_LOCK_MS;
  }
  attempts.set(ip, rec);
}
function markLoginSuccess(ip) { attempts.delete(ip); }

setInterval(function () {
  const now = Date.now();
  for (const [token, session] of sessions) if (session.expires < now) sessions.delete(token);
  for (const [ip, rec] of attempts) {
    if (rec.blocked ? now >= rec.blockedUntil : now > rec.resetAt) attempts.delete(ip);
  }
  for (const [ip, arr] of contactHits) {
    const fresh = arr.filter(function (t) { return now - t < CONTACT_WINDOW_MS; });
    if (fresh.length === 0) contactHits.delete(ip); else contactHits.set(ip, fresh);
  }
}, 60 * 1000).unref();

const COOKIE_BASE = "HttpOnly; Path=/; SameSite=Lax" + (IS_PROD ? "; Secure" : "");

/* ═══════════════════════════════════════════════════════
   ۹) API: ورود / خروج / وضعیت / تغییر رمز
═══════════════════════════════════════════════════════ */
app.post("/api/login", loginLimit, function (req, res) {
  const password = (req.body && req.body.password) || "";
  const ip = req.loginIp || req.ip || "unknown";
  if (!checkAdminPassword(password)) {
    markLoginFailed(ip);
    const rec = attempts.get(ip);
    const left = rec && !rec.blocked ? LOGIN_MAX_TRIES - rec.count : 0;
    return res.status(401).json({
      error: left > 0 ? "رمز عبور اشتباه است. " + left + " تلاش باقی‌مانده." : "رمز عبور اشتباه است."
    });
  }
  markLoginSuccess(ip);
  res.setHeader("Set-Cookie", "yacin_admin=" + newToken() + "; Max-Age=" + (7 * 24 * 60 * 60) + "; " + COOKIE_BASE);
  res.json({ ok: true });
});

app.post("/api/logout", auth, function (req, res) {
  sessions.delete(req.token);
  res.setHeader("Set-Cookie", "yacin_admin=; Max-Age=0; " + COOKIE_BASE);
  res.json({ ok: true });
});

app.get("/api/me", function (req, res) {
  const session = sessions.get(getToken(req));
  res.json({ authenticated: !!session && session.expires > Date.now() });
});

app.post("/api/password", auth, function (req, res) {
  try {
    const body = req.body || {};
    const currentPassword = String(body.currentPassword || body.oldPassword || "");
    const newPassword = String(body.newPassword || body.password || "");
    const confirmPassword = body.confirmPassword != null ? String(body.confirmPassword) : null;

    if (!currentPassword) return res.status(400).json({ error: "رمز فعلی را وارد کنید." });
    if (!newPassword) return res.status(400).json({ error: "رمز جدید الزامی است." });
    if (newPassword.length < 8) return res.status(400).json({ error: "رمز جدید باید حداقل ۸ کاراکتر باشد." });
    if (newPassword === "yacin123") return res.status(400).json({ error: "این رمز ضعیف مجاز نیست." });
    if (confirmPassword !== null && newPassword !== confirmPassword) {
      return res.status(400).json({ error: "تکرار رمز جدید با رمز جدید یکسان نیست." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: "رمز جدید باید با رمز فعلی متفاوت باشد." });
    }
    if (!checkAdminPassword(currentPassword)) {
      return res.status(401).json({ error: "رمز فعلی اشتباه است." });
    }

    adminPasswordStore = hashPassword(newPassword);
    savePasswordStore(adminPasswordStore);
    for (const token of sessions.keys()) {
      if (token !== req.token) sessions.delete(token);
    }
    console.log("🔐 رمز ادمین تغییر کرد:", new Date().toISOString());
    res.json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد." });
  } catch (err) {
    console.error("❌ Password change error:", err);
    res.status(500).json({ error: "خطا در تغییر رمز." });
  }
});

/* ═══════════════════════════════════════════════════════
   ۱۰) API: محتوا
═══════════════════════════════════════════════════════ */
app.get("/api/content", function (req, res) { res.json(readContent()); });

app.post("/api/content", auth, function (req, res) {
  const content = req.body;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return res.status(400).json({ error: "محتوای نامعتبر است." });
  }
  writeContent(content);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   ۱۱) API: آمار زنده (برای داشبورد جدید)
═══════════════════════════════════════════════════════ */
app.get("/api/stats", auth, function (req, res) {
  try {
    const content = readContent();
    const inquiries = readInquiries();
    const now = new Date();
    const todayKey = now.toDateString();

    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayKey);
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      const count = inquiries.filter(q => new Date(q.date).toDateString() === dStr).length;
      weekData.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("fa-IR", { weekday: "short" }),
        count: count
      });
    }

    const todayCount = inquiries.filter(q => new Date(q.date).toDateString() === todayKey).length;
    const weekCount = inquiries.filter(q => (now - new Date(q.date)) < 7 * 86400000).length;

    let contentSize = 0;
    try { contentSize = fs.statSync(CONTENT_FILE).size; } catch (_) {}

    let mediaCount = 0, mediaSize = 0;
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      files.forEach(f => {
        if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f)) {
          mediaCount++;
          try { mediaSize += fs.statSync(path.join(UPLOAD_DIR, f)).size; } catch (_) {}
        }
      });
    } catch (_) {}

    res.json({
      counts: {
        works: Array.isArray(content.works) ? content.works.length : 0,
        locations: Array.isArray(content.locations) ? content.locations.length : 0,
        services: Array.isArray(content.services) ? content.services.length : 0,
        media: mediaCount,
        inquiries: inquiries.length
      },
      inquiries: {
        today: todayCount,
        week: weekCount,
        total: inquiries.length,
        weekData: weekData
      },
      storage: {
        contentBytes: contentSize,
        mediaBytes: mediaSize,
        totalBytes: contentSize + mediaSize
      },
      lastModified: lastModifiedAt || now.toISOString()
    });
  } catch (err) {
    console.error("❌ Stats error:", err);
    res.status(500).json({ error: "خطا در محاسبه آمار." });
  }
});

/* ═══════════════════════════════════════════════════════
   ۱۲) API: آپلود و مدیا
═══════════════════════════════════════════════════════ */
app.post("/api/upload", auth,
  function (req, res, next) {
    upload.single("file")(req, res, function (err) {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "حجم فایل بیش از 10 مگابایت است." });
        if (err.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ error: "فیلد فایل نامعتبر است." });
        return res.status(400).json({ error: err.message || "آپلود ناموفق بود." });
      }
      next();
    });
  },
  function (req, res) {
    if (!req.file) return res.status(400).json({ error: "فایلی ارسال نشد یا فرمت مجاز نیست." });
    res.json({ url: "/assets/uploads/" + req.file.filename, filename: req.file.filename });
  }
);

app.get("/api/media", auth, function (req, res) {
  fs.readdir(UPLOAD_DIR, function (err, files) {
    if (err) return res.json([]);
    const result = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f))
      .map(f => {
        let size = 0;
        try { size = fs.statSync(path.join(UPLOAD_DIR, f)).size; } catch (_) {}
        return { filename: f, url: "/assets/uploads/" + f, size: size };
      });
    res.json(result);
  });
});

app.delete("/api/media", auth, function (req, res) {
  const filename = String((req.body && req.body.filename) || "");
  if (!filename || filename !== path.basename(filename) ||
      !/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(filename)) {
    return res.status(400).json({ error: "نام فایل نامعتبر است." });
  }
  const uploadRoot = path.resolve(UPLOAD_DIR);
  const filePath = path.resolve(uploadRoot, filename);
  if (filePath !== uploadRoot && !filePath.startsWith(uploadRoot + path.sep)) {
    return res.status(400).json({ error: "مسیر نامعتبر است." });
  }
  fs.unlink(filePath, function (err) {
    if (err) return res.status(400).json({ error: "حذف فایل ناموفق بود." });
    res.json({ ok: true });
  });
});

/* ═══════════════════════════════════════════════════════
   ۱۳) API: فرم رزرو (Contact / Inquiries)
═══════════════════════════════════════════════════════ */
/* ❋ محدودسازی فرم تماس (ضد اسپام): حداکثر 5 درخواست در 10 دقیقه برای هر IP */
const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_MAX = 5;
const contactHits = new Map();

function contactLimit(req, res, next) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const arr = (contactHits.get(ip) || []).filter(function (t) { return now - t < CONTACT_WINDOW_MS; });
  if (arr.length >= CONTACT_MAX) {
    return res.status(429).json({ error: "تعداد درخواست‌ها بیش از حد است. لطفاً کمی بعد دوباره تلاش کنید." });
  }
  arr.push(now);
  contactHits.set(ip, arr);
  next();
}

function clean(value) {
  return String(value == null ? "" : value)
    .replace(/<[^>]*>/g, "").trim().slice(0, 1000);
}

app.post("/api/contact", contactLimit, function (req, res) {
  const body = req.body || {};

  // ❋ Honeypot ضد ربات: اگر فیلد مخفی پر شده باشد، با موفقیت جعلی جواب می‌دهیم و ذخیره نمی‌کنیم
  if (clean(body.website)) {
    return res.json({ ok: true });
  }

  const name = clean(body.name);
  const phone = clean(body.phone);
  if (!name || !phone) return res.status(400).json({ error: "نام و شماره تماس الزامی است." });

  const entry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    name: name, phone: phone,
    email: clean(body.email),
    service: clean(body.service),
    message: clean(body.message)
  };

  const list = readInquiries();
  list.unshift(entry);
  if (list.length > 1000) list.length = 1000;
  writeInquiries(list);
  res.json({ ok: true });
});

app.get("/api/inquiries", auth, function (req, res) { res.json(readInquiries()); });

app.delete("/api/inquiries", auth, function (req, res) {
  const id = String((req.body && req.body.id) || "");
  if (!id) return res.status(400).json({ error: "شناسه درخواست نامعتبر است." });
  const list = readInquiries();
  writeInquiries(list.filter(item => item && item.id !== id));
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════
   ۱۴) ۴۰۴ API و هندلر خطای سراسری
═══════════════════════════════════════════════════════ */
app.use("/api", function (req, res) {
  res.status(404).json({ error: "API یافت نشد." });
});

app.use(function (err, req, res, next) {
  if (res.headersSent) return next(err);
  console.error("❌ Server error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? "خطای سرور رخ داد." : err.message });
});

/* ═══════════════════════════════════════════════════════
   ۱۵) شروع سرور
═══════════════════════════════════════════════════════ */
/* ❋ خاموشی امن + دیرگیر خطاهای زیرسیستمی */
process.on("uncaughtException", function (err) {
  console.error("❌ uncaughtException:", err && err.message);
});
process.on("unhandledRejection", function (reason) {
  console.error("❌ unhandledRejection:", reason);
});

function gracefulShutdown(signal) {
  console.log("🛑 " + signal + " received — closing server...");
  server.close(function () { process.exit(0); });
  setTimeout(function () { process.exit(0); }, 5000).unref();
}
process.on("SIGTERM", function () { gracefulShutdown("SIGTERM"); });
process.on("SIGINT", function () { gracefulShutdown("SIGINT"); });

const server = app.listen(PORT, function () {
  console.log("✅ Yacin Photo server running on http://localhost:" + PORT);
  console.log("✅ Admin panel: http://localhost:" + PORT + "/admin");
  console.log("🔐 رمز ادمین: data/admin-password.json (قابل تغییر از پنل)");
});

server.on("error", function (err) {
  if (err.code === "EADDRINUSE") {
    console.error("❌ پورت " + PORT + " در حال استفاده است.");
  } else {
    console.error("❌ خطای سرور:", err.message);
  }
  process.exit(1);
});