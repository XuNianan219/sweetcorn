import React from 'react';
import PageHeader from '../components/PageHeader';
import { AdminSupport } from '../components/AdminSupport';
import { useLang } from '../contexts/LanguageContext';

// 客诉处理页：复用管理员客服后台组件（读官方客服收件箱，收发所有用户客诉）
export const Complaints: React.FC = () => {
  const { t } = useLang();
  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 px-4 animate-fadeIn">
      <PageHeader title={t('客诉处理', 'Complaints')} />
      <AdminSupport />
    </div>
  );
};
