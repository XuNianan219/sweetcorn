import React, { useEffect, useState } from 'react';
import {
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { useCurrentUser } from '../contexts/UserContext';
import { uploadMedia } from '../services/mediaService';
import {
  getCelebrityPage,
  updateCelebrityPage,
  type CelebrityPage,
  type CelebritySection,
  type SectionType,
} from '../services/celebrityPageService';

interface CelebrityPageViewProps {
  slug: string;
}

const OVERLAY: Record<string, string> = {
  yellow: 'from-yellow-900/80 via-yellow-800/30 to-transparent',
  blue: 'from-blue-900/80 via-blue-800/30 to-transparent',
  green: 'from-green-900/80 via-green-800/30 to-transparent',
};

const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: 'yellow', label: '黄色' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' },
];

const TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'text', label: '文字' },
  { value: 'image', label: '图片' },
  { value: 'image-text', label: '图文' },
];

const sortByOrder = (s: CelebritySection[]) =>
  [...s].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  editingId: string | null;
  type: SectionType;
  title: string;
  content: string;
  imageUrl: string;
  uploading: boolean;
}

const EMPTY_MODAL: ModalState = {
  open: false,
  mode: 'add',
  editingId: null,
  type: 'text',
  title: '',
  content: '',
  imageUrl: '',
  uploading: false,
};

