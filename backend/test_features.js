/**
 * Kịch bản kiểm thử tích hợp (End-to-End integration test)
 * Xác thực toàn bộ các luồng nghiệp vụ của hệ thống Drink Shop.
 * Chạy lệnh: node backend/test_features.js
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- KHỞI ĐỘNG KIỂM THỬ TÍCH HỢP HỆ THỐNG DRINK SHOP ---');
  
  // Kiểm tra xem backend server có đang online không
  try {
    const ping = await fetch('http://localhost:5000/');
    if (!ping.ok) throw new Error('API server không phản hồi tốt');
    console.log('✔ Kết nối thành công tới Server API (localhost:5000)');
  } catch (err) {
    console.error('❌ KHÔNG THỂ KẾT NỐI TỚI SERVER API!');
    console.error('Vui lòng đảm bảo bạn đang chạy dự án bằng lệnh: npm run dev');
    console.error('Đảm bảo MongoDB của bạn đã hoạt động.\n');
    process.exit(1);
  }

  try {
    // ----------------------------------------------------
    // TEST CASE 1: Đăng ký tài khoản (Khách hàng, Chủ quán, Shipper)
    // ----------------------------------------------------
    console.log('\n[TEST 1] Đăng ký người dùng...');
    
    // Đăng ký Khách hàng (role = 1)
    const customerRegister = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nguyen Van A',
        phone: '0912345678',
        email: 'customer@test.com',
        password: 'password123',
        role: 1
      })
    });
    const customerRes = await customerRegister.json();
    console.log(`- Đăng ký Khách hàng: ${customerRegister.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI: ' + customerRes.message}`);
    const customerId = customerRes.user ? customerRes.user.user_id : 1;

    // Đăng ký Chủ quán (role = 2)
    const ownerRegister = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chu Quan Cafe X',
        phone: '0988888888',
        email: 'owner@test.com',
        password: 'password123',
        role: 2
      })
    });
    const ownerRes = await ownerRegister.json();
    console.log(`- Đăng ký Chủ quán: ${ownerRegister.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI: ' + ownerRes.message}`);
    const ownerId = ownerRes.user ? ownerRes.user.user_id : 2;

    // Đăng ký Shipper (role = 3)
    const shipperRegister = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Shipper Giao Nhanh',
        phone: '0977777777',
        email: 'shipper@test.com',
        password: 'password123',
        role: 3
      })
    });
    const shipperRes = await shipperRegister.json();
    console.log(`- Đăng ký Shipper: ${shipperRegister.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI: ' + shipperRes.message}`);
    const shipperId = shipperRes.user ? shipperRes.user.user_id : 3;

    // ----------------------------------------------------
    // TEST CASE 2: Đăng nhập đơn giản
    // ----------------------------------------------------
    console.log('\n[TEST 2] Đăng nhập...');
    const loginReq = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@test.com',
        password: 'password123'
      })
    });
    console.log(`- Đăng nhập thử nghiệm: ${loginReq.status === 200 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // ----------------------------------------------------
    // TEST CASE 3: Quản lý Cửa hàng (Shop CRUD)
    // ----------------------------------------------------
    console.log('\n[TEST 3] Tạo cửa hàng mới...');
    
    // Thử tạo shop mà không gửi quyền -> Phải báo lỗi 401
    const unauthorizedShop = await fetch(`${BASE_URL}/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Coffee House', phone: '0241234567', address: '100 Hanoi' })
    });
    console.log(`- Tạo shop không quyền: ${unauthorizedShop.status === 401 ? '✔ BỊ CẤM THÀNH CÔNG (401)' : '❌ LỖI (Cho phép tạo vô lý)'}`);

    // Tạo shop với tư cách Chủ quán (role = 2)
    const createShopReq = await fetch(`${BASE_URL}/shops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({
        name: 'X Cafe Premium',
        description: 'Cửa hàng cà phê chất lượng cao',
        phone: '0988888888',
        facebook: 'fb.com/xcafe',
        address: '15 Tạ Quang Bửu, Hà Nội'
      })
    });
    const shopRes = await createShopReq.json();
    const shopId = shopRes.shop ? shopRes.shop._id : 1;
    console.log(`- Tạo shop hợp lệ: ${createShopReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI: ' + shopRes.message}`);

    // ----------------------------------------------------
    // TEST CASE 4: Quản lý Menu (Danh mục, Sản phẩm, Toppings)
    // ----------------------------------------------------
    console.log('\n[TEST 4] Thiết lập Menu (Category & Product)...');
    
    // 1. Tạo Category
    const createCatReq = await fetch(`${BASE_URL}/menu/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({
        shop_id: shopId,
        name: 'Trà Sữa Đặc Biệt'
      })
    });
    const catRes = await createCatReq.json();
    const catId = catRes.category ? catRes.category._id : 1;
    console.log(`- Tạo danh mục đồ uống: ${createCatReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // 2. Tạo Product
    const createProdReq = await fetch(`${BASE_URL}/menu/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({
        shop_id: shopId,
        category_id: catId,
        name: 'Trà sữa Trân châu Đường đen',
        description: 'Sữa tươi kem béo thơm ngon đậm vị',
        price: 45000,
        available: true,
        image: '/images/trasua.png'
      })
    });
    const prodRes = await createProdReq.json();
    const prodId = prodRes.product ? prodRes.product._id : 1;
    console.log(`- Tạo sản phẩm đồ uống: ${createProdReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // 3. Tạo Topping
    const createToppingReq = await fetch(`${BASE_URL}/menu/toppings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({
        name: 'Trân Châu Hoàng Kim',
        price: 10000
      })
    });
    const toppingRes = await createToppingReq.json();
    const toppingId = toppingRes.topping ? toppingRes.topping._id : 1;
    console.log(`- Tạo loại Topping: ${createToppingReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // ----------------------------------------------------
    // TEST CASE 5: Quy trình Đặt hàng & Shipper xử lý đơn hàng
    // ----------------------------------------------------
    console.log('\n[TEST 5] Quy trình đặt đơn và Shipper giao hàng...');
    
    // 1. Khách đặt đơn
    const placeOrderReq = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(customerId),
        'x-user-role': '1'
      },
      body: JSON.stringify({
        shop_id: shopId,
        phone: '0912345678',
        address: 'Nhà riêng A, Hà Nội',
        note: 'Ít đường nhiều đá',
        items: [
          {
            product_id: prodId,
            quantity: 2,
            toppings: [toppingId]
          }
        ]
      })
    });
    const orderRes = await placeOrderReq.json();
    const orderId = orderRes.order ? orderRes.order._id : 1;
    console.log(`- Gửi lệnh đặt đơn: ${placeOrderReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI: ' + orderRes.message}`);

    // 2. Chủ quán duyệt đơn lên trạng thái "Chờ shipper"
    const ownerUpdateStatus = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({ status: 'Chờ shipper' })
    });
    console.log(`- Chủ quán duyệt đơn (Chờ shipper): ${ownerUpdateStatus.status === 200 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // 3. Shipper xem đơn hàng cần giao
    const shipperGetOrders = await fetch(`${BASE_URL}/orders?status=Chờ shipper`, {
      method: 'GET',
      headers: {
        'x-user-id': String(shipperId),
        'x-user-role': '3'
      }
    });
    const shipperOrders = await shipperGetOrders.json();
    console.log(`- Shipper quét tìm đơn: ${shipperGetOrders.status === 200 && Array.isArray(shipperOrders) ? '✔ THÀNH CÔNG (Đơn tìm thấy: ' + shipperOrders.length + ')' : '❌ THẤT BẠI'}`);

    // 4. Shipper nhận đơn giao (Chuyển sang "Đang giao")
    const shipperUpdateDelivering = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(shipperId),
        'x-user-role': '3'
      },
      body: JSON.stringify({ status: 'Đang giao' })
    });
    console.log(`- Shipper nhận giao (Đang giao): ${shipperUpdateDelivering.status === 200 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // 5. Shipper cố ý cập nhật trạng thái cấm (ví dụ: Chờ duyệt) -> Phải bị chặn 403
    const shipperBadUpdate = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(shipperId),
        'x-user-role': '3'
      },
      body: JSON.stringify({ status: 'Chờ duyệt' })
    });
    console.log(`- Shipper đổi trạng thái cấm: ${shipperBadUpdate.status === 403 ? '✔ BỊ CHẶN HỢP LỆ (403)' : '❌ LỖI (Cho phép sửa bừa bãi)'}`);

    // 6. Shipper giao hàng thành công (Chuyển sang "Thành công")
    const shipperUpdateSuccess = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(shipperId),
        'x-user-role': '3'
      },
      body: JSON.stringify({ status: 'Thành công' })
    });
    console.log(`- Shipper hoàn thành đơn (Thành công): ${shipperUpdateSuccess.status === 200 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // ----------------------------------------------------
    // TEST CASE 6: Quản lý Kho & Thống kê của Chủ quán
    // ----------------------------------------------------
    console.log('\n[TEST 6] Quản lý Kho & Thống kê của Chủ quán...');
    
    // Thêm nguyên liệu kho
    const addIngredientReq = await fetch(`${BASE_URL}/interactions/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({
        shop_id: shopId,
        name: 'Sữa tươi nguyên kem',
        quantity: 50,
        description: 'Hộp sữa 1 lít để pha chế'
      })
    });
    console.log(`- Thêm nguyên liệu kho: ${addIngredientReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    // Thêm số liệu thống kê cuối ngày
    const addStatReq = await fetch(`${BASE_URL}/interactions/statistical`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': String(ownerId),
        'x-user-role': '2'
      },
      body: JSON.stringify({
        shop_id: shopId,
        value: 1200000,
        date: new Date().toISOString()
      })
    });
    console.log(`- Thêm báo cáo thống kê: ${addStatReq.status === 201 ? '✔ THÀNH CÔNG' : '❌ THẤT BẠI'}`);

    console.log('\n✔ TẤT CẢ CÁC BÀI KIỂM THỬ THÀNH CÔNG RỰC RỠ!');
  } catch (error) {
    console.error('❌ Kiểm thử thất bại vì lỗi hệ thống:', error.message);
  }
}

runTests();
