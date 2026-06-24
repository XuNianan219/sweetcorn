import React, { useEffect, useState } from 'react';
import { Play, MapPin, Clock, Tag, Camera } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { getExperiences } from '../../services/travelService';
import { useAutoTranslate } from '../../hooks/useAutoTranslate';

interface Experience {
  id: number;
  dbId?: string; // 来自数据库的官方体验才有；样例无
  celebrity: string;
  celebrityEn: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  location: string;
  locationEn: string;
  duration: string;
  durationEn: string;
  description: string;
  descriptionEn: string;
  coverImage: string;
}

const CELEBRITY_EXPERIENCES: Experience[] = [
  {
    id: 1,
    celebrity: '梓渝', celebrityEn: 'Ziyu',
    title: '苏州缂丝体验', titleEn: 'Suzhou Kesi Silk Weaving',
    category: '非遗·手工', categoryEn: 'Heritage · Craft',
    location: '苏州吴中区', locationEn: 'Wuzhong, Suzhou',
    duration: '半日', durationEn: 'Half day',
    description: '梓渝在《XX 综艺》中学习缂丝的地方，国家级非遗传承人亲自指导。', descriptionEn: 'Where Ziyu learned kesi weaving on a variety show, taught by a national heritage master.',
    coverImage: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600',
  },
  {
    id: 2,
    celebrity: '田栩宁', celebrityEn: 'Tianxuning',
    title: '成都古琴雅集', titleEn: 'Chengdu Guqin Gathering',
    category: '非遗·音乐', categoryEn: 'Heritage · Music',
    location: '成都青城山', locationEn: 'Mt. Qingcheng, Chengdu',
    duration: '2 小时', durationEn: '2 hours',
    description: '田栩宁曾在此录制古琴曲，山间古琴馆对外开放体验课程。', descriptionEn: 'Where Tianxuning once recorded guqin music; the mountain hall offers open classes.',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
  },
  {
    id: 3,
    celebrity: '梓渝', celebrityEn: 'Ziyu',
    title: '景德镇陶瓷工坊', titleEn: 'Jingdezhen Ceramics Workshop',
    category: '非遗·陶艺', categoryEn: 'Heritage · Ceramics',
    location: '江西景德镇', locationEn: 'Jingdezhen, Jiangxi',
    duration: '一日', durationEn: 'One day',
    description: '梓渝曾在此体验拉坯、绘瓷全过程，工坊为粉丝开放同款课程。', descriptionEn: 'Where Ziyu tried throwing and painting porcelain; the workshop opens the same class to fans.',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
  },
  {
    id: 4,
    celebrity: '田栩宁', celebrityEn: 'Tianxuning',
    title: '上海咖啡店打卡', titleEn: 'Shanghai Café Visit',
    category: '生活方式', categoryEn: 'Lifestyle',
    location: '上海静安区', locationEn: 'Jing’an, Shanghai',
    duration: '1 小时', durationEn: '1 hour',
    description: '田栩宁私服街拍中出现的小众咖啡馆，隐藏在老洋房里。', descriptionEn: 'A niche café seen in Tianxuning’s street snaps, tucked inside an old villa.',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
  },
  {
    id: 5,
    celebrity: '梓渝', celebrityEn: 'Ziyu',
    title: '杭州茶艺课堂', titleEn: 'Hangzhou Tea Art Class',
    category: '非遗·茶艺', categoryEn: 'Heritage · Tea',
    location: '杭州龙井村', locationEn: 'Longjing Village, Hangzhou',
    duration: '半日', durationEn: 'Half day',
    description: '梓渝在此学过龙井茶的采摘与炒制，茶农对粉丝开放体验。', descriptionEn: 'Where Ziyu learned to pick and roast Longjing tea; growers welcome fans.',
    coverImage: 'https://images.unsplash.com/photo-1528818618467-6f27b7f33ecb?w=600',
  },
  {
    id: 6,
    celebrity: '田栩宁', celebrityEn: 'Tianxuning',
    title: '北京故宫文创', titleEn: 'Beijing Palace Museum Crafts',
    category: '文化场所', categoryEn: 'Cultural site',
    location: '北京故宫', locationEn: 'Forbidden City, Beijing',
    duration: '一日', durationEn: 'One day',
    description: '田栩宁综艺中的故宫打卡路线，含文创店推荐与摄影机位。', descriptionEn: 'Tianxuning’s Forbidden City route from a show, with craft-shop picks and photo spots.',
    coverImage: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600',
  },
  {
    id: 7,
    celebrity: '梓渝', celebrityEn: 'Ziyu',
    title: '西安皮影戏馆', titleEn: 'Xi’an Shadow Puppet Hall',
    category: '非遗·表演', categoryEn: 'Heritage · Performance',
    location: '陕西西安', locationEn: 'Xi’an, Shaanxi',
    duration: '2 小时', durationEn: '2 hours',
    description: '梓渝体验过的皮影戏，可观赏演出并亲自操作皮影人偶。', descriptionEn: 'The shadow play Ziyu tried — watch a show and work the puppets yourself.',
    coverImage: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600',
  },
  {
    id: 8,
    celebrity: '田栩宁', celebrityEn: 'Tianxuning',
    title: '大理扎染工坊', titleEn: 'Dali Tie-Dye Workshop',
    category: '非遗·染织', categoryEn: 'Heritage · Dyeing',
    location: '云南大理', locationEn: 'Dali, Yunnan',
    duration: '半日', durationEn: 'Half day',
    description: '田栩宁去过的白族扎染工坊，可亲手制作扎染作品带回家。', descriptionEn: 'The Bai tie-dye workshop Tianxuning visited — make your own piece to take home.',
    coverImage: 'https://images.unsplash.com/photo-1533086723868-6395af5ea754?w=600',
  },
];

