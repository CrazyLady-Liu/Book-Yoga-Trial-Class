import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Coupon } from '@/types';
import { getAvailableCoupons, receiveCoupon, getUserCoupons, ReceiveCouponResult, ReceiveCouponErrorCode } from '@/data/coupons';
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

const getErrorMsgByCode = (code: ReceiveCouponErrorCode): { title: string; message: string } => {
  switch (code) {
    case 'ALREADY_RECEIVED':
      return { title: '领取失败', message: '您已领取过该优惠券，不可重复领取' };
    case 'LIMIT_EXCEEDED':
      return { title: '领取失败', message: '您已达到该优惠券的领取上限' };
    case 'OUT_OF_STOCK':
      return { title: '领取失败', message: '该优惠券已被领完，下次早点来哦' };
    case 'NOT_ACTIVE':
      return { title: '领取失败', message: '该优惠券活动已结束' };
    case 'NOT_IN_TIME_RANGE':
      return { title: '领取失败', message: '该优惠券不在领取时间范围内' };
    case 'NOT_FOUND':
      return { title: '领取失败', message: '该优惠券不存在或已下架' };
    default:
      return { title: '领取失败', message: '领取失败，请稍后重试' };
  }
};

interface BatchClaimResult {
  success: string[];
  failed: { couponId: string; couponName: string; errorCode: ReceiveCouponErrorCode }[];
}

const CouponCenterPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [receivingCouponIds, setReceivingCouponIds] = useState<Set<string>>(new Set());
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showBatchResultModal, setShowBatchResultModal] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchClaimResult | null>(null);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [claimedCouponIds, setClaimedCouponIds] = useState<Set<string>>(new Set());
  const [receivedMapVersion, setReceivedMapVersion] = useState(0);
  const [isBatchClaiming, setIsBatchClaiming] = useState(false);

  const pendingClaimsRef = useRef<Set<string>>(new Set());
  const claimedRef = useRef<Set<string>>(new Set());
  const batchClaimingRef = useRef(false);

  useEffect(() => {
    claimedRef.current = claimedCouponIds;
  }, [claimedCouponIds]);

  const userReceivedMap = useMemo(() => {
    if (!isLoggedIn || !userInfo) return new Map<string, number>();
    const { list } = getUserCoupons(userInfo.id);
    const map = new Map<string, number>();
    list.forEach(uc => {
      const count = map.get(uc.couponId) || 0;
      map.set(uc.couponId, count + 1);
    });
    return map;
  }, [isLoggedIn, userInfo, receivedMapVersion]);

  const loadCoupons = useCallback(() => {
    const data = getAvailableCoupons();
    setCoupons(data);
  }, []);

  const initClaimedFromStorage = useCallback(() => {
    if (!isLoggedIn || !userInfo) {
      setClaimedCouponIds(new Set());
      claimedRef.current = new Set();
      return;
    }
    const { list } = getUserCoupons(userInfo.id);
    const newClaimed = new Set<string>();
    const couponCountMap = new Map<string, number>();
    list.forEach(uc => {
      const cid = uc.couponId;
      couponCountMap.set(cid, (couponCountMap.get(cid) || 0) + 1);
    });
    couponCountMap.forEach((count, couponId) => {
      const couponInfo = coupons.find(c => c.id === couponId);
      const ucFromList = list.find(uc => uc.couponId === couponId);
      const limit = couponInfo?.limitPerUser || ucFromList?.coupon.limitPerUser || 1;
      if (count >= limit) {
        newClaimed.add(couponId);
      }
    });
    setClaimedCouponIds(newClaimed);
    claimedRef.current = newClaimed;
  }, [isLoggedIn, userInfo, coupons]);

  useDidShow(() => {
    loadCoupons();
    initClaimedFromStorage();
  });

  useEffect(() => {
    if (isLoggedIn && userInfo && coupons.length > 0) {
      initClaimedFromStorage();
    }
  }, [isLoggedIn, userInfo, coupons.length, initClaimedFromStorage]);

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

    if (pendingClaimsRef.current.has(coupon.id)) {
      return;
    }

    if (claimedRef.current.has(coupon.id)) {
      showError('领取失败', '您已领取过该优惠券，不可重复领取');
      return;
    }

    const freshUserCoupons = getUserCoupons(userInfo.id);
    const freshReceivedCount = freshUserCoupons.list.filter(uc => uc.couponId === coupon.id).length;
    if (freshReceivedCount >= coupon.limitPerUser) {
      setClaimedCouponIds(prev => {
        const next = new Set(prev);
        next.add(coupon.id);
        claimedRef.current = next;
        return next;
      });
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

    pendingClaimsRef.current.add(coupon.id);
    setReceivingCouponIds(prev => new Set(prev).add(coupon.id));

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const result: ReceiveCouponResult = receiveCoupon(userInfo.id, coupon.id);

      if (result.success && result.userCoupon) {
        const newClaimed = new Set(claimedRef.current);
        const totalForCoupon =
          freshUserCoupons.list.filter(uc => uc.couponId === coupon.id).length + 1;
        if (totalForCoupon >= coupon.limitPerUser) {
          newClaimed.add(coupon.id);
        }
        setClaimedCouponIds(newClaimed);
        claimedRef.current = newClaimed;
        setReceivedMapVersion(v => v + 1);
        showToast('领取成功！前往我的优惠券查看', 'success', 2500);
        loadCoupons();
      } else {
        const errorInfo = getErrorMsgByCode(result.errorCode as ReceiveCouponErrorCode);
        showError(errorInfo.title, errorInfo.message);

        if (result.errorCode === 'LIMIT_EXCEEDED' || result.errorCode === 'ALREADY_RECEIVED') {
          setClaimedCouponIds(prev => {
            const next = new Set(prev);
            next.add(coupon.id);
            claimedRef.current = next;
            return next;
          });
          setReceivedMapVersion(v => v + 1);
        }
      }
    } catch (error) {
      console.error('[CouponCenter] 领取优惠券失败:', error);
      showError('领取失败', '系统异常，请稍后重试');
    } finally {
      pendingClaimsRef.current.delete(coupon.id);
      setReceivingCouponIds(prev => {
        const next = new Set(prev);
        next.delete(coupon.id);
        return next;
      });
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
    if (claimedCouponIds.has(coupon.id) || claimedRef.current.has(coupon.id)) return true;
    const receivedCount = userReceivedMap.get(coupon.id) || 0;
    return receivedCount >= coupon.limitPerUser;
  };

  const getReceivedCount = (coupon: Coupon) => {
    if (!isLoggedIn || !userInfo) return 0;
    return userReceivedMap.get(coupon.id) || 0;
  };

  const isButtonDisabled = (coupon: Coupon) => {
    const received = hasReceived(coupon);
    if (received) return true;
    if (isBatchClaiming) return true;
    if (receivingCouponIds.has(coupon.id)) return true;
    if (pendingClaimsRef.current.has(coupon.id)) return true;
    return false;
  };

  const getButtonText = (coupon: Coupon) => {
    const received = hasReceived(coupon);
    if (isBatchClaiming) return '领取中...';
    if (receivingCouponIds.has(coupon.id) || pendingClaimsRef.current.has(coupon.id)) {
      return '领取中...';
    }
    if (received) return '已领取';
    return '立即领取';
  };

  const claimableCoupons = useMemo<Coupon[]>(() => {
    if (!isLoggedIn || !userInfo) return [];
    const now = new Date();
    return coupons.filter(coupon => {
      if (claimedCouponIds.has(coupon.id)) return false;
      if (!coupon.isActive || coupon.stock <= 0) return false;
      const couponStart = new Date(coupon.startTime);
      const couponEnd = new Date(coupon.endTime);
      if (now < couponStart || now > couponEnd) return false;
      const receivedCount = userReceivedMap.get(coupon.id) || 0;
      if (receivedCount >= coupon.limitPerUser) return false;
      return true;
    });
  }, [coupons, isLoggedIn, userInfo, claimedCouponIds, userReceivedMap]);

  const shouldShowClaimAll = claimableCoupons.length >= 2;

  const handleCloseBatchResultModal = () => {
    setShowBatchResultModal(false);
    setBatchResult(null);
  };

  const handleClaimAll = async () => {
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
    if (batchClaimingRef.current || isBatchClaiming) return;
    if (claimableCoupons.length < 2) return;

    batchClaimingRef.current = true;
    setIsBatchClaiming(true);

    const successIds: string[] = [];
    const failedItems: BatchClaimResult['failed'] = [];

    for (const coupon of claimableCoupons) {
      if (pendingClaimsRef.current.has(coupon.id)) continue;
      if (claimedRef.current.has(coupon.id)) {
        failedItems.push({ couponId: coupon.id, couponName: coupon.name, errorCode: 'ALREADY_RECEIVED' });
        continue;
      }

      pendingClaimsRef.current.add(coupon.id);
      setReceivingCouponIds(prev => new Set(prev).add(coupon.id));

      try {
        await new Promise(resolve => setTimeout(resolve, 200));

        const freshUserCoupons = getUserCoupons(userInfo.id);
        const freshReceivedCount = freshUserCoupons.list.filter(uc => uc.couponId === coupon.id).length;
        if (freshReceivedCount >= coupon.limitPerUser) {
          failedItems.push({ couponId: coupon.id, couponName: coupon.name, errorCode: 'LIMIT_EXCEEDED' });
          const next = new Set(claimedRef.current);
          next.add(coupon.id);
          setClaimedCouponIds(next);
          claimedRef.current = next;
          continue;
        }

        const result: ReceiveCouponResult = receiveCoupon(userInfo.id, coupon.id);

        if (result.success && result.userCoupon) {
          successIds.push(coupon.id);
          const newClaimed = new Set(claimedRef.current);
          const totalForCoupon = freshReceivedCount + 1;
          if (totalForCoupon >= coupon.limitPerUser) {
            newClaimed.add(coupon.id);
          }
          setClaimedCouponIds(newClaimed);
          claimedRef.current = newClaimed;
        } else {
          failedItems.push({
            couponId: coupon.id,
            couponName: coupon.name,
            errorCode: (result.errorCode || 'UNKNOWN') as ReceiveCouponErrorCode
          });
          if (result.errorCode === 'LIMIT_EXCEEDED' || result.errorCode === 'ALREADY_RECEIVED') {
            const next = new Set(claimedRef.current);
            next.add(coupon.id);
            setClaimedCouponIds(next);
            claimedRef.current = next;
          }
        }
      } catch (error) {
        console.error('[CouponCenter] 批量领取失败:', coupon.id, error);
        failedItems.push({ couponId: coupon.id, couponName: coupon.name, errorCode: 'UNKNOWN' });
      } finally {
        pendingClaimsRef.current.delete(coupon.id);
        setReceivingCouponIds(prev => {
          const next = new Set(prev);
          next.delete(coupon.id);
          return next;
        });
      }
    }

    setReceivedMapVersion(v => v + 1);
    loadCoupons();

    const finalResult: BatchClaimResult = { success: successIds, failed: failedItems };
    setBatchResult(finalResult);
    setShowBatchResultModal(true);

    if (successIds.length > 0 && failedItems.length === 0) {
      showToast(`已领取${successIds.length}张优惠券！`, 'success', 2500);
    }

    batchClaimingRef.current = false;
    setIsBatchClaiming(false);
  };

  const getBatchResultContent = (result: BatchClaimResult): { title: string; content: string } => {
    const { success, failed } = result;
    if (success.length > 0 && failed.length === 0) {
      return {
        title: '🎉 全部领取成功',
        content: `恭喜！您已成功领取${success.length}张优惠券，可前往「我的优惠券」查看使用。`
      };
    }
    if (success.length === 0 && failed.length > 0) {
      const failReasons = failed.map(f => {
        const msg = getErrorMsgByCode(f.errorCode);
        return `· ${f.couponName}：${msg.message}`;
      }).join('\n');
      return {
        title: '领取失败',
        content: failReasons
      };
    }
    const failReasons = failed.map(f => {
      const msg = getErrorMsgByCode(f.errorCode);
      return `· ${f.couponName}：${msg.message}`;
    }).join('\n');
    return {
      title: '部分领取成功',
      content: `成功领取 ${success.length} 张，失败 ${failed.length} 张：\n${failReasons}`
    };
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
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.icon}>🔥</Text>
              热门优惠券
            </Text>
            {shouldShowClaimAll && (
              <Button
                className={classnames(
                  styles.claimAllBtn,
                  isBatchClaiming && styles.claimAllBtnDisabled
                )}
                onClick={handleClaimAll}
                disabled={isBatchClaiming}
              >
                {isBatchClaiming
                  ? '一键领取中...'
                  : `一键领取全部可领券（${claimableCoupons.length}张）`
                }
              </Button>
            )}
          </View>

          {coupons.length > 0 ? (
            coupons.map(coupon => {
              const received = hasReceived(coupon);
              const receivedCount = getReceivedCount(coupon);
              const btnDisabled = isButtonDisabled(coupon);
              const btnText = getButtonText(coupon);
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
                          (received || btnDisabled) && styles.received
                        )}
                        onClick={() => handleReceiveCoupon(coupon)}
                        disabled={btnDisabled}
                      >
                        {btnText}
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

      {showBatchResultModal && batchResult && (
        <View className={styles.modalOverlay} onClick={handleCloseBatchResultModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{getBatchResultContent(batchResult).title}</Text>
              <Text className={styles.modalClose} onClick={handleCloseBatchResultModal}>×</Text>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              <Text className={styles.modalText}>{getBatchResultContent(batchResult).content}</Text>
            </ScrollView>
            <View className={styles.modalFooter}>
              {batchResult.success.length > 0 && (
                <Button className={styles.modalSecondaryBtn} onClick={handleGoToMyCoupons}>
                  查看我的优惠券
                </Button>
              )}
              <Button
                className={classnames(
                  styles.modalConfirmBtn,
                  batchResult.success.length === 0 && styles.modalConfirmBtnFull
                )}
                onClick={handleCloseBatchResultModal}
              >
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
