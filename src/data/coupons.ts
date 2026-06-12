import { Coupon, UserCoupon, CouponStatus } from '@/types';
import { generateId, getStorage, setStorage } from '@/utils';

const COUPONS_STORAGE_KEY = 'available_coupons';
const USER_COUPONS_STORAGE_KEY = 'user_coupons';

const mockCoupons: Coupon[] = [
  {
    id: 'coupon_001',
    name: '新人专享立减券',
    type: 'cash',
    value: 50,
    minAmount: 99,
    description: '新人专享，全场通用',
    scope: 'all',
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 1000,
    received: 356,
    limitPerUser: 1,
    isActive: true
  },
  {
    id: 'coupon_002',
    name: '全场通用折扣券',
    type: 'discount',
    value: 0,
    minAmount: 0,
    discount: 0.8,
    description: '全场课程8折优惠',
    scope: 'all',
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 500,
    received: 234,
    limitPerUser: 2,
    isActive: true
  },
  {
    id: 'coupon_003',
    name: '免费体验券',
    type: 'free',
    value: 0,
    minAmount: 0,
    description: '免费体验任意一节体验课',
    scope: 'category',
    categories: ['体验课'],
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 2000,
    received: 892,
    limitPerUser: 1,
    isActive: true
  },
  {
    id: 'coupon_004',
    name: '会员日专享券',
    type: 'cash',
    value: 30,
    minAmount: 199,
    description: '会员日专享，满199减30',
    scope: 'all',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 800,
    received: 456,
    limitPerUser: 3,
    isActive: true
  },
  {
    id: 'coupon_005',
    name: '暑期特惠券',
    type: 'cash',
    value: 100,
    minAmount: 499,
    description: '暑期特惠，满499减100',
    scope: 'all',
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 300,
    received: 178,
    limitPerUser: 2,
    isActive: true
  },
  {
    id: 'coupon_006',
    name: '小班课专享券',
    type: 'discount',
    value: 0,
    minAmount: 0,
    discount: 0.7,
    description: '小班课专享7折优惠',
    scope: 'category',
    categories: ['小班课'],
    startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 400,
    received: 156,
    limitPerUser: 1,
    isActive: true
  }
];

