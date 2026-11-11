/* ==========================================================================
   Trang quản lý nội dung – chạy trên máy, ghi vào site/js/data.js
   và chép ảnh vào site/assets/uploads/
   ========================================================================== */
(function () {
  "use strict";

  var state = JSON.parse(JSON.stringify(window.SITE_DATA || {}));
  var pending = {};          // "assets/uploads/x.jpg" -> File chưa ghi xuống đĩa
  var previews = {};         // đường dẫn -> objectURL để xem trước
  var siteDir = null;        // FileSystemDirectoryHandle của thư mục site
  var dirty = false;
  var current = "profile";
  var canFS = "showDirectoryPicker" in window;

  var $ = function (id) { return document.getElementById(id); };
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") el.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }

  /* ---------- Trạng thái ---------- */
  function setDirty(v) {
    dirty = v;
    var s = $("status");
    var n = Object.keys(pending).length;
    s.className = "status" + (v ? " dirty" : "");
    s.textContent = v
      ? "● Có thay đổi chưa lưu" + (n ? " (" + n + " ảnh mới)" : "")
      : "✓ Đã lưu" + (siteDir ? " vào thư mục dự án" : "");
  }
  function touch() { setDirty(true); }
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  function renderNotice() {
    $("mode-notice").innerHTML = siteDir
      ? "✅ Đã kết nối thư mục <strong>" + siteDir.name + "</strong>. Bấm <strong>Lưu</strong> sẽ ghi thẳng vào <code>js/data.js</code> và chép ảnh vào <code>assets/uploads/</code>. Sau đó bấm <strong>Xem site</strong> (tải lại trang) để kiểm tra."
      : canFS
        ? "Bấm <strong>📁 Chọn thư mục dự án</strong> và chọn thư mục <code>RandomPortfolio</code> (hoặc thư mục <code>site</code>) để lưu trực tiếp. Chưa chọn thì nút Lưu sẽ tải file về máy."
        : "Trình duyệt này không hỗ trợ ghi file trực tiếp (hãy dùng Chrome hoặc Edge). Nút <strong>Lưu</strong> sẽ tải <code>data.js</code> và ảnh về máy; bạn tự chép <code>data.js</code> vào <code>site/js/</code> và ảnh vào <code>site/assets/uploads/</code>.";
  }

  /* ---------- Kết nối thư mục ---------- */
  async function pickDir() {
    try {
      var dir = await window.showDirectoryPicker({ mode: "readwrite" });
      var site = dir;
      try { site = await dir.getDirectoryHandle("site"); } catch (e) {}
      var jsDir = await site.getDirectoryHandle("js");
      var file = await (await jsDir.getFileHandle("data.js")).getFile();
      var text = await file.text();
      var data = parseDataJs(text);
      if (dirty && !confirm("Bạn có thay đổi chưa lưu. Tải lại dữ liệu từ thư mục sẽ bỏ các thay đổi đó. Tiếp tục?")) return;
      siteDir = site;
      state = data;
      pending = {};
      renderNotice();
      render();
      setDirty(false);
    } catch (e) {
      if (e.name !== "AbortError") alert("Không mở được thư mục. Hãy chọn thư mục RandomPortfolio hoặc thư mục site (có js/data.js bên trong).\n\n" + e.message);
    }
  }
  function parseDataJs(text) {
    var start = text.indexOf("{"), end = text.lastIndexOf("}");
    return JSON.parse(text.slice(start, end + 1));
  }
  function serialize() { return "window.SITE_DATA = " + JSON.stringify(state, null, 2) + ";\n"; }

  /* ---------- Lưu ---------- */
  async function save() {
    try {
      if (siteDir) {
        var assets = await siteDir.getDirectoryHandle("assets", { create: true });
        var up = await assets.getDirectoryHandle("uploads", { create: true });
        for (var path in pending) {
          var name = path.split("/").pop();
          var fh = await up.getFileHandle(name, { create: true });
          var w = await fh.createWritable();
          await w.write(pending[path]);
          await w.close();
        }
        var jsDir = await siteDir.getDirectoryHandle("js");
        var dh = await jsDir.getFileHandle("data.js", { create: true });
        var w2 = await dh.createWritable();
        await w2.write(serialize());
        await w2.close();
        pending = {};
        setDirty(false);
      } else {
        download(new Blob([serialize()], { type: "text/javascript" }), "data.js");
        Object.keys(pending).forEach(function (p) { download(pending[p], p.split("/").pop()); });
        alert("Đã tải về data.js" + (Object.keys(pending).length ? " và " + Object.keys(pending).length + " ảnh" : "") +
          ".\n\n• Chép data.js vào site/js/ (ghi đè)\n• Chép ảnh vào site/assets/uploads/");
        pending = {};
        setDirty(false);
      }
    } catch (e) {
      alert("Lưu không thành công: " + e.message);
    }
  }
  function download(blob, name) {
    var a = h("a", { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- Trường nhập liệu ---------- */
  function field(label, hint, input) {
    return h("div", { class: "f" }, [h("label", { text: label }), hint ? h("span", { class: "hint", text: hint }) : null, input]);
  }
  function text(obj, key, label, hint, type) {
    var i = h("input", { type: type || "text", value: obj[key] || "" });
    i.addEventListener("input", function () { obj[key] = i.value; touch(); });
    return field(label, hint, i);
  }
  function area(obj, key, label, hint, rows, mono) {
    var t = h("textarea", { rows: rows || 5, class: mono ? "mono" : "" });
    t.value = obj[key] || "";
    t.addEventListener("input", function () { obj[key] = t.value; touch(); });
    return field(label, hint, t);
  }
  /* Mảng chuỗi: mỗi dòng một mục */
  function lines(obj, key, label, hint) {
    var t = h("textarea", { rows: 4 });
    t.value = (obj[key] || []).join("\n");
    t.addEventListener("input", function () {
      obj[key] = t.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); touch();
    });
    return field(label, (hint ? hint + " " : "") + "Mỗi dòng một mục.", t);
  }
  /* Mảng đối tượng: mỗi dòng "a | b | c" */
  function pipes(obj, key, keys, label, hint) {
    var t = h("textarea", { rows: 4 });
    t.value = (obj[key] || []).map(function (o) { return keys.map(function (k) { return o[k] || ""; }).join(" | "); }).join("\n");
    t.addEventListener("input", function () {
      obj[key] = t.value.split("\n").filter(function (l) { return l.trim(); }).map(function (l) {
        var parts = l.split("|"), o = {};
        keys.forEach(function (k, i) { o[k] = (i === keys.length - 1 ? parts.slice(i).join("|") : parts[i] || "").trim(); });
        return o;
      });
      touch();
    });
    return field(label, hint + " Mỗi dòng một mục, các phần ngăn bằng dấu |", t);
  }
  /* Bảng: mỗi dòng một hàng, cột ngăn bằng | */
  function rows(obj, key, label, hint) {
    var t = h("textarea", { rows: 5, class: "mono" });
    t.value = (obj[key] || []).map(function (r) { return r.join(" | "); }).join("\n");
    t.addEventListener("input", function () {
      obj[key] = t.value.split("\n").filter(function (l) { return l.trim(); })
        .map(function (l) { return l.split("|").map(function (c) { return c.trim(); }); });
      touch();
    });
    return field(label, hint, t);
  }

  function srcFor(path) {
    if (!path) return "";
    if (previews[path]) return previews[path];
    return /^(https?:|data:)/.test(path) ? path : "../site/" + path;
  }
  function slug(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function addFile(file, prefix) {
    var ext = (file.name.match(/\.[a-z0-9]+$/i) || [".jpg"])[0].toLowerCase();
    var base = slug(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "anh";
    var path = "assets/uploads/" + prefix + "-" + base + "-" + Date.now().toString(36) + ext;
    pending[path] = file;
    previews[path] = URL.createObjectURL(file);
    return path;
  }
  /* Chọn một ảnh, gán vào obj[key] */
  function imagePick(obj, key, label, prefix) {
    var img = h("img", { alt: "" });
    var p = h("span", { class: "path" });
    function show() { img.src = srcFor(obj[key]) || ""; img.style.visibility = obj[key] ? "visible" : "hidden"; p.textContent = obj[key] || "Chưa có ảnh"; }
    var input = h("input", { type: "file", accept: "image/*" });
    input.addEventListener("change", function () {
      if (input.files[0]) { obj[key] = addFile(input.files[0], prefix); show(); touch(); }
    });
    var clear = h("button", { class: "small-btn danger", type: "button", text: "Xoá", onclick: function () { obj[key] = ""; show(); touch(); } });
    show();
    return field(label, "Chọn ảnh từ máy (jpg, png, webp). Nên nén ảnh dưới 500KB.", h("div", { class: "img-pick" }, [img, h("div", null, [input, h("br"), p]), clear]));
  }

  /* ---------- Danh sách lặp (media, compare, block) ---------- */
  function moveBtns(arr, i) {
    return h("span", null, [
      h("button", { class: "small-btn", type: "button", text: "↑", title: "Lên", onclick: function () { if (i > 0) { var t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; touch(); render(); } } }),
      " ",
      h("button", { class: "small-btn", type: "button", text: "↓", title: "Xuống", onclick: function () { if (i < arr.length - 1) { var t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; touch(); render(); } } }),
      " ",
      h("button", { class: "small-btn danger", type: "button", text: "Xoá", onclick: function () { if (confirm("Xoá mục này?")) { arr.splice(i, 1); touch(); render(); } } })
    ]);
  }

  var MEDIA_LABEL = { image: "🖼 Ảnh", pdf: "📄 PDF / tài liệu", video: "🎬 Video", link: "🔗 Liên kết" };

  function mediaEditor(ex) {
    ex.media = ex.media || [];
    var box = h("fieldset", null, [h("legend", { text: "Sản phẩm: ảnh, PDF, video, liên kết" })]);
    ex.media.forEach(function (m, i) {
      var item = h("div", { class: "item" }, [h("div", { class: "item-head" }, [h("span", { text: (i + 1) + ". " + MEDIA_LABEL[m.type] }), moveBtns(ex.media, i)])]);
      if (m.type === "image") {
        item.appendChild(imagePick(m, "src", "Ảnh", "bai" + ex.number));
        item.appendChild(text(m, "caption", "Chú thích", "Hiển thị dưới dạng “Hình X. …”"));
        item.appendChild(text(m, "credit", "Nguồn (nếu là ảnh của người khác hoặc do AI tạo)", "Ví dụ: Tạo bằng Canva AI / Ảnh chụp màn hình của tác giả"));
      } else {
        var hint = m.type === "video" ? "Link YouTube hoặc Google Drive (đã bật “Bất kỳ ai có đường liên kết”)."
          : m.type === "pdf" ? "Link Google Drive / Google Docs / Slides đã chia sẻ công khai."
          : "Đường dẫn bất kỳ, ví dụ Trello, Notion, Canva.";
        item.appendChild(text(m, "url", "Đường dẫn", hint, "url"));
        item.appendChild(text(m, "caption", "Tiêu đề / chú thích"));
      }
      box.appendChild(item);
    });

    var drop = h("div", { class: "drop", text: "Kéo thả nhiều ảnh vào đây để thêm nhanh" });
    drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", function () { drop.classList.remove("over"); });
    drop.addEventListener("drop", function (e) {
      e.preventDefault(); drop.classList.remove("over");
      Array.prototype.forEach.call(e.dataTransfer.files, function (f) {
        if (/^image\//.test(f.type)) ex.media.push({ type: "image", src: addFile(f, "bai" + ex.number), caption: f.name.replace(/\.[^.]+$/, ""), credit: "" });
      });
      touch(); render();
    });
    box.appendChild(drop);
    box.appendChild(h("div", { class: "add-row", style: "margin-top:12px" }, Object.keys(MEDIA_LABEL).map(function (t) {
      return h("button", { class: "small-btn", type: "button", text: "+ " + MEDIA_LABEL[t], onclick: function () {
        ex.media.push(t === "image" ? { type: t, src: "", caption: "", credit: "" } : { type: t, url: "", caption: "" }); touch(); render();
      } });
    })));
    return box;
  }

  var BLOCK_LABEL = {
    table: "Bảng", list: "Danh sách", text: "Đoạn văn", tree: "Cây thư mục",
    timeline: "Dòng thời gian", principles: "Thẻ nguyên tắc", compare: "So sánh Prompt"
  };
  function newBlock(t) {
    switch (t) {
      case "table": return { type: t, title: "", headers: ["Cột 1", "Cột 2"], rows: [] };
      case "tree": case "text": return { type: t, title: "", text: "" };
      default: return { type: t, title: "", items: [] };
    }
  }

  function blockEditor(ex) {
    ex.blocks = ex.blocks || [];
    var box = h("fieldset", null, [h("legend", { text: "Nội dung trình bày sản phẩm (bảng, sơ đồ, so sánh…)" })]);
    ex.blocks.forEach(function (b, i) {
      var item = h("div", { class: "item" }, [h("div", { class: "item-head" }, [h("span", { text: (i + 1) + ". " + BLOCK_LABEL[b.type] }), moveBtns(ex.blocks, i)])]);
      item.appendChild(text(b, "title", "Tiêu đề khối"));
      switch (b.type) {
        case "table":
          var hd = h("input", { type: "text", value: (b.headers || []).join(" | ") });
          hd.addEventListener("input", function () { b.headers = hd.value.split("|").map(function (s) { return s.trim(); }).filter(Boolean); touch(); });
          item.appendChild(field("Tên các cột", "Ngăn bằng dấu |", hd));
          item.appendChild(rows(b, "rows", "Các hàng", "Mỗi dòng một hàng, các ô ngăn bằng dấu | theo đúng thứ tự cột."));
          break;
        case "tree":
          item.appendChild(area(b, "text", "Sơ đồ cây", "Gõ hoặc dán sơ đồ, giữ nguyên khoảng trắng. Ví dụ:\nHocTap/\n├── HK1/\n│   └── INF2501/", 10, true));
          break;
        case "text":
          item.appendChild(area(b, "text", "Nội dung", "Dòng trống để tách đoạn.", 6));
          break;
        case "list":
          item.appendChild(lines(b, "items", "Các mục"));
          break;
        case "timeline":
          item.appendChild(pipes(b, "items", ["title", "desc"], "Các mốc", "Dạng: Tuần 1 | Lập bảng phân công trên Trello."));
          break;
        case "principles":
          item.appendChild(pipes(b, "items", ["title", "desc"], "Các nguyên tắc", "Dạng: Minh bạch | Luôn ghi rõ phần nào có AI hỗ trợ."));
          break;
        case "compare":
          b.items = b.items || [];
          b.items.forEach(function (c, k) {
            var sub = h("div", { class: "item", style: "background:var(--surface)" }, [h("div", { class: "item-head" }, [h("span", { text: "Cặp so sánh " + (k + 1) }), moveBtns(b.items, k)])]);
            sub.appendChild(text(c, "task", "Tác vụ học tập", "Ví dụ: Tóm tắt một chương giáo trình"));
            sub.appendChild(area(c, "before", "Prompt ban đầu", "", 3, true));
            sub.appendChild(area(c, "outputBefore", "Kết quả AI với Prompt ban đầu", "", 4));
            sub.appendChild(area(c, "after", "Prompt cải tiến", "", 4, true));
            sub.appendChild(area(c, "outputAfter", "Kết quả AI với Prompt cải tiến", "", 4));
            sub.appendChild(area(c, "note", "Nhận xét sự khác biệt", "", 3));
            item.appendChild(sub);
          });
          item.appendChild(h("button", { class: "small-btn", type: "button", text: "+ Thêm cặp so sánh", onclick: function () {
            b.items.push({ task: "", before: "", outputBefore: "", after: "", outputAfter: "", note: "" }); touch(); render();
          } }));
          break;
      }
      box.appendChild(item);
    });
    box.appendChild(h("div", { class: "add-row" }, Object.keys(BLOCK_LABEL).map(function (t) {
      return h("button", { class: "small-btn", type: "button", text: "+ " + BLOCK_LABEL[t], onclick: function () { ex.blocks.push(newBlock(t)); touch(); render(); } });
    })));
    return box;
  }

  /* ---------- Các tab ---------- */
  function profilePanel() {
    var p = state.profile;
    return [
      h("fieldset", null, [h("legend", { text: "Thông tin cá nhân (hiện ở trang Giới thiệu và chân trang)" }),
        text(p, "name", "Họ và tên"),
        text(p, "studentId", "Mã sinh viên"),
        text(p, "className", "Lớp"),
        text(p, "major", "Ngành học"),
        text(p, "school", "Trường"),
        text(p, "tagline", "Câu giới thiệu ngắn", "Một câu hiện ngay dưới tên."),
        imagePick(p, "avatar", "Ảnh đại diện", "avatar"),
        area(p, "intro", "Giới thiệu bản thân", "Dòng trống để tách đoạn.", 5),
        lines(p, "hobbies", "Sở thích"),
        text(p, "introVideo", "Video giới thiệu bản thân (không bắt buộc, có thể lấy điểm thưởng)", "Link YouTube hoặc Google Drive.", "url")
      ]),
      h("fieldset", null, [h("legend", { text: "Mục tiêu và định hướng" }),
        lines(p, "learningGoals", "Mục tiêu học tập"),
        pipes(p, "orientation", ["title", "desc"], "Định hướng phát triển cá nhân", "Dạng: Năm 1 – 2 | Nắm vững kiến thức nền tảng…"),
        pipes(p, "portfolioGoals", ["title", "desc"], "Mục tiêu của Portfolio", "Dạng: Lưu trữ sản phẩm | Tập hợp bài tập để dễ truy cập và chia sẻ.")
      ])
    ];
  }

  function exercisePanel(ex) {
    return [
      h("fieldset", null, [h("legend", { text: "Bài " + ex.number + " – " + ex.title }),
        text(ex, "title", "Tên bài tập"),
        text(ex, "chapter", "Chương"),
        text(ex, "section", "Mục"),
        text(ex, "summary", "Tóm tắt một câu", "Hiện trên thẻ ở trang Dự án."),
        imagePick(ex, "thumbnail", "Ảnh đại diện cho thẻ bài tập (không bắt buộc)", "bai" + ex.number + "-thumb")
      ]),
      h("fieldset", null, [h("legend", { text: "a) Mục tiêu bài tập" }),
        area(ex, "requirement", "Yêu cầu của bài tập", "Bài tập yêu cầu làm gì.", 4),
        lines(ex, "skills", "Kỹ năng được rèn luyện")
      ]),
      h("fieldset", null, [h("legend", { text: "b) Tóm tắt quá trình thực hiện" }),
        lines(ex, "steps", "Các bước thực hiện", "Ghi rõ công cụ đã dùng ở mỗi bước."),
        pipes(ex, "difficulties", ["problem", "solution"], "Khó khăn và cách giải quyết", "Dạng: Khó khăn | Cách giải quyết."),
        pipes(ex, "aiUsage", ["tool", "purpose"], "Công cụ AI đã sử dụng", "Dạng: ChatGPT | Gợi ý dàn ý cho phần mô tả. Để trống nếu không dùng AI.")
      ]),
      blockEditor(ex),
      mediaEditor(ex)
    ];
  }

  function conclusionPanel() {
    var c = state.conclusion;
    return [
      h("fieldset", null, [h("legend", { text: "Trang Tổng kết (phần cảm nhận phải do chính sinh viên viết)" }),
        area(c, "experience", "Trải nghiệm và cảm nhận cá nhân", "Dòng trống để tách đoạn.", 7),
        pipes(c, "keyLearnings", ["title", "desc"], "Kiến thức và kỹ năng quan trọng nhất", "Dạng: Viết Prompt | Biết đặt vai trò, ngữ cảnh và định dạng đầu ra."),
        area(c, "highlight", "Điểm tâm đắc nhất", "", 4),
        pipes(c, "challenges", ["problem", "solution"], "Thách thức khi xây dựng Portfolio", "Dạng: Thách thức | Cách vượt qua."),
        pipes(c, "aiTools", ["tool", "purpose", "where"], "Bảng công cụ AI đã sử dụng", "Dạng: Tên công cụ | Mục đích | Dùng ở bài/phần nào."),
        area(c, "closing", "Lời kết (không bắt buộc)", "", 3)
      ])
    ];
  }

  /* ---------- Render ---------- */
  function tabs() {
    var list = [["profile", "Giới thiệu"]].concat(
      (state.exercises || []).map(function (e) { return ["ex" + e.number, "Bài " + e.number]; }),
      [["conclusion", "Tổng kết"]]
    );
    var el = $("tabs");
    el.innerHTML = "";
    list.forEach(function (t) {
      el.appendChild(h("button", { type: "button", role: "tab", "aria-selected": String(current === t[0]), text: t[1],
        onclick: function () { current = t[0]; render(); window.scrollTo(0, 0); } }));
    });
  }
  function render() {
    var y = window.scrollY;
    tabs();
    var panel = $("panel");
    panel.innerHTML = "";
    var nodes;
    if (current === "profile") nodes = profilePanel();
    else if (current === "conclusion") nodes = conclusionPanel();
    else {
      var n = parseInt(current.slice(2), 10);
      nodes = exercisePanel(state.exercises.filter(function (e) { return e.number === n; })[0]);
    }
    nodes.forEach(function (n) { panel.appendChild(n); });
    window.scrollTo(0, y);
  }

  $("pick-dir").addEventListener("click", pickDir);
  if (!canFS) $("pick-dir").style.display = "none";
  $("save").addEventListener("click", save);
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  });

  if (!state.profile) { document.body.innerHTML = "<p style='padding:24px'>Không đọc được site/js/data.js.</p>"; return; }
  renderNotice();
  render();
  setDirty(false);
  $("status").textContent = "Dữ liệu đã tải từ site/js/data.js";
})();
