# 推荐系统设计文档 · Phase 1.5(信号补齐)+ Phase 2(打分函数)

> 本文只做**设计**,不含实现代码。定稿后可整份交给 Claude Code 分步实现。
> 前置:Phase 1(帖子软行为采集)已完成,待 `add_user_events_soft_behavior.sql` 在 Supabase 执行。

---

## 0. 现状与两条数据来源(实现前必须知道)

信号分散在**两个存储**,打分时要 union:

| 来源 | 存了什么 | 表 |
|---|---|---|
| **软行为**(Phase 1) | impression / view / dwell / video_complete | `user_events` (`target_type='post'`) |
| **硬互动**(早就有) | 帖子赞、评论、商品赞、加购、创意想要 | `likes` / `comments` / `product_likes` / `cart_items` / `idea_wants` |

> ⚠️ 打分函数不能只读 `user_events`——点赞/评论这些最强正信号在各自的表里。

**五个内容类目**及其信号可得性:

| 类目 | 实体 | 现有信号 | 缺口 |
|---|---|---|---|
| 图文帖子 | Post(image/text) | impression/view/dwell/skip*、like、comment | dwell 归一化 |
| 视频帖子 | Post(video) | impression/video_complete、like、comment | 早期钩子信号 |
| 商品 | Product(普通) | view/click/favorite/purchase、product_like、cart | 软行为未全埋 |
| 拼团 | Product(group_buy) | +assist/group_join + 团购紧迫度(已有) | 同上 |
| 创意众筹 | Idea | want(idea_wants) | 无软行为 |

\* `skip` 后端已定义、前端未发 → Phase 1.5 补。

---

## Phase 1.5 · 黄金五秒信号补齐(3 项,不碰打分)

目标:把"最早期、最高价值"的正负信号采到。**只加采集,不加新迁移**(复用已有的 `event_type` / `duration` 列)。

### 信号 A:`skip` —— 快速划走(强负向)
- **定义**:卡片进入视口 ≥50%(已发过 impression)后离开,且**停留 < 3 秒**、期间**未点击**。
- **触发点**:
  - 列表:扩展 `PostCard` 现有 IntersectionObserver——记录进入视口时间;离开视口时,若可见时长 < 3s 且无点击 → 发 `skip`,`duration`=可见秒数。
  - 沉浸式视频:`< 5 秒`就上划到下一条 → 发 `skip`。
- **注意**:停留 3s+ 但没点 = 只算 impression(弱信号),**不算 skip**。避免把正常滑动全判成负向。

### 信号 B:`video_5s` —— 前 5 秒钩子(中正向,黄金五秒核心)
- **定义**:视频播放 `currentTime` 越过 **5 秒 或 首个四分位(取较小)** → 发一次 `video_5s`。
- **触发点**:`VideoPlayer`(沉浸式)+ `PostDetail` 的 `<video>`,`onTimeUpdate` 里判一次,每次激活只发一次。
- **需要**:后端 `EVENT_WEIGHTS` 新增 `video_5s`(采集阶段权重先 0,Phase 2 再赋值)。
- **配对**:`video_5s` 通过 = 钩子成功;曝光了但没 `video_5s`、或直接 `skip` = 钩子失败。**完播率 = video_complete / video_5s**(过了钩子的人里有多少看完),比 /曝光 更准。

### 信号 C:`dwell` 归一化基准(不新增采集)
- **原则**:dwell 原始秒数照旧存,**归一化放到打分时算**,不存"应有时长"(避免加列)。
- **打分时**:
  - 图文:`应有阅读秒 = 正文字数 / 5 + 图片数 × 3`(≈中文 300 字/分)。`dwell_ratio = min(1, dwell / 应有阅读秒)`。字数从 `posts.content` 现算。
  - 视频:不用 dwell 归一化,直接用 `video_5s` / `video_complete` 两个进度信号(更准)。

**Phase 1.5 改动面**:`skip` + `video_5s` 两个 event_type 的前端埋点 + 后端 `EVENT_WEIGHTS` 加 `video_5s`(`skip` 已存在)。**无迁移、无排序改动。**

---

## Phase 2 · 打分函数设计

### 2.1 总公式(乘法保底 + 加法基础)

```
final(user, item) =
      quality_norm(item)          // ① 内容质量基础分  0~1(类目内归一化)
    × interest(user, item)        // ② 用户匹配度      含冷启动保底
    × freshness(item)             // ③ 新鲜度时间衰减   0~1,有下限
    − penalty(user, item)         // ④ 近期负反馈惩罚
```

> 结构解释:质量与匹配度用**乘法**——内容再好、用户不匹配也不该硬推(保底);再叠新鲜度衰减;最后减去用户近期负反馈。冷启动/新内容靠 `interest` 和 `freshness` 的下限保底(沿用 Phase-2 商品版里 `0.1 + 0.9×` 的做法)。

### 2.2 行为权重表(信号 → 分值)

**正信号**(累加进 `interest` 与 `quality`):

