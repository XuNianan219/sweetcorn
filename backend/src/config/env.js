const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me'
};
