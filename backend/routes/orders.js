const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const SelectTopping = require('../models/SelectTopping');
const Product = require('../models/Product');
const Topping = require('../models/Topping');
const Discount = require('../models/Discount');
const Shop = require('../models/Shop');
const { checkAuth } = require('../middleware/auth');

// Helper to get next incremental IDs
async function getNextOrderId() {
  const last = await Order.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

async function getNextOrderItemId() {
  const last = await OrderItem.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

async function getNextSelectToppingId() {
  const last = await SelectTopping.findOne().sort({ _id: -1 });
  return last ? last._id + 1 : 1;
}

/* ==========================================
 * ĐƠN HÀNG (ORDER)
 * ========================================== */

// 1. ĐẶT HÀNG (Yêu cầu vai trò bất kỳ đã đăng nhập, mặc định là Khách hàng [1])
// POST /api/orders
router.post('/', checkAuth(), async (req, res) => {
  try {
    const { shop_id, discount_id, phone, address, note, items } = req.body;

    if (!shop_id || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt hàng (shop_id, phone, address, items)' });
    }

    // A. Tính toán giá trị đơn hàng
    let computedTotalPrice = 0;
    const itemsToSave = []; // Danh sách order items kèm toppings để lưu sau

    for (const item of items) {
      const { product_id, quantity, toppings } = item;
      if (!product_id || !quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Mặt hàng trong giỏ không hợp lệ' });
      }

      // Lấy giá sản phẩm
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm với ID: ${product_id}` });
      }

      let toppingPriceSum = 0;
      const toppingObjects = [];

      // Lấy giá các toppings nếu có chọn
      if (toppings && Array.isArray(toppings) && toppings.length > 0) {
        for (const tId of toppings) {
          const topping = await Topping.findById(tId);
          if (!topping) {
            return res.status(404).json({ success: false, message: `Không tìm thấy Topping với ID: ${tId}` });
          }
          toppingPriceSum += topping.price;
          toppingObjects.push(topping);
        }
      }

      const itemUnitPrice = product.price + toppingPriceSum;
      const itemTotalPrice = itemUnitPrice * quantity;
      computedTotalPrice += itemTotalPrice;

      itemsToSave.push({
        product_id,
        quantity,
        price: product.price, // Lưu lại giá gốc tại thời điểm mua
        toppings: toppingObjects
      });
    }

    // B. Áp dụng mã giảm giá (nếu có)
    let discountValue = 0;
    if (discount_id) {
      const discount = await Discount.findById(discount_id);
      if (discount) {
        // Kiểm tra hạn sử dụng của mã
        if (!discount.expiration || new Date(discount.expiration) > new Date()) {
          discountValue = discount.value;
          computedTotalPrice = Math.max(0, computedTotalPrice - discountValue);
        }
      }
    }

    // C. Lưu Đơn hàng (Order)
    const nextOrderId = await getNextOrderId();
    const newOrder = new Order({
      _id: nextOrderId,
      user_id: req.user.id,
      shop_id: Number(shop_id),
      discount_id: discount_id ? Number(discount_id) : null,
      status: 'Chờ duyệt',
      price: computedTotalPrice,
      phone,
      address,
      note
    });

    await newOrder.save();

    // D. Lưu chi tiết mặt hàng (OrderItem) và Topping lựa chọn (SelectTopping)
    let nextOrderItemId = await getNextOrderItemId();
    let nextSelectId = await getNextSelectToppingId();

    for (const savedItem of itemsToSave) {
      const currentOrderItemId = nextOrderItemId++;
      const newOrderItem = new OrderItem({
        _id: currentOrderItemId,
        product_id: savedItem.product_id,
        order_id: newOrder._id,
        quantity: savedItem.quantity,
        price: savedItem.price
      });
      await newOrderItem.save();

      // Lưu toppings được lựa chọn cho item này
      for (const tObj of savedItem.toppings) {
        const newSelectTopping = new SelectTopping({
          _id: nextSelectId++,
          topping_id: tObj._id,
          orderitem_id: currentOrderItemId
        });
        await newSelectTopping.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Đặt đơn hàng thành công',
      order: newOrder
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. XEM DANH SÁCH ĐƠN HÀNG (Có phân quyền)
// GET /api/orders
router.get('/', checkAuth(), async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 1) {
      // Khách hàng: chỉ xem đơn của chính mình
      query.user_id = req.user.id;
    } else if (req.user.role === 2) {
      // Chủ cửa hàng: lọc theo shop_id do họ quản lý
      const { shop_id } = req.query;
      if (!shop_id) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp shop_id để xem đơn hàng của quán' });
      }

      // Xác minh chủ cửa hàng
      const shop = await Shop.findById(shop_id);
      if (!shop || shop.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý cửa hàng này' });
      }
      query.shop_id = Number(shop_id);
    }
    // Shipper (role 3): được xem toàn bộ đơn hàng (hoặc lọc theo shop_id hoặc status nếu truyền vào)
    else if (req.user.role === 3) {
      if (req.query.shop_id) {
        query.shop_id = Number(req.query.shop_id);
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
    }

    const orders = await Order.find(query)
      .populate('user_id', 'name phone email')
      .populate('shop_id', 'name address')
      .populate('discount_id', 'name value')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Chỉ Shop Owner [2] hoặc Admin [3])
// PUT /api/orders/:id/status
router.put('/:id/status', checkAuth([2, 3]), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin trạng thái cần cập nhật' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Phân quyền cập nhật trạng thái đơn hàng:
    if (req.user.role === 2) {
      // Chủ cửa hàng: Chỉ được cập nhật các đơn hàng thuộc shop của mình
      const shop = await Shop.findById(order.shop_id);
      if (!shop || shop.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền quản lý đơn hàng của shop này' });
      }
    } else if (req.user.role === 3) {
      // Shipper: Chỉ được phép cập nhật các trạng thái quy trình vận chuyển
      const allowedShipperStatuses = ['Chờ shipper', 'Đang giao', 'Thành công', 'Đã hủy'];
      if (!allowedShipperStatuses.includes(status)) {
        return res.status(403).json({ success: false, message: 'Shipper chỉ được phép cập nhật trạng thái sang Chờ shipper, Đang giao, Thành công hoặc Đã hủy' });
      }
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
