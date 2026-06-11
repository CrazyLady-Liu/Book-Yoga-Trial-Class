import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Order } from '@/types';
import { formatDate, getStatusText, navigateTo } from '@/utils';
import { getCourseById } from '@/data/courses';

interface OrderCardProps {
  order: Order;
  onCancel?: () => void;
  onBookAgain?: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel, onBookAgain }) => {
  const handleCardClick = () => {
    console.log('[OrderCard] 点击订单:', order.orderNo);
    navigateTo(`/pages/order-detail/index?id=${order.id}`);
  };

  const handleImageError = () => {
    console.error('[OrderCard] 图片加载失败:', order.course.coverImage);
  };

  const getStatusClass = () => {
    switch (order.status) {
      case 'confirmed': return styles.statusConfirmed;
      case 'pending': return styles.statusPending;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusPending;
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel) {
      onCancel();
    }
  };

  const handleBookAgainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCourseFull()) {
      console.warn('[OrderCard] 名额已满，阻断再次预约流程');
      return;
    }
    if (onBookAgain) {
      onBookAgain(order);
    }
  };

  const isCourseFull = () => {
    const latestCourse = getCourseById(order.courseId);
    return !latestCourse || latestCourse.remainingSlots <= 0;
  };

  return (
    <View className={styles.orderCard} onClick={handleCardClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.orderNo}>订单号: {order.orderNo}</Text>
        <Text className={classnames(styles.status, getStatusClass())}>
          {getStatusText(order.status)}
        </Text>
      </View>

      <View className={styles.content}>
        <Image
          className={styles.cover}
          src={order.course.coverImage}
          mode='aspectFill'
          onError={handleImageError}
        />
        <View className={styles.info}>
          <Text className={styles.courseName}>{order.course.name}</Text>
          <View className={styles.infoRow}>
            <Text className={styles.icon}>📅</Text>
            <Text>{formatDate(order.course.date)} {order.course.startTime}-{order.course.endTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.icon}>📍</Text>
            <Text>{order.course.location}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.icon}>👩‍🏫</Text>
            <Text>{order.course.teacherName} 老师</Text>
          </View>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <Text className={styles.createTime}>创建时间: {order.createTime}</Text>
        <View className={styles.actionButtons}>
          {order.status === 'confirmed' && !order.isVerified && (
            <>
              <Button
                className={classnames(styles.btn, styles.btnOutline)}
                onClick={handleCancelClick}
              >
                取消预约
              </Button>
              <Button
                className={classnames(styles.btn, styles.btnPrimary)}
              >
                查看详情
              </Button>
            </>
          )}
          {order.status === 'completed' && (
            isCourseFull() ? (
              <View className={styles.btnTooltipWrapper}>
                <Button
                  className={classnames(styles.btn, styles.btnOutline, styles.btnDisabled)}
                  disabled
                >
                  再次预约
                </Button>
                <View className={styles.tooltip}>
                  <View className={styles.tooltipArrow} />
                  <Text className={styles.tooltipText}>本期课程名额已满，可查看其他排期</Text>
                </View>
              </View>
            ) : (
              <Button
                className={classnames(styles.btn, styles.btnOutline)}
                onClick={handleBookAgainClick}
              >
                再次预约
              </Button>
            )
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
