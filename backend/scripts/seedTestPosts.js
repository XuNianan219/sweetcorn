// 种子脚本：为 discussion / media / article 三个分区各生成 15 条测试帖
// 幂等：content 末尾带 [SEED-TEST-POST] 标记，重复执行会先清空旧的再插新的
// 运行：npm run seed:test

const prisma = require('../src/config/prisma');

const SEED_TAG = '[SEED-TEST-POST]';

const TEST_USERS = [
  { nickname: 'testuser', phone: '13800000000' }, // 可能已存在，复用
  { nickname: '梓渝粉丝小喵', phone: '13811111101' },
  { nickname: '田栩宁后援会', phone: '13811111102' },
  { nickname: '吃瓜群众', phone: '13811111103' },
  { nickname: '追星少女', phone: '13811111104' },
];

const UNSPLASH = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=600',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function pickN(arr, n) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = randInt(0, pool.length - 1);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
function randomRecentDate() {
  const now = Date.now();
  const sevenDays = 7 * 24 * 3600 * 1000;
  return new Date(now - Math.floor(Math.random() * sevenDays));
}
function withSeedTag(content) {
  return `${content}\n\n${SEED_TAG}`;
}

// ---------- 讨论区 15 条 ----------
const DISCUSSION_POSTS = [
  { title: '梓渝新专辑什么时候发啊？', content: '已经等了半年了，求大佬爆料', hashtags: ['梓渝'], withImage: false },
  { title: '今天看到田栩宁机场图了吗！', content: '穿搭绝了，求同款！谁有高清大图！', hashtags: ['田栩宁', '穿搭'], withImage: true },
  { title: 'CP 粉快来集合', content: '最近有没有新糖，磕到停不下来，速速分享', hashtags: ['CP'], withImage: false },
  { title: '关于粉丝礼物的建议', content: '大家觉得送什么比较合适？不想送重复的，求推荐', hashtags: [], withImage: false },
  { title: '综艺里这段也太戳了吧', content: '反复看了十遍，每次都想哭，兄弟情满分', hashtags: ['综艺'], withImage: true },
  { title: '下周巡演有抢到票的姐妹吗？', content: '蹲一个拼饭局，北京场报平安～', hashtags: ['巡演'], withImage: false },
  { title: '粉丝应援物投票中！', content: '两个方案选哪个？快戳评论区投票吧', hashtags: ['应援'], withImage: false },
  { title: '这张路透是不是 p 过了？', content: '感觉下巴有点怪，大家帮看看', hashtags: ['路透'], withImage: true },
  { title: '求推荐梓渝的所有采访合集', content: '想做一个剪辑视频，有现成合集欢迎投食', hashtags: ['梓渝'], withImage: false },
  { title: '田栩宁的新剧什么时候定档？', content: '官博只说年底，蹲一个准确时间', hashtags: ['田栩宁'], withImage: false },
  { title: '你们第一次看到他们同框是哪部？', content: '我是综艺第一期，当场入坑', hashtags: ['同框'], withImage: false },
  { title: '关于最近的黑料讨论', content: '理性吃瓜，别乱带节奏谢谢', hashtags: [], withImage: false },
  { title: '粉丝自制周边有哪些推荐店铺？', content: '坐标上海，求线下店，手工挑', hashtags: ['周边'], withImage: true },
  { title: '想求一篇入坑指南', content: '新人报到！哪部作品最先看？', hashtags: ['入坑'], withImage: false },
  { title: '今天微博热搜是谁家在上分', content: '关注度好高啊，是不是有新物料了', hashtags: ['热搜'], withImage: false },
];

