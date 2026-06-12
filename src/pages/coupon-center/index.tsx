import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Coupon } from '@/types';
import { getAvailableCoupons, receiveCoupon, getUserCoupons } from '@/data/coupons';
import { useUser } from '@/store/UserContext';
import { showToast, navigateTo, formatDate, showModal } from '@/utils';
import EmptyState from '@/components/EmptyState';

const CouponCenterPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const userReceivedMap = useMemo(() => {
    if (!isLoggedIn || !userInfo) return new Map<string, number>();
    const userCoupons = getUserCoupons(userInfo.id);
    const map = new Map<string, number>();
    userCoupons.forEach(uc => {
      const count = map.get(uc.couponId) || 0;
      map.set(uc.couponId, count + 1);
    });
    return map;
  }, [isLoggedIn, userInfo]);

  const loadCoupons = useCallback(() => {
    const data = getAvailableCoupons();
    setCoupons(data);
  }, []);

  useDidShow(() => {
    loadCoupons();
  });

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    loadCoupons();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const handleReceiveCoupon = async (coupon: Coupon) => {
    if (!isLoggedIn) {
      const confirmed = await showModal(
        '登录提示',
        '登录后即可领取优惠券，是否立即登录？',
        { confirmText: '立即登录', cancelText: '再想想' }
      );
      if (confirmed) {
        navigateTo('/pages/login/index');
      }
      return;
    }

    if (!userInfo) return;

    const receivedCount = userReceivedMap.get(coupon.id) || 0;
    if (receivedCount >= coupon.limitPerUser) {
      showToast('您已达到领取上限', 'none');
      return;
    }

    setReceivingId(coupon.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = receiveCoupon(userInfo.id, coupon.id);
      if (result) {
        showToast('领取成功', 'success');
        loadCoupons();
      } else {
        showToast('领取失败，请重试', 'error');
      }
    } catch (error) {
      console.error('[CouponCenter] 领取优惠券失败:', error);
      showToast('领取失败，请重试', 'error');
    } finally {
      setReceivingId(null);
    }
  };

  const handleGoToMyCoupons = () => {
    navigateTo('/pages/coupons/index');
  };

  const handleLogin = () => {
    navigateTo('/pages/login/index');
  };

  const formatCouponDate = (startTime: string, endTime: string) => {
    const start = formatDate(startTime);
    const end = formatDate(endTime);
    return `有效期：${start} - ${end}`;
  };

  const formatCouponValue = (coupon: Coupon) => {
    const { type, value, discount, minAmount } = coupon;
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

  const hasReceived = (coupon: Coupon) => {
    if (!isLoggedIn || !userInfo) return false;
    const receivedCount = userReceivedMap.get(coupon.id) || 0;
    return receivedCount >= coupon.limitPerUser;
  };

  const getReceivedCount = (coupon: Coupon) => {
    if (!isLoggedIn || !userInfo) return 0;
    return userReceivedMap.get(coupon.id) || 0;
  };

  return (
    <View className={styles.page}>
      <ScrollView className={styles.scrollView} scrollY>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>🎁 领券中心</Text>
          <Text className={styles.headerDesc}>
            精选优惠券，限时领取，先到先得
          </Text>
        </View>

        {isLoggedIn && (
          <View className={styles.myCouponEntry} onClick={handleGoToMyCoupons}>
            <View className={styles.myCouponLeft}>
              <View className={styles.myCouponIcon}>🎫</View>
              <View className={styles.myCouponText}>
                <Text className={styles.myCouponTitle}>我的优惠券</Text>
                <Text className={styles.myCouponDesc}>
                  查看已领取的优惠券
                </Text>
              </View>
            </View>
            <Text className={styles.myCouponArrow}>›</Text>
          </View>
        )}

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.icon}>🔥</Text>
            热门优惠券
          </Text>

          {coupons.length > 0 ? (
            coupons.map(coupon => {
              const received = hasReceived(coupon);
              const receivedCount = getReceivedCount(coupon);
              return (
                <View key={coupon.id} className={styles.couponCard}>
                  {received && (
                    <Text className={styles.receivedTag}>已领取</Text>
                  )}
                  <View
                    className={classnames(
                      styles.couponLeft,
                      coupon.type === 'discount' && styles.discount,
                      coupon.type === 'free' && styles.free
                    )}
                  >
                    {formatCouponValue(coupon)}
                  </View>
                  <View className={styles.couponRight}>
                    <View className={styles.couponInfo}>
                      <Text className={styles.couponName}>{coupon.name}</Text>
                      <Text className={styles.couponDesc}>
                        {coupon.description}
                      </Text>
                      <Text className={styles.couponDate}>
                        {formatCouponDate(coupon.startTime, coupon.endTime)}
                      </Text>
                    </View>
                    <View className={styles.couponMeta}>
                      <Text className={styles.couponStock}>
                        剩余 {coupon.stock} 张
                        {receivedCount > 0 && ` · 已领 ${receivedCount}/${coupon.limitPerUser}`}
                      </Text>
                      <Button
                        className={classnames(
                          styles.receiveBtn,
                          coupon.type === 'discount' && styles.discount,
                          coupon.type === 'free' && styles.free,
                          received && styles.received
                        )}
                        onClick={() => handleReceiveCoupon(coupon)}
                        disabled={received || receivingId === coupon.id}
                      >
                        {receivingId === coupon.id
                          ? '领取中...'
                          : received
                          ? '已领取'
                          : '立即领取'}
                      </Button>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <EmptyState
              icon='🎫'
              title='暂无可用优惠券'
              description='新的优惠券即将上线，敬请期待~'
              actionText={!isLoggedIn ? '登录查看' : undefined}
              onAction={!isLoggedIn ? handleLogin : undefined}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CouponCenterPage;