| 信号 | 来源 | 权重 | 强度 |
|---|---|---|---|
| purchase / assist / group_join | user_events / 表 | 10 | 强正 |
| favorite / product_like | 表 | 8 | 强正 |
| like(帖子) | likes | 7 | 强正 |
| comment(帖子) | comments | 6 | 强正 |
| video_complete | user_events | 6 | 强正 |
| idea want | idea_wants | 6 | 强正 |
| video_5s(钩子) | user_events | 3 | 中正 |
| dwell(按 ratio 缩放) | user_events | 0~3 | 弱-中正 |
| view / click(点开) | user_events | 2 | 弱正 |
| impression | user_events | 0 | 中性(仅做分母) |

**负信号**(进 `penalty`):

| 信号 | 定义 | 权重 |
|---|---|---|
| skip | <3s 划走 | −5 强负 |
| 曝光未点 | impression 多、view 少(低 CTR) | −1 弱负 |

> 数值是**第一版拍脑袋基线**,上线后必须用真实 dwell/skip 分布回来校准(见 §2.7)。

### 2.3 ① 内容质量基础分 quality_norm(item) —— 全站,与用户无关

先算每条内容的原始质量(近 N 天窗口内聚合):
```
CTR      = view 数 / impression 数
完播率    = video_complete 数 / video_5s 数        (仅视频)
互动率    = (like+comment+favorite+want+share) / impression 数
skip率    = skip 数 / impression 数                (负向)
quality_raw = w1·CTR + w2·完播率 + w3·互动率 − w4·skip率
```
**类目内归一化**(关键):每个类目分别做 min-max 或分位归一化,把 `quality_raw` 拉到 `[0,1]` = `quality_norm`。
→ 这样视频的高完播、商品的低点击**各自比各自**,不会视频永远压商品。

### 2.4 ② 用户匹配度 interest(user, item)

由用户**历史正向行为**聚合出画像,再算这条内容匹配度:
```
interest = base
         + 0.5 · 关注了作者
         + 0.3 · 命中用户偏好类目(由历史正向行为的类目分布 top-K 得出)
         + 0.2 · 命中偏好标签/CP(hashtags 交集)
base = 0.15  // 冷启动保底,别乘成 0
上限归一到 ~1.3
```
- 用户偏好类目/标签 = 对该用户所有正信号(按 §2.2 权重)按 `category` / `hashtag` 聚合 `Σ(权重 × 时间衰减)`,取 top-K。
- **CP 破圈**:偏好里混入 1~2 个"关联 CP"(共现高但用户没看过的),给探索留口子(Phase 3 打散时强化)。

### 2.5 ③ 新鲜度 freshness(item)

```
freshness = floor + (1 - floor) · 0.5^(age_hours / halflife)
floor = 0.1                     // 冷启动/老内容不判死刑
halflife: 时效内容(media/CP动态/热点) = 24h
          长青内容(article/生活) = 72h
```
- 时间衰减**双重作用**:既衰减内容本身新鲜度,也衰减用户历史行为权重(上周的赞 < 今天的赞)——§2.4 聚合时 `Σ(权重 × 0.5^(age/halflife))`。

### 2.6 ④ 负反馈惩罚 penalty(user, item)

```
penalty = 0.3 · (用户近7天对"该作者"的 skip 次数, 封顶)
        + 0.2 · (用户近7天对"该类目"的 skip 率)
```
→ 用户刚划走过的作者/类目,短期压制,避免反复喂同款惹烦。

### 2.7 类目归一化 & 混合 feed

若首页是**多类目混合流**:
1. 每类目内部按上式各自算 `final`。
2. 每类目对 `final` 做分位归一化 → `[0,1]`。
3. 可给类目配"曝光配额"(如 图文 40% / 视频 30% / 商品 20% / 拼团+创意 10%),按配额从各类目取头部,再交叉。
→ 保证视频不霸屏、商品有稳定曝光。

### 2.8 离线评估基线(改算法前先立)

上线打分前先记录基准,每次迭代对比:
- 平均 dwell_ratio、完播率、CTR
- 次日/7日留存
- 人均消费条数、划走率

Phase 2 只做**离线打分 + 一版排序**,不上 AB(体量没到)。等量级起来再拆召回/排序、上 AB。

---

## 落地顺序(定稿后分步实现)

1. **Phase 1.5**:埋 `skip`(列表+沉浸式)、`video_5s`(两处视频);后端加 `video_5s` 权重占位。
2. **Phase 2-a**:写"聚合画像"作业——把 `user_events` + 4 张硬互动表按用户/类目/标签聚合成偏好(带时间衰减)。
3. **Phase 2-b**:写 `quality_norm`(全站质量,类目归一化)。
4. **Phase 2-c**:组合 `final` 打分 + 一版排序接口,用 `previewRecommendations` 式脚本验证。
5. **Phase 3**:打散 + 探索配额。

> 每一步都可独立验证,不必一次做完。
