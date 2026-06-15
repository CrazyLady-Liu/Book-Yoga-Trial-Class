import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Order } from '@/types';
import { getOrderById } from '@/data/orders';
import { formatDate, navigateTo, switchTab, navigateBack, showToast } from '@/utils';

const BookingSuccessPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = router.params.orderId as string;

  useEffect(() => {
    console.log('[BookingSuccessPage] 初始化, 订单ID:', orderId);
    
    const data = getOrderById(orderId);
    if (data) {
      setOrder(data);
      console.log('[BookingSuccessPage] 订单信息:', data.orderNo);
    } else {
      console.error('[BookingSuccessPage] 订单不存在');
      showToast('订单不存在', 'error');
    }
    setLoading(false);
  }, [orderId]);

  const handleViewOrder = () => {
    if (!order) return;
    console.log('[BookingSuccessPage] 查看订单详情:', order.id);
    navigateTo(`/pages/order-detail/index?id=${order.id}`);
  };

  const handleBackHome = () => {
    console.log('[BookingSuccessPage] 返回首页');
    switchTab('/pages/home/index');
  };

  const handleBack = () => {
    navigateBack(3);
  };

  if (loading || !order) {
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
      <View className={styles.successHeader}>
        <View className={styles.successIcon}>✅</View>
        <Text className={styles.successTitle}>预约成功</Text>
        <Text className={styles.successDesc}>我们会在开课前24小时提醒您</Text>
      </View>

      <ScrollView scrollY>
        <View className={styles.orderCard}>
          <Text className={styles.orderTitle}>预约信息</Text>
          
          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>课程名称</Text>
            <Text className={styles.orderValue}>{order.course.name}</Text>
          </View>

          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>上课时间</Text>
            <Text className={classnames(styles.orderValue, styles.highlight)}>
              {formatDate(order.course.date)} {order.course.startTime}-{order.course.endTime}
            </Text>
          </View>

          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>上课地点</Text>
            <Text className={styles.orderValue}>{order.course.location}</Text>
          </View>

          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>授课导师</Text>
            <Text className={styles.orderValue}>{order.course.teacherName} 老师</Text>
          </View>

          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>预约人</Text>
            <Text className={styles.orderValue}>{order.bookingInfo.name}</Text>
          </View>

          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>联系电话</Text>
            <Text className={styles.orderValue}>{order.bookingInfo.phone}</Text>
          </View>

          <View className={styles.orderItem}>
            <Text className={styles.orderLabel}>订单编号</Text>
            <Text className={styles.orderValue} style={{ fontSize: 24 }}>{order.orderNo}</Text>
          </View>
        </View>

        <View className={styles.priceCard}>
          <Text className={styles.priceTitle}>订单金额</Text>
          
          <View className={styles.priceRow}>
            <Text className={styles.priceLabel}>原价</Text>
            <Text className={styles.originalPrice}>¥{order.originalPrice}</Text>
          </View>

          {order.discountAmount > 0 && (
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>
                {order.couponName ? `${order.couponName}` : '优惠减免'}
              </Text>
              <Text className={styles.discountPrice}>-¥{order.discountAmount}</Text>
            </View>
          )}

          <View className={styles.priceDivider} />

          <View className={styles.priceRow}>
            <Text className={styles.priceLabel}>实付金额</Text>
            <Text className={styles.finalPrice}>¥{order.finalPrice}</Text>
          </View>
        </View>

        <View className={styles.reminderSection}>
          <Text className={styles.reminderTitle}>
            <Text className={styles.reminderIcon}>⏰</Text>
            预约提醒
          </Text>
          
          <View className={styles.reminderItem}>
            <View className={styles.reminderDot} />
            <Text className={styles.reminderText}>
              开课前24小时将通过微信消息提醒您上课，请保持微信通知开启
            </Text>
          </View>

          <View className={styles.reminderItem}>
            <View className={styles.reminderDot} />
            <Text className={styles.reminderText}>
              请提前15分钟到达场馆，携带舒适的运动服装
            </Text>
          </View>

          <View className={styles.reminderItem}>
            <View className={styles.reminderDot} />
            <Text className={styles.reminderText}>
              如需取消预约，请提前24小时操作，避免影响您的预约信用
            </Text>
          </View>
        </View>

        <View className={styles.tipBox}>
          <Text className={styles.tipTitle}>
            <Text className={styles.tipIcon}>💡</Text>
            温馨提示
          </Text>
          <Text className={styles.tipContent}>
            首次体验课为免费体验，每人限预约一次。如您无法按时参加，请及时取消预约，将名额让给其他需要的学员。感谢您的配合！
          </Text>
        </View>
      </ScrollView>

      <View className={styles.actionButtons}>
        <Button className={styles.btnSecondary} onClick={handleBackHome}>
          返回首页
        </Button>
        <Button className={styles.btnPrimary} onClick={handleViewOrder}>
          查看订单
        </Button>
      </View>
    </View>
  );
};

export default BookingSuccessPage;
