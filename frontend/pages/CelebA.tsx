import React from 'react';
import { 
  Star, Shield, Award, Music, Film, Mic2, Briefcase, 
  Heart, Calendar, MapPin, TrendingUp, Globe, Sparkles,
  ExternalLink, UserCheck
} from 'lucide-react';

export const CelebA: React.FC = () => {
  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      {/* 1. Hero Header Section */}
      <div className="gradient-ziyu min-h-[550px] rounded-[3.5rem] p-12 flex items-end shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/30">
              <Sparkles size={16} className="text-yellow-200" />
              <span className="text-white text-xs font-black tracking-widest uppercase">极速小鱼</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black text-white drop-shadow-2xl">梓渝 <span className="text-3xl font-medium tracking-normal opacity-80">Ziyu</span></h1>
            <p className="text-white/90 text-xl font-medium tracking-widest flex items-center gap-4">
              <span className="flex items-center gap-1"><Calendar size={20}/> 2002.07.06</span>
              <span className="flex items-center gap-1"><MapPin size={20}/> 江苏连云港</span>
            </p>
          </div>
          <div className="text-right text-white/60 text-sm font-medium italic">
            "星渝色 · 幻海逐梦，天光破晓"
          </div>
        </div>
        <img 
          src="https://picsum.photos/seed/ziyu_main/1200/800" 
          className="absolute inset-0 w-full h-full object-cover -z-10 mix-blend-overlay opacity-50 group-hover:scale-105 transition-transform duration-1000"
          alt="梓渝 Profile"
        />
      </div>

      {/* 2. Fast Stats Grid - Removed Group Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Mic2, label: '核心身份', value: '歌手 / 演员', color: 'text-purple-600' },
          { icon: Globe, label: '全球面孔', value: 'TC Candler 第28位', color: 'text-indigo-600' },
          { icon: TrendingUp, label: '音乐战力', value: '单曲播放量破亿', color: 'text-pink-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 3. Detailed Bio & Milestones */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-50">
            <h2 className="text-2xl font-black text-[#7A67EE] mb-8 flex items-center gap-3">
              <Star className="fill-current" /> 演艺历程 · Milestones
            </h2>
            <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-purple-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-purple-600" /></div>
                <h4 className="font-black text-gray-900">2020-2021 | 少年集结，初心启程</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  综艺《少年之名》初露锋芒，随后在《青春有你第三季》中凭借极具个人风格的表现积累了深厚的粉丝基础，展现出坚韧且纯粹的艺术态度。
                </p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-600" /></div>
                <h4 className="font-black text-gray-900">2023-2024 | 影视跨界，多向生长</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  参演《将军在下》《段秘书为何那样呢》等精品短剧。在此期间，个人舞台魅力在各大盛典中不断深化，奠定影视音乐双栖基础。
                </p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-indigo-600" /></div>
                <h4 className="font-black text-gray-900">2025-2026 | 全面爆发，巅峰跨越</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  主演《逆爱》吴所畏一角凭原声大火。单曲《泥潭》网易云播放破亿。2026年获微博之夜年度星光人物。首部电影《为我的心动买单》定档520。个人巡演“游点意思”多城秒空收官。
                </p>
              </div>
            </div>
          </section>

          {/* 4. Representative Works Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 px-4">代表作品 · Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-purple-600">
                  <Music size={24} />
                  <h3 className="font-black text-xl">音乐作品</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center group">
                    <span className="text-sm font-bold text-gray-700">《泥潭》 <span className="text-[10px] text-pink-500 bg-pink-50 px-2 py-0.5 rounded ml-2">破亿神曲</span></span>
                    <button className="text-gray-300 group-hover:text-purple-500 transition-colors"><ExternalLink size={14}/></button>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《下一页》 <span className="text-[10px] text-gray-400 font-normal ml-2">微博网友喜爱奖</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《萤火星球》</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-blue-600">
                  <Film size={24} />
                  <h3 className="font-black text-xl">影视作品</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《为我的心动买单》 <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded ml-2">电影 · 520定档</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《逆爱》 <span className="text-[10px] text-gray-400 font-normal ml-2">饰 吴所畏</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《三嫁魔君》</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">《将军在下》 / 《段秘书》</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* 5. Sidebar: Commercial, Business & Honors */}
        <div className="space-y-10">
          {/* 商业版图 */}
          <div className="bg-[#7A67EE]/5 rounded-[3rem] p-8 border border-[#7A67EE]/10 space-y-8">
            <h3 className="font-black text-[#7A67EE] flex items-center gap-2">
              <Briefcase size={20} /> 商业代言 & 事业
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase">品牌代言</p>
                <div className="flex flex-wrap gap-2">
                  {['李子园 VitaYoung', '鸭鸭品牌代言', 'GISMOW 全球代言', 'QQ音乐20周年大使'].map(brand => (
                    <span key={brand} className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-purple-100 text-purple-700">{brand}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-purple-100">
                <p className="text-xs font-black text-gray-400 uppercase">事业版图 (BOSS ZIYU)</p>
                <div className="bg-white/60 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-black text-gray-700">北京瑞鹤文化传媒 <span className="text-[10px] font-normal opacity-60">法定代表人</span></p>
                  <p className="text-xs font-black text-gray-700">北京极速小鱼文化工作室 <span className="text-[10px] font-normal opacity-60">100%持股</span></p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 个人荣誉 */}
          <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Award size={20} className="text-yellow-500 fill-yellow-500" /> 核心荣誉
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0 text-yellow-600"><Award size={16}/></div>
                <p className="text-sm font-black text-gray-700">2026 微博之夜 · 年度星光人物</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600"><Globe size={16}/></div>
                <p className="text-sm font-black text-gray-700">2025 全球百大最美面孔 · 第28位</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600"><Mic2 size={16}/></div>
                <p className="text-sm font-black text-gray-700">年度喜爱演出 · “游”点意思巡演</p>
              </div>
            </div>
          </div>

          {/* 公益足迹 */}
          <div className="bg-red-50/50 rounded-[3rem] p-8 border border-red-100 space-y-6">
            <h3 className="font-black text-red-600 flex items-center gap-2">
              <Heart size={20} className="fill-current" /> 公益大使
            </h3>
            <ul className="space-y-3">
              <li className="text-xs font-bold text-red-700 flex items-center gap-2">• 文明交通宣传大使</li>
              <li className="text-xs font-bold text-red-700 flex items-center gap-2">• “益耳行动”爱心传播大使</li>
              <li className="text-[10px] text-red-500 leading-relaxed italic">曾创作公益单曲并捐款助力听障儿童康复</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 2026 Tour Footer Promo */}
      <div className="bg-gray-900 rounded-[4rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="space-y-4 relative z-10 text-center md:text-left">
          <h2 className="text-4xl font-black">梓渝 “游” 点意思 2026</h2>
          <p className="text-gray-400 font-medium tracking-widest uppercase text-sm">National Concert Tour · 全国巡回演唱会</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
            {['南京站', '贵阳站', '武汉站', '厦门收官站'].map(city => (
              <span key={city} className="px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black border border-white/10">{city} (Sold Out)</span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 relative z-10">
          <div className="bg-white text-gray-900 px-10 py-5 rounded-3xl font-black text-xl shadow-2xl hover:scale-110 transition-transform cursor-pointer">
            回顾精彩现场
          </div>
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};
