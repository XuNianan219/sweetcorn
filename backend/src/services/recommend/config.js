// 推荐打分全部可调参数集中在此。以后攒到真实数据后，校准只改这一个文件。
// 注意：这里的 SIGNAL_WEIGHTS 是「打分用」权重，和采集阶段 user_events.weight 无关。
module.exports = {
  // ── 信号权重：把各种行为折算成兴趣/质量分 ──────────────
  SIGNAL_WEIGHTS: {
    // 强正向
    purchase: 10,
    assist: 10,
    group_join: 10,
    favorite: 8,
    product_like: 8,
    like: 7, // 帖子点赞（likes 表）
    comment: 6, // 帖子评论（comments 表）
    video_complete: 6,
    want: 6, // 创意想要（idea_wants 表）
    // 中/弱正向
    video_5s: 3, // 黄金五秒钩子
    dwell: 3, // 实际按归一化 ratio 缩放
    view: 2,
    click: 2,
    impression: 0, // 仅作分母
    // 负向
    skip: -5,
  },

  // ── 时间衰减 ────────────────────────────────────────
  BEHAVIOR_HALFLIFE_DAYS: 7, // 用户历史行为：上周的赞权重减半
  BEHAVIOR_WINDOW_DAYS: 60, // 聚合画像只看最近 60 天行为
  FRESHNESS_HALFLIFE_HOURS: {
    // 内容新鲜度：时效强的衰减快
    media: 24,
    discussion: 24,
    'love-history': 24,
    life: 72,
    article: 72,
    travel: 72,
    _default: 48,
  },
  FRESHNESS_FLOOR: 0.1, // 老内容/新内容都不判死刑

  // ── 兴趣匹配分 ──────────────────────────────────────
  INTEREST_BASE: 0.15, // 冷启动保底，别乘成 0
  INTEREST_FOLLOW: 0.5,
  INTEREST_CATEGORY: 0.3,
  INTEREST_TAG: 0.2,

  // ── 内容质量基础分 ──────────────────────────────────
  QUALITY: {
    ctr: 1.0, // view / impression
    completion: 1.0, // video_complete / video_5s
    engagement: 1.0, // (like + comment) / impression
    skipPenalty: 1.0, // - skip / impression
    smoothing: 10, // 分母平滑，避免曝光少时分数爆炸
  },

  // ── 近期负反馈惩罚 ──────────────────────────────────
  PENALTY: {
    skipAuthor: 0.3, // 近期划走过该作者
    skipCategory: 0.2, // 近期划走过该类目
    cap: 5, // 计数封顶
    windowDays: 7,
  },

  // ── dwell 归一化（估算内容"应有阅读时长"）──────────────
  READ_CHARS_PER_SEC: 5, // ≈中文 300 字/分
  READ_SEC_PER_IMAGE: 3,

  // ── 召回 / 输出 ─────────────────────────────────────
  RECALL_DAYS: 7,
  RECALL_LIMIT: 500,
  RESULT_LIMIT: 20,

  // ── 新内容强曝光（gap 3）────────────────────────────
  NEW_CONTENT_RATIO: 0.2, // 结果里强制留 20% 给新内容
  NEW_CONTENT_MAX_AGE_HOURS: 24, // “新内容”= 发布 < 24h

  // ── 冷启动判定（gap 4）──────────────────────────────
  COLD_START_MIN_TAGS: 3, // 用户偏好标签数 < 此值 → 走冷启动(热度)路径
};
