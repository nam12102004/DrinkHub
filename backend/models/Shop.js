const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'shop_id (PK) là bắt buộc']
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'Chủ sở hữu (user_id) là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên cửa hàng không được để trống'],
    maxlength: [30, 'Tên cửa hàng không được dài quá 30 ký tự'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [100, 'Mô tả ngắn không được dài quá 100 ký tự'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại liên hệ là bắt buộc'],
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} không phải số điện thoại 10 số hợp lệ!`
    }
  },
  facebook: {
    type: String,
    maxlength: [100, 'Đường dẫn Facebook không được dài quá 100 ký tự'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ cửa hàng không được để trống'],
    maxlength: [100, 'Địa chỉ không được dài quá 100 ký tự'],
    trim: true
  }
}, {
  timestamps: true
});

ShopSchema.virtual('shop_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Shop', ShopSchema);
