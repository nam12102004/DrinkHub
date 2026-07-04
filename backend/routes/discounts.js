const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const Shop = require('../models/Shop');
const { checkAuth } = require('../middleware/auth');

// Helper to get next incremental ID
async function getNextDiscountId() {
  const lastDiscount = await Discount.findOne().sort({ _id: -1 });
  return lastDiscount ? lastDiscount._id + 1 : 1;
}

// 1. LẤY DANH SÁCH MÃ GIẢM GIÁ (Dành cho Khách hàng & Chủ shop)
// GET /api/discounts?shop_id=X
router.get('/', async (req, res) => {
  try {
    const { shop_id } = req.query;
    if (!shop_id) {
      return res.status(400).json({ success: false, message: 'Thiếu shop_id để truy vấn mã giảm giá' });
    }
    // Lấy các mã giảm giá còn hạn (hoặc không giới hạn thời gian) của quán
    const today = new Date();
    const discounts = await Discount.find({
      shop_id: Number(shop_id),
      $or: [
        { expiration: null },
        { expiration: { $gt: today } }
      ]
    }).sort({ value: -1 });
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. THÊM MỚI MÃ GIẢM GIÁ (Chỉ Chủ cửa hàng [2])
// POST /api/discounts
router.post('/', checkAuth([2]), async (req, res) => {
  try {
    const { name, value, shop_id, expiration } = req.body;
    if (!name || value === undefined || !shop_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (name, value, shop_id)' });
    }

    // Kiểm tra xem Chủ shop có quyền quản lý cửa hàng này không
    const shop = await Shop.findById(shop_id);
    if (!shop || shop.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thêm mã giảm giá cho shop này' });
    }

    const nextId = await getNextDiscountId();
    const newDiscount = new Discount({
      _id: nextId,
      name,
      value: Number(value),
      shop_id: Number(shop_id),
      expiration: expiration ? new Date(expiration) : null
    });

    await newDiscount.save();
    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      discount: newDiscount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CẬP NHẬT MÃ GIẢM GIÁ (Chỉ Chủ cửa hàng [2])
// PUT /api/discounts/:id
router.put('/:id', checkAuth([2]), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    // Kiểm tra xem Chủ shop có quyền quản lý cửa hàng liên kết không
    const shop = await Shop.findById(discount.shop_id);
    if (!shop || shop.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật mã giảm giá này' });
    }

    const { name, value, expiration } = req.body;
    if (name !== undefined) discount.name = name;
    if (value !== undefined) discount.value = Number(value);
    if (expiration !== undefined) discount.expiration = expiration ? new Date(expiration) : null;

    await discount.save();
    res.json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      discount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. XÓA MÃ GIẢM GIÁ (Chỉ Chủ cửa hàng [2])
// DELETE /api/discounts/:id
router.delete('/:id', checkAuth([2]), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
    }

    // Kiểm tra xem Chủ shop có quyền quản lý cửa hàng liên kết không
    const shop = await Shop.findById(discount.shop_id);
    if (!shop || shop.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa mã giảm giá này' });
    }

    await Discount.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
