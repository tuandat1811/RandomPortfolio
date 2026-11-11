# Portfolio – Nhập môn Công nghệ số và ứng dụng AI (INF2501)

Website tĩnh viết bằng HTML, CSS và JavaScript thuần, không cần cài đặt gì.

```
RandomPortfolio/
├── site/                 ← THƯ MỤC ĐƯỢC ĐĂNG LÊN VERCEL (Root Directory)
│   ├── index.html        Trang Giới thiệu (About Me)
│   ├── projects.html     Trang Dự án (tổng quan 6 bài)
│   ├── bai-1.html … bai-6.html   6 trang bài tập
│   ├── conclusion.html   Trang Tổng kết
│   ├── 404.html
│   ├── css/style.css
│   ├── js/data.js        ← TOÀN BỘ NỘI DUNG nằm ở đây
│   ├── js/main.js        Dựng giao diện từ data.js
│   └── assets/uploads/   Ảnh tải lên qua trang quản lý
└── admin/                ← Trang quản lý nội dung, CHỈ chạy trên máy, KHÔNG đăng lên
    ├── index.html
    └── admin.js
```

## 1. Nhập nội dung (không cần biết code)

1. Mở `admin/index.html` bằng **Chrome hoặc Edge** (nhấp đúp vào file).
2. Bấm **📁 Chọn thư mục dự án** và chọn thư mục `RandomPortfolio`, rồi cho phép trình duyệt chỉnh sửa.
3. Điền từng tab: **Giới thiệu → Bài 1 … Bài 6 → Tổng kết**.
   - Ảnh: chọn file hoặc kéo thả nhiều ảnh vào ô “Kéo thả”.
   - Video, PDF: tải lên Google Drive hoặc YouTube, **bật chia sẻ “Bất kỳ ai có đường liên kết”**, rồi dán link.
   - Ô có dấu `|`: mỗi dòng một mục, các phần ngăn bằng dấu `|`.
4. Bấm **💾 Lưu** (hoặc Ctrl + S). Bấm **Xem site** để kiểm tra kết quả.

Những chỗ chưa điền sẽ hiện trên site dưới dạng *[Chưa điền: …]* để dễ phát hiện.

> Firefox không ghi file trực tiếp được: nút Lưu sẽ tải `data.js` và ảnh về máy, bạn tự chép
> `data.js` vào `site/js/` và ảnh vào `site/assets/uploads/`.

## 2. Đăng lên Vercel

Vercel lấy code từ repo GitHub `RandomPortfolio` và tự đăng lại mỗi khi có commit mới.

1. Đăng nhập https://vercel.com bằng tài khoản GitHub.
2. **Add New… → Project**, chọn repo `RandomPortfolio` → **Import**.
3. Ở màn hình cấu hình:
   - **Framework Preset:** `Other`
   - **Root Directory:** bấm **Edit** và chọn **`site`** (chỉ đăng thư mục này, trang admin sẽ không bị đưa lên mạng)
   - Không cần Build Command hay Output Directory.
4. Bấm **Deploy**. Site sẽ có địa chỉ dạng `random-portfolio.vercel.app`; đổi tên trong **Settings → Domains**.
5. Mỗi lần sửa nội dung: lưu trong trang admin, rồi commit và push lên GitHub. Vercel tự đăng bản mới sau khoảng 1 phút.
6. *(Không bắt buộc, để lấy điểm thưởng)* **Settings → Domains** để gắn tên miền riêng.

## 3. Kiểm tra trước khi nộp

- [ ] Không còn chữ *[Chưa điền: …]* trên trang nào.
- [ ] Mở site trên điện thoại: menu ☰, trang Dự án và 6 trang bài tập hiển thị tốt.
- [ ] Mở mọi link Drive/YouTube trong **cửa sổ ẩn danh**: phải xem được mà không cần đăng nhập.
- [ ] Ảnh của người khác hoặc do AI tạo đã ghi nguồn.
- [ ] Mỗi bài đã ghi rõ công cụ AI và mục đích sử dụng (hoặc ghi rõ là không dùng).
- [ ] Không đăng số CCCD, địa chỉ nhà, số tài khoản ngân hàng.
- [ ] Không push hoặc deploy lại sau hạn nộp bài.
