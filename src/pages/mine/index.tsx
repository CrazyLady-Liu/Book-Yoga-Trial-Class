import React, { useMemo } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { useUser } from '@/store/UserContext';
import { getOrders } from '@/data/orders';
import { showToast, showModal, navigateTo, switchTab } from '@/utils';

const menuItems = [
  { icon: '📅', text: '我的预约', action: () => switchTab('/pages/orders/index') },
  { icon: '⭐', text: '收藏课程', action: () => showToast('功能开发中') },
  { icon: '🎫', text: '优惠券', action: () => showToast('功能开发中') },
  { icon: '💬', text: '我的评价', action: () => showToast('功能开发中') }
];

const settingItems = [
  { icon: '⚙️', text: '账号设置', action: () => showToast('功能开发中') },
  { icon: '📞', text: '联系客服', action: () => showToast('功能开发中') },
  { icon: '📖', text: '关于我们', action: () => showToast('功能开发中') }
];

const MinePage: React.FC = () => {
  const { userInfo, isLoggedIn, logout } = useUser();

  const stats = useMemo(() => {
    if (!isLoggedIn) {
      return { total: 0, completed: 0, cancelled: 0 };
    }
    const orders = getOrders();
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
  }, [isLoggedIn]);

  const handleLogin = () => {
    console.log('[MinePage] 点击登录');
    navigateTo('/pages/login/index');
  };

  const handleLogout = async () => {
    console.log('[MinePage] 点击退出登录');
    const confirmed = await showModal(
      '退出登录',
      '确定要退出登录吗？',
      { confirmText: '确定退出', cancelText: '取消' }
    );
    
    if (confirmed) {
      logout();
      showToast('已退出登录', 'success');
    }
  };

  const handleImageError = () => {
    console.error('[MinePage] 图片加载失败');
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          {isLoggedIn && userInfo ? (
            <>
              <Image
                className={styles.avatar}
                src={userInfo.avatarUrl}
                mode='aspectFill'
                onError={handleImageError}
              />
              <View className={styles.userDetail}>
                <Text className={styles.nickName}>{userInfo.nickName}</Text>
                <Text className={styles.phone}>{userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>
              </View>
            </>
          ) : (
            <>
              <View className={styles.avatar} />
              <View className={styles.userDetail}>
                <Text className={styles.nickName}>未登录</Text>
                <Text className={styles.phone}>登录后查看更多功能</Text>
              </View>
              <Button className={styles.loginBtn} onClick={handleLogin}>
                登录 / 注册
              </Button>
            </>
          )}
        </View>

        {isLoggedIn && (
          <View className={styles.stats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.total}</Text>
              <Text className={styles.statLabel}>总预约</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.completed}</Text>
              <Text className={styles.statLabel}>已完成</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.cancelled}</Text>
              <Text className={styles.statLabel}>已取消</Text>
            </View>
          </View>
        )}
      </View>

      {isLoggedIn && (
        <>
          <View className={styles.menuSection}>
            <Text className={styles.menuTitle}>我的服务</Text>
            {menuItems.map((item, index) => (
              <View
                key={index}
                className={styles.menuItem}
                onClick={item.action}
              >
                <View className={styles.menuIcon}>{item.icon}</View>
                <Text className={styles.menuText}>{item.text}</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>

          <View className={styles.menuSection}>
            <Text className={styles.menuTitle}>设置</Text>
            {settingItems.map((item, index) => (
              <View
                key={index}
                className={styles.menuItem}
                onClick={item.action}
              >
                <View className={styles.menuIcon}>{item.icon}</View>
                <Text className={styles.menuText}>{item.text}</Text>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>

          <View className={styles.logoutSection}>
            <Button className={styles.logoutBtn} onClick={handleLogout}>
              退出登录
            </Button>
          </View>
        </>
      )}

      <Text className={styles.version}>梵音瑜伽 v1.0.0</Text>
    </ScrollView>
  );
};

export default MinePage;
