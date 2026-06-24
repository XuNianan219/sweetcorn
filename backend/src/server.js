require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { port } = require('./config/env');
const helloRoutes = require('./routes/helloRoutes');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debugRoutes');
const usersRoutes = require('./routes/usersRoutes');
const postsRoutes = require('./routes/postsRoutes');
const mediaRoutes = require('./routes/media');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查：供前端探测后端端口（免认证）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api', helloRoutes);
app.use('/api', authRoutes);
app.use('/api', debugRoutes);
app.use('/api', usersRoutes);
app.use('/api', postsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/likes', require('./routes/like'));
app.use('/api/follows', require('./routes/follow'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/merchandise', require('./routes/merchandise'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/events', require('./routes/events'));
app.use('/api/recycle', require('./routes/recycle'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/celebrity-pages', require('./routes/celebrityPages'));
app.use('/api/timeline-entries', require('./routes/timelineEntries'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/travel', require('./routes/travel'));
app.use('/api/translate', require('./routes/translate'));

app.use(notFound);
app.use(errorHandler);

// 智能端口分配：优先用配置端口，被占用则自动 +1，最多尝试 10 个
async function startServer() {
  let currentPort = parseInt(process.env.PORT, 10) || parseInt(port, 10) || 3000;
  const maxAttempts = 10;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort, '0.0.0.0', () => {
          console.log(`✅ Server is running on port ${currentPort}`);
          try {
            const portFilePath = path.join(__dirname, '../../.backend-port.json');
            fs.writeFileSync(
              portFilePath,
              JSON.stringify({ port: currentPort, updatedAt: Date.now() }, null, 2),
            );
            console.log(`📝 Port info written to ${portFilePath}`);
          } catch (writeErr) {
            console.warn('⚠️  写入端口文件失败:', writeErr.message);
          }
          resolve();
        });
        server.on('error', (err) => reject(err));
      });
      return; // 启动成功
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${currentPort} in use, trying ${currentPort + 1}...`);
        currentPort++;
        continue;
      }
      console.error('❌ 服务器启动失败:', err.message);
      process.exit(1);
    }
  }

  console.error(`❌ Could not find free port after ${maxAttempts} attempts`);
  process.exit(1);
}

startServer();
