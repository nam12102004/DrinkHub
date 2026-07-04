const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'comment_id (PK) là bắt buộc']
  },
  product_id: {
    type: Number,
    ref: 'Product',
    required: [true, 'Mã sản phẩm (product_id) là bắt buộc']
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'Mã người dùng (user_id) là bắt buộc']
  },
  orderitem_id: {
    type: Number,
    ref: 'OrderItem',
    required: [true, 'Mã chi tiết đơn hàng (orderitem_id) là bắt buộc']
  },
  comment: {
    type: String,
    required: [true, 'Nội dung bình luận không được để trống'],
    maxlength: [100, 'Nội dung bình luận không được dài quá 100 ký tự'],
    trim: true
  },
  evaluate: {
    type: Number,
    required: [true, 'Điểm đánh giá là bắt buộc'],
    min: [1, 'Điểm đánh giá thấp nhất là 1 sao'],
    max: [5, 'Điểm đánh giá cao nhất là 5 sao']
  }
}, {
  timestamps: true
});

CommentSchema.virtual('comment_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('Comment', CommentSchema);
