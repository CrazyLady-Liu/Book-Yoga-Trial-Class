import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { UserCoupon, CouponStatus } from '@/types';
import { getUserCoupons, UserCouponsResult } from '@/data/coupons';
import { useUser } from '@/store/UserContext';
import { showToast, navigateTo, formatDate } from '@/utils';
import EmptyState from '@/components/EmptyState';

type TabType = 'available' | 'used' | 'expired';

const tabList: { key: TabType; text: string }[] = [
  { key: 'available', text: '未使用' },
  { key: 'used', text: '已使用' },
  { key: 'expired', text: '已过期' }
];

const CouponsPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [stats, setStats] = useState<UserCouponsResult['stats']>({
    available: 0,
    used: 0,
    expired: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCoupons = useCallback(
    (status: CouponStatus) => {
      if (!isLoggedIn || !userInfo) {
        setCoupons([]);
        setStats({ available: 0, used: 0, expired: 0 });
        return;
      }
      const result = getUserCoupons(userInfo.id, status, 1, 50);
      const { list, stats } = result;
      setCoupons(Array.isArray(list) ? list : []);
      setStats(stats || { available: 0, used: 0, expired: 0 });
    },
    [isLoggedIn, userInfo]
  );

  useDidShow(() => {
    loadCoupons(activeTab);
  });

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    loadCoupons(activeTab);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    loadCoupons(tab);
  };

  const handleUseCoupon = (coupon: UserCoupon) => {
    if (coupon.status !== 'available') return;
    navigateTo('/pages/courses/index');
  };

  const handleGoToCenter = () => {
    navigateTo('/pages/coupon-center/index');
  };

  const handleLogin = () => {
    navigateTo('/pages/login/index');
  };

  const formatCouponDate = (startTime: string, endTime: string) => {
    const start = formatDate(startTime);
    const end = formatDate(endTime);
    return `${start} - ${end}`;
  };

  const formatCouponValue = (coupon: UserCoupon) => {
    const { type, value, discount, minAmount } = coupon.coupon;
    switch (type) {
      case 'cash':
        return (
          <>
            <Text className={styles.couponValue}>
              <Text className={styles.symbol}>¥</Text>
              {value}
            </Text>
            <Text className={styles.couponCondition}>
              {minAmount > 0 ? `满${minAmount}可用` : '无门槛'}
            </Text>
          </>
        );
      case 'discount':
        return (
          <>
            <Text className={styles.couponValue}>
              {(discount! * 10).toFixed(1)}
              <Text className={styles.symbol}>折</Text>
            </Text>
            <Text className={styles.couponCondition}>
              {minAmount > 0 ? `满${minAmount}可用` : '无门槛'}
            </Text>
          </>
        );
      case 'free':
        return (
          <>
            <Text className={styles.couponValue}>
              免费
            </Text>
            <Text className={styles.couponCondition}>
              体验课专用
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.page}>
        <EmptyState
          icon='🔒'
          title='登录后查看优惠券'
          description='登录后即可查看和使用您的优惠券'
          actionText='立即登录'
          onAction={handleLogin}
        />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView className={styles.scrollView} scrollY>
        <View className={styles.header}>
          <View className={styles.stats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.available}</Text>
              <Text className={styles.statLabel}>未使用</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.used}</Text>
              <Text className={styles.statLabel}>已使用</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{stats.expired}</Text>
              <Text className={styles.statLabel}>已过期</Text>
            </View>
          </View>
        </View>

        <View className={styles.tabBar}>
          {tabList.map(tab => (
            <Text
              key={tab.key}
              className={classnames(
                styles.tabItem,
                activeTab === tab.key && styles.active
              )}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.text}
            </Text>
          ))}
        </View>

        {coupons.length > 0 ? (
          <View className={styles.couponList}>
            {coupons.map(userCoupon => (
              <View
                key={userCoupon.id}
                className={classnames(
                  styles.couponCard,
                  userCoupon.status !== 'available' && styles.disabled
                )}
                onClick={() => handleUseCoupon(userCoupon)}
              >
                <View
                  className={classnames(
                    styles.couponLeft,
                    userCoupon.coupon.type === 'discount' && styles.discount,
                    userCoupon.coupon.type === 'free' && styles.free
                  )}
                >
                  {formatCouponValue(userCoupon)}
                </View>
                <View className={styles.couponRight}>
                  {userCoupon.status === 'used' && (
                    <Text className={styles.usedTag}>已使用</Text>
                  )}
                  {userCoupon.status === 'expired' && (
                    <Text className={styles.expiredTag}>已过期</Text>
                  )}
                  <View className={styles.couponInfo}>
                    <Text className={styles.couponName}>
                      {userCoupon.coupon.name}
                    </Text>
                    <Text className={styles.couponDesc}>
                      {userCoupon.coupon.description}
                    </Text>
                  </View>
                  <View className={styles.couponMeta}>
                    <Text className={styles.couponDate}>
                      {formatCouponDate(
                        userCoupon.coupon.startTime,
                        userCoupon.coupon.endTime
                      )}
                    </Text>
                    {userCoupon.status === 'available' && (
                      <Button className={styles.couponAction}>
                        立即使用
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon='🎫'
            title={`暂无${activeTab === 'available' ? '未使用的' : activeTab === 'used' ? '已使用的' : '已过期的'}优惠券`}
            description={activeTab === 'available' ? '去领券中心领取更多优惠吧~' : '您还没有相关的优惠券记录'}
            actionText={activeTab === 'available' ? '去领券' : undefined}
            onAction={activeTab === 'available' ? handleGoToCenter : undefined}
          />
        )}
      </ScrollView>

      <View className={styles.goCenterBtn} onClick={handleGoToCenter}>
        <Text className={styles.icon}>🎁</Text>
        <Text className={styles.text}>领券中心</Text>
      </View>
    </View>
  );
};

export default CouponsPage;
