import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserInfo, Course } from '@/types';
import { getStorage, setStorage, removeStorage } from '@/utils';
import { getCourseById } from '@/data/courses';

interface UserContextType {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  favoriteCourseIds: string[];
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  toggleFavorite: (courseId: string) => boolean;
  isFavorite: (courseId: string) => boolean;
  getFavoriteCourses: () => Course[];
  getFavoriteCount: () => number;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'user_info';
const STORAGE_KEY_FAVORITES = 'favorite_courses';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favoriteCourseIds, setFavoriteCourseIds] = useState<string[]>([]);

  useEffect(() => {
    const storedUser = getStorage<UserInfo>(STORAGE_KEY);
    if (storedUser) {
      console.log('[UserContext] 从本地存储恢复用户信息');
      setUserInfo(storedUser);
      setIsLoggedIn(true);
    }
    const storedFavorites = getStorage<string[]>(STORAGE_KEY_FAVORITES);
    if (storedFavorites) {
      console.log('[UserContext] 从本地存储恢复收藏课程:', storedFavorites.length, '门');
      setFavoriteCourseIds(storedFavorites);
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
    setFavoriteCourseIds([]);
    removeStorage(STORAGE_KEY);
    removeStorage(STORAGE_KEY_FAVORITES);
  };

  const updateUserInfo = (info: Partial<UserInfo>) => {
    if (userInfo) {
      const updatedInfo = { ...userInfo, ...info };
      console.log('[UserContext] 更新用户信息:', updatedInfo);
      setUserInfo(updatedInfo);
      setStorage(STORAGE_KEY, updatedInfo);
    }
  };

  const toggleFavorite = useCallback((courseId: string): boolean => {
    console.log('[UserContext] 切换收藏状态:', courseId);
    let isFav = false;
    setFavoriteCourseIds(prev => {
      const newFavorites = prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId];
      isFav = !prev.includes(courseId);
      setStorage(STORAGE_KEY_FAVORITES, newFavorites);
      console.log('[UserContext] 收藏状态更新:', isFav ? '已收藏' : '已取消', '共', newFavorites.length, '门');
      return newFavorites;
    });
    return isFav;
  }, []);

  const isFavorite = useCallback((courseId: string): boolean => {
    return favoriteCourseIds.includes(courseId);
  }, [favoriteCourseIds]);

  const getFavoriteCourses = useCallback((): Course[] => {
    return favoriteCourseIds
      .map(id => getCourseById(id))
      .filter((course): course is Course => course !== undefined);
  }, [favoriteCourseIds]);

  const getFavoriteCount = useCallback((): number => {
    return favoriteCourseIds.length;
  }, [favoriteCourseIds]);

  return (
    <UserContext.Provider value={{
      userInfo,
      isLoggedIn,
      favoriteCourseIds,
      login,
      logout,
      updateUserInfo,
      toggleFavorite,
      isFavorite,
      getFavoriteCourses,
      getFavoriteCount
    }}>
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

export const testUsers: Record<string, UserInfo> = {
  user_123: {
    id: 'user_123',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    nickName: '瑜伽爱好者',
    phone: '13812345678',
    gender: '女',
    birthday: '1995-06-15'
  },
  user_456: {
    id: 'user_456',
    avatarUrl: 'https://picsum.photos/id/65/200/200',
    nickName: '新用户小美',
    phone: '13987654321',
    gender: '女',
    birthday: '1998-03-20'
  },
  user_789: {
    id: 'user_789',
    avatarUrl: 'https://picsum.photos/id/91/200/200',
    nickName: '会员小王',
    phone: '13700001111',
    gender: '男',
    birthday: '1992-11-10'
  }
};

export const loginWithUserId = (userId: string): UserInfo | null => {
  return testUsers[userId] || null;
};
