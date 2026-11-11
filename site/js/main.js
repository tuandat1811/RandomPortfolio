/* ==========================================================================
   Portfolio – dựng header, footer và nội dung từng trang từ window.SITE_DATA
   ========================================================================== */
(function () {
  "use strict";

  var D = window.SITE_DATA || { profile: {}, exercises: [], conclusion: {} };
  var P = D.profile || {};
  var EX = D.exercises || [];
  var C = D.conclusion || {};
  var body = document.body;
  var page = body.getAttribute("data-page");

  /* ---------- Tiện ích ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function linkify(html) {
    return html.replace(/(https?:\/\/[^\s<]+)/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>";
    });
  }
  function empty(v) {
    if (v == null) return true;
    if (Array.isArray(v)) return v.length === 0;
    return String(v).trim() === "";
  }
  function ph(label) {
    return '<span class="placeholder">[Chưa điền: ' + esc(label) + "]</span>";
  }
  /* Văn bản nhiều đoạn: dòng trống tách đoạn, xuống dòng giữ nguyên */
  function paras(text, label) {
    if (empty(text)) return "<p>" + ph(label) + "</p>";
    return String(text).trim().split(/\n\s*\n/).map(function (p) {
      return "<p>" + linkify(esc(p)).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }
  function inline(text, label) {
    return empty(text) ? ph(label) : linkify(esc(text));
  }
  function list(items, label, cls) {
    if (empty(items)) return "<p>" + ph(label) + "</p>";
    return '<ul' + (cls ? ' class="' + cls + '"' : "") + ">" +
      items.map(function (i) { return "<li>" + linkify(esc(i)) + "</li>"; }).join("") + "</ul>";
  }
  function exUrl(n) { return "bai-" + n + ".html"; }
  function exLabel(e) { return "Bài " + e.number + " – " + e.title; }

  /* Chuyển link chia sẻ thành link nhúng */
  function driveId(url) {
    var m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
    return m && /drive\.google\.com/.test(url) ? m[1] : null;
  }
  function youtubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : null;
  }
  function embedVideo(url, title) {
    var yt = youtubeId(url), dr = driveId(url);
    if (yt) return '<iframe class="video-frame" src="https://www.youtube.com/embed/' + yt + '" title="' + esc(title) + '" loading="lazy" allowfullscreen allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>';
    if (dr) return '<iframe class="video-frame" src="https://drive.google.com/file/d/' + dr + '/preview" title="' + esc(title) + '" loading="lazy" allow="autoplay" allowfullscreen></iframe>';
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return '<video class="video-frame" src="' + esc(url) + '" controls preload="metadata"></video>';
    return '<p><a href="' + esc(url) + '" target="_blank" rel="noopener">Xem video ↗</a></p>';
  }
  function embedDoc(url, title) {
    var dr = driveId(url);
    var src = dr ? "https://drive.google.com/file/d/" + dr + "/preview"
      : /docs\.google\.com\/(document|presentation|spreadsheets)/.test(url) ? url.replace(/\/(edit|view)[^/]*$/, "/preview")
      : url;
    return '<iframe class="pdf-frame" src="' + esc(src) + '" title="' + esc(title) + '" loading="lazy"></iframe>' +
      '<p class="muted" style="margin-top:8px"><a href="' + esc(url) + '" target="_blank" rel="noopener">Mở tài liệu trong tab mới ↗</a></p>';
  }

  /* ---------- Giao diện sáng / tối ---------- */
  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    updateThemeIcon();
  }
  function updateThemeIcon() {
    var b = document.getElementById("theme-toggle");
    if (b) {
      var dark = currentTheme() === "dark";
      b.textContent = dark ? "☀" : "☾";
      b.setAttribute("aria-label", dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
    }
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var name = P.name || "Portfolio";
    var exId = parseInt(body.getAttribute("data-id"), 10);
    var subs = EX.map(function (e) {
      var cur = page === "exercise" && exId === e.number ? ' aria-current="page"' : "";
      return '<li><a href="' + exUrl(e.number) + '"' + cur + ">Bài " + e.number + " – " + esc(e.title) +
        "<small>" + esc(e.chapter) + "</small></a></li>";
    }).join("");
    var projActive = page === "projects" || page === "exercise";
    el.className = "site-header";
    el.innerHTML =
      '<div class="container header-inner">' +
        '<a class="brand" href="index.html"><span class="brand-dot" aria-hidden="true"></span>' + esc(name) + "</a>" +
        '<nav class="nav" id="nav" aria-label="Menu chính">' +
          '<a href="index.html"' + (page === "about" ? ' aria-current="page"' : "") + ">Giới thiệu</a>" +
          '<div class="dropdown' + (projActive ? " active" : "") + '">' +
            '<button class="nav-link" type="button" aria-expanded="false" aria-haspopup="true">Dự án</button>' +
            '<ul class="dropdown-menu">' +
              '<li><a href="projects.html"' + (page === "projects" ? ' aria-current="page"' : "") + "><strong>Tổng quan dự án</strong><small>Danh mục 06 bài tập</small></a></li>" +
              subs +
            "</ul>" +
          "</div>" +
          '<a href="conclusion.html"' + (page === "conclusion" ? ' aria-current="page"' : "") + ">Tổng kết</a>" +
        "</nav>" +
        '<button class="icon-btn" id="rain-toggle" type="button" aria-pressed="false" aria-label="Bật tiếng mưa" title="Bật tiếng mưa">🌧</button>' +
        '<button class="icon-btn" id="theme-toggle" type="button"></button>' +
        '<button class="icon-btn menu-toggle" id="menu-toggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="nav">☰</button>' +
      "</div>";

    updateThemeIcon();
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
    document.getElementById("rain-toggle").addEventListener("click", toggleRain);

    var nav = document.getElementById("nav");
    var mt = document.getElementById("menu-toggle");
    mt.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      mt.setAttribute("aria-expanded", open);
      mt.textContent = open ? "✕" : "☰";
    });
    var dd = el.querySelector(".dropdown");
    var ddBtn = dd.querySelector(".nav-link");
    ddBtn.addEventListener("click", function () {
      if (window.innerWidth <= 860) { location.href = "projects.html"; return; }
      var open = dd.classList.toggle("open");
      ddBtn.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", function (e) {
      if (!dd.contains(e.target)) { dd.classList.remove("open"); ddBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { dd.classList.remove("open"); ddBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    var r = rng(3), d = "M0 40", x = 0;
    while (x < 1200) { var w = 30 + r() * 70, hgt = 8 + r() * 30; d += " L" + x.toFixed(0) + " " + (40 - hgt).toFixed(0) + " L" + (x + w).toFixed(0) + " " + (40 - hgt).toFixed(0); x += w; }
    d += " L1200 40Z";
    el.innerHTML =
      '<svg class="footer-skyline" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/></svg>' +
      '<div class="container footer-inner">' +
        '<div class="footer-info">' +
          "<span><strong>" + inline(P.name, "Họ và tên") + "</strong></span>" +
          "<span>MSSV: " + inline(P.studentId, "MSSV") + "</span>" +
          "<span>Lớp: " + inline(P.className, "Lớp") + "</span>" +
        "</div>" +
        "<div>Học phần: " + esc(P.course) + (P.courseCode ? " (" + esc(P.courseCode) + ")" : "") + "</div>" +      "</div>";
  }

  /* ---------- Tiếng mưa (tạo bằng Web Audio, không dùng file nhạc) ---------- */
  var audio = null;
  function makeRain() {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var len = ctx.sampleRate * 3, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      // Nhiễu hồng (gần với nhiễu trắng nhưng dịu tai hơn), không có thành phần trầm
      var data = buf.getChannelData(ch), b0 = 0, b1 = 0, b2 = 0;
      for (var i = 0; i < len; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
      }
    }
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6000;
    var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 500;
    var gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
    src.start();
    return { ctx: ctx, gain: gain };
  }
  function toggleRain() {
    var btn = document.getElementById("rain-toggle");
    var on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", on);
    btn.setAttribute("aria-label", on ? "Tắt tiếng mưa" : "Bật tiếng mưa");
    btn.title = btn.getAttribute("aria-label");
    try {
      if (!audio) audio = makeRain();
      var now = audio.ctx.currentTime;
      if (on) audio.ctx.resume();
      audio.gain.gain.cancelScheduledValues(now);
      audio.gain.gain.setValueAtTime(audio.gain.gain.value, now);
      audio.gain.gain.linearRampToValueAtTime(on ? 0.12 : 0, now + 1.5);
    } catch (e) { /* trình duyệt không hỗ trợ âm thanh: vẫn giữ hiệu ứng hình */ }
  }

  /* ---------- Khối nội dung đặc thù ---------- */
  function renderTable(headers, rows, title) {
    var head = "<tr>" + headers.map(function (h) { return "<th scope=\"col\">" + esc(h) + "</th>"; }).join("") + "</tr>";
    var bodyRows = empty(rows)
      ? '<tr><td colspan="' + headers.length + '">' + ph("thêm các dòng cho bảng này") + "</td></tr>"
      : rows.map(function (r) {
          return "<tr>" + headers.map(function (_, i) { return "<td>" + linkify(esc(r[i] || "")) + "</td>"; }).join("") + "</tr>";
        }).join("");
    return '<div class="table-wrap"><table>' + (title ? "" : "") + "<thead>" + head + "</thead><tbody>" + bodyRows + "</tbody></table></div>";
  }

  var tableNo = 0, figNo = 0;

  function renderBlock(b, idx) {
    var t = b.title ? "<h3>" + esc(b.title) + "</h3>" : "";
    var html = "";
    switch (b.type) {
      case "tree":
        html = empty(b.text) ? "<p>" + ph("sơ đồ cây thư mục") + "</p>" : '<pre class="tree">' + esc(b.text) + "</pre>";
        break;
      case "table":
        tableNo++;
        html = renderTable(b.headers || [], b.rows, b.title) +
          '<p class="muted" style="font-size:.88rem;margin-top:8px">Bảng ' + tableNo + ". " + esc(b.title || "") + "</p>";
        t = "";
        break;
      case "timeline":
        html = empty(b.items) ? "<p>" + ph("các mốc tiến trình") + "</p>" :
          '<ol class="timeline">' + b.items.map(function (i) {
            return "<li><strong>" + esc(i.title) + "</strong><span>" + linkify(esc(i.desc || "")) + "</span></li>";
          }).join("") + "</ol>";
        break;
      case "principles":
        html = empty(b.items) ? "<p>" + ph("các nguyên tắc") + "</p>" :
          '<div class="grid grid-2 principles">' + b.items.map(function (i) {
            return '<div class="card principle"><h3>' + esc(i.title) + "</h3><p>" + linkify(esc(i.desc || "")) + "</p></div>";
          }).join("") + "</div>";
        break;
      case "list":
        html = list(b.items, "nội dung danh sách");
        break;
      case "text":
        html = paras(b.text, "nội dung");
        break;
      case "compare":
        html = empty(b.items) ? "<p>" + ph("các cặp Prompt so sánh") + "</p>" :
          b.items.map(function (it, k) { return renderCompare(it, idx + "-" + k); }).join("");
        break;
    }
    return '<div class="media-block">' + t + html + "</div>";
  }

  function renderCompare(it, key) {
    var id = "cmp-" + key;
    function panel(which, prompt, output, hidden) {
      return '<div class="compare-panel" role="tabpanel" id="' + id + "-" + which + '"' + (hidden ? " hidden" : "") + ">" +
        "<h4>Prompt</h4><div class=\"prompt-text\">" + (empty(prompt) ? ph("prompt") : esc(prompt)) + "</div>" +
        "<h4>Kết quả từ AI</h4><div class=\"output-text\">" + (empty(output) ? ph("kết quả") : linkify(esc(output))) + "</div>" +
      "</div>";
    }
    return '<div class="compare" data-compare>' +
      (it.task ? '<div class="compare-panel" style="padding-bottom:0"><strong>Tác vụ:</strong> ' + esc(it.task) + "</div>" : "") +
      '<div class="compare-tabs" role="tablist" style="margin-top:12px">' +
        '<button type="button" role="tab" aria-selected="true" aria-controls="' + id + '-a">Prompt ban đầu</button>' +
        '<button type="button" role="tab" aria-selected="false" aria-controls="' + id + '-b">Prompt cải tiến</button>' +
      "</div>" +
      panel("a", it.before, it.outputBefore, false) +
      panel("b", it.after, it.outputAfter, true) +
      (it.note ? '<div class="compare-note"><strong>Nhận xét:</strong> ' + linkify(esc(it.note)) + "</div>" : "") +
    "</div>";
  }

  function renderMedia(items) {
    if (empty(items)) return "<p>" + ph("sản phẩm: ảnh, PDF, video hoặc liên kết") + "</p>";
    var out = "", imgs = [];
    function flushImgs() {
      if (!imgs.length) return;
      out += '<div class="media-block gallery">' + imgs.map(function (m) {
        figNo++;
        var cap = "Hình " + figNo + ". " + (m.caption || "") + (m.credit ? " (Nguồn: " + m.credit + ")" : "");
        return '<figure><img src="' + esc(m.src) + '" alt="' + esc(m.caption || "Hình minh họa") + '" loading="lazy" data-lightbox data-caption="' + esc(cap) + '"><figcaption>' + linkify(esc(cap)) + "</figcaption></figure>";
      }).join("") + "</div>";
      imgs = [];
    }
    items.forEach(function (m) {
      if (m.type === "image") { imgs.push(m); return; }
      flushImgs();
      var cap = m.caption ? "<h3>" + esc(m.caption) + "</h3>" : "";
      if (m.type === "video") out += '<div class="media-block">' + cap + embedVideo(m.url || "", m.caption || "Video") + "</div>";
      else if (m.type === "pdf") out += '<div class="media-block">' + cap + embedDoc(m.url || "", m.caption || "Tài liệu") + "</div>";
      else if (m.type === "link") out += '<ul class="link-list media-block"><li><a href="' + esc(m.url) + '" target="_blank" rel="noopener">🔗 <span>' + esc(m.caption || m.url) + "</span></a></li></ul>";
    });
    flushImgs();
    return out;
  }

  /* ---------- Cảnh minh họa lofi (SVG tự vẽ) ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sceneSVG() {
    var r = rng(7), s = "";
    // Bầu trời trong cửa sổ
    s += '<defs>' +
      '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky-top)"/><stop offset=".55" style="stop-color:var(--sky-mid)"/><stop offset="1" style="stop-color:var(--sky-low)"/></linearGradient>' +
      '<radialGradient id="glow"><stop offset="0" style="stop-color:var(--orb);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--orb);stop-opacity:0"/></radialGradient>' +
      '<clipPath id="glass"><rect x="600" y="50" width="540" height="270" rx="6"/></clipPath>' +
    "</defs>";
    s += '<rect width="1200" height="500" style="fill:var(--wall)"/>';
    s += '<g clip-path="url(#glass)"><rect x="600" y="50" width="540" height="270" fill="url(#sky)"/>';
    for (var i = 0; i < 22; i++) {
      s += '<circle class="star" cx="' + (610 + r() * 520).toFixed(0) + '" cy="' + (60 + r() * 120).toFixed(0) + '" r="' + (1 + r() * 1.6).toFixed(1) + '" style="fill:var(--orb)"/>';
    }
    s += '<circle cx="1010" cy="120" r="90" fill="url(#glow)"/><circle cx="1010" cy="120" r="34" style="fill:var(--orb)"/>';
    s += '<line class="shoot" x1="1080" y1="70" x2="1110" y2="55"/>';
    s += '<g class="cloud" fill="#fff"><ellipse cx="720" cy="110" rx="46" ry="14"/><ellipse cx="748" cy="100" rx="28" ry="14"/><ellipse cx="700" cy="104" rx="20" ry="10"/></g>';
    s += '<g class="cloud c2" fill="#fff"><ellipse cx="640" cy="150" rx="36" ry="10"/><ellipse cx="660" cy="142" rx="22" ry="11"/></g>';
    var x = 600;
    while (x < 1140) { var w = 30 + r() * 50, hh = 60 + r() * 90; s += '<rect x="' + x.toFixed(0) + '" y="' + (320 - hh).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + hh.toFixed(0) + '" style="fill:var(--city-far)"/>'; x += w - 4; }
    x = 596;
    while (x < 1140) {
      var w2 = 44 + r() * 50, h2 = 40 + r() * 80, top = 320 - h2;
      s += '<rect x="' + x.toFixed(0) + '" y="' + top.toFixed(0) + '" width="' + w2.toFixed(0) + '" height="' + h2.toFixed(0) + '" style="fill:var(--city)"/>';
      for (var wy = top + 10; wy < 312; wy += 16) for (var wx = x + 8; wx < x + w2 - 10; wx += 14) {
        if (r() < .32) s += '<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="6" height="8" style="fill:var(--lit)" opacity=".85"/>';
      }
      x += w2 + 2;
    }
    s += "</g>";
    // Khung cửa sổ
    s += '<g style="fill:var(--frame)"><rect x="588" y="38" width="564" height="12" rx="4"/><rect x="588" y="320" width="564" height="12"/><rect x="588" y="38" width="12" height="294"/><rect x="1140" y="38" width="12" height="294"/><rect x="865" y="50" width="10" height="270"/><rect x="600" y="180" width="540" height="8"/><rect x="570" y="330" width="600" height="14" rx="4"/></g>';
    // Dây đèn trang trí
    s += '<path d="M20 34 Q 300 110 570 40" fill="none" style="stroke:var(--frame)" stroke-width="2"/>';
    for (i = 0; i <= 12; i++) {
      var t = i / 12, lx = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 300 + t * t * 570, ly = (1 - t) * (1 - t) * 34 + 2 * (1 - t) * t * 110 + t * t * 40;
      s += '<circle class="star" cx="' + lx.toFixed(0) + '" cy="' + (ly + 6).toFixed(0) + '" r="5" style="fill:var(--lit);opacity:.9"/>';
    }
    // Kệ sách và tranh nhỏ trên tường
    s += '<rect x="90" y="170" width="300" height="10" rx="3" style="fill:var(--desk-top)"/>';
    var bc = ["#e9a27f", "#9c8fe0", "#7fbfa6", "#f2c66d", "#e98fa6", "#86b3e6"], bx = 104;
    for (i = 0; i < 7; i++) { var bw = 14 + r() * 10, bh = 44 + r() * 26; s += '<rect x="' + bx.toFixed(0) + '" y="' + (170 - bh).toFixed(0) + '" width="' + bw.toFixed(0) + '" height="' + bh.toFixed(0) + '" rx="2" fill="' + bc[i % 6] + '" opacity=".9"/>'; bx += bw + 3; }
    s += '<rect x="290" y="132" width="34" height="38" rx="6" style="fill:var(--frame)"/><ellipse cx="300" cy="124" rx="16" ry="9" style="fill:var(--leaf)" transform="rotate(-30 300 124)"/><ellipse cx="316" cy="120" rx="14" ry="8" style="fill:var(--leaf-2)" transform="rotate(35 316 120)"/>';
    s += '<path d="M330 180 q 6 50 -4 90" fill="none" style="stroke:var(--leaf)" stroke-width="5" stroke-linecap="round"/><ellipse cx="324" cy="230" rx="11" ry="6" style="fill:var(--leaf-2)" transform="rotate(40 324 230)"/><ellipse cx="334" cy="256" rx="11" ry="6" style="fill:var(--leaf)" transform="rotate(-30 334 256)"/>';
    s += '<rect x="420" y="80" width="110" height="140" rx="6" style="fill:var(--frame)"/><rect x="430" y="90" width="90" height="120" rx="3" style="fill:var(--sky-mid)"/><path d="M430 210 L465 150 L490 185 L505 165 L520 190 L520 210Z" style="fill:var(--city)"/><circle cx="500" cy="118" r="10" style="fill:var(--orb)"/>';
    // Ánh đèn bàn
    s += '<polygon class="lamp-light" points="640,222 590,380 820,380 700,222"/>';
    // Bàn
    s += '<rect x="0" y="372" width="1200" height="16" style="fill:var(--desk-top)"/><rect x="0" y="388" width="1200" height="112" style="fill:var(--desk)"/>';
    // Đèn bàn
    s += '<g style="fill:var(--frame)"><ellipse cx="640" cy="372" rx="40" ry="8"/><rect x="636" y="290" width="8" height="82" transform="rotate(-12 640 330)"/><rect x="640" y="226" width="8" height="80" transform="rotate(28 644 266)"/></g><path d="M622 196 L700 214 L690 238 L612 222Z" style="fill:var(--accent)"/>';
    // Laptop
    s += '<path d="M720 372 L960 372 L948 362 L732 362Z" style="fill:var(--frame)"/><rect x="742" y="250" width="196" height="114" rx="8" style="fill:var(--frame)"/><rect class="screen-glow" x="752" y="260" width="176" height="94" rx="4" style="fill:var(--screen)" opacity=".9"/>';
    s += '<g style="fill:var(--frame)" opacity=".35"><rect class="type" x="766" y="276" width="90" height="7" rx="3"/><rect class="type" x="766" y="292" width="140" height="7" rx="3"/><rect class="type" x="766" y="308" width="120" height="7" rx="3"/><rect class="type" x="766" y="324" width="70" height="7" rx="3"/></g>';
    // Cốc trà
    s += '<path class="steam" d="M990 320 q -8 -14 0 -26 q 8 -12 0 -24"/><path class="steam s2" d="M1004 322 q -8 -14 0 -26 q 8 -12 0 -24"/><path class="steam s3" d="M1018 320 q -8 -14 0 -26 q 8 -12 0 -24"/>';
    s += '<rect x="980" y="330" width="48" height="42" rx="8" style="fill:var(--accent)"/><path d="M1028 340 q 18 0 18 14 q 0 14 -18 14" fill="none" style="stroke:var(--accent)" stroke-width="6"/>';
    // Mèo ngủ
    s += '<g style="fill:var(--cat)"><path class="cat-tail" d="M1150 366 q 30 -4 34 -26 q 2 -10 -6 -10" fill="none" style="stroke:var(--cat)" stroke-width="10" stroke-linecap="round"/>' +
      '<ellipse class="cat-body" cx="1112" cy="352" rx="46" ry="22"/><circle cx="1072" cy="352" r="18"/><path d="M1058 340 l-2 -16 l14 10Z"/><path d="M1078 336 l6 -15 l6 15Z"/></g>';
    s += '<path d="M1064 354 q 4 3 8 0 M1076 354 q 4 3 8 0" fill="none" style="stroke:var(--lit)" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
    return '<svg viewBox="0 0 1200 500" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">' + s + "</svg>";
  }

  /* ---------- Hiệu ứng xuất hiện khi cuộn ---------- */
  function initReveal() {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    document.documentElement.classList.add("motion");
    var root = document.getElementById("content");
    function stagger(sel, step) {
      root.querySelectorAll(sel).forEach(function (el, i) { el.style.setProperty("--d", (i * step).toFixed(2) + "s"); });
    }
    var blocks = Array.prototype.slice.call(root.querySelectorAll(".hero, .section"));
    blocks.forEach(function (b) {
      b.classList.add("block");
      Array.prototype.forEach.call(b.children, function (c, i) { c.style.setProperty("--d", (i * .12).toFixed(2) + "s"); });
    });
    stagger(".hero-info > *", .1);
    root.querySelectorAll(".grid").forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--d", (i * .14).toFixed(2) + "s"); });
    });
    stagger(".tags li", .07);
    stagger(".timeline li", .4);

    // Hàng đợi: nhiều block cùng lọt vào màn hình thì vẫn hiện lần lượt từng block một
    var queue = [], busy = true, GAP = 380;
    function pump() {
      var b = queue.shift();
      if (!b) { busy = false; return; }
      busy = true;
      b.classList.add("in");
      setTimeout(function () { if (b.classList.contains("in")) b.classList.add("done"); }, 1800);
      setTimeout(pump, GAP);
    }
    function enqueue(b) {
      if (b._queued) return;
      b._queued = true;
      queue.push(b);
      queue.sort(function (a, c) { return blocks.indexOf(a) - blocks.indexOf(c); });
      if (!busy) pump();
    }

    // Khi tải trang: chỉ hiện phần thông tin chính (block đầu tiên).
    // Các block còn lại chỉ hiện khi người xem cuộn tới (đỉnh block chạm 85% chiều cao màn hình).
    // Block ra khỏi màn hình thì được reset, cuộn tới lần nữa sẽ chạy lại hiệu ứng.
    queue.push(blocks[0]); blocks[0]._queued = true;
    setTimeout(pump, 450); // chờ cảnh bàn học hiện được một nửa

    function reset(b) {
      b._queued = false;
      var qi = queue.indexOf(b);
      if (qi > -1) queue.splice(qi, 1);
      b.classList.remove("in", "done");
    }
    function check() {
      var vh = window.innerHeight;
      blocks.forEach(function (b) {
        var r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) {
          // Block đã ra khỏi màn hình: đưa về trạng thái ẩn để lần sau cuộn tới lại chạy hiệu ứng
          if (b._queued) reset(b);
        } else if (!b._queued && r.top < vh * .85) {
          enqueue(b);
        }
      });
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; check(); });
    }, { passive: true });

    // Trang quá ngắn, không cuộn được (màn hình rất cao): hiện lần lượt tất cả để không bị ẩn mãi
    setTimeout(function () {
      if (document.documentElement.scrollHeight <= window.innerHeight + 4) blocks.forEach(enqueue);
    }, 900);
  }

  /* ---------- Trang Giới thiệu ---------- */
  function renderAbout() {
    var el = document.getElementById("content");
    var orient = empty(P.orientation) ? "<p>" + ph("định hướng phát triển") + "</p>" :
      '<ol class="timeline">' + P.orientation.map(function (o) {
        return "<li><strong>" + esc(o.title) + "</strong><span>" + linkify(esc(o.desc || "")) + "</span></li>";
      }).join("") + "</ol>";
    var goals = empty(P.portfolioGoals) ? "<p>" + ph("mục tiêu của Portfolio") + "</p>" :
      '<div class="grid grid-3">' + P.portfolioGoals.map(function (g) {
        return '<div class="card"><h3>' + esc(g.title) + '</h3><p class="muted" style="margin:0">' + linkify(esc(g.desc || "")) + "</p></div>";
      }).join("") + "</div>";

    el.innerHTML =
      '<div class="scene">' + sceneSVG() + "</div>" +
      '<section class="hero">' +
        '<div class="avatar-wrap">' +
          '<img class="avatar" id="avatar" src="' + esc(P.avatar || "assets/img/avatar.svg") + '" alt="Ảnh đại diện của ' + esc(P.name || "tác giả") + '">' +
          '<button class="avatar-toggle" id="avatar-toggle" type="button">◐ Xem ảnh đen trắng</button>' +
        "</div>" +
        '<div class="hero-info">' +
          '<span class="eyebrow">Giới thiệu</span>' +
          "<h1>" + (P.name ? "Xin chào, mình là " + esc(P.name) : ph("Họ và tên")) + "</h1>" +
          '<p class="lead">' + inline(P.tagline, "một câu giới thiệu ngắn") + "</p>" +
          '<dl class="meta-list">' +
            "<div><dt>Ngành học</dt><dd>" + inline(P.major, "ngành học") + "</dd></div>" +
            "<div><dt>Trường</dt><dd>" + esc(P.school) + "</dd></div>" +
          "</dl>" +
          '<a class="btn" href="projects.html">Xem các dự án →</a>' +
        "</div>" +
      "</section>" +

      '<section class="section"><h2>Về bản thân</h2>' + paras(P.intro, "đoạn giới thiệu bản thân") +
        "<h3>Sở thích</h3>" + list(P.hobbies, "sở thích", "tags") + "</section>" +

      (empty(P.introVideo) ? "" :
        '<section class="section"><h2>Video giới thiệu</h2>' + embedVideo(P.introVideo, "Video giới thiệu bản thân") + "</section>") +

      '<section class="section"><h2>Mục tiêu học tập</h2>' + list(P.learningGoals, "mục tiêu học tập") + "</section>" +
      '<section class="section"><h2>Định hướng phát triển cá nhân</h2>' + orient + "</section>" +
      '<section class="section"><h2>Mục tiêu của Portfolio</h2>' + goals + "</section>";

    initReveal();

    var av = document.getElementById("avatar");
    var at = document.getElementById("avatar-toggle");
    at.addEventListener("click", function () {
      var bw = av.classList.toggle("bw");
      at.textContent = bw ? "◑ Xem ảnh màu" : "◐ Xem ảnh đen trắng";
    });
  }

  /* ---------- Trang Dự án ---------- */
  var TAPE = ["#f4a582", "#b3a4f0", "#8fcfb8", "#f7c873", "#f29fb5", "#9cc3f0"];
  function cassette(n, title) {
    var c = TAPE[(n - 1) % TAPE.length];
    function reel(cx) {
      return '<g class="reel"><circle cx="' + cx + '" cy="128" r="17" fill="#fffaf0"/>' +
        '<g stroke="#2e2541" stroke-width="3" stroke-linecap="round" opacity=".6"><line x1="' + cx + '" y1="116" x2="' + cx + '" y2="122"/><line x1="' + (cx - 10) + '" y1="134" x2="' + (cx - 5) + '" y2="131"/><line x1="' + (cx + 10) + '" y1="134" x2="' + (cx + 5) + '" y2="131"/></g>' +
        '<circle cx="' + cx + '" cy="128" r="5" fill="#2e2541" opacity=".5"/></g>';
    }
    return '<svg viewBox="0 0 320 200" aria-hidden="true">' +
      '<rect x="6" y="6" width="308" height="188" rx="18" fill="' + c + '"/>' +
      '<rect x="6" y="6" width="308" height="188" rx="18" fill="none" stroke="#2e2541" stroke-opacity=".15" stroke-width="2"/>' +
      '<rect x="26" y="22" width="268" height="66" rx="8" fill="#fffaf0"/>' +
      '<rect x="26" y="22" width="268" height="12" rx="6" fill="#2e2541" opacity=".12"/>' +
      '<text x="40" y="70" font-family="Patrick Hand, cursive" font-size="30" fill="#2e2541">Bài 0' + n + "</text>" +
      '<text x="282" y="70" text-anchor="end" font-family="Patrick Hand, cursive" font-size="16" fill="#2e2541" opacity=".6">SIDE ' + (n <= 3 ? "A" : "B") + "</text>" +
      '<line x1="40" y1="80" x2="280" y2="80" stroke="#2e2541" stroke-opacity=".15"/>' +
      '<rect x="86" y="104" width="148" height="48" rx="24" fill="#2e2541" opacity=".28"/>' +
      reel(120) + reel(200) +
      '<rect x="146" y="118" width="28" height="20" rx="3" fill="#5b4a3f" opacity=".7"/>' +
      '<path d="M70 194 L84 164 L236 164 L250 194Z" fill="#2e2541" opacity=".12"/>' +
      '<circle cx="104" cy="180" r="5" fill="#2e2541" opacity=".25"/><circle cx="216" cy="180" r="5" fill="#2e2541" opacity=".25"/>' +
      "</svg>";
  }
  function projectCard(e) {
    var thumb = e.thumbnail ? '<img src="' + esc(e.thumbnail) + '" alt="" loading="lazy">' : cassette(e.number, e.title);
    return '<a class="project-card" href="' + exUrl(e.number) + '">' +
      '<div class="project-thumb">' + thumb + "</div>" +
      '<div class="project-body">' +
        '<span class="chapter">' + esc(e.chapter.split(":")[0]) + " · Mục " + esc(e.section) + "</span>" +
        "<h3>Bài " + e.number + " – " + esc(e.title) + "</h3>" +
        "<p>" + esc(e.summary) + "</p>" +
        '<div class="project-foot"><span>' + esc(e.chapter.split(":").slice(1).join(":").trim()) + "</span><span>Xem →</span></div>" +
      "</div></a>";
  }
  function renderProjects() {
    document.getElementById("content").innerHTML =
      '<header class="page-head"><span class="eyebrow">Dự án</span><h1>Các bài tập trong học phần</h1>' +
      '<p class="lead">Sáu bài tập tiêu biểu từ sáu chương của học phần, mỗi bài gồm mục tiêu, quá trình thực hiện và sản phẩm cuối cùng.</p></header>' +
      '<div class="grid grid-3">' + EX.map(projectCard).join("") + "</div>";
  }

  /* ---------- Trang bài tập ---------- */
  function renderExercise() {
    var n = parseInt(body.getAttribute("data-id"), 10);
    var i = EX.findIndex(function (e) { return e.number === n; });
    var e = EX[i];
    var el = document.getElementById("content");
    if (!e) { el.innerHTML = "<h1>Không tìm thấy bài tập</h1>"; return; }
    document.title = exLabel(e) + " | " + (P.name || "Portfolio");

    var diff = empty(e.difficulties) ? "<p>" + ph("khó khăn gặp phải và cách giải quyết") + "</p>" :
      renderTable(["Khó khăn", "Cách giải quyết"], e.difficulties.map(function (d) { return [d.problem, d.solution]; }));
    var ai = empty(e.aiUsage)
      ? "<p style=\"margin:0\">Không sử dụng công cụ AI trong bài tập này. " + ph("sửa nếu có dùng AI") + "</p>"
      : '<ul style="margin:0">' + e.aiUsage.map(function (a) {
          return "<li><strong>" + esc(a.tool) + ":</strong> " + linkify(esc(a.purpose)) + "</li>";
        }).join("") + "</ul>";

    var prev = EX[i - 1], next = EX[i + 1];

    el.innerHTML =
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Trang chủ</a><span>/</span><a href="projects.html">Dự án</a><span>/</span>Bài ' + e.number + "</nav>" +
      '<header class="page-head split">' +
        "<div>" +
          '<span class="eyebrow">' + esc(e.chapter) + "</span>" +
          "<h1>Bài " + e.number + " – " + esc(e.title) + "</h1>" +
          '<div class="ex-head"><span class="badge">Mục ' + esc(e.section) + "</span><span>" + esc(e.summary) + "</span></div>" +
        "</div>" +
        '<div class="now-playing" aria-label="Vị trí bài tập trong danh sách">' +
          '<div class="np-tape">' + cassette(e.number) + "</div>" +
          '<span class="np-label">Side ' + (e.number <= 3 ? "A" : "B") + " · Track 0" + e.number + "</span>" +
          '<span class="np-title">' + esc(e.title) + "</span>" +
          '<div class="np-bar"><span style="width:' + Math.round(e.number / EX.length * 100) + '%"></span></div>' +
          '<div class="np-meta"><span>Bài ' + e.number + " / " + EX.length + '</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>' +
        "</div>" +
      "</header>" +

      '<section class="section"><h2><span class="num">a</span>Mục tiêu bài tập</h2>' +
        paras(e.requirement, "yêu cầu của bài tập") +
        "<h3>Kỹ năng được rèn luyện</h3>" + list(e.skills, "kỹ năng được rèn luyện") +
      "</section>" +

      '<section class="section"><h2><span class="num">b</span>Tóm tắt quá trình thực hiện</h2>' +
        "<h3>Các bước thực hiện</h3>" +
        (empty(e.steps) ? "<p>" + ph("các bước thực hiện") + "</p>" :
          '<ol class="steps paper">' + e.steps.map(function (s) { return "<li>" + linkify(esc(s)) + "</li>"; }).join("") + "</ol>") +
        "<h3>Khó khăn và cách giải quyết</h3>" + diff +
        '<div class="ai-box taped"><h3>🤖 Công cụ AI đã sử dụng</h3>' + ai + "</div>" +
      "</section>" +

      '<section class="section"><h2><span class="num">c</span>Sản phẩm cuối cùng</h2>' +
        (e.blocks || []).map(renderBlock).join("") +
        '<div class="media-block">' + renderMedia(e.media) + "</div>" +
      "</section>" +

      '<nav class="ex-nav" aria-label="Điều hướng bài tập">' +
        (prev ? '<a class="prev" href="' + exUrl(prev.number) + '"><small><span class="ctrl" aria-hidden="true">⏮</span>Bài trước</small>' + esc(exLabel(prev)) + "</a>" : '<span class="disabled"></span>') +
        '<a class="back" href="projects.html"><span class="ctrl" aria-hidden="true">☰</span>Về trang Dự án</a>' +
        (next ? '<a class="next" href="' + exUrl(next.number) + '"><small>Bài tiếp theo<span class="ctrl" aria-hidden="true">⏭</span></small>' + esc(exLabel(next)) + "</a>"
              : '<a class="next" href="conclusion.html"><small>Tiếp theo<span class="ctrl" aria-hidden="true">⏭</span></small>Trang Tổng kết</a>') +
      "</nav>";

    bindCompare();
  }

  function bindCompare() {
    document.querySelectorAll("[data-compare]").forEach(function (box) {
      var tabs = box.querySelectorAll('[role="tab"]');
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) {
            var on = t === tab;
            t.setAttribute("aria-selected", on);
            document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
          });
        });
      });
    });
  }

  /* ---------- Trang Tổng kết ---------- */
  function renderConclusion() {
    var learn = empty(C.keyLearnings) ? "<p>" + ph("kiến thức và kỹ năng quan trọng nhất") + "</p>" :
      '<div class="grid grid-3 principles">' + C.keyLearnings.map(function (k) {
        return '<div class="card principle"><h3>' + esc(k.title) + "</h3><p>" + linkify(esc(k.desc || "")) + "</p></div>";
      }).join("") + "</div>";
    var vinyl =
      '<div class="vinyl" aria-hidden="true"><svg viewBox="0 0 320 300">' +
        '<g class="disc">' +
          '<circle cx="150" cy="150" r="140" fill="#1d1a26"/>' +
          [128, 116, 104, 92, 80, 68].map(function (r) { return '<circle cx="150" cy="150" r="' + r + '" fill="none" stroke="#fff" stroke-opacity=".07"/>'; }).join("") +
          '<path d="M60 70 A 128 128 0 0 1 150 22" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="6" stroke-linecap="round"/>' +
          '<circle cx="150" cy="150" r="48" style="fill:var(--accent)"/>' +
          '<circle cx="150" cy="150" r="40" fill="none" style="stroke:var(--accent-text)" stroke-opacity=".35" stroke-dasharray="3 5"/>' +
          '<text x="150" y="142" text-anchor="middle" font-family="Patrick Hand, cursive" font-size="20" style="fill:var(--accent-text)">Side B</text>' +
          '<text x="150" y="168" text-anchor="middle" font-family="Patrick Hand, cursive" font-size="13" style="fill:var(--accent-text)" opacity=".8">' + esc(P.courseCode || "") + "</text>" +
          '<circle cx="150" cy="150" r="4" style="fill:var(--bg)"/>' +
        "</g>" +
        '<g class="arm">' +
          '<circle cx="268" cy="34" r="16" style="fill:var(--surface-2);stroke:var(--border)" stroke-width="2"/>' +
          '<path d="M268 34 L262 120 L222 178" fill="none" style="stroke:var(--muted)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<rect x="206" y="172" width="26" height="16" rx="3" transform="rotate(35 219 180)" style="fill:var(--accent-2)"/>' +
          '<circle cx="268" cy="34" r="5" style="fill:var(--muted)"/>' +
        "</g>" +
      "</svg></div>";
    var tracks = '<ol class="tracklist">' + EX.map(function (e) {
      return '<li><a href="' + exUrl(e.number) + '">' +
        '<span class="no">0' + e.number + "</span>" +
        '<span class="t">' + esc(e.title) + "<small>" + esc(e.chapter) + "</small></span>" +
        '<span class="play"><span class="play-icon" aria-hidden="true">▶</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>' +
      "</a></li>";
    }).join("") + "</ol>";
    var chal = empty(C.challenges) ? "<p>" + ph("thách thức đã gặp") + "</p>" :
      renderTable(["Thách thức", "Cách vượt qua"], C.challenges.map(function (c) { return [c.problem, c.solution]; }));
    var tools = empty(C.aiTools) ? "<p>" + ph("bảng công cụ AI đã dùng") + "</p>" :
      renderTable(["Công cụ AI", "Mục đích sử dụng", "Sử dụng ở đâu"], C.aiTools.map(function (a) { return [a.tool, a.purpose, a.where]; }));

    document.getElementById("content").innerHTML =
      '<header class="page-head split"><div><span class="eyebrow">Tổng kết</span><h1>Nhìn lại hành trình</h1>' +
      '<p class="lead">Những trải nghiệm, kiến thức và kỹ năng có được sau khi hoàn thành học phần và xây dựng Portfolio.</p></div>' + vinyl + "</header>" +
      '<section class="section"><h2>Trải nghiệm và cảm nhận</h2><div class="paper taped">' + paras(C.experience, "trải nghiệm và cảm nhận cá nhân") + "</div></section>" +
      '<section class="section"><h2>Kiến thức và kỹ năng quan trọng nhất</h2>' + learn + "</section>" +
      '<section class="section"><h2>Điểm tâm đắc nhất</h2><div class="paper taped tape-right">' + paras(C.highlight, "điểm tâm đắc nhất") + "</div></section>" +
      '<section class="section"><h2>Thách thức khi xây dựng Portfolio</h2>' + chal + "</section>" +
      '<section class="section"><h2>Các bài tập đã hoàn thành</h2>' + tracks + "</section>" +
      '<section class="section"><h2>Công cụ AI đã sử dụng</h2>' + tools + "</section>" +
      (empty(C.closing) ? "" : '<section class="section"><div class="paper letter taped">' + paras(C.closing, "") +
        (P.name ? '<span class="sign">— ' + esc(P.name) + "</span>" : "") + "</div></section>");
  }

  /* ---------- Lightbox cho ảnh ---------- */
  function bindLightbox() {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Xem ảnh phóng to");
    box.innerHTML = "<figure><img alt=\"\"><p></p></figure>";
    document.body.appendChild(box);
    document.addEventListener("click", function (e) {
      var img = e.target.closest && e.target.closest("[data-lightbox]");
      if (img) {
        box.querySelector("img").src = img.src;
        box.querySelector("img").alt = img.alt;
        box.querySelector("p").textContent = img.getAttribute("data-caption") || "";
        box.classList.add("open");
      } else if (box.contains(e.target)) {
        box.classList.remove("open");
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") box.classList.remove("open"); });
  }

  /* ---------- Khởi động ---------- */
  renderHeader();
  renderFooter();
  if (page === "about") renderAbout();
  else if (page === "projects") renderProjects();
  else if (page === "exercise") renderExercise();
  else if (page === "conclusion") renderConclusion();
  bindLightbox();
})();
