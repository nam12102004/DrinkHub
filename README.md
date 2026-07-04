# Hệ Thống Quản Lý Cửa Hàng Đồ Uống (Drink Shop System)

Dự án mẫu full-stack cơ bản bao gồm Backend (Node.js/Express) và Giao diện Frontend (HTML/CSS/JS thuần + Vite), kết nối tới cơ sở dữ liệu MongoDB. Dự án đã hoàn thiện cấu trúc thư mục, thiết lập các Model Mongoose và triển khai toàn bộ các Endpoint API nghiệp vụ.

---

## 🛠️ Trạng thái hoàn thành (Completed Tasks)
- [x] Khởi tạo cấu trúc dự án chuẩn & scripts chạy đồng thời bằng `concurrently`.
- [x] Thiết kế giao diện **Glassmorphic Dark Mode** cao cấp cho Frontend.
- [x] Xây dựng và biên dịch thành công **12 Mongoose Models** tương ứng với Sơ đồ thực thể ERD.
- [x] Triển khai **Middleware phân quyền** (`checkAuth`) dựa trên HTTP Headers/Query Parameters.
- [x] Triển khai **đầy đủ API Routes** cho cả 4 nhóm nghiệp vụ (Khách hàng, Chủ quán, Shipper).
- [x] Xóa bỏ thư mục `database/` chứa docker setup thừa.
- [x] Tạo kịch bản kiểm thử tự động **Unit Test Models** & **Integration Test Features** hỗ trợ luồng giao hàng của Shipper.

---

## 📁 Cấu trúc Thư mục Dự án (Project Directory Structure)
Thư mục dự án được cấu trúc rõ ràng để các nhà phát triển và các AI Agent khác có thể dễ dàng đọc hiểu và tiếp tục hoàn thiện:

```
/ (Root)
├── backend/                  # Mã nguồn Backend (Node.js & Express)
│   ├── middleware/           # Middlewares hệ thống
│   │   └── auth.js           # Middleware phân quyền (Role-based Authorization)
│   ├── models/               # Danh sách 12 Mongoose Models (CSDL)
│   │   ├── User.js           # Quản lý người dùng & phân quyền
│   │   ├── Shop.js           # Quản lý cửa hàng
│   │   ├── Category.js       # Danh mục đồ uống
│   │   ├── Product.js        # Đồ uống / Sản phẩm menu
│   │   ├── Topping.js        # Các topping đi kèm
│   │   ├── Discount.js       # Mã giảm giá
│   │   ├── Order.js          # Đơn đặt hàng
│   │   ├── OrderItem.js      # Chi tiết sản phẩm trong đơn
│   │   ├── SelectTopping.js  # Lựa chọn topping đi kèm trong đơn
│   │   ├── Comment.js        # Bình luận & Đánh giá (1-5 sao)
│   │   ├── Ingredient.js     # Quản lý tồn kho nguyên liệu của Shop
│   │   └── Statistical.js    # Báo cáo doanh số cửa hàng
│   ├── routes/               # Các Express Routers (API Endpoints)
│   │   ├── users.js          # Router xử lý tài khoản, đăng ký, đăng nhập
│   │   ├── shops.js          # Router quản lý Shop (CRUD)
│   │   ├── menu.js           # Router quản lý danh mục, món ăn, topping
│   │   ├── orders.js         # Router xử lý quy trình đặt hàng, cập nhật đơn
│   │   └── interactions.js   # Router xử lý đánh giá, quản lý kho & thống kê
│   ├── seed.js               # Tạo dữ liệu mẫu (9 TK, 1 shop, menu) khi MongoDB kết nối
│   ├── server.js             # Điểm khởi chạy chính của Backend Server
│   ├── test_models.js        # Script kiểm tra biên dịch Models
│   └── test_features.js      # Script kiểm thử tích hợp (E2E) các luồng API
│
├── frontend/                 # Giao diện người dùng SPA (HTML/CSS/JS + Vite)
│   ├── index.html            # SPA khung chính: header + nav + view container + modal
│   ├── style.css             # Design system: Dark mode, glassmorphism, role-aware palette
│   └── app.js                # Logic toàn bộ client: role-based views, cart, API calls
│
├── package.json              # Cấu hình dự án gốc, cài đặt và chạy đồng thời
└── README.md                 # Hướng dẫn chi tiết bàn giao (Tệp hiện tại)
```

---

