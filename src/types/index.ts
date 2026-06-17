export interface UserInfo {
  id: string;
  avatarUrl: string;
  nickName: string;
  phone: string;
  gender: string;
  birthday: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  teacherName: string;
  teacherAvatar: string;
  teacherIntro: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  address: string;
  location: string;
  totalSlots: number;
  remainingSlots: number;
  price: number;
  originalPrice: number;
  tags: string[];
  level: '初级' | '中级' | '高级';
  isHot: boolean;
  isNew: boolean;
  isOffline: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface BookingInfo {
  name: string;
  phone: string;
  gender: string;
  birthday: string;
  remark: string;
}

export interface Order {
  id: string;
  orderNo: string;
  courseId: string;
  course: Course;
  bookingInfo: BookingInfo;
  status: OrderStatus;
  createTime: string;
  verifyCode: string;
  isVerified: boolean;
  cancelReason?: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  couponId?: string;
  couponName?: string;
  discountType?: 'cash' | 'direct';
}

export type TabType = 'home' | 'courses' | 'orders' | 'mine';

export interface TabItem {
  key: TabType;
  title: string;
  pagePath: string;
}

export type CouponType = 'discount' | 'cash' | 'free';
export type CouponStatus = 'available' | 'used' | 'expired';
export type CouponScope = 'all' | 'course' | 'category';

export interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount: number;
  discount?: number;
  description: string;
  scope: CouponScope;
  courseIds?: string[];
  categories?: string[];
  startTime: string;
  endTime: string;
  stock: number;
  received: number;
  limitPerUser: number;
  isActive: boolean;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  coupon: Coupon;
  userId: string;
  status: CouponStatus;
  receiveTime: string;
  usedTime?: string;
  orderId?: string;
}

export type CourseType = '私教课' | '团课' | '体验课';

export const RECOMMEND_TAGS = [
  '老师专业',
  '环境干净',
  '节奏舒缓',
  '氛围很好',
  '收获满满',
  '值得推荐',
  '性价比高',
  '设施完善'
] as const;

export type RecommendTag = typeof RECOMMEND_TAGS[number];

export interface ReviewCourseInfo {
  id: string;
  name: string;
  coverImage: string;
  courseType: CourseType;
  classDate: string;
  teacherName: string;
}

export interface Review {
  id: string;
  userId: string;
  orderId: string;
  course: ReviewCourseInfo;
  rating: 1 | 2 | 3 | 4 | 5;
  recommendTags: RecommendTag[];
  content: string;
  images: string[];
  createTime: string;
  updateTime: string;
}
