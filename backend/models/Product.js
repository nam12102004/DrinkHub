const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'product_id (PK) là bắt buộc']
  },
  category_id: {
    type: Number,
    ref: 'Category',
    required: [true, 'Mã danh mục (category_id) là bắt buộc']
  },
  shop_id: {
    type: Number,
    ref: 'Shop',
    required: [true, 'Mã cửa hàng (shop_id) là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên món đồ uống không được để trống'],
    maxlength: [30, 'Tên món không được dài quá 30 ký tự'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [100, 'Mô tả chi tiết không được dài quá 100 ký tự'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Giá tiền không được để trống'],
    min: [0, 'Giá tiền không thể âm']
  },
  available: {
    type: Boolean,
    required: [true, 'Trạng thái còn hàng là bắt buộc'],
    default: true
  },
  image: {
    type: String,
    required: [true, 'Đường dẫn ảnh sản phẩm là bắt buộc'],
    maxlength: [255, 'Đường dẫn ảnh không được dài quá 255 ký tự'],
    trim: true
  }
}, {
  timestamps: true
});

ProductSchema.virtual('product_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Product', ProductSchema);
