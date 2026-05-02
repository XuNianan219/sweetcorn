export const CATEGORY_MAP: Record<string, string> = {
  life: '生活',
  discussion: '讨论区',
  media: '影像区',
  article: '文章区',
  travel: '旅游推荐',
};

export const getCategoryName = (k: string): string => CATEGORY_MAP[k] ?? k;
