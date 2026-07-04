/**
 * seed.js - Script tạo dữ liệu mẫu cho môi trường phát triển
 * Tạo: 9 tài khoản test (5 KH, 1 Shop Owner, 3 Shipper) + 1 Shop + Menu mẫu
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Topping = require('./models/Topping');
const Discount = require('./models/Discount');

async function seedDatabase() {
  try {
    // Kiểm tra xem dữ liệu đã tồn tại chưa (tránh seed lặp)
    const existingUsers = await User.countDocuments();
    if (existingUsers >= 11) {
      console.log('[Seed] Dữ liệu mẫu đã tồn tại. Bỏ qua seed.');
      return;
    }

    console.log('[Seed] Đang tạo dữ liệu mẫu...');

    // ===== 1. TẠO NGƯỜI DÙNG =====
    const usersData = [
      // 5 Khách hàng (role 1)
      { _id: 1, name: 'Nguyễn Văn An',  phone: '0901234501', email: 'an@mail.com',     password: '123456', role: 1 },
      { _id: 2, name: 'Trần Thị Bích',  phone: '0901234502', email: 'bich@mail.com',   password: '123456', role: 1 },
      { _id: 3, name: 'Lê Văn Cường',   phone: '0901234503', email: 'cuong@mail.com',  password: '123456', role: 1 },
      { _id: 4, name: 'Phạm Thị Dung',  phone: '0901234504', email: 'dung@mail.com',   password: '123456', role: 1 },
      { _id: 5, name: 'Hoàng Văn Em',   phone: '0901234505', email: 'em@mail.com',     password: '123456', role: 1 },
      // 3 Chủ Shop (role 2)
      { _id: 6, name: 'Chủ Quán Phúc',  phone: '0906666601', email: 'shop@mail.com',   password: '123456', role: 2 },
      { _id: 10, name: 'Chủ Quán Lâm',  phone: '0906666602', email: 'lam@mail.com',    password: '123456', role: 2 },
      { _id: 11, name: 'Chủ Quán Vy',   phone: '0906666603', email: 'vy@mail.com',     password: '123456', role: 2 },
      // 3 Shipper (role 3)
      { _id: 7, name: 'Shipper Minh',   phone: '0907777701', email: 'minh@mail.com',   password: '123456', role: 3 },
      { _id: 8, name: 'Shipper Hùng',   phone: '0907777702', email: 'hung@mail.com',   password: '123456', role: 3 },
      { _id: 9, name: 'Shipper Tuấn',   phone: '0907777703', email: 'tuan@mail.com',   password: '123456', role: 3 },
    ];

    for (const u of usersData) {
      await User.findByIdAndUpdate(u._id, u, { upsert: true, setDefaultsOnInsert: true });
    }
    console.log('[Seed] ✅ Tạo 11 người dùng thành công.');

    // ===== 2. TẠO 3 SHOPS =====
    const shopsData = [
      {
        _id: 1,
        user_id: 6,
        name: 'Trà Chanh Garden',
        description: 'Quán trà chanh vỉa hè phong cách - Đủ vị, đủ topping',
        phone: '0906666601',
        address: '123 Đường Láng, Đống Đa, Hà Nội',
        facebook: 'https://facebook.com/trachanhgarden'
      },
      {
        _id: 2,
        user_id: 10,
        name: 'Highlands Coffee',
        description: 'Thương hiệu cà phê Việt Nam hiện đại và đậm đà',
        phone: '0906666602',
        address: '456 Cầu Giấy, Cầu Giấy, Hà Nội',
        facebook: 'https://facebook.com/highlandscoffee'
      },
      {
        _id: 3,
        user_id: 11,
        name: 'Ding Tea Milk Tea',
        description: 'Trà sữa Đài Loan chính hiệu thơm ngon',
        phone: '0906666603',
        address: '789 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội',
        facebook: 'https://facebook.com/dingteavn'
      }
    ];

    for (const s of shopsData) {
      await Shop.findByIdAndUpdate(s._id, s, { upsert: true, setDefaultsOnInsert: true });
    }
    console.log('[Seed] ✅ Tạo 3 Shops thành công.');

    // ===== 3. TẠO DANH MỤC =====
    const categoriesData = [
      // Shop 1
      { _id: 1, shop_id: 1, name: 'Trà Chanh' },
      { _id: 2, shop_id: 1, name: 'Cà Phê' },
      { _id: 3, shop_id: 1, name: 'Nước Ép' },
      { _id: 4, shop_id: 1, name: 'Trà Sữa' },
      // Shop 2
      { _id: 5, shop_id: 2, name: 'Cà Phê Highlands' },
      { _id: 6, shop_id: 2, name: 'Freeze Đá Xay' },
      // Shop 3
      { _id: 7, shop_id: 3, name: 'Trà Sữa Ding Tea' },
      { _id: 8, shop_id: 3, name: 'Trà Trái Cây' },
    ];
    for (const c of categoriesData) {
      await require('./models/Category').findByIdAndUpdate(c._id, c, { upsert: true, setDefaultsOnInsert: true });
    }
    console.log('[Seed] ✅ Tạo 8 danh mục thành công.');

    // ===== 4. TẠO SẢN PHẨM =====
    const productsData = [
      // Shop 1 - Trà Chanh
      { _id: 1, category_id: 1, shop_id: 1, name: 'Trà Chanh Leo',    description: 'Trà chanh truyền thống với hương leo thơm mát', price: 25000, available: true,  image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop' },
      { _id: 2, category_id: 1, shop_id: 1, name: 'Trà Chanh Sả Gừng',description: 'Trà chanh kết hợp sả gừng ấm nồng',             price: 30000, available: true,  image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop' },
      { _id: 3, category_id: 1, shop_id: 1, name: 'Trà Chanh Bạc Hà', description: 'Thanh mát với lá bạc hà tươi',                   price: 28000, available: true,  image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop' },
      // Shop 1 - Cà Phê
      { _id: 4, category_id: 2, shop_id: 1, name: 'Cà Phê Đen',       description: 'Cà phê đen đậm đà, pha phin truyền thống',       price: 20000, available: true,  image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop' },
      { _id: 5, category_id: 2, shop_id: 1, name: 'Cà Phê Sữa',       description: 'Cà phê sữa đặc ngọt thơm béo ngậy',             price: 25000, available: true,  image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop' },
      { _id: 6, category_id: 2, shop_id: 1, name: 'Bạc Xỉu',          description: 'Nhiều sữa ít cà phê, ngọt ngào dịu nhẹ',        price: 27000, available: false, image: 'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&h=300&fit=crop' },
      // Shop 1 - Nước Ép
      { _id: 7, category_id: 3, shop_id: 1, name: 'Nước Ép Cam',      description: 'Cam vắt tươi nguyên chất, ngọt mát',             price: 35000, available: true,  image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop' },
      { _id: 8, category_id: 3, shop_id: 1, name: 'Nước Ép Dưa Hấu',  description: 'Dưa hấu mọng nước, mát lạnh giải nhiệt',        price: 30000, available: true,  image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop' },
      // Shop 1 - Trà Sữa
      { _id: 9, category_id: 4, shop_id: 1, name: 'Trà Sữa Trân Châu', description: 'Trà sữa cổ điển với trân châu đen dẻo',         price: 40000, available: true,  image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
      { _id: 10,category_id: 4, shop_id: 1, name: 'Trà Sữa Matcha',    description: 'Trà sữa matcha Nhật Bản thanh tao',             price: 45000, available: true,  image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=300&fit=crop' },

      // Shop 2 - Cà Phê Highlands
      { _id: 11, category_id: 5, shop_id: 2, name: 'Phin Sữa Đá',     description: 'Cà phê phin sữa đá truyền thống Highlands',     price: 39000, available: true,  image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=300&fit=crop' },
      // Shop 2 - Freeze Đá Xay
      { _id: 12, category_id: 6, shop_id: 2, name: 'Freeze Trà Xanh', description: 'Trà xanh đá xay thơm ngậy cùng thạch dai giòn',  price: 55000, available: true,  image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=300&fit=crop' },

      // Shop 3 - Trà Sữa Ding Tea
      { _id: 13, category_id: 7, shop_id: 3, name: 'Trà Sữa Ding Tea',description: 'Trà sữa truyền thống đặc trưng thương hiệu',    price: 38000, available: true,  image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&h=300&fit=crop' },
      // Shop 3 - Trà Trái Cây
      { _id: 14, category_id: 8, shop_id: 3, name: 'Trà Xoài Macchiato',description: 'Trà xoài nhiệt đới kết hợp kem Macchiato béo', price: 42000, available: true,  image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=300&fit=crop' },
    ];
    for (const p of productsData) {
      await Product.findByIdAndUpdate(p._id, p, { upsert: true, setDefaultsOnInsert: true });
    }
    console.log('[Seed] ✅ Tạo 14 sản phẩm thành công.');

    // ===== 5. TẠO TOPPING =====
    const toppingsData = [
      { _id: 1, name: 'Trân Châu Đen',   price: 5000 },
      { _id: 2, name: 'Trân Châu Trắng', price: 5000 },
      { _id: 3, name: 'Thạch Cà Phê',   price: 6000 },
      { _id: 4, name: 'Pudding Trứng',   price: 8000 },
      { _id: 5, name: 'Kem Cheese',      price: 10000 },
      { _id: 6, name: 'Sữa Đặc',        price: 3000 },
    ];
    for (const t of toppingsData) {
      await Topping.findByIdAndUpdate(t._id, t, { upsert: true, setDefaultsOnInsert: true });
    }
    // ===== 6. TẠO VOUCHERS/DISCOUNTS =====
    const discountsData = [
      // Shop 1
      { _id: 1, name: 'KM10K', value: 10000, shop_id: 1, expiration: null },
      { _id: 2, name: 'GARDEN5K', value: 5000, shop_id: 1, expiration: null },
      // Shop 2
      { _id: 3, name: 'HIGHLANDS20K', value: 20000, shop_id: 2, expiration: null },
      { _id: 4, name: 'HL10K', value: 10000, shop_id: 2, expiration: null },
      // Shop 3
      { _id: 5, name: 'DINGTEA15K', value: 15000, shop_id: 3, expiration: null },
      { _id: 6, name: 'DT5K', value: 5000, shop_id: 3, expiration: null },
    ];
    for (const d of discountsData) {
      await Discount.findByIdAndUpdate(d._id, d, { upsert: true, setDefaultsOnInsert: true });
    }
    console.log('[Seed] ✅ Tạo 6 mã giảm giá thành công.');

    console.log('[Seed] 🎉 Seed database hoàn thành!');
  } catch (error) {
    console.error('[Seed] ❌ Lỗi khi seed database:', error.message);
  }
}

module.exports = seedDatabase;
