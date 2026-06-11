import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Input, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Course, BookingInfo } from '@/types';
import { getCourseById } from '@/data/courses';
import { createOrder } from '@/data/orders';
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

  const [formData, setFormData] = useState<BookingInfo>({
    name: '',
    phone: '',
    gender: '女',
    birthday: '1995-01-01',
    remark: ''
  });

  const courseId = router.params.courseId as string;

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

    const confirmed = await showModal(
      '确认预约',
      `确定预约"${course.name}"吗？\n时间：${formatDate(course.date)} ${course.startTime}-${course.endTime}`,
      { confirmText: '确认预约', cancelText: '再想想' }
    );

    if (!confirmed) return;

    console.log('[BookingFormPage] 提交预约:', formData);
    setSubmitting(true);
    showLoading('提交中...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const order = createOrder(course.id, formData);
      console.log('[BookingFormPage] 预约成功, 订单号:', order.orderNo);

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
        navigateTo(`/pages/booking-success/index?orderId=${order.id}`);
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
          <Text className={styles.priceLabel}>预约费用</Text>
          <Text className={styles.priceValue}>
            ¥{course.price === 0 ? '0' : course.price}
          </Text>
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
