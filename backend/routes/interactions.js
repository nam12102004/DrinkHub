const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Ingredient = require('../models/Ingredient');
const Statistical = require('../models/Statistical');
const Shop = require('../models/Shop');
const { checkAuth } = require('../middleware/auth');

// Helper to get next incremental IDs
async function getNextCommentId() {
  const last = await Comment.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

async function getNextIngredientId() {
  const last = await Ingredient.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

async function getNextStatisticalId() {
  const last = await Statistical.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

// Helper: Kiểm tra xem user có phải chủ sở hữu của shop không
async function isShopOwner(userId, shopId) {
  const shop = await Shop.findById(shopId);
  return shop && shop.user_id === userId;
}

/* ==========================================
 * I. BÌNH LUẬN & ĐÁNH GIÁ (COMMENT)
 * ========================================== */

// 1. Viết bình luận/đánh giá mới (Yêu cầu đăng nhập, thường là Khách hàng [1])
// POST /api/interactions/comments
router.post('/comments', checkAuth(), async (req, res) => {
  try {
    const { product_id, orderitem_id, comment, evaluate } = req.body;

    if (!product_id || !orderitem_id || !comment || evaluate === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu các trường bắt buộc của bình luận' });
    }

    const nextId = await getNextCommentId();
    const newComment = new Comment({
      _id: nextId,
      product_id: Number(product_id),
      user_id: req.user.id,
      orderitem_id: Number(orderitem_id),
      comment,
      evaluate: Number(evaluate)
    });

    await newComment.save();
    res.status(201).json({ success: true, message: 'Đăng bình luận thành công', comment: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Lấy danh sách bình luận của một sản phẩm (Công khai)
// GET /api/interactions/comments/:product_id
router.get('/comments/:product_id', async (req, res) => {
  try {
    const comments = await Comment.find({ product_id: Number(req.params.product_id) })
      .populate('user_id', 'name')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/* ==========================================
 * II. NGUYÊN LIỆU KHO (INGREDIENT)
 * ========================================== */

// 1. Xem danh sách nguyên liệu trong kho (Chỉ Shop Owner [2])
// GET /api/interactions/ingredients?shop_id=1
router.get('/ingredients', checkAuth([2]), async (req, res) => {
  try {
    const { shop_id } = req.query;
    if (!shop_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp shop_id để xem kho' });
    }

    const hasPermission = await isShopOwner(req.user.id, shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý kho của shop này' });
    }

    const ingredients = await Ingredient.find({ shop_id: Number(shop_id) });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Thêm nguyên liệu mới vào kho (Chỉ Shop Owner)
// POST /api/interactions/ingredients
router.post('/ingredients', checkAuth([2]), async (req, res) => {
  try {
    const { shop_id, name, quantity, description } = req.body;
    if (!shop_id || !name || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin nguyên liệu cần tạo' });
    }

    const hasPermission = await isShopOwner(req.user.id, shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý kho của shop này' });
    }

    const nextId = await getNextIngredientId();
    const newIngredient = new Ingredient({
      _id: nextId,
      shop_id: Number(shop_id),
      name,
      quantity: Number(quantity),
      description
    });

    await newIngredient.save();
    res.status(201).json({ success: true, ingredient: newIngredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Cập nhật số lượng nguyên liệu tồn kho
// PUT /api/interactions/ingredients/:id
router.put('/ingredients/:id', checkAuth([2]), async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu' });
    }

    const hasPermission = await isShopOwner(req.user.id, ingredient.shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý kho của shop này' });
    }

    const { quantity, description, name } = req.body;
    if (quantity !== undefined) ingredient.quantity = Number(quantity);
    if (description !== undefined) ingredient.description = description;
    if (name !== undefined) ingredient.name = name;

    await ingredient.save();
    res.json({ success: true, ingredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/* ==========================================
 * III. THỐNG KÊ BÁO CÁO (STATISTICAL)
 * ========================================== */

// 1. Lấy dữ liệu báo cáo thống kê của cửa hàng (Chỉ Shop Owner [2])
// GET /api/interactions/statistical/:shop_id
router.get('/statistical/:shop_id', checkAuth([2]), async (req, res) => {
  try {
    const { shop_id } = req.params;

    const hasPermission = await isShopOwner(req.user.id, shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thống kê của shop này' });
    }

    const stats = await Statistical.find({ shop_id: Number(shop_id) }).sort({ date: -1 });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Chốt/Tạo bản ghi thống kê mới (Chủ cửa hàng lưu doanh thu cuối ngày)
// POST /api/interactions/statistical
router.post('/statistical', checkAuth([2]), async (req, res) => {
  try {
    const { shop_id, value, date } = req.body;
    if (!shop_id || value === undefined || !date) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin thống kê cần nạp' });
    }

    const hasPermission = await isShopOwner(req.user.id, shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền ghi dữ liệu thống kê của shop này' });
    }

    const nextId = await getNextStatisticalId();
    const newStat = new Statistical({
      _id: nextId,
      shop_id: Number(shop_id),
      value: Number(value),
      date: new Date(date)
    });

    await newStat.save();
    res.status(201).json({ success: true, statistical: newStat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
