import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { getIdea, toggleWantIdea, type Idea } from '../services/merchandiseService';

export const MerchandiseIdeaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    getIdea(id)
      .then(setIdea)
      .catch(() => setError('创意不存在'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWant = async () => {
    if (!idea || busy) return;
    const prevIdea = idea;
    setBusy(true);
    const nextWanted = !idea.isWantedByMe;
    setIdea((i) =>
      i
        ? { ...i, isWantedByMe: nextWanted, wantCount: i.wantCount + (nextWanted ? 1 : -1) }
        : i
    );
    try {
      const result = await toggleWantIdea(idea.id);
      setIdea((i) => (i ? { ...i, isWantedByMe: result.wanted, wantCount: result.wantCount } : i));
    } catch {
      setIdea(prevIdea);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>;
  }
  if (error || !idea) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400 text-sm">{error ?? '创意不存在'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-green-600 underline text-sm"
        >
          返回
        </button>
      </div>
    );
  }

  const progress = Math.min(100, (idea.wantCount / Math.max(1, idea.targetPeople)) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* 返回 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
      >
        <ArrowLeft size={16} /> 返回
      </button>

      {/* 图片轮播 */}
      {idea.designImages.length > 0 && (
        <div className="space-y-2">
          <div className="w-full rounded-2xl overflow-hidden bg-gray-100 aspect-square">
            <img
              src={idea.designImages[currentImage]}
              alt={idea.name}
              className="w-full h-full object-cover"
            />
          </div>
          {idea.designImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {idea.designImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    currentImage === idx ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 标题 & 作者 */}
      <div className="space-y-3">
        <h1 className="text-2xl font-black text-gray-900">{idea.name}</h1>
        <div className="flex items-center gap-2">
          {idea.author.avatarUrl ? (
            <img
              src={idea.author.avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full gradient-ningyuzhi" />
          )}
          <span className="text-sm text-gray-500">{idea.author.nickname ?? '匿名玉米'}</span>
        </div>
      </div>

      {/* 描述 */}
      {idea.description && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {idea.description}
          </p>
        </div>
      )}

      {/* 想要进度卡片 */}
      <div className="bg-white border border-[#E2F7C1] rounded-2xl p-5 space-y-4">
        <h3 className="font-black text-gray-900">想要进度</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-green-700 font-black">{idea.wantCount} 人想要</span>
            <span className="text-gray-400">目标 {idea.targetPeople} 人</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {progress >= 100
              ? '🎉 已达成目标！'
              : `还差 ${idea.targetPeople - idea.wantCount} 人即可成团`}
          </p>
        </div>

        <button
          onClick={handleWant}
          disabled={busy}
          className={`w-full py-3 rounded-2xl font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
            idea.isWantedByMe
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'gradient-ningyuzhi text-green-900 hover:opacity-90'
          }`}
        >
          <Heart size={16} className={idea.isWantedByMe ? 'fill-green-600' : ''} />
          {idea.isWantedByMe ? '已想要' : '我也想要'}
        </button>
      </div>

      {/* 标签 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">预估成本</p>
          <p className="text-xl font-black text-green-700">¥{idea.estimatedCost}</p>
          <p className="text-xs text-gray-400">元 / 件</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">目标成团人数</p>
          <p className="text-xl font-black text-green-700">{idea.targetPeople}</p>
          <p className="text-xs text-gray-400">人</p>
        </div>
      </div>
    </div>
  );
};
