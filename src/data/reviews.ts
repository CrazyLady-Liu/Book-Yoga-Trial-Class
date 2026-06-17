import { Review, ReviewCourseInfo, CourseType, RecommendTag } from '@/types';
import { courseList } from './courses';

const getCourseTypeFromTags = (tags: string[]): CourseType => {
  if (tags.includes('私教课')) return '私教课';
  if (tags.includes('团课')) return '团课';
  return '体验课';
};

const buildCourseInfo = (courseIndex: number, overrideType?: CourseType): ReviewCourseInfo => {
  const course = courseList[courseIndex];
  return {
    id: course.id,
    name: course.name,
    coverImage: course.coverImage,
    courseType: overrideType || getCourseTypeFromTags(course.tags),
    classDate: course.date,
    teacherName: course.teacherName
  };
};

export const mockReviews: Review[] = [
  {
    id: 'review_001',
    userId: 'user_001',
    orderId: '2',
    course: {
      id: '2',
      name: '零基础流瑜伽小班课',
      coverImage: 'https://picsum.photos/id/1018/750/500',
      courseType: '体验课',
      classDate: '2026-06-08',
      teacherName: '王明远'
    },
    rating: 5,
    recommendTags: ['老师专业', '环境干净', '节奏舒缓', '氛围很好'],
    content: '第一次上流瑜伽体验课，比想象中好太多了！王老师非常专业，每个体式都会细心指导，对零基础的我特别有耐心。教室环境很干净，音乐也很舒缓，整个过程身心都很放松。原本担心自己柔韧性不好跟不上，结果老师会根据每个人的情况调整难度，真的很贴心。课程结束后整个人都舒展了，肩颈的酸痛缓解了不少，强烈推荐给想要尝试瑜伽的朋友们！已经预约了下周的课，期待继续练习~',
    images: [
      'https://picsum.photos/id/1015/600/600',
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1036/600/600',
      'https://picsum.photos/id/1039/600/600',
      'https://picsum.photos/id/1044/600/600'
    ],
    createTime: '2026-06-10 15:30:00',
    updateTime: '2026-06-10 15:30:00'
  },
  {
    id: 'review_002',
    userId: 'user_001',
    orderId: '4',
    course: buildCourseInfo(10, '团课'),
    rating: 5,
    recommendTags: ['老师专业', '收获满满', '值得推荐'],
    content: '李老师的哈他瑜伽基础课非常适合新手，体式讲解很详细，呼吸配合也讲得很清楚。一个半小时的课程下来，身体暖暖的，很舒服。',
    images: [
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1018/600/600'
    ],
    createTime: '2026-06-12 18:22:00',
    updateTime: '2026-06-12 18:22:00'
  },
  {
    id: 'review_003',
    userId: 'user_001',
    orderId: '5',
    course: buildCourseInfo(11, '体验课'),
    rating: 4,
    recommendTags: ['节奏舒缓', '氛围很好', '设施完善'],
    content: '流瑜伽的节奏刚刚好，不会太快也不会太慢。中间有几个体式做不到位，老师都过来帮忙调整了。唯一有点小遗憾是教室稍微有点小，人多的时候感觉有点挤。总体还是很满意的，会继续来。',
    images: [],
    createTime: '2026-06-13 20:15:00',
    updateTime: '2026-06-14 09:30:00'
  },
  {
    id: 'review_004',
    userId: 'user_001',
    orderId: '6',
    course: buildCourseInfo(12, '私教课'),
    rating: 5,
    recommendTags: ['老师专业', '环境干净', '性价比高', '收获满满', '值得推荐'],
    content: '第一次尝试空中瑜伽私教课，体验感满分！一对一的教学真的很有针对性，周老师根据我的身体情况设计了专属的课程内容。吊床的感觉很奇妙，在上面做拉伸比在垫子上深入很多，尤其是脊柱的放松效果特别好。本来还有点紧张害怕，老师一直在旁边保护和引导，很快就放松下来了。一个小时下来，感觉整个人都轻盈了，颈椎也舒服了很多。强烈推荐大家尝试空中瑜伽，真的是不一样的体验！私教课虽然价格稍高，但真的物超所值，准备办个私教卡长期练习了。',
    images: [
      'https://picsum.photos/id/1015/600/600',
      'https://picsum.photos/id/1036/600/600',
      'https://picsum.photos/id/1044/600/600',
      'https://picsum.photos/id/1039/600/600',
      'https://picsum.photos/id/1018/600/600',
      'https://picsum.photos/id/1025/600/600'
    ],
    createTime: '2026-06-15 10:45:00',
    updateTime: '2026-06-15 10:45:00'
  }
];

let reviewsList = [...mockReviews];

export const getUserReviews = (userId: string): Review[] => {
  return reviewsList
    .filter(review => review.userId === userId)
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
};

export const getReviewById = (id: string): Review | undefined => {
  return reviewsList.find(review => review.id === id);
};

export const createReview = (
  data: Omit<Review, 'id' | 'createTime' | 'updateTime'>
): Review => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newReview: Review = {
    ...data,
    id: 'review_' + Date.now().toString(36),
    createTime: now,
    updateTime: now
  };
  reviewsList.unshift(newReview);
  return newReview;
};

export const updateReview = (
  id: string,
  data: Partial<Pick<Review, 'rating' | 'recommendTags' | 'content' | 'images'>>
): Review | null => {
  const index = reviewsList.findIndex(review => review.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  reviewsList[index] = {
    ...reviewsList[index],
    ...data,
    updateTime: now
  };
  return reviewsList[index];
};

export const deleteReview = (id: string): boolean => {
  const index = reviewsList.findIndex(review => review.id === id);
  if (index === -1) return false;
  reviewsList.splice(index, 1);
  return true;
};

export const formatReviewTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};
