import React from 'react';
import { 
  Star, Shield, Award, Music, Film, Mic2, Briefcase, 
  Heart, Calendar, MapPin, TrendingUp, Globe, Sparkles,
  ExternalLink, UserCheck, Ruler, Camera, Flame
} from 'lucide-react';

export const CelebB: React.FC = () => {
  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      {/* 1. Hero Header Section */}
      <div className="gradient-tian min-h-[550px] rounded-[3.5rem] p-12 flex items-end shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-6 text-gray-900">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/50">
              <Sparkles size={16} className="text-yellow-600" />
              <span className="text-xs font-black tracking-widest uppercase">华策影视 · 实力跨界</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black drop-shadow-sm">田栩宁 <span className="text-3xl font-medium tracking-normal opacity-60">Xuning</span></h1>
            <p className="text-gray-800 text-xl font-medium tracking-widest flex items-center gap-4">
              <span className="flex items-center gap-1"><Calendar size={20}/> 1997.09.19</span>
              <span className="flex items-center gap-1"><MapPin size={20}/> 山东济宁</span>
              <span className="flex items-center gap-1"><Ruler size={20}/> 188cm</span>
            </p>
          </div>
          <div className="text-right text-gray-500 text-sm font-medium italic">
            "栩光金星 · 温暖绽放，步履不停"
          </div>
        </div>
        <img 
          src="https://picsum.photos/seed/tian_main/1200/800" 
          className="absolute inset-0 w-full h-full object-cover -z-10 opacity-60 group-hover:scale-105 transition-transform duration-1000"
          alt="田栩宁 Profile"
        />
      </div>

      {/* 2. Fast Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Film, label: '核心身份', value: '实力派演员', color: 'text-yellow-600' },
          { icon: Flame, label: '人气暴涨', value: '单周涨粉99万+', color: 'text-red-600' },
          { icon: Award, label: '主流认可', value: '央视《六姊妹》', color: 'text-blue-600' },
          { icon: TrendingUp, label: '商业价值', value: '首日破3000万', color: 'text-orange-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-sm font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 3. Detailed Bio & Milestones */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-50">
            <h2 className="text-2xl font-black text-[#FFD64F] mb-8 flex items-center gap-3">
              <Star className="fill-current" /> 演艺蜕变 · Journey
            </h2>
            <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-yellow-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-yellow-600" /></div>
                <h4 className="font-black text-gray-900">2020-2021 | 逐梦起航，进军银幕</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  签约华策影视，告别“雷霸天”时期。参演《我的百岁恋人》正式出道，随后以《今天也晴朗》谢迟一角开启主演之路。
                </p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-orange-600" /></div>
                <h4 className="font-black text-gray-900">2022-2024 | 打磨演技，破圈而行</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  主演《初次爱你》孟西白一角圈粉无数。连续输出《甜甜的陷阱》《天赐小红娘》等多部爆款短长剧，参与《大侦探8》尽显真诚魅力。
                </p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-red-600" /></div>
                <h4 className="font-black text-gray-900">2025-2026 | 全面爆发，实力进阶</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  出演央视剧《六姊妹》。主演《逆爱》池骋一角实现人气现象级跃升，个人首单《光焰》上线。2026年新作《七月的一天》万天奇待播。
                </p>
              </div>
            </div>
          </section>

          {/* 4. Representative Works Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 px-4">代表作品 · Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <Film size={24} />
                  <h3 className="font-black text-xl">影视代表</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center group">
                    <span className="text-sm font-bold text-gray-700">《逆爱》 <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded ml-2">爆款 · 池骋</span></span>
                    <button className="text-gray-300 group-hover:text-orange-500 transition-colors"><ExternalLink size={14}/></button>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《六姊妹》 <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded ml-2">央视剧 · 何常胜</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《初次爱你》 <span className="text-[10px] text-gray-400 font-normal ml-2">饰 孟西白</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《甜甜的陷阱》 / 《哑妻》</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-yellow-600">
                  <Calendar size={24} />
                  <h3 className="font-black text-xl">2026 待播/音乐</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《七月的一天》 <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded ml-2">饰 万天奇</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《光焰》 <span className="text-[10px] text-gray-400 font-normal ml-2">个人首支单曲</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《白日梦与她》 <span className="text-[10px] text-gray-400 font-normal ml-2">饰 孔尔诺</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《大侦探第八季》 <span className="text-[10px] text-gray-400 font-normal ml-2">年度常驻</span></span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* 5. Sidebar: Commercial, Business & Honors */}
        <div className="space-y-10">
          {/* 商业价值 */}
          <div className="bg-[#FFD64F]/5 rounded-[3rem] p-8 border border-[#FFD64F]/10 space-y-8">
            <h3 className="font-black text-yellow-700 flex items-center gap-2">
              <Briefcase size={20} /> 商务代言 & 战绩
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase">核心品牌合作</p>
                <div className="flex flex-wrap gap-2">
                  {['韩束品牌代言人', '希思黎发质大使', '黛珂品牌挚友', '高梵黑金鹅绒服'].map(brand => (
                    <span key={brand} className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-yellow-100 text-yellow-700">{brand}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-yellow-100">
                <p className="text-xs font-black text-gray-400 uppercase">商业爆发力</p>
                <div className="bg-white/60 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-black text-gray-700">派丽蒙眼镜 <span className="text-[10px] font-black text-red-500 ml-2">首日破3000万</span></p>
                  <p className="text-xs font-black text-gray-700">吃饱穿暖组合 <span className="text-[10px] font-normal opacity-60 ml-2">× 汉堡王有趣话题</span></p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 个人标签 */}
          <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Shield size={20} className="text-yellow-500 fill-yellow-500" /> 核心亮点
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0 text-yellow-600"><Ruler size={16}/></div>
                <p className="text-sm font-black text-gray-700">188cm 优越身形 · 气质多变</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600"><Flame size={16}/></div>
                <p className="text-sm font-black text-gray-700">逆袭成长 · 从网红到实力小生</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600"><Camera size={16}/></div>
                <p className="text-sm font-black text-gray-700">剧宣小能手 · 职业素养获赞</p>
              </div>
            </div>
          </div>

          {/* 公益足迹 */}
          <div className="bg-red-50/50 rounded-[3rem] p-8 border border-red-100 space-y-6">
            <h3 className="font-black text-red-600 flex items-center gap-2">
              <Heart size={20} className="fill-current" /> 正能量行动
            </h3>
            <ul className="space-y-3">
              <li className="text-xs font-bold text-red-700 flex items-center gap-2">• 2025年捐赠30万元助力火灾救援</li>
              <li className="text-xs font-bold text-red-700 flex items-center gap-2">• 韩红基金会深度合作伙伴</li>
              <li className="text-[10px] text-red-500 leading-relaxed italic">低调真诚，用行动践行演员初心</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer Quote */}
      <div className="bg-gray-900 rounded-[4rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-center gap-10">
        <div className="text-center space-y-4 relative z-10">
          <p className="text-2xl font-black italic">"不断完善自己，提升业务能力，是对作品最好的交代。"</p>
          <p className="text-yellow-400 font-medium tracking-widest uppercase text-sm">— 田栩宁 · 演员感言</p>
        </div>
        {/* Decorative background glow */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-yellow-600/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};
