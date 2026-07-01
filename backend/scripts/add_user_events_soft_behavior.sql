-- 软行为采集：user_events 通用化，支持 posts（不再强制商品）
-- 在 Supabase SQL Editor（或 psql）执行一次；执行后同步 schema.prisma 再 `cd backend && npx prisma generate`

ALTER TABLE user_events ALTER COLUMN product_id DROP NOT NULL;                                 -- 帖子事件不需要 product_id
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'product';  -- 'post' / 'product'
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS target_id   uuid;                             -- 多态目标 id（不加外键）
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS duration    integer;                          -- dwell 停留秒数，其它事件为 NULL

-- 旧数据回填：历史商品事件的 target_id 指向原 product_id
UPDATE user_events SET target_id = product_id WHERE target_id IS NULL AND product_id IS NOT NULL;

-- 按目标查询用的索引
CREATE INDEX IF NOT EXISTS user_events_target_idx ON user_events (target_type, target_id);
