
import { VideoItem, Article, PhotoItem, MerchItem } from './types';

export const COLORS = {
  ningyuzhi: {
    green: '#E2F7C1',
    yellow: '#FCE68B',
  },
  ziyu: {
    purple: '#7A67EE',
    blue: '#4A90E2',
    white: '#F5F9FF',
  },
  tian: {
    gold: '#FFD64F',
    brightYellow: '#FFE46B',
    softWhite: '#FFF5C7',
  },
  redSea: {
    deep: '#AA1C1A',
    coral: '#FF4040',
    base: '#5D1B1C',
  }
};

export const MOCK_POSTS = [
  { id: '1', author: '小玉米', content: '今天的新物料真的太甜了！眼神拉丝谁懂啊！', timestamp: '10分钟前', likes: 256, tags: ['眼神杀', '甜蜜瞬间'] },
  { id: '2', author: '枝上鸟', content: '看了宁渝枝最新的剪辑，这就是宿命感吧。', timestamp: '1小时前', likes: 189, tags: ['宿命感', '混剪'] },
];

export const MOCK_VIDEOS: VideoItem[] = [
  { id: '1', creatorId: 'admin', title: '《夏日》杀青花絮', author: '玉米站长', likes: 12000, comments: 892, cover: 'https://picsum.photos/seed/vid1/400/600', tags: ['杀青', '幕后', '夏日回响'], merchId: 'merch-1' },
  { id: '2', creatorId: 'admin', title: '双人舞练习室版本', author: '宁宁的小太阳', likes: 4500, comments: 234, cover: 'https://picsum.photos/seed/vid2/400/600', tags: ['舞蹈', '练习室', '同步率'], merchId: 'merch-2' },
];

export const MOCK_PHOTOS: PhotoItem[] = [
  { id: '1', creatorId: 'admin', title: '夏日海边漫步', url: 'https://picsum.photos/seed/photo1/800/1000', author: '站姐A', likes: 8200, tags: ['花絮', '海边'] },
  { id: '2', creatorId: 'admin', title: '对视瞬间', url: 'https://picsum.photos/seed/photo2/800/1000', author: '心动记录仪', likes: 12000, tags: ['对视', '高甜'] },
];

export const MOCK_ARTICLES: Article[] = [
  { id: '1', creatorId: 'admin', category: '同人创作', title: '《名为宁渝枝的夏天》 · 第一回', excerpt: '那是发生在盛夏的一件小事。阳光透过树叶的缝隙洒在地面上...', author: '枝头小鹿', date: '2026-05-12', tags: ['连载', '夏日回响', '治愈'], likes: 0 },
];

export const MOCK_MERCH: MerchItem[] = [
  {
    id: 'merch-1',
    title: '【宁渝枝】20cm属性棉花娃娃-夏日回响版',
    category: '棉花娃娃',
    price: 88,
    deposit: 20,
    currentJoined: 342,
    targetGoal: 500,
    image: 'https://picsum.photos/seed/doll1/600/600',
    description: '采用超柔面料，包含刺绣细节，属性宁渝枝。满500人起做开模。',
    status: 'group-buy',
    gallery: ['https://picsum.photos/seed/doll1/600/600', 'https://picsum.photos/seed/doll1_2/600/600']
  },
  {
    id: 'merch-2',
    title: '【极速小鱼】亚克力摇摇乐摆件',
    category: '亚克力',
    price: 35,
    deposit: 15,
    currentJoined: 156,
    targetGoal: 200,
    image: 'https://picsum.photos/seed/stand1/600/600',
    description: '双层夹层亚克力，可晃动。梓渝极速小鱼Q版形象。',
    status: 'group-buy',
    gallery: ['https://picsum.photos/seed/stand1/600/600']
  },
  {
    id: 'merch-3',
    title: '【栩光金星】镭射小卡套装(10张入)',
    category: '纸类周边',
    price: 25,
    deposit: 10,
    currentJoined: 480,
    targetGoal: 500,
    image: 'https://picsum.photos/seed/cards1/600/600',
    description: '高透镭射工艺，包含田栩宁未公开写真美图。',
    status: 'group-buy',
    gallery: ['https://picsum.photos/seed/cards1/600/600']
  }
];

export const MOCK_TRAVEL = [
  { id: '1', city: '无锡', highlights: ['惠山古镇', '太湖鼋头渚', '拈花湾'], image: 'https://picsum.photos/seed/wuxi/800/400' },
];

export const MOCK_TIMELINE = [
  { id: '1', date: '2023-08-15', title: '初遇', description: '电视剧《夏日回响》正式开机。' },
];
