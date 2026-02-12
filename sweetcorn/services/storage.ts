
import { VideoItem, PhotoItem, Article, User, Post, TrashItem } from '../types';
import { MOCK_VIDEOS, MOCK_PHOTOS, MOCK_ARTICLES, MOCK_POSTS } from '../constants';

const KEYS = {
  VIDEOS: 'ningyuzhi_videos',
  PHOTOS: 'ningyuzhi_photos',
  ARTICLES: 'ningyuzhi_articles',
  POSTS: 'ningyuzhi_posts',
  TRASH: 'ningyuzhi_trash',
  CURRENT_USER: 'ningyuzhi_current_user',
};

export const TEST_USERS: User[] = [
  { id: '101', username: 'user1', realName: '管理员' },
  { id: '102', username: 'user2', realName: '李四' },
  { id: '103', username: 'user3', realName: '王五' },
  { id: '104', username: 'user4', realName: '赵六' },
  { id: '105', username: 'user5', realName: '孙七' },
];

export class StorageService {
  private static get<T>(key: string, defaultValue: T[]): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private static save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static isAdmin(userId?: string): boolean {
    // 开发模式下，默认所有进入的用户都拥有管理权限
    return true;
  }

  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }

  static getCurrentUser(): User {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    // 如果没有存储的用户，默认返回第一个测试用户作为当前在线用户
    return data ? JSON.parse(data) : TEST_USERS[0];
  }

  // --- 回收站系统 ---
  static getTrash(): TrashItem[] {
    return this.get(KEYS.TRASH, []);
  }

  private static moveToTrash(type: TrashItem['type'], item: any) {
    const trash = this.getTrash();
    const newTrashItem: TrashItem = {
      trashId: Date.now().toString(),
      type,
      item,
      deletedAt: new Date().toLocaleString()
    };
    this.save(KEYS.TRASH, [newTrashItem, ...trash]);
  }

  static updateTrashItem(trashId: string, updatedItem: any) {
    const trash = this.getTrash();
    this.save(KEYS.TRASH, trash.map(t => t.trashId === trashId ? { ...t, item: updatedItem } : t));
  }

  static restoreFromTrash(trashId: string) {
    const trash = this.getTrash();
    const trashItem = trash.find(t => t.trashId === trashId);
    if (!trashItem) return;

    if (trashItem.type === 'post') {
      this.savePost(trashItem.item);
    } else if (trashItem.type === 'video') {
      this.saveVideo(trashItem.item);
    } else if (trashItem.type === 'photo') {
      this.savePhoto(trashItem.item);
    } else if (trashItem.type === 'article') {
      this.saveArticle(trashItem.item);
    }

    this.save(KEYS.TRASH, trash.filter(t => t.trashId !== trashId));
  }

  static permanentlyDeleteTrash(trashId: string) {
    this.save(KEYS.TRASH, this.getTrash().filter(t => t.trashId !== trashId));
  }

  // --- 图片管理核心逻辑 ---
  private static getRawPhotos(): PhotoItem[] {
    return this.get(KEYS.PHOTOS, MOCK_PHOTOS.map(p => ({ ...p, creatorId: 'admin' })));
  }

  static getPhotos(): PhotoItem[] {
    return this.getRawPhotos().filter(p => !p.isDraft);
  }

  static getDraftPhotos(): PhotoItem[] {
    return this.getRawPhotos().filter(p => !!p.isDraft);
  }

  static savePhoto(photo: PhotoItem) {
    const current = this.getRawPhotos();
    this.save(KEYS.PHOTOS, [photo, ...current]);
  }

  static updatePhoto(photo: PhotoItem) {
    const current = this.getRawPhotos();
    this.save(KEYS.PHOTOS, current.map(p => p.id === photo.id ? photo : p));
  }

  static removePhoto(photoId: string, userId: string) {
    const items = this.getRawPhotos();
    const target = items.find(p => p.id === photoId);
    if (target) {
      this.moveToTrash('photo', target);
      this.save(KEYS.PHOTOS, items.filter(p => p.id !== photoId));
    }
  }

  private static getRawPosts(): Post[] { return this.get(KEYS.POSTS, MOCK_POSTS.map(p => ({ ...p, creatorId: 'admin' }))); }
  static getPosts(): Post[] { return this.getRawPosts(); }
  static savePost(post: Post) { this.save(KEYS.POSTS, [post, ...this.getRawPosts()]); }
  static updatePost(post: Post) { this.save(KEYS.POSTS, this.getRawPosts().map(p => p.id === post.id ? post : p)); }
  static removePost(postId: string, userId: string) {
    const items = this.getRawPosts();
    const target = items.find(p => p.id === postId);
    if (target) { this.moveToTrash('post', target); this.save(KEYS.POSTS, items.filter(p => p.id !== postId)); }
  }

  private static getRawVideos(): VideoItem[] { return this.get(KEYS.VIDEOS, MOCK_VIDEOS.map(v => ({ ...v, creatorId: 'admin' }))); }
  static getVideos(): VideoItem[] { return this.getRawVideos(); }
  static saveVideo(video: VideoItem) { this.save(KEYS.VIDEOS, [video, ...this.getRawVideos()]); }
  static updateVideo(video: VideoItem) { this.save(KEYS.VIDEOS, this.getRawVideos().map(v => v.id === video.id ? video : v)); }
  static removeVideo(videoId: string, userId: string) {
    const items = this.getRawVideos();
    const target = items.find(v => v.id === videoId);
    if (target) { this.moveToTrash('video', target); this.save(KEYS.VIDEOS, items.filter(v => v.id !== videoId)); }
  }

  private static getRawArticles(): Article[] { return this.get(KEYS.ARTICLES, MOCK_ARTICLES.map(a => ({ ...a, creatorId: 'admin' }))); }
  static getArticles(): Article[] { return this.getRawArticles(); }
  static saveArticle(article: Article) { this.save(KEYS.ARTICLES, [article, ...this.getRawArticles()]); }
  static updateArticle(article: Article) { this.save(KEYS.ARTICLES, this.getRawArticles().map(a => a.id === article.id ? article : a)); }
  static removeArticle(articleId: string, userId: string) {
    const items = this.getRawArticles();
    const target = items.find(a => a.id === articleId);
    if (target) { this.moveToTrash('article', target); this.save(KEYS.ARTICLES, items.filter(a => a.id !== articleId)); }
  }
}
