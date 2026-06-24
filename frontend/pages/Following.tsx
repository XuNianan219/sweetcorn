import React from 'react';
import PageHeader from '../components/PageHeader';
import { FollowingList } from '../components/FollowingList';
import { useCurrentUser } from '../contexts/UserContext';
import { useLang } from '../contexts/LanguageContext';

// 完整的「我的关注」列表页：展示当前用户关注的所有人，可取关 / 私信
export const Following: React.FC = () => {
  const { user } = useCurrentUser();
  const { t } = useLang();

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-16 animate-fadeIn">
      <PageHeader title={t('我的关注', 'Following')} />
      {user?.id ? (
        <FollowingList userId={user.id} />
      ) : (
        <div className="py-20 text-center text-gray-400 font-medium">{t('请先登录', 'Please log in first')}</div>
      )}
    </div>
  );
};
