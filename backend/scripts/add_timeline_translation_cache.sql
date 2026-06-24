-- 日记（甜玉米日记）英文译文缓存：翻译一次后存库，之后直接读库，省翻译 API 额度
-- 先在 Supabase 后台做一次数据库备份，再执行（psql 或 Supabase SQL Editor 均可）。
-- 执行后运行：cd backend && npx prisma generate

ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS content_en text;
