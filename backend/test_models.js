/**
 * Script kiểm tra và xác thực các Model Mongoose
 * Chạy lệnh: node backend/test_models.js
 */

const mongoose = require('mongoose');

console.log('--- KHỞI ĐẦU KIỂM TRA MODELS ---');

try {
  const User = require('./models/User');
  console.log('✔ Load model User thành công.');
  
  const Shop = require('./models/Shop');
  console.log('✔ Load model Shop thành công.');
  
  const Category = require('./models/Category');
  console.log('✔ Load model Category thành công.');
  
  const Product = require('./models/Product');
  console.log('✔ Load model Product thành công.');
  
  const Topping = require('./models/Topping');
  console.log('✔ Load model Topping thành công.');
  
  const Discount = require('./models/Discount');
  console.log('✔ Load model Discount thành công.');
  
  const Order = require('./models/Order');
  console.log('✔ Load model Order thành công.');
  
  const OrderItem = require('./models/OrderItem');
  console.log('✔ Load model OrderItem thành công.');
  
  const SelectTopping = require('./models/SelectTopping');
  console.log('✔ Load model SelectTopping thành công.');
  
  const Comment = require('./models/Comment');
  console.log('✔ Load model Comment thành công.');
  
  const Ingredient = require('./models/Ingredient');
  console.log('✔ Load model Ingredient thành công.');
  
  const Statistical = require('./models/Statistical');
  console.log('✔ Load model Statistical thành công.');

  console.log('\n✔ TẤT CẢ 12 MODELS ĐƯỢC LOAD VÀ BIÊN DỊCH THÀNH CÔNG VỚI MONGOOSE!');
} catch (error) {
  console.error('\n❌ Có lỗi xảy ra khi khởi tạo models:', error.message);
  process.exit(1);
}

process.exit(0);
