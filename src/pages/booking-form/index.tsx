import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Image, Input, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Course, BookingInfo, UserCoupon } from '@/types';
import { getCourseById } from '@/data/courses';
import { createOrder } from '@/data/orders';
import {
  getApplicableCoupons,
  calculateDiscount,
  getBestCoupon,
  useCoupon
} from '@/data/coupons';
import { useUser } from '@/store/UserContext';
import {
  formatDate,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  navigateTo,
  validateName,
  validatePhone
} from '@/utils';

const BookingFormPage: React.FC = () => {
  const router = useRouter();
  const { userInfo, isLoggedIn, updateUserInfo } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCouponList, setShowCouponList] = useState(false);
  const [applicableCoupons, setApplicableCoupons] = useState<UserCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

  const [formData, setFormData] = useState<BookingInfo>({
    name: '',
    phone: '',
    gender: '女',
    birthday: '1995-01-01',
    remark: ''
  });

  const courseId = router.params.courseId as string;
  const preselectedCouponId = router.params.preselectedCouponId as string;

  const priceInfo = useMemo(() => {
    if (!course) {
      return {
        originalPrice: 0,
        discount: 0,
        finalPrice: 0
      };
    }

    const originalPrice = course.price;
    const discount = selectedCoupon
      ? calculateDiscount(selectedCoupon.coupon, originalPrice)
      : 0;
    const finalPrice = Math.max(0, Math.round((originalPrice - discount) * 100) / 100);

    return {
      originalPrice,
      discount,
      finalPrice
    };
  }, [course, selectedCoupon]);

  const loadApplicableCoupons = useCallback(() => {
    if (!isLoggedIn || !userInfo || !course) {
      setApplicableCoupons([]);
      return;
    }

    const coupons = getApplicableCoupons(
      userInfo.id,
      course.id,
      course.price,
      course.tags
    );
    setApplicableCoupons(coupons);

    if (preselectedCouponId) {
      const preselected = coupons.find(c => c.id === preselectedCouponId);
      if (preselected) {
        setSelectedCoupon(preselected);
        return;
      }
    }

    if (coupons.length > 0 && !selectedCoupon) {
      const bestCoupon = getBestCoupon(coupons, course.price);
      setSelectedCoupon(bestCoupon);
    }
  }, [isLoggedIn, userInfo, course, selectedCoupon, preselectedCouponId]);

  useDidShow(() => {
    loadApplicableCoupons();
  });

  useEffect(() => {
    console.log('[BookingFormPage] 初始化, 课程ID:', courseId);
    
    const data = getCourseById(courseId);
    if (data) {
      setCourse(data);
      console.log('[BookingFormPage] 课程:', data.name);
    } else {
      console.error('[BookingFormPage] 课程不存在');
      showToast('课程不存在', 'error');
    }

    if (userInfo) {
      console.log('[BookingFormPage] 回填用户信息:', userInfo.nickName);
      setFormData(prev => ({
        ...prev,
        name: userInfo.nickName,
        phone: userInfo.phone,
        gender: userInfo.gender,
        birthday: userInfo.birthday
      }));
    }

    setLoading(false);
  }, [courseId, userInfo]);

  useEffect(() => {
    if (course) {
      loadApplicableCoupons();
    }
  }, [course, loadApplicableCoupons]);

  const handleToggleCouponList = () => {
    setShowCouponList(!showCouponList);
  };

  const handleSelectCoupon = (coupon: UserCoupon | null) => {
    setSelectedCoupon(coupon);
    setShowCouponList(false);
  };

  const handleGoToCouponCenter = () => {
    navigateTo('/pages/coupon-center/index');
  };

  const formatCouponValue = (coupon: UserCoupon, amount: number) => {
    const { type, value, discount } = coupon.coupon;
    
    switch (type) {
      case 'cash':
        return (
          <>
            <Text className={styles.couponItemValue}>
              <Text className={styles.symbol}>¥</Text>
              {value}
            </Text>
            <Text className={styles.couponItemName}>{coupon.coupon.name}</Text>
          </>
        );
      case 'discount':
        return (
          <>
            <Text className={styles.couponItemValue}>
              {(discount! * 10).toFixed(1)}
              <Text className={styles.symbol}>折</Text>
            </Text>
            <Text className={styles.couponItemName}>{coupon.coupon.name}</Text>
          </>
        );
      case 'free':
        return (
          <>
            <Text className={styles.couponItemValue}>
              免费
            </Text>
            <Text className={styles.couponItemName}>{coupon.coupon.name}</Text>
          </>
        );
      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof BookingInfo, value: string) => {
    console.log(`[BookingFormPage] 输入 ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenderChange = (gender: string) => {
    console.log('[BookingFormPage] 选择性别:', gender);
    handleInputChange('gender', gender);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast('请输入姓名', 'none');
      return false;
    }
    if (!validateName(formData.name)) {
      showToast('姓名长度应在2-20个字符之间', 'none');
      return false;
    }
    if (!formData.phone.trim()) {
      showToast('请输入手机号', 'none');
      return false;
    }
    if (!validatePhone(formData.phone)) {
      showToast('请输入正确的手机号', 'none');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !course) return;

    let discountInfo = '';
    if (selectedCoupon && priceInfo.discount > 0) {
      discountInfo = `\n优惠券：已减¥${priceInfo.discount}`;
    }

    const confirmed = await showModal(
      '确认预约',
      `确定预约"${course.name}"吗？\n时间：${formatDate(course.date)} ${course.startTime}-${course.endTime}\n应付金额：¥${priceInfo.finalPrice}${discountInfo}`,
      { confirmText: '确认预约', cancelText: '再想想' }
    );

    if (!confirmed) return;

    console.log('[BookingFormPage] 提交预约:', formData, '优惠券:', selectedCoupon?.id);
    setSubmitting(true);
    showLoading('提交中...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const order = createOrder(course.id, formData);
      console.log('[BookingFormPage] 预约成功, 订单号:', order.orderNo);

      if (selectedCoupon) {
        const couponUsed = useCoupon(selectedCoupon.id, order.id);
        if (couponUsed) {
          console.log('[BookingFormPage] 优惠券使用成功:', selectedCoupon.id);
        }
      }

      if (isLoggedIn) {
        updateUserInfo({
          nickName: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          birthday: formData.birthday
        });
      }

      hideLoading();
      showToast('预约成功', 'success');

      setTimeout(() => {
        navigateTo(`/pages/booking-success/index?orderId=${order.id}&discount=${priceInfo.discount}`);
      }, 1000);
    } catch (error) {
      console.error('[BookingFormPage] 预约失败:', error);
      hideLoading();
      showToast('预约失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageError = () => {
    console.error('[BookingFormPage] 图片加载失败');
  };

  if (loading || !course) {
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
      <View className={styles.courseCard}>
        <Image
          className={styles.cover}
          src={course.coverImage}
          mode='aspectFill'
          onError={handleImageError}
        />
        <View className={styles.courseInfo}>
          <Text className={styles.courseName}>{course.name}</Text>
          <Text className={styles.courseMeta}>
            📅 {formatDate(course.date)} {course.startTime}-{course.endTime}
          </Text>
          <Text className={styles.courseMeta}>
            📍 {course.location}
          </Text>
          <Text className={styles.courseMeta}>
            👩‍🏫 {course.teacherName} 老师
          </Text>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>预约信息</Text>
        
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>姓名
          </Text>
          <Input
            className={styles.formInput}
            placeholder='请输入姓名'
            placeholderClass={styles.inputPlaceholder}
            value={formData.name}
            onInput={(e) => handleInputChange('name', e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>手机号
          </Text>
          <Input
            className={styles.formInput}
            type='number'
            placeholder='请输入手机号'
            placeholderClass={styles.inputPlaceholder}
            value={formData.phone}
            onInput={(e) => handleInputChange('phone', e.detail.value)}
            maxlength={11}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.required}>*</Text>性别
          </Text>
          <View className={styles.genderOptions}>
            <Text
              className={classnames(
                styles.genderOption,
                formData.gender === '女' && styles.genderOptionActive
              )}
              onClick={() => handleGenderChange('女')}
            >
              女
            </Text>
            <Text
              className={classnames(
                styles.genderOption,
                formData.gender === '男' && styles.genderOptionActive
              )}
              onClick={() => handleGenderChange('男')}
            >
              男
            </Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>出生日期</Text>
          <Input
            className={styles.formInput}
            type='digit'
            placeholder='YYYY-MM-DD'
            placeholderClass={styles.inputPlaceholder}
            value={formData.birthday}
            onInput={(e) => handleInputChange('birthday', e.detail.value)}
          />
        </View>

        <View className={styles.formItem} style={{ alignItems: 'flex-start' }}>
          <Text className={styles.formLabel}>备注</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder='如有特殊需求请在此填写（选填）'
            placeholderClass={styles.inputPlaceholder}
            value={formData.remark}
            onInput={(e) => handleInputChange('remark', e.detail.value)}
            maxlength={200}
            autoHeight
          />
        </View>
        <Text className={styles.remarkTips}>{formData.remark.length}/200</Text>
      </View>

      {isLoggedIn && (
        <View className={styles.couponSection}>
          <View className={styles.couponHeader} onClick={handleToggleCouponList}>
            <View className={styles.couponHeaderLeft}>
              <Text className={styles.couponIcon}>🎫</Text>
              <Text className={styles.couponTitle}>优惠券</Text>
              {applicableCoupons.length > 0 && (
                <Text className={styles.couponBadge}>{applicableCoupons.length}张可用</Text>
              )}
            </View>
            <View className={styles.couponHeaderRight}>
              {selectedCoupon ? (
                <Text className={styles.selectedCouponInfo}>
                  -¥{priceInfo.discount.toFixed(2)}
                </Text>
              ) : applicableCoupons.length > 0 ? (
                <Text className={styles.noCouponInfo}>
                  已选最优
                </Text>
              ) : (
                <Text className={styles.noCouponInfo}>暂无可用</Text>
              )}
              <Text className={styles.couponArrow}>
                {showCouponList ? '▲' : '▼'}
              </Text>
            </View>
          </View>

          {showCouponList && (
            <View className={styles.couponList}>
              <View
                className={styles.noCouponOption}
                onClick={() => handleSelectCoupon(null)}
              >
                <View
                  className={classnames(
                    styles.couponRadio,
                    !selectedCoupon && styles.checked
                  )}
                />
                <Text className={styles.noCouponText}>不使用优惠券</Text>
              </View>

              {applicableCoupons.length > 0 ? (
                applicableCoupons.map(coupon => (
                  <View
                    key={coupon.id}
                    className={styles.couponItem}
                    onClick={() => handleSelectCoupon(coupon)}
                  >
                    <View
                      className={classnames(
                        styles.couponRadio,
                        selectedCoupon?.id === coupon.id && styles.checked
                      )}
                    />
                    <View className={styles.couponContent}>
                      <View className={styles.couponItemTop}>
                        {formatCouponValue(coupon, course.price)}
                      </View>
                      <Text className={styles.couponItemDesc}>
                        {coupon.coupon.description}
                        {coupon.coupon.minAmount > 0 && ` · 满${coupon.coupon.minAmount}可用`}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className={styles.emptyCoupon}>
                  <Text className={styles.emptyCouponIcon}>🎫</Text>
                  <Text>暂无可用优惠券</Text>
                  <Button
                    className={styles.goToCenterBtn}
                    onClick={handleGoToCouponCenter}
                  >
                    去领券中心
                  </Button>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View className={styles.priceDetail}>
        <View className={styles.priceRow}>
          <Text className={styles.priceLabel}>课程价格</Text>
          <Text className={styles.priceValue}>¥{priceInfo.originalPrice.toFixed(2)}</Text>
        </View>
        {selectedCoupon && priceInfo.discount > 0 && (
          <View className={styles.priceRow}>
            <Text className={styles.priceLabel}>
              优惠券优惠
              <Text className={styles.couponBadge}>{selectedCoupon.coupon.name}</Text>
            </Text>
            <Text className={classnames(styles.priceValue, styles.discountValue)}>
              -¥{priceInfo.discount.toFixed(2)}
            </Text>
          </View>
        )}
        <View className={styles.priceRow}>
          <Text className={styles.priceLabel}>实付金额</Text>
          <View>
            {selectedCoupon && priceInfo.discount > 0 && (
              <Text className={styles.originalPrice}>
                ¥{priceInfo.originalPrice.toFixed(2)}
              </Text>
            )}
            <Text className={styles.finalPrice}>¥{priceInfo.finalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.noticeSection}>
        <Text className={styles.noticeTitle}>
          <Text className={styles.noticeIcon}>⚠️</Text>
          预约须知
        </Text>
        <View className={styles.noticeContent}>
          <Text className={styles.noticeItem}>• 请提前15分钟到达场馆，准备上课</Text>
          <Text className={styles.noticeItem}>• 穿着舒适的运动服装，自带瑜伽垫更佳</Text>
          <Text className={styles.noticeItem}>• 如需取消请提前24小时操作，否则将影响您的预约信用</Text>
          <Text className={styles.noticeItem}>• 首次体验课为免费，每人限领一次</Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.totalPrice}>
          <Text className={styles.priceLabel}>实付金额</Text>
          <View>
            {selectedCoupon && priceInfo.discount > 0 && (
              <Text className={styles.originalPrice}>
                ¥{priceInfo.originalPrice.toFixed(2)}
              </Text>
            )}
            <Text className={styles.priceValue}>
              ¥{priceInfo.finalPrice.toFixed(2)}
            </Text>
          </View>
        </View>
        <Button
          className={classnames(styles.submitBtn, submitting && styles.disabled)}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '确认预约'}
        </Button>
      </View>
    </View>
  );
};

export default BookingFormPage;
