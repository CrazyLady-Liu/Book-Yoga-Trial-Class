import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Order } from '@/types';
import { formatDate, getStatusText, navigateTo } from '@/utils';

interface OrderCardProps {
  order: Order;
  onCancel?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel }) => {
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
            <Button
              className={classnames(styles.btn, styles.btnOutline)}
            >
              再次预约
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