export const CelebrityExperiences: React.FC = () => {
  const { t } = useLang();

  // 优先读取超管发布的官方体验；为空时回退到内置样例，保证页面不空白
  const [items, setItems] = useState<Experience[]>(CELEBRITY_EXPERIENCES);
  useEffect(() => {
    let cancelled = false;
    getExperiences()
      .then((rows) => {
        if (cancelled || rows.length === 0) return;
        setItems(
          rows.map((r, i) => ({
            id: i + 1,
            dbId: r.id,
            celebrity: r.celebrity, celebrityEn: r.celebrity,
            title: r.title, titleEn: r.title,
            category: r.category, categoryEn: r.category,
            location: r.location, locationEn: r.location,
            duration: r.duration, durationEn: r.duration,
            description: r.description, descriptionEn: r.description,
            coverImage: r.coverImage,
          })),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-green-950 flex items-center gap-2">
          <Camera size={24} className="text-green-600" /> {t('明星文化体验', 'Celebrity Culture Experiences')}
        </h2>
        <p className="text-sm text-gray-500 font-medium">{t('跟着偶像，走进真实的中国', 'Follow your idols into the real China')}</p>
      </div>

      <div className="-mx-4 px-4 overflow-x-auto scroll-smooth snap-x snap-mandatory">
        <div className="flex gap-5 pb-4">
          {items.map((exp) => (
            <ExperienceCard key={exp.id} exp={exp} />
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 font-medium pt-1">{t('更多体验陆续上线', 'More experiences coming soon')}</div>
    </section>
  );
};

// 单张体验卡片：官方（有 dbId）走数据库译文缓存；样例用内置中英文案
const ExperienceCard: React.FC<{ exp: Experience }> = ({ exp }) => {
  const { t } = useLang();
  const isDb = !!exp.dbId;
  const tr = useAutoTranslate('travelExperience', exp.dbId, {
    title: exp.title,
    category: exp.category,
    location: exp.location,
    description: exp.description,
  });

  // 官方内容用译文缓存；样例用硬编码 en。人名/时长不翻译（统一走 t，DB 项 en=zh 即原样）
  const title = isDb ? tr.title : t(exp.title, exp.titleEn);
  const category = isDb ? tr.category : t(exp.category, exp.categoryEn);
  const location = isDb ? tr.location : t(exp.location, exp.locationEn);
  const description = isDb ? tr.description : t(exp.description, exp.descriptionEn);
  const celebrity = t(exp.celebrity, exp.celebrityEn);
  const duration = t(exp.duration, exp.durationEn);

  const handleVlog = () => console.log('[travel] 观看 Vlog（即将上线）:', exp.title);
  const handleDetail = () => console.log('[travel] 查看体验（即将上线）:', exp.title);

  return (
    <article className="snap-start flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-3xl border border-green-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-green-50 overflow-hidden">
        <img src={exp.coverImage} alt={title} loading="lazy" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={handleVlog}
          aria-label={t('播放 Vlog', 'Play Vlog')}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-green-700 shadow-sm hover:scale-110 transition-transform"
        >
          <Play size={16} className="fill-current" />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-grow space-y-3">
        <div className="text-xs font-black text-green-700 tracking-wide">{celebrity}</div>
        <h3 className="text-lg font-black text-gray-900 leading-snug">{title}</h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 font-medium">
          <span className="flex items-center gap-1">
            <Tag size={11} className="text-green-600" />
            {category}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-green-600" />
            {location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-green-600" />
            {duration}
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-grow">{description}</p>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button type="button" onClick={handleVlog} className="py-2 text-xs font-black text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
            {t('观看 Vlog', 'Watch Vlog')}
          </button>
          <button type="button" onClick={handleDetail} className="py-2 text-xs font-black text-green-950 gradient-ningyuzhi hover:scale-[1.02] rounded-xl transition-transform">
            {t('查看体验', 'View experience')}
          </button>
        </div>
      </div>
    </article>
  );
};
