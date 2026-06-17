import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Review, RecommendTag, RECOMMEND_TAGS, CourseType, Order } from '@/types';
import { 
  getUserReviews, 
  updateReview, 
  deleteReview, 
  formatReviewTime,
  getPendingReviewOrders,
  createReviewWithReward
} from '@/data/reviews';
import { useUser } from '@/store/UserContext';
import { showToast, showModal, navigateTo, formatDate } from '@/utils';
import EmptyState from '@/components/EmptyState';

const COLLAPSED_MAX_LENGTH = 80;

type TabType = 'pending' | 'reviewed';

const tabList: { key: TabType; text: string }[] = [
  { key: 'pending', text: '待评价' },
  { key: 'reviewed', text: '已评价' }
];

const courseTypeClassMap: Record<CourseType, string> = {
  '私教课': styles.private,
  '团课': styles.group,
  '体验课': styles.trial
};

const ratingTextMap: Record<number, string> = {
  1: '很差',
  2: '较差',
  3: '一般',
  4: '满意',
  5: '超赞'
};

interface EditFormState {
  rating: Review['rating'];
  recommendTags: RecommendTag[];
  content: string;
  images: string[];
}

const getCourseTypeFromTags = (tags: string[]): CourseType => {
  if (tags.includes('私教课')) return '私教课';
  if (tags.includes('团课')) return '团课';
  return '体验课';
};

const MyReviewsPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [publishingOrder, setPublishingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    rating: 5,
    recommendTags: [],
    content: '',
    images: []
  });
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const loadData = useCallback(() => {
    if (!isLoggedIn || !userInfo) {
      setReviews([]);
      setPendingOrders([]);
      return;
    }
    const reviewList = getUserReviews(userInfo.id);
    setReviews(reviewList);
    const pending = getPendingReviewOrders(userInfo.id);
    setPendingOrders(pending);
  }, [isLoggedIn, userInfo]);

  useDidShow(() => {
    loadData();
  });

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    loadData();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleToggleExpand = (reviewId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const handlePreviewImage = (images: string[], current: string) => {
    Taro.previewImage({
      urls: images,
      current
    });
  };

  const isLongContent = (content: string) => content.length > COLLAPSED_MAX_LENGTH;
  const isExpanded = (reviewId: string) => expandedIds.has(reviewId);

  const openPublishModal = (order: Order) => {
    setPublishingOrder(order);
    setEditForm({
      rating: 5,
      recommendTags: [],
      content: '',
      images: []
    });
  };

  const closePublishModal = () => {
    setPublishingOrder(null);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating,
      recommendTags: [...review.recommendTags],
      content: review.content,
      images: [...review.images]
    });
  };

  const closeEditModal = () => {
    setEditingReview(null);
  };

  const handleRatingChange = (rating: number) => {
    setEditForm(prev => ({ ...prev, rating: rating as Review['rating'] }));
  };

  const handleToggleTag = (tag: RecommendTag) => {
    setEditForm(prev => {
      const tags = prev.recommendTags.includes(tag)
        ? prev.recommendTags.filter(t => t !== tag)
        : [...prev.recommendTags, tag];
      return { ...prev, recommendTags: tags };
    });
  };

  const handleContentChange = (e: any) => {
    setEditForm(prev => ({ ...prev, content: e.detail.value }));
  };

  const handleChooseImage = async () => {
    if (editForm.images.length >= 9) {
      showToast('最多只能上传9张图片');
      return;
    }
    try {
      const res = await Taro.chooseImage({
        count: 9 - editForm.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      setEditForm(prev => ({
        ...prev,
        images: [...prev.images, ...res.tempFilePaths]
      }));
    } catch (e) {
      // 用户取消
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitPublish = async () => {
    if (!publishingOrder || !userInfo) return;

    if (editForm.rating === 0) {
      showToast('请选择星级评分');
      return;
    }
    if (!editForm.content.trim()) {
      showToast('请输入评价内容');
      return;
    }

    const course = publishingOrder.course;
    const courseType = getCourseTypeFromTags(course.tags);

    const { review, couponReward } = createReviewWithReward({
      userId: userInfo.id,
      orderId: publishingOrder.id,
      course: {
        id: course.id,
        name: course.name,
        coverImage: course.coverImage,
        courseType,
        classDate: course.date,
        teacherName: course.teacherName
      },
      rating: editForm.rating,
      recommendTags: editForm.recommendTags,
      content: editForm.content.trim(),
      images: editForm.images
    });

    if (review) {
      if (couponReward) {
        showToast('评价成功，获得15元优惠券', 'success');
      } else {
        showToast('评价成功', 'success');
      }
      closePublishModal();
      loadData();
      setActiveTab('reviewed');
    } else {
      showToast('评价失败，请重试');
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingReview) return;

    if (editForm.rating === 0) {
      showToast('请选择星级评分');
      return;
    }
    if (!editForm.content.trim()) {
      showToast('请输入评价内容');
      return;
    }

    const result = updateReview(editingReview.id, {
      rating: editForm.rating,
      recommendTags: editForm.recommendTags,
      content: editForm.content.trim(),
      images: editForm.images
    });

    if (result) {
      showToast('评价修改成功', 'success');
      closeEditModal();
      loadData();
    } else {
      showToast('修改失败，请重试');
    }
  };

  const openDeleteDialog = (review: Review) => {
    setDeleteTarget(review);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const confirmed = await showModal(
      '删除评价',
      `确定要删除这条评价吗？删除后将无法恢复。`,
      { confirmText: '确认删除', cancelText: '再想想' }
    );

    if (confirmed) {
      const success = deleteReview(deleteTarget.id);
      if (success) {
        showToast('评价已删除', 'success');
        closeDeleteDialog();
        loadData();
      } else {
        showToast('删除失败，请重试');
      }
    }
  };

  const handleLogin = () => {
    navigateTo('/pages/login/index');
  };

  const handleGoCourses = () => {
    navigateTo('/pages/courses/index');
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

  const renderPublishModal = () => {
    if (!publishingOrder) return null;

    const course = publishingOrder.course;

    return (
      <View className={styles.modalOverlay} onClick={closePublishModal}>
        <View className={styles.modalContainer} onClick={e => e.stopPropagation()}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>发表评价</Text>
            <View className={styles.modalClose} onClick={closePublishModal}>✕</View>
          </View>
          <ScrollView className={styles.modalBody} scrollY>
            <View className={styles.reviewCourseInfo}>
              <Image
                className={styles.reviewCourseCover}
                src={course.coverImage}
                mode='aspectFill'
              />
              <View className={styles.reviewCourseDetail}>
                <Text className={styles.reviewCourseName}>{course.name}</Text>
                <Text className={styles.reviewCourseMeta}>
                  {formatDate(course.date)} {course.startTime}-{course.endTime}
                </Text>
                <Text className={styles.reviewCourseMeta}>
                  授课老师：{course.teacherName}
                </Text>
              </View>
            </View>

            <View className={styles.formSection}>
              <Text className={styles.formLabel}>课程评分</Text>
              <View className={styles.starRating}>
                {renderStars(editForm.rating, true, handleRatingChange)}
                <Text className={styles.ratingScore}>
                  {editForm.rating} 分
                </Text>
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
                      editForm.recommendTags.includes(tag) && styles.selected
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
                value={editForm.content}
                onInput={handleContentChange}
                maxlength={500}
                autoHeight
              />
              <Text className={styles.textCount}>
                {editForm.content.length}/500
              </Text>
            </View>

            <View className={styles.formSection}>
              <Text className={styles.formLabel}>上传图片（最多9张）</Text>
              <View className={styles.imageUploader}>
                {editForm.images.map((img, idx) => (
                  <View key={idx} className={styles.uploadItem}>
                    <Image
                      className={styles.uploadImage}
                      src={img}
                      mode='aspectFill'
                      onClick={() => handlePreviewImage(editForm.images, img)}
                    />
                    <View
                      className={styles.deleteImageBtn}
                      onClick={() => handleRemoveImage(idx)}
                    >
                      ✕
                    </View>
                  </View>
                ))}
                {editForm.images.length < 9 && (
                  <View className={styles.uploadBtn} onClick={handleChooseImage}>
                    <Text className={styles.uploadIcon}>＋</Text>
                    <Text className={styles.uploadText}>{editForm.images.length}/9</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
          <View className={styles.modalFooter}>
            <View className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={closePublishModal}>
              取消
            </View>
            <View className={classnames(styles.modalBtn, styles.confirmBtn)} onClick={handleSubmitPublish}>
              提交评价
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyWrapper}>
          <EmptyState
            icon='🔒'
            title='登录后查看评价'
            description='登录后即可查看和管理您的课程评价'
            actionText='立即登录'
            onAction={handleLogin}
          />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView className={styles.scrollView} scrollY>
        {activeTab === 'pending' && (
          <View className={styles.tipBanner}>
            <Text className={styles.tipIcon}>🎁</Text>
            <View className={styles.tipContent}>
              <Text className={styles.tipTitle}>写下评价可领取小额优惠券</Text>
              <Text className={styles.tipDesc}>分享真实上课感受</Text>
            </View>
          </View>
        )}

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
              {tab.key === 'pending' && pendingOrders.length > 0 && (
                <Text className={styles.tabBadge}>{pendingOrders.length}</Text>
              )}
            </Text>
          ))}
        </View>

        {activeTab === 'pending' && (
          pendingOrders.length > 0 ? (
            <View className={styles.pendingList}>
              {pendingOrders.map(order => {
                const courseType = getCourseTypeFromTags(order.course.tags);
                return (
                  <View key={order.id} className={styles.pendingCard}>
                    <View className={styles.pendingBadge}>待评价</View>
                    <View className={styles.pendingCardContent}>
                      <Image
                        className={styles.pendingCover}
                        src={order.course.coverImage}
                        mode='aspectFill'
                      />
                      <View className={styles.pendingInfo}>
                        <Text className={styles.pendingCourseName}>{order.course.name}</Text>
                        <View className={styles.pendingMeta}>
                          <Text className={styles.pendingMetaText}>
                            {formatDate(order.course.date)} {order.course.startTime}-{order.course.endTime}
                          </Text>
                        </View>
                        <View className={styles.pendingMeta}>
                          <Text className={styles.pendingMetaText}>
                            授课老师：{order.course.teacherName}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className={styles.pendingCardFooter}>
                      <View
                        className={styles.reviewBtn}
                        onClick={() => openPublishModal(order)}
                      >
                        去评价
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={styles.emptyWrapper}>
              <EmptyState
                icon='✨'
                title='暂无待评价课程'
                description='您的所有课程都已评价，感谢您的分享~'
                actionText='去浏览课程'
                onAction={handleGoCourses}
              />
            </View>
          )
        )}

        {activeTab === 'reviewed' && (
          reviews.length > 0 ? (
            <View className={styles.reviewList}>
              {reviews.map(review => {
                const longContent = isLongContent(review.content);
                const expanded = isExpanded(review.id);

                return (
                  <View key={review.id} className={styles.reviewCard}>
                    <View className={styles.courseHeader}>
                      <Image
                        className={styles.courseCover}
                        src={review.course.coverImage}
                        mode='aspectFill'
                      />
                      <View className={styles.courseInfo}>
                        <Text className={styles.courseName}>{review.course.name}</Text>
                        <View className={styles.courseMeta}>
                          <View
                            className={classnames(
                              styles.courseTypeTag,
                              courseTypeClassMap[review.course.courseType]
                            )}
                          >
                            {review.course.courseType}
                          </View>
                          <Text className={styles.classDate}>
                            {review.course.classDate} · {review.course.teacherName}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className={styles.ratingSection}>
                      <View style={{ display: 'flex', alignItems: 'center' }}>
                        {renderStars(review.rating)}
                        <Text className={styles.ratingText}>
                          {ratingTextMap[review.rating]}
                        </Text>
                      </View>
                      <Text className={styles.reviewTime}>
                        {formatReviewTime(review.createTime)}
                      </Text>
                    </View>

                    {review.recommendTags.length > 0 && (
                      <View className={styles.tagsSection}>
                        {review.recommendTags.map(tag => (
                          <View key={tag} className={styles.recommendTag}>
                            {tag}
                          </View>
                        ))}
                      </View>
                    )}

                    <View className={styles.contentSection}>
                      <Text
                        className={classnames(
                          styles.reviewContent,
                          longContent && !expanded && styles.collapsed
                        )}
                      >
                        {review.content}
                      </Text>
                      {longContent && (
                        <View
                          className={styles.expandBtn}
                          onClick={() => handleToggleExpand(review.id)}
                        >
                          <Text>{expanded ? '收起' : '展开全文'}</Text>
                          <Text style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            ▾
                          </Text>
                        </View>
                      )}
                    </View>

                    {review.images.length > 0 && (
                      <View className={styles.imagesSection}>
                        <ScrollView className={styles.imageScroll} scrollX enhanced showScrollbar={false}>
                          {review.images.map((img, idx) => (
                            <Image
                              key={idx}
                              className={styles.imageItem}
                              src={img}
                              mode='aspectFill'
                              onClick={() => handlePreviewImage(review.images, img)}
                            />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    <View className={styles.actionsSection}>
                      <View
                        className={styles.actionBtn}
                        onClick={() => openEditModal(review)}
                      >
                        ✏️ 编辑评价
                      </View>
                      <View
                        className={classnames(styles.actionBtn, styles.deleteBtn)}
                        onClick={() => openDeleteDialog(review)}
                      >
                        🗑️ 删除评价
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={styles.emptyWrapper}>
              <EmptyState
                icon='💬'
                title='暂无评价'
                description='您还没有对任何课程进行评价，上完课后记得来评价哦~'
                actionText='去浏览课程'
                onAction={handleGoCourses}
              />
            </View>
          )
        )}
      </ScrollView>

      {renderPublishModal()}

      {editingReview && (
        <View className={styles.modalOverlay} onClick={closeEditModal}>
          <View className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>编辑评价</Text>
              <View className={styles.modalClose} onClick={closeEditModal}>✕</View>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              <View className={styles.formSection}>
                <Text className={styles.formLabel}>课程评分</Text>
                <View className={styles.starRating}>
                  {renderStars(editForm.rating, true, handleRatingChange)}
                  <Text className={styles.ratingScore}>
                    {editForm.rating} 分
                  </Text>
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
                        editForm.recommendTags.includes(tag) && styles.selected
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
                  value={editForm.content}
                  onInput={handleContentChange}
                  maxlength={500}
                  autoHeight
                />
                <Text className={styles.textCount}>
                  {editForm.content.length}/500
                </Text>
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>上传图片（最多9张）</Text>
                <View className={styles.imageUploader}>
                  {editForm.images.map((img, idx) => (
                    <View key={idx} className={styles.uploadItem}>
                      <Image
                        className={styles.uploadImage}
                        src={img}
                        mode='aspectFill'
                        onClick={() => handlePreviewImage(editForm.images, img)}
                      />
                      <View
                        className={styles.deleteImageBtn}
                        onClick={() => handleRemoveImage(idx)}
                      >
                        ✕
                      </View>
                    </View>
                  ))}
                  {editForm.images.length < 9 && (
                    <View className={styles.uploadBtn} onClick={handleChooseImage}>
                      <Text className={styles.uploadIcon}>＋</Text>
                      <Text className={styles.uploadText}>{editForm.images.length}/9</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            <View className={styles.modalFooter}>
              <View className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={closeEditModal}>
                取消
              </View>
              <View className={classnames(styles.modalBtn, styles.confirmBtn)} onClick={handleSubmitEdit}>
                保存修改
              </View>
            </View>
          </View>
        </View>
      )}

      {deleteTarget && (
        <View className={styles.modalOverlay} onClick={closeDeleteDialog}>
          <View className={styles.modalContainer} style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <View className={styles.dialogContent}>
              <View className={styles.dialogIcon}>⚠️</View>
              <Text className={styles.dialogText}>确定要删除这条评价吗？</Text>
              <Text className={styles.dialogSubtext}>删除后将无法恢复，请谨慎操作</Text>
            </View>
            <View className={styles.modalFooter}>
              <View className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={closeDeleteDialog}>
                取消
              </View>
              <View className={classnames(styles.modalBtn, styles.dangerBtn)} onClick={handleConfirmDelete}>
                确认删除
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MyReviewsPage;