// ---------- 影像区 15 条 ----------
const MEDIA_POSTS = [
  { title: '梓渝今日份美颜暴击', content: '路透图好多，分享一下', hashtags: ['梓渝'], imgCount: 2 },
  { title: '粉丝拍摄 | 演唱会精选', content: '高清图一组', hashtags: ['演唱会'], imgCount: 3 },
  { title: '田栩宁机场街拍', content: '红了~', hashtags: ['田栩宁', '街拍'], imgCount: 1 },
  { title: '今日穿搭分享', content: '偶像同款 get', hashtags: ['穿搭'], imgCount: 2 },
  { title: '舞台高光 · 第三场', content: '必收藏', hashtags: ['舞台'], imgCount: 3 },
  { title: '花絮放送｜综艺拍摄日', content: '超甜', hashtags: ['花絮'], imgCount: 2 },
  { title: '官博今日放图', content: '质感绝了', hashtags: [], imgCount: 1 },
  { title: '签售会高清返图', content: '心动一整天', hashtags: ['签售'], imgCount: 2 },
  { title: '团综 ep.04 截屏', content: '笑死我了', hashtags: ['团综'], imgCount: 3 },
  { title: '机场未修图', content: '颜值真实不滤镜', hashtags: [], imgCount: 1 },
  { title: '粉丝合影 compilation', content: '一次看个够', hashtags: ['合影'], imgCount: 2 },
  { title: '明星私服合集', content: '搬运自微博', hashtags: ['私服'], imgCount: 3 },
  { title: '演唱会灯牌海洋', content: '这场面谁不爱', hashtags: ['演唱会'], imgCount: 1 },
  { title: '杂志大片预热', content: '等正片', hashtags: ['杂志'], imgCount: 2 },
  { title: '手写信公开', content: '字真的好看', hashtags: [], imgCount: 0 }, // 10% 无图
];

