const prisma = require('../config/prisma');

// ─── 第 2 步：行为权重 ────────────────────────────────────────
// 写入 user_events 时按 event_type 赋 weight；聚合时直接 Σweight
const EVENT_WEIGHTS = {
  // 商品（旧 6 种，权重不变）
  view: 1,
  click: 2,
  favorite: 4,
  assist: 6,
  group_join: 8,
  purchase: 10,
  // 帖子软行为（采集阶段占位，暂不赋评分含义 → 0）
  impression: 0,
  dwell: 0,
  video_complete: 0,
  video_5s: 0,
  skip: 0,
};

// 已购买 / 已助力过的，从「猜你喜欢」中排除（避免重复推）
const DEDUP_EVENT_TYPES = ['purchase', 'assist', 'group_join'];

// ─── 第 3 步：打分系数（可调）────────────────────────────────
const GROUP_PROGRESS_WEIGHT = 8; // A：成团进度 current/target 的权重
const GROUP_DEADLINE_WEIGHT = 6; // B：临近截止的权重
const POPULARITY_WEIGHT = 5; // C：热度兜底权重（新用户偏好为空时占主导）
const URGENCY_WINDOW_HOURS = 72; // 进入「紧迫」状态的时间窗：截止前 N 小时内线性升温

// ─── 行为埋点写入 ────────────────────────────────────────────
const DEDUP_WINDOW_MIN = 30; // 同用户 + 同目标 + 同行为，30 分钟内只记一次（防刷分）

// 通用埋点：支持 post / product。opts = { targetType, targetId, productId, eventType, duration }
// 兼容旧调用：只传 productId（无 targetType）时按商品处理。
// 返回 { created:boolean, event }。命中去重窗口则 created=false，不重复写。
async function trackEvent(userId, opts) {
  const { eventType, duration } = opts;
  const weight = EVENT_WEIGHTS[eventType];
  if (weight === undefined) {
    throw new Error(`未知的 event_type: ${eventType}`);
  }
  const targetType = opts.targetType || 'product';
  const targetId = opts.targetId || opts.productId || null;

  // 30 分钟去重
  const since = new Date(Date.now() - DEDUP_WINDOW_MIN * 60_000);
  const dup = await prisma.userEvent.findFirst({
    where: { userId, targetType, targetId, eventType, createdAt: { gte: since } },
    select: { id: true },
  });
  if (dup) return { created: false, event: dup };

  const durationInt = parseInt(duration, 10);
  const event = await prisma.userEvent.create({
    data: {
      userId,
      productId: targetType === 'product' ? targetId : null, // 商品事件才写外键
      targetType,
      targetId,
      eventType,
      weight,
      duration: Number.isFinite(durationInt) ? durationInt : null,
    },
  });
  return { created: true, event };
}

// ─── 第 2 步：偏好聚合（定时批量重算，非实时）──────────────────
// 把 user_events join product_tags，按 (user_id, tag) 聚合 Σweight 写入 user_preferences。
// 全量重算：建议每 15~30 分钟跑一次（cron），或在用户产生 N 次行为后针对单人触发。
// 时间衰减：score = Σ(weight × exp(-天数/30))，只看近 90 天 —— 让偏好表反映"近期"兴趣。
const DECAYED_SCORE_SQL =
  "SUM(e.weight * EXP(-EXTRACT(EPOCH FROM (now() - e.created_at)) / 86400.0 / 30))::float8";
const RECENT_WINDOW_SQL = "e.created_at > now() - INTERVAL '90 days'";

