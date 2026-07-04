const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'ingredient_id (PK) là bắt buộc']
  },
  shop_id: {
    type: Number,
    ref: 'Shop',
    required: [true, 'Mã cửa hàng (shop_id) là bắt buộc']
  },
  quantity: {
    type: Number,
    required: [true, 'Số lượng nguyên liệu tồn kho là bắt buộc'],
    min: [0, 'Số lượng tồn kho không thể âm']
  },
  description: {
    type: String,
    maxlength: [100, 'Mô tả nguyên liệu không được dài quá 100 ký tự'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Tên nguyên liệu không được để trống'],
    maxlength: [30, 'Tên nguyên liệu không được dài quá 30 ký tự'],
    trim: true
  }
}, {
  timestamps: true
});

IngredientSchema.virtual('ingredient_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
