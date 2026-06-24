import React from 'react';
import { 
  Star, Shield, Award, Music, Film, Mic2, Briefcase, 
  Heart, Calendar, MapPin, TrendingUp, Globe, Sparkles,
  ExternalLink, UserCheck, Ruler, Camera, Flame
} from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';

export const CelebB: React.FC = () => {
  const { t } = useLang();
  return (
    <div className="space-y-12 animate-fadeIn pb-20">
      {/* 1. Hero Header Section */}
      <div className="gradient-tian min-h-[550px] rounded-[3.5rem] p-12 flex items-end shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-6 text-gray-900">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/50">
              <Sparkles size={16} className="text-yellow-600" />
              <span className="text-xs font-black tracking-widest uppercase">{t('华策影视 · 实力跨界', 'Huace Film & TV · Versatile')}</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black drop-shadow-sm">{t('田栩宁', 'Tianxuning')} <span className="text-3xl font-medium tracking-normal opacity-60">Xuning</span></h1>
            <p className="text-gray-800 text-xl font-medium tracking-widest flex items-center gap-4">
              <span className="flex items-center gap-1"><Calendar size={20}/> 1997.09.19</span>
              <span className="flex items-center gap-1"><MapPin size={20}/> {t('山东济宁', 'Jining, Shandong')}</span>
              <span className="flex items-center gap-1"><Ruler size={20}/> 188cm</span>
            </p>
          </div>
          <div className="text-right text-gray-500 text-sm font-medium italic">
            {t('"栩光金星 · 温暖绽放，步履不停"', '"Golden warmth in bloom, always moving forward"')}
          </div>
        </div>
        <img 
          src="https://picsum.photos/seed/tian_main/1200/800" 
          className="absolute inset-0 w-full h-full object-cover -z-10 opacity-60 group-hover:scale-105 transition-transform duration-1000"
          alt="Tianxuning Profile"
        />
      </div>

      {/* 2. Fast Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Film, label: t('核心身份', 'Core identity'), value: t('实力派演员', 'Acclaimed actor'), color: 'text-yellow-600' },
          { icon: Flame, label: t('人气暴涨', 'Surging fame'), value: t('单周涨粉99万+', '+990K fans in a week'), color: 'text-red-600' },
          { icon: Award, label: t('主流认可', 'Mainstream acclaim'), value: t('央视《六姊妹》', 'CCTV "Six Sisters"'), color: 'text-blue-600' },
          { icon: TrendingUp, label: t('商业价值', 'Commercial value'), value: t('首日破3000万', '¥30M+ day one'), color: 'text-orange-600' },
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
              <Star className="fill-current" /> {t('演艺蜕变', 'Journey')} · Journey
            </h2>
            <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-yellow-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-yellow-600" /></div>
                <h4 className="font-black text-gray-900">{t('2020-2021 | 逐梦起航，进军银幕', '2020-2021 | Chasing the dream, entering the screen')}</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {t('签约华策影视，告别“雷霸天”时期。参演《我的百岁恋人》正式出道，随后以《今天也晴朗》谢迟一角开启主演之路。', 'Signed with Huace Film & TV and left his earlier internet era behind. Debuted in "My Centenarian Lover," then took his first lead as Xie Chi in "Sunny Again Today."')}
                </p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-orange-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-orange-600" /></div>
                <h4 className="font-black text-gray-900">{t('2022-2024 | 打磨演技，破圈而行', '2022-2024 | Honing his craft, breaking through')}</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {t('主演《初次爱你》孟西白一角圈粉无数。连续输出《甜甜的陷阱》《天赐小红娘》等多部爆款短长剧，参与《大侦探8》尽显真诚魅力。', 'His role as Meng Xibai in "Loving You First" won many fans. He starred in a string of hit dramas such as "Sweet Trap" and "Heaven-Sent Matchmaker," and showed his sincere charm on "Detective 8."')}
                </p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-100 border-4 border-white shadow-sm flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-red-600" /></div>
                <h4 className="font-black text-gray-900">{t('2025-2026 | 全面爆发，实力进阶', '2025-2026 | Full breakout, leveling up')}</h4>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {t('出演央视剧《六姊妹》。主演《逆爱》池骋一角实现人气现象级跃升，个人首单《光焰》上线。2026年新作《七月的一天》万天奇待播。', 'Appeared in CCTV drama "Six Sisters." His role as Chi Cheng in "Reverse Love" sparked a phenomenal rise in popularity, and his debut single "Flame" was released. His 2026 work "A Day in July" is upcoming.')}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Representative Works Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 px-4">{t('代表作品', 'Works')} · Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-orange-600">
                  <Film size={24} />
                  <h3 className="font-black text-xl">{t('影视代表', 'Film & TV')}</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center group">
                    <span className="text-sm font-bold text-gray-700">{t('《逆爱》', '"Reverse Love"')} <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded ml-2">{t('爆款 · 池骋', 'Hit · Chi Cheng')}</span></span>
                    <button className="text-gray-300 group-hover:text-orange-500 transition-colors"><ExternalLink size={14}/></button>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《六姊妹》', '"Six Sisters"')} <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded ml-2">{t('央视剧 · 何常胜', 'CCTV · He Changsheng')}</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《初次爱你》', '"Loving You First"')} <span className="text-[10px] text-gray-400 font-normal ml-2">{t('饰 孟西白', 'as Meng Xibai')}</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《甜甜的陷阱》 / 《哑妻》', '"Sweet Trap" / "Mute Wife"')}</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center gap-3 text-yellow-600">
                  <Calendar size={24} />
                  <h3 className="font-black text-xl">{t('2026 待播/音乐', '2026 Upcoming / Music')}</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《七月的一天》', '"A Day in July"')} <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded ml-2">{t('饰 万天奇', 'as Wan Tianqi')}</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《光焰》', '"Flame"')} <span className="text-[10px] text-gray-400 font-normal ml-2">{t('个人首支单曲', 'Debut single')}</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《白日梦与她》', '"Daydream and Her"')} <span className="text-[10px] text-gray-400 font-normal ml-2">{t('饰 孔尔诺', 'as Kong Ernuo')}</span></span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700">{t('《大侦探第八季》', '"Detective Season 8"')} <span className="text-[10px] text-gray-400 font-normal ml-2">{t('年度常驻', 'Regular cast')}</span></span>
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
              <Briefcase size={20} /> {t('商务代言 & 战绩', 'Endorsements & Results')}
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase">{t('核心品牌合作', 'Key brand deals')}</p>
                <div className="flex flex-wrap gap-2">
                  {[t('韩束品牌代言人', 'KANS spokesperson'), t('希思黎发质大使', 'Sisley hair ambassador'), t('黛珂品牌挚友', 'Cosme Decorte friend'), t('高梵黑金鹅绒服', 'GOLDFINE down jackets')].map(brand => (
                    <span key={brand} className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-yellow-100 text-yellow-700">{brand}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-yellow-100">
                <p className="text-xs font-black text-gray-400 uppercase">{t('商业爆发力', 'Commercial impact')}</p>
                <div className="bg-white/60 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-black text-gray-700">{t('派丽蒙眼镜', 'Parim Eyewear')} <span className="text-[10px] font-black text-red-500 ml-2">{t('首日破3000万', '¥30M+ day one')}</span></p>
                  <p className="text-xs font-black text-gray-700">{t('吃饱穿暖组合', '"Fed & Warm" duo')} <span className="text-[10px] font-normal opacity-60 ml-2">{t('× 汉堡王有趣话题', '× Burger King fun topic')}</span></p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 个人标签 */}
          <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Shield size={20} className="text-yellow-500 fill-yellow-500" /> {t('核心亮点', 'Highlights')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0 text-yellow-600"><Ruler size={16}/></div>
                <p className="text-sm font-black text-gray-700">{t('188cm 优越身形 · 气质多变', '188cm tall · versatile presence')}</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600"><Flame size={16}/></div>
                <p className="text-sm font-black text-gray-700">{t('逆袭成长 · 从网红到实力小生', 'Comeback story · from influencer to acclaimed actor')}</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600"><Camera size={16}/></div>
                <p className="text-sm font-black text-gray-700">{t('剧宣小能手 · 职业素养获赞', 'Great at promo · praised professionalism')}</p>
              </div>
            </div>
          </div>

          {/* 公益足迹 */}
          <div className="bg-red-50/50 rounded-[3rem] p-8 border border-red-100 space-y-6">
            <h3 className="font-black text-red-600 flex items-center gap-2">
              <Heart size={20} className="fill-current" /> {t('正能量行动', 'Positive Actions')}
            </h3>
            <ul className="space-y-3">
              <li className="text-xs font-bold text-red-700 flex items-center gap-2">{t('• 2025年捐赠30万元助力火灾救援', '• Donated ¥300K to fire relief in 2025')}</li>
              <li className="text-xs font-bold text-red-700 flex items-center gap-2">{t('• 韩红基金会深度合作伙伴', '• Close partner of the Han Hong Foundation')}</li>
              <li className="text-[10px] text-red-500 leading-relaxed italic">{t('低调真诚，用行动践行演员初心', 'Humble and sincere, living his ideals as an actor through action')}</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer Quote */}
      <div className="bg-gray-900 rounded-[4rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-center gap-10">
        <div className="text-center space-y-4 relative z-10">
          <p className="text-2xl font-black italic">{t('"不断完善自己，提升业务能力，是对作品最好的交代。"', '"Constantly improving yourself and your craft is the best answer to the work."')}</p>
          <p className="text-yellow-400 font-medium tracking-widest uppercase text-sm">{t('— 田栩宁 · 演员感言', '— Tianxuning · Actor’s note')}</p>
        </div>
        {/* Decorative background glow */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-yellow-600/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};
