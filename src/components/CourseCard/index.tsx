import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Course } from '@/types';
import { formatDate, navigateTo, showToast } from '@/utils';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const handleClick = () => {
    if (course.isOffline) {
      showToast('课程已下架', 'none');
      return;
    }
    if (onClick) {
      onClick();
    } else {
      console.log('[CourseCard] 点击课程:', course.name);
      navigateTo(`/pages/course-detail/index?id=${course.id}`);
    }
  };

  const handleImageError = () => {
    console.error('[CourseCard] 图片加载失败:', course.coverImage);
  };

  return (
    <View className={classnames(styles.courseCard, course.isOffline && styles.offline)} onClick={handleClick}>
      <View className={styles.coverContainer}>
        <Image
          className={styles.coverImage}
          src={course.coverImage}
          mode='aspectFill'
          onError={handleImageError}
        />
        <View className={styles.tagContainer}>
          {course.isOffline && (
            <Text className={classnames(styles.tag, styles.offlineTag)}>课程已下架</Text>
          )}
          {!course.isOffline && course.isHot && (
            <Text className={classnames(styles.tag, styles.hotTag)}>热门</Text>
          )}
          {!course.isOffline && course.isNew && (
            <Text className={classnames(styles.tag, styles.newTag)}>新课</Text>
          )}
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.courseName}>{course.name}</Text>
          <Text className={styles.levelTag}>{course.level}</Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>📅</Text>
          <Text>{formatDate(course.date)} {course.startTime}-{course.endTime}</Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>📍</Text>
          <Text className={classnames(styles.location)}>{course.location}</Text>
        </View>

        <View className={styles.teacherInfo}>
          <Image
            className={styles.teacherAvatar}
            src={course.teacherAvatar}
            mode='aspectFill'
            onError={handleImageError}
          />
          <View>
            <Text className={styles.teacherName}>{course.teacherName}</Text>
            <Text className={styles.infoRow} style={{ marginBottom: 0, marginTop: 4 }}>
              <Text className={styles.infoIcon}>👤</Text>
              <Text style={{ fontSize: 24 }}>{course.teacherIntro.slice(0, 30)}...</Text>
            </Text>
          </View>
        </View>

        <View className={styles.footer}>
          <View className={styles.priceSection}>
            <Text className={styles.priceLabel}>¥</Text>
            <Text className={styles.price}>{course.price === 0 ? '0' : course.price}</Text>
            <Text className={styles.originalPrice}>¥{course.originalPrice}</Text>
          </View>
          <View className={styles.slots}>
            剩余 <Text className={styles.remaining}>{course.remainingSlots}</Text> 个名额
          </View>
        </View>
      </View>
    </View>
  );
};

export default CourseCard;
