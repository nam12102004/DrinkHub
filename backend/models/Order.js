const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'order_id (PK) là bắt buộc']
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'Mã khách hàng (user_id) là bắt buộc']
  },
  shop_id: {
    type: Number,
    ref: 'Shop',
    required: [true, 'Mã cửa hàng (shop_id) là bắt buộc']
  },
  discount_id: {
    type: Number,
    ref: 'Discount',
    default: null // Cho phép null nếu không áp dụng mã giảm giá
  },
  status: {
    type: String,
    required: [true, 'Trạng thái đơn hàng không được để trống'],
    maxlength: [50, 'Trạng thái không được dài quá 50 ký tự'],
    default: 'Chờ duyệt',
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Tổng giá trị đơn hàng là bắt buộc'],
    min: [0, 'Giá trị đơn hàng không thể âm']
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại nhận hàng là bắt buộc'],
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} không phải số điện thoại nhận hàng 10 số hợp lệ!`
    }
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ giao hàng không được để trống'],
    maxlength: [100, 'Địa chỉ giao hàng không được dài quá 100 ký tự'],
    trim: true
  },
  note: {
    type: String,
    maxlength: [100, 'Ghi chú không được dài quá 100 ký tự'],
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Đơn hàng thường không cần cập nhật updatedAt định kỳ ngoại trừ status
});

OrderSchema.virtual('order_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Order', OrderSchema);
