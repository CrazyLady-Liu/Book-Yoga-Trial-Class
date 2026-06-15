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

const COUPON_RULES = `1. 优惠券仅限在有效期内使用，过期自动作废；
2. 每张优惠券仅限使用一次，不可拆分、不可兑现、不找零；
3. 同一优惠券每位用户限领指定次数，不可重复领取；
4. 优惠券需满足使用条件（如满减金额、适用范围）方可使用；
5. 优惠券不可与其他优惠叠加使用，除非另有说明；
6. 若订单发生退款，已使用的优惠券将不予退还；
7. 优惠券最终解释权归本平台所有。`;

const CouponCenterPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [claimedCouponIds, setClaimedCouponIds] = useState<Set<string>>(new Set());

  const userReceivedMap = useMemo(() => {
    if (!isLoggedIn || !userInfo) return new Map<string, number>();
    const { list } = getUserCoupons(userInfo.id);
    const map = new Map<string, number>();
    list.forEach(uc => {
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

  const handleShowRules = () => {
    setShowRulesModal(true);
  };

  const handleCloseRulesModal = () => {
    setShowRulesModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

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

    if (claimedCouponIds.has(coupon.id)) {
      showError('领取失败', '您已领取过该优惠券，不可重复领取');
      return;
    }

    const receivedCount = userReceivedMap.get(coupon.id) || 0;
    if (receivedCount >= coupon.limitPerUser) {
      showError('领取失败', '您已达到该优惠券的领取上限');
      return;
    }

    const now = new Date();
    const couponStart = new Date(coupon.startTime);
    const couponEnd = new Date(coupon.endTime);
    if (now < couponStart || now > couponEnd) {
      showError('领取失败', '该优惠券不在领取时间范围内');
      return;
    }

    if (coupon.stock <= 0) {
      showError('领取失败', '该优惠券已被领完，下次早点来哦');
      return;
    }

    if (!coupon.isActive) {
      showError('领取失败', '该优惠券活动已结束');
      return;
    }

    setReceivingId(coupon.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = receiveCoupon(userInfo.id, coupon.id);
      if (result) {
        setClaimedCouponIds(prev => new Set(prev).add(coupon.id));
        showToast('领取成功！前往我的优惠券查看', 'success', 2500);
        loadCoupons();
      } else {
        showError('领取失败', '领取失败，请稍后重试');
      }
    } catch (error) {
      console.error('[CouponCenter] 领取优惠券失败:', error);
      showError('领取失败', '系统异常，请稍后重试');
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
    if (claimedCouponIds.has(coupon.id)) return true;
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
          <View className={styles.headerContent}>
            <View className={styles.headerText}>
              <Text className={styles.headerTitle}>🎁 领券中心</Text>
            </View>
            <View className={styles.headerRight} onClick={handleShowRules}>
              <Text className={styles.rulesIcon}>?</Text>
              <Text className={styles.rulesText}>规则说明</Text>
            </View>
          </View>
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

      {showRulesModal && (
        <View className={styles.modalOverlay} onClick={handleCloseRulesModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>优惠券通用规则</Text>
              <Text className={styles.modalClose} onClick={handleCloseRulesModal}>×</Text>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              <Text className={styles.modalText}>{COUPON_RULES}</Text>
            </ScrollView>
            <View className={styles.modalFooter}>
              <Button className={styles.modalConfirmBtn} onClick={handleCloseRulesModal}>
                我知道了
              </Button>
            </View>
          </View>
        </View>
      )}

      {showErrorModal && (
        <View className={styles.modalOverlay} onClick={handleCloseErrorModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{errorTitle}</Text>
              <Text className={styles.modalClose} onClick={handleCloseErrorModal}>×</Text>
            </View>
            <View className={styles.modalBody}>
              <Text className={styles.modalText}>{errorMessage}</Text>
            </View>
            <View className={styles.modalFooter}>
              <Button className={styles.modalConfirmBtn} onClick={handleCloseErrorModal}>
                确定
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CouponCenterPage;