// ---------- 文章区 15 条 ----------
const ARTICLE_POSTS = [
  {
    title: '深度 | 梓渝这五年的演技成长轨迹',
    content:
      '一篇 3000 字的分析长文，从他出道第一部作品说起。\n\n' +
      '2019 年初登场时的青涩与用力过度，到 2021 年那部转型之作里的层次感，再到如今对角色的松弛把控——他走过的路并不像外界以为的那样顺畅。' +
      '本文将从三个维度切入：微表情、台词节奏、与对手戏演员的化学反应，梳理他在五部代表作里的可量化变化。\n\n' +
      '第一阶段（2019-2020）：模仿期。这阶段他的表演明显带着学院派的框架，每个情绪点都踩得过满。' +
      '第二阶段（2021-2022）：解构期。开始有意减少表演的"刻意感"，尝试用身体姿态代替面部表情。' +
      '第三阶段（2023-）：融合期。成熟演员该有的取舍和分寸，在今年那部悬疑剧里已经完全呈现。\n\n' +
      '这种进步不是偶然，是日积月累的结果，也是一位真诚对待职业的演员应得的口碑。',
    hashtags: ['深度', '梓渝'],
    withImage: false,
  },
  {
    title: '我对追星这件事的一些思考',
    content:
      '最近在想，追星到底给我们带来了什么？\n\n' +
      '是漫长通勤路上的一点光，是低谷时一句"他都在坚持"的托举，还是虚耗时间的借口？我觉得三者都有，关键在于我们如何拿捏。\n\n' +
      '追星这件事不该是人生的全部，但它可以是一个锚点，提醒你还有热爱这件事存在。' +
      '这些年我从只看物料的路人粉，到开始参与线下活动的中坚，再到如今学着把"喜欢"转化成自我成长的推动力——心态经历了几次完整的蜕变。\n\n' +
      '想对新入坑的姐妹说：喜欢归喜欢，生活的主语永远是自己。',
    hashtags: ['追星', '思考'],
    withImage: false,
  },
  {
    title: '从《XXX》看中国 CP 剧的发展',
    content:
      '这是一篇影评性质的长文。\n\n' +
      '《XXX》作为今年爆款 CP 剧，其成功并非偶然。本文尝试拆解它在叙事结构、情感递进、人物弧光三个维度上的做法，并横向对比过去十年的经典 CP 剧。\n\n' +
      '一、叙事结构：摒弃传统误会梗，采用双线并行\n' +
      '二、情感递进：从 ep.01 的"对抗期"到 ep.12 的"共生期"，每一步都有扎实的铺垫\n' +
      '三、人物弧光：两位主角均有独立成长线，而非纯粹工具人\n\n' +
      '整体评分：9/10，推荐给所有愿意认真追剧的观众。',
    hashtags: ['影评', 'CP'],
    withImage: true,
  },
  {
    title: '写给 5 年前追星的自己',
    content:
      '这些年的心路历程，翻出来讲一讲。\n\n' +
      '2020 年的我在学校电脑房看完了一场演唱会直播，第一次认真为一个陌生人哭过。' +
      '那时候没想到五年后会有今天这样相对成熟的追星社群，也没想到自己会坚持这么久。\n\n' +
      '如果可以回去告诉当时的自己一些话，我想说：请不要因为偶像的一点瑕疵就动摇整个世界，也不要因为他的光芒就迷失自己的方向。\n\n' +
      '我们喜欢的是他们追光的样子，不是要把自己变成光源。',
    hashtags: ['随笔'],
    withImage: false,
  },
  {
    title: '田栩宁综艺表现的语言学分析',
    content:
      '从语言学角度分析田栩宁在最近综艺里的发言结构：\n\n' +
      '1. 句式偏短，节奏感强，适合综艺节奏\n' +
      '2. 比喻使用频率高于平均，显示出较强的联想能力\n' +
      '3. 主动句和被动句切换自然，表达层次丰富\n\n' +
      '这种语言风格并非偶然，更像是长期阅读积累的结果。',
    hashtags: ['田栩宁', '分析'],
    withImage: false,
  },
  {
    title: '谈谈应援文化的边界',
    content:
      '应援本是表达热爱的方式，但它的边界在哪里？\n\n' +
      '从集资到线下应援，从私生行为到恶意竞争——近年粉丝圈出现的越界行为引发不少讨论。本文试图回到原点：应援的初衷是什么？\n\n' +
      '一、理性应援 vs 情感绑架\n' +
      '二、集体荣誉 vs 个人隐私\n' +
      '三、支持作品 vs 控制偶像\n\n' +
      '边界感这件事，说到底是自我修养的体现。',
    hashtags: ['应援'],
    withImage: false,
  },
  {
    title: '梓渝音乐审美变化观察',
    content:
      '从出道单曲到最新 EP，他的音乐审美经历了明显迁移。\n\n' +
      '早期偏 R&B 情歌路线，近两年开始尝试 city pop 和 dream pop 的融合。' +
      '这种转变与他合作制作人的变化直接相关，也反映了他本人在音乐上的自主性逐渐增强。\n\n' +
      '推荐试听曲目（按时间顺序）：A → B → C → D → E。你会听到一条完整的审美迁移曲线。',
    hashtags: ['梓渝', '音乐'],
    withImage: true,
  },
  {
    title: '粉丝数据站运营的一些心得',
    content:
      '运营数据站两年，踩过不少坑，记录一些经验。\n\n' +
      '一、数据的真实性高于数据的好看\n' +
      '二、和官方保持距离，不要越位\n' +
      '三、粉丝不是 KPI，是人\n\n' +
      '能读到这篇的都是同路人，共勉。',
    hashtags: ['数据站'],
    withImage: false,
  },
  {
    title: '追星穷三代？这些理性消费建议请收好',
    content:
      '追星从来不便宜，但可以理性。\n\n' +
      '本文分享一份"理性消费清单"：\n' +
      '1. 专辑首发只买一版，其余看需要\n' +
      '2. 演唱会量力而行，不要为了所谓"等级"负债\n' +
      '3. 周边只买真正喜欢的，不要囤\n\n' +
      '钱包健康才能陪偶像走更远。',
    hashtags: ['消费'],
    withImage: false,
  },
  {
    title: '两位偶像的访谈对比阅读',
    content:
      '最近重读了梓渝和田栩宁的访谈各一篇，有些有意思的发现。\n\n' +
      '梓渝的访谈偏感性，常用具体意象表达抽象情绪；田栩宁的访谈偏理性，喜欢用结构化的列点回答。' +
      '这种风格差异放到舞台上，也能找到对应的痕迹——一个偏情绪流，一个偏技术流，各有千秋。\n\n' +
      '如果你有心，可以把两人的访谈各打印一份并排看，会发现很多细节呼应。',
    hashtags: ['访谈', '对比'],
    withImage: false,
  },
  {
    title: '关于 Vlog 这种表达形式',
    content:
      'Vlog 是近年偶像与粉丝沟通的重要媒介之一。\n\n' +
      '它介于真实与表演之间，既保留了"日常感"，又经过了剪辑和叙事处理。这种"半真实"的状态恰好击中了当代粉丝的情感需求——既想靠近，又不希望完全祛魅。\n\n' +
      'Vlog 做得好的偶像都有一个共同点：懂得留白。',
    hashtags: ['Vlog'],
    withImage: true,
  },
  {
    title: '一篇迟到的演唱会返场记录',
    content:
      '那场演唱会已经过去两个月了，拖到今天才写完这篇记录。\n\n' +
      '从入场前的长队，到开场第一束追光打下来的那一刻，再到返场时全场大合唱——三个小时如同三分钟。\n\n' +
      '我记得散场时有女孩在抹眼泪，也有人冲我笑着说"下次见"。这些陌生人的片段，构成了一个属于我们的集体记忆。',
    hashtags: ['演唱会'],
    withImage: false,
  },
  {
    title: '为什么我们需要"甜玉米 CP 应援站"',
    content:
      '回答一个老问题：为什么我们需要一个独立的 CP 应援站，而不是依托现有平台？\n\n' +
      '一、算法陷阱：大平台的推荐逻辑只关心流量，不关心社群\n' +
      '二、噪音过滤：独立站点可以保证内容质量\n' +
      '三、长期档案：平台会改规则，站点是我们自己的\n\n' +
      '希望这里能陪大家走得更远。',
    hashtags: [],
    withImage: false,
  },
  {
    title: '文字粉如何写出不口水的产出',
    content:
      '作为一名坚持写了三年的文字粉，分享几点心得：\n\n' +
      '1. 多看硬核影评、乐评，积累表达\n' +
      '2. 少用"绝""神""救命""哭死"等情绪词\n' +
      '3. 给每次产出设定一个明确的主题句\n' +
      '4. 写完过一夜再发，你会想改很多\n\n' +
      '文字粉不是"会写字的粉丝"，是"愿意为这份喜欢反复打磨的人"。',
    hashtags: ['创作'],
    withImage: false,
  },
  {
    title: '致粉圈新人的一封长信',
    content:
      '亲爱的新入坑的你：\n\n' +
      '欢迎来到这里。这里有温暖也有风浪，有高光也有阴影。\n\n' +
      '第一条建议：保持自己的节奏。不要被所谓的"等级链"或"KPI"绑架——追星是副业，生活才是主业。\n\n' +
      '第二条建议：慎言慎行。网络发言会留下痕迹，理性吃瓜、不传谣是基本素养。\n\n' +
      '第三条建议：不要把偶像当作唯一的情感出口。有朋友、有家人、有自己的生活，追星才会长久。\n\n' +
      '祝你在这里找到属于自己的那份热爱。',
    hashtags: ['新人'],
    withImage: false,
  },
];

