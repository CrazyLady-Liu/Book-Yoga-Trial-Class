import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import { Course } from '@/types';
import { courseList } from '@/data/courses';
import { showToast, switchTab, navigateTo } from '@/utils';

const categories = [
  { key: 'all', label: '全部' },
  { key: '哈他瑜伽', label: '哈他瑜伽' },
  { key: '流瑜伽', label: '流瑜伽' },
  { key: '阴瑜伽', label: '阴瑜伽' },
  { key: '阿斯汤加', label: '阿斯汤加' },
  { key: '普拉提', label: '普拉提' },
  { key: '空中瑜伽', label: '空中瑜伽' },
  { key: '理疗瑜伽', label: '理疗瑜伽' }
];

const levels = [
  { key: 'all', label: '全部' },
  { key: '初级', label: '初级' },
  { key: '中级', label: '中级' },
  { key: '高级', label: '高级' }
];

const sortOptions = [
  { key: 'time', label: '时间最近' },
  { key: 'hot', label: '热度最高' },
  { key: 'price', label: '价格最低' }
];

interface CouponFilterInfo {
  couponId: string;
  couponType: string;
  couponValue: number;
  minAmount: number;
  scope: string;
  categories?: string[];
  courseIds?: string[];
}

const CoursesPage: React.FC = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [couponFilter, setCouponFilter] = useState<CouponFilterInfo | null>(null);

  const loadData = useCallback(() => {
    console.log('[CoursesPage] 加载课程列表');
    try {
      setCourses([...courseList]);
    } catch (error) {
      console.error('[CoursesPage] 加载数据失败:', error);
      showToast('数据加载失败', 'error');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    console.log('[CoursesPage] 页面显示');
    loadData();
  });

  useEffect(() => {
    const params = router.params;
    if (params.couponId && params.couponType === 'cash') {
      const filterInfo: CouponFilterInfo = {
        couponId: params.couponId,
        couponType: params.couponType,
        couponValue: Number(params.couponValue),
        minAmount: Number(params.minAmount),
        scope: params.scope || 'all',
        categories: params.categories ? params.categories.split(',') : undefined,
        courseIds: params.courseIds ? params.courseIds.split(',') : undefined
      };
      setCouponFilter(filterInfo);

      if (filterInfo.scope === 'category' && filterInfo.categories?.length) {
        const matchCat = filterInfo.categories[0];
        const found = categories.find(c => c.key === matchCat);
        if (found) {
          setActiveCategory(matchCat);
        }
      }
    } else {
      setCouponFilter(null);
    }
  }, [router.params]);

  usePullDownRefresh(() => {
    console.log('[CoursesPage] 下拉刷新');
    setIsRefreshing(true);
    loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (couponFilter) {
      result = result.filter(c => {
        if (c.price < couponFilter.minAmount) {
          return false;
        }
        if (couponFilter.scope === 'category' && couponFilter.categories?.length) {
          const hasMatch = couponFilter.categories.some(cat =>
            c.name.includes(cat) || c.tags.includes(cat)
          );
          if (!hasMatch) return false;
        }
        if (couponFilter.scope === 'course' && couponFilter.courseIds?.length) {
          if (!couponFilter.courseIds.includes(c.id)) return false;
        }
        return true;
      });
    }

    if (activeCategory !== 'all') {
      result = result.filter(c => c.name.includes(activeCategory) || c.tags.includes(activeCategory));
    }

    if (activeLevel !== 'all') {
      result = result.filter(c => c.level === activeLevel);
    }

    switch (sortBy) {
      case 'time':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'hot':
        result.sort((a, b) => {
          if (a.isHot && !b.isHot) return -1;
          if (!a.isHot && b.isHot) return 1;
          return (b.totalSlots - b.remainingSlots) - (a.totalSlots - a.remainingSlots);
        });
        break;
      case 'price':
        result.sort((a, b) => a.price - b.price);
        break;
    }

    console.log(`[CoursesPage] 筛选结果: ${result.length}条, 分类: ${activeCategory}, 难度: ${activeLevel}, 排序: ${sortBy}`);
    return result;
  }, [courses, activeCategory, activeLevel, sortBy, couponFilter]);

  const handleCategoryChange = (key: string) => {
    console.log('[CoursesPage] 切换分类:', key);
    setActiveCategory(key);
  };

  const handleLevelChange = (key: string) => {
    console.log('[CoursesPage] 切换难度:', key);
    setActiveLevel(key);
  };

  const handleSortChange = () => {
    const currentIndex = sortOptions.findIndex(o => o.key === sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    console.log('[CoursesPage] 切换排序:', sortOptions[nextIndex].key);
    setSortBy(sortOptions[nextIndex].key);
  };

  const handleGoHome = () => {
    switchTab('/pages/home/index');
  };

  const handleDismissCouponTip = () => {
    setCouponFilter(null);
  };

  const handleCourseClick = (course: Course) => {
    let url = `/pages/booking-form/index?courseId=${course.id}`;
    if (couponFilter) {
      url += `&preselectedCouponId=${encodeURIComponent(couponFilter.couponId)}`;
    }
    navigateTo(url);
  };

  return (
    <View className={styles.page}>
      <View className={styles.stickyHeader}>
        {couponFilter && (
          <View className={styles.couponTipBar}>
            <View className={styles.couponTipContent}>
              <Text className={styles.couponTipIcon}>🎫</Text>
              <Text className={styles.couponTipText}>
                当前使用满{couponFilter.minAmount}减{couponFilter.couponValue}优惠券，订单满{couponFilter.minAmount}元可抵扣
              </Text>
            </View>
            <Text className={styles.couponTipClose} onClick={handleDismissCouponTip}>✕</Text>
          </View>
        )}

        <View className={styles.filterBar}>
        <ScrollView className={styles.categoryScroll} scrollX>
          {categories.map(cat => (
            <Text
              key={cat.key}
              className={classnames(
                styles.categoryItem,
                activeCategory === cat.key && styles.categoryItemActive
              )}
              onClick={() => handleCategoryChange(cat.key)}
            >
              {cat.label}
            </Text>
          ))}
        </ScrollView>

        <View className={styles.subFilter}>
          <View className={styles.filterGroup}>
            {levels.slice(0, 4).map(level => (
              <Button
                key={level.key}
                className={classnames(
                  styles.filterBtn,
                  activeLevel === level.key && styles.filterBtnActive
                )}
                onClick={() => handleLevelChange(level.key)}
              >
                {level.label}
              </Button>
            ))}
          </View>
          <View className={styles.sortSelect} onClick={handleSortChange}>
            <Text>{sortOptions.find(o => o.key === sortBy)?.label}</Text>
            <Text className={styles.sortIcon}>↕</Text>
          </View>
        </View>
      </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <View key={course.id} className={styles.courseItem}>
              <CourseCard
                course={course}
                {...(couponFilter ? { onClick: () => handleCourseClick(course) } : {})}
              />
            </View>
          ))
        ) : (
          <EmptyState
            icon='🧘'
            title='暂无符合条件的课程'
            description='试试其他筛选条件，或去首页看看推荐课程吧~'
            actionText='返回首页'
            onAction={handleGoHome}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default CoursesPage;
