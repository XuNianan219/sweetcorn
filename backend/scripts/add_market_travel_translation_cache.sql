-- Market 商品 / 创意 + Travel 官方内容（文化体验 / 精选线路）英文译文缓存
-- 先在 Supabase 后台做一次数据库备份，再执行（psql 或 Supabase SQL Editor 均可）。
-- 执行后运行：cd backend && npx prisma generate

-- 商品 products
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en text;

-- 创意 ideas
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS description_en text;

-- 文化体验 travel_experiences（celebrity 是人名，按需求不翻译）
ALTER TABLE travel_experiences ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE travel_experiences ADD COLUMN IF NOT EXISTS category_en text;
ALTER TABLE travel_experiences ADD COLUMN IF NOT EXISTS location_en text;
ALTER TABLE travel_experiences ADD COLUMN IF NOT EXISTS description_en text;

-- 精选线路 travel_routes
ALTER TABLE travel_routes ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE travel_routes ADD COLUMN IF NOT EXISTS subtitle_en text;
ALTER TABLE travel_routes ADD COLUMN IF NOT EXISTS description_en text;
