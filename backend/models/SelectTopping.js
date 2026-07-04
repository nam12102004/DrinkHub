const mongoose = require('mongoose');

const SelectToppingSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'select_id (PK) là bắt buộc']
  },
  topping_id: {
    type: Number,
    ref: 'Topping',
    required: [true, 'Mã topping (topping_id) là bắt buộc']
  },
  orderitem_id: {
    type: Number,
    ref: 'OrderItem',
    required: [true, 'Mã chi tiết đơn hàng (orderitem_id) là bắt buộc']
  }
}, {
  timestamps: true
});

SelectToppingSchema.virtual('select_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('SelectTopping', SelectToppingSchema);
