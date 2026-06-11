import Taro from '@tarojs/taro';

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export const validatePhone = (phone: string): boolean => {
  const phoneReg = /^1[3-9]\d{9}$/;
  return phoneReg.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 20;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '待上课',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: '#FFB74D',
    confirmed: '#4CAF7C',
    completed: '#86909C',
    cancelled: '#C9CDD4'
  };
  return colorMap[status] || '#86909C';
};

export const showToast = (title: string, icon: 'success' | 'error' | 'none' = 'none', duration = 2000): void => {
  Taro.showToast({
    title,
    icon,
    duration
  });
};

export const showLoading = (title: string = '加载中...'): void => {
  Taro.showLoading({
    title,
    mask: true
  });
};

export const hideLoading = (): void => {
  Taro.hideLoading();
};

export const showModal = (title: string, content: string, options?: {
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}): Promise<boolean> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      confirmText: options?.confirmText || '确定',
      cancelText: options?.cancelText || '取消',
      showCancel: options?.showCancel !== false,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
};

export const navigateTo = (url: string): void => {
  Taro.navigateTo({ url });
};

export const navigateBack = (delta = 1): void => {
  Taro.navigateBack({ delta });
};

export const switchTab = (url: string): void => {
  Taro.switchTab({ url });
};

export const getStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const value = Taro.getStorageSync(key);
    return value || defaultValue || null;
  } catch (e) {
    console.error('[Utils] getStorage error:', e);
    return defaultValue || null;
  }
};

export const setStorage = (key: string, value: any): void => {
  try {
    Taro.setStorageSync(key, value);
  } catch (e) {
    console.error('[Utils] setStorage error:', e);
  }
};

export const removeStorage = (key: string): void => {
  try {
    Taro.removeStorageSync(key);
  } catch (e) {
    console.error('[Utils] removeStorage error:', e);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