async function ensureUsers() {
  const ensured = [];
  for (const u of TEST_USERS) {
    // 先按 nickname 查
    let user = await prisma.user.findFirst({ where: { nickname: u.nickname } });
    if (!user) {
      // 按 phone upsert（phone 唯一）
      user = await prisma.user.upsert({
        where: { phone: u.phone },
        update: { nickname: u.nickname },
        create: { nickname: u.nickname, phone: u.phone },
      });
    }
    ensured.push(user);
  }
  return ensured;
}

async function clearSeedPosts() {
  // 找到所有 seed 帖子 id（likes 有外键 cascade delete，直接删 post）
  const oldPosts = await prisma.post.findMany({
    where: { content: { contains: SEED_TAG } },
    select: { id: true },
  });
  const ids = oldPosts.map((p) => p.id);
  if (ids.length > 0) {
    // Like 有 onDelete: Cascade，直接删 post 即可
    await prisma.post.deleteMany({ where: { id: { in: ids } } });
  }
  return ids.length;
}

async function insertCategory(specs, category, users) {
  const created = [];
  let imgCount = 0;
  for (const spec of specs) {
    const author = pick(users);
    const createdAt = randomRecentDate();

    let mediaUrls = [];
    let mediaType = 'none';

    if (category === 'media') {
      const n = typeof spec.imgCount === 'number' ? spec.imgCount : 1;
      if (n > 0) {
        mediaUrls = pickN(UNSPLASH, n);
        mediaType = 'image';
      }
    } else if (spec.withImage) {
      mediaUrls = pickN(UNSPLASH, 1);
      mediaType = 'image';
    }

    if (mediaUrls.length > 0) imgCount += 1;

    const post = await prisma.post.create({
      data: {
        title: spec.title,
        content: withSeedTag(spec.content),
        type: 'text',
        category,
        hashtags: spec.hashtags || [],
        mediaUrl: mediaUrls[0] || '',
        mediaUrls,
        mediaType,
        authorId: author.id,
        createdAt,
        updatedAt: createdAt,
      },
    });
    created.push(post);
  }
  return { created, imgCount };
}

