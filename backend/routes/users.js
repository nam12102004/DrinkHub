const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkAuth } = require('../middleware/auth');

// Helper to get next incremental ID
async function getNextUserId() {
  const lastUser = await User.findOne().sort({ _id: -1 });
  return lastUser ? lastUser._id + 1 : 1;
}

// 1. ĐĂNG KÝ NGƯỜI DÙNG MỚI
// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !password || role === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu các thông tin bắt buộc (name, phone, password, role)' });
    }

    // Kiểm tra email trùng lặp (nếu có cung cấp email)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Địa chỉ email đã tồn tại trên hệ thống' });
      }
    }

    const nextId = await getNextUserId();

    const newUser = new User({
      _id: nextId,
      name,
      phone,
      email,
      password, // Dự án không yêu cầu bảo mật nên lưu plaintext trực tiếp
      role: Number(role)
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      user: {
        user_id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. ĐĂNG NHẬP ĐƠN GIẢN (KHÔNG DÙNG JWT)
// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công (Dự án không dùng JWT)',
      user: {
        user_id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. LẤY HỒ SƠ NGƯỜI DÙNG HIỆN TẠI (Yêu cầu gửi kèm header phân quyền)
// GET /api/users/profile
router.get('/profile', checkAuth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }
    
    res.json({
      success: true,
      user: {
        user_id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
