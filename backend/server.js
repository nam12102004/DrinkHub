const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Task = require('./models/Task');

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

const seedDatabase = require('./seed');

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/taskdb';
console.log('Đang kết nối tới MongoDB...');
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Kết nối thành công tới MongoDB Database.');
    await seedDatabase();
  })
  .catch(err => {
    console.error('Không thể kết nối tới MongoDB!');
    console.error('Lỗi chi tiết:', err.message);
    console.error('HƯỚNG DẪN KHẮC PHỤC: Đảm bảo dịch vụ MongoDB của bạn đang hoạt động trên cổng 27017.');
  });

// API Routers
const usersRouter = require('./routes/users');
const shopsRouter = require('./routes/shops');
const menuRouter = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const interactionsRouter = require('./routes/interactions');
const discountsRouter = require('./routes/discounts');

// Mount API Routes
app.use('/api/users', usersRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/discounts', discountsRouter);

// Trạng thái Server
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend API Drink Shop System đang hoạt động bình thường.',
    endpoints: {
      tasks: 'GET /api/tasks (Legacy)',
      users: '/api/users/*',
      shops: '/api/shops/*',
      menu: '/api/menu/*',
      orders: '/api/orders/*',
      interactions: '/api/interactions/*'
    }
  });
});

// 1. Lấy danh sách tất cả các công việc
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Tạo công việc mới
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống' });
    }
    const newTask = new Task({ title, description });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Cập nhật trạng thái công việc (hoàn thành/chưa hoàn thành) hoặc nội dung
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: { ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(completed !== undefined && { completed }) } },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc với ID này' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 4. Xóa công việc
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy công việc với ID này' });
    }

    res.json({ success: true, message: 'Đã xóa công việc thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server backend đang chạy tại: http://localhost:${PORT}`);
});
