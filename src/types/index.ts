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
