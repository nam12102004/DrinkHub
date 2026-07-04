const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { checkAuth } = require('../middleware/auth');

// Helper to get next incremental ID
async function getNextShopId() {
  const lastShop = await Shop.findOne().sort({ _id: -1 });
  return lastShop ? lastShop._id + 1 : 1;
}

// 1. LẤY DANH SÁCH TẤT CẢ CỬA HÀNG (Công khai)
// GET /api/shops
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.find().populate('user_id', 'name email phone');
    res.json(shops);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. LẤY CHI TIẾT MỘT CỬA HÀNG
// GET /api/shops/:id
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('user_id', 'name email phone');
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. TẠO CỬA HÀNG MỚI (Yêu cầu quyền là Shop Owner [2])
// POST /api/shops
router.post('/', checkAuth([2]), async (req, res) => {
  try {
    const { name, description, phone, facebook, address } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (name, phone, address)' });
    }

    const nextId = await getNextShopId();

    const newShop = new Shop({
      _id: nextId,
      user_id: req.user.id, // ID của chủ cửa hàng từ middleware
      name,
      description,
      phone,
      facebook,
      address
    });

    await newShop.save();

    res.status(201).json({
      success: true,
      message: 'Tạo cửa hàng thành công',
      shop: newShop
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

    // 4. CẬP NHẬT THÔNG TIN CỬA HÀNG (Chỉ chủ sở hữu cửa hàng mới có quyền)
// PUT /api/shops/:id
router.put('/:id', checkAuth([2]), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng' });
    }

    // Kiểm tra xem user hiện tại có phải chủ shop không
    if (shop.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không phải chủ sở hữu của cửa hàng này' });
    }

    const { name, description, phone, facebook, address } = req.body;

    if (name !== undefined) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (phone !== undefined) shop.phone = phone;
    if (facebook !== undefined) shop.facebook = facebook;
    if (address !== undefined) shop.address = address;

    await shop.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin cửa hàng thành công',
      shop
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. XÓA CỬA HÀNG
// DELETE /api/shops/:id
router.delete('/:id', checkAuth([2]), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng' });
    }

    // Chỉ chủ shop mới được xóa
    if (shop.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không phải chủ sở hữu để thực hiện thao tác xóa' });
    }

    await Shop.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa cửa hàng thành công'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
