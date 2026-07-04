const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'discount_id (PK) là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên mã giảm giá không được để trống'],
    maxlength: [30, 'Tên mã không được dài quá 30 ký tự'],
    trim: true
  },
  value: {
    type: Number,
    required: [true, 'Giá trị giảm không được để trống'],
    min: [0, 'Giá trị giảm không thể âm']
  },
  shop_id: {
    type: Number,
    ref: 'Shop',
    required: [true, 'Mã cửa hàng (shop_id) là bắt buộc']
  },
  expiration: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

DiscountSchema.virtual('discount_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Discount', DiscountSchema);
