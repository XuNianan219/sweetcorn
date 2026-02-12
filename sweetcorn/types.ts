
export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  realName: string;
}

export interface Attachment {
  url: string;
  type: 'image' | 'video';
}

export interface Post {
  id: string;
  creatorId: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  tags?: string[];
  commentsList?: Comment[];
  attachments?: Attachment[];
}

export interface VideoItem {
  id: string;
  creatorId: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  cover: string;
  tags: string[];
  commentsList?: Comment[];
  merchId?: string; // 新增：关联的周边商品 ID
}

export interface PhotoItem {
  id: string;
  creatorId: string;
  title: string;
  url: string;
  author: string;
  likes: number;
  tags: string[];
  commentsList?: Comment[];
  isDraft?: boolean;
}

export interface Article {
  id: string;
  creatorId: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  likes: number;
  commentsList?: Comment[];
  topicLocation?: string;
}

export interface TrashItem {
  trashId: string;
  type: 'post' | 'video' | 'photo' | 'article';
  item: any;
  deletedAt: string;
}

export interface BrandDeal {
  id: string;
  celeb: 'ziyu' | 'tian';
  brand: string;
  image: string;
  link: string;
}

export interface MerchItem {
  id: string;
  title: string;
  category: string;
  price: number;
  deposit: number;
  currentJoined: number;
  targetGoal: number;
  image: string;
  description: string;
  status: 'group-buy' | 'pre-order' | 'finished';
  gallery: string[];
}