const mockUserCoupons: UserCoupon[] = [
  {
    id: 'user_coupon_001',
    couponId: 'coupon_001',
    coupon: mockCoupons[0],
    userId: 'user_123',
    status: 'available',
    receiveTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user_coupon_002',
    couponId: 'coupon_003',
    coupon: mockCoupons[2],
    userId: 'user_123',
    status: 'available',
    receiveTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'user_coupon_003',
    couponId: 'coupon_002',
    coupon: mockCoupons[1],
    userId: 'user_123',
    status: 'used',
    receiveTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    usedTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    orderId: 'order_12345'
  },
  {
    id: 'user_coupon_004',
    couponId: 'coupon_004',
    coupon: mockCoupons[3],
    userId: 'user_123',
    status: 'expired',
    receiveTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const initCoupons = () => {
  const stored = getStorage<Coupon[]>(COUPONS_STORAGE_KEY);
  if (!stored) {
    setStorage(COUPONS_STORAGE_KEY, mockCoupons);
  }
};

const initUserCoupons = () => {
  const stored = getStorage<UserCoupon[]>(USER_COUPONS_STORAGE_KEY);
  if (!stored) {
    setStorage(USER_COUPONS_STORAGE_KEY, mockUserCoupons);
  }
};

initCoupons();
initUserCoupons();

export const getAvailableCoupons = (): Coupon[] => {
  const coupons = getStorage<Coupon[]>(COUPONS_STORAGE_KEY) || [];
  const now = new Date();
  return coupons.filter(c => 
    c.isActive && 
    c.stock > 0 && 
    new Date(c.startTime) <= now && 
    new Date(c.endTime) >= now
  );
};

const normalizeUserCouponStatus = (uc: UserCoupon): UserCoupon => {
  const now = new Date();
  if (uc.status === 'available' && new Date(uc.coupon.endTime) < now) {
    return { ...uc, status: 'expired' as CouponStatus };
  }
  return uc;
};

export interface UserCouponsResult {
  list: UserCoupon[];
  stats: {
    available: number;
    used: number;
    expired: number;
  };
  total: number;
  page: number;
  pageSize: number;
}

export const getUserCoupons = (
  userId: string,
  status?: CouponStatus,
  page: number = 1,
  pageSize: number = 20
): UserCouponsResult => {
  const userCoupons = getStorage<UserCoupon[]>(USER_COUPONS_STORAGE_KEY) || [];
  const allForUser = userCoupons
    .filter(uc => uc.userId === userId)
    .map(normalizeUserCouponStatus);

  const allAvailable = allForUser.filter(uc => uc.status === 'available');
  const allUsed = allForUser.filter(uc => uc.status === 'used');
  const allExpired = allForUser.filter(uc => uc.status === 'expired');

  let filtered = allForUser;
  if (status) {
    filtered = allForUser.filter(uc => uc.status === status);
  }

  filtered = filtered.sort(
    (a, b) => new Date(b.receiveTime).getTime() - new Date(a.receiveTime).getTime()
  );

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const list = filtered.slice(start, end);

  return {
    list,
    stats: {
      available: allAvailable.length,
      used: allUsed.length,
      expired: allExpired.length
    },
    total: filtered.length,
    page,
    pageSize
  };
};

export const receiveCoupon = (userId: string, couponId: string): UserCoupon | null => {
  const coupons = getStorage<Coupon[]>(COUPONS_STORAGE_KEY) || [];
  const userCoupons = getStorage<UserCoupon[]>(USER_COUPONS_STORAGE_KEY) || [];
  
  const coupon = coupons.find(c => c.id === couponId);
  if (!coupon || !coupon.isActive || coupon.stock <= 0) {
    return null;
  }
  
  const userReceivedCount = userCoupons.filter(
    uc => uc.userId === userId && uc.couponId === couponId
  ).length;
  
  if (userReceivedCount >= coupon.limitPerUser) {
    return null;
  }
  
  coupon.stock -= 1;
  coupon.received += 1;
  setStorage(COUPONS_STORAGE_KEY, coupons);
  
  const userCoupon: UserCoupon = {
    id: 'uc_' + generateId(),
    couponId: coupon.id,
    coupon: { ...coupon },
    userId,
    status: 'available',
    receiveTime: new Date().toISOString()
  };
  
  userCoupons.push(userCoupon);
  setStorage(USER_COUPONS_STORAGE_KEY, userCoupons);
  
  return userCoupon;
};

export const useCoupon = (userCouponId: string, orderId: string): boolean => {
  const userCoupons = getStorage<UserCoupon[]>(USER_COUPONS_STORAGE_KEY) || [];
  const index = userCoupons.findIndex(uc => uc.id === userCouponId);
  
  if (index === -1 || userCoupons[index].status !== 'available') {
    return false;
  }
  
  userCoupons[index] = {
    ...userCoupons[index],
    status: 'used',
    usedTime: new Date().toISOString(),
    orderId
  };
  
  setStorage(USER_COUPONS_STORAGE_KEY, userCoupons);
  return true;
};

export const getApplicableCoupons = (userId: string, courseId: string, amount: number, courseCategories: string[] = []): UserCoupon[] => {
  const { list } = getUserCoupons(userId, 'available');
  const userCoupons = list;
  
  return userCoupons.filter(uc => {
    const coupon = uc.coupon;
    const now = new Date();
    
    if (new Date(coupon.startTime) > now || new Date(coupon.endTime) < now) {
      return false;
    }
    
    if (amount < coupon.minAmount) {
      return false;
    }
    
    if (coupon.scope === 'all') {
      return true;
    }
    
    if (coupon.scope === 'course' && coupon.courseIds?.includes(courseId)) {
      return true;
    }
    
    if (coupon.scope === 'category' && coupon.categories?.some(cat => courseCategories.includes(cat))) {
      return true;
    }
    
    return false;
  }).sort((a, b) => {
    const discountA = calculateDiscount(a.coupon, amount);
    const discountB = calculateDiscount(b.coupon, amount);
    return discountB - discountA;
  });
};

export const calculateDiscount = (coupon: Coupon, amount: number): number => {
  switch (coupon.type) {
    case 'cash':
      return Math.min(coupon.value, amount);
    case 'discount':
      return Math.round(amount * (1 - (coupon.discount || 1)) * 100) / 100;
    case 'free':
      return amount;
    default:
      return 0;
  }
};

export const getBestCoupon = (applicableCoupons: UserCoupon[], amount: number): UserCoupon | null => {
  if (applicableCoupons.length === 0) return null;
  return applicableCoupons.reduce((best, current) => {
    const bestDiscount = calculateDiscount(best.coupon, amount);
    const currentDiscount = calculateDiscount(current.coupon, amount);
    return currentDiscount > bestDiscount ? current : best;
  });
};
