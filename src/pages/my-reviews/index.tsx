import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Review, RecommendTag, RECOMMEND_TAGS, CourseType } from '@/types';
import { getUserReviews, updateReview, deleteReview, formatReviewTime } from '@/data/reviews';
import { useUser } from '@/store/UserContext';
import { showToast, showModal, navigateTo } from '@/utils';
import EmptyState from '@/components/EmptyState';

const COLLAPSED_MAX_LENGTH = 80;

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

const MyReviewsPage: React.FC = () => {
  const { userInfo, isLoggedIn } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    rating: 5,
    recommendTags: [],
    content: '',
    images: []
  });
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const loadReviews = useCallback(() => {
    if (!isLoggedIn || !userInfo) {
      setReviews([]);
      return;
    }
    const list = getUserReviews(userInfo.id);
    setReviews(list);
  }, [isLoggedIn, userInfo]);

  useDidShow(() => {
    loadReviews();
  });

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    loadReviews();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      showToast('刷新成功', 'success');
    }, 1000);
  });

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
      loadReviews();
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
        loadReviews();
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
        {reviews.length > 0 ? (
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
        )}
      </ScrollView>

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
                  <Text style={{ fontSize: 28, color: '#FFB800', fontWeight: 500 }}>
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
                <Text style={{ fontSize: 22, color: '#9CA3AF', marginTop: 8, textAlign: 'right', display: 'block' }}>
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
