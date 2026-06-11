import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Course } from '@/types';
import { getCourseById } from '@/data/courses';
import { useUser } from '@/store/UserContext';
import { formatDate, showToast, showLoading, hideLoading, navigateTo, navigateBack } from '@/utils';

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const courseId = router.params.id as string;

  const loadData = useCallback(() => {
    console.log('[CourseDetailPage] 加载课程详情, ID:', courseId);
    setLoading(true);
    try {
      setTimeout(() => {
        const data = getCourseById(courseId);
        if (data) {
          setCourse(data);
          console.log('[CourseDetailPage] 课程信息:', data.name);
        } else {
          console.error('[CourseDetailPage] 课程不存在:', courseId);
          showToast('课程不存在', 'error');
          setTimeout(() => navigateBack(), 1500);
        }
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('[CourseDetailPage] 加载失败:', error);
      setLoading(false);
      showToast('加载失败', 'error');
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    if (courseId) {
      const data = getCourseById(courseId);
      if (data) {
        setCourse(data);
      }
    }
  });

  const handleBook = () => {
    if (!isLoggedIn) {
      console.log('[CourseDetailPage] 未登录，跳转登录页');
      navigateTo('/pages/login/index');
      return;
    }

    if (!course) return;

    if (course.remainingSlots <= 0) {
      showToast('名额已满', 'none');
      return;
    }

    console.log('[CourseDetailPage] 点击预约:', course.name);
    navigateTo(`/pages/booking-form/index?courseId=${course.id}`);
  };

  const handleImageError = () => {
    console.error('[CourseDetailPage] 图片加载失败');
  };

  if (loading || !course) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center', color: '#86909C' }}>
          加载中...
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.coverContainer}>
          <Image
            className={styles.coverImage}
            src={course.coverImage}
            mode='aspectFill'
            onError={handleImageError}
          />
          <View className={styles.tagContainer}>
            {course.isHot && (
              <Text className={classnames(styles.tag, styles.hotTag)}>热门</Text>
            )}
            {course.isNew && (
              <Text className={classnames(styles.tag, styles.newTag)}>新课</Text>
            )}
          </View>
        </View>

        <View className={styles.content}>
          <View className={styles.basicInfo}>
            <Text className={styles.courseName}>{course.name}</Text>
            
            <View className={styles.metaRow}>
              <Text className={styles.levelTag}>{course.level}</Text>
              <View className={styles.priceSection}>
                <Text className={styles.priceLabel}>¥</Text>
                <Text className={styles.price}>{course.price === 0 ? '0' : course.price}</Text>
                <Text className={styles.originalPrice}>¥{course.originalPrice}</Text>
              </View>
            </View>

            <View className={styles.slotsInfo}>
              <Text className={styles.slotsText}>剩余名额</Text>
              <Text className={styles.slotsCount}>
                {course.remainingSlots} / {course.totalSlots} 位
              </Text>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>课程时间</Text>
            <View className={styles.infoItem}>
              <View className={styles.infoIcon}>📅</View>
              <View className={styles.infoContent}>
                <Text className={styles.infoLabel}>上课时间</Text>
                <Text className={styles.infoValue}>
                  {formatDate(course.date)} {course.startTime}-{course.endTime}
                </Text>
                <Text style={{ fontSize: 24, color: '#86909C', marginTop: 4 }}>
                  时长 {course.duration} 分钟
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>上课地点</Text>
            <View className={styles.infoItem}>
              <View className={styles.infoIcon}>📍</View>
              <View className={styles.infoContent}>
                <Text className={styles.infoLabel}>教室</Text>
                <Text className={styles.infoValue}>{course.location}</Text>
                <Text style={{ fontSize: 24, color: '#86909C', marginTop: 4 }}>
                  {course.address}
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>授课导师</Text>
            <View className={styles.teacherCard}>
              <Image
                className={styles.teacherAvatar}
                src={course.teacherAvatar}
                mode='aspectFill'
                onError={handleImageError}
              />
              <View className={styles.teacherInfo}>
                <Text className={styles.teacherName}>{course.teacherName}</Text>
                <Text className={styles.teacherTitle}>资深瑜伽导师</Text>
                <Text className={styles.teacherIntro}>{course.teacherIntro}</Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>课程介绍</Text>
            <Text className={styles.description}>{course.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.pricePreview}>
          <Text className={styles.pricePreviewLabel}>体验价</Text>
          <Text className={styles.pricePreviewValue}>
            ¥{course.price === 0 ? '0' : course.price}
          </Text>
        </View>
        {course.remainingSlots > 0 ? (
          <Button
            className={classnames(styles.bookBtn, !isLoggedIn && styles.disabled)}
            onClick={handleBook}
          >
            {isLoggedIn ? '立即预约' : '登录后预约'}
          </Button>
        ) : (
          <Button className={styles.fullBtn} disabled>
            名额已满
          </Button>
        )}
      </View>
    </View>
  );
};

export default CourseDetailPage;
