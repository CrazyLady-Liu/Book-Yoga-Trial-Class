import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import { Order } from '@/types';
import { getOrders, cancelOrder } from '@/data/orders';
import { getCourseById } from '@/data/courses';
import { useUser } from '@/store/UserContext';
import { showToast, showModal, navigateTo, switchTab } from '@/utils';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'confirmed', label: '待上课' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
];

const OrdersPage: React.FC = () => {
  const { isLoggedIn } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(() => {
    console.log('[OrdersPage] 加载订单列表');
    try {
      const data = getOrders();
      console.log('[OrdersPage] 订单数据:', data.length, '条');
      setOrders(data);
    } catch (error) {
      console.error('[OrdersPage] 加载数据失败:', error);
      showToast('数据加载失败', 'error');
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, loadData]);

  useDidShow(() => {
    console.log('[OrdersPage] 页面显示');
    if (isLoggedIn) {
      loadData();
    }
  });

  usePullDownRefresh(() => {
    if (!isLoggedIn) {
      Taro.stopPullDownRefresh();
      return;
    }
    console.log('[OrdersPage] 下拉刷新');
    setIsRefreshing(true);
    loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === activeTab);
  }, [orders, activeTab]);

  const handleTabChange = (key: string) => {
    console.log('[OrdersPage] 切换订单状态:', key);
    setActiveTab(key);
  };

  const handleCancelOrder = async (order: Order) => {
    console.log('[OrdersPage] 取消订单:', order.id);
    const confirmed = await showModal(
      '取消预约',
      `确定要取消"${order.course.name}"的预约吗？`,
      { confirmText: '确定取消', cancelText: '再想想' }
    );
    
    if (confirmed) {
      const success = cancelOrder(order.id, '用户主动取消');
      if (success) {
        showToast('取消成功', 'success');
        loadData();
      } else {
        showToast('取消失败，请重试', 'error');
      }
    }
  };

  const handleGoLogin = () => {
    navigateTo('/pages/login/index');
  };

  const handleBookAgain = async (order: Order) => {
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

    console.log('[OrdersPage] 再次预约课程, courseId:', order.courseId);
    navigateTo(`/pages/course-detail/index?id=${order.courseId}`);
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
            description='登录后可查看您的预约订单'
            actionText='立即登录'
            onAction={handleGoLogin}
          />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={styles.tabItem}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text
              className={classnames(
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              )}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && (
              <View className={styles.tabIndicator} />
            )}
          </View>
        ))}
      </View>

      <ScrollView className={styles.content} scrollY>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={() => handleCancelOrder(order)}
              onBookAgain={handleBookAgain}
            />
          ))
        ) : (
          <EmptyState
            icon='📋'
            title='暂无订单'
            description={activeTab === 'all' ? '您还没有任何预约记录，快去预约体验课吧~' : `暂无${tabs.find(t => t.key === activeTab)?.label}的订单`}
            actionText='去预约课程'
            onAction={handleGoBook}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default OrdersPage;