## 🔑 Cơ chế Phân quyền & Bảo mật (Role-based Authorization)

Dự án **không yêu cầu bảo mật cao (không dùng JWT)**, do đó thông tin phân quyền được xác thực nhanh chóng thông qua các HTTP Headers (hoặc Query Parameters làm phương án dự phòng):

- **User ID Header**: `x-user-id` (hoặc query `?userId=...`) - Nhận một số nguyên tương ứng với Mã định danh người dùng.
- **User Role Header**: `x-user-role` (hoặc query `?role=...`) - Quyết định quyền truy cập của người dùng.

### Các vai trò phân quyền (Role Mapping):
* `1`: **Customer (Khách hàng)** - Có quyền đặt đơn hàng, xem đơn của chính mình, bình luận sản phẩm.
* `2`: **Shop Owner (Chủ cửa hàng)** - Có quyền quản lý Shop mình, quản lý Menu của Shop mình, duyệt đơn chuyển trạng thái "Chờ shipper", quản lý nguyên liệu kho, chốt doanh số thống kê.
* `3`: **Shipper (Người giao hàng)** - Được quét tìm tất cả các đơn hàng, nhận đơn và cập nhật trạng thái đơn hàng sang "Đang giao" và "Thành công".

---

## 📡 Danh sách các API Endpoints đã Triển khai

Dưới đây là đặc tả các route API đã được cài đặt hoàn chỉnh:

### 1. Nhóm Quản lý Người dùng (`/api/users`)
- `POST /register`: Đăng ký tài khoản mới. Tự động tính số ID tăng dần tiếp theo cho người dùng.
- `POST /login`: Đăng nhập kiểm tra email & mật khẩu thô (Plaintext).
- `GET /profile`: Lấy thông tin tài khoản hiện hành. (Yêu cầu gửi kèm header `x-user-id` và `x-user-role`).

### 2. Nhóm Quản lý Cửa hàng (`/api/shops`)
- `GET /`: Xem danh sách tất cả cửa hàng (Công khai).
- `GET /:id`: Xem chi tiết một cửa hàng.
- `POST /`: Tạo cửa hàng mới (Chỉ dành cho **Shop Owner**).
- `PUT /:id`: Cập nhật thông tin cửa hàng (Chỉ dành cho **chủ sở hữu** của shop đó).
- `DELETE /:id`: Xóa cửa hàng (Chỉ dành cho **chủ sở hữu**).

### 3. Nhóm Quản lý Menu & Đồ uống (`/api/menu`)
- `GET /categories`: Lấy danh sách danh mục (Lọc theo `?shop_id=...`).
- `POST /categories`: Thêm danh mục mới (Chỉ chủ shop đó).
- `DELETE /categories/:id`: Xóa danh mục sản phẩm.
- `GET /products`: Lấy danh sách đồ uống (Lọc theo `?shop_id=...` hoặc `?category_id=...`).
- `POST /products`: Tạo món uống mới (Chỉ chủ shop).
- `PUT /products/:id`: Cập nhật món uống (Chỉ chủ shop).
- `DELETE /products/:id`: Xóa món uống.
- `GET /toppings`: Xem danh sách topping đi kèm.
- `POST /toppings`: Thêm topping mới.

### 4. Nhóm Quản lý Đơn hàng (`/api/orders`)
- `POST /`: Đặt hàng mới (Chỉ Customer).
  - *Logic nâng cao*: Hệ thống sẽ tự động đối chiếu cơ sở dữ liệu để lấy giá của từng sản phẩm và topping, tự động tính tổng giá trị đơn hàng, áp dụng mã giảm giá (`discount_id`) hợp lệ, sau đó tạo đồng thời các bản ghi `Order`, `OrderItem` và `SelectTopping` liên kết chặt chẽ với nhau.
- `GET /`: Xem danh sách đơn hàng.
  - Khách hàng (Role 1): Chỉ thấy đơn hàng của chính mình.
  - Chủ quán (Role 2): Lấy toàn bộ đơn hàng của quán (yêu cầu truyền `?shop_id=...` để kiểm tra quyền).
  - Shipper (Role 3): Thấy toàn bộ đơn hàng trên hệ thống để tìm kiếm đơn cần giao (có thể lọc thêm theo `?status=...`).
