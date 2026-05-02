import React from 'react';
import { Play, MapPin, Clock, Tag } from 'lucide-react';

interface Experience {
  id: number;
  celebrity: string;
  title: string;
  category: string;
  location: string;
  duration: string;
  description: string;
  coverImage: string;
}

const CELEBRITY_EXPERIENCES: Experience[] = [
  {
    id: 1,
    celebrity: '梓渝',
    title: '苏州缂丝体验',
    category: '非遗·手工',
    location: '苏州吴中区',
    duration: '半日',
    description: '梓渝在《XX 综艺》中学习缂丝的地方，国家级非遗传承人亲自指导。',
    coverImage: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600',
  },
  {
    id: 2,
    celebrity: '田栩宁',
    title: '成都古琴雅集',
    category: '非遗·音乐',
    location: '成都青城山',
    duration: '2 小时',
    description: '田栩宁曾在此录制古琴曲，山间古琴馆对外开放体验课程。',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
  },
  {
    id: 3,
    celebrity: '梓渝',
    title: '景德镇陶瓷工坊',
    category: '非遗·陶艺',
    location: '江西景德镇',
    duration: '一日',
    description: '梓渝曾在此体验拉坯、绘瓷全过程，工坊为粉丝开放同款课程。',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
  },
  {
    id: 4,
    celebrity: '田栩宁',
    title: '上海咖啡店打卡',
    category: '生活方式',
    location: '上海静安区',
    duration: '1 小时',
    description: '田栩宁私服街拍中出现的小众咖啡馆，隐藏在老洋房里。',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
  },
  {
    id: 5,
    celebrity: '梓渝',
    title: '杭州茶艺课堂',
    category: '非遗·茶艺',
    location: '杭州龙井村',
    duration: '半日',
    description: '梓渝在此学过龙井茶的采摘与炒制，茶农对粉丝开放体验。',
    coverImage: 'https://images.unsplash.com/photo-1528818618467-6f27b7f33ecb?w=600',
  },
  {
    id: 6,
    celebrity: '田栩宁',
    title: '北京故宫文创',
    category: '文化场所',
    location: '北京故宫',
    duration: '一日',
    description: '田栩宁综艺中的故宫打卡路线，含文创店推荐与摄影机位。',
    coverImage: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600',
  },
  {
    id: 7,
    celebrity: '梓渝',
    title: '西安皮影戏馆',
    category: '非遗·表演',
    location: '陕西西安',
    duration: '2 小时',
    description: '梓渝体验过的皮影戏，可观赏演出并亲自操作皮影人偶。',
    coverImage: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600',
  },
  {
    id: 8,
    celebrity: '田栩宁',
    title: '大理扎染工坊',
    category: '非遗·染织',
    location: '云南大理',
    duration: '半日',
    description: '田栩宁去过的白族扎染工坊，可亲手制作扎染作品带回家。',
    coverImage: 'https://images.unsplash.com/photo-1533086723868-6395af5ea754?w=600',
  },
];

export const CelebrityExperiences: React.FC = () => {
  const handleVlog = (exp: Experience) => {
    // TODO: 接入 Vlog 播放
    console.log('[travel] 观看 Vlog（即将上线）:', exp.title);
  };

  const handleDetail = (exp: Experience) => {
    // TODO: 接入体验详情 / 预约下单
    console.log('[travel] 查看体验（即将上线）:', exp.title);
  };

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-green-950">✨ 明星文化体验</h2>
        <p className="text-sm text-gray-500 font-medium">跟着偶像，走进真实的中国</p>
      </div>

      <div className="-mx-4 px-4 overflow-x-auto scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-5 pb-4">
          {CELEBRITY_EXPERIENCES.map((exp) => (
            <article
              key={exp.id}
              className="snap-start flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-3xl border border-green-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-green-50 overflow-hidden">
                <img
                  src={exp.coverImage}
                  alt={exp.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleVlog(exp)}
                  aria-label="播放 Vlog"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-green-700 shadow-sm hover:scale-110 transition-transform"
                >
                  <Play size={16} className="fill-current" />
                </button>
              </div>

              <div className="p-5 flex flex-col flex-grow space-y-3">
                <div className="text-xs font-black text-green-700 tracking-wide">
                  {exp.celebrity}
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-snug">{exp.title}</h3>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag size={11} className="text-green-600" />
                    {exp.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-green-600" />
                    {exp.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-green-600" />
                    {exp.duration}
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-grow">
                  {exp.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleVlog(exp)}
                    className="py-2 text-xs font-black text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                  >
                    观看 Vlog
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDetail(exp)}
                    className="py-2 text-xs font-black text-green-950 gradient-ningyuzhi hover:scale-[1.02] rounded-xl transition-transform"
                  >
                    查看体验
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 font-medium pt-1">更多体验陆续上线</div>
    </section>
  );
};
