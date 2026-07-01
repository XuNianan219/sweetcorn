-- 定时刷新 user_preferences（Supabase pg_cron）
-- 在 Supabase SQL Editor 执行一次。前置：已跑过 add_user_events_soft_behavior.sql。

-- 1) 启用扩展（也可在 Dashboard → Database → Extensions 里开启 pg_cron）
create extension if not exists pg_cron;

-- 2) 把聚合逻辑封成一个函数（DB 侧单一来源，cron 只需调用它）
--    与 recommendationService.js 的 rebuildAllPreferences 保持同一套衰减公式。
create or replace function refresh_user_preferences()
returns void
language sql
as $$
  insert into user_preferences (user_id, tag, score, updated_at)
  select e.user_id, pt.tag,
    sum(e.weight * exp(-extract(epoch from (now() - e.created_at)) / 86400.0 / 30))::float8,
    now()
  from user_events e
  join product_tags pt on pt.product_id = e.product_id
  where e.created_at > now() - interval '90 days'
  group by e.user_id, pt.tag
  on conflict (user_id, tag)
    do update set score = excluded.score, updated_at = now();
$$;

-- 3) 每天刷新一次。
--    ⚠️ pg_cron 按 UTC 计时。中国凌晨 3:00 (UTC+8) = 前一天 19:00 UTC。
select cron.schedule(
  'refresh_user_preferences_daily',
  '0 19 * * *',
  $$ select refresh_user_preferences(); $$
);

-- ── 运维参考 ────────────────────────────────────
-- 查看已排程任务：      select * from cron.job;
-- 查看执行历史：        select * from cron.job_run_details order by start_time desc limit 20;
-- 手动立即跑一次：      select refresh_user_preferences();
-- 取消排程：            select cron.unschedule('refresh_user_preferences_daily');
