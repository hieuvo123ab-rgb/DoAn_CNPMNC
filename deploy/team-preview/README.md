# EDMS Team Preview — triển khai an toàn trên Railway

**Trạng thái:** đã tạo môi trường riêng trên Railway; URL: https://edms-preview-web-team-preview.up.railway.app. Tiếp tục kiểm thử giao diện, phân quyền và chức năng trên hosting trước khi coi là nghiệm thu.

## Kiến trúc

- Một dịch vụ Web công khai (Nginx :8080) chứa giao diện React build, proxy cùng domain `/api/` và `/ws-edms` tới Spring Boot :8081 nội bộ.
- PostgreSQL **mới** dành riêng cho Team Preview, dùng private network Railway, tuyệt đối không nối tới CSDL EDMS thật.
- Volume **mới** gắn ở `/app/persist` (bao gồm uploads và KeyStore tự tạo **chỉ dành cho Preview**).
- Profile `prod,team-preview`, vô hiệu hóa failure simulation và không khởi tạo demo user cố định từ DataInitializer.
- Tạo ba tài khoản `preview_admin`, `preview_staff`, `preview_user` sử dụng mật khẩu Preview chung cấu hình qua Railway Variables (không lưu mật khẩu trong GitHub). Việc đổi secret sẽ đồng bộ mật khẩu vào các tài khoản Preview sau khi ứng dụng khởi động.
- Dịch vụ này là bản Preview dùng thử, **không dùng tài liệu/thông tin thật, không xem là production**.

## Bước thiết lập bởi chủ tài khoản hosting

1. Tạo Railway project **mới** tên `edms-team-preview`. Tạo PostgreSQL service mới ở cùng project, không liên kết production.
2. Tạo service từ repository GitHub `hieuvo123ab-rgb/DoAn_CNPMNC`, branch `deploy/team-preview-railway-20261020`. Railpack không được dùng; build bằng root `Dockerfile.team-preview` (cấu hình `railway.json`).
3. Gắn một volume mới của service ứng dụng tại mount path `/app/persist`; chỉ service Preview mới được dùng volume này. Không dùng volume trùng production.
4. Thiết lập các Railway Variables, *không commit giá trị secret*:

   | Variable | Giá trị |
   |---|---|
   | `EDMS_TEAM_PREVIEW_ENABLED` | `true` |
   | `SPRING_PROFILES_ACTIVE` | `prod,team-preview` |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
   | `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
   | `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
   | `EDMS_JWT_SECRET` | secret mới, ngẫu nhiên >=40 ký tự |
   | `EDMS_KEYSTORE_PASSWORD` | secret mới, ngẫu nhiên >=16 ký tự |
   | `EDMS_PREVIEW_SHARED_PASSWORD` | mật khẩu dùng thử chung cho ba vai trò, ngẫu nhiên >=16 ký tự; chỉ thiết lập trong Railway |
   | `EDMS_STORAGE_DIR` | `/app/persist/uploads` |
   | `EDMS_KEYSTORE_PATH` | `/app/persist/keys/edms-signing.p12` |
   | `EDMS_WEBSOCKET_ALLOWED_ORIGINS` | `https://edms-preview-web-team-preview.up.railway.app` |
   | `EDMS_FAILURE_SIMULATION_ENABLED` | `false` |

   Tên service PostgreSQL có thể khác `Postgres` — sử dụng Railway variable references tương ứng. Không lấy `DATABASE_URL` không đúng JDBC format.
5. Deploy. Chỉ sau khi health `/healthz` đạt 200 mới tạo public domain của Railway và đặt đúng origin vào `EDMS_WEBSOCKET_ALLOWED_ORIGINS`, redeploy.
6. Thử `/login`, `/verify`, login 2 vai trò, phân quyền staff/admin, upload tài liệu thử (không dùng file thật), search, review và real-time notifications qua `/ws-edms`. Trên HTTPS phải có WSS và SockJS cùng domain.
7. Chia sẻ URL và tài khoản thử nghiệm riêng qua kênh nội bộ. Không gửi mật khẩu trên GitHub, screenshot, issue hay nhóm công khai. Mật khẩu chung chỉ dành cho môi trường demo, không chứa dữ liệu thật; đổi secret ngay sau buổi review và không dùng lại cho production.
8. Nếu muốn hạn chế người ngoài: đặt lớp bảo vệ truy cập ở phía hosting/proxy (SSO/Access) trước endpoint UI/API/WS và verify cả luồng WebSocket. URL công khai **không** tự động là URL riêng tư.

## Không được làm

- Không dùng lại `edms_pgdata`, `edms_storage_data`, `edms_keystore_data`, chứng chỉ `edms-signing.p12` hiện tại, mật khẩu JWT hoặc mật khẩu người dùng thật.
- Không import backup production, không mở PostgreSQL ra Internet, không chạy `docker compose down -v` trên máy đang có dữ liệu.
- Không kết nối đến `localhost:5432` máy chủ đồ án hoặc DB production, không cấp mật khẩu `password123`.

## Kiểm tra trước khi phát link

- [ ] PostgreSQL service Preview mới và private URL đúng
- [ ] Volume Preview được mount riêng, có thể ghi uploads/KeyStore
- [ ] All secrets mới, chỉ nằm trong Railway Variables
- [ ] Spring profile chính xác `prod,team-preview`
- [ ] Backend health 200, Frontend load, API và WS proxy hoạt động
- [ ] Staff không thể truy cập chức năng Admin
- [ ] Tài khoản thử dùng mật khẩu mới và không có dữ liệu thật
- [ ] Không có đường public tới PostgreSQL
- [ ] Truy cập HTTPS, WebSocket reconnect, logout hoạt động
- [ ] Kiểm thử sau restart vẫn giữ được dữ liệu thử, file thử và chứng chỉ Preview

## Hoàn tác an toàn

Xóa service Preview và DB Preview trong Railway **chỉ sau khi xác minh project và tên dịch vụ riêng**, không thao tác trên môi trường production.
