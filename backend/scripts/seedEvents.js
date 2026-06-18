// 种子脚本：为「活动商务区」生成 12 条已审核活动
// 幂等：description 末尾带 [SEED-EVENT] 标记，重复执行先清空旧的再插新的
// 运行：npm run seed:events

const prisma = require('../src/config/prisma');

const SEED_TAG = '[SEED-EVENT]';
const DAY = 24 * 3600 * 1000;

const PERFORMANCE_IMG = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
];
const MERCHANDISE_IMG = [
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
  'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800',
  'https://images.unsplash.com/photo-1549049950-48d5887197a0?w=800',
];
const ENDORSEMENT_IMG = [
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
  'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?w=800',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800',
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
];

const CELEB_OPTIONS = [['梓渝'], ['田栩宁'], ['梓渝', '田栩宁']];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function withTag(text) {
  return `${text}\n\n${SEED_TAG}`;
}

// 时间分布：past=已过去, near=未来30天内, far=未来60-90天
function dateFor(bucket) {
  const now = Date.now();
  if (bucket === 'past') return new Date(now - randInt(2, 20) * DAY);
  if (bucket === 'near') return new Date(now + randInt(1, 30) * DAY);
  return new Date(now + randInt(60, 90) * DAY);
}

// 12 条活动定义：type, title, desc, location, externalUrl, bucket, pinned, imgIdx
const EVENTS = [
  // performance x4
  { type: 'performance', title: '梓渝 2026 巡回演唱会·北京站', desc: '万人体育馆，全新舞美与曲目，应援必到现场。', location: '北京·国家体育馆', url: 'https://example.com/ticket/zy-bj', bucket: 'near', pinned: true, img: 0 },
  { type: 'performance', title: '田栩宁粉丝见面会', desc: '近距离互动、抽奖合影，限量入场名额。', location: '上海·梅赛德斯中心', url: 'https://example.com/ticket/txn-sh', bucket: 'near', pinned: false, img: 1 },
  { type: 'performance', title: '甜玉米 CP 双人签售会', desc: '新专辑线下签售，凭购买凭证入场。', location: '广州·正佳广场', url: 'https://example.com/ticket/cp-gz', bucket: 'far', pinned: false, img: 2 },
  { type: 'performance', title: '年度演唱会·成都场（已结束）', desc: '感谢到场的每一位玉米，返场视频已上线。', location: '成都·凤凰山体育馆', url: '', bucket: 'past', pinned: false, img: 3 },

  // merchandise x4
  { type: 'merchandise', title: '官方周边礼盒·限量首发', desc: '含徽章、明信片、亚克力立牌，限量 2000 份。', location: '', url: 'https://example.com/shop/giftbox', bucket: 'near', pinned: true, img: 0 },
  { type: 'merchandise', title: '梓渝新专辑《向光》预售', desc: '实体专辑预售开启，含随机签名小卡。', location: '', url: 'https://example.com/shop/album-zy', bucket: 'near', pinned: false, img: 1 },
  { type: 'merchandise', title: '应援棒 2.0 发售', desc: '蓝牙联动现场灯光，演唱会必备。', location: '', url: 'https://example.com/shop/lightstick', bucket: 'far', pinned: false, img: 2 },
  { type: 'merchandise', title: '联名帆布包（已售罄）', desc: '与本地品牌联名款，已全部售出，感谢支持。', location: '', url: '', bucket: 'past', pinned: false, img: 3 },

  // endorsement x4
  { type: 'endorsement', title: '田栩宁 × 某运动品牌代言官宣', desc: '全新品牌大使，线下快闪店同步开启。', location: '上海·静安大悦城', url: 'https://example.com/brand/txn', bucket: 'near', pinned: false, img: 0 },
  { type: 'endorsement', title: '梓渝公益植树活动', desc: '与公益组织合作，号召粉丝低碳出行。', location: '内蒙古·阿拉善', url: 'https://example.com/charity/tree', bucket: 'near', pinned: false, img: 1 },
  { type: 'endorsement', title: 'CP 双人公益直播义卖', desc: '善款全数捐赠山区儿童助学项目。', location: '线上直播', url: 'https://example.com/charity/live', bucket: 'far', pinned: true, img: 2 },
  { type: 'endorsement', title: '某美妆品牌代言（已结束档期）', desc: '上一季代言档期已结束，物料归档保存。', location: '', url: '', bucket: 'past', pinned: false, img: 3 },
];

function imgFor(type, idx) {
  if (type === 'performance') return PERFORMANCE_IMG[idx];
  if (type === 'merchandise') return MERCHANDISE_IMG[idx];
  return ENDORSEMENT_IMG[idx];
}

async function main() {
  console.log('>> seed events start');

  // 找一个现有用户作为提交人
  const submitter = await prisma.user.findFirst({ select: { id: true, nickname: true } });
  if (!submitter) {
    console.error('❌ 数据库里没有任何用户，请先创建用户（npm run create:test-users）');
    process.exit(1);
  }
  console.log(`>> submitter: ${submitter.nickname || submitter.id}`);

  // 清理旧 seed
  const removed = await prisma.event.deleteMany({
    where: { description: { contains: SEED_TAG } },
  });
  console.log(`>> cleared ${removed.count} old seed events`);

  const stats = { performance: 0, merchandise: 0, endorsement: 0, pinned: 0, past: 0, near: 0, far: 0 };

  for (const e of EVENTS) {
    const startAt = dateFor(e.bucket);
    // 60% 给一个结束时间（开始后 1-3 天）
    const endAt = Math.random() < 0.6 ? new Date(startAt.getTime() + randInt(1, 3) * DAY) : null;

    await prisma.event.create({
      data: {
        title: e.title,
        description: withTag(e.desc),
        eventType: e.type,
        coverImage: imgFor(e.type, e.img),
        location: e.location,
        startAt,
        endAt,
        externalUrl: e.url,
        celebrities: pick(CELEB_OPTIONS),
        isPinned: e.pinned,
        status: 'approved',
        submittedBy: submitter.id,
        reviewedBy: submitter.id,
      },
    });

    stats[e.type] += 1;
    stats[e.bucket] += 1;
    if (e.pinned) stats.pinned += 1;
  }

  console.log('\n==== 统计 ====');
  console.log(`总计：${EVENTS.length} 条（全部 approved）`);
  console.log(`演出 performance：${stats.performance} 条`);
  console.log(`周边 merchandise：${stats.merchandise} 条`);
  console.log(`代言 endorsement：${stats.endorsement} 条`);
  console.log(`置顶 isPinned：${stats.pinned} 条`);
  console.log(`时间分布：已过去 ${stats.past} / 30天内 ${stats.near} / 60-90天 ${stats.far}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 错误:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
