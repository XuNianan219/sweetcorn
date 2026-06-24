-- 周边创意审核 + 旅游官方内容（体验卡片 / 精选线路）
-- 在你的 Postgres 上执行一次（psql 或 Supabase SQL Editor 均可）。
-- 执行后请运行：cd backend && npx prisma generate

-- ── 1. 周边创意：增加审核字段 ─────────────────────────────
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS reject_reason text;
-- 存量创意视为已通过，避免上线后旧数据全部隐藏
UPDATE ideas SET status = 'approved' WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS ideas_status_idx ON ideas (status);

-- ── 2. 旅游官方文化体验卡片 ──────────────────────────────
CREATE TABLE IF NOT EXISTS travel_experiences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity    text NOT NULL DEFAULT '',
  title        text NOT NULL,
  category     text NOT NULL DEFAULT '',
  location     text NOT NULL DEFAULT '',
  duration     text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  cover_image  text NOT NULL DEFAULT '',
  vlog_url     text NOT NULL DEFAULT '',
  detail_url   text NOT NULL DEFAULT '',
  order_num    integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS travel_experiences_pub_order_idx ON travel_experiences (is_published, order_num);

-- ── 3. 旅游官方精选线路 Banner ───────────────────────────
CREATE TABLE IF NOT EXISTS travel_routes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  subtitle     text NOT NULL DEFAULT '',
  description  text NOT NULL DEFAULT '',
  cover_image  text NOT NULL DEFAULT '',
  detail_url   text NOT NULL DEFAULT '',
  order_num    integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS travel_routes_pub_order_idx ON travel_routes (is_published, order_num);
