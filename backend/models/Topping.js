const mongoose = require('mongoose');

const ToppingSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'topping_id (PK) là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên loại topping không được để trống'],
    maxlength: [30, 'Tên topping không được dài quá 30 ký tự'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Giá tiền của topping không được để trống'],
    min: [0, 'Giá topping không thể âm']
  }
}, {
  timestamps: true
});

ToppingSchema.virtual('topping_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Topping', ToppingSchema);
