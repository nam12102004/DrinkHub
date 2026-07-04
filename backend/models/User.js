const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: [true, 'user_id (PK) là bắt buộc']
  },
  name: {
    type: String,
    required: [true, 'Tên người dùng không được để trống'],
    maxlength: [30, 'Tên người dùng không được dài quá 30 ký tự'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại không được để trống'],
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} không phải số điện thoại 10 số hợp lệ!`
    }
  },
  email: {
    type: String,
    maxlength: [30, 'Email không được dài quá 30 ký tự'],
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu không được để trống'],
    maxlength: [30, 'Mật khẩu không được dài quá 30 ký tự']
  },
  role: {
    type: Number,
    required: [true, 'Vai trò không được để trống']
  }
}, {
  timestamps: true
});

// Thêm virtual user_id trả về _id
UserSchema.virtual('user_id').get(function() {
  return this._id;
});

module.exports = mongoose.model('User', UserSchema);
