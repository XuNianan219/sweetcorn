
import React, { useState } from 'react';
import { MapPin, Navigation, Compass, ArrowRight, ExternalLink, Sparkles, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const Tourism: React.FC = () => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * ⚠️ 管理员配置区域：在此替换为真实的官网或地图坐标 URL
   */
  const EXTERNAL_CONFIG = {
    COMPANY_SITE: "https://www.example-tourism-official.com", 
    CITIES: {
      WUXI: "https://www.google.com/maps/search/无锡+热门景点",
      SUZHOU: "https://www.google.com/maps/search/苏州+热门景点",
    },
    SPOTS: {
      WUXI_HUISHAN: "https://www.google.com/maps/search/无锡+惠山古镇",
      WUXI_TAIHU: "https://www.google.com/maps/search/无锡+太湖鼋头渚",
      WUXI_NIANHUA: "https://www.google.com/maps/search/无锡+拈花湾",
      SUZHOU_PINGJIANG: "https://www.google.com/maps/search/苏州+平江路",
      SUZHOU_ZHUOZHENG: "https://www.google.com/maps/search/苏州+拙政园",
      SUZHOU_JINJI: "https://www.google.com/maps/search/苏州+金鸡湖",
    }
  };

  const routes = [
    { 
      id: '1', 
      city: '无锡', 
      cityMap: EXTERNAL_CONFIG.CITIES.WUXI,
      highlights: [
        { name: '惠山古镇', url: EXTERNAL_CONFIG.SPOTS.WUXI_HUISHAN },
        { name: '太湖鼋头渚', url: EXTERNAL_CONFIG.SPOTS.WUXI_TAIHU },
        { name: '拈花湾', url: EXTERNAL_CONFIG.SPOTS.WUXI_NIANHUA }
      ], 
      image: 'https://picsum.photos/seed/wuxi/1200/600' 
    },
    { 
      id: '2', 
      city: '苏州', 
      cityMap: EXTERNAL_CONFIG.CITIES.SUZHOU,
      highlights: [
        { name: '平江路', url: EXTERNAL_CONFIG.SPOTS.SUZHOU_PINGJIANG },
        { name: '拙政园', url: EXTERNAL_CONFIG.SPOTS.SUZHOU_ZHUOZHENG },
        { name: '金鸡湖', url: EXTERNAL_CONFIG.SPOTS.SUZHOU_JINJI }
      ], 
      image: 'https://picsum.photos/seed/suzhou/1200/600' 
    },
  ];

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
        model: "gemini-3-flash-preview",
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
    <div className="space-y-16 pb-20 animate-fadeIn">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-5xl font-black text-green-950 leading-tight">旅游推荐 · 循迹甜蜜</h1>
        <p className="text-gray-500 text-lg font-medium leading-relaxed italic">
          作为“无锡文旅大使”，梓渝曾在这里留下许多动人足迹。点击下方路线亮点或城市标签，即可开启导航。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {routes.map(route => (
          <div key={route.id} className="group bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
            <div className="relative h-80 overflow-hidden">
              <img src={route.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={route.city} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button onClick={() => handleJump(route.cityMap)} className="absolute top-6 left-6 flex items-center gap-2 text-xs font-black bg-white text-green-950 px-5 py-2.5 rounded-full shadow-2xl hover:scale-110 transition-transform"><MapPin size={14} className="text-green-600" /> {route.city} (城市全景图)</button>
              <div className="absolute bottom-8 left-8 text-white"><h3 className="text-3xl font-black">{route.city}篇 · 路线推荐</h3></div>
            </div>
            <div className="p-10 flex-grow space-y-10">
              <div className="space-y-6">
                <h4 className="font-black text-gray-900 flex items-center gap-3 uppercase tracking-widest text-sm"><Navigation size={18} className="text-green-600" /> 推荐导航点</h4>
                <div className="flex flex-wrap gap-4">
                  {route.highlights.map(h => (
                    <button key={h.name} onClick={() => handleJump(h.url)} className="px-6 py-3 bg-green-50 text-green-700 rounded-2xl text-sm font-black border border-green-100 hover:bg-green-100 transition-all flex items-center gap-2 active:scale-95">{h.name} <ExternalLink size={12} /></button>
                  ))}
                </div>
              </div>
              <div className="pt-8 border-t border-gray-50">
                <button onClick={() => handleJump(EXTERNAL_CONFIG.COMPANY_SITE)} className="w-full py-6 bg-gray-950 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl group/btn"><Compass size={22} className="group-hover/btn:rotate-180 transition-transform duration-700" /> 进入公司官网查看完整攻略 <ArrowRight size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-green-50 shadow-2xl space-y-10">
        <div className="flex flex-col md:flex-row items-center gap-12 border-b border-gray-100 pb-12">
          <div className="w-28 h-28 rounded-[2.5rem] gradient-ningyuzhi flex-shrink-0 flex items-center justify-center text-green-950 shadow-inner"><Compass size={48} className="animate-float" /></div>
          <div className="flex-grow space-y-4 text-center md:text-left">
            <h3 className="text-3xl font-black text-gray-950">AI 智能旅程定制</h3>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              输入具体的旅游需求或路线，AI 将为你即刻生成专属的同款浪漫攻略。
            </p>
          </div>
          <button onClick={() => handleJump(EXTERNAL_CONFIG.COMPANY_SITE)} className="md:ml-auto px-12 py-5 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg hover:scale-105 transition-transform">咨询在线导游</button>
        </div>
        <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="例如：从火车站出发，想去梓渝去过的所有古镇，还要看太湖落日..." className="flex-grow p-5 rounded-2xl bg-white border-none outline-none focus:ring-4 focus:ring-green-100 font-medium shadow-sm" onKeyDown={(e) => e.key === 'Enter' && generateAITravelPlan()} />
            <button onClick={generateAITravelPlan} disabled={isGenerating || !aiPrompt.trim()} className="px-10 py-5 gradient-ningyuzhi text-green-950 font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} AI 定制生成
            </button>
          </div>
          {aiResult && (
            <div className="bg-white p-8 rounded-[2rem] border border-green-100 shadow-inner animate-fadeIn">
              <div className="flex items-center gap-2 text-green-700 font-black mb-4"><Sparkles size={18} /> 专属定制攻略：</div>
              <div className="prose prose-green max-w-none text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{aiResult}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
