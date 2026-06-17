import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Order, Review, RecommendTag, RECOMMEND_TAGS, CourseType } from '@/types';
import { getOrderById, cancelOrder, verifyOrder } from '@/data/orders';
import { getCourseById } from '@/data/courses';
import { isOrderReviewed, createReviewWithReward } from '@/data/reviews';
import {
  formatDate,
  getStatusText,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  navigateBack,
  navigateTo,
  switchTab
} from '@/utils';

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

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    rating: 5,
    recommendTags: [],
    content: '',
    images: []
  });

  const orderId = router.params.id as string;

  const loadData = useCallback(() => {
    console.log('[OrderDetailPage] 加载订单详情, ID:', orderId);
    setLoading(true);
    try {
      const data = getOrderById(orderId);
      if (data) {
        setOrder(data);
        console.log('[OrderDetailPage] 订单信息:', data.orderNo, '状态:', data.status);
      } else {
        console.error('[OrderDetailPage] 订单不存在:', orderId);
        showToast('订单不存在', 'error');
        setTimeout(() => navigateBack(), 1500);
      }
    } catch (error) {
      console.error('[OrderDetailPage] 加载失败:', error);
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useDidShow(() => {
    if (orderId) {
      loadData();
    }
  });

  const handleCancelOrder = async () => {
    if (!order) return;
    console.log('[OrderDetailPage] 取消订单:', order.id);

    const confirmed = await showModal(
      '取消预约',
      `确定要取消"${order.course.name}"的预约吗？\n取消后名额将释放给其他学员。`,
      { confirmText: '确定取消', cancelText: '再想想' }
    );

    if (!confirmed) return;

    showLoading('处理中...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = cancelOrder(order.id, '用户主动取消');
      if (success) {
        hideLoading();
        showToast('取消成功', 'success');
        loadData();
      } else {
        hideLoading();
        showToast('取消失败，请重试', 'error');
      }
    } catch (error) {
      console.error('[OrderDetailPage] 取消订单失败:', error);
      hideLoading();
      showToast('取消失败，请重试', 'error');
    }
  };

  const handleVerifyOrder = async () => {
    if (!order) return;
    console.log('[OrderDetailPage] 核销订单:', order.id);

    const confirmed = await showModal(
      '确认核销',
      '请确认您已到店并准备上课，确认核销后订单将标记为已完成。',
      { confirmText: '确认核销', cancelText: '取消' }
    );

    if (!confirmed) return;

    showLoading('核销中...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = verifyOrder(order.id);
      if (success) {
        hideLoading();
        showToast('核销成功，祝您上课愉快！', 'success');
        loadData();
      } else {
        hideLoading();
        showToast('核销失败，请重试', 'error');
      }
    } catch (error) {
      console.error('[OrderDetailPage] 核销失败:', error);
      hideLoading();
      showToast('核销失败，请重试', 'error');
    }
  };

  const handleBookAgain = async () => {
    if (!order) return;

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

    console.log('[OrderDetailPage] 再次预约课程, courseId:', order.courseId);
    navigateTo(`/pages/course-detail/index?id=${order.courseId}`);
  };

  const isCourseFull = (): boolean => {
    if (!order) return false;
    const latestCourse = getCourseById(order.courseId);
    return !latestCourse || latestCourse.remainingSlots <= 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getStatusDescription = (order: Order) => {
    switch (order.status) {
      case 'confirmed':
        return order.isVerified ? '请准时到店，出示核销码给前台即可' : '请提前15分钟到店，出示下方核销码';
      case 'pending':
        return '预约正在确认中，请耐心等待';
      case 'completed':
        return '感谢您的参与，期待下次再见！';
      case 'cancelled':
        return '预约已取消，名额已释放';
      default:
        return '';
    }
  };

  const handleImageError = () => {
    console.error('[OrderDetailPage] 图片加载失败');
  };

  const openReviewModal = () => {
    setShowReviewModal(true);
    setReviewForm({
      rating: 5,
      recommendTags: [],
      content: '',
      images: []
    });
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
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
    if (!order) return;

    if (reviewForm.rating === 0) {
      showToast('请选择星级评分');
      return;
    }
    if (!reviewForm.content.trim()) {
      showToast('请输入评价内容');
      return;
    }

    const course = order.course;
    const courseType = getCourseTypeFromTags(course.tags);

    const { review, couponReward } = createReviewWithReward({
      userId: 'user_001',
      orderId: order.id,
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

  if (loading || !order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center', color: '#9CA3AF' }}>
          加载中...
        </View>
      </View>
    );
  }

  const canReview = order.status === 'completed' && !isOrderReviewed(order.id);

  return (
    <View className={styles.page}>
      <View className={styles.statusBanner}>
        <View className={styles.statusRow}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text className={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
            <Text className={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
        <Text className={styles.statusDesc}>{getStatusDescription(order)}</Text>

        {order.status === 'confirmed' && !order.isVerified && (
          <View className={styles.verifyCodeBox}>
            <Text className={styles.verifyLabel}>到店核销码</Text>
            <Text className={styles.verifyCode}>{order.verifyCode}</Text>
            <Text className={styles.verifyTip}>向工作人员出示此码核销</Text>
          </View>
        )}
      </View>

      <ScrollView scrollY>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>🧘</Text>
            课程信息
          </Text>

          <View className={styles.courseInfo}>
            <Image
              className={styles.cover}
              src={order.course.coverImage}
              mode='aspectFill'
              onError={handleImageError}
            />
            <View className={styles.info}>
              <Text className={styles.courseName}>{order.course.name}</Text>
              <Text className={styles.levelTag}>{order.course.level}</Text>
              <Text className={styles.teacher}>{order.course.teacherName} 老师授课</Text>
            </View>
          </View>

          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>上课时间</Text>
              <Text className={classnames(styles.value, styles.valueHighlight)}>
                {formatDate(order.course.date)} {order.course.startTime}-{order.course.endTime}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>上课地点</Text>
              <Text className={styles.value}>{order.course.location}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>课程时长</Text>
              <Text className={styles.value}>{order.course.duration} 分钟</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>详细地址</Text>
              <Text className={styles.value}>{order.course.address}</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📝</Text>
            预约信息
          </Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>预约人</Text>
              <Text className={styles.value}>{order.bookingInfo.name}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>联系电话</Text>
              <Text className={styles.value}>{order.bookingInfo.phone}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>性别</Text>
              <Text className={styles.value}>{order.bookingInfo.gender}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>出生日期</Text>
              <Text className={styles.value}>{order.bookingInfo.birthday}</Text>
            </View>
            {order.bookingInfo.remark && (
              <View className={styles.infoItem}>
                <Text className={styles.label}>备注</Text>
                <Text className={styles.value}>{order.bookingInfo.remark}</Text>
              </View>
            )}
          </View>
          {order.status === 'cancelled' && order.cancelReason && (
            <View className={styles.cancelReason}>
              <Text className={styles.reasonLabel}>取消原因</Text>
              <Text className={styles.reasonText}>{order.cancelReason}</Text>
            </View>
          )}
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📋</Text>
            订单信息
          </Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>订单编号</Text>
              <Text className={styles.value}>{order.orderNo}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>创建时间</Text>
              <Text className={styles.value}>{order.createTime}</Text>
            </View>

            <View className={styles.infoItem}>
              <Text className={styles.label}>原价</Text>
              <Text className={classnames(styles.value, styles.originalPrice)}>¥{order.originalPrice}</Text>
            </View>

            {order.discountAmount > 0 && (
              <>
                <View className={styles.infoItem}>
                  <Text className={styles.label}>优惠券</Text>
                  <Text className={styles.value}>{order.couponName || '满减优惠'}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.label}>优惠减免</Text>
                  <Text className={classnames(styles.value, styles.discountPrice)}>-¥{order.discountAmount}</Text>
                </View>
              </>
            )}

            <View className={styles.infoItem}>
              <Text className={styles.label}>实付金额</Text>
              <Text className={classnames(styles.value, styles.finalPrice)}>¥{order.finalPrice}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.actionButtons}>
        {order.status === 'confirmed' && !order.isVerified && (
          <>
            <Button className={classnames(styles.btn, styles.btnCancel)} onClick={handleCancelOrder}>
              取消预约
            </Button>
            <Button className={classnames(styles.btn, styles.btnVerify)} onClick={handleVerifyOrder}>
              确认核销
            </Button>
          </>
        )}
        {order.status === 'confirmed' && order.isVerified && (
          <Button className={classnames(styles.btn, styles.btnFull)}>
            已核销，请准时上课
          </Button>
        )}
        {order.status === 'completed' && (
          <>
            {canReview && (
              <Button className={classnames(styles.btn, styles.btnReview)} onClick={openReviewModal}>
                去评价
              </Button>
            )}
            {isCourseFull() ? (
              <View className={styles.btnTooltipWrapper}>
                <Button
                  className={classnames(styles.btn, styles.btnFull, styles.btnDisabled)}
                  disabled
                >
                  立即再次预约
                </Button>
                <View className={styles.tooltip}>
                  <View className={styles.tooltipArrow} />
                  <Text className={styles.tooltipText}>本期课程名额已满，可查看其他排期</Text>
                </View>
              </View>
            ) : (
              <Button className={classnames(styles.btn, styles.btnFull)} onClick={handleBookAgain}>
                立即再次预约
              </Button>
            )}
          </>
        )}
        {order.status === 'cancelled' && (
          isCourseFull() ? (
            <View className={styles.btnTooltipWrapper}>
              <Button
                className={classnames(styles.btn, styles.btnFull, styles.btnDisabled)}
                disabled
              >
                立即再次预约
              </Button>
              <View className={styles.tooltip}>
                <View className={styles.tooltipArrow} />
                <Text className={styles.tooltipText}>本期课程名额已满，可查看其他排期</Text>
              </View>
            </View>
          ) : (
            <Button className={classnames(styles.btn, styles.btnFull)} onClick={handleBookAgain}>
              立即再次预约
            </Button>
          )
        )}
        {order.status === 'pending' && (
          <Button className={classnames(styles.btn, styles.btnFull)}>
            等待确认中...
          </Button>
        )}
      </View>

      {showReviewModal && (
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
                  src={order.course.coverImage}
                  mode='aspectFill'
                />
                <View className={styles.reviewCourseDetail}>
                  <Text className={styles.reviewCourseName}>{order.course.name}</Text>
                  <Text className={styles.reviewCourseMeta}>
                    {formatDate(order.course.date)} {order.course.startTime}-{order.course.endTime}
                  </Text>
                  <Text className={styles.reviewCourseMeta}>
                    授课老师：{order.course.teacherName}
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

export default OrderDetailPage;
