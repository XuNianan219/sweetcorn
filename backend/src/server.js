require('dotenv').config();

const express = require('express');
const cors = require('cors');

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

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
