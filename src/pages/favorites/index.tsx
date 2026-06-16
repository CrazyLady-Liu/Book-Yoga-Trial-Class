import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, Text } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import { Course } from '@/types';
import { useUser } from '@/store/UserContext';
import { showToast, showModal, navigateTo, switchTab } from '@/utils';
import { getCourseById } from '@/data/courses';

const FavoritesPage: React.FC = () => {
  const { isLoggedIn, favoriteCourseIds, toggleFavorite } = useUser();
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const favorites = useMemo<Course[]>(() => {
    return favoriteCourseIds
      .map(id => getCourseById(id))
      .filter((course): course is Course => course !== undefined);
  }, [favoriteCourseIds]);

  const allSelected = useMemo(() => {
    return favorites.length > 0 && selectedIds.size === favorites.length;
  }, [favorites, selectedIds]);

  const selectedCount = selectedIds.size;

  useDidShow(() => {
    console.log('[FavoritesPage] 页面显示, 收藏课程:', favoriteCourseIds.length, '门');
  });

  usePullDownRefresh(() => {
    if (!isLoggedIn) {
      Taro.stopPullDownRefresh();
      return;
    }
    console.log('[FavoritesPage] 下拉刷新');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const enterBatchMode = () => {
    console.log('[FavoritesPage] 进入批量管理模式');
    setBatchMode(true);
    setSelectedIds(new Set());
  };

  const exitBatchMode = useCallback(() => {
    console.log('[FavoritesPage] 退出批量管理模式');
    setBatchMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleSelectCourse = (courseId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      console.log('[FavoritesPage] 取消全选');
      setSelectedIds(new Set());
    } else {
      console.log('[FavoritesPage] 全选');
      setSelectedIds(new Set(favorites.map(c => c.id)));
    }
  };

  const handleClearSelection = () => {
    console.log('[FavoritesPage] 取消选中，退出批量模式');
    exitBatchMode();
  };

  const handleBatchDelete = async () => {
    if (selectedCount === 0) {
      showToast('请先选择要删除的课程', 'none');
      return;
    }

    const confirmed = await showModal(
      '取消收藏',
      `确定取消选中 ${selectedCount} 门课程的收藏？`,
      { confirmText: '确定取消', cancelText: '再想想' }
    );

    if (confirmed) {
      console.log('[FavoritesPage] 批量删除收藏:', selectedIds.size, '门');
      selectedIds.forEach(id => {
        toggleFavorite(id);
      });
      showToast(`已取消 ${selectedCount} 门收藏`, 'success');
      exitBatchMode();
    }
  };

  const handleRemoveFavorite = async (course: Course, e: any) => {
    e.stopPropagation();
    if (batchMode) return;
    
    console.log('[FavoritesPage] 取消收藏课程:', course.id, course.name);
    const confirmed = await showModal(
      '取消收藏',
      `确定要取消收藏"${course.name}"吗？`,
      { confirmText: '确定取消', cancelText: '再想想' }
    );
    
    if (confirmed) {
      const isNowFavorited = toggleFavorite(course.id);
      if (!isNowFavorited) {
        showToast('已取消收藏', 'success');
      }
    }
  };

  const handleGoLogin = () => {
    navigateTo('/pages/login/index');
  };

  const handleGoBook = () => {
    switchTab('/pages/courses/index');
  };

  const handleEmptyAreaClick = () => {
    if (batchMode && selectedCount === 0) {
      exitBatchMode();
    }
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
    <View className={classnames(styles.page, batchMode && styles.batchMode)} onClick={handleEmptyAreaClick}>
      {batchMode && (
        <View className={styles.batchActionBar} onClick={e => e.stopPropagation()}>
          <View className={styles.batchActionLeft}>
            <View className={styles.batchActionBtn} onClick={handleSelectAll}>
              <Text className={styles.batchActionIcon}>{allSelected ? '☑' : '☐'}</Text>
              <Text className={styles.batchActionText}>{allSelected ? '取消全选' : '全选'}</Text>
            </View>
          </View>
          <View className={styles.batchActionRight}>
            <View className={classnames(styles.batchActionBtn, selectedCount === 0 && styles.disabled)} onClick={handleClearSelection}>
              <Text className={styles.batchActionText}>取消选中</Text>
            </View>
            <View className={classnames(styles.batchActionBtn, styles.deleteBtn, selectedCount === 0 && styles.disabled)} onClick={handleBatchDelete}>
              <Text className={styles.batchActionText}>删除选中收藏</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView className={classnames(styles.content, batchMode && styles.batchContent)} scrollY onClick={e => e.stopPropagation()}>
        {favorites.length > 0 ? (
          <>
            {!batchMode && (
              <View className={styles.header}>
                <Text className={styles.headerTitle}>我的收藏</Text>
                <View className={styles.manageBtn} onClick={enterBatchMode}>
                  <Text className={styles.manageBtnText}>管理</Text>
                </View>
              </View>
            )}
            <View className={styles.courseList}>
              {favorites.map(course => (
                <View key={course.id} className={styles.courseItem}>
                  <CourseCard
                    course={course}
                    batchMode={batchMode}
                    isSelected={selectedIds.has(course.id)}
                    onSelect={handleSelectCourse}
                  />
                  {!batchMode && (
                    <View style={{ textAlign: 'right', marginTop: -20, marginBottom: 20, position: 'relative', zIndex: 10 }}>
                      <View
                        className={styles.removeBtn}
                        onClick={(e) => handleRemoveFavorite(course, e)}
                      >
                        取消收藏
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
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
