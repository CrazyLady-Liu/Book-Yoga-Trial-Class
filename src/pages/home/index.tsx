import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import CourseCard from '@/components/CourseCard';
import { Course } from '@/types';
import { courseList, getHotCourses, getNewCourses } from '@/data/courses';
import { useUser } from '@/store/UserContext';
import { showToast, navigateTo, switchTab, formatDate } from '@/utils';

const banners = [
  {
    id: 1,
    image: 'https://picsum.photos/id/1025/750/400',
    title: '新人专享福利',
    desc: '首次体验课免费，限时领取'
  },
  {
    id: 2,
    image: 'https://picsum.photos/id/1018/750/400',
    title: '夏日瑜伽季',
    desc: '办卡立减500元，更多好礼相送'
  },
  {
    id: 3,
    image: 'https://picsum.photos/id/1036/750/400',
    title: '名师工作坊',
    desc: '国际瑜伽大师亲临授课'
  }
];

const quickEntries = [
  { icon: '🧘', text: '全部课程', action: () => switchTab('/pages/courses/index') },
  { icon: '📅', text: '我的预约', action: () => switchTab('/pages/orders/index') },
  { icon: '⭐', text: '收藏课程', action: () => showToast('功能开发中') },
  { icon: '🎁', text: '会员中心', action: () => showToast('功能开发中') }
];

const HomePage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [hotCourses, setHotCourses] = useState<Course[]>([]);
  const [newCourses, setNewCourses] = useState<Course[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(() => {
    console.log('[HomePage] 加载首页数据');
    try {
      setHotCourses(getHotCourses());
      setNewCourses(getNewCourses());
    } catch (error) {
      console.error('[HomePage] 加载数据失败:', error);
      showToast('数据加载失败', 'error');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    console.log('[HomePage] 页面显示');
    loadData();
  });

  usePullDownRefresh(() => {
    console.log('[HomePage] 下拉刷新');
    setIsRefreshing(true);
    loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const handleLoginClick = () => {
    console.log('[HomePage] 点击登录');
    navigateTo('/pages/login/index');
  };

  const handleCourseClick = (courseId: string) => {
    console.log('[HomePage] 点击课程:', courseId);
    navigateTo(`/pages/course-detail/index?id=${courseId}`);
  };

  const handleSeeMore = () => {
    console.log('[HomePage] 查看更多课程');
    switchTab('/pages/courses/index');
  };

  const handleImageError = () => {
    console.error('[HomePage] 图片加载失败');
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.topBar}>
          <View>
            <Text className={styles.brand}>梵音瑜伽</Text>
            <Text className={styles.subBrand}>ॐ 感受身心的宁静</Text>
          </View>
          {!isLoggedIn ? (
            <Button className={styles.loginBtn} onClick={handleLoginClick}>
              登录 / 注册
            </Button>
          ) : (
            <Button className={styles.loginBtn} onClick={() => switchTab('/pages/mine/index')}>
              {userInfo?.nickName || '我的'}
            </Button>
          )}
        </View>
        {isLoggedIn && userInfo && (
          <View>
            <Text className={styles.greeting}>您好，{userInfo.nickName} 👋</Text>
            <Text className={styles.slogan}>开启今天的瑜伽之旅吧~</Text>
          </View>
        )}
      </View>

      <View className={styles.bannerSection}>
        <Swiper
          className={styles.bannerSwiper}
          autoplay
          circular
          indicatorDots
          indicatorColor='rgba(255,255,255,0.5)'
          indicatorActiveColor='#ffffff'
          interval={3000}
          duration={500}
        >
          {banners.map(banner => (
            <SwiperItem key={banner.id}>
              <View className={styles.bannerItem}>
                <Image
                  className={styles.bannerImage}
                  src={banner.image}
                  mode='aspectFill'
                  onError={handleImageError}
                />
                <View className={styles.bannerOverlay}>
                  <Text className={styles.bannerTitle}>{banner.title}</Text>
                  <Text className={styles.bannerDesc}>{banner.desc}</Text>
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      <View className={styles.quickEntry}>
        {quickEntries.map((entry, index) => (
          <View
            key={index}
            className={styles.entryItem}
            onClick={entry.action}
          >
            <View className={styles.entryIcon}>{entry.icon}</View>
            <Text className={styles.entryText}>{entry.text}</Text>
          </View>
        ))}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>热门推荐</Text>
        <Text className={styles.seeMore} onClick={handleSeeMore}>
          查看更多 →
        </Text>
      </View>

      <View className={styles.courseList}>
        {hotCourses.map(course => (
          <View key={course.id} className={styles.courseItem}>
            <CourseCard course={course} />
          </View>
        ))}
      </View>

      <View className={styles.newCourseSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>新课上线</Text>
          <Text className={styles.seeMore} onClick={handleSeeMore}>
            查看更多 →
          </Text>
        </View>

        <ScrollView className={styles.newCourseScroll} scrollX>
          {newCourses.map(course => (
            <View
              key={course.id}
              className={styles.newCourseCard}
              onClick={() => handleCourseClick(course.id)}
            >
              <Image
                className={styles.newCourseCover}
                src={course.coverImage}
                mode='aspectFill'
                onError={handleImageError}
              />
              <View className={styles.newCourseContent}>
                <Text className={styles.newCourseName}>{course.name}</Text>
                <View className={styles.newCourseMeta}>
                  <Text>{formatDate(course.date)}</Text>
                  <Text className={styles.newCoursePrice}>
                    ¥{course.price === 0 ? '0' : course.price}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default HomePage;