async function seedLikes(posts, users) {
  // 每个分区随机挑 3-5 条"热门"，每条给 5-20 个点赞（不重复点赞同一人）
  const hotCount = randInt(3, 5);
  const hot = pickN(posts, Math.min(hotCount, posts.length));
  let total = 0;
  for (const p of hot) {
    const likeCount = randInt(5, Math.min(20, users.length * 4));
    const likersPool = [];
    // 为保证不重复，每条帖子最多给不同用户点赞，不够就循环不同帖子
    // 但 users 只有 5 个，[userId+postId] 是 unique，所以一条帖最多 5 赞
    const distinctLikers = pickN(users, Math.min(likeCount, users.length));
    for (const u of distinctLikers) {
      try {
        await prisma.like.create({ data: { userId: u.id, postId: p.id } });
        total += 1;
      } catch (_e) {
        // 唯一约束冲突（理论不会），忽略
      }
    }
  }
  return total;
}

async function main() {
  console.log('>> seed start');
  const users = await ensureUsers();
  console.log(`>> users ready: ${users.map((u) => u.nickname).join(', ')}`);

  const removed = await clearSeedPosts();
  console.log(`>> cleared ${removed} old seed posts`);

  const discussion = await insertCategory(DISCUSSION_POSTS, 'discussion', users);
  const media = await insertCategory(MEDIA_POSTS, 'media', users);
  const article = await insertCategory(ARTICLE_POSTS, 'article', users);

  const likesD = await seedLikes(discussion.created, users);
  const likesM = await seedLikes(media.created, users);
  const likesA = await seedLikes(article.created, users);

  console.log('');
  console.log('==== 统计 ====');
  console.log(
    `讨论区：插入 ${discussion.created.length} 条，其中有图 ${discussion.imgCount} 条`,
  );
  console.log(`影像区：插入 ${media.created.length} 条，其中有图 ${media.imgCount} 条`);
  console.log(`文章区：插入 ${article.created.length} 条，其中有图 ${article.imgCount} 条`);
  console.log(`共生成点赞 ${likesD + likesM + likesA} 条`);
  console.log('>> seed done');
}

main()
  .catch((err) => {
    console.error('seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
