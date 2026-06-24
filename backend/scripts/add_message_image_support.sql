-- 私信支持图片消息：新增消息类型 + 图片 URL 字段
-- 先在 Supabase 后台做一次数据库备份，再执行（psql 或 Supabase SQL Editor 均可）。
-- 执行后运行：cd backend && npx prisma generate

ALTER TABLE messages ADD COLUMN IF NOT EXISTS msg_type text NOT NULL DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url text;
-- 老消息自动是 'text'（默认值），不受影响
