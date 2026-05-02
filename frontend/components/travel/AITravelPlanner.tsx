import React, { useState } from 'react';
import { Compass, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const COMPANY_SITE = 'https://www.example-tourism-official.com';

export const AITravelPlanner: React.FC = () => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleJump = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const generateAITravelPlan = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiResult('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一位资深的无锡及江南地区旅游专家。
        根据用户输入的路线或需求：'${aiPrompt}'，
        请生成一份详细的旅游攻略。要求：
        1. 包含具体的交通建议和打卡点。
        2. 特别标注出与明星足迹相关的氛围感拍摄地。
        3. 语言风格亲切、专业。
        4. 字数约350字左右。`,
      });
      setAiResult(response.text || '无法生成内容，请稍后再试。');
    } catch (err) {
      console.error(err);
      setAiResult('生成失败，请检查网络连接。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-green-50 shadow-2xl space-y-10">
      <div className="flex flex-col md:flex-row items-center gap-12 border-b border-gray-100 pb-12">
        <div className="w-28 h-28 rounded-[2.5rem] gradient-ningyuzhi flex-shrink-0 flex items-center justify-center text-green-950 shadow-inner">
          <Compass size={48} className="animate-float" />
        </div>
        <div className="flex-grow space-y-4 text-center md:text-left">
          <h3 className="text-3xl font-black text-gray-950">AI 智能旅程定制</h3>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            输入具体的旅游需求或路线，AI 将为你即刻生成专属的同款浪漫攻略。
          </p>
        </div>
        <button
          onClick={() => handleJump(COMPANY_SITE)}
          className="md:ml-auto px-12 py-5 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg hover:scale-105 transition-transform"
        >
          咨询在线导游
        </button>
      </div>
      <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="例如：从火车站出发，想去梓渝去过的所有古镇，还要看太湖落日..."
            className="flex-grow p-5 rounded-2xl bg-white border-none outline-none focus:ring-4 focus:ring-green-100 font-medium shadow-sm"
            onKeyDown={(e) => e.key === 'Enter' && generateAITravelPlan()}
          />
          <button
            onClick={generateAITravelPlan}
            disabled={isGenerating || !aiPrompt.trim()}
            className="px-10 py-5 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Sparkles size={20} />
            )}{' '}
            AI 定制生成
          </button>
        </div>
        {aiResult && (
          <div className="bg-white p-8 rounded-[2rem] border border-green-100 shadow-inner animate-fadeIn">
            <div className="flex items-center gap-2 text-green-700 font-black mb-4">
              <Sparkles size={18} /> 专属定制攻略：
            </div>
            <div className="prose prose-green max-w-none text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
              {aiResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
