import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Order } from '@/types';
import { getOrderById, cancelOrder, verifyOrder } from '@/data/orders';
import { getCourseById } from '@/data/courses';
import {
  formatDate,
  getStatusText,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  navigateBack,
  navigateTo,
  switchTab
} from '@/utils';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = router.params.id as string;

  const loadData = useCallback(() => {
    console.log('[OrderDetailPage] 加载订单详情, ID:', orderId);
    setLoading(true);
    try {
      const data = getOrderById(orderId);
      if (data) {
        setOrder(data);
        console.log('[OrderDetailPage] 订单信息:', data.orderNo, '状态:', data.status);
      } else {
        console.error('[OrderDetailPage] 订单不存在:', orderId);
        showToast('订单不存在', 'error');
        setTimeout(() => navigateBack(), 1500);
      }
    } catch (error) {
      console.error('[OrderDetailPage] 加载失败:', error);
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    if (orderId) {
      loadData();
    }
  });

  const handleCancelOrder = async () => {
    if (!order) return;
    console.log('[OrderDetailPage] 取消订单:', order.id);

    const confirmed = await showModal(
      '取消预约',
      `确定要取消"${order.course.name}"的预约吗？\n取消后名额将释放给其他学员。`,
      { confirmText: '确定取消', cancelText: '再想想' }
    );

    if (!confirmed) return;

    showLoading('处理中...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = cancelOrder(order.id, '用户主动取消');
      if (success) {
        hideLoading();
        showToast('取消成功', 'success');
        loadData();
      } else {
        hideLoading();
        showToast('取消失败，请重试', 'error');
      }
    } catch (error) {
      console.error('[OrderDetailPage] 取消订单失败:', error);
      hideLoading();
      showToast('取消失败，请重试', 'error');
    }
  };

  const handleVerifyOrder = async () => {
    if (!order) return;
    console.log('[OrderDetailPage] 核销订单:', order.id);

    const confirmed = await showModal(
      '确认核销',
      '请确认您已到店并准备上课，确认核销后订单将标记为已完成。',
      { confirmText: '确认核销', cancelText: '取消' }
    );

    if (!confirmed) return;

    showLoading('核销中...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = verifyOrder(order.id);
      if (success) {
        hideLoading();
        showToast('核销成功，祝您上课愉快！', 'success');
        loadData();
      } else {
        hideLoading();
        showToast('核销失败，请重试', 'error');
      }
    } catch (error) {
      console.error('[OrderDetailPage] 核销失败:', error);
      hideLoading();
      showToast('核销失败，请重试', 'error');
    }
  };

  const handleBookAgain = async () => {
    if (!order) return;

    const latestCourse = getCourseById(order.courseId);
    if (!latestCourse || latestCourse.remainingSlots <= 0) {
      showToast('本期课程名额已满，可查看其他排期', 'none');
      return;
    }

    const confirmed = await showModal(
      '再次预约',
      `是否再次预约${order.course.teacherName}老师的${order.course.name}？`,
      { confirmText: '确认', cancelText: '取消' }
    );

    if (!confirmed) return;

    console.log('[OrderDetailPage] 再次预约课程, courseId:', order.courseId);
    navigateTo(`/pages/course-detail/index?id=${order.courseId}`);
  };

  const isCourseFull = (): boolean => {
    if (!order) return false;
    const latestCourse = getCourseById(order.courseId);
    return !latestCourse || latestCourse.remainingSlots <= 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getStatusDescription = (order: Order) => {
    switch (order.status) {
      case 'confirmed':
        return order.isVerified ? '请准时到店，出示核销码给前台即可' : '请提前15分钟到店，出示下方核销码';
      case 'pending':
        return '预约正在确认中，请耐心等待';
      case 'completed':
        return '感谢您的参与，期待下次再见！';
      case 'cancelled':
        return '预约已取消，名额已释放';
      default:
        return '';
    }
  };

  const handleImageError = () => {
    console.error('[OrderDetailPage] 图片加载失败');
  };

  if (loading || !order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center', color: '#9CA3AF' }}>
          加载中...
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.statusBanner}>
        <View className={styles.statusRow}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text className={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
            <Text className={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
        <Text className={styles.statusDesc}>{getStatusDescription(order)}</Text>

        {order.status === 'confirmed' && !order.isVerified && (
          <View className={styles.verifyCodeBox}>
            <Text className={styles.verifyLabel}>到店核销码</Text>
            <Text className={styles.verifyCode}>{order.verifyCode}</Text>
            <Text className={styles.verifyTip}>向工作人员出示此码核销</Text>
          </View>
        )}
      </View>

      <ScrollView scrollY>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>🧘</Text>
            课程信息
          </Text>

          <View className={styles.courseInfo}>
            <Image
              className={styles.cover}
              src={order.course.coverImage}
              mode='aspectFill'
              onError={handleImageError}
            />
            <View className={styles.info}>
              <Text className={styles.courseName}>{order.course.name}</Text>
              <Text className={styles.levelTag}>{order.course.level}</Text>
              <Text className={styles.teacher}>{order.course.teacherName} 老师授课</Text>
            </View>
          </View>

          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>上课时间</Text>
              <Text className={classnames(styles.value, styles.valueHighlight)}>
                {formatDate(order.course.date)} {order.course.startTime}-{order.course.endTime}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>上课地点</Text>
              <Text className={styles.value}>{order.course.location}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>课程时长</Text>
              <Text className={styles.value}>{order.course.duration} 分钟</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>详细地址</Text>
              <Text className={styles.value}>{order.course.address}</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📝</Text>
            预约信息
          </Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>预约人</Text>
              <Text className={styles.value}>{order.bookingInfo.name}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>联系电话</Text>
              <Text className={styles.value}>{order.bookingInfo.phone}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>性别</Text>
              <Text className={styles.value}>{order.bookingInfo.gender}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>出生日期</Text>
              <Text className={styles.value}>{order.bookingInfo.birthday}</Text>
            </View>
            {order.bookingInfo.remark && (
              <View className={styles.infoItem}>
                <Text className={styles.label}>备注</Text>
                <Text className={styles.value}>{order.bookingInfo.remark}</Text>
              </View>
            )}
          </View>
          {order.status === 'cancelled' && order.cancelReason && (
            <View className={styles.cancelReason}>
              <Text className={styles.reasonLabel}>取消原因</Text>
              <Text className={styles.reasonText}>{order.cancelReason}</Text>
            </View>
          )}
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📋</Text>
            订单信息
          </Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>订单编号</Text>
              <Text className={styles.value}>{order.orderNo}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>创建时间</Text>
              <Text className={styles.value}>{order.createTime}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>订单金额</Text>
              <Text className={classnames(styles.value, styles.valueHighlight)}>
                ¥{order.course.price === 0 ? '0' : order.course.price}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.actionButtons}>
        {order.status === 'confirmed' && !order.isVerified && (
          <>
            <Button className={classnames(styles.btn, styles.btnCancel)} onClick={handleCancelOrder}>
              取消预约
            </Button>
            <Button className={classnames(styles.btn, styles.btnVerify)} onClick={handleVerifyOrder}>
              确认核销
            </Button>
          </>
        )}
        {order.status === 'confirmed' && order.isVerified && (
          <Button className={classnames(styles.btn, styles.btnFull)}>
            已核销，请准时上课
          </Button>
        )}
        {order.status === 'completed' && (
          isCourseFull() ? (
            <View className={styles.btnTooltipWrapper}>
              <Button
                className={classnames(styles.btn, styles.btnFull, styles.btnDisabled)}
                disabled
              >
                立即再次预约
              </Button>
              <View className={styles.tooltip}>
                <View className={styles.tooltipArrow} />
                <Text className={styles.tooltipText}>本期课程名额已满，可查看其他排期</Text>
              </View>
            </View>
          ) : (
            <Button className={classnames(styles.btn, styles.btnFull)} onClick={handleBookAgain}>
              立即再次预约
            </Button>
          )
        )}
        {order.status === 'cancelled' && (
          isCourseFull() ? (
            <View className={styles.btnTooltipWrapper}>
              <Button
                className={classnames(styles.btn, styles.btnFull, styles.btnDisabled)}
                disabled
              >
                立即再次预约
              </Button>
              <View className={styles.tooltip}>
                <View className={styles.tooltipArrow} />
                <Text className={styles.tooltipText}>本期课程名额已满，可查看其他排期</Text>
              </View>
            </View>
          ) : (
            <Button className={classnames(styles.btn, styles.btnFull)} onClick={handleBookAgain}>
              立即再次预约
            </Button>
          )
        )}
        {order.status === 'pending' && (
          <Button className={classnames(styles.btn, styles.btnFull)}>
            等待确认中...
          </Button>
        )}
      </View>
    </View>
  );
};

export default OrderDetailPage;