- `PUT /:id/status`: Cập nhật trạng thái đơn.
  - Chủ quán (Role 2): Có quyền chuyển trạng thái bất kỳ cho đơn của quán mình (Ví dụ: Chuyển sang "Chờ shipper").
  - Shipper (Role 3): Chỉ được phép chuyển đổi trạng thái đơn sang **"Đang giao"** hoặc **"Thành công"** khi thực hiện quá trình vận chuyển. Các trạng thái khác sẽ bị hệ thống chặn (Báo lỗi 403).

### 5. Tương tác & Báo cáo (`/api/interactions`)
- `POST /comments`: Bình luận & Đánh giá sản phẩm đã mua (1-5 sao).
- `GET /comments/:product_id`: Xem các đánh giá của sản phẩm.
- `GET /ingredients`: Xem tồn kho nguyên liệu (Yêu cầu `?shop_id=...` và quyền chủ sở hữu).
- `POST /ingredients`: Thêm mới nguyên liệu vào kho (Chỉ chủ shop).
- `PUT /ingredients/:id`: Cập nhật số lượng/thông tin tồn kho (Chỉ chủ shop).
- `GET /statistical/:shop_id`: Xem doanh thu/báo cáo thống kê (Chỉ chủ shop).
- `POST /statistical`: Nạp thống kê doanh thu cuối ngày (Chỉ chủ shop).

---

## 🤖 Hướng dẫn Bàn giao dành cho AI Agent tiếp theo (Handover Notes)

Nếu bạn là một AI Agent đang tiếp tục phát triển dự án này, hãy lưu ý các điểm sau để phát triển tiếp:

1. **Khởi chạy Hệ thống**:
   - Chạy `npm install` tại thư mục gốc để tải toàn bộ thư viện.
   - Chạy `npm run dev` để khởi động song song cả Express API (cổng 5000) và Vite Static Server (cổng 3000).

2. **Cách kết nối Database**:
   - Chuỗi kết nối MongoDB được cấu hình trực tiếp trong tệp [backend/server.js](file:///f:/New%20folder%20(2)/backend/server.js) (mặc định trỏ tới `mongodb://localhost:27017/taskdb`). Bạn có thể thay đổi thông tin kết nối này trực tiếp trong mã nguồn.
   - Mongoose được cấu hình chạy ở chế độ đệm (buffering), tức là API Server sẽ vẫn chạy bình thường kể cả khi chưa có kết nối MongoDB hoạt động, và sẽ tự động xử lý các truy vấn ngay khi kết nối database được thiết lập.

3. **Chạy thử nghiệm kiểm tra chất lượng**:
   - Sử dụng lệnh `node backend/test_models.js` để đảm bảo 12 models biên dịch tốt.
   - Sử dụng lệnh `node backend/test_features.js` để chạy mô phỏng kịch bản đặt hàng, phân quyền và quy trình nhận/giao đơn của Shipper.

4. **Giao diện Frontend đã hoàn thiện (tại `http://localhost:3000`)**:
   - Sử dụng **dropdown chọn tài khoản** ở góc trên bên phải (11 tài khoản test, không cần đăng nhập).
   - Khi chọn tài khoản, giao diện tự chuyển màu chủ đề (xanh dương = KH, vàng = Chủ shop, xanh lá = Shipper) và hiển thị menu điều hướng tương ứng với vai trò.
   - **Khách hàng**: Chọn quán → Xem menu → Thêm vào giỏ hàng → Đặt hàng → Xem lịch sử đơn → Viết đánh giá.
   - **Chủ Shop (3 tài khoản khác nhau)**: Mỗi chủ shop liên kết với một quán riêng (Shop 1, Shop 2 hoặc Shop 3). Khi chuyển đổi, chủ shop chỉ quản lý menu, đơn hàng và kho nguyên liệu của chính quán đó. Dashboard thống kê → Bảng quản lý đơn hàng → CRUD sản phẩm/menu → Quản lý kho nguyên liệu.
   - **Shipper**: Xem danh sách đơn "Chờ shipper" → Nhận đơn (→ Đang giao) → Giao xong (→ Thành công).

5. **Định hướng phát triển tiếp theo**:
   - Thêm trang đánh giá sản phẩm chi tiết (xem danh sách bình luận theo `product_id`).
   - Thêm Dashboard thống kê doanh thu nâng cao (`POST /api/interactions/statistical`).
   - Tích hợp tìm kiếm và lọc đơn hàng nâng cao trong view Chủ Shop.
   - Hỗ trợ upload ảnh sản phẩm trực tiếp thay vì dán link URL.
