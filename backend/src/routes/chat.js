// AI 客服：基于 data/faq.md 的最基础 FAQ 问答（调用 Claude API）
require('../config/env'); // 确保 dotenv 已加载（读取 ANTHROPIC_API_KEY）
const express = require('express');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();

// 启动时读取 FAQ（绝对路径，避免工作目录问题）
const FAQ_PATH = path.join(__dirname, '..', '..', 'data', 'faq.md');
let faqContent = '';
try {
  faqContent = fs.readFileSync(FAQ_PATH, 'utf-8');
} catch (err) {
  console.warn(`[chat] 未能读取 FAQ 文件：${FAQ_PATH}（${err.message}）`);
}

const FALLBACK_REPLY = '这个问题我暂时无法解答，可以点击转人工客服';

function buildSystemPrompt() {
  return [
    '你是甜玉米平台的 AI 客服。只能依据下面的【FAQ 知识库】回答用户问题。',
    '规则：',
    '1. 只回答 FAQ 里覆盖到的问题，答案要贴合 FAQ 内容，不要编造。',
    `2. 如果 FAQ 里没有相关信息、无法回答，就原样回复：「${FALLBACK_REPLY}」。`,
    '3. 不要虚构平台功能、价格、政策等任何 FAQ 未提及的信息。',
    '',
    '【FAQ 知识库】',
    faqContent || '（暂无 FAQ 内容）',
  ].join('\n');
}

// POST /api/chat —— 接收对话历史 messages，返回 { reply }
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 必须是非空数组' });
    }

    const anthropic = new Anthropic(); // 从环境变量 ANTHROPIC_API_KEY 读取密钥

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages,
    });

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    res.json({ reply });
  } catch (err) {
    console.error('[chat] 调用失败：', err.message);
    res.status(500).json({ error: '客服暂时不可用，请稍后再试' });
  }
});

module.exports = router;
