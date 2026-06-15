import { Order, UserCoupon } from '@/types';
import { courseList } from './courses';
import { calculateDiscount } from './coupons';

const generateOrderNo = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `YO${timestamp}${random}`;
};

const generateVerifyCode = () => {
  return Math.random().toString().substring(2, 8);
};

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNo: 'YO20260610123456ABC123',
    courseId: '1',
    course: courseList[0],
    bookingInfo: {
      name: '张小雨',
      phone: '138****5678',
      gender: '女',
      birthday: '1995-06-15',
      remark: '第一次体验，希望老师多多关照'
    },
    status: 'confirmed',
    createTime: '2026-06-10 14:30:00',
    verifyCode: '123456',
    isVerified: false,
    originalPrice: 199,
    discountAmount: 0,
    finalPrice: 199
  },
  {
    id: '2',
    orderNo: 'YO20260608102233DEF456',
    courseId: '2',
    course: courseList[1],
    bookingInfo: {
      name: '张小雨',
      phone: '138****5678',
      gender: '女',
      birthday: '1995-06-15',
      remark: ''
    },
    status: 'completed',
    createTime: '2026-06-08 10:22:33',
    verifyCode: '789012',
    isVerified: true,
    originalPrice: 259,
    discountAmount: 30,
    finalPrice: 229,
    couponId: 'coupon_002',
    couponName: '会员日专享券',
    discountType: 'cash'
  },
  {
    id: '3',
    orderNo: 'YO20260605161822GHI789',
    courseId: '3',
    course: courseList[2],
    bookingInfo: {
      name: '张小雨',
      phone: '138****5678',
      gender: '女',
      birthday: '1995-06-15',
      remark: ''
    },
    status: 'cancelled',
    createTime: '2026-06-05 16:18:22',
    verifyCode: '345678',
    isVerified: false,
    cancelReason: '个人时间安排冲突',
    originalPrice: 199,
    discountAmount: 50,
    finalPrice: 149,
    couponId: 'coupon_001',
    couponName: '新人专享立减券',
    discountType: 'cash'
  },
  {
    id: '4',
    orderNo: 'YO20260612091522GHI001',
    courseId: '11',
    course: courseList[10],
    bookingInfo: {
      name: '张小雨',
      phone: '138****5678',
      gender: '女',
      birthday: '1995-06-15',
      remark: ''
    },
    status: 'completed',
    createTime: '2026-06-11 09:15:22',
    verifyCode: '111222',
    isVerified: true,
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0
  },
  {
    id: '5',
    orderNo: 'YO20260613142205JKL002',
    courseId: '12',
    course: courseList[11],
    bookingInfo: {
      name: '张小雨',
      phone: '138****5678',
      gender: '女',
      birthday: '1995-06-15',
      remark: '请帮忙安排靠前的位置'
    },
    status: 'completed',
    createTime: '2026-06-12 14:22:05',
    verifyCode: '333444',
    isVerified: true,
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0
  },
  {
    id: '6',
    orderNo: 'YO20260614151833MNO003',
    courseId: '13',
    course: courseList[12],
    bookingInfo: {
      name: '张小雨',
      phone: '138****5678',
      gender: '女',
      birthday: '1995-06-15',
      remark: '第一次尝试空中瑜伽'
    },
    status: 'completed',
    createTime: '2026-06-13 15:18:33',
    verifyCode: '555666',
    isVerified: true,
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0
  }
];

let ordersList = [...mockOrders];

export const getOrders = (status?: string): Order[] => {
  if (!status || status === 'all') {
    return ordersList;
  }
  return ordersList.filter(order => order.status === status);
};

export const getOrderById = (id: string): Order | undefined => {
  return ordersList.find(order => order.id === id);
};

export const createOrder = (
  courseId: string,
  bookingInfo: Order['bookingInfo'],
  selectedCoupon?: UserCoupon | null
): Order => {
  const course = courseList.find(c => c.id === courseId)!;
  
  const originalPrice = course.price;
  const discountAmount = selectedCoupon
    ? calculateDiscount(selectedCoupon.coupon, originalPrice)
    : 0;
  const finalPrice = Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);

  const newOrder: Order = {
    id: Date.now().toString(),
    orderNo: generateOrderNo(),
    courseId,
    course,
    bookingInfo,
    status: 'confirmed',
    createTime: new Date().toLocaleString('zh-CN'),
    verifyCode: generateVerifyCode(),
    isVerified: false,
    originalPrice,
    discountAmount,
    finalPrice
  };

  if (selectedCoupon && discountAmount > 0) {
    newOrder.couponId = selectedCoupon.couponId;
    newOrder.couponName = selectedCoupon.coupon.name;
    newOrder.discountType = selectedCoupon.coupon.type === 'cash' ? 'cash' : 'direct';
  }

  ordersList.unshift(newOrder);
  
  const courseIndex = courseList.findIndex(c => c.id === courseId);
  if (courseIndex !== -1 && courseList[courseIndex].remainingSlots > 0) {
    courseList[courseIndex].remainingSlots--;
  }
  
  return newOrder;
};

export const cancelOrder = (orderId: string, reason: string): boolean => {
  const orderIndex = ordersList.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    ordersList[orderIndex].status = 'cancelled';
    ordersList[orderIndex].cancelReason = reason;
    
    const course = ordersList[orderIndex].course;
    const courseIndex = courseList.findIndex(c => c.id === course.id);
    if (courseIndex !== -1) {
      courseList[courseIndex].remainingSlots++;
    }
    
    return true;
  }
  return false;
};

export const verifyOrder = (orderId: string): boolean => {
  const orderIndex = ordersList.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    ordersList[orderIndex].isVerified = true;
    ordersList[orderIndex].status = 'completed';
    return true;
  }
  return false;
};
