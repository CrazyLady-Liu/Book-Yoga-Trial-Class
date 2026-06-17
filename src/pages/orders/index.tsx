import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import { Order, Review, RecommendTag, RECOMMEND_TAGS, CourseType } from '@/types';
import { getOrders, cancelOrder } from '@/data/orders';
import { getCourseById } from '@/data/courses';
import { createReviewWithReward } from '@/data/reviews';
import { useUser } from '@/store/UserContext';
import { showToast, showModal, navigateTo, switchTab, formatDate } from '@/utils';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'confirmed', label: '待上课' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
];

const getCourseTypeFromTags = (tags: string[]): CourseType => {
  if (tags.includes('私教课')) return '私教课';
  if (tags.includes('团课')) return '团课';
  return '体验课';
};

interface ReviewFormState {
  rating: Review['rating'];
  recommendTags: RecommendTag[];
  content: string;
  images: string[];
}

const OrdersPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    rating: 5,
    recommendTags: [],
    content: '',
    images: []
  });

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

  const openReviewModal = (order: Order) => {
    setReviewOrder(order);
    setReviewForm({
      rating: 5,
      recommendTags: [],
      content: '',
      images: []
    });
  };

  const closeReviewModal = () => {
    setReviewOrder(null);
  };

  const handleRatingChange = (rating: number) => {
    setReviewForm(prev => ({ ...prev, rating: rating as Review['rating'] }));
  };

  const handleToggleTag = (tag: RecommendTag) => {
    setReviewForm(prev => {
      const tags = prev.recommendTags.includes(tag)
        ? prev.recommendTags.filter(t => t !== tag)
        : [...prev.recommendTags, tag];
      return { ...prev, recommendTags: tags };
    });
  };

  const handleContentChange = (e: any) => {
    setReviewForm(prev => ({ ...prev, content: e.detail.value }));
  };

  const handleChooseImage = async () => {
    if (reviewForm.images.length >= 9) {
      showToast('最多只能上传9张图片');
      return;
    }
    try {
      const res = await Taro.chooseImage({
        count: 9 - reviewForm.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      setReviewForm(prev => ({
        ...prev,
        images: [...prev.images, ...res.tempFilePaths]
      }));
    } catch (e) {
      // 用户取消
    }
  };

  const handleRemoveImage = (index: number) => {
    setReviewForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handlePreviewImage = (images: string[], current: string) => {
    Taro.previewImage({ urls: images, current });
  };

  const handleSubmitReview = () => {
    if (!reviewOrder || !userInfo) return;

    if (reviewForm.rating === 0) {
      showToast('请选择星级评分');
      return;
    }
    if (!reviewForm.content.trim()) {
      showToast('请输入评价内容');
      return;
    }

    const course = reviewOrder.course;
    const courseType = getCourseTypeFromTags(course.tags);

    const { review, couponReward } = createReviewWithReward({
      userId: userInfo.id,
      orderId: reviewOrder.id,
      course: {
        id: course.id,
        name: course.name,
        coverImage: course.coverImage,
        courseType,
        classDate: course.date,
        teacherName: course.teacherName
      },
      rating: reviewForm.rating,
      recommendTags: reviewForm.recommendTags,
      content: reviewForm.content.trim(),
      images: reviewForm.images
    });

    if (review) {
      if (couponReward) {
        showToast('评价成功，获得15元优惠券', 'success');
      } else {
        showToast('评价成功', 'success');
      }
      closeReviewModal();
      loadData();
    } else {
      showToast('评价失败，请重试');
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <View className={styles.stars}>
        {[1, 2, 3, 4, 5].map(num => (
          <Text
            key={num}
            className={styles.star}
            style={{ color: num <= rating ? '#FFB800' : '#E5E7EB' }}
            onClick={() => interactive && onChange && onChange(num)}
          >
            ★
          </Text>
        ))}
      </View>
    );
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
              onReview={openReviewModal}
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

      {reviewOrder && (
        <View className={styles.modalOverlay} onClick={closeReviewModal}>
          <View className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>发表评价</Text>
              <View className={styles.modalClose} onClick={closeReviewModal}>✕</View>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.reviewCourseInfo}>
                <Image
                  className={styles.reviewCourseCover}
                  src={reviewOrder.course.coverImage}
                  mode='aspectFill'
                />
                <View className={styles.reviewCourseDetail}>
                  <Text className={styles.reviewCourseName}>{reviewOrder.course.name}</Text>
                  <Text className={styles.reviewCourseMeta}>
                    {formatDate(reviewOrder.course.date)} {reviewOrder.course.startTime}-{reviewOrder.course.endTime}
                  </Text>
                  <Text className={styles.reviewCourseMeta}>
                    授课老师：{reviewOrder.course.teacherName}
                  </Text>
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>课程评分</Text>
                <View className={styles.starRating}>
                  {renderStars(reviewForm.rating, true, handleRatingChange)}
                  <Text className={styles.ratingScore}>{reviewForm.rating} 分</Text>
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>推荐标签（可多选）</Text>
                <View className={styles.tagOptions}>
                  {RECOMMEND_TAGS.map(tag => (
                    <View
                      key={tag}
                      className={classnames(
                        styles.tagOption,
                        reviewForm.recommendTags.includes(tag) && styles.tagSelected
                      )}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>评价内容</Text>
                <textarea
                  className={styles.textarea}
                  placeholder='分享您的课程体验吧~'
                  value={reviewForm.content}
                  onInput={handleContentChange}
                  maxlength={500}
                  autoHeight
                />
                <Text className={styles.textCount}>
                  {reviewForm.content.length}/500
                </Text>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>上传图片（最多9张）</Text>
                <View className={styles.imageUploader}>
                  {reviewForm.images.map((img, idx) => (
                    <View key={idx} className={styles.uploadItem}>
                      <Image
                        className={styles.uploadImage}
                        src={img}
                        mode='aspectFill'
                        onClick={() => handlePreviewImage(reviewForm.images, img)}
                      />
                      <View
                        className={styles.deleteImageBtn}
                        onClick={() => handleRemoveImage(idx)}
                      >
                        ✕
                      </View>
                    </View>
                  ))}
                  {reviewForm.images.length < 9 && (
                    <View className={styles.uploadBtn} onClick={handleChooseImage}>
                      <Text className={styles.uploadIcon}>＋</Text>
                      <Text className={styles.uploadText}>{reviewForm.images.length}/9</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            <View className={styles.modalFooter}>
              <View className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={closeReviewModal}>
                取消
              </View>
              <View className={classnames(styles.modalBtn, styles.confirmBtn)} onClick={handleSubmitReview}>
                提交评价
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default OrdersPage;