export const CelebrityPageView: React.FC<CelebrityPageViewProps> = ({ slug }) => {
  const { isAdmin } = useCurrentUser();

  const [page, setPage] = useState<CelebrityPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // 编辑态草稿
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerColor, setBannerColor] = useState('yellow');
  const [sections, setSections] = useState<CelebritySection[]>([]);

  const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCelebrityPage(slug)
      .then((data) => {
        if (cancelled) return;
        setPage({ ...data, sections: sortByOrder(data.sections) });
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const enterEdit = () => {
    if (!page) return;
    setTitle(page.title);
    setSubtitle(page.subtitle);
    setBannerImage(page.bannerImage);
    setBannerColor(page.bannerColor || 'yellow');
    setSections(sortByOrder(page.sections));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setModal(EMPTY_MODAL);
  };

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const normalized = sections.map((s, i) => ({ ...s, order: i + 1 }));
      const updated = await updateCelebrityPage(slug, {
        title,
        subtitle,
        bannerImage,
        bannerColor,
        sections: normalized,
      });
      setPage({ ...updated, sections: sortByOrder(updated.sections) });
      setEditMode(false);
      setModal(EMPTY_MODAL);
      showToast('保存成功');
    } catch (e: any) {
      showToast(e?.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const { url } = await uploadMedia(file);
      setBannerImage(url);
    } catch (err: any) {
      showToast(err?.message || '图片上传失败', 'error');
    } finally {
      setBannerUploading(false);
      e.target.value = '';
    }
  };

  // ── 模块操作（仅改草稿，保存时统一提交）─────────────────
  const openAddModal = () => {
    setModal({ ...EMPTY_MODAL, open: true, mode: 'add' });
  };

  const openEditModal = (s: CelebritySection) => {
    setModal({
      open: true,
      mode: 'edit',
      editingId: s.id,
      type: s.type,
      title: s.title || '',
      content: s.content || '',
      imageUrl: s.imageUrl || '',
      uploading: false,
    });
  };

  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModal((m) => ({ ...m, uploading: true }));
    try {
      const { url } = await uploadMedia(file);
      setModal((m) => ({ ...m, imageUrl: url, uploading: false }));
    } catch (err: any) {
      showToast(err?.message || '图片上传失败', 'error');
      setModal((m) => ({ ...m, uploading: false }));
    } finally {
      e.target.value = '';
    }
  };

  const saveModal = () => {
    if (modal.mode === 'add') {
      const newSection: CelebritySection = {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `tmp-${Date.now()}`,
        type: modal.type,
        title: modal.title,
        content: modal.content,
        imageUrl: modal.imageUrl,
        order: sections.length + 1,
      };
      setSections((prev) => [...prev, newSection]);
    } else {
      setSections((prev) =>
        prev.map((s) =>
          s.id === modal.editingId
            ? {
                ...s,
                type: modal.type,
                title: modal.title,
                content: modal.content,
                imageUrl: modal.imageUrl,
              }
            : s,
        ),
      );
    }
    setModal(EMPTY_MODAL);
  };

  const deleteSectionDraft = (id: string) => {
    if (!window.confirm('确定删除这个模块吗？')) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // ── 渲染辅助 ────────────────────────────────────────────
  const renderSectionBody = (s: CelebritySection) => {
    if (s.type === 'image') {
      return s.imageUrl ? (
        <img src={s.imageUrl} alt={s.title} className="w-full rounded-2xl object-cover" />
      ) : null;
    }
    if (s.type === 'image-text') {
      return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {s.imageUrl && (
            <img
              src={s.imageUrl}
              alt={s.title}
              className="w-full md:w-1/2 rounded-2xl object-cover"
            />
          )}
          <p className="flex-1 text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</p>
        </div>
      );
    }
    return <p className="text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</p>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-gray-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="text-center py-32 text-gray-400 font-medium">{error || '页面不存在'}</div>
    );
  }

  const displayTitle = editMode ? title : page.title;
  const displaySubtitle = editMode ? subtitle : page.subtitle;
  const displayBanner = editMode ? bannerImage : page.bannerImage;
  const displayColor = editMode ? bannerColor : page.bannerColor || 'yellow';
  const displaySections = editMode ? sections : page.sections;

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl shadow-lg font-bold text-sm ${
            toast.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* A. 顶部 Banner */}
      <div
        className={`relative h-[340px] md:h-[400px] rounded-[2.5rem] overflow-hidden shadow-xl ${
          editMode ? 'ring-2 ring-dashed ring-yellow-400 ring-offset-2' : ''
        }`}
      >
        {displayBanner && (
          <img src={displayBanner} alt={displayTitle} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${OVERLAY[displayColor] || OVERLAY.yellow}`} />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 gap-4">
          {editMode ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="页面大标题"
                className="w-full max-w-md text-4xl md:text-6xl font-black text-white text-center bg-white/10 border-2 border-dashed border-yellow-300 rounded-2xl px-4 py-2 placeholder:text-white/50 outline-none"
              />
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="副标题"
                className="w-full max-w-sm text-lg md:text-xl font-medium text-white text-center bg-white/10 border-2 border-dashed border-yellow-300 rounded-xl px-4 py-1.5 placeholder:text-white/50 outline-none"
              />
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm cursor-pointer transition-colors">
                  {bannerUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  {bannerUploading ? '上传中…' : '上传背景图'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={bannerUploading}
                  />
                </label>
                <select
                  value={bannerColor}
                  onChange={(e) => setBannerColor(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/90 text-gray-800 font-bold text-sm outline-none border-2 border-dashed border-yellow-300"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl">
                {displayTitle}
              </h1>
              {displaySubtitle && (
                <p className="text-lg md:text-2xl font-medium text-white/90 tracking-widest drop-shadow-lg">
                  {displaySubtitle}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* B. 右上角管理员入口 */}
      {isAdmin && (
        <div className="flex justify-end gap-3">
          {!editMode ? (
            <button
              onClick={enterEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-full font-bold text-sm shadow-md transition-colors"
            >
              <Pencil size={16} /> 编辑
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-full font-bold text-sm shadow-md transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 保存
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold text-sm transition-colors disabled:opacity-60"
              >
                <X size={16} /> 取消
              </button>
            </>
          )}
        </div>
      )}

      {/* C. 内容模块列表 */}
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {displaySections.length === 0 && !editMode && (
          <div className="text-center py-16 text-gray-400 font-medium">暂无内容</div>
        )}

        {displaySections.map((s, index) => (
          <div
            key={s.id}
            className={`relative bg-white rounded-[2rem] shadow-sm border p-8 space-y-4 ${
              editMode ? 'border-2 border-dashed border-yellow-400' : 'border-gray-50'
            }`}
          >
            {editMode && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => openEditModal(s)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Pencil size={12} /> 编辑
                </button>
                <button
                  onClick={() => deleteSectionDraft(s.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Trash2 size={12} /> 删除
                </button>
              </div>
            )}

            {s.title && <h2 className="text-2xl font-black text-green-950">{s.title}</h2>}
            {renderSectionBody(s)}

            {editMode && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                >
                  <ArrowUp size={12} /> 上移
                </button>
                <button
                  onClick={() => moveSection(index, 1)}
                  disabled={index === displaySections.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                >
                  <ArrowDown size={12} /> 下移
                </button>
              </div>
            )}
          </div>
        ))}

        {editMode && (
          <button
            onClick={openAddModal}
            className="w-full py-6 border-2 border-dashed border-yellow-400 rounded-[2rem] text-green-800 font-black flex items-center justify-center gap-2 hover:bg-yellow-50 transition-colors"
          >
            <Plus size={20} /> 添加新模块
          </button>
        )}
      </div>

      {/* D. 模块编辑弹窗 */}
      {modal.open && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(EMPTY_MODAL);
          }}
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-green-950">
                {modal.mode === 'add' ? '添加新模块' : '编辑模块'}
              </h3>
              <button
                onClick={() => setModal(EMPTY_MODAL)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
              >
                <X size={14} />
              </button>
            </div>

            {/* 类型选择 */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">类型</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setModal((m) => ({ ...m, type: t.value }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                      modal.type === t.value
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <input
              value={modal.title}
              onChange={(e) => setModal((m) => ({ ...m, title: e.target.value }))}
              placeholder="模块标题"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-green-100 text-base font-semibold placeholder:text-gray-300"
            />

            {/* 内容 */}
            {(modal.type === 'text' || modal.type === 'image-text') && (
              <textarea
                value={modal.content}
                onChange={(e) => setModal((m) => ({ ...m, content: e.target.value }))}
                placeholder="模块内容"
                className="w-full h-32 p-4 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-green-100 resize-none text-base font-medium placeholder:text-gray-300"
              />
            )}

            {/* 图片 */}
            {(modal.type === 'image' || modal.type === 'image-text') && (
              <div className="space-y-3">
                {modal.imageUrl && (
                  <img
                    src={modal.imageUrl}
                    alt="预览"
                    className="w-full max-h-56 object-cover rounded-xl border border-gray-100"
                  />
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold text-sm cursor-pointer transition-colors">
                  {modal.uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  {modal.uploading ? '上传中…' : modal.imageUrl ? '更换图片' : '上传图片'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalImageUpload}
                    className="hidden"
                    disabled={modal.uploading}
                  />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModal(EMPTY_MODAL)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-bold text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveModal}
                disabled={modal.uploading}
                className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-full font-bold text-sm transition-colors disabled:opacity-60"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
