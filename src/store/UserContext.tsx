import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo } from '@/types';
import { getStorage, setStorage, removeStorage } from '@/utils';

interface UserContextType {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  updateUserInfo: (info: Partial<UserInfo>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'user_info';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = getStorage<UserInfo>(STORAGE_KEY);
    if (storedUser) {
      console.log('[UserContext] 从本地存储恢复用户信息');
      setUserInfo(storedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (info: UserInfo) => {
    console.log('[UserContext] 用户登录:', info.nickName);
    setUserInfo(info);
    setIsLoggedIn(true);
    setStorage(STORAGE_KEY, info);
  };

  const logout = () => {
    console.log('[UserContext] 用户登出');
    setUserInfo(null);
    setIsLoggedIn(false);
    removeStorage(STORAGE_KEY);
  };

  const updateUserInfo = (info: Partial<UserInfo>) => {
    if (userInfo) {
      const updatedInfo = { ...userInfo, ...info };
      console.log('[UserContext] 更新用户信息:', updatedInfo);
      setUserInfo(updatedInfo);
      setStorage(STORAGE_KEY, updatedInfo);
    }
  };

  return (
    <UserContext.Provider value={{ userInfo, isLoggedIn, login, logout, updateUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const defaultUserInfo: UserInfo = {
  id: '',
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  nickName: '',
  phone: '',
  gender: '女',
  birthday: '1995-01-01'
};

export const mockLogin = (): UserInfo => {
  return {
    id: 'user_123',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    nickName: '瑜伽爱好者',
    phone: '13812345678',
    gender: '女',
    birthday: '1995-06-15'
  };
};
