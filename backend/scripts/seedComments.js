// 种子脚本：给现有 test 帖子生成评论 + 楼中楼 + 点赞
// 幂等：content 末尾带 [SEED-COMMENT] 标记，重复执行先删旧的
// 运行：npm run seed:comments

const prisma = require('../src/config/prisma');

const SEED_TAG = '[SEED-COMMENT]';
const POST_TAGS = ['[SEED-TEST-POST]', '[SEED-VIDEO-TEST]'];

const TOP_TEXTS = [
  '太喜欢这个了！', '梓渝好帅', '磕到了磕到了', '这是哪一期？', '楼主有更多吗？',
  '求资源', '催更', '绝美', '田栩宁也太好看了', '一整个爱住', '这质感谁不爱',
  '已经看了十遍', '前排留名', '蹲一个高清', '好喜欢这个氛围', '直接封神',
];
const REPLY_TEXTS = ['同感', '+1', '附议', '我也是', '你好像很懂哦', '说得对', '哈哈哈哈', '蹲', '坐等', '一样一样'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function pickN(arr, n) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length > 0; i++) out.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
  return out;
}
function tag(text) {
  return `${text} ${SEED_TAG}`;
}

async function likeComment(commentId, users) {
  const n = randInt(0, Math.min(users.length, 12));
  const likers = pickN(users, n);
  let count = 0;
  for (const u of likers) {
    try {
      await prisma.commentLike.create({ data: { userId: u.id, commentId } });
      count += 1;
    } catch (_) {
      /* unique 冲突忽略 */
    }
  }
  if (count > 0) {
    await prisma.comment.update({ where: { id: commentId }, data: { likeCount: count } });
  }
  return count;
}

async function main() {
  console.log('>> seed comments start');

  const users = await prisma.user.findMany({ select: { id: true }, take: 12 });
  if (users.length === 0) {
    console.error('❌ 无用户，请先 npm run create:test-users');
    process.exit(1);
  }

  // 目标帖子：带 test 标记的
  const posts = await prisma.post.findMany({
    where: { OR: POST_TAGS.map((t) => ({ content: { contains: t } })), deletedAt: null },
    select: { id: true },
  });
  if (posts.length === 0) {
    console.error('❌ 没有 test 帖子，请先 npm run seed:test / seed:videos');
    process.exit(1);
  }

  // 清理旧 seed 评论（CommentLike onDelete cascade）
  const old = await prisma.comment.findMany({
    where: { content: { contains: SEED_TAG } },
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.comment.deleteMany({ where: { id: { in: old.map((c) => c.id) } } });
  }
  console.log(`>> cleared ${old.length} old seed comments`);

  let topTotal = 0;
  let replyTotal = 0;
  let likeTotal = 0;

  for (const post of posts) {
    const topN = randInt(2, 6);
    const topTexts = pickN(TOP_TEXTS, Math.min(topN, TOP_TEXTS.length));
    for (const text of topTexts) {
      const top = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: pick(users).id,
          content: tag(text),
          parentId: null,
        },
        select: { id: true },
      });
      topTotal += 1;
      likeTotal += await likeComment(top.id, users);

      // 30% 概率生成 1-3 条回复
      if (Math.random() < 0.3) {
        const rn = randInt(1, 3);
        for (let i = 0; i < rn; i++) {
          const reply = await prisma.comment.create({
            data: {
              postId: post.id,
              authorId: pick(users).id,
              content: tag(pick(REPLY_TEXTS)),
              parentId: top.id,
            },
            select: { id: true },
          });
          replyTotal += 1;
          likeTotal += await likeComment(reply.id, users);
        }
      }
    }
  }

  console.log('\n==== 统计 ====');
  console.log(`目标帖子：${posts.length} 篇`);
  console.log(`顶层评论：${topTotal} 条`);
  console.log(`楼中楼回复：${replyTotal} 条`);
  console.log(`评论点赞：${likeTotal} 个`);
  console.log('✅ 完成');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 错误:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
