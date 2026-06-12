import React, { useMemo } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useUser } from '@/store/UserContext';
import { getOrders } from '@/data/orders';
import { showToast, showModal, navigateTo, switchTab } from '@/utils';

const menuItems = [
  { icon: '📅', text: '我的预约', action: () => switchTab('/pages/orders/index') },
  { icon: '⭐', text: '收藏课程', action: () => showToast('功能开发中') },
  { icon: '🎫', text: '优惠券', action: () => navigateTo('/pages/coupons/index') },
  { icon: '💬', text: '我的评价', action: () => showToast('功能开发中') }
];

const settingItems = [
  { icon: '⚙️', text: '账号设置', action: () => showToast('功能开发中') },
  { icon: '📞', text: '联系客服', action: () => showToast('功能开发中') },
  { icon: '📖', text: '关于我们', action: () => showToast('功能开发中') }
];

const loginBenefits = [
  { icon: '📋', title: '查看预约订单', desc: '随时查看课程预约记录' },
  { icon: '💳', title: '课时卡管理', desc: '会员卡余额课时一目了然' },
  { icon: '⭐', title: '收藏课程', desc: '喜欢的课程一键收藏' },
  { icon: '🎁', title: '专属优惠', desc: '会员专属优惠券和活动' }
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
    <View className={styles.page}>
      <ScrollView className={styles.scrollView} scrollY>
        <View className={styles.header}>
          {isLoggedIn && (
            <>
              <View className={styles.topBar}>
                <View className={styles.avatar}>
                  {userInfo && (
                    <Image
                      className={styles.avatarImg}
                      src={userInfo.avatarUrl}
                      mode='aspectFill'
                      onError={handleImageError}
                    />
                  )}
                </View>
                {userInfo && (
                  <View className={styles.userDetail}>
                    <Text className={styles.nickName}>{userInfo.nickName}</Text>
                    <Text className={styles.phone}>{userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>
                  </View>
                )}
              </View>

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
            </>
          )}
        </View>

        {isLoggedIn ? (
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
        ) : (
          <View className={styles.notLoginGuide}>
            <View className={styles.guideContent}>
              <View className={styles.guideIcon}>🧘</View>
              <Text className={styles.guideTitle}>开启您的瑜伽之旅</Text>
              <Text className={styles.guideSubtitle}>登录后解锁完整会员服务</Text>
              <Button className={styles.guideLoginBtn} onClick={handleLogin}>
                立即登录 / 注册
              </Button>
            </View>

            <View className={styles.benefitsSection}>
              <Text className={styles.benefitsTitle}>登录后可享受</Text>
              <View className={styles.benefitsGrid}>
                {loginBenefits.map((item, index) => (
                  <View key={index} className={styles.benefitItem}>
                    <View className={styles.benefitIcon}>{item.icon}</View>
                    <Text className={styles.benefitName}>{item.title}</Text>
                    <Text className={styles.benefitDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <Text className={styles.version}>梵音瑜伽 v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export default MinePage;