async function rebuildAllPreferences() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO user_preferences (user_id, tag, score, updated_at)
    SELECT e.user_id, pt.tag, ${DECAYED_SCORE_SQL}, now()
    FROM user_events e
    JOIN product_tags pt ON pt.product_id = e.product_id
    WHERE ${RECENT_WINDOW_SQL}
    GROUP BY e.user_id, pt.tag
    ON CONFLICT (user_id, tag)
      DO UPDATE SET score = EXCLUDED.score, updated_at = now();
  `);
}

// 仅重算单个用户（行为触发时用，开销小）
async function rebuildUserPreferences(userId) {
  await prisma.$executeRaw`
    INSERT INTO user_preferences (user_id, tag, score, updated_at)
    SELECT e.user_id, pt.tag,
      SUM(e.weight * EXP(-EXTRACT(EPOCH FROM (now() - e.created_at)) / 86400.0 / 30))::float8, now()
    FROM user_events e
    JOIN product_tags pt ON pt.product_id = e.product_id
    WHERE e.user_id = ${userId}::uuid
      AND e.created_at > now() - INTERVAL '90 days'
    GROUP BY e.user_id, pt.tag
    ON CONFLICT (user_id, tag)
      DO UPDATE SET score = EXCLUDED.score, updated_at = now();
  `;
}

// ─── 打分核心 ────────────────────────────────────────────────
function groupUrgencyScore(product, now) {
  if (!product.isGroupBuy || product.groupStatus !== 'forming') return 0;

  const target = product.targetCount || 0;
  const progress = target > 0 ? Math.min(1, product.currentCount / target) : 0;

  let timeUrgency = 0;
  if (product.deadline) {
    const hoursLeft = (new Date(product.deadline).getTime() - now) / 3_600_000;
    if (hoursLeft <= 0) return 0; // 已过截止，视为非紧迫（应由 group_status 流转为 expired）
    // 越接近截止越高：进入时间窗后线性升温，0~1
    timeUrgency = Math.max(0, Math.min(1, 1 - hoursLeft / URGENCY_WINDOW_HOURS));
  }

  return progress * GROUP_PROGRESS_WEIGHT + timeUrgency * GROUP_DEADLINE_WEIGHT;
}

function preferenceScore(product, prefMap) {
  let s = 0;
  for (const { tag } of product.tags) {
    s += prefMap[tag] || 0;
  }
  return s;
}

// 拉取候选商品（含标签）+ 用户画像 + 去重集合，逐个打分
async function scoreProducts(userId) {
  const now = Date.now();

  const [products, prefs, dedupEvents] = await Promise.all([
    prisma.product.findMany({ include: { tags: { select: { tag: true } } } }),
    userId
      ? prisma.userPreference.findMany({ where: { userId }, select: { tag: true, score: true } })
      : Promise.resolve([]),
    userId
      ? prisma.userEvent.findMany({
          where: { userId, eventType: { in: DEDUP_EVENT_TYPES } },
          select: { productId: true },
          distinct: ['productId'],
        })
      : Promise.resolve([]),
  ]);

  const prefMap = Object.fromEntries(prefs.map((p) => [p.tag, p.score]));
  const dedupSet = new Set(dedupEvents.map((e) => e.productId));

  // 热度归一化（新用户偏好为空时，这一项主导排序 → 自然冷启动）
  const maxPop = Math.max(1, ...products.map((p) => p.popularity || 0));

  return products.map((product) => {
    const pref = preferenceScore(product, prefMap);
    const urgency = groupUrgencyScore(product, now);
    const popN = ((product.popularity || 0) / maxPop) * POPULARITY_WEIGHT;
    const finalScore = pref + urgency + popN;
    return {
      product,
      pref,
      urgency,
      popularity: popN,
      finalScore,
      alreadyEngaged: dedupSet.has(product.id),
    };
  });
}

// ─── 第 4 步：两个板块 ───────────────────────────────────────
// ①「猜你喜欢」：按最终分排序，排除已购/已助力
async function getRecommendedForYou(userId, limit = 20) {
  const scored = await scoreProducts(userId);
  return scored
    .filter((s) => !s.alreadyEngaged)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit)
    .map((s) => ({ ...s.product, _score: round(s.finalScore) }));
}

// 商品目录整体排序：复用同一套打分，返回全部商品按最终分降序（并列按时间），
// 不去重、不截断 —— 用于「已上架周边」列表替代默认排序。
// 冷启动（未登录 / 无偏好）时 finalScore 退化为热度分，再按 createdAt 兜底。
async function getSortedProducts(userId) {
  const scored = await scoreProducts(userId);
  return scored
    .sort(
      (a, b) =>
        b.finalScore - a.finalScore ||
        new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime()
    )
    .map(({ product }) => {
      const { tags, ...rest } = product; // 剥掉打分用的 tags，保持原列表返回结构
      return rest;
    });
}

// ②「即将成团 / 帮 TA 助力」：只取进行中的团购，按团购紧迫分排序，喜好分次级
async function getGroupBuyToAssist(userId, limit = 20) {
  const now = Date.now();
  const scored = await scoreProducts(userId);
  return scored
    .filter(
      (s) =>
        s.product.isGroupBuy &&
        s.product.groupStatus === 'forming' &&
        (!s.product.deadline || new Date(s.product.deadline).getTime() > now)
    )
    .sort((a, b) => b.urgency - a.urgency || b.pref - a.pref)
    .slice(0, limit)
    .map((s) => ({
      ...s.product,
      _urgency: round(s.urgency),
      progress: s.product.targetCount > 0 ? s.product.currentCount / s.product.targetCount : 0,
    }));
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

module.exports = {
  EVENT_WEIGHTS,
  trackEvent,
  rebuildAllPreferences,
  rebuildUserPreferences,
  getRecommendedForYou,
  getSortedProducts,
  getGroupBuyToAssist,
};
