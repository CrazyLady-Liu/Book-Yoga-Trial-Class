import { Review, ReviewCourseInfo, CourseType, Order } from '@/types';
import { courseList } from './courses';
import { getOrders as getAllOrders } from './orders';
import { receiveCoupon } from './coupons';

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
    id: 'review_005',
    userId: 'user_001',
    orderId: 'order_007',
    course: {
      id: '7',
      name: '阴瑜伽放松课',
      coverImage: 'https://picsum.photos/id/1036/750/500',
      courseType: '团课',
      classDate: '2026-06-03',
      teacherName: '陈雨柔'
    },
    rating: 5,
    recommendTags: ['老师专业', '环境干净', '节奏舒缓', '氛围很好', '收获满满', '值得推荐'],
    content: '陈老师的阴瑜伽真的是我的治愈神器！作为一个长期加班的程序员，肩颈和腰一直都很僵硬，上完这节课感觉全身都松开了。每个体式保持 3-5 分钟，老师会用很温柔的声音引导我们冥想，整个教室的氛围特别安宁，配合香薰和柔和的灯光，好几次我都差点睡着了。印象最深的是蝴蝶式，老师过来帮我轻轻按压髋部，那种酸胀之后的放松感真的无法用语言形容。课后老师还给每个人倒了一杯温热的柠檬水，细节满分。已经把阴瑜伽列为我的每周必修课了，强烈推荐给所有压力大的上班族！',
    images: [
      'https://picsum.photos/id/1036/600/600',
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1044/600/600'
    ],
    createTime: '2026-06-04 21:30:00',
    updateTime: '2026-06-04 21:30:00'
  },
  {
    id: 'review_006',
    userId: 'user_001',
    orderId: 'order_008',
    course: {
      id: '10',
      name: '肩颈理疗瑜伽',
      coverImage: 'https://picsum.photos/id/1039/750/500',
      courseType: '私教课',
      classDate: '2026-06-01',
      teacherName: '刘美琪'
    },
    rating: 5,
    recommendTags: ['老师专业', '收获满满', '值得推荐', '性价比高'],
    content: '去医院拍了片，颈椎曲度变直，医生建议多做理疗运动。朋友推荐来上刘老师的私教课，真的太惊喜了！刘老师本身就是运动康复师出身，课前先给我做了详细的体态评估，指出我不仅颈椎有问题，骨盆也有点前倾。课程针对性特别强，不是那种千篇一律的瑜伽课，而是针对我的问题设计的动作。一节课下来，我那富贵包旁边紧绷了好几年的肌肉居然变软了！转头的时候那种卡卡的感觉也消失了。老师还教了我几个在家就能做的小动作，让我每天坚持 10 分钟。现在已经上了 3 节课，脖子酸疼的症状改善了 70%，真的太感谢刘老师了！',
    images: [
      'https://picsum.photos/id/1039/600/600',
      'https://picsum.photos/id/1015/600/600',
      'https://picsum.photos/id/1018/600/600',
      'https://picsum.photos/id/1025/600/600'
    ],
    createTime: '2026-06-02 19:15:00',
    updateTime: '2026-06-03 08:42:00'
  },
  {
    id: 'review_007',
    userId: 'user_001',
    orderId: 'order_009',
    course: {
      id: '8',
      name: '热瑜伽体验',
      coverImage: 'https://picsum.photos/id/1018/750/500',
      courseType: '体验课',
      classDate: '2026-05-28',
      teacherName: '王明远'
    },
    rating: 4,
    recommendTags: ['老师专业', '氛围很好', '收获满满'],
    content: '第一次尝试热瑜伽，38 度的教室，进去 5 分钟就开始暴汗。王老师的节奏把控得很好，虽然热但不会让人觉得喘不过气。做完一整套动作下来，感觉全身的毛孔都打开了，皮肤滑溜溜的，体重居然轻了 1 斤多！唯一扣分的地方是中途有点头晕，可能自己不太适应高温，建议新手第一次可以多带几瓶水，中间如果觉得不舒服及时停下来休息。整体还是很推荐的，喜欢出汗排毒的朋友一定要试试！',
    images: [
      'https://picsum.photos/id/1018/600/600'
    ],
    createTime: '2026-05-28 20:00:00',
    updateTime: '2026-05-28 20:00:00'
  },
  {
    id: 'review_008',
    userId: 'user_001',
    orderId: 'order_010',
    course: {
      id: '5',
      name: '普拉提核心训练',
      coverImage: 'https://picsum.photos/id/1044/750/500',
      courseType: '团课',
      classDate: '2026-05-25',
      teacherName: '刘美琪'
    },
    rating: 5,
    recommendTags: ['老师专业', '环境干净', '设施完善', '值得推荐'],
    content: '产后三个月开始来恢复训练，对比了好几家最终选择这里。刘老师特别专业，知道我是产后修复，全程都特别关注我的腹直肌和盆底肌情况，不会让我做那些不安全的动作。普拉提核心床真的很神奇，看起来动作很温和，但是第二天腹部和臀部的酸爽感骗不了人。上了 6 节课，腰围小了 4 厘米，肚子明显收回去了，连我老公都说我体态比生娃之前还好！最开心的是漏尿的问题改善了很多，再也不敢打喷嚏了。会一直坚持下去的！',
    images: [
      'https://picsum.photos/id/1044/600/600',
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1015/600/600',
      'https://picsum.photos/id/1036/600/600',
      'https://picsum.photos/id/1039/600/600',
      'https://picsum.photos/id/1018/600/600',
      'https://picsum.photos/id/1025/600/600'
    ],
    createTime: '2026-05-26 14:20:00',
    updateTime: '2026-05-26 14:20:00'
  },
  {
    id: 'review_009',
    userId: 'user_001',
    orderId: 'order_011',
    course: {
      id: '4',
      name: '阿斯汤加瑜伽',
      coverImage: 'https://picsum.photos/id/1039/750/500',
      courseType: '团课',
      classDate: '2026-05-22',
      teacherName: '张浩然'
    },
    rating: 3,
    recommendTags: ['老师专业'],
    content: '老师确实很专业，体式做得非常漂亮，看得出来功底很深。但是阿斯汤加对我来说难度真的太大了，固定的体式序列节奏也比较快，我这种初级学员跟不上。一节课下来大部分时间都在看别人做，自己只能勉强摆个样子。建议馆主可以开个阿斯汤加入门班，或者课前给新生一些基础指导。体验一次就够了，还是回去练我的哈他吧。',
    images: [],
    createTime: '2026-05-22 10:00:00',
    updateTime: '2026-05-22 10:00:00'
  },
  {
    id: 'review_010',
    userId: 'user_001',
    orderId: 'order_012',
    course: {
      id: '9',
      name: '亲子瑜伽课',
      coverImage: 'https://picsum.photos/id/1036/750/500',
      courseType: '私教课',
      classDate: '2026-05-20',
      teacherName: '李静雅'
    },
    rating: 5,
    recommendTags: ['老师专业', '环境干净', '氛围很好', '收获满满', '值得推荐', '性价比高', '节奏舒缓', '设施完善'],
    content: '周末带 5 岁的女儿来体验亲子瑜伽，本来担心她坐不住，结果李老师太会跟小朋友互动了，用讲故事做游戏的方式把瑜伽体式融入进去，女儿全程参与超开心！最后有个互相拥抱说感谢的环节，女儿抱着我说「妈妈我爱你」的时候，我眼泪都差点掉下来。特别好的亲子时光，比带孩子去游乐场有意义多了。教室特别干净，地上铺的垫子很软，孩子光着脚跑完全不用担心。已经办了季卡，以后每周都来！',
    images: [
      'https://picsum.photos/id/1036/600/600',
      'https://picsum.photos/id/1015/600/600',
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1044/600/600',
      'https://picsum.photos/id/1018/600/600',
      'https://picsum.photos/id/1039/600/600',
      'https://picsum.photos/id/1044/600/600',
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1015/600/600'
    ],
    createTime: '2026-05-20 17:45:00',
    updateTime: '2026-05-20 17:45:00'
  },
  {
    id: 'review_011',
    userId: 'user_001',
    orderId: 'order_013',
    course: {
      id: '7',
      name: '瑜伽冥想课',
      coverImage: 'https://picsum.photos/id/1025/750/500',
      courseType: '体验课',
      classDate: '2026-05-15',
      teacherName: '陈雨柔'
    },
    rating: 5,
    recommendTags: ['节奏舒缓', '氛围很好', '收获满满'],
    content: '最近失眠严重，朋友推荐来试试冥想课。陈老师的声音有种魔力，闭上眼睛跟着她的引导走，脑子里那些乱七八糟的想法慢慢就不见了。课程中间有一段颂钵的环节，钵声嗡鸣的时候，感觉整个人的脑电波都被抚平了，特别神奇。上完课当天晚上是我最近两个月睡得最好的一觉，没有做梦，一觉到天亮。准备每周都来一次，给心灵充充电。',
    images: [
      'https://picsum.photos/id/1025/600/600',
      'https://picsum.photos/id/1036/600/600'
    ],
    createTime: '2026-05-16 09:30:00',
    updateTime: '2026-05-16 09:30:00'
  },
  {
    id: 'review_012',
    userId: 'user_001',
    orderId: 'order_014',
    course: {
      id: '6',
      name: '空中瑜伽体验',
      coverImage: 'https://picsum.photos/id/1015/750/500',
      courseType: '团课',
      classDate: '2026-05-10',
      teacherName: '周雪莹'
    },
    rating: 4,
    recommendTags: ['老师专业', '氛围很好', '设施完善'],
    content: '被小红书种草来的，网红吊床拍照真的超出片！周老师很厉害，可以把人包成一个个「蚕茧」吊在半空。第一次做倒立的时候很害怕，老师帮我托了一下就敢了，倒过来的时候看整个教室都是倒的，感觉很新奇。扣一分是因为团课人有点多，吊床之间距离比较近，做动作的时候差点打到旁边的小姐姐。建议可以限制一下人数，或者来上私教课体验会更好。',
    images: [
      'https://picsum.photos/id/1015/600/600',
      'https://picsum.photos/id/1044/600/600',
      'https://picsum.photos/id/1039/600/600',
      'https://picsum.photos/id/1018/600/600'
    ],
    createTime: '2026-05-11 11:20:00',
    updateTime: '2026-05-11 11:20:00'
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

export const REVIEW_REWARD_COUPON_ID = 'coupon_010';

export const isOrderReviewed = (orderId: string): boolean => {
  return reviewsList.some(review => review.orderId === orderId);
};

export const getPendingReviewOrders = (userId: string): Order[] => {
  const allOrders = getAllOrders();
  const userReviews = getUserReviews(userId);
  const reviewedOrderIds = new Set(userReviews.map(r => r.orderId));

  return allOrders
    .filter(order => 
      order.status === 'completed' && 
      order.isVerified && 
      !reviewedOrderIds.has(order.id)
    )
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
};

export const createReviewWithReward = (
  data: Omit<Review, 'id' | 'createTime' | 'updateTime'>
): { review: Review; couponReward?: any } => {
  const review = createReview(data);
  
  const result = receiveCoupon(data.userId, REVIEW_REWARD_COUPON_ID);
  
  return {
    review,
    couponReward: result.success ? result.userCoupon : null
  };
};
