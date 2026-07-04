const mongoose = require('mongoose');

const StatisticalSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'stastical_id (PK) là bắt buộc']
  },
  shop_id: {
    type: Number,
    ref: 'Shop',
    required: [true, 'Mã cửa hàng (shop_id) là bắt buộc']
  },
  value: {
    type: Number,
    required: [true, 'Số liệu thống kê (doanh thu/số đơn) là bắt buộc'],
    min: [0, 'Giá trị thống kê không thể âm']
  },
  date: {
    type: Date,
    required: [true, 'Ngày thống kê là bắt buộc']
  }
}, {
  timestamps: true
});

// Virtual matching exact spelling from spec
StatisticalSchema.virtual('stastical_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Statistical', StatisticalSchema);
