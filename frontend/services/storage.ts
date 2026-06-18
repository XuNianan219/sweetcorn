import { Article, PhotoItem, Post, TrashItem, User, VideoItem } from '../types';
import { MOCK_ARTICLES, MOCK_PHOTOS, MOCK_POSTS, MOCK_VIDEOS } from '../constants';

const KEYS = {
  VIDEOS: 'ningyuzhi_videos',
  PHOTOS: 'ningyuzhi_photos',
  ARTICLES: 'ningyuzhi_articles',
  POSTS: 'ningyuzhi_posts',
  TRASH: 'ningyuzhi_trash',
  CURRENT_USER: 'ningyuzhi_current_user',
  USERS: 'ningyuzhi_users',
  HOME_VIDEO: 'ningyuzhi_home_video',
  SAVED_MEDIA: 'ningyuzhi_saved_media',
  DISLIKED_MEDIA: 'ningyuzhi_disliked_media',
  CELEB_A_SILHOUETTE: 'ningyuzhi_celeb_a_silhouette',
  CELEB_B_SILHOUETTE: 'ningyuzhi_celeb_b_silhouette',
};

const MEDIA_DB_NAME = 'ningyuzhi_media_db';
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE_NAME = 'assets';
const HOME_VIDEO_BLOB_KEY = 'home_video_blob';

export const TEST_USERS: User[] = [
  { id: '101', username: 'admin', realName: '管理员', role: 'admin', bio: '全站管理', avatar: '👑' },
  { id: '102', username: 'user1', realName: '用户一', role: 'user', bio: '普通用户', avatar: '🙂' },
  { id: '103', username: 'user2', realName: '用户二', role: 'user', bio: '普通用户', avatar: '😎' },
  { id: '104', username: 'user3', realName: '用户三', role: 'user', bio: '普通用户', avatar: '🌟' },
  { id: '105', username: 'user4', realName: '用户四', role: 'user', bio: '普通用户', avatar: '🎬' },
];

const DEFAULT_HOME_VIDEO = 'https://cdn.coverr.co/videos/coverr-sunset-over-the-sea-9711/1080p.mp4';

export class StorageService {
  private static get<T>(key: string, defaultValue: T[]): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private static save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private static getUserScopedMap(key: string): Record<string, string[]> {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  }

