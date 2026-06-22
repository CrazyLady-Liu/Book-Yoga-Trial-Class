import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserInfo, Course } from '@/types';
import { getStorage, setStorage, removeStorage } from '@/utils';
import { getCourseById } from '@/data/courses';

interface UserContextType {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  favoriteCourseIds: string[];
  hasSeenFavoriteGuide: boolean;
  login: (userInfo: UserInfo) => void;
  logout: () => void;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  toggleFavorite: (courseId: string) => boolean;
  isFavorite: (courseId: string) => boolean;
  getFavoriteCourses: () => Course[];
  getFavoriteCount: () => number;
  markFavoriteGuideAsSeen: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'user_info';
const STORAGE_KEY_FAVORITES = 'favorite_courses';
const STORAGE_KEY_FAVORITE_GUIDE = 'favorite_guide_seen';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favoriteCourseIds, setFavoriteCourseIds] = useState<string[]>([]);
  const [hasSeenFavoriteGuide, setHasSeenFavoriteGuide] = useState(false);

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
    const storedGuide = getStorage<boolean>(STORAGE_KEY_FAVORITE_GUIDE);
    if (storedGuide) {
      console.log('[UserContext] 已查看过收藏引导');
      setHasSeenFavoriteGuide(true);
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
    setHasSeenFavoriteGuide(false);
    removeStorage(STORAGE_KEY);
    removeStorage(STORAGE_KEY_FAVORITES);
    removeStorage(STORAGE_KEY_FAVORITE_GUIDE);
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
    const isCurrentlyFavorited = favoriteCourseIds.includes(courseId);
    const isNowFavorited = !isCurrentlyFavorited;
    
    let newFavorites: string[];
    if (isCurrentlyFavorited) {
      newFavorites = favoriteCourseIds.filter(id => id !== courseId);
    } else {
      newFavorites = [...favoriteCourseIds, courseId];
    }
    
    setFavoriteCourseIds(newFavorites);
    setStorage(STORAGE_KEY_FAVORITES, newFavorites);
    console.log('[UserContext] 收藏状态更新:', isNowFavorited ? '已收藏' : '已取消', '共', newFavorites.length, '门');
    return isNowFavorited;
  }, [favoriteCourseIds]);

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

  const markFavoriteGuideAsSeen = useCallback(() => {
    console.log('[UserContext] 标记收藏引导为已查看');
    setHasSeenFavoriteGuide(true);
    setStorage(STORAGE_KEY_FAVORITE_GUIDE, true);
  }, []);

  return (
    <UserContext.Provider value={{
      userInfo,
      isLoggedIn,
      favoriteCourseIds,
      hasSeenFavoriteGuide,
      login,
      logout,
      updateUserInfo,
      toggleFavorite,
      isFavorite,
      getFavoriteCourses,
      getFavoriteCount,
      markFavoriteGuideAsSeen
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

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0U5RTVGRiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzNCIgZmlsbD0iIjdDNUNGRiIvPjxwYXRoIGQ9Ik00MCAxNzAgQzQwIDEzMCAxNjAgMTMwIDE2MCAxNzAgTDE2MCAyMDAgTDQwIDIwMCBaIiBmaWxsPSIjN0M1Q0ZGIi8+PC9zdmc+';
const AVATAR_1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZDRTJGNSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzNCIgZmlsbD0iI0U5MUU2MyIvPjxwYXRoIGQ9Ik00MCAxNzAgQzQwIDEzMCAxNjAgMTMwIDE2MCAxNzAgTDE2MCAyMDAgTDQwIDIwMCBaIiBmaWxsPSIjRTkxRTYzIi8+PC9zdmc+';
const AVATAR_2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0RDRkZFQiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzNCIgZmlsbD0iIzRBQ0Y1MCIvPjxwYXRoIGQ9Ik00MCAxNzAgQzQwIDEzMCAxNjAgMTMwIDE2MCAxNzAgTDE2MCAyMDAgTDQwIDIwMCBaIiBmaWxsPSIjNEFDRjUwIi8+PC9zdmc+';
const AVATAR_3 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGRTVDQyIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzNCIgZmlsbD0iI0ZGQjMwMCIvPjxwYXRoIGQ9Ik00MCAxNzAgQzQwIDEzMCAxNjAgMTMwIDE2MCAxNzAgTDE2MCAyMDAgTDQwIDIwMCBaIiBmaWxsPSIjRkZCMzAwIi8+PC9zdmc+';

export const defaultUserInfo: UserInfo = {
  id: '',
  avatarUrl: DEFAULT_AVATAR,
  nickName: '',
  phone: '',
  gender: '女',
  birthday: '1995-01-01'
};

export const mockLogin = (): UserInfo => {
  return {
    id: 'user_123',
    avatarUrl: AVATAR_1,
    nickName: '瑜伽爱好者',
    phone: '13812345678',
    gender: '女',
    birthday: '1995-06-15'
  };
};

export const testUsers: Record<string, UserInfo> = {
  user_123: {
    id: 'user_123',
    avatarUrl: AVATAR_1,
    nickName: '瑜伽爱好者',
    phone: '13812345678',
    gender: '女',
    birthday: '1995-06-15'
  },
  user_456: {
    id: 'user_456',
    avatarUrl: AVATAR_2,
    nickName: '新用户小美',
    phone: '13987654321',
    gender: '女',
    birthday: '1998-03-20'
  },
  user_789: {
    id: 'user_789',
    avatarUrl: AVATAR_3,
    nickName: '会员小王',
    phone: '13700001111',
    gender: '男',
    birthday: '1992-11-10'
  }
};

export const loginWithUserId = (userId: string): UserInfo | null => {
  return testUsers[userId] || null;
};
