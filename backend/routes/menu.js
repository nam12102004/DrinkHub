const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const Topping = require('../models/Topping');
const Shop = require('../models/Shop');
const { checkAuth } = require('../middleware/auth');

// Helper to get next incremental IDs
async function getNextCategoryId() {
  const last = await Category.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

async function getNextProductId() {
  const last = await Product.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

async function getNextToppingId() {
  const last = await Topping.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

// Helper: Kiểm tra xem user có phải chủ sở hữu của shop không
async function isShopOwner(userId, shopId) {
  const shop = await Shop.findById(shopId);
  return shop && shop.user_id === userId;
}

/* ==========================================
 * I. DANH MỤC (CATEGORY)
 * ========================================== */

// 1. Lấy danh mục sản phẩm (Lọc theo shop_id nếu truyền vào query)
// GET /api/menu/categories?shop_id=1
router.get('/categories', async (req, res) => {
  try {
    const { shop_id } = req.query;
    const query = shop_id ? { shop_id: Number(shop_id) } : {};
    const categories = await Category.find(query).populate('shop_id', 'name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Tạo danh mục mới (Chỉ chủ cửa hàng)
// POST /api/menu/categories
router.post('/categories', checkAuth([2]), async (req, res) => {
  try {
    const { shop_id, name } = req.body;
    if (!shop_id || !name) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin shop_id hoặc name danh mục' });
    }

    const hasPermission = await isShopOwner(req.user.id, shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý cửa hàng này' });
    }

    const nextId = await getNextCategoryId();
    const newCategory = new Category({
      _id: nextId,
      shop_id: Number(shop_id),
      name
    });

    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Xóa danh mục
// DELETE /api/menu/categories/:id
router.delete('/categories/:id', checkAuth([2]), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    const hasPermission = await isShopOwner(req.user.id, category.shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý cửa hàng này' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/* ==========================================
 * II. SẢN PHẨM / ĐỒ UỐNG (PRODUCT)
 * ========================================== */

// 1. Lấy danh sách sản phẩm (Lọc theo shop_id, category_id nếu truyền vào query)
// GET /api/menu/products?shop_id=1&category_id=2
router.get('/products', async (req, res) => {
  try {
    const { shop_id, category_id } = req.query;
    const filter = {};
    if (shop_id) filter.shop_id = Number(shop_id);
    if (category_id) filter.category_id = Number(category_id);

    const products = await Product.find(filter)
      .populate('shop_id', 'name')
      .populate('category_id', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Tạo sản phẩm mới (Chỉ chủ cửa hàng)
// POST /api/menu/products
router.post('/products', checkAuth([2]), async (req, res) => {
  try {
    const { category_id, shop_id, name, description, price, available, image } = req.body;
    if (!category_id || !shop_id || !name || price === undefined || !image) {
      return res.status(400).json({ success: false, message: 'Thiếu các thông tin bắt buộc của sản phẩm' });
    }

    const hasPermission = await isShopOwner(req.user.id, shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý cửa hàng này' });
    }

    const nextId = await getNextProductId();
    const newProduct = new Product({
      _id: nextId,
      category_id: Number(category_id),
      shop_id: Number(shop_id),
      name,
      description,
      price: Number(price),
      available: available !== undefined ? available : true,
      image
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Cập nhật sản phẩm
// PUT /api/menu/products/:id
router.put('/products/:id', checkAuth([2]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const hasPermission = await isShopOwner(req.user.id, product.shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý sản phẩm của shop này' });
    }

    const { name, description, price, available, image, category_id } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (available !== undefined) product.available = available;
    if (image !== undefined) product.image = image;
    if (category_id !== undefined) product.category_id = Number(category_id);

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Xóa sản phẩm
// DELETE /api/menu/products/:id
router.delete('/products/:id', checkAuth([2]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const hasPermission = await isShopOwner(req.user.id, product.shop_id);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa sản phẩm này' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/* ==========================================
 * III. ĐỒ ĐI KÈM / TOPPING (TOPPING)
 * ========================================== */

// 1. Lấy danh sách tất cả Topping (Công khai)
// GET /api/menu/toppings
router.get('/toppings', async (req, res) => {
  try {
    const toppings = await Topping.find();
    res.json(toppings);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Tạo topping mới (Chỉ Shop Owner)
// POST /api/menu/toppings
router.post('/toppings', checkAuth([2]), async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin tên hoặc giá topping' });
    }

    const nextId = await getNextToppingId();
    const newTopping = new Topping({
      _id: nextId,
      name,
      price: Number(price)
    });

    await newTopping.save();
    res.status(201).json({ success: true, topping: newTopping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
