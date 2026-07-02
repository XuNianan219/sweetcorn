// AI 客服：基于 data/faq.md 的最基础 FAQ 问答（调用 Claude API）
require('../config/env'); // 确保 dotenv 已加载（读取 ANTHROPIC_API_KEY）
const express = require('express');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// 启动时读取 FAQ（绝对路径，避免工作目录问题）
const FAQ_PATH = path.join(__dirname, '..', '..', 'data', 'faq.md');
let faqContent = '';
try {
  faqContent = fs.readFileSync(FAQ_PATH, 'utf-8');
} catch (err) {
  console.warn(`[chat] 未能读取 FAQ 文件：${FAQ_PATH}（${err.message}）`);
}

const FALLBACK_REPLY = '这个问题我暂时无法解答，可以点击下方「转人工客服」联系工作人员~';

// 防滥用上限：只保留最近的对话轮次，单条消息限长
const MAX_MESSAGES = 12;
const MAX_CONTENT_LENGTH = 1000;

// 惰性构造：ANTHROPIC_API_KEY 未配置时不能在模块加载期 new（SDK 会直接抛错拖垮整个后端），
// 而是等请求进来时返回友好的 503。
let anthropic = null;
function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropic) anthropic = new Anthropic();
  return anthropic;
}

function buildSystemPrompt() {
  return [
    '你是甜玉米平台的 AI 客服。只能依据下面的【FAQ 知识库】回答用户问题。',
    '规则：',
    '1. 只回答 FAQ 里覆盖到的问题，答案要贴合 FAQ 内容，不要编造。',
    `2. 如果 FAQ 里没有相关信息、无法回答，就原样回复：「${FALLBACK_REPLY}」。`,
    '3. 不要虚构平台功能、价格、政策等任何 FAQ 未提及的信息。',
    '4. 回答保持简短友好（一般不超过 3 句话），可以用「~」等语气词，符合粉丝社区氛围。',
    '',
    '【FAQ 知识库】',
    faqContent || '（暂无 FAQ 内容）',
  ].join('\n');
}

// 清洗对话历史：只认 user/assistant 两种角色、内容必须是非空字符串，超限截断
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = [];
  for (const m of raw) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
    if (typeof m.content !== 'string' || !m.content.trim()) return null;
    cleaned.push({ role: m.role, content: m.content.slice(0, MAX_CONTENT_LENGTH) });
  }
  if (cleaned.length === 0) return null;
  // 只保留最近 N 条，并保证以 user 开头（Claude 要求首条必须是 user）
  let recent = cleaned.slice(-MAX_MESSAGES);
  while (recent.length && recent[0].role !== 'user') recent.shift();
  return recent.length ? recent : null;
}

// POST /api/chat [auth] —— 接收对话历史 messages，返回 { reply }
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const messages = sanitizeMessages(req.body.messages);
    if (!messages) {
      return res.status(400).json({ message: 'messages 必须是非空的 {role, content} 数组' });
    }

    const client = getAnthropic();
    if (!client) {
      return res
        .status(503)
        .json({ message: 'AI 客服未配置（缺少 ANTHROPIC_API_KEY），请转人工客服' });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: buildSystemPrompt(),
      messages,
    });

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    res.json({ reply: reply || FALLBACK_REPLY });
  } catch (err) {
    console.error('[chat] 调用失败：', err.message);
    res.status(500).json({ message: 'AI 客服暂时不可用，请稍后再试或转人工客服' });
  }
});

module.exports = router;
