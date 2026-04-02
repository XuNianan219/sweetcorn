import React, { useMemo, useState } from 'react';
import { Save, Shield, User } from 'lucide-react';
import { StorageService } from '../services/storage';
import { User as UserType } from '../types';

export const AccountCenter: React.FC = () => {
  const currentUser = StorageService.getCurrentUser();
  const isAdmin = StorageService.isAdmin(currentUser.id);
  const [users, setUsers] = useState<UserType[]>(StorageService.getUsers());
  const [toast, setToast] = useState('');

  const editableUsers = useMemo(() => {
    if (isAdmin) return users;
    return users.filter((item) => item.id === currentUser.id);
  }, [users, isAdmin, currentUser.id]);

  const handleFieldChange = (id: string, key: 'realName' | 'bio' | 'avatar', value: string) => {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const saveUser = (targetUserId: string) => {
    const target = users.find((item) => item.id === targetUserId);
    if (!target) return;
    const nextUsers = StorageService.updateUserProfile(currentUser.id, targetUserId, {
      realName: target.realName,
      bio: target.bio,
      avatar: target.avatar,
    });
    setUsers(nextUsers);
    setToast('保存成功');
    setTimeout(() => setToast(''), 1200);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-white rounded-[2.5rem] p-8 border border-green-50 shadow-sm">
        <h1 className="text-4xl font-black text-green-950">账号管理</h1>
        <p className="text-gray-500 mt-2">{isAdmin ? '管理员可修改全部用户信息' : '普通用户仅可修改自己的信息'}</p>
      </div>

      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold z-50">{toast}</div>}

      <div className="space-y-6">
        {editableUsers.map((item) => (
          <section key={item.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-2xl flex items-center justify-center">{item.avatar || '🙂'}</div>
                <div>
                  <p className="font-black text-gray-900">{item.username}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    {item.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                    {item.role === 'admin' ? '管理员' : '普通用户'}
                  </p>
                </div>
              </div>
              <button onClick={() => saveUser(item.id)} className="px-4 py-2 rounded-xl gradient-redsea text-white text-sm font-black flex items-center gap-1.5">
                <Save size={14} />
                保存
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={item.realName}
                onChange={(e) => handleFieldChange(item.id, 'realName', e.target.value)}
                className="p-3 bg-gray-50 rounded-xl outline-none"
                placeholder="昵称"
              />
              <input
                value={item.avatar || ''}
                onChange={(e) => handleFieldChange(item.id, 'avatar', e.target.value)}
                className="p-3 bg-gray-50 rounded-xl outline-none"
                placeholder="头像字符（如 😀）"
              />
              <input
                value={item.bio || ''}
                onChange={(e) => handleFieldChange(item.id, 'bio', e.target.value)}
                className="p-3 bg-gray-50 rounded-xl outline-none"
                placeholder="简介"
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
