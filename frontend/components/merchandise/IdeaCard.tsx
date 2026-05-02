import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { type Idea, toggleWantIdea } from '../../services/merchandiseService';

interface Props {
  idea: Idea;
  onToggleWant?: (id: string, result: { wanted: boolean; wantCount: number }) => void;
}

export const IdeaCard: React.FC<Props> = ({ idea, onToggleWant }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [localWanted, setLocalWanted] = useState(idea.isWantedByMe);
  const [localCount, setLocalCount] = useState(idea.wantCount);

  const progress = Math.min(100, (localCount / Math.max(1, idea.targetPeople)) * 100);
  const imageUrl = idea.designImages[0] ?? '';

  const handleWant = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    // 乐观更新
    const prevWanted = localWanted;
    const prevCount = localCount;
    const nextWanted = !localWanted;
    setLocalWanted(nextWanted);
    setLocalCount(localCount + (nextWanted ? 1 : -1));

    try {
      const result = await toggleWantIdea(idea.id);
      setLocalWanted(result.wanted);
      setLocalCount(result.wantCount);
      onToggleWant?.(idea.id, result);
    } catch {
      // 失败回滚
      setLocalWanted(prevWanted);
      setLocalCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/merchandise/idea/${idea.id}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4 border border-gray-100"
    >
      {imageUrl && (
        <div className="w-full overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt={idea.name}
            loading="lazy"
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{idea.name}</h3>

        {/* 进度条 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{localCount} 想要</span>
            <span>目标 {idea.targetPeople} 人</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          {/* 作者 */}
          <div className="flex items-center gap-1.5 min-w-0">
            {idea.author.avatarUrl ? (
              <img
                src={idea.author.avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full gradient-ningyuzhi flex-shrink-0" />
            )}
            <span className="text-xs text-gray-500 truncate">
              {idea.author.nickname ?? '匿名玉米'}
            </span>
          </div>

          {/* 想要按钮 */}
          <button
            onClick={handleWant}
            disabled={busy}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
              localWanted
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
            }`}
          >
            <Heart size={12} className={localWanted ? 'fill-green-600' : ''} />
            <span>{localWanted ? '已想要' : '我也想要'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
