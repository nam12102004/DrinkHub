const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'orderitem_id (PK) là bắt buộc']
  },
  product_id: {
    type: Number,
    ref: 'Product',
    required: [true, 'Mã sản phẩm (product_id) là bắt buộc']
  },
  order_id: {
    type: Number,
    ref: 'Order',
    required: [true, 'Mã đơn hàng (order_id) là bắt buộc']
  },
  quantity: {
    type: Number,
    required: [true, 'Số lượng mặt hàng không được để trống'],
    min: [1, 'Số lượng mặt hàng tối thiểu phải từ 1']
  },
  price: {
    type: Number,
    required: [true, 'Giá sản phẩm tại thời điểm mua là bắt buộc'],
    min: [0, 'Giá sản phẩm không thể âm']
  }
}, {
  timestamps: true
});

OrderItemSchema.virtual('orderitem_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);
