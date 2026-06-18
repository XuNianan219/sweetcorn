export const CATEGORY_MAP: Record<string, string> = {
  life: '生活',
  discussion: '嗑学研究所',
  media: '嗑学影像',
  article: '嗑学论文',
  travel: '嗑学旅行',
  merchandise: '甜玉米市集',
  events: '嗑学情报站',
  business: '商务区',
  'love-history': '甜玉米日记',
};

export const getCategoryName = (k: string): string => CATEGORY_MAP[k] ?? k;
