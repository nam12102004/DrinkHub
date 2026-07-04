const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'category_id (PK) là bắt buộc']
  },
  shop_id: {
    type: Number,
    ref: 'Shop',
    required: [true, 'Mã cửa hàng (shop_id) là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên danh mục không được để trống'],
    maxlength: [30, 'Tên danh mục không được dài quá 30 ký tự'],
    trim: true
  }
}, {
  timestamps: true
});

CategorySchema.virtual('category_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Category', CategorySchema);
