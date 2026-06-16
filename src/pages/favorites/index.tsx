import React, { useState, useCallback } from 'react';
import { View, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh, ITouchEvent } from '@tarojs/taro';
import styles from './index.module.scss';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import { Course } from '@/types';
import { useUser } from '@/store/UserContext';
import { showToast, showModal, navigateTo, switchTab } from '@/utils';

const FavoritesPage: React.FC = () => {
  const { isLoggedIn, getFavoriteCourses, toggleFavorite } = useUser();
  const [favorites, setFavorites] = useState<Course[]>([]);

  const loadData = useCallback(() => {
    console.log('[FavoritesPage] 加载收藏课程列表');
    try {
      const data = getFavoriteCourses();
      console.log('[FavoritesPage] 收藏课程数据:', data.length, '门');
      setFavorites(data);
    } catch (error) {
      console.error('[FavoritesPage] 加载数据失败:', error);
      showToast('数据加载失败', 'error');
    }
  }, [getFavoriteCourses]);

  useDidShow(() => {
    console.log('[FavoritesPage] 页面显示');
    if (isLoggedIn) {
      loadData();
    }
  });

  usePullDownRefresh(() => {
    if (!isLoggedIn) {
      Taro.stopPullDownRefresh();
      return;
    }
    console.log('[FavoritesPage] 下拉刷新');
    loadData();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const handleRemoveFavorite = async (course: Course, e: ITouchEvent) => {
    e.stopPropagation();
    console.log('[FavoritesPage] 取消收藏课程:', course.id, course.name);
    const confirmed = await showModal(
      '取消收藏',
      `确定要取消收藏"${course.name}"吗？`,
      { confirmText: '确定取消', cancelText: '再想想' }
    );
    
    if (confirmed) {
      toggleFavorite(course.id);
      showToast('已取消收藏', 'success');
      loadData();
    }
  };

  const handleGoLogin = () => {
    navigateTo('/pages/login/index');
  };

  const handleGoBook = () => {
    switchTab('/pages/courses/index');
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.page}>
        <View className={styles.loginTip}>
          <EmptyState
            icon='🔐'
            title='请先登录'
            description='登录后可查看您的收藏课程'
            actionText='立即登录'
            onAction={handleGoLogin}
          />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView className={styles.content} scrollY>
        {favorites.length > 0 ? (
          <View className={styles.courseList}>
            {favorites.map(course => (
              <View key={course.id}>
                <CourseCard course={course} />
                <View style={{ textAlign: 'right', marginTop: -20, marginBottom: 20, position: 'relative', zIndex: 10 }}>
                  <View
                    className={styles.removeBtn}
                    onClick={(e) => handleRemoveFavorite(course, e)}
                  >
                    取消收藏
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon='⭐'
            title='暂无收藏'
            description='您还没有收藏任何课程，快去发现喜欢的课程吧~'
            actionText='去浏览课程'
            onAction={handleGoBook}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default FavoritesPage;
