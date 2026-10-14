# Document Management Frontend (DocManager Enterprise DMS)

React + TypeScript + Vite frontend cho hệ thống quản lý tài liệu doanh nghiệp, hoạt động độc lập và hoàn chỉnh với mock data & local storage engine.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6**
- **React Router 7** – định tuyến SPA
- **TanStack React Query** – quản lý cache & server state
- **Zustand** – client state (auth persistence)
- **Axios** – API client
- **Tailwind CSS** – giao diện hiện đại, responsive
- **Lucide React** – bộ icon đồ họa trực quan

## Cấu trúc thư mục

```
src/
├── app/                  # App root, routes, 404
├── components/
│   ├── common/           # LoadingState, EmptyState, ErrorState, ProtectedRoute
│   ├── layout/           # Sidebar, Header, AppLayout
│   └── ui/               # StatusBadge, SignatureBadge, FileTypeIcon, Modal, Toast
├── features/
│   ├── auth/             # LoginPage (Hỗ trợ 1-click Quick Demo Login)
│   ├── dashboard/        # Dashboard KPIs, tỷ lệ trạng thái, tài liệu gần đây
│   ├── documents/        # DocumentListPage & DocumentDetailPage (Metadata, SHA-256, Versioning)
│   ├── upload/           # UploadPage (Drag & Drop, Metadata configuration, Progress)
│   ├── preview/          # PreviewPage (Zoom, chuyển trang, văn bản pháp quy, dấu ký số)
│   └── search/           # SearchPage (Tìm kiếm toàn văn, lưu bộ lọc, tra cứu nhanh)
├── hooks/                # Custom hooks
├── services/             # apiClient, documentService (CRUD, Versioning, Digital Signature, Storage)
├── store/                # Zustand authStore
├── types/                # TypeScript interfaces
├── utils/                # cn, formatters (formatBytes, formatDate, statusMap)
└── styles/               # Global CSS + Tailwind
```

## Khởi chạy dự án

```bash
# Di chuyển vào thư mục front-end
cd front-end

# Cài đặt dependency (nếu chưa cài)
npm install

# Khởi chạy máy chủ phát triển
npm run dev

# Kiểm tra cú pháp và linter
npm run lint

# Đóng gói bản production
npm run build

# Xem trước bản production build
npm run preview
```

## Đăng nhập Demo

- **Cách 1**: Nhấn nút **"Đăng nhập nhanh 1-Click (Tài khoản Quản trị Demo)"** tại trang đăng nhập.
- **Cách 2**: Nhập thông tin:
  - **Email**: `admin@example.com`
  - **Mật khẩu**: `admin123`

## Các tính năng đã hoàn thiện

| Tính năng | Chi tiết thực thi | Trạng thái |
|---|---|---|
| **Xác thực (Authentication)** | Đăng nhập form, ghi nhớ token qua LocalStorage, nút đăng nhập nhanh 1-click, Guard bảo vệ route | Hoàn thành |
| **Tổng quan (Dashboard)** | 4 thẻ thống kê số liệu thực tế, thanh phân bố trạng thái, danh sách tài liệu gần đây, liên kết chi tiết | Hoàn thành |
| **Danh sách tài liệu (List)** | Tìm kiếm tức thời, thanh tab lọc trạng thái (Đã duyệt, Chờ duyệt, Bản nháp, Từ chối, Lưu trữ), lọc thẻ Tag, phân trang tùy chỉnh số dòng, xuất tệp CSV, xóa tài liệu | Hoàn thành |
| **Chi tiết tài liệu (Detail)** | Hiển thị siêu dữ liệu tệp, tính toán & sao chép mã băm SHA-256, chuyển đổi trạng thái duyệt, in ấn văn bản | Hoàn thành |
| **Ký số điện tử (Digital Signature)** | Cấp chứng thư và chữ ký số theo thuật toán RSA-2048/SHA-256, huy hiệu chứng thực, thông tin cơ quan cấp chứng thư | Hoàn thành |
| **Quản lý phiên bản (Versioning)** | Lưu trữ lịch sử đa phiên bản (v1, v2, v3...), ghi chú thay đổi (changelog), tải lên bản mới, tải về từng phiên bản | Hoàn thành |
| **Tải lên tài liệu (Upload)** | Kéo & thả (Drag & Drop), chọn file từ máy hoặc nạp file mẫu thử nghiệm nhanh, nhập tiêu đề/thẻ/mô tả, thanh tiến trình mô phỏng | Hoàn thành |
| **Xem trước văn bản (Preview)** | Trình đọc trực quan hỗ trợ thu phóng (Zoom 60% - 160%), lật trang (Page 1/2), định dạng văn bản hành chính quy chuẩn, hiển thị con dấu ký số điện tử | Hoàn thành |
| **Tra cứu nâng cao (Search)** | Tìm kiếm toàn văn, từ khóa gợi ý, quản lý các bộ lọc đã lưu (Saved Searches), lọc theo trạng thái | Hoàn thành |
| **Thông báo & Phản hồi (Feedback)** | Hệ thống Toast thông báo thao tác, biểu tượng chuông trên Header hiển thị danh sách thông báo hoạt động | Hoàn thành |
| **Khôi phục dữ liệu mẫu** | Nút "Khôi phục dữ liệu mẫu" trong Sidebar giúp đặt lại dữ liệu demo bất kỳ lúc nào | Hoàn thành |