  private static saveUserScopedMap(key: string, data: Record<string, string[]>) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private static openMediaDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
          db.createObjectStore(MEDIA_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private static async readMediaBlob(key: string): Promise<Blob | null> {
    try {
      const db = await this.openMediaDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
        const store = tx.objectStore(MEDIA_STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as Blob) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  private static async writeMediaBlob(key: string, blob: Blob): Promise<void> {
    const db = await this.openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE_NAME);
      const req = store.put(blob, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  static getUsers(): User[] {
    const raw = localStorage.getItem(KEYS.USERS);
    if (!raw) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(TEST_USERS));
      return TEST_USERS;
    }
    return JSON.parse(raw);
  }

  static isAdmin(userId?: string): boolean {
    if (!userId) return false;
    const user = this.getUsers().find((item) => item.id === userId);
    return user?.role === 'admin';
  }

  static setCurrentUser(user: User | null) {
    if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.CURRENT_USER);
  }

  static getCurrentUser(): User {
    const users = this.getUsers();
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    if (!raw) return users[0];
    const parsed = JSON.parse(raw) as User;
    return users.find((item) => item.id === parsed.id) || users[0];
  }

  static updateUserProfile(editorId: string, targetUserId: string, patch: Partial<User>): User[] {
    const canManageAll = this.isAdmin(editorId);
    if (!canManageAll && editorId !== targetUserId) return this.getUsers();

    const nextUsers = this.getUsers().map((item) => {
      if (item.id !== targetUserId) return item;
      return {
        ...item,
        realName: patch.realName ?? item.realName,
        bio: patch.bio ?? item.bio,
        avatar: patch.avatar ?? item.avatar,
      };
    });
    localStorage.setItem(KEYS.USERS, JSON.stringify(nextUsers));

    const current = this.getCurrentUser();
    const refreshedCurrent = nextUsers.find((item) => item.id === current.id);
    if (refreshedCurrent) this.setCurrentUser(refreshedCurrent);
    return nextUsers;
  }

  static async getHomeVideoUrl(): Promise<string> {
    const blob = await this.readMediaBlob(HOME_VIDEO_BLOB_KEY);
    if (blob) return URL.createObjectURL(blob);
    return localStorage.getItem(KEYS.HOME_VIDEO) || DEFAULT_HOME_VIDEO;
  }

  static async setHomeVideoFile(userId: string, file: File): Promise<boolean> {
    if (!this.isAdmin(userId)) return false;
    try {
      await this.writeMediaBlob(HOME_VIDEO_BLOB_KEY, file);
      return true;
    } catch {
      return false;
    }
  }

  static getSavedMediaIds(userId: string): string[] {
    const map = this.getUserScopedMap(KEYS.SAVED_MEDIA);
    return map[userId] || [];
  }

  static toggleSaveMedia(userId: string, mediaKey: string): string[] {
    const map = this.getUserScopedMap(KEYS.SAVED_MEDIA);
    const set = new Set(map[userId] || []);
    if (set.has(mediaKey)) set.delete(mediaKey);
    else set.add(mediaKey);
    map[userId] = Array.from(set);
    this.saveUserScopedMap(KEYS.SAVED_MEDIA, map);
    return map[userId];
  }

  static getDislikedMediaIds(userId: string): string[] {
    const map = this.getUserScopedMap(KEYS.DISLIKED_MEDIA);
    return map[userId] || [];
  }

  static addDislikedMedia(userId: string, mediaKey: string): string[] {
    const map = this.getUserScopedMap(KEYS.DISLIKED_MEDIA);
    const set = new Set(map[userId] || []);
    set.add(mediaKey);
    map[userId] = Array.from(set);
    this.saveUserScopedMap(KEYS.DISLIKED_MEDIA, map);
    return map[userId];
  }

  static getTrash(): TrashItem[] {
    return this.get(KEYS.TRASH, []);
  }

  private static moveToTrash(type: TrashItem['type'], item: any) {
    const trash = this.getTrash();
    const newTrashItem: TrashItem = {
      trashId: Date.now().toString(),
      type,
      item,
      deletedAt: new Date().toLocaleString(),
    };
    this.save(KEYS.TRASH, [newTrashItem, ...trash]);
  }

  static updateTrashItem(trashId: string, updatedItem: any) {
    const trash = this.getTrash();
    this.save(
      KEYS.TRASH,
      trash.map((item) => (item.trashId === trashId ? { ...item, item: updatedItem } : item))
    );
  }

  static restoreFromTrash(trashId: string) {
    const trash = this.getTrash();
    const trashItem = trash.find((item) => item.trashId === trashId);
    if (!trashItem) return;

    if (trashItem.type === 'post') this.savePost(trashItem.item);
    if (trashItem.type === 'video') this.saveVideo(trashItem.item);
    if (trashItem.type === 'photo') this.savePhoto(trashItem.item);
    if (trashItem.type === 'article') this.saveArticle(trashItem.item);

    this.save(
      KEYS.TRASH,
      trash.filter((item) => item.trashId !== trashId)
    );
  }

  static permanentlyDeleteTrash(trashId: string) {
    this.save(
      KEYS.TRASH,
      this.getTrash().filter((item) => item.trashId !== trashId)
    );
  }

  private static getRawPhotos(): PhotoItem[] {
    return this.get(KEYS.PHOTOS, MOCK_PHOTOS.map((item) => ({ ...item, creatorId: '101' })));
  }
  static getPhotos(): PhotoItem[] {
    return this.getRawPhotos().filter((item) => !item.isDraft);
  }
  static getDraftPhotos(): PhotoItem[] {
    return this.getRawPhotos().filter((item) => !!item.isDraft);
  }
  static savePhoto(photo: PhotoItem) {
    this.save(KEYS.PHOTOS, [photo, ...this.getRawPhotos()]);
  }
  static updatePhoto(photo: PhotoItem) {
    this.save(
      KEYS.PHOTOS,
      this.getRawPhotos().map((item) => (item.id === photo.id ? photo : item))
    );
  }
  static removePhoto(photoId: string, userId: string) {
    const items = this.getRawPhotos();
    const target = items.find((item) => item.id === photoId);
    if (!target) return;
    this.moveToTrash('photo', target);
    this.save(
      KEYS.PHOTOS,
      items.filter((item) => item.id !== photoId)
    );
  }

  private static getRawPosts(): Post[] {
    return this.get(KEYS.POSTS, MOCK_POSTS.map((item) => ({ ...item, creatorId: '101' })));
  }
  static getPosts(): Post[] {
    return this.getRawPosts();
  }
  static savePost(post: Post) {
    this.save(KEYS.POSTS, [post, ...this.getRawPosts()]);
  }
  static updatePost(post: Post) {
    this.save(
      KEYS.POSTS,
      this.getRawPosts().map((item) => (item.id === post.id ? post : item))
    );
  }
  static removePost(postId: string, userId: string) {
    const items = this.getRawPosts();
    const target = items.find((item) => item.id === postId);
    if (!target) return;
    this.moveToTrash('post', target);
    this.save(
      KEYS.POSTS,
      items.filter((item) => item.id !== postId)
    );
  }

  private static getRawVideos(): VideoItem[] {
    return this.get(KEYS.VIDEOS, MOCK_VIDEOS.map((item) => ({ ...item, creatorId: '101' })));
  }
  static getVideos(): VideoItem[] {
    return this.getRawVideos();
  }
  static saveVideo(video: VideoItem) {
    this.save(KEYS.VIDEOS, [video, ...this.getRawVideos()]);
  }
  static updateVideo(video: VideoItem) {
    this.save(
      KEYS.VIDEOS,
      this.getRawVideos().map((item) => (item.id === video.id ? video : item))
    );
  }
  static removeVideo(videoId: string, userId: string) {
    const items = this.getRawVideos();
    const target = items.find((item) => item.id === videoId);
    if (!target) return;
    this.moveToTrash('video', target);
    this.save(
      KEYS.VIDEOS,
      items.filter((item) => item.id !== videoId)
    );
  }

  private static getRawArticles(): Article[] {
    return this.get(KEYS.ARTICLES, MOCK_ARTICLES.map((item) => ({ ...item, creatorId: '101' })));
  }
  static getArticles(): Article[] {
    return this.getRawArticles();
  }
  static saveArticle(article: Article) {
    this.save(KEYS.ARTICLES, [article, ...this.getRawArticles()]);
  }
  static updateArticle(article: Article) {
    this.save(
      KEYS.ARTICLES,
      this.getRawArticles().map((item) => (item.id === article.id ? article : item))
    );
  }
  static removeArticle(articleId: string, userId: string) {
    const items = this.getRawArticles();
    const target = items.find((item) => item.id === articleId);
    if (!target) return;
    this.moveToTrash('article', target);
    this.save(
      KEYS.ARTICLES,
      items.filter((item) => item.id !== articleId)
    );
  }

  static getCelebSilhouette(celeb: 'a' | 'b'): string {
    const key = celeb === 'a' ? KEYS.CELEB_A_SILHOUETTE : KEYS.CELEB_B_SILHOUETTE;
    return localStorage.getItem(key) || '';
  }

  static setCelebSilhouette(userId: string, celeb: 'a' | 'b', dataUrl: string): boolean {
    if (!this.isAdmin(userId)) return false;
    const key = celeb === 'a' ? KEYS.CELEB_A_SILHOUETTE : KEYS.CELEB_B_SILHOUETTE;
    if (!dataUrl) return false;
    localStorage.setItem(key, dataUrl);
    return true;
  }
}
