/**
 * Middleware phân quyền đơn giản (Không dùng JWT)
 * Nhận thông tin từ HTTP Headers hoặc Query Parameters:
 * - User ID: `x-user-id` hoặc `userId`
 * - Role: `x-user-role` hoặc `role`
 * 
 * Bảng phân quyền Role:
 * - 1: Customer (Khách hàng)
 * - 2: Shop Owner (Chủ cửa hàng)
 * - 3: Shipper (Người giao hàng)
 */

const checkAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    // 1. Lấy thông tin từ headers hoặc query parameters
    const userId = req.headers['x-user-id'] || req.query.userId;
    const role = req.headers['x-user-role'] || req.query.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng cung cấp User ID trong headers (x-user-id) hoặc query (?userId=...).'
      });
    }

    if (!role) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng cung cấp Role trong headers (x-user-role) hoặc query (?role=...).'
      });
    }

    const userRoleNum = Number(role);

    // 2. Kiểm tra xem vai trò hiện tại có nằm trong danh sách được phép không
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleNum)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Vai trò yêu cầu: ${allowedRoles.join(' hoặc ')}. Gửi vào: ${userRoleNum}`
      });
    }

    // 3. Đính kèm thông tin user vào request object để sử dụng ở các routes tiếp theo
    req.user = {
      id: Number(userId),
      role: userRoleNum
    };

    next();
  };
};

module.exports = { checkAuth };
